/**
 * proctoring.worker.js
 *
 * Dedicated Web Worker for AI Proctoring.
 * Offloads 100% of ONNX inference, OffscreenCanvas image resizing,
 * RGB normalization, and tensor allocation off the browser main thread.
 */

// WASM-only build (matches the proven main-thread pipeline). We tried the
// WebGPU build (`onnxruntime-web/webgpu` + EP ['webgpu','wasm']) but ORT-web's
// WebGPU/JSEP backend computed SCRFD's outputs incorrectly on this setup —
// nodes split between GPU and CPU ("Some nodes were not assigned to the
// preferred execution providers") and detection returned 0 faces. WASM is
// correct and also loads faster (no shader compile of the 174 MB model).
import * as ort from 'onnxruntime-web';
// NOTE: MediaPipe Face Mesh is NOT imported here. Its loader uses
// importScripts(), which is forbidden in a module worker, so it runs on the
// MAIN THREAD instead (see services/mediapipeGaze.js). This worker computes a
// SCRFD 5-point gaze estimate as the fallback when MediaPipe isn't ready.

// Configure ONNX WASM Paths & SIMD Optimization
ort.env.wasm.wasmPaths = '/onnx-wasm/';
ort.env.wasm.simd = true;
// Multi-threaded WASM needs SharedArrayBuffer, which requires cross-origin
// isolation (COOP/COEP). Outside an isolated context, requesting >1 thread
// throws / thrashes, so gate it.
ort.env.wasm.numThreads = (typeof self !== 'undefined' && self.crossOriginIsolated)
  ? Math.min(navigator.hardwareConcurrency || 2, 4)
  : 1;

// Model file paths
const MODEL_BASE = '/models/onnx';
const SCRFD_MODEL = `${MODEL_BASE}/scrfd_500m_bnkps.onnx`;
const ARCFACE_MODEL = `${MODEL_BASE}/w600k_r50.onnx`;
const YOLO_MODEL = `${MODEL_BASE}/yolov8n.onnx`;

const SCRFD_INPUT_SIZE = 640;
const ARCFACE_INPUT_SIZE = 112;
const YOLO_INPUT_SIZE = 640;
const SCRFD_STRIDES = [8, 16, 32];
const SCRFD_NUM_ANCHORS = 2;

// YOLO (prohibited-item) detection — COCO class ids we care about.
const YOLO_CLASSES = { 67: 'phone', 73: 'book', 63: 'laptop' };
const YOLO_CONF_THRESHOLD = 0.4;
const YOLO_INTERVAL_MS = 3000; // heavier detector runs on a slower cadence

// Standard 112x112 destination coordinates for 5-point ArcFace landmark alignment
const ARCFACE_DST = [
  [38.2946, 51.6963], // Left eye
  [73.5318, 51.5014], // Right eye
  [56.0252, 71.7366], // Nose tip
  [41.5493, 92.3655], // Left mouth corner
  [70.7299, 92.2041], // Right mouth corner
];

// Worker State
let scrfdSession = null;
let arcfaceSession = null;
let yoloSession = null;
let isInitialized = false;

let registeredReferenceEmbeddings = [];
let lastArcfaceTime = 0;
let lastYoloTime = 0;
let lastObjects = [];          // most recent prohibited-item detections
let previousFaceState = 'no_face';

// Offscreen Canvas Singletons
let _scrfdCanvas = null;
let _scrfdCtx = null;
let _arcfaceCanvas = null;
let _arcfaceCtx = null;

// ─── Initialize ONNX Sessions ───────────────────────────────────────────────
async function initPipeline() {
  if (isInitialized) return;

  // WASM only. WebGPU produced incorrect SCRFD outputs here (see import note),
  // and this matches the proven main-thread pipeline (onnxPipeline.js).
  const executionProviders = ['wasm'];

  const sessionOpts = {
    executionProviders,
    graphOptimizationLevel: 'all',
    enableCpuMemArena: true,
    enableMemPattern: true,
  };

  try {
    postMessage({ type: 'INIT_PROGRESS', progress: 10, message: 'Loading SCRFD detector...' });
    scrfdSession = await ort.InferenceSession.create(SCRFD_MODEL, sessionOpts);

    postMessage({ type: 'INIT_PROGRESS', progress: 50, message: 'Loading ArcFace identity model...' });
    arcfaceSession = await ort.InferenceSession.create(ARCFACE_MODEL, sessionOpts);

    try {
      console.log(`[Worker] ONNX ready — EP: ${executionProviders.join(', ')}`);
    } catch { /* noop */ }

    // Object detector (phone/book/laptop). Optional — no-ops if the model file
    // isn't present. Must NOT block the face pipeline.
    try {
      postMessage({ type: 'INIT_PROGRESS', progress: 82, message: 'Loading YOLO object detector...' });
      yoloSession = await ort.InferenceSession.create(YOLO_MODEL, sessionOpts);
    } catch {
      yoloSession = null;
      console.warn('[Worker] YOLO model not available — object detection disabled.');
    }

    isInitialized = true;
    postMessage({ type: 'INIT_COMPLETE' });
  } catch (err) {
    postMessage({ type: 'INIT_ERROR', error: err.message || err.toString() });
  }
}

