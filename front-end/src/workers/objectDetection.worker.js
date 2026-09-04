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
// Phone and book bars are low; the engine compensates by requiring the
// object on three of the last five checks before it counts.
//
// Laptop was 0.45. A hand-held phone or book, shown flat toward the camera,
// scores weakly as "laptop" rather than "phone" -- a flat rectangle held up
// reads as a laptop screen to the model -- and 0.45 is the bar for an actual
// desk laptop filling a big share of frame, which scores far higher than that
// in practice. Observed field data: a held phone scored laptop 0.13-0.14
// and was rejected outright by the 0.45 bar. Lowered to 0.28, just above
// phone's 0.25, so a genuinely idle laptop (which scores much higher) still
// clears it easily while a misclassified held object now has a chance.
const CLASS_THRESHOLDS = { 67: 0.25, 73: 0.30, 63: 0.28 };
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

/**
 * Region around the candidate's face and hands, from the last known face box.
 * Objects held up to the camera are held beside or just below the face, so a
 * crop spanning three face-widths either side and from the hairline down to
 * chest height puts them in front of the model at two to three times the
 * size the full frame gives.
 */
const focusFromFace = (face, vw, vh) => {
  if (!face || !(face.width > 0) || !(face.height > 0)) return null;
  const cx = face.x + face.width / 2;
  const w = Math.min(vw, Math.max(face.width * 5, vw * 0.45));
  const h = Math.min(vh, Math.max(face.height * 4.5, vh * 0.55));
  const sx = Math.round(Math.min(Math.max(0, cx - w / 2), vw - w));
  const sy = Math.round(Math.min(Math.max(0, face.y - face.height * 0.6), vh - h));
  return { sx, sy, sw: Math.round(w), sh: Math.round(h) };
};

// Every call used to chain up to THREE sequential inferences (full frame,
// then face-focus, then a band zoom) before answering. That is fine for
// coverage but terrible for latency: a held phone is rarely centred and
// filling the full frame, so the common case burned two or three full model
// passes -- upward of a second on WASM -- before every single result, and
// while that was running the next scheduled tick found the worker still
// busy and was simply skipped. The tick rate collapsed to however long the
// worst-case chain took, not the configured interval.
//
// One inference per call fixes that: each tick is now a single pass, so it
// finishes inside the interval and the NEXT tick is never skipped. Coverage
// across space comes from CHOOSING the right single region rather than
// trying every region every time:
//   - a face box is available on almost every tick (the exam is proctoring
//     a face), and a held object is beside or below it, so that is the
//     region picked by default -- exactly where the thing we are looking
//     for actually is;
//   - every third call instead scans the full frame, so an object away
//     from the face (a laptop left running on the desk, a book off to the
//     side) is still found within a couple of seconds, just not every tick.
let callCount = 0;
const FULL_FRAME_EVERY_N = 3;

const detect = async (bitmap, face) => {
  const vw = bitmap.width, vh = bitmap.height;
  const nearMisses = [];
  callCount++;

  const focus = focusFromFace(face, vw, vh);
  const useFullFrame = !focus || callCount % FULL_FRAME_EVERY_N === 0;

  let region;
  if (useFullFrame) {
    region = null;
  } else {
    region = focus;
  }
  let found = await runPass(bitmap, region, nearMisses);

  // A face-focus miss is worth one fallback look at the wider band -- a
  // held object can sit just outside the tight face crop -- but still only
  // ONE extra pass, never a third.
  if (found.length === 0 && !useFullFrame) {
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

/**
 * A freshly created ONNX session's first run is commonly several times
 * slower than every run after it -- the runtime is still choosing kernels
 * and compiling its execution plan, not just doing arithmetic. Model load
 * happens the moment this worker starts, well before the exam camera is
 * even active (registration and setup give it seconds of head start), so
 * paying that one-time cost here on a throwaway blank frame means the
 * candidate's FIRST real frame, right as the exam opens, is already fast
 * instead of carrying that hidden delay.
 */
const warmUp = async () => {
  try {
    const blank = new ort.Tensor('float32', new Float32Array(3 * INPUT_SIZE * INPUT_SIZE), [1, 3, INPUT_SIZE, INPUT_SIZE]);
    const t0 = Date.now();
    await session.run({ [session.inputNames[0]]: blank });
    console.log(`[ObjectWorker] warm-up pass done in ${Date.now() - t0}ms`);
  } catch (err) {
    console.warn('[ObjectWorker] warm-up pass failed (non-fatal):', err?.message || err);
  }
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
      await warmUp();
      break;
    } catch (err) {
      console.warn(`[ObjectWorker] ${candidate} failed:`, err?.message || err);
    }
  }
  postMessage({ type: 'INIT_COMPLETE', model: modelName });
};

self.onmessage = async (e) => {
  const { type, id, bitmap, face } = e.data || {};
  if (type === 'INIT') { await init(); return; }
  if (type === 'DETECT') {
    try {
      if (!session || !bitmap) { postMessage({ type: 'RESULT', id, found: [], nearMisses: [] }); return; }
      const result = await detect(bitmap, face || null);
      postMessage({ type: 'RESULT', id, ...result });
    } catch (err) {
      postMessage({ type: 'RESULT', id, found: [], nearMisses: [], error: err?.message || String(err) });
    } finally {
      try { bitmap?.close?.(); } catch { /* already closed */ }
    }
  }
};
