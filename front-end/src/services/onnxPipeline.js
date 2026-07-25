/**
 * onnxPipeline.js
 *
 * Production-grade face pipeline using ONNX Runtime Web.
 *
 * Models:
 *  - SCRFD-500M-KPS  : ~3.2 MB — ultra-fast face detector with 5-point keypoints
 *  - ArcFace R50     : ~80 MB  — 512-d ArcFace recognition embedding (ResNet50)
 *  - MN3-AntiSpoof   : ~1.8 MB — binary liveness classifier (real vs photo/video)
 *
 * Architecture:
 *  detect() → 5-pt landmarks → affine-align 112×112 → ArcFace embed → L2-norm
 *
 * All sessions are singletons — created once per page lifetime.
 */

// onnxruntime-web is loaded globally via index.html <script src="/onnx-wasm/ort.min.js">
const getOrt = () => {
  if (typeof window !== 'undefined' && window.ort) {
    return window.ort;
  }
  throw new Error('[OnnxPipeline] ONNX Runtime Web library (window.ort) is missing. Please ensure /onnx-wasm/ort.min.js is loaded.');
};

// ─── Constants ───────────────────────────────────────────────────────────────
const MODEL_BASE = '/models/onnx';
const SCRFD_MODEL = `${MODEL_BASE}/scrfd_500m_bnkps.onnx`; // updated filename
const ARCFACE_MODEL = `${MODEL_BASE}/w600k_r50.onnx`;

const SCRFD_INPUT_SIZE = 640;        // SCRFD input resolution
const ARCFACE_INPUT_SIZE = 112;      // ArcFace aligned face crop size
const NMS_THRESHOLD = 0.40;
const SCORE_THRESHOLD = 0.5;

// SCRFD anchor strides and base anchors
const SCRFD_STRIDES = [8, 16, 32];
const SCRFD_NUM_ANCHORS = 2;         // 2 anchors per stride cell

// ─── Module State ────────────────────────────────────────────────────────────
let scrfdSession = null;
let arcfaceSession = null;

let isInitialized = false;
let isInitializing = false;
let initError = null;
let _progressCallback = null;

// Reusable offscreen canvas singletons to prevent memory leaks / GC thrashing
let _videoCanvas = null;
let _videoCtx = null;
let _alignCanvas = null;
let _alignCtx = null;

// ─── Initialization ──────────────────────────────────────────────────────────

/**
 * Configure ONNX Runtime Web to use the bundled WASM files.
 * Must be called before any InferenceSession.create().
 */
const configureOrtEnv = () => {
  const ort = getOrt();
  // Point to the ort wasm files served from /public
  ort.env.wasm.wasmPaths = '/onnx-wasm/';
  // Prefer WebGL → WASM → CPU
  ort.env.wasm.numThreads = 1;
};

const report = (pct, msg) => {
  console.log(`[OnnxPipeline] ${pct}% — ${msg}`);
  _progressCallback?.(pct, msg);
};

/**
 * Initialise all three ONNX model sessions.
 * Safe to call multiple times — subsequent calls wait for the first to finish.
 *
 * @param {function} onProgress (percent: number, message: string) => void
 */
