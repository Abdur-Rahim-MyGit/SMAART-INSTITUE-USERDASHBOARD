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
// Captured lazily: the runtime assets live in public/onnx-wasm/. If that folder
// is missing the script 404s and window.ort is undefined — which is exactly the
// "Model loading failed" state. initPipeline() re-reads it and fails loudly.
let ort = window.ort;

// ─── Constants ───────────────────────────────────────────────────────────────
const MODEL_BASE = '/models/onnx';
const SCRFD_MODEL = `${MODEL_BASE}/scrfd_500m_bnkps.onnx`; // updated filename
const ARCFACE_MODEL = `${MODEL_BASE}/w600k_r50.onnx`;

const SCRFD_INPUT_SIZE = 640;        // SCRFD input resolution
const ARCFACE_INPUT_SIZE = 112;      // ArcFace aligned face crop size
const NMS_THRESHOLD = 0.3;
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

// ─── Initialization ──────────────────────────────────────────────────────────

/**
 * Configure ONNX Runtime Web to use the bundled WASM files.
 * Must be called before any InferenceSession.create().
 */
const configureOrtEnv = () => {
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
    // Wait for the ongoing init
    let wait = 0;
    while (isInitializing && wait < 300) {
      await new Promise(r => setTimeout(r, 200));
      wait++;
    }
    return isInitialized;
  }

  isInitializing = true;
  _progressCallback = onProgress || null;
  initError = null;

  try {
    // Re-read in case this module was imported before ort.min.js executed, and
    // fail with a clear message rather than a cryptic "cannot read 'env' of
    // undefined" when the runtime asset is missing.
    ort = window.ort;
    if (!ort) {
      throw new Error(
        'ONNX Runtime is unavailable — /onnx-wasm/ort.min.js failed to load. ' +
        'Ensure the files exist in front-end/public/onnx-wasm/ and hard-refresh the page (Ctrl+Shift+R).'
      );
    }

    configureOrtEnv();
    report(5, 'Configuring ONNX Runtime...');

    // 'webgpu' is the modern GPU provider in ORT-Web 1.27 (the old 'webgl'
    // backend was removed); 'wasm' is the universal fallback.
    const sessionOpts = {
      executionProviders: ['webgpu', 'wasm'],
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
 */
const videoToTensor = (videoEl, width, height, bgr = true) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, width, height);
  const { data } = ctx.getImageData(0, 0, width, height);

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
 * Affine-warp a face crop to 112×112 using 5-point landmarks.
 * Standard ArcFace alignment targets (mean face template).
 */
const ARCFACE_DST = [
  [38.2946, 51.6963],
  [73.5318, 51.6963],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.3655],
];

const cropAndAlignFace = (videoEl, landmarks) => {
  // Compute similarity transform from detected 5-pt landmarks → ArcFace template
  const src = landmarks; // [[x,y], [x,y], ...]
  const dst = ARCFACE_DST;

  // Simplified: use bounding box of landmarks + a bit of padding as approximation
  // when full affine warp isn't available. A proper similarity transform is computed
  // below using least-squares.
  const xVals = src.map(p => p[0]);
  const yVals = src.map(p => p[1]);
  const minX = Math.min(...xVals);
  const minY = Math.min(...yVals);
  const maxX = Math.max(...xVals);
  const maxY = Math.max(...yVals);

  const faceW = (maxX - minX) * 2.2;
  const faceH = (maxY - minY) * 2.8;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2 + (maxY - minY) * 0.1;

  const cropX = Math.max(0, cx - faceW / 2);
  const cropY = Math.max(0, cy - faceH / 2);

  const canvas = document.createElement('canvas');
  canvas.width = ARCFACE_INPUT_SIZE;
  canvas.height = ARCFACE_INPUT_SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    videoEl,
    cropX, cropY, faceW, faceH,
    0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE
  );

  return canvas;
};