// ─── Cosine Similarity & Vector Math ───────────────────────────────────────
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
}

function normalizeEmbedding(emb) {
  let norm = 0;
  for (let i = 0; i < emb.length; i++) norm += emb[i] * emb[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(emb.length);
  for (let i = 0; i < emb.length; i++) out[i] = emb[i] / norm;
  return out;
}

// ─── SCRFD Anchor & NMS Decoding ──────────────────────────────────────────
function generateAnchorCenters(height, width, stride) {
  const centers = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let a = 0; a < SCRFD_NUM_ANCHORS; a++) {
        centers.push([(x + 0.5) * stride, (y + 0.5) * stride]);
      }
    }
  }
  return centers;
}

function iou(a, b) {
  const ix1 = Math.max(a[0], b[0]);
  const iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]);
  const iy2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter + 1e-6);
}

function nms(boxes, scores, threshold) {
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
}

function decodeSCRFD(outputs, origW, origH) {
  const scaleX = origW / SCRFD_INPUT_SIZE;
  const scaleY = origH / SCRFD_INPUT_SIZE;

  const allBoxes = [];
  const allScores = [];
  const allLandmarks = [];

  const anchorToStride = {};
  const strideGrids = {};
  for (const stride of SCRFD_STRIDES) {
    const gh = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const gw = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const na = gh * gw * SCRFD_NUM_ANCHORS;
    anchorToStride[na] = stride;
    strideGrids[stride] = { gh, gw, numAnchors: na };
  }

  const strideTensors = {};
  for (const stride of SCRFD_STRIDES) {
    strideTensors[stride] = { score: null, bbox: null, kps: null };
  }

  const outputEntries = Object.entries(outputs).filter(([_, t]) => t?.data);
  const usedTensors = new Set();

  for (const stride of SCRFD_STRIDES) {
    for (const type of ['score', 'bbox', 'kps']) {
      const key = `${type}_${stride}`;
      if (outputs[key]?.data) {
        strideTensors[stride][type] = outputs[key];
        usedTensors.add(outputs[key]);
      }
    }
  }

  for (const [_, tensor] of outputEntries) {
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

  for (const stride of SCRFD_STRIDES) {
    const { score: scoreTensor, bbox: bboxTensor, kps: kpsTensor } = strideTensors[stride];
    if (!scoreTensor || !bboxTensor) continue;

    const { gh, gw } = strideGrids[stride];
    const scoreData = scoreTensor.data;
    const bboxData = bboxTensor.data;
    const kpsData = kpsTensor?.data;
    const centers = generateAnchorCenters(gh, gw, stride);
    const has2Classes = scoreData.length >= centers.length * 2;

    for (let i = 0; i < centers.length; i++) {
      const rawScore = has2Classes ? scoreData[i * 2 + 1] : scoreData[i];
      const score = 1 / (1 + Math.exp(-rawScore));

      if (score < 0.35) continue; // matches onnxPipeline.js

      const [cx, cy] = centers[i];
      const x1 = (cx - bboxData[i * 4 + 0] * stride) * scaleX;
      const y1 = (cy - bboxData[i * 4 + 1] * stride) * scaleY;
      const x2 = (cx + bboxData[i * 4 + 2] * stride) * scaleX;
      const y2 = (cy + bboxData[i * 4 + 3] * stride) * scaleY;

      const faceW = x2 - x1;
      const faceH = y2 - y1;

      if (faceW < 25 || faceH < 25) continue;
      if (faceW > origW * 0.98 || faceH > origH * 0.98) continue;

      const landmarks = [];
      if (kpsData) {
        for (let k = 0; k < 5; k++) {
          const kx = (cx + kpsData[i * 10 + k * 2 + 0] * stride) * scaleX;
          const ky = (cy + kpsData[i * 10 + k * 2 + 1] * stride) * scaleY;
          landmarks.push([kx, ky]);
        }
      }

      allBoxes.push([x1, y1, x2, y2]);
      allScores.push(score);
      allLandmarks.push(landmarks);
    }
  }

  if (allBoxes.length === 0) return [];

  let keepIdx = nms(allBoxes, allScores, 0.40);
  // Sort by confidence — the primary face first.
  keepIdx.sort((a, b) => allScores[b] - allScores[a]);
  // CRITICAL (was missing → ~1000 "faces"): SCRFD naturally emits many weak,
  // scattered anchors that survive NMS because they don't overlap. Anchor on the
  // top-1 detection and only admit a SECOND face if it's high-confidence AND
  // spatially distinct from the primary. Matches onnxPipeline.js decodeSCRFD.
  if (keepIdx.length > 1) {
    const filteredKeep = [keepIdx[0]];
    for (let k = 1; k < keepIdx.length; k++) {
      const idx = keepIdx[k];
      if (allScores[idx] >= 0.6 && iou(allBoxes[keepIdx[0]], allBoxes[idx]) <= 0.15) {
        filteredKeep.push(idx);
      }
    }
    keepIdx = filteredKeep;
  }

  return keepIdx.map(i => {
    const [x1, y1, x2, y2] = allBoxes[i];
    return {
      box: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
      score: allScores[i],
      landmarks: allLandmarks[i]
    };
  });
}

// ─── OffscreenCanvas Preprocessing ─────────────────────────────────────────
function imageToSCRFDTensor(bitmap) {
  if (!_scrfdCanvas) {
    _scrfdCanvas = new OffscreenCanvas(SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE);
    _scrfdCtx = _scrfdCanvas.getContext('2d', { willReadFrequently: true });
  }
  _scrfdCtx.drawImage(bitmap, 0, 0, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE);
  const imgData = _scrfdCtx.getImageData(0, 0, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE).data;

  const float32Data = new Float32Array(1 * 3 * SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE);
  const planeSize = SCRFD_INPUT_SIZE * SCRFD_INPUT_SIZE;

  // RGB format normalized (val - 127.5) / 128.0 (matches onnxPipeline.js)
  for (let i = 0; i < planeSize; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    float32Data[i] = (r - 127.5) / 128.0;                 // Channel 0: Red
    float32Data[planeSize + i] = (g - 127.5) / 128.0;     // Channel 1: Green
    float32Data[2 * planeSize + i] = (b - 127.5) / 128.0; // Channel 2: Blue
  }
  return new ort.Tensor('float32', float32Data, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
}

function estimateAffineTransform(src, dst) {
  const N = src.length;
  let meanX = 0, meanY = 0, meanU = 0, meanV = 0;
  for (let i = 0; i < N; i++) {
    meanX += src[i][0]; meanY += src[i][1];
    meanU += dst[i][0]; meanV += dst[i][1];
  }
  meanX /= N; meanY /= N; meanU /= N; meanV /= N;

  let varX = 0, S_xu = 0, S_xv = 0;
  for (let i = 0; i < N; i++) {
    const x = src[i][0] - meanX, y = src[i][1] - meanY;
    const u = dst[i][0] - meanU, v = dst[i][1] - meanV;
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
}

function cropToArcFaceTensor(bitmap, face) {
  if (!_arcfaceCanvas) {
    _arcfaceCanvas = new OffscreenCanvas(ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);
    _arcfaceCtx = _arcfaceCanvas.getContext('2d', { willReadFrequently: true });
  }

  _arcfaceCtx.fillStyle = '#000';
  _arcfaceCtx.fillRect(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);

  let aligned = false;
  if (face.landmarks && face.landmarks.length >= 5) {
    const transform = estimateAffineTransform(face.landmarks, ARCFACE_DST);
    if (transform) {
      const { m11, m12, m21, m22, dx, dy } = transform;
      _arcfaceCtx.save();
      _arcfaceCtx.setTransform(m11, m12, m21, m22, dx, dy);
      _arcfaceCtx.drawImage(bitmap, 0, 0);
      _arcfaceCtx.restore();
      aligned = true;
    }
  }

  if (!aligned) {
    const box = face.box;
    const pad = 0.2;
    const x = Math.max(0, box.x - box.width * pad);
    const y = Math.max(0, box.y - box.height * pad);
    const w = Math.min(bitmap.width - x, box.width * (1 + 2 * pad));
    const h = Math.min(bitmap.height - y, box.height * (1 + 2 * pad));
    _arcfaceCtx.drawImage(bitmap, x, y, w, h, 0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE);
  }

  const imgData = _arcfaceCtx.getImageData(0, 0, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE).data;
  const float32Data = new Float32Array(1 * 3 * ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE);
  const planeSize = ARCFACE_INPUT_SIZE * ARCFACE_INPUT_SIZE;

  for (let i = 0; i < planeSize; i++) {
    const r = imgData[i * 4];
    const g = imgData[i * 4 + 1];
    const b = imgData[i * 4 + 2];
    float32Data[i] = (b - 127.5) / 128.0;                 // Channel 0: Blue
    float32Data[planeSize + i] = (g - 127.5) / 128.0;     // Channel 1: Green
    float32Data[2 * planeSize + i] = (r - 127.5) / 128.0; // Channel 2: Red
  }
  return new ort.Tensor('float32', float32Data, [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE]);
}

// ─── YOLO (prohibited-item) preprocessing + decode ─────────────────────────
let _yoloCanvas = null;
let _yoloCtx = null;

function imageToYOLOTensor(bitmap) {
  if (!_yoloCanvas) {
    _yoloCanvas = new OffscreenCanvas(YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);
    _yoloCtx = _yoloCanvas.getContext('2d', { willReadFrequently: true });
  }
  // Letterbox to preserve aspect ratio (grey pad, like ultralytics).
  const scale = Math.min(YOLO_INPUT_SIZE / bitmap.width, YOLO_INPUT_SIZE / bitmap.height);
  const newW = Math.round(bitmap.width * scale);
  const newH = Math.round(bitmap.height * scale);
  const padX = Math.floor((YOLO_INPUT_SIZE - newW) / 2);
  const padY = Math.floor((YOLO_INPUT_SIZE - newH) / 2);

  _yoloCtx.fillStyle = 'rgb(114,114,114)';
  _yoloCtx.fillRect(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE);
  _yoloCtx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, padX, padY, newW, newH);

  const imgData = _yoloCtx.getImageData(0, 0, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE).data;
  const planeSize = YOLO_INPUT_SIZE * YOLO_INPUT_SIZE;
  const float32Data = new Float32Array(3 * planeSize);
  // RGB, normalized /255, NCHW.
  for (let i = 0; i < planeSize; i++) {
    float32Data[i] = imgData[i * 4] / 255;
    float32Data[planeSize + i] = imgData[i * 4 + 1] / 255;
    float32Data[2 * planeSize + i] = imgData[i * 4 + 2] / 255;
  }
  return new ort.Tensor('float32', float32Data, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]);
}

// Decode a YOLOv8 detection head. Output is [1, 84, 8400]: 4 box coords
// (cx,cy,w,h) + 80 class scores per anchor, class scores already sigmoided.
// We only keep the classes in YOLO_CLASSES. Coordinates aren't needed by the
// ladder (presence is enough), so we skip box rescaling and just NMS in the
// 640-letterboxed space for de-duplication.
function decodeYOLO(output) {
  const data = output.data;
  const dims = output.dims; // expect [1, 84, 8400] (or transposed [1, 8400, 84])
  if (!data || !dims || dims.length !== 3) return [];

  let numChannels, numAnchors, transposed;
  if (dims[1] === 84 || dims[1] === 84 + 1) {
    numChannels = dims[1]; numAnchors = dims[2]; transposed = false;
  } else {
    numChannels = dims[2]; numAnchors = dims[1]; transposed = true;
  }
  const numClasses = numChannels - 4;

  const at = (channel, anchor) =>
    transposed ? data[anchor * numChannels + channel] : data[channel * numAnchors + anchor];

  const boxes = [];
  const scores = [];
  const classes = [];
  for (let a = 0; a < numAnchors; a++) {
    // Best score only among the classes we care about.
    let bestCls = -1;
    let bestScore = 0;
    for (const clsIdStr of Object.keys(YOLO_CLASSES)) {
      const clsId = Number(clsIdStr);
      const s = at(4 + clsId, a);
      if (s > bestScore) { bestScore = s; bestCls = clsId; }
    }
    if (bestCls < 0 || bestScore < YOLO_CONF_THRESHOLD) continue;

    const cx = at(0, a), cy = at(1, a), w = at(2, a), h = at(3, a);
    boxes.push([cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]);
    scores.push(bestScore);
    classes.push(bestCls);
  }

  if (!boxes.length) return [];
  const keep = nms(boxes, scores, 0.45);
  return keep.map(i => ({ label: YOLO_CLASSES[classes[i]], score: scores[i] }));
}

function calculateGazeAndPose(landmarks) {
  if (!landmarks || landmarks.length < 5) return { gazeDirection: 'Center ✓', yaw: 0, pitch: 0 };
  const [lEye, rEye, nose, lMouth, rMouth] = landmarks;

  const eyeMidX = (lEye[0] + rEye[0]) / 2;
  const eyeSpan = Math.abs(rEye[0] - lEye[0]);
  const yaw = Math.round(((nose[0] - eyeMidX) / (eyeSpan + 1e-6)) * 90);

  const eyeMidY = (lEye[1] + rEye[1]) / 2;
  const mouthMidY = (lMouth[1] + rMouth[1]) / 2;
  const pitch = Math.round((((nose[1] - eyeMidY) / (mouthMidY - eyeMidY + 1e-6)) - 0.5) * 60);

  let gazeDirection = 'Center ✓';
  if (yaw > 25) gazeDirection = 'Right →';
  else if (yaw < -25) gazeDirection = '← Left';
  else if (pitch > 22) gazeDirection = '↓ Down';
  else if (pitch < -22) gazeDirection = '↑ Up';

  return { gazeDirection, yaw, pitch };
}

// ─── Process Frame ────────────────────────────────────────────────────────
async function processFrame(bitmap) {
  if (!isInitialized || !scrfdSession) {
    bitmap.close();
    postMessage({
      type: 'TICK_RESULT',
      verificationStatus: 'model_unavailable',
      isFaceDetected: false,
      faceCount: 0,
      gazeDirection: 'Center ✓',
      similarity: 0,
      faces: []
    });
    return;
  }

  const now = Date.now();
  try {
    const scrfdInputName = scrfdSession.inputNames[0];
    const tensor = imageToSCRFDTensor(bitmap);
    const outputs = await scrfdSession.run({ [scrfdInputName]: tensor });

    const faces = decodeSCRFD(outputs, bitmap.width, bitmap.height);
    const faceCount = faces.length;

    let verificationStatus = 'verified';
    let isFaceDetected = true;

    if (faceCount === 0) {
      verificationStatus = 'no_face';
      isFaceDetected = false;
    } else if (faceCount > 1) {
      verificationStatus = 'multiple_faces';
      isFaceDetected = false;
    }

    // SCRFD 5-point gaze estimate. This is the FALLBACK — when the main thread's
    // MediaPipe Face Mesh is active it overrides this value in the engine.
    const gaze = faceCount === 1
      ? calculateGazeAndPose(faces[0].landmarks)
      : { gazeDirection: 'Center ✓', yaw: 0, pitch: 0 };

    let similarity = 1.0;
    const isStateChanged = previousFaceState !== verificationStatus;
    const isArcfaceDue = (now - lastArcfaceTime > 12000) || isStateChanged;

    if (faceCount === 1 && arcfaceSession && registeredReferenceEmbeddings.length > 0 && isArcfaceDue) {
      lastArcfaceTime = now;
      try {
        const cropTensor = cropToArcFaceTensor(bitmap, faces[0]);
        const arcInputName = arcfaceSession.inputNames[0];
        const arcOut = await arcfaceSession.run({ [arcInputName]: cropTensor });
        const rawEmb = arcOut[arcfaceSession.outputNames[0]]?.data || arcOut[Object.keys(arcOut)[0]].data;
        const liveEmb = normalizeEmbedding(rawEmb);

        let bestSim = -1;
        for (const ref of registeredReferenceEmbeddings) {
          const sim = cosineSimilarity(liveEmb, ref);
          if (sim > bestSim) bestSim = sim;
        }
        similarity = bestSim;
        if (similarity < 0.40) {
          verificationStatus = 'mismatch';
        }
      } catch (err) {
        console.warn('[Worker] ArcFace error:', err);
      }
    }

    // Prohibited-item detection (phone/book/laptop) on its own slower cadence,
    // independent of face state. No-ops when the YOLO model isn't loaded.
    if (yoloSession && (now - lastYoloTime > YOLO_INTERVAL_MS)) {
      lastYoloTime = now;
      try {
        const yTensor = imageToYOLOTensor(bitmap);
        const yInputName = yoloSession.inputNames[0];
        const yOut = await yoloSession.run({ [yInputName]: yTensor });
        const yTensorOut = yOut[yoloSession.outputNames[0]] || yOut[Object.keys(yOut)[0]];
        lastObjects = decodeYOLO(yTensorOut);
      } catch (err) {
        console.warn('[Worker] YOLO error:', err);
      }
    }

    previousFaceState = verificationStatus;

    postMessage({
      type: 'TICK_RESULT',
      verificationStatus,
      isFaceDetected,
      faceCount,
      gazeDirection: gaze.gazeDirection,
      gaze,
      similarity,
      faces,
      objects: lastObjects
    });
  } catch (err) {
    console.error('[Worker] Frame processing error:', err);
  } finally {
    bitmap.close();
  }
}

// ─── Capture a single face embedding (registration) ────────────────────────
// Runs SCRFD (pick the largest face) + ArcFace and returns the normalized
// 512-d embedding. Used by ProctoringSetup so registration and the exam share
// ONE worker — the models load exactly once instead of once per thread.
async function captureEmbedding(bitmap, requestId) {
  const reply = (ok, embedding, error) => postMessage({
    type: 'CAPTURE_RESULT', requestId, ok, embedding, error,
  });
  if (!isInitialized || !scrfdSession || !arcfaceSession) {
    bitmap.close();
    reply(false, null, 'models-not-ready');
    return;
  }
  try {
    const scrfdInputName = scrfdSession.inputNames[0];
    const tensor = imageToSCRFDTensor(bitmap);
    const outputs = await scrfdSession.run({ [scrfdInputName]: tensor });
    const faces = decodeSCRFD(outputs, bitmap.width, bitmap.height);
    if (faces.length === 0) { reply(false, null, 'no_face'); return; }

    // Pick the primary (largest) face in front of the camera, ignoring small background artifacts
    faces.sort((a, b) => (b.box.width * b.box.height) - (a.box.width * a.box.height));
    const targetFace = faces[0];

    const cropTensor = cropToArcFaceTensor(bitmap, targetFace);
    const arcInputName = arcfaceSession.inputNames[0];
    const arcOut = await arcfaceSession.run({ [arcInputName]: cropTensor });
    const rawEmb = arcOut[arcfaceSession.outputNames[0]]?.data || arcOut[Object.keys(arcOut)[0]].data;
    const emb = normalizeEmbedding(rawEmb);
    // Transfer the underlying buffer back to the main thread (zero-copy).
    reply(true, emb, null);
  } catch (err) {
    reply(false, null, err?.message || String(err));
  } finally {
    bitmap.close();
  }
}

// ─── SCRFD-only face detection (registration preview) ──────────────────────
// Lightweight presence scan used by ProctoringSetup's live preview. Runs only
// SCRFD (no ArcFace/MediaPipe/YOLO), so the setup screen can draw face boxes at
// ~20 FPS without the main thread ever loading a model.
async function detectFacesOnly(bitmap, requestId) {
  const reply = (faces) => postMessage({
    type: 'DETECT_RESULT', requestId, faces, faceCount: faces.length,
  });
  if (!isInitialized || !scrfdSession) { bitmap.close(); reply([]); return; }
  try {
    const scrfdInputName = scrfdSession.inputNames[0];
    const tensor = imageToSCRFDTensor(bitmap);
    const outputs = await scrfdSession.run({ [scrfdInputName]: tensor });
    reply(decodeSCRFD(outputs, bitmap.width, bitmap.height));
  } catch (err) {
    console.error('[Worker] detectFacesOnly error:', err);
    reply([]);
  } finally {
    bitmap.close();
  }
}

// ─── Main Worker Event Router ──────────────────────────────────────────────
self.onmessage = async (e) => {
  const { type, payload } = e.data;
  switch (type) {
    case 'INIT':
      await initPipeline();
      break;
    case 'DETECT_FACES':
      if (payload?.bitmap) {
        await detectFacesOnly(payload.bitmap, payload.requestId);
      }
      break;
    case 'SET_REFERENCE_EMBEDDINGS':
      if (payload?.embeddings) {
        registeredReferenceEmbeddings = payload.embeddings;
      }
      break;
    case 'PROCESS_FRAME':
      if (payload?.bitmap) {
        await processFrame(payload.bitmap, payload.options);
      }
      break;
    case 'CAPTURE_EMBEDDING':
      if (payload?.bitmap) {
        await captureEmbedding(payload.bitmap, payload.requestId);
      }
      break;
    default:
      break;
  }
};