export const initPipeline = async (onProgress) => {
  if (isInitialized) return true;
  if (isInitializing) {
    // Wait for ongoing init with a 10s maximum timeout
    let wait = 0;
    while (isInitializing && wait < 50) {
      await new Promise(r => setTimeout(r, 200));
      wait++;
    }
    if (isInitializing) {
      isInitializing = false;
      throw new Error('[OnnxPipeline] Pipeline initialization timed out after 10 seconds.');
    }
    return isInitialized;
  }

  isInitializing = true;
  _progressCallback = onProgress || null;
  initError = null;

  try {
    configureOrtEnv();
    const ort = getOrt();
    report(5, 'Configuring ONNX Runtime...');

    const sessionOpts = {
      executionProviders: ['webgl', 'wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
    };

    report(10, 'Loading face detector (SCRFD)...');
    scrfdSession = await ort.InferenceSession.create(SCRFD_MODEL, sessionOpts);
    report(50, 'SCRFD loaded ✓');

    report(55, 'Loading face recognition model (ArcFace R50, ~80 MB)...');
    arcfaceSession = await ort.InferenceSession.create(ARCFACE_MODEL, sessionOpts);
    report(100, 'ArcFace loaded ✓');

    isInitialized = true;
    console.log('[OnnxPipeline] ✅ All models ready.');
    return true;
  } catch (err) {
    initError = err;
    console.error('[OnnxPipeline] ❌ Model load failed:', err);
    throw err;
  } finally {
    isInitializing = false;
    _progressCallback = null;
  }
};

export const isReady = () => isInitialized;
export const getInitError = () => initError;

// ─── Image Utilities ─────────────────────────────────────────────────────────

/**
 * Draw a video frame into an offscreen canvas at the given size and return
 * a normalised Float32Array in NCHW format (1 × 3 × H × W), BGR channel order.
 * Reuses a single offscreen canvas to avoid GC allocations per frame.
 */
const videoToTensor = (videoEl, width, height, bgr = true) => {
  if (!_videoCanvas) {
    _videoCanvas = document.createElement('canvas');
    _videoCtx = _videoCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (_videoCanvas.width !== width || _videoCanvas.height !== height) {
    _videoCanvas.width = width;
    _videoCanvas.height = height;
  }

  _videoCtx.drawImage(videoEl, 0, 0, width, height);
  const { data } = _videoCtx.getImageData(0, 0, width, height);

  const pixels = width * height;
  const tensor = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i++) {
    const r = (data[i * 4]     - 127.5) / 128;
    const g = (data[i * 4 + 1] - 127.5) / 128;
    const b = (data[i * 4 + 2] - 127.5) / 128;
    if (bgr) {
      tensor[0 * pixels + i] = b;
      tensor[1 * pixels + i] = g;
      tensor[2 * pixels + i] = r;
    } else {
      tensor[0 * pixels + i] = r;
      tensor[1 * pixels + i] = g;
      tensor[2 * pixels + i] = b;
    }
  }
  return tensor;
};

/**
 * Standard ArcFace alignment targets (mean face template).
 */
const ARCFACE_DST = [
  [38.2946, 51.6963],
  [73.5318, 51.6963],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.3655],
];

/**
 * Solve 6-parameter 2D affine transform (m11, m12, m21, m22, dx, dy) mapping src -> dst:
 * u = m11 * x + m21 * y + dx
 * v = m12 * x + m22 * y + dy
 * Correctly handles scale, rotation, translation, AND horizontal reflection.
 */
const estimateAffineTransform = (src, dst) => {
  const N = src.length;
  let S_xx = 0, S_yy = 0, S_xy = 0, S_x = 0, S_y = 0;
  let S_xu = 0, S_yu = 0, S_u = 0;
  let S_xv = 0, S_yv = 0, S_v = 0;

  for (let i = 0; i < N; i++) {
    const x = src[i][0];
    const y = src[i][1];
    const u = dst[i][0];
    const v = dst[i][1];

    S_xx += x * x;
    S_yy += y * y;
    S_xy += x * y;
    S_x  += x;
    S_y  += y;

    S_xu += x * u;
    S_yu += y * u;
    S_u  += u;

    S_xv += x * v;
    S_yv += y * v;
    S_v  += v;
  }

  const a00 = S_xx, a01 = S_xy, a02 = S_x;
  const a10 = S_xy, a11 = S_yy, a12 = S_y;
  const a20 = S_x,  a21 = S_y,  a22 = N;

  const det = a00 * (a11 * a22 - a12 * a21)
            - a01 * (a10 * a22 - a12 * a20)
            + a02 * (a10 * a21 - a11 * a20);

  if (Math.abs(det) < 1e-6) return null;

  const invDet = 1 / det;

  const i00 = (a11 * a22 - a12 * a21) * invDet;
  const i01 = (a02 * a21 - a01 * a22) * invDet;
  const i02 = (a01 * a12 - a02 * a11) * invDet;

  const i10 = (a12 * a20 - a10 * a22) * invDet;
  const i11 = (a00 * a22 - a02 * a20) * invDet;
  const i12 = (a02 * a10 - a00 * a12) * invDet;

  const i20 = (a10 * a21 - a11 * a20) * invDet;
  const i21 = (a01 * a20 - a00 * a21) * invDet;
  const i22 = (a00 * a11 - a01 * a10) * invDet;

  const m11 = i00 * S_xu + i01 * S_yu + i02 * S_u;
  const m21 = i10 * S_xu + i11 * S_yu + i12 * S_u;
  const dx  = i20 * S_xu + i21 * S_yu + i22 * S_u;

  const m12 = i00 * S_xv + i01 * S_yv + i02 * S_v;
  const m22 = i10 * S_xv + i11 * S_yv + i12 * S_v;
  const dy  = i20 * S_xv + i21 * S_yv + i22 * S_v;

  return { m11, m12, m21, m22, dx, dy };
};

