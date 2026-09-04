/**
 * objectDetection.worker.js
 *
 * Runs the prohibited-object detector (YOLOv8, COCO classes) OFF the main
 * thread. The face checks run on the main thread on a 400 ms cadence and the
 * page must stay responsive; a detector pass that can take a second or more
 * on a single WASM thread has no business there. Frames arrive as
 * ImageBitmaps (transferred, not copied), results go back as plain labels.
 *
 * The decode mirrors services/onnxPipeline.js exactly, so the two paths agree.
 */
import * as ort from 'onnxruntime-web';

ort.env.wasm.wasmPaths = '/onnx-wasm/';
ort.env.wasm.simd = true;
ort.env.wasm.numThreads = (typeof self !== 'undefined' && self.crossOriginIsolated)
  ? Math.min(navigator.hardwareConcurrency || 2, 4)
  : 1;

const MODEL_BASE = '/models/onnx';
// First file present wins. A larger export dropped into public/models/onnx
// is picked up without a code change.
const MODEL_CANDIDATES = ['yolov8m.onnx', 'yolov8s.onnx', 'yolov8n.onnx'].map((f) => `${MODEL_BASE}/${f}`);

const INPUT_SIZE = 640;
const CLASSES_OF_INTEREST = { 67: 'phone', 73: 'book', 63: 'laptop' };
const CLASS_THRESHOLDS = { 67: 0.30, 73: 0.40, 63: 0.45 };
const DEFAULT_THRESHOLD = 0.40;
const NEAR_MISS_SCORE = 0.12;
const NMS_THRESHOLD = 0.45;
const MIN_AREA_RATIO = 0.0015;
const NUM_CLASSES = 80;
const PERSON_CLASS = 0;
const PHONE_LIKE = new Set([65, 62, 64, 66]); // remote, tv, mouse, keyboard
const CLASS_NAMES = { 0: 'person', 26: 'handbag', 27: 'tie', 39: 'bottle', 41: 'cup', 62: 'tv', 63: 'laptop', 64: 'mouse', 65: 'remote', 66: 'keyboard', 67: 'phone', 73: 'book', 74: 'clock' };

let session = null;
let modelName = null;
let canvas = null;
let ctx = null;
let zoomLower = false;

const iou = (a, b) => {
  const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
  const x2 = Math.min(a[2], b[2]), y2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter + 1e-6);
};

const nms = (boxes, scores, threshold) => {
  const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep = [];
  const suppressed = new Set();
  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    for (const j of order) {
      if (j !== i && !suppressed.has(j) && iou(boxes[i], boxes[j]) > threshold) suppressed.add(j);
    }
  }
  return keep;
};

const toTensor = (bitmap, region) => {
  if (!canvas) {
    canvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  const vw = bitmap.width, vh = bitmap.height;
  const { sx, sy, sw, sh } = region || { sx: 0, sy: 0, sw: vw, sh: vh };
  const scale = Math.min(INPUT_SIZE / sw, INPUT_SIZE / sh);
  const dw = Math.round(sw * scale), dh = Math.round(sh * scale);
  const padX = Math.floor((INPUT_SIZE - dw) / 2), padY = Math.floor((INPUT_SIZE - dh) / 2);

  ctx.fillStyle = 'rgb(114,114,114)';
  ctx.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE);
  ctx.drawImage(bitmap, sx, sy, sw, sh, padX, padY, dw, dh);

  const { data } = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);
  const pixels = INPUT_SIZE * INPUT_SIZE;
  const t = new Float32Array(3 * pixels);
  for (let i = 0; i < pixels; i++) {
    t[i] = data[i * 4] / 255;
    t[pixels + i] = data[i * 4 + 1] / 255;
    t[2 * pixels + i] = data[i * 4 + 2] / 255;
  }
  return { tensor: new ort.Tensor('float32', t, [1, 3, INPUT_SIZE, INPUT_SIZE]), scale, padX, padY, sx, sy, vw, vh };
};

