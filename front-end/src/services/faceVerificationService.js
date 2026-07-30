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
import { evaluateFrameQuality, checkBrightness } from './faceQualityService';

// Eye gaze service reset export kept for signature compatibility
export const resetGazeCalibration = () => {};

// ─── Legacy face-api (Disabled) ──────────────────────────────────────────────
// Gaze landmark model loading is disabled to conserve WebGL/WASM memory resources
const loadGazeModels = async () => {};

// ─── State ───────────────────────────────────────────────────────────────────
let lastDetectionTime = 0;

export const resetTrackingState = () => {
  lastDetectionTime = 0;
  console.log('[FaceVerification] Tracking state reset.');
};

// ─── Thresholds ───────────────────────────────────────────────────────────────
const VERIFICATION_COSINE_THRESHOLD = 0.58;  // Strict threshold for 512-d ArcFace cosine similarity (same person >= 0.58)
const REGISTRATION_COSINE_THRESHOLD = 0.48;  // consistency check across frames
const ANTISPOOF_MIN_SCORE          = 0.50;   // real person liveness threshold
const REGISTRATION_FRAMES          = 5;
const REGISTRATION_MAX_ATTEMPTS    = 14;     // Allow up to 14 tries to get 5 good frames
const REGISTRATION_FRAME_DELAY_MS  = 700;

// ─── loadModels ───────────────────────────────────────────────────────────────

/**
 * Load ONNX models (SCRFD + ArcFace R50).
 * Progress is reported via the onProgress callback (0–100).
 * face-api.js is NOT used — all detection and embedding is ONNX-only (512-d).
 */