/**
 * Affine-warp a face crop to 112×112 using 5-point landmarks.
 */
const cropAndAlignFace = (videoEl, landmarks) => {
  if (!_alignCanvas) {
    _alignCanvas = document.createElement('canvas');
    _alignCtx = _alignCanvas.getContext('2d', { willReadFrequently: true });
    _alignCanvas.width = ARCFACE_INPUT_SIZE;
    _alignCanvas.height = ARCFACE_INPUT_SIZE;
  }

  _alignCtx.fillStyle = '#000';
  _alignCtx.fillRect(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);

  if (landmarks && landmarks.length >= 5) {
    const transform = estimateAffineTransform(landmarks, ARCFACE_DST);
    if (transform) {
      const { m11, m12, m21, m22, dx, dy } = transform;
      _alignCtx.save();
      _alignCtx.setTransform(m11, m12, m21, m22, dx, dy);
      _alignCtx.drawImage(videoEl, 0, 0);
      _alignCtx.restore();
      return _alignCanvas;
    }
  }

  // Fallback crop if landmarks missing or transform degenerate
  const src = landmarks || [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
  const xVals = src.map(p => p[0]);
  const yVals = src.map(p => p[1]);
  const minX = Math.min(...xVals);
  const minY = Math.min(...yVals);
  const maxX = Math.max(...xVals);
  const maxY = Math.max(...yVals);

  const faceW = Math.max(50, (maxX - minX) * 2.2);
  const faceH = Math.max(50, (maxY - minY) * 2.8);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2 + (maxY - minY) * 0.1;

  const cropX = Math.max(0, cx - faceW / 2);
  const cropY = Math.max(0, cy - faceH / 2);

  _alignCtx.drawImage(
    videoEl,
    cropX, cropY, faceW, faceH,
    0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE
  );

  return _alignCanvas;
};

const canvasToArcFaceTensor = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true }) || _alignCtx;
  const { data } = ctx.getImageData(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);
  const pixels = ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE;
  const tensor = new Float32Array(3 * pixels);

  for (let i = 0; i < pixels; i++) {
    tensor[0 * pixels + i] = (data[i * 4]     - 127.5) / 128; // R
    tensor[1 * pixels + i] = (data[i * 4 + 1] - 127.5) / 128; // G
    tensor[2 * pixels + i] = (data[i * 4 + 2] - 127.5) / 128; // B
  }
  return tensor;
};

// ─── SCRFD Post-Processing ───────────────────────────────────────────────────

/**
 * Generate SCRFD anchor centers for a given output stride.
 */
const generateAnchorCenters = (height, width, stride) => {
  const centers = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let a = 0; a < SCRFD_NUM_ANCHORS; a++) {
        centers.push([(x + 0.5) * stride, (y + 0.5) * stride]);
      }
    }
  }
  return centers;
};

/**
 * IoU between two bounding boxes [x1,y1,x2,y2].
 */
const iou = (a, b) => {
  const ix1 = Math.max(a[0], b[0]);
  const iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]);
  const iy2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter + 1e-6);
};

