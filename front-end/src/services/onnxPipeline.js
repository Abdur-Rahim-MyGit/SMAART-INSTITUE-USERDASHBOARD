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

import * as ortPackage from 'onnxruntime-web';

// onnxruntime-web is loaded either via ESM import or index.html <script src="/onnx-wasm/ort.min.js">
const getOrt = () => {
  if (typeof window !== 'undefined' && window.ort) {
    return window.ort;
  }
  if (ortPackage && (ortPackage.InferenceSession || ortPackage.default?.InferenceSession)) {
    return ortPackage.default || ortPackage;
  }
  throw new Error('[OnnxPipeline] ONNX Runtime Web library is missing. Please ensure /onnx-wasm/ort.min.js is loaded or onnxruntime-web is installed.');
};

// ─── Constants ───────────────────────────────────────────────────────────────
const MODEL_BASE = '/models/onnx';
const SCRFD_MODEL = `${MODEL_BASE}/scrfd_500m_bnkps.onnx`; // updated filename
const ARCFACE_MODEL = `${MODEL_BASE}/w600k_r50.onnx`;
// Object detector (optional) — YOLOv8n exported to ONNX, COCO 80 classes.
const YOLO_MODEL = `${MODEL_BASE}/yolov8n.onnx`;
const YOLO_INPUT_SIZE = 640;
const YOLO_SCORE_THRESHOLD = 0.40;
// Detections between this and the acting threshold are logged, never acted on.
const YOLO_NEAR_MISS_SCORE = 0.18;
const YOLO_NMS_THRESHOLD = 0.45;
// COCO class id → violation label. Only these classes are reported.
const YOLO_CLASSES_OF_INTEREST = { 67: 'phone', 73: 'book', 63: 'laptop' };

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
let yoloSession = null; // optional object detector

let _yoloCanvas = null;
let _yoloCtx = null;

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
  // NOTE: do NOT enable `ort.env.wasm.proxy` here. The proxy worker fails to
  // initialise in this Vite dev setup, which stops SCRFD/ArcFace from returning
  // detections (real-time face detection breaks). Main-thread blocking from the
  // heavy 174 MB model is instead mitigated by running ArcFace identity checks
  // at a lower cadence than the 1 s SCRFD presence check (see
  // useProctoringEngine.runFaceVerification).
  // Multi-threaded WASM needs SharedArrayBuffer, which requires cross-origin
  // isolation (COOP/COEP headers). When available, use multiple threads — the
  // single biggest SAFE speedup for the 174 MB ArcFace model and the likeliest
  // cure for "face not detected" caused by a slow/stalled load on real machines.
  // Otherwise stay single-threaded (previous behaviour), never crash.
  // (SIMD is auto-detected by ORT 1.27 — no need to assert it.)
  const isolated = (typeof self !== 'undefined' && self.crossOriginIsolated);
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
  ort.env.wasm.numThreads = isolated ? Math.min(cores, 8) : 1;
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
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
      enableCpuMemArena: true,
      enableMemPattern: true,
    };

    report(10, 'Loading face detector (SCRFD)...');
    scrfdSession = await ort.InferenceSession.create(SCRFD_MODEL, sessionOpts);
    report(50, 'SCRFD loaded ✓');

    report(55, 'Loading face recognition model (ArcFace R50, ~80 MB)...');
    arcfaceSession = await ort.InferenceSession.create(ARCFACE_MODEL, sessionOpts);
    report(95, 'ArcFace loaded ✓');

    // OPTIONAL object detector. Its absence must NEVER break the face pipeline —
    // if the model file isn't present, object detection simply no-ops.
    try {
      report(97, 'Loading object detector (YOLO)...');
      yoloSession = await ort.InferenceSession.create(YOLO_MODEL, sessionOpts);
      console.log('[OnnxPipeline] ✅ YOLO object detector loaded.');
    } catch (yoloErr) {
      yoloSession = null;
      console.warn('[OnnxPipeline] ⚠️ YOLO model unavailable — object detection disabled:', yoloErr.message);
    }
    report(100, 'Models ready ✓');

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
 * Solve 4-parameter 2D Similarity Transform (scale, rotation, translation) mapping src -> dst (Umeyama algorithm):
 * u = a * x - b * y + tx
 * v = b * x + a * y + ty
 * Preserves rigid facial shape (no shear, skew, or non-uniform stretching) for ArcFace 112×112 crops.
 */
