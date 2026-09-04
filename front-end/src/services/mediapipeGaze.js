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

// ── Eye Aspect Ratio ─────────────────────────────────────────────────────────
// Six-point EAR per eye (Soukupova & Cech). Vertical lid separation over
// horizontal eye width, so it is invariant to how far the candidate sits from
// the camera. Indices are the standard MediaPipe Face Mesh eye contours.
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];   // p1..p6
const LEFT_EYE  = [362, 385, 387, 263, 373, 380];  // p1..p6

// Below this the lids are touching. 0.20 is the conventional operating point;
// blinks pass through it for ~100-150 ms, which is why eyes_closed needs a
// sustained run (the ladder's 8 s amber / 25 s red) before it means anything.
const EAR_CLOSED = 0.20;

/**
 * EAR for one eye. `aspect` corrects for the fact that MediaPipe returns
 * normalised coordinates on a non-square frame — without it a 4:3 webcam
 * squashes the horizontal term and every eye reads as closed.
 */
const eyeAspectRatio = (lm, idx, aspect) => {
  const pt = (i) => ({ x: lm[i].x * aspect, y: lm[i].y });
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  const [p1, p2, p3, p4, p5, p6] = idx.map(pt);
  const horizontal = dist(p1, p4);
  if (horizontal < 1e-6) return null;
  return (dist(p2, p6) + dist(p3, p5)) / (2 * horizontal);
};

/**
 * Compute gaze / head-pose / eye-openness from a video frame.
 *
 * Returns { gazeDirection, yaw, pitch, eyesOpen, ear, headDown } or null
 * (no face / not ready / error).
 *
 * `gazeDirection` uses the SAME lowercase vocabulary as gazeTrackingService
 * ('center' | 'looking_left' | 'looking_right' | 'looking_up' |
 * 'looking_down'). It previously returned decorated strings like 'Center ✓',
 * which matched neither the overlay's comparisons nor the ladder's
 * `dir !== 'center'` test — so the pill rendered blank and every MediaPipe
 * frame counted as looking away.
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

  let gazeDirection = 'center';
  if (yaw > 22) gazeDirection = 'looking_right';
  else if (yaw < -22) gazeDirection = 'looking_left';
  else if (pitch > 18) gazeDirection = 'looking_down';
  else if (pitch < -18) gazeDirection = 'looking_up';

  // ── Eye openness ────────────────────────────────────────────────────────
  // eyesOpen was hard-coded `true` everywhere in the old pipeline, which is
  // why eyes_closed could never fire no matter how long someone slept.
  let eyesOpen = true;
  let ear = null;
  const lm = result?.faceLandmarks?.[0];
  if (lm && lm.length > 468) {
    const w = videoEl.videoWidth || 640;
    const h = videoEl.videoHeight || 480;
    const aspect = h > 0 ? w / h : 1;

    const right = eyeAspectRatio(lm, RIGHT_EYE, aspect);
    const left  = eyeAspectRatio(lm, LEFT_EYE, aspect);
    if (right !== null && left !== null) {
      ear = (right + left) / 2;
      eyesOpen = ear >= EAR_CLOSED;
    }
  }

  // Sustained downward head tilt — the posture a phone in the lap forces.
  // Reported separately from gazeDirection because a candidate can be looking
  // down AND the gaze pill can be showing something else once yaw dominates.
  const headDown = pitch > 18;

  return { gazeDirection, yaw, pitch, eyesOpen, ear, headDown };
}

export default { initGaze, isGazeReady, detectGaze };