/**
 * Non-Maximum Suppression.
 */
const nms = (boxes, scores, threshold) => {
  const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep = [];
  const suppressed = new Set();

  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    for (const j of order) {
      if (i === j || suppressed.has(j)) continue;
      if (iou(boxes[i], boxes[j]) > threshold) suppressed.add(j);
    }
  }
  return keep;
};

/**
 * Decode SCRFD raw outputs into [{box, score, landmarks}].
 *
 * SCRFD outputs 9 tensors — 3 per stride [8, 16, 32]:
 *   score, bbox (×4), kps (×10)
 *
 * CRITICAL: Tensor-to-stride mapping uses ONNX `.dims` shape (last dimension)
 * to distinguish tensor types, because data.length alone is AMBIGUOUS:
 *   e.g. bbox_stride16 (3200×4=12800) collides with score_stride8 (12800×1=12800)
 */
const decodeSCRFD = (outputs, origW, origH) => {
  const scaleX = origW / SCRFD_INPUT_SIZE;
  const scaleY = origH / SCRFD_INPUT_SIZE;

  const allBoxes = [];
  const allScores = [];
  const allLandmarks = [];

  // ── 1. Build numAnchors → stride lookup ──────────────────────────────────
  const anchorToStride = {};
  const strideGrids = {};
  for (const stride of SCRFD_STRIDES) {
    const gh = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const gw = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const na = gh * gw * SCRFD_NUM_ANCHORS;
    anchorToStride[na] = stride;
    strideGrids[stride] = { gh, gw, numAnchors: na };
  }

  // ── 2. Classify each output tensor by ONNX dims shape ────────────────────
  const strideTensors = {};
  for (const stride of SCRFD_STRIDES) {
    strideTensors[stride] = { score: null, bbox: null, kps: null };
  }

  const outputEntries = Object.entries(outputs).filter(([_, t]) => t?.data);

  // One-time diagnostic log
  if (!decodeSCRFD._logged) {
    decodeSCRFD._logged = true;
    console.log('[SCRFD] Output tensor map:', outputEntries.map(([name, t]) =>
      `${name}: dims=[${t.dims?.join(',')}] len=${t.data.length}`
    ).join(' | '));
  }

  // Track which tensors have been assigned to prevent double-assignment
  const usedTensors = new Set();

  // Phase A: Try named outputs first (e.g. 'score_8', 'bbox_16')
  for (const stride of SCRFD_STRIDES) {
    for (const type of ['score', 'bbox', 'kps']) {
      const key = `${type}_${stride}`;
      if (outputs[key]?.data) {
        strideTensors[stride][type] = outputs[key];
        usedTensors.add(outputs[key]);
      }
    }
  }

  // Phase B: Classify unassigned tensors using dims shape
  for (const [name, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    if (!tensor.dims || tensor.dims.length === 0) continue;

    const lastDim = tensor.dims[tensor.dims.length - 1];
    let type = null;
    let numAnchors = 0;

    if (lastDim === 4) {
      type = 'bbox';
      numAnchors = tensor.data.length / 4;
    } else if (lastDim === 10) {
      type = 'kps';
      numAnchors = tensor.data.length / 10;
    } else {
      // lastDim is 1, 2, or flattened — treat as score
      type = 'score';
      numAnchors = (lastDim <= 2) ? tensor.data.length / lastDim : tensor.data.length;
    }

    const stride = anchorToStride[numAnchors];
    if (stride && strideTensors[stride] && !strideTensors[stride][type]) {
      strideTensors[stride][type] = tensor;
      usedTensors.add(tensor);
    }
  }

  // Phase C: Fallback for 1D (flattened) tensors — assign remaining by unique sizes
  for (const [name, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    const len = tensor.data.length;

    for (const stride of SCRFD_STRIDES) {
      const na = strideGrids[stride].numAnchors;
      if (!strideTensors[stride].kps && len === na * 10) {
        strideTensors[stride].kps = tensor; usedTensors.add(tensor); break;
      }
      if (!strideTensors[stride].bbox && len === na * 4) {
        strideTensors[stride].bbox = tensor; usedTensors.add(tensor); break;
      }
    }
  }
  // Scores last (to avoid collision with bbox of different stride)
  for (const [name, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    const len = tensor.data.length;
    for (const stride of SCRFD_STRIDES) {
      const na = strideGrids[stride].numAnchors;
      if (!strideTensors[stride].score && (len === na || len === na * 2)) {
        strideTensors[stride].score = tensor; usedTensors.add(tensor); break;
      }
    }
  }

  // ── 3. Decode each stride ────────────────────────────────────────────────
  for (const stride of SCRFD_STRIDES) {
    const { score: scoreTensor, bbox: bboxTensor, kps: kpsTensor } = strideTensors[stride];
    if (!scoreTensor || !bboxTensor) {
      console.warn(`[SCRFD] Missing tensors for stride ${stride} — skipping`);
      continue;
    }

    const { gh, gw } = strideGrids[stride];
    const scoreData = scoreTensor.data;
    const bboxData  = bboxTensor.data;
    const kpsData   = kpsTensor?.data;
    const centers   = generateAnchorCenters(gh, gw, stride);
    const has2Classes = scoreData.length >= centers.length * 2;

    for (let i = 0; i < centers.length; i++) {
      const rawScore = has2Classes ? scoreData[i * 2 + 1] : scoreData[i];
      // SCRFD logits are always raw — apply sigmoid
      const score = 1 / (1 + Math.exp(-rawScore));

      if (score < 0.5) continue;

      const [cx, cy] = centers[i];

      // Decode bounding box — SCRFD: [dist_left, dist_top, dist_right, dist_bottom]
      const x1 = (cx - bboxData[i * 4 + 0] * stride) * scaleX;
      const y1 = (cy - bboxData[i * 4 + 1] * stride) * scaleY;
      const x2 = (cx + bboxData[i * 4 + 2] * stride) * scaleX;
      const y2 = (cy + bboxData[i * 4 + 3] * stride) * scaleY;

      const faceW = x2 - x1;
      const faceH = y2 - y1;

      // Skip tiny detections and absurdly large background boxes
      if (faceW < 30 || faceH < 30) continue;
      if (faceW > origW * 0.75 || faceH > origH * 0.75) continue;

      // Decode 5-point keypoints
      const kps = [];
      if (kpsData) {
        for (let k = 0; k < 5; k++) {
          kps.push([
            (cx + kpsData[i * 10 + k * 2]     * stride) * scaleX,
            (cy + kpsData[i * 10 + k * 2 + 1] * stride) * scaleY,
          ]);
        }
      }

      allBoxes.push([x1, y1, x2, y2]);
      allScores.push(score);
      allLandmarks.push(kps);
    }
  }

  if (allBoxes.length === 0) return [];

  let keepIdx = nms(allBoxes, allScores, NMS_THRESHOLD);

  // Sort by confidence descending — primary face first
  keepIdx.sort((a, b) => allScores[b] - allScores[a]);

  // Keep only genuinely distinct high-confidence faces
  if (keepIdx.length > 1) {
    const filteredKeep = [keepIdx[0]];
    for (let k = 1; k < keepIdx.length; k++) {
      const idx = keepIdx[k];
      // Secondary detection must be high-confidence AND non-overlapping with primary
      if (allScores[idx] >= 0.6 && iou(allBoxes[keepIdx[0]], allBoxes[idx]) <= 0.15) {
        filteredKeep.push(idx);
      }
    }
    keepIdx = filteredKeep;
  }

  return keepIdx.map(i => ({
    box: {
      x: Math.max(0, allBoxes[i][0]),
      y: Math.max(0, allBoxes[i][1]),
      width:  Math.min(origW, allBoxes[i][2] - allBoxes[i][0]),
      height: Math.min(origH, allBoxes[i][3] - allBoxes[i][1]),
    },
    score: allScores[i],
    landmarks: allLandmarks[i], // [[x,y] × 5]
  }));
};

// ─── L2 Normalisation ────────────────────────────────────────────────────────
const l2Normalize = (vec) => {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map(v => v / norm) : vec;
};

// ─── Cosine Similarity ───────────────────────────────────────────────────────
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? Math.max(-1, Math.min(1, dot / denom)) : 0;
};

// ─── Main Pipeline Entry Point ───────────────────────────────────────────────

export const detectAndEmbed = async (videoEl) => {
  if (!isInitialized) throw new Error('[OnnxPipeline] Not initialised. Call initPipeline() first.');
  if (!videoEl || videoEl.readyState < 2) return [];

  const origW = videoEl.videoWidth  || 640;
  const origH = videoEl.videoHeight || 480;

  const t0 = performance.now();

  // ── 1. SCRFD Detection ──────────────────────────────────────────────────
  // Use RGB format (bgr = false) for standard SCRFD PyTorch ONNX model input
  const scrfdInput = videoToTensor(videoEl, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE, false);
  const scrfdTensor = new ort.Tensor('float32', scrfdInput, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);

  const scrfdInputName = scrfdSession.inputNames[0];
  const scrfdOutputs = await scrfdSession.run({ [scrfdInputName]: scrfdTensor });
  const faces = decodeSCRFD(scrfdOutputs, origW, origH);

  if (faces.length === 0) return [];

  const tDetect = performance.now() - t0;
  console.log(`[OnnxPipeline] SCRFD: ${faces.length} face(s) in ${tDetect.toFixed(1)}ms`);

  // ── 2. ArcFace Embedding + Anti-Spoof per face ──────────────────────────
  const results = [];

  for (const face of faces) {
    // Skip tiny faces (too small to be reliably identified)
    if (face.box.width < 30 || face.box.height < 30) continue;

    const tEmbed0 = performance.now();

    // Align face crop to 112×112
    const alignedCanvas = cropAndAlignFace(videoEl, face.landmarks);
    const arcfaceInput = canvasToArcFaceTensor(alignedCanvas);
    const arcfaceTensor = new ort.Tensor('float32', arcfaceInput, [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE]);

    const arcfaceInputName = arcfaceSession.inputNames[0];
    const arcfaceOutputs = await arcfaceSession.run({ [arcfaceInputName]: arcfaceTensor });
    const rawEmbedding = arcfaceOutputs[Object.keys(arcfaceOutputs)[0]].data;
    const embedding = l2Normalize(Array.from(rawEmbedding));

    const tEmbed = performance.now() - tEmbed0;

    // Anti-spoof model (MN3-AntiSpoof) is NOT loaded — the file on disk is invalid.
    // isReal=null signals to callers that liveness was NOT checked, rather than
    // the previous lie of isReal=true which gave a false sense of security.
    const isReal = null;
    const antispoofScore = null;

    console.log(`[OnnxPipeline] ArcFace: ${tEmbed.toFixed(1)}ms`);

    results.push({
      box: face.box,
      score: face.score,
      landmarks: face.landmarks,
      embedding,
      isReal,
      antispoofScore,
    });
  }

  const total = performance.now() - t0;
  console.log(`[OnnxPipeline] Full pipeline: ${total.toFixed(1)}ms for ${results.length} face(s)`);

  return results;
};

/**
 * Quick face-only detection (no embedding, no anti-spoof) for the tracker.
 * Returns Array of { box, score, landmarks }
 */
export const detectOnly = async (videoEl) => {
  if (!isInitialized) return [];
  if (!videoEl || videoEl.readyState < 2) return [];

  const origW = videoEl.videoWidth  || 640;
  const origH = videoEl.videoHeight || 480;

  try {
    const scrfdInput = videoToTensor(videoEl, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE, false);
    const scrfdTensor = new ort.Tensor('float32', scrfdInput, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
    const inputName = scrfdSession.inputNames[0];
    const outputs = await scrfdSession.run({ [inputName]: scrfdTensor });
    return decodeSCRFD(outputs, origW, origH);
  } catch (err) {
    console.warn('[OnnxPipeline] detectOnly failed:', err.message);
    return [];
  }
};