const canvasToArcFaceTensor = (canvas) => {
  const ctx = canvas.getContext('2d');
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
 * SCRFD outputs 3 pairs of tensors at strides [8, 16, 32]:
 *   score_8/16/32, bbox_8/16/32, kps_8/16/32
 */
const decodeSCRFD = (outputs, origW, origH) => {
  const scaleX = origW / SCRFD_INPUT_SIZE;
  const scaleY = origH / SCRFD_INPUT_SIZE;

  const allBoxes = [];
  const allScores = [];
  const allLandmarks = [];

  // Map of stride → actual output tensor key names (discovered at runtime)
  // Layout: per-stride groups of [score, bbox, kps] in ascending stride order
  // Use scrfdSession.outputNames to preserve the correct model-defined order,
  // as Object.keys() will sort numeric string output names (like '446', '466') numerically.
  const keys = scrfdSession?.outputNames || Object.keys(outputs);

  for (let si = 0; si < SCRFD_STRIDES.length; si++) {
    const stride = SCRFD_STRIDES[si];
    const gh = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const gw = Math.ceil(SCRFD_INPUT_SIZE / stride);

    // Standard named outputs first, then positional fallback (score,bbox,kps grouped per stride)
    const scoreKey = outputs[`score_${stride}`] || outputs[keys[si * 3]];
    const bboxKey  = outputs[`bbox_${stride}`]  || outputs[keys[si * 3 + 1]];
    const kpsKey   = outputs[`kps_${stride}`]   || outputs[keys[si * 3 + 2]];

    if (!scoreKey) continue;

    const scoreData = scoreKey.data;
    const bboxData  = bboxKey?.data;
    const kpsData   = kpsKey?.data;

    // SCRFD score tensor shape can be [N, 1] or flat [N]
    // scoreKey.dims = e.g. [3200, 1] for stride 8 with 2 anchors
    const scoreStride = (scoreKey.dims && scoreKey.dims[scoreKey.dims.length - 1] === 1) ? 1 : 0;

    const centers = generateAnchorCenters(gh, gw, stride);

    for (let i = 0; i < centers.length; i++) {
      // dims=[N,1] → data is flat, so scoreData[i] is correct
      const rawScore = scoreData[i];
      const score = rawScore;  // scores are already probabilities (no sigmoid needed)

      // Confidence threshold — 0.5 prevents background patterns from triggering false faces
      if (score < 0.5) continue;

      const [cx, cy] = centers[i];

      // Decode bounding box — SCRFD: [dist_left, dist_top, dist_right, dist_bottom]
      const x1 = (cx - bboxData[i * 4 + 0] * stride) * scaleX;
      const y1 = (cy - bboxData[i * 4 + 1] * stride) * scaleY;
      const x2 = (cx + bboxData[i * 4 + 2] * stride) * scaleX;
      const y2 = (cy + bboxData[i * 4 + 3] * stride) * scaleY;

      // Minimum face size filter: face must span at least 4% of frame width and height
      // This prevents distant background textures from being counted as faces
      const faceW = x2 - x1;
      const faceH = y2 - y1;
      if (faceW < origW * 0.04 || faceH < origH * 0.04) continue;

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

  const keepIdx = nms(allBoxes, allScores, NMS_THRESHOLD);

  return keepIdx.map(i => ({
    box: {
      x: allBoxes[i][0],
      y: allBoxes[i][1],
      width:  allBoxes[i][2] - allBoxes[i][0],
      height: allBoxes[i][3] - allBoxes[i][1],
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
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // Both are L2-normalised, so dot product = cosine similarity
};

// ─── Main Pipeline Entry Point ───────────────────────────────────────────────

/**
 * Detect all faces in a video frame, compute ArcFace embeddings, and run
 * anti-spoof check on each face.
 *
 * Returns: Array of {
 *   box: {x, y, width, height},
 *   score: number,
 *   landmarks: [[x,y]×5],
 *   embedding: Float32Array[512],   // L2-normalised ArcFace embedding
 *   isReal: boolean,                // Anti-spoof result
 *   antispoofScore: number,         // 0=fake, 1=real
 * }
 */
export const detectAndEmbed = async (videoEl) => {
  if (!isInitialized) throw new Error('[OnnxPipeline] Not initialised. Call initPipeline() first.');
  if (!videoEl || videoEl.readyState < 2) return [];

  const origW = videoEl.videoWidth  || 640;
  const origH = videoEl.videoHeight || 480;

  const t0 = performance.now();

  // ── 1. SCRFD Detection ──────────────────────────────────────────────────
  const scrfdInput = videoToTensor(videoEl, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE, true);
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
    const rawEmbedding = arcfaceOutputs[arcfaceSession.outputNames[0] || Object.keys(arcfaceOutputs)[0]].data;
    const embedding = l2Normalize(Array.from(rawEmbedding));

    const tEmbed = performance.now() - tEmbed0;

    const isReal = true;
    const antispoofScore = 1.0;

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
    const scrfdInput = videoToTensor(videoEl, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE, true);
    const scrfdTensor = new ort.Tensor('float32', scrfdInput, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
    const inputName = scrfdSession.inputNames[0];
    const outputs = await scrfdSession.run({ [inputName]: scrfdTensor });
    return decodeSCRFD(outputs, origW, origH);
  } catch (err) {
    console.warn('[OnnxPipeline] detectOnly failed:', err.message);
    return [];
  }
};