const runPass = async (bitmap, region, nearMisses) => {
  const { tensor, scale, padX, padY, sx, sy, vw, vh } = toTensor(bitmap, region);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const out = outputs[session.outputNames[0]];
  const dims = out.dims, dataArr = out.data;
  const d1 = dims[1], d2 = dims[2];
  const attrsFirst = d1 <= d2;
  const numAttrs = attrsFirst ? d1 : d2;
  const numAnchors = attrsFirst ? d2 : d1;
  const at = (attr, a) => (attrsFirst ? dataArr[attr * numAnchors + a] : dataArr[a * numAttrs + attr]);
  const numClasses = Math.min(NUM_CLASSES, numAttrs - 4);
  const minArea = MIN_AREA_RATIO * INPUT_SIZE * INPUT_SIZE;
  const found = [];

  for (let a = 0; a < numAnchors; a++) {
    let bestScore = 0, bestCls = -1, bestOther = 0, bestOtherCls = -1;
    for (let c = 0; c < numClasses; c++) {
      const sc = at(4 + c, a);
      if (c in CLASSES_OF_INTEREST) {
        if (sc > bestScore) { bestScore = sc; bestCls = c; }
      } else if (c !== PERSON_CLASS && sc > bestOther) {
        bestOther = sc; bestOtherCls = c;
      }
    }
    if (bestCls < 0 || bestScore < NEAR_MISS_SCORE) continue;
    if (bestOther > bestScore && !(bestCls === 67 && PHONE_LIKE.has(bestOtherCls))) {
      nearMisses.push(`${CLASSES_OF_INTEREST[bestCls]} ${bestScore.toFixed(2)} < ${CLASS_NAMES[bestOtherCls] || `cls${bestOtherCls}`} ${bestOther.toFixed(2)}`);
      continue;
    }
    const threshold = CLASS_THRESHOLDS[bestCls] ?? DEFAULT_THRESHOLD;
    if (bestScore < threshold) {
      nearMisses.push(`${CLASSES_OF_INTEREST[bestCls]} ${bestScore.toFixed(2)}`);
      continue;
    }
    const cx = at(0, a), cy = at(1, a), w = at(2, a), h = at(3, a);
    if (w * h < minArea) continue;
    found.push({
      cls: bestCls,
      score: bestScore,
      box: [
        Math.max(0, sx + (cx - w / 2 - padX) / scale),
        Math.max(0, sy + (cy - h / 2 - padY) / scale),
        Math.min(vw, sx + (cx + w / 2 - padX) / scale),
        Math.min(vh, sy + (cy + h / 2 - padY) / scale),
      ],
    });
  }
  return found;
};

const detect = async (bitmap) => {
  const vw = bitmap.width, vh = bitmap.height;
  const nearMisses = [];
  let found = await runPass(bitmap, null, nearMisses);
  if (found.length === 0) {
    const bandX = Math.round(vw * 0.15), bandW = Math.round(vw * 0.70);
    const zoom = zoomLower
      ? { sx: bandX, sy: Math.round(vh * 0.40), sw: bandW, sh: Math.round(vh * 0.60) }
      : { sx: bandX, sy: 0, sw: bandW, sh: Math.round(vh * 0.60) };
    zoomLower = !zoomLower;
    found = await runPass(bitmap, zoom, nearMisses);
  }
  const unique = [...new Set(nearMisses)];
  if (!found.length) return { found: [], nearMisses: unique };
  const keep = nms(found.map((f) => f.box), found.map((f) => f.score), NMS_THRESHOLD);
  return {
    found: keep.map((i) => ({ cls: found[i].cls, label: CLASSES_OF_INTEREST[found[i].cls], score: found[i].score, box: found[i].box })),
    nearMisses: unique,
  };
};

const init = async () => {
  if (session) { postMessage({ type: 'INIT_COMPLETE', model: modelName }); return; }
  const opts = { executionProviders: ['wasm'], graphOptimizationLevel: 'all', enableCpuMemArena: true, enableMemPattern: true };
  for (const candidate of MODEL_CANDIDATES) {
    try {
      const head = await fetch(candidate, { method: 'HEAD' });
      if (!head.ok) continue;
      session = await ort.InferenceSession.create(candidate, opts);
      modelName = candidate.split('/').pop();
      console.log(`[ObjectWorker] ✅ loaded ${modelName}`);
      break;
    } catch (err) {
      console.warn(`[ObjectWorker] ${candidate} failed:`, err?.message || err);
    }
  }
  postMessage({ type: 'INIT_COMPLETE', model: modelName });
};

self.onmessage = async (e) => {
  const { type, id, bitmap } = e.data || {};
  if (type === 'INIT') { await init(); return; }
  if (type === 'DETECT') {
    try {
      if (!session || !bitmap) { postMessage({ type: 'RESULT', id, found: [], nearMisses: [] }); return; }
      const result = await detect(bitmap);
      postMessage({ type: 'RESULT', id, ...result });
    } catch (err) {
      postMessage({ type: 'RESULT', id, found: [], nearMisses: [], error: err?.message || String(err) });
    } finally {
      try { bitmap?.close?.(); } catch { /* already closed */ }
    }
  }
};
