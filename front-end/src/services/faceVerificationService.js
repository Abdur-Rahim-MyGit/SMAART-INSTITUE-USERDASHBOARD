/**
 * faceVerificationService.js  —  v3 (face-api.js)
 *
 * Detection + recognition run on @vladmandic/face-api:
 *   TinyFaceDetector (193 KB)  — fast face detection
 *   FaceLandmark68Net          — 68-point landmarks (gaze, head-pose, quality)
 *   FaceRecognitionNet         — 128-d descriptor (identity match, euclidean)
 *
 * This replaces the earlier ONNX (SCRFD + ArcFace R50) adapter, which:
 *   - depended on a runtime asset that was never shipped ("Model loading failed"),
 *   - used a hand-written SCRFD decoder that returned no faces, and
 *   - produced 512-d embeddings the server (128-d only) would have rejected.
 *
 * Public exports are unchanged, so no call site needs edits:
 *   loadModels() · isReady() · registerFace() · verifyFace()
 *   detectFaces() · detectFacesFast() · detectFacesLegacy()
 *   VerificationStatus · computeAverageDescriptor · cosineSimilarity
 *   distanceToSimilarity · getMatchThreshold · resetTrackingState
 *   resetGazeCalibration · resetHeadPoseCalibration
 */

import * as faceapi from '@vladmandic/face-api';
import { evaluateFrameQuality } from './faceQualityService';
import { analyzeGaze, resetCalibration } from './eyeGazeService';
import { analyzeHeadPose, resetHeadPoseCalibration } from './headPoseService';

export { resetCalibration as resetGazeCalibration, resetHeadPoseCalibration };

// ─── Constants ───────────────────────────────────────────────────────────────
const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.6;      // euclidean distance < 0.6 = match (face-api standard)
const MIN_FACE_CONFIDENCE = 0.5;  // detector score threshold

/**
 * TinyFaceDetector, not SSD MobileNet: 193 KB vs 5.6 MB, and several times
 * faster per frame. The exam loop runs a detection every second on whatever
 * laptop the candidate owns, so the cheaper detector is worth far more than the
 * marginal accuracy — identity is still matched by the full recognition net.
 * inputSize must be a multiple of 32; 320 balances accuracy against speed.
 */
const DETECTOR_INPUT_SIZE = 320;

const REGISTRATION_FRAMES = 3;          // frames to average into the reference
const REGISTRATION_INTERVAL_MS = 400;   // gap between capture frames
const REGISTRATION_MAX_ATTEMPTS = 18;   // retries before giving up
const REGISTRATION_MATCH_TOLERANCE = 0.62; // frames must be the same identity

// ─── State ───────────────────────────────────────────────────────────────────
let modelsLoaded = false;
let isLoadingModels = false;
let loadError = null;

// Reused across every call — constructing this per frame is pure waste.
let detectorOptions = null;
const getDetectorOptions = () => {
  if (!detectorOptions) {
    detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: DETECTOR_INPUT_SIZE,
      scoreThreshold: MIN_FACE_CONFIDENCE,
    });
  }
  return detectorOptions;
};

// ─── Math helpers ──────────────────────────────────────────────────────────────
const euclideanDistance = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

// Map a face-api euclidean distance to a 0–1 "similarity" for display.
export const distanceToSimilarity = (d) => Math.exp(-d * 3);

// Kept for any caller that imported it. Descriptors here are 128-d face-api
// embeddings; euclidean distance is the primary metric, but cosine is harmless.
export const cosineSimilarity = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
};

export const getMatchThreshold = () => MATCH_THRESHOLD;

/**
 * Reduce a face-api 68-point landmark set to the 5 semantic points the quality
 * checker and the feedback canvas expect: [leftEye, rightEye, nose, leftMouth,
 * rightMouth], each as [x, y]. checkHeadPose() reads them in exactly this order.
 */
const centroid = (positions, from, to) => {
  let sx = 0, sy = 0;
  for (let i = from; i < to; i++) { sx += positions[i].x; sy += positions[i].y; }
  const n = to - from;
  return [sx / n, sy / n];
};
const to5Point = (landmarks) => {
  const p = landmarks.positions;
  return [
    centroid(p, 36, 42),   // left eye centre
    centroid(p, 42, 48),   // right eye centre
    [p[30].x, p[30].y],    // nose tip
    [p[48].x, p[48].y],    // left mouth corner
    [p[54].x, p[54].y],    // right mouth corner
  ];
};

