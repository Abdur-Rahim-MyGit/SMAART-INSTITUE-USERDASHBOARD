/**
 * objectDetectionClient.js
 *
 * Thin request/response wrapper around objectDetection.worker.js. One worker
 * per page; one detection in flight at a time (a second request while the
 * first is running is answered with null, and the engine simply skips that
 * tick rather than queueing work behind a slow model).
 */
let worker = null;
let supported = typeof Worker !== 'undefined' && typeof createImageBitmap !== 'undefined';
let initPromise = null;
let modelName = null;
let seq = 0;
const pending = new Map(); // id -> { resolve, timer }

const handleMessage = (e) => {
  const msg = e.data || {};
  if (msg.type === 'INIT_COMPLETE') {
    modelName = msg.model || null;
    initPromise?.resolveInit?.(modelName);
    return;
  }
  if (msg.type === 'RESULT') {
    const entry = pending.get(msg.id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.delete(msg.id);
    entry.resolve({ found: msg.found || [], nearMisses: msg.nearMisses || [], error: msg.error });
  }
};

const ensureWorker = () => {
  if (worker || !supported) return worker;
  try {
    worker = new Worker(new URL('./objectDetection.worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = handleMessage;
    worker.onerror = (err) => console.error('[ObjectDetectionClient] worker error:', err?.message || err);
  } catch (err) {
    supported = false;
    worker = null;
    console.warn('[ObjectDetectionClient] Web Worker unsupported:', err?.message || err);
  }
  return worker;
};

/** Load the detector in the worker. Resolves with the model file name, or null. */
export const initObjectDetectionWorker = () => {
  if (initPromise) return initPromise.promise;
  const w = ensureWorker();
  if (!w) return Promise.resolve(null);
  let resolveInit;
  const promise = new Promise((resolve) => { resolveInit = resolve; });
  initPromise = { promise, resolveInit };
  w.postMessage({ type: 'INIT' });
  return promise;
};

export const isObjectWorkerReady = () => !!(worker && modelName);
export const getObjectWorkerModel = () => modelName;
export const isObjectWorkerBusy = () => pending.size > 0;

/**
 * Detect prohibited objects in the current video frame, off the main thread.
 * Returns null when the worker is unavailable or already busy.
 */
export const detectObjectsInWorker = async (videoEl, { face = null, timeoutMs = 8000 } = {}) => {
  if (!isObjectWorkerReady() || !videoEl || videoEl.readyState < 2) return null;
  if (pending.size > 0) return null;
  let bitmap;
  try {
    bitmap = await createImageBitmap(videoEl);
  } catch {
    return null;
  }
  const id = ++seq;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      resolve({ found: [], nearMisses: [], error: 'timeout' });
    }, timeoutMs);
    pending.set(id, { resolve, timer });
    worker.postMessage({ type: 'DETECT', id, bitmap, face }, [bitmap]);
  });
};
