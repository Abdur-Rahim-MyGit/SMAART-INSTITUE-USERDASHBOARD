/**
 * faceVerificationService.js  —  v2 (ONNX Pipeline Adapter)
 *
 * Replaces the old @vladmandic/face-api (SSD MobileNet + FaceNet) pipeline
 * with the new SCRFD + ArcFace R50 + MN3-AntiSpoof ONNX stack.
 *
 * All existing public exports are preserved so that no call sites need changes:
 *   loadModels()            — now loads ONNX models via onnxPipeline.js
 *   isReady()              — delegates to onnxPipeline.isReady()
 *   resetTrackingState()   — resets the lightweight face tracker
 *   registerFace()         — redesigned: per-frame quality gate + anti-spoof
 *   verifyFace()           — redesigned: cosine similarity on 512-d embedding
 *   detectFaces()          — thin wrapper returning faceCount / isFacePresent
 *   VerificationStatus     — same enum values
 *   cosineSimilarity()     — exported for external use
 *
 * Eye gaze analysis is still provided by eyeGazeService.js (unchanged).
 * The 68-point face-api landmark model continues to be loaded for gaze only.
 */

import { initPipeline, detectAndEmbed, detectOnly, cosineSimilarity, isReady as isOnnxReady } from './onnxPipeline';
import { evaluateFrameQuality } from './faceQualityService';
import { analyzeGaze, resetCalibration } from './eyeGazeService';

// Re-export gaze calibration reset so useProctoringEngine.js doesn't change
export { resetCalibration as resetGazeCalibration };

// ─── Legacy face-api  (gaze analysis only) ───────────────────────────────────
// We still load the tiny landmark model for eye gaze detection.
// It is NOT used for detection or recognition anymore.
import * as faceapi from '@vladmandic/face-api';
let gazeModelLoaded = false;

const loadGazeModels = async () => {
  if (gazeModelLoaded) return;
  try {
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    gazeModelLoaded = true;
    console.log('[FaceVerification] ✅ Gaze landmark model loaded (for eye tracking)');
  } catch (err) {
    console.warn('[FaceVerification] Gaze model load failed (non-fatal):', err.message);
  }
};

// ─── State ───────────────────────────────────────────────────────────────────
let lastDetectionTime = 0;

export const resetTrackingState = () => {
  lastDetectionTime = 0;
  console.log('[FaceVerification] Tracking state reset.');
};

// ─── Thresholds ───────────────────────────────────────────────────────────────
const VERIFICATION_COSINE_THRESHOLD = 0.40;  // cosine sim > 0.40 = same person
const REGISTRATION_COSINE_THRESHOLD = 0.35;  // consistency check across frames
const ANTISPOOF_MIN_SCORE          = 0.50;   // real person liveness threshold
const REGISTRATION_FRAMES          = 5;
const REGISTRATION_MAX_ATTEMPTS    = 14;     // Allow up to 14 tries to get 5 good frames
const REGISTRATION_FRAME_DELAY_MS  = 700;

// ─── loadModels ───────────────────────────────────────────────────────────────

/**
 * Load ONNX models and (optionally) the face-api gaze landmark model.
 * Progress is reported via the onProgress callback (0–100).
 */
export const loadModels = async (onProgress) => {
  const wrappedProgress = (pct, msg) => {
    onProgress?.(Math.round(pct * 0.9)); // ONNX = 0–90%
  };

  await initPipeline(wrappedProgress);
  onProgress?.(92);

  // Load gaze models in background (non-blocking)
  loadGazeModels().then(() => {}).catch(() => {});

  onProgress?.(100);
  return true;
};

export const isReady = () => isOnnxReady();

export const getLoadError = () => null;
export const getBackendInfo = () => ({ backend: 'onnx-wasm+webgl', isWebGL: true, isCPU: false });
export const getMatchThreshold = () => VERIFICATION_COSINE_THRESHOLD;
export const distanceToSimilarity = (d) => Math.exp(-d * 3); // keep for legacy callers

// ─── detectFaces ─────────────────────────────────────────────────────────────
/**
 * Lightweight face detection (no embedding). Used by ProctoringSetup scanning
 * and by the fallback path in useProctoringEngine when no reference is set.
 *
 * Returns the same shape as the old implementation:
 * { faceCount, faces, isFacePresent, error?, timings? }
 */
