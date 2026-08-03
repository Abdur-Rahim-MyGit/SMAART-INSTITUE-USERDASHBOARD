/**
 * proctoringWorkerClient.js
 *
 * Module singleton that owns ONE proctoring.worker.js instance, shared by BOTH
 * the registration step (ProctoringSetup) and the live exam engine
 * (useProctoringEngine). Sharing one worker means the SCRFD + 174 MB ArcFace
 * models load exactly once — registration warms the same worker the exam uses,
 * instead of the old path where the main thread loaded them for registration
 * and the worker loaded them again for the exam (~200 MB wasted).
 *
 * The worker runs 100% of inference (SCRFD, MediaPipe face mesh, ArcFace, YOLO)
 * off the main thread. This client is a thin request/response wrapper.
 */

let worker = null;
let initPromise = null;
let ready = false;
let supported = true;

let captureSeq = 0;
let detectSeq = 0;
const pendingCaptures = new Map(); // requestId -> {resolve, reject, timer}
const pendingDetects = new Map();  // requestId -> {resolve, timer}
const resultListeners = new Set(); // TICK_RESULT callbacks
const progressListeners = new Set(); // INIT_PROGRESS callbacks

function ensureWorker() {
  if (worker || !supported) return worker;
  try {
    worker = new Worker(new URL('./proctoring.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = handleMessage;
    worker.onerror = (err) => {
      // A hard worker error (e.g. failed module load) — surface to any waiter.
      console.error('[ProctoringWorkerClient] Worker error:', err?.message || err);
    };
  } catch (err) {
    supported = false;
    worker = null;
    console.warn('[ProctoringWorkerClient] Web Worker unsupported:', err?.message || err);
  }
  return worker;
}

function handleMessage(e) {
  const data = e.data || {};
  switch (data.type) {
    case 'INIT_PROGRESS':
      progressListeners.forEach((cb) => {
        try { cb(data.progress, data.message); } catch { /* noop */ }
      });
      break;
    case 'INIT_COMPLETE':
      ready = true;
      if (initPromise) initPromise._resolve(true);
      break;
    case 'INIT_ERROR':
      ready = false;
      if (initPromise) initPromise._reject(new Error(data.error || 'worker-init-failed'));
      break;
    case 'TICK_RESULT':
      resultListeners.forEach((cb) => {
        try { cb(data); } catch { /* noop */ }
      });
      break;
    case 'CAPTURE_RESULT': {
      const pending = pendingCaptures.get(data.requestId);
      if (pending) {
        pendingCaptures.delete(data.requestId);
        clearTimeout(pending.timer);
        if (data.ok) pending.resolve(data.embedding);
        else pending.reject(new Error(data.error || 'capture-failed'));
      }
      break;
    }
    case 'DETECT_RESULT': {
      const pending = pendingDetects.get(data.requestId);
      if (pending) {
        pendingDetects.delete(data.requestId);
        clearTimeout(pending.timer);
        pending.resolve({ faces: data.faces || [], faceCount: data.faceCount || 0 });
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Initialize the worker + load all models. Idempotent — repeated calls return
 * the same promise. Rejects if the worker is unsupported or model load fails,
 * so callers can fall back to the main-thread pipeline.
 */
export function init() {
  if (initPromise) return initPromise;
  const w = ensureWorker();
  if (!w) {
    initPromise = Promise.reject(new Error('worker-unsupported'));
    return initPromise;
  }
  let _resolve, _reject;
  initPromise = new Promise((resolve, reject) => { _resolve = resolve; _reject = reject; });
  initPromise._resolve = _resolve;
  initPromise._reject = _reject;
  w.postMessage({ type: 'INIT' });
  return initPromise;
}

/** True once all models are loaded and the worker is serving results. */
export function isReady() {
  return ready;
}

/** True while the worker API is usable (created OK). */
export function isSupported() {
  return supported;
}

/** Push registered reference embeddings for identity verification. */
export function setReference(embeddings) {
  const w = ensureWorker();
  if (!w) return;
  w.postMessage({ type: 'SET_REFERENCE_EMBEDDINGS', payload: { embeddings } });
}

// Capture the current <video> frame as an ImageBitmap for the worker. Direct
// createImageBitmap(video) — routing through an intermediate main-thread canvas
// added a resample that WEAKENED SCRFD (0 detections). The worker resizes to
// 640² itself. Jitter in detection is absorbed by the tolerant scan trigger.
function videoToBitmap(video) {
  return createImageBitmap(video);
}

/**
 * Send a live frame for face/identity/gaze/object processing. Pass the <video>
 * element; the frame is captured via a main-thread canvas, transferred to the
 * worker (zero-copy), and closed there. Results arrive via onResult().
 */
export async function processFrame(video) {
  const w = ensureWorker();
  if (!w || !video || video.readyState < 2) return;
  const bitmap = await videoToBitmap(video);
  w.postMessage({ type: 'PROCESS_FRAME', payload: { bitmap } }, [bitmap]);
}

/**
 * Capture ONE normalized face embedding (registration). Pass the <video>
 * element. Resolves with a Float32Array, or rejects with 'no_face' /
 * 'multiple_faces' / 'models-not-ready' / 'capture-timeout'.
 */
export async function captureEmbedding(video, timeoutMs = 8000) {
  const w = ensureWorker();
  if (!w) return Promise.reject(new Error('worker-unsupported'));
  if (!video || video.readyState < 2) return Promise.reject(new Error('no_face'));
  const bitmap = await videoToBitmap(video);
  const requestId = ++captureSeq;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pendingCaptures.has(requestId)) {
        pendingCaptures.delete(requestId);
        reject(new Error('capture-timeout'));
      }
    }, timeoutMs);
    pendingCaptures.set(requestId, { resolve, reject, timer });
    w.postMessage({ type: 'CAPTURE_EMBEDDING', payload: { bitmap, requestId } }, [bitmap]);
  });
}

/**
 * SCRFD-only presence detection for ONE frame (registration preview). Pass the
 * <video> element. Resolves with { faces, faceCount }. Never rejects — resolves
 * empty on error/timeout so the preview loop keeps running.
 */
export async function detectFacesOnce(video, timeoutMs = 4000) {
  const w = ensureWorker();
  if (!w || !video || video.readyState < 2) return { faces: [], faceCount: 0 };
  const bitmap = await videoToBitmap(video);
  const requestId = ++detectSeq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (pendingDetects.has(requestId)) {
        pendingDetects.delete(requestId);
        resolve({ faces: [], faceCount: 0 });
      }
    }, timeoutMs);
    pendingDetects.set(requestId, { resolve, timer });
    w.postMessage({ type: 'DETECT_FACES', payload: { bitmap, requestId } }, [bitmap]);
  });
}

/** Subscribe to TICK_RESULT messages. Returns an unsubscribe function. */
export function onResult(cb) {
  resultListeners.add(cb);
  return () => resultListeners.delete(cb);
}

/** Subscribe to INIT_PROGRESS messages. Returns an unsubscribe function. */
export function onProgress(cb) {
  progressListeners.add(cb);
  return () => progressListeners.delete(cb);
}

export default {
  init, isReady, isSupported, setReference, processFrame,
  captureEmbedding, detectFacesOnce, onResult, onProgress,
};