const estimateAffineTransform = (src, dst) => {
  const N = src.length;
  if (!N || N < 3) return null;

  let sumX = 0, sumY = 0, sumU = 0, sumV = 0;
  for (let i = 0; i < N; i++) {
    sumX += src[i][0];
    sumY += src[i][1];
    sumU += dst[i][0];
    sumV += dst[i][1];
  }

  const meanX = sumX / N;
  const meanY = sumY / N;
  const meanU = sumU / N;
  const meanV = sumV / N;

  let varX = 0;
  let S_xu = 0, S_xv = 0;

  for (let i = 0; i < N; i++) {
    const x = src[i][0] - meanX;
    const y = src[i][1] - meanY;
    const u = dst[i][0] - meanU;
    const v = dst[i][1] - meanV;

    varX += x * x + y * y;
    S_xu += x * u + y * v;
    S_xv += x * v - y * u;
  }

  if (varX < 1e-6) return null;

  const a = S_xu / varX;
  const b = S_xv / varX;

  const tx = meanU - (a * meanX - b * meanY);
  const ty = meanV - (b * meanX + a * meanY);

  return { m11: a, m12: b, m21: -b, m22: a, dx: tx, dy: ty };
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

      if (score < 0.35) continue;

      const [cx, cy] = centers[i];

      // Decode bounding box — SCRFD: [dist_left, dist_top, dist_right, dist_bottom]
      const x1 = (cx - bboxData[i * 4 + 0] * stride) * scaleX;
      const y1 = (cy - bboxData[i * 4 + 1] * stride) * scaleY;
      const x2 = (cx + bboxData[i * 4 + 2] * stride) * scaleX;
      const y2 = (cy + bboxData[i * 4 + 3] * stride) * scaleY;

      const faceW = x2 - x1;
      const faceH = y2 - y1;

      // Skip tiny detections and absurdly large background boxes
      if (faceW < 25 || faceH < 25) continue;
      if (faceW > origW * 0.98 || faceH > origH * 0.98) continue;

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
  const ort = getOrt();
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
    const ort = getOrt();
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

// ─── Object Detection (YOLOv8n) ──────────────────────────────────────────────

export const isObjectDetectorReady = () => yoloSession !== null;

/**
 * What actually loaded. Phone and book detection depend entirely on the YOLO
 * session, and its load is wrapped in a try/catch so that a missing model never
 * breaks face verification — which also means it can be absent with nothing but
 * one warning scrolling past. Call __proctorVision.status() to settle it.
 */
export const getPipelineStatus = () => ({
  faceDetector: scrfdSession ? 'loaded' : 'MISSING',
  faceRecogniser: arcfaceSession ? 'loaded' : 'MISSING',
  objectDetector: yoloSession ? 'loaded' : 'MISSING — phone/book detection cannot run',
  initialised: isInitialized,
  initError: initError ? initError.message : null,
  yoloScoreThreshold: YOLO_SCORE_THRESHOLD,
  watchedClasses: Object.values(YOLO_CLASSES_OF_INTEREST),
});

if (typeof window !== 'undefined') {
  window.__proctorVision = {
    status() {
      const s = getPipelineStatus();
      console.log(s);
      return s;
    },
  };
}

// Preprocess a frame for YOLO: resize to 640×640, RGB, normalised 0–1, NCHW.
const videoToYoloTensor = (videoEl) => {
  if (!_yoloCanvas) {
    _yoloCanvas = document.createElement('canvas');
    _yoloCtx = _yoloCanvas.getContext('2d', { willReadFrequently: true });
    _yoloCanvas.width = YOLO_INPUT_SIZE;
    _yoloCanvas.height = YOLO_INPUT_SIZE;
  }
  _yoloCtx.drawImage(videoEl, 0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);
  const { data } = _yoloCtx.getImageData(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);
  const pixels = YOLO_INPUT_SIZE * YOLO_INPUT_SIZE;
  const t = new Float32Array(3 * pixels);
  for (let i = 0; i < pixels; i++) {
    t[i] = data[i * 4] / 255;                 // R
    t[pixels + i] = data[i * 4 + 1] / 255;    // G
    t[2 * pixels + i] = data[i * 4 + 2] / 255; // B
  }
  return t;
};

/**
 * Detect prohibited objects (phone/book/laptop) in the current frame.
 * No-ops (returns []) when the YOLO model isn't loaded.
 * @returns {Promise<Array<{cls:number, label:string, score:number, box:number[]}>>}
 */
export const detectObjects = async (videoEl) => {
  if (!yoloSession || !videoEl || videoEl.readyState < 2) return [];
  try {
    const ort = getOrt();
    const input = videoToYoloTensor(videoEl);
    const tensor = new ort.Tensor('float32', input, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]);
    const outputs = await yoloSession.run({ [yoloSession.inputNames[0]]: tensor });
    const out = outputs[yoloSession.outputNames[0]];
    const dims = out.dims;
    const dataArr = out.data;

    // Handle both export layouts: [1, attrs, anchors] and [1, anchors, attrs].
    // attrs = 4 (box) + numClasses; it is the SMALLER of the two trailing dims.
    const d1 = dims[1], d2 = dims[2];
    const attrsFirst = d1 <= d2;
    const numAttrs = attrsFirst ? d1 : d2;
    const numAnchors = attrsFirst ? d2 : d1;
    const at = (attr, a) => (attrsFirst ? dataArr[attr * numAnchors + a] : dataArr[a * numAttrs + attr]);

    const boxes = [], scores = [], classes = [];
    const nearMisses = [];
    for (let a = 0; a < numAnchors; a++) {
      let bestScore = 0, bestCls = -1;
      for (const cid of Object.keys(YOLO_CLASSES_OF_INTEREST)) {
        const c = Number(cid);
        const s = at(4 + c, a);
        if (s > bestScore) { bestScore = s; bestCls = c; }
      }
      if (bestCls >= 0 && bestScore >= YOLO_NEAR_MISS_SCORE && bestScore < YOLO_SCORE_THRESHOLD) {
        // Seen, but not confidently enough to act on. Logged because "the model
        // never saw the phone" and "the model saw it at 0.31 against a 0.40 bar"
        // are completely different problems with completely different fixes.
        nearMisses.push(`${YOLO_CLASSES_OF_INTEREST[bestCls]} ${bestScore.toFixed(2)}`);
      }
      if (bestScore < YOLO_SCORE_THRESHOLD || bestCls < 0) continue;
      const cx = at(0, a), cy = at(1, a), w = at(2, a), h = at(3, a);
      boxes.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
      scores.push(bestScore);
      classes.push(bestCls);
    }
    if (nearMisses.length) {
      console.log(`[OnnxPipeline] YOLO near-miss (below ${YOLO_SCORE_THRESHOLD} threshold): ${[...new Set(nearMisses)].join(', ')}`);
    }

    if (!boxes.length) return [];
    const keep = nms(boxes, scores, YOLO_NMS_THRESHOLD);
    return keep.map(i => ({
      cls: classes[i],
      label: YOLO_CLASSES_OF_INTEREST[classes[i]],
      score: scores[i],
      box: boxes[i]
    }));
  } catch (err) {
    console.warn('[OnnxPipeline] detectObjects failed:', err.message);
    return [];
  }
};