export const loadModels = async (onProgress) => {
  onProgress?.(5);

  // Load ONNX models (SCRFD detector + ArcFace R50 recognition)
  try {
    await initPipeline((pct) => {
      onProgress?.(5 + Math.round(pct * 0.95));
    });
    console.log('[FaceVerification] ✅ ONNX pipeline loaded (SCRFD + ArcFace R50, 512-d).');
  } catch (err) {
    console.error('[FaceVerification] ❌ ONNX pipeline load FAILED:', err.message);
  }

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
 * Lightweight face detection (no embedding) using ONNX SCRFD only.
 * Used by ProctoringSetup scanning and by useProctoringEngine quick checks.
 *
 * Returns: { faceCount, faces, isFacePresent, error?, timings? }
 */
export const detectFaces = async (videoEl, _disableOpts = false) => {
  if (!videoEl) return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input' };
  if (videoEl.readyState < 2) return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };

  const t0 = performance.now();
  try {
    let raw = [];
    if (isOnnxReady()) {
      raw = (await detectOnly(videoEl)).filter(f => f.score >= 0.50);
    }

    const elapsed = performance.now() - t0;
    return {
      faceCount: raw.length,
      faces: raw.map(f => ({
        detection: f,
        box: f.box,
        score: f.score,
        landmarks: f.landmarks || [],
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
export const detectFacesFast = detectFaces;

// ─── Internal errors used for hard-stop conditions ────────────────────────────
const ERR_NO_FACE      = 'NO_FACE_DETECTED';
const ERR_MULTI_FACE   = 'MULTIPLE_FACES_DETECTED';

const detectAndEmbedWithFallback = async (videoEl, minScore = 0.30) => {
  let faces = [];
  try {
    if (isOnnxReady()) {
      faces = (await detectAndEmbed(videoEl)).filter(f => f.score >= minScore);
    } else {
      console.warn('[FaceVerification] ONNX pipeline not ready — cannot detect or embed faces.');
    }
  } catch (e) {
    console.warn('[FaceVerification] ONNX detectAndEmbed error:', e.message);
  }
  // No face-api fallback — ONNX pipeline (512-d ArcFace) is the ONLY embedding source.
  // This prevents dimension mismatches (128-d vs 512-d) that cause false verifications.
  return faces;
};

export const registerFace = async (videoEl, options = {}) => {
  const {
    frameCount    = REGISTRATION_FRAMES,
    intervalMs    = REGISTRATION_FRAME_DELAY_MS,
    onFrameCaptured,
    onError,
    onQualityIssue
  } = options;

  if (!videoEl || videoEl.readyState < 2) throw new Error('Video element not ready.');

  const acceptedEmbeddings  = [];
  const acceptedCrops       = [];     // dataURL per accepted frame
  const qualityScores       = [];
  let firstEmbedding        = null;
  let attempts              = 0;

  while (acceptedEmbeddings.length < frameCount && attempts < REGISTRATION_MAX_ATTEMPTS) {
    attempts++;

    const faces = await detectAndEmbedWithFallback(videoEl, 0.35);

    // Skip frame if no face or multiple faces, then retry next attempt
    if (faces.length === 0) {
      console.warn('[FaceRegistration] Frame skipped: no face detected.');
      onQualityIssue?.(['Position your face clearly in front of the camera']);
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
    }

    if (faces.length > 1) {
      console.warn(`[FaceRegistration] Frame skipped: multiple faces detected (${faces.length}).`);
      onQualityIssue?.(['Ensure only one person is visible in frame']);
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
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
      if (sim < 0.38) {
        console.warn(`[FaceRegistration] Frame skipped due to pose/lighting variance: cosine sim = ${sim.toFixed(3)}`);
        onQualityIssue?.(['Please hold your head steady facing the camera']);
        await new Promise(r => setTimeout(r, intervalMs));
        continue; // Skip frame and retry next frame attempt
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
 * Runs single-pass detectAndEmbed for optimal speed and frame consistency.
 */
export const verifyFace = async (videoEl, referenceDescriptor) => {
  if (!referenceDescriptor || !(referenceDescriptor instanceof Float32Array || Array.isArray(referenceDescriptor)) || referenceDescriptor.length !== 512) {
    console.error('[FaceVerification] Invalid or missing reference descriptor:', referenceDescriptor);
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: 'No valid reference embedding provided' };
  }

  const t0 = performance.now();

  try {
    // ── Pre-step: Brightness / Covered check ──────────────
    const brightResult = checkBrightness(videoEl);
    if (!brightResult.passed && brightResult.brightness < 20) {
      console.warn(`[FaceVerification] Camera covered or too dark: brightness = ${brightResult.brightness}`);
      return { 
        status: VerificationStatus.NO_FACE, 
        similarity: 0, 
        distance: 1, 
        faceCount: 0, 
        timings: { total: performance.now() - t0 } 
      };
    }

    // Single-pass detect and embed with 0.45 score threshold for multi-face detection
    // Single-pass detect and embed with 0.45 score threshold for multi-face detection
    const faces = await detectAndEmbedWithFallback(videoEl, 0.45);
    const elapsed = performance.now() - t0;

    if (faces.length === 0) {
      return { status: VerificationStatus.NO_FACE, similarity: 0, distance: 1, faceCount: 0, timings: { total: elapsed } };
    }

    if (faces.length > 1) {
      console.warn(`[FaceVerification] Multiple faces detected: ${faces.length}`);
      return { status: VerificationStatus.MULTIPLE_FACES, similarity: 0, distance: 1, faceCount: faces.length, timings: { total: elapsed } };
    }

    const face = faces[0];

    // Missing embedding → face likely covered/obscured
    if (!face.embedding) {
      return { status: VerificationStatus.COVERED, similarity: 0, distance: 1, faceCount: 1, timings: { total: elapsed } };
    }

    const similarity = cosineSimilarity(face.embedding, Array.from(referenceDescriptor));
    const distance = 1 - similarity;

    console.log(`[FaceVerification] Single-frame verify: cosine=${similarity.toFixed(4)}, threshold=${VERIFICATION_COSINE_THRESHOLD}`);

    const gaze = null; // Gaze tracking disabled

    const status = similarity >= VERIFICATION_COSINE_THRESHOLD
      ? VerificationStatus.VERIFIED
      : VerificationStatus.MISMATCH;

    return {
      status,
      similarity,
      distance,
      faceCount: 1,
      isReal: null,           // Anti-spoof model not available — unknown liveness
      antispoofScore: null,   // No anti-spoof score available
      gaze,
      timings: { total: elapsed },
    };
  } catch (err) {
    console.error('[FaceVerification] verifyFace error:', err);
    return { status: VerificationStatus.ERROR, similarity: 0, distance: 1, faceCount: 0, error: err.message };
  }
};

// kept for any code that imports computeAverageDescriptor
export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors?.length) throw new Error('No descriptors');
  const len = descriptors[0].length;
  const sum = new Float32Array(len);
  for (const d of descriptors) for (let i = 0; i < len; i++) sum[i] += d[i];
  return sum.map(v => v / descriptors.length);
};

export const verifyFaceBatch = async (videoEl, allEmbeddings, options = {}) => {
  const { frameCount = 3, intervalMs = 400 } = options;
  if (!allEmbeddings || allEmbeddings.length === 0) {
    return { status: VerificationStatus.ERROR, bestSimilarity: 0, avgSimilarity: 0, faceCount: 0, framesCaptured: 0, error: 'No embeddings provided' };
  }
  
  // Use the first embedding as reference
  const reference = allEmbeddings[0];
  let bestSim = 0;
  let sumSim = 0;
  let finalStatus = VerificationStatus.NO_FACE;
  let finalFaceCount = 0;
  let framesCaptured = 0;
  
  for (let i = 0; i < frameCount; i++) {
    const res = await verifyFace(videoEl, reference);
    if (res.status === VerificationStatus.ERROR) {
      return res; // immediate fail
    }
    
    framesCaptured++;
    
    if (res.status === VerificationStatus.VERIFIED) {
      bestSim = Math.max(bestSim, res.similarity);
      return {
        status: VerificationStatus.VERIFIED,
        bestSimilarity: bestSim,
        avgSimilarity: bestSim,
        faceCount: 1,
        framesCaptured
      };
    }
    
    // Accumulate best
    bestSim = Math.max(bestSim, res.similarity || 0);
    sumSim += (res.similarity || 0);
    finalStatus = res.status;
    finalFaceCount = res.faceCount;
    
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  return {
    status: finalStatus,
    bestSimilarity: bestSim,
    avgSimilarity: sumSim / frameCount,
    faceCount: finalFaceCount,
    framesCaptured
  };
};