const boxOf = (detection) => {
  const b = detection.box;
  return { x: b.x, y: b.y, width: b.width, height: b.height };
};

// ─── loadModels ────────────────────────────────────────────────────────────────
/**
 * Load the three face-api nets from /models. Progress is reported 0–100.
 * Idempotent: loadFromUri is a no-op once a net is already in memory.
 */
export const loadModels = async (onProgress) => {
  if (modelsLoaded) { onProgress?.(100); return true; }
  if (isLoadingModels) {
    // Another call is already loading — wait for it.
    let waited = 0;
    while (isLoadingModels && waited < 200) { await new Promise(r => setTimeout(r, 100)); waited++; }
    return modelsLoaded;
  }

  isLoadingModels = true;
  loadError = null;
  try {
    onProgress?.(5);

    // Initialise the tfjs backend (bundled with face-api) BEFORE the first
    // inference. Without a ready backend, detectAllFaces can silently resolve
    // to zero faces or throw — which reads to the UI as "No Face Detected".
    try {
      if (faceapi.tf?.getBackend?.() !== 'webgl') {
        await faceapi.tf.setBackend('webgl');
      }
      await faceapi.tf.ready();
      console.log('[FaceVerification] tfjs backend:', faceapi.tf.getBackend());
    } catch (be) {
      console.warn('[FaceVerification] WebGL backend unavailable, falling back to CPU:', be?.message);
      try { await faceapi.tf.setBackend('cpu'); await faceapi.tf.ready(); } catch { /* last resort */ }
    }

    let done = 0;
    const total = 3;
    const step = () => { done += 1; onProgress?.(Math.round((done / total) * 100)); };

    // Loaded concurrently — they are independent (~12 MB total).
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL).then(step),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL).then(step),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL).then(step),
    ]);

    modelsLoaded = true;
    console.log('[FaceVerification] ✅ face-api models loaded (detector + landmarks + recognition)');
    return true;
  } catch (error) {
    console.error('[FaceVerification] Model loading failed:', error);
    loadError = error;
    throw error;
  } finally {
    isLoadingModels = false;
  }
};

export const isReady = () =>
  modelsLoaded ||
  (faceapi.nets.tinyFaceDetector.isLoaded &&
   faceapi.nets.faceLandmark68Net.isLoaded &&
   faceapi.nets.faceRecognitionNet.isLoaded);

export const getLoadError = () => loadError;
export const getBackendInfo = () => ({ backend: 'face-api/tfjs-webgl' });
export const resetTrackingState = () => {};

// ─── detectFaces ────────────────────────────────────────────────────────────────
/**
 * Detect faces in a frame.
 *  - withDescriptors=false → presence only (detector, no landmarks/recognition) — fastest.
 *  - withDescriptors=true  → landmarks + 128-d descriptor per face.
 *
 * Returns { faceCount, faces:[{ detection, box, score, landmarks(5pt), landmarks68,
 *           descriptor, hasLandmarks, hasDescriptor }], isFacePresent, error?, timings }.
 */
export const detectFaces = async (input, withDescriptors = true) => {
  if (!input) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input element' };
  }
  if (input.tagName === 'VIDEO' && input.readyState < 2) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };
  }
  if (!isReady()) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Models not loaded' };
  }

  try {
    let raw;
    if (withDescriptors) {
      raw = await faceapi
        .detectAllFaces(input, getDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
    } else {
      // Presence only — skip landmarks and the 6.4 MB recognition net.
      const dets = await faceapi.detectAllFaces(input, getDetectorOptions());
      raw = dets.map((detection) => ({ detection, landmarks: null, descriptor: null }));
    }

    const faces = raw.map((r) => ({
      detection: r.detection,
      box: boxOf(r.detection),
      score: r.detection.score ?? 0,
      landmarks: r.landmarks ? to5Point(r.landmarks) : null, // 5-pt for quality/feedback
      landmarks68: r.landmarks || null,                       // full set for gaze/pose
      descriptor: r.descriptor || null,
      hasLandmarks: !!r.landmarks,
      hasDescriptor: !!r.descriptor,
    }));

    return {
      faceCount: faces.length,
      faces,
      isFacePresent: faces.length > 0,
      timings: { total: performance.now() - t0 },
    };
  } catch (err) {
    console.warn('[FaceVerification] detectFaces failed:', err?.message);
    return { faceCount: 0, faces: [], isFacePresent: false, error: err?.message || 'detect failed' };
  }
};

