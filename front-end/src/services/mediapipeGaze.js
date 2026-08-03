/**
 * mediapipeGaze.js
 *
 * MediaPipe Face Mesh (FaceLandmarker) gaze / head-pose — runs on the MAIN
 * THREAD. MediaPipe's wasm loader uses importScripts(), which is forbidden in a
 * module worker, so it cannot live in proctoring.worker.js. On the main thread
 * it loads normally and is GPU-accelerated + lightweight (built for realtime
 * webcam use), so it does not block the exam UI.
 *
 * Assets are self-hosted (offline): the wasm fileset under /mediapipe/wasm and
 * the model at /mediapipe/face_landmarker.task. Everything degrades gracefully
 * — if MediaPipe fails to load, the caller keeps the worker's SCRFD gaze.
 */

import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

const MEDIAPIPE_WASM_PATH = '/mediapipe/wasm';
const FACE_LANDMARKER_MODEL = '/mediapipe/face_landmarker.task';

let landmarker = null;
let initPromise = null;
let ready = false;
let lastTs = 0; // detectForVideo requires strictly increasing timestamps

/** Lazy-load the FaceLandmarker once. Idempotent; rejects on failure. */
export function initGaze() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    landmarker = await FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_LANDMARKER_MODEL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numFaces: 1,
      outputFacialTransformationMatrixes: true,
      outputFaceBlendshapes: false,
    });
    ready = true;
    return true;
  })().catch((err) => {
    ready = false;
    landmarker = null;
    console.warn('[MediaPipeGaze] Face Mesh unavailable — keeping SCRFD gaze:', err?.message || err);
    throw err;
  });
  return initPromise;
}

export function isGazeReady() {
  return ready;
}

/**
 * Compute gaze/head-pose from a video frame. Returns { gazeDirection, yaw,
 * pitch } or null (no face / not ready / error). Derives yaw & pitch from the
 * facial transformation matrix (column-major 4x4).
 */
export function detectGaze(videoEl) {
  if (!ready || !landmarker || !videoEl || videoEl.readyState < 2) return null;
  // Strictly-increasing monotonic timestamp (ms) for VIDEO mode.
  let ts = Math.round(performance.now());
  if (ts <= lastTs) ts = lastTs + 1;
  lastTs = ts;

  let result;
  try {
    result = landmarker.detectForVideo(videoEl, ts);
  } catch {
    return null;
  }
  const mats = result?.facialTransformationMatrixes;
  if (!mats || !mats.length || !mats[0]?.data) return null;

  const m = mats[0].data; // column-major 4x4
  const r20 = m[2], r21 = m[6], r22 = m[10];
  const yawRad = Math.atan2(-r20, Math.sqrt(r21 * r21 + r22 * r22));
  const pitchRad = Math.atan2(r21, r22);
  const yaw = Math.round((yawRad * 180) / Math.PI);
  const pitch = Math.round((pitchRad * 180) / Math.PI);

  let gazeDirection = 'Center ✓';
  if (yaw > 22) gazeDirection = 'Right →';
  else if (yaw < -22) gazeDirection = '← Left';
  else if (pitch > 18) gazeDirection = '↓ Down';
  else if (pitch < -18) gazeDirection = '↑ Up';

  return { gazeDirection, yaw, pitch };
}

export default { initGaze, isGazeReady, detectGaze };