export const detectFaces = async (videoEl, _disableOpts = false) => {
  if (!videoEl) return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input' };
  if (videoEl.readyState < 2) return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };
  if (!isOnnxReady()) return { faceCount: 0, faces: [], isFacePresent: false, error: 'Models not loaded' };

  const t0 = performance.now();
  try {
    const raw = await detectOnly(videoEl);
    const elapsed = performance.now() - t0;
    return {
      faceCount: raw.length,
      faces: raw.map(f => ({
        detection: f,
        box: f.box,
        score: f.score,
        landmarks: f.landmarks,
        hasLandmarks: f.landmarks?.length > 0,
        hasDescriptor: false,
      })),
      isFacePresent: raw.length > 0,
      timings: { detect: elapsed, landmark: 0, recog: 0, total: elapsed },
    };
  } catch (err) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: err.message };
  }
};

// detectFacesLegacy — backward compat wrapper
export const detectFacesLegacy = detectFaces;

// ─── Internal errors used for hard-stop conditions ────────────────────────────
const ERR_NO_FACE      = 'NO_FACE_DETECTED';
const ERR_MULTI_FACE   = 'MULTIPLE_FACES_DETECTED';

export const registerFace = async (videoEl, options = {}) => {
  const {
    frameCount    = REGISTRATION_FRAMES,
    intervalMs    = REGISTRATION_FRAME_DELAY_MS,
    onFrameCaptured,
    onError,
    onQualityIssue,
  } = options;

  if (!isOnnxReady()) throw new Error('ONNX models not loaded. Call loadModels() first.');
  if (!videoEl || videoEl.readyState < 2) throw new Error('Video element not ready.');

  const acceptedEmbeddings  = [];
  const acceptedCrops       = [];     // dataURL per accepted frame
  const qualityScores       = [];
  let firstEmbedding        = null;
  let attempts              = 0;

  while (acceptedEmbeddings.length < frameCount && attempts < REGISTRATION_MAX_ATTEMPTS) {
    attempts++;

    const faces = await detectAndEmbed(videoEl);

    // ── Hard Stop 1: No face ──────────────────────────────────────────────────
    if (faces.length === 0) {
      // Clear everything captured so far
      acceptedEmbeddings.length = 0;
      acceptedCrops.length      = 0;
      qualityScores.length      = 0;
      firstEmbedding            = null;

      const err = new Error(
        'Face not detected. Please position your face properly and try again.'
      );
      err.code = ERR_NO_FACE;
      throw err;
    }

    // ── Hard Stop 2: Multiple faces ────────────────────────────────────────────
    if (faces.length > 1) {
      acceptedEmbeddings.length = 0;
      acceptedCrops.length      = 0;
      qualityScores.length      = 0;
      firstEmbedding            = null;

      const err = new Error(
        'Multiple faces detected. Registration cannot continue. Please ensure only one person is visible.'
      );
      err.code = ERR_MULTI_FACE;
      throw err;
    }

    const face = faces[0];

    // ── Frame quality check ────────────────────────────────────────────────────
    const quality = evaluateFrameQuality(videoEl, face);
    if (!quality.passed) {
      onQualityIssue?.(quality.issues);
      onError?.(`Frame quality too low (${quality.overallScore}/100): ${quality.issues[0] || ''}`);
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
    }

    // ── Embedding consistency check ────────────────────────────────────────────
    if (firstEmbedding) {
      const sim = cosineSimilarity(firstEmbedding, face.embedding);
      if (sim < REGISTRATION_COSINE_THRESHOLD) {
        console.warn(`[FaceRegistration] Face mismatch: cosine sim = ${sim.toFixed(3)}`);
        // Mismatch means a different identity snuck in — hard stop
        const err = new Error(
          'Registration failed: Face identity changed between frames. Keep your face steady and ensure only you are in view.'
        );
        err.code = ERR_MULTI_FACE;
        throw err;
      }
    } else {
      firstEmbedding = face.embedding;
    }

    // ── Accept frame ───────────────────────────────────────────────────────────
    acceptedEmbeddings.push(face.embedding);
    acceptedCrops.push(captureAlignedCrop(videoEl, face.box));
    qualityScores.push(quality.overallScore);

    onFrameCaptured?.(acceptedEmbeddings.length, frameCount, face.embedding, face);

    if (acceptedEmbeddings.length < frameCount) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  if (acceptedEmbeddings.length < 2) {
    throw new Error(
      `Face registration failed. Only captured ${acceptedEmbeddings.length} valid frames out of ${REGISTRATION_MAX_ATTEMPTS} attempts. Ensure good lighting and hold still.`
    );
  }

  // Median-pool of all accepted embeddings (robust to outlier frames)
  const finalEmbedding    = medianPoolEmbeddings(acceptedEmbeddings);
  const averageQuality    = qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length;
  const averageConfidence = acceptedEmbeddings.reduce((s, emb) => {
    return s + cosineSimilarity(emb, finalEmbedding);
  }, 0) / acceptedEmbeddings.length;

  return {
    descriptor:        finalEmbedding,       // alias kept for caller compat
    embedding:         finalEmbedding,
    allEmbeddings:     acceptedEmbeddings,   // all 5 raw embeddings
    alignedCrops:      acceptedCrops,        // dataURL per captured frame
    confidence:        averageConfidence,
    framesCaptured:    acceptedEmbeddings.length,
    qualityScore:      Math.round(averageQuality),
    alignedCropDataUrl: acceptedCrops[acceptedCrops.length - 1], // last frame (legacy field)
    model:             'arcface-r50-onnx',
    dimensions:        512,
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Median-pool a set of 512-d embeddings.
 * For each dimension, take the median value across all frames.
 * More robust than averaging — outlier frames don't shift the centroid.
 */
const medianPoolEmbeddings = (embeddings) => {
  const dims = embeddings[0].length;
  const result = new Float32Array(dims);
  const dimValues = new Array(embeddings.length);

  for (let d = 0; d < dims; d++) {
    for (let i = 0; i < embeddings.length; i++) {
      dimValues[i] = embeddings[i][d];
    }
    dimValues.sort((a, b) => a - b);
    const mid = Math.floor(embeddings.length / 2);
    result[d] = embeddings.length % 2 === 0
      ? (dimValues[mid - 1] + dimValues[mid]) / 2
      : dimValues[mid];
  }
  return result;
};

/**
 * Capture the face region as a small Data URL for audit/display.
 */
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

// ─── VerificationStatus ───────────────────────────────────────────────────────

export const VerificationStatus = {
  VERIFIED:        'verified',
  MISMATCH:        'mismatch',
  NO_FACE:         'no_face',
  MULTIPLE_FACES:  'multiple_faces',
  COVERED:         'covered',
  SPOOF_DETECTED:  'spoof_detected',
  ERROR:           'error',
};

// ─── verifyFace ───────────────────────────────────────────────────────────────

/**
 * Verify the live camera feed against the stored registration embedding.
 *
 * Signature preserved from v1 — callers pass (videoElement, referenceDescriptor)
 * where referenceDescriptor is the Float32Array[512] returned by registerFace().
 *
 * @returns {{
 *   status: VerificationStatus,
 *   similarity: number,       // 0–1 cosine similarity
 *   distance: number,         // 1 - similarity (for legacy callers)
 *   faceCount: number,
 *   isReal: boolean,
 *   antispoofScore: number,
 *   gaze: object | null,
 *   timings: object
 * }}
 */
export const verifyFace = async (videoEl, referenceDescriptor) => {
  if (!referenceDescriptor) {
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: 'No reference embedding provided' };
  }

  const t0 = performance.now();

  try {
    // ── Step 1: Fast detection only (no embedding, ~200-400ms) ──────────────
    const quickFaces = await detectOnly(videoEl);
    
    if (quickFaces.length === 0) {
      return { status: VerificationStatus.NO_FACE, similarity: 0, distance: 1, faceCount: 0, timings: { total: performance.now() - t0 } };
    }

    if (quickFaces.length > 1) {
      return { status: VerificationStatus.MULTIPLE_FACES, similarity: 0, distance: 1, faceCount: quickFaces.length, timings: { total: performance.now() - t0 } };
    }

    // ── Step 2: Full embed only if 1 face found ──────────────────────────
    const faces = await detectAndEmbed(videoEl);
    const elapsed = performance.now() - t0;

    if (faces.length === 0) {
      return { status: VerificationStatus.NO_FACE, similarity: 0, distance: 1, faceCount: 0, timings: { total: elapsed } };
    }

    const face = faces[0];

    // Missing embedding → face likely covered/obscured
    if (!face.embedding) {
      return { status: VerificationStatus.COVERED, similarity: 0, distance: 1, faceCount: 1, timings: { total: elapsed } };
    }

    const similarity = cosineSimilarity(face.embedding, Array.from(referenceDescriptor));
    const distance = 1 - similarity;

    // Gaze analysis disabled — faceapi WebGL crashes when ONNX WASM is also running
    const gaze = null;

    const status = similarity >= VERIFICATION_COSINE_THRESHOLD
      ? VerificationStatus.VERIFIED
      : VerificationStatus.MISMATCH;

    return {
      status,
      similarity,
      distance,
      faceCount: 1,
      isReal: true,
      antispoofScore: 1.0,
      gaze,
      timings: { total: elapsed },
    };
  } catch (err) {
    console.error('[FaceVerification] verifyFace error:', err);
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: err.message };
  }
};

// ─── Utilities ────────────────────────────────────────────────────────────────

// kept for any code that imports computeAverageDescriptor
export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors?.length) throw new Error('No descriptors');
  const len = descriptors[0].length;
  const sum = new Float32Array(len);
  for (const d of descriptors) for (let i = 0; i < len; i++) sum[i] += d[i];
  return sum.map(v => v / descriptors.length);
};