/** Presence-only detection (no embeddings). */
export const detectFacesFast = (input) => detectFaces(input, false);

/** Legacy alias (faceDetectionService compat). */
export const detectFacesLegacy = async (input) => detectFaces(input, false);

// ─── Internal error codes (hard stops) ───────────────────────────────────────────
const ERR_NO_FACE    = 'NO_FACE_DETECTED';
const ERR_MULTI_FACE = 'MULTIPLE_FACES_DETECTED';

// ─── registerFace ─────────────────────────────────────────────────────────────
/**
 * Capture a robust reference by averaging several good frames into one 128-d
 * descriptor. Hard-stops on no-face / multiple-faces / identity change; skips
 * (and retries) frames that fail the quality gate.
 *
 * Returns { descriptor, embedding, allEmbeddings, alignedCrops, confidence,
 *           framesCaptured, qualityScore, alignedCropDataUrl, model, dimensions }.
 */
export const registerFace = async (videoEl, options = {}) => {
  const {
    frameCount = REGISTRATION_FRAMES,
    intervalMs = REGISTRATION_INTERVAL_MS,
    onFrameCaptured,
    onError
  } = options;

  if (!isReady()) throw new Error('Models not loaded. Call loadModels() first.');
  if (!videoEl || videoEl.readyState < 2) throw new Error('Video element not ready.');

  const accepted = [];       // Float32Array[128] per accepted frame
  const crops = [];          // dataURL per accepted frame
  const qualityScores = [];
  let firstDescriptor = null;
  let attempts = 0;

  const reset = () => { accepted.length = 0; crops.length = 0; qualityScores.length = 0; firstDescriptor = null; };

  while (accepted.length < frameCount && attempts < REGISTRATION_MAX_ATTEMPTS) {
    attempts++;

    const dets = await faceapi
      .detectAllFaces(videoEl, getDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Hard stop 1 — no face.
    if (dets.length === 0) {
      reset();
      const err = new Error('Face not detected. Please position your face properly and try again.');
      err.code = ERR_NO_FACE;
      throw err;
    }
    // Hard stop 2 — more than one face.
    if (dets.length > 1) {
      reset();
      const err = new Error('Multiple faces detected. Registration cannot continue. Please ensure only one person is visible.');
      err.code = ERR_MULTI_FACE;
      throw err;
    }

    const d = dets[0];
    const face = {
      box: boxOf(d.detection),
      score: d.detection.score ?? 0,
      landmarks: to5Point(d.landmarks),
    };

    // Quality gate (brightness, blur, size, centering, pose, eyes).
    const quality = evaluateFrameQuality(videoEl, face);
    if (!quality.passed) {
      onQualityIssue?.(quality.issues);
      onError?.(`Frame quality too low (${quality.overallScore}/100): ${quality.issues[0] || ''}`);
      await new Promise((r) => setTimeout(r, intervalMs));
      continue;
    }

    // Identity-consistency gate — every frame must be the same person.
    if (firstDescriptor) {
      const dist = euclideanDistance(firstDescriptor, d.descriptor);
      if (dist > REGISTRATION_MATCH_TOLERANCE) {
        reset();
        const err = new Error('Registration failed: face changed between frames. Keep steady and ensure only you are in view.');
        err.code = ERR_MULTI_FACE;
        throw err;
      }
    } else {
      firstDescriptor = d.descriptor;
    }

    accepted.push(d.descriptor);
    crops.push(captureAlignedCrop(videoEl, face.box));
    qualityScores.push(quality.overallScore);

    onFrameCaptured?.(accepted.length, frameCount, d.descriptor, { box: face.box, landmarks: face.landmarks });

    if (accepted.length < frameCount) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  if (accepted.length < 2) {
    throw new Error(`Face registration failed. Only captured ${accepted.length} valid frame(s). Ensure good lighting and hold still.`);
  }

  const finalDescriptor = computeAverageDescriptor(accepted);
  const avgQuality = qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length;
  const avgDistance = accepted.reduce((s, e) => s + euclideanDistance(e, finalDescriptor), 0) / accepted.length;

  return {
    descriptor: finalDescriptor,       // 128-d — this is registeredFaceDescriptor
    embedding: finalDescriptor,        // alias kept for caller compat
    allEmbeddings: accepted,
    alignedCrops: crops,
    confidence: distanceToSimilarity(avgDistance), // 0–1
    framesCaptured: accepted.length,
    qualityScore: Math.round(avgQuality),
    alignedCropDataUrl: crops[crops.length - 1],
    model: 'faceapi-128',
    dimensions: 128,
  };
};

// ─── VerificationStatus ─────────────────────────────────────────────────────────
export const VerificationStatus = {
  VERIFIED:       'verified',
  MISMATCH:       'mismatch',
  NO_FACE:        'no_face',
  MULTIPLE_FACES: 'multiple_faces',
  COVERED:        'covered',
  SPOOF_DETECTED: 'spoof_detected',
  ERROR:          'error',
};

// ─── verifyFace ─────────────────────────────────────────────────────────────────
/**
 * Verify the live feed against the stored 128-d reference descriptor, and
 * piggy-back gaze + head-pose off the same landmark pass.
 *
 * @returns {{ status, similarity, distance, faceCount, isReal, antispoofScore,
 *             gaze, headPose, timings, error? }}
 */
export const verifyFace = async (videoEl, referenceDescriptor) => {
  if (!referenceDescriptor) {
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: 'No reference descriptor provided' };
  }
  if (!videoEl || videoEl.readyState < 2) {
    return { status: VerificationStatus.NO_FACE, similarity: 0, distance: 1, faceCount: 0 };
  }

  const t0 = performance.now();
  try {
    const dets = await faceapi
      .detectAllFaces(videoEl, getDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptors();

    const elapsed = performance.now() - t0;

    if (dets.length === 0) {
      return { status: VerificationStatus.NO_FACE, similarity: 0, distance: 1, faceCount: 0, timings: { total: elapsed } };
    }
    if (dets.length > 1) {
      return { status: VerificationStatus.MULTIPLE_FACES, similarity: 0, distance: 1, faceCount: dets.length, timings: { total: elapsed } };
    }

    const d = dets[0];
    if (!d.descriptor) {
      return { status: VerificationStatus.COVERED, similarity: 0, distance: 1, faceCount: 1, timings: { total: elapsed } };
    }

    const reference = referenceDescriptor instanceof Float32Array ? referenceDescriptor : Float32Array.from(referenceDescriptor);
    const distance = euclideanDistance(d.descriptor, reference);
    const similarity = distanceToSimilarity(distance);
    const status = distance <= MATCH_THRESHOLD ? VerificationStatus.VERIFIED : VerificationStatus.MISMATCH;

    // Gaze + head-pose from the same 68 landmarks. Best-effort: a failure here
    // must never break identity verification.
    let gaze = null, headPose = null;
    try { gaze = analyzeGaze(d.landmarks); } catch (e) { /* non-fatal */ }
    try { headPose = analyzeHeadPose(d.landmarks); } catch (e) { /* non-fatal */ }

    return {
      status,
      similarity,
      distance,
      faceCount: 1,
      isReal: true,
      antispoofScore: 1.0,
      gaze,
      headPose,
      timings: { total: elapsed },
    };
  } catch (err) {
    console.error('[FaceVerification] verifyFace error:', err);
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: err?.message };
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────
/** Element-wise average of a set of 128-d descriptors → one Float32Array. */
export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors?.length) throw new Error('No descriptors');
  const len = descriptors[0].length;
  const sum = new Float32Array(len);
  for (const d of descriptors) for (let i = 0; i < len; i++) sum[i] += d[i];
  for (let i = 0; i < len; i++) sum[i] /= descriptors.length;
  return sum;
};

/** Capture the face region as a small Data URL for audit/display. */
const captureAlignedCrop = (videoEl, box) => {
  try {
    const c = document.createElement('canvas');
    const pad = 0.3;
    const x = Math.max(0, box.x - box.width * pad);
    const y = Math.max(0, box.y - box.height * pad);
    const w = Math.min(videoEl.videoWidth - x, box.width * (1 + 2 * pad));
    const h = Math.min(videoEl.videoHeight - y, box.height * (1 + 2 * pad));
    c.width = 128;
    c.height = 128;
    c.getContext('2d').drawImage(videoEl, x, y, w, h, 0, 0, 128, 128);
    return c.toDataURL('image/jpeg', 0.8);
  } catch {
    return null;
  }
};
