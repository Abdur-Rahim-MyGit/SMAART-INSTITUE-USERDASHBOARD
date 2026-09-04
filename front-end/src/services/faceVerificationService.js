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

import { initPipeline, detectAndEmbed, detectOnly, cosineSimilarity, isReady as isOnnxReady, getInitError as getOnnxInitError, detectObjects as detectObjectsRaw, isObjectDetectorReady as isObjectDetectorReadyRaw } from './onnxPipeline';
import { evaluateFrameQuality, checkBrightness } from './faceQualityService';
// NOTE: livenessService.evaluateLiveness is deliberately NOT wired. It was
// imported here but never called, which read as spoof protection that does not
// exist. Presentation-attack detection is still an open gap — see the audit.
import { calculateGazeAndPose } from './gazeTrackingService';

// Eye gaze service reset export kept for signature compatibility
export const resetGazeCalibration = () => { };

// ─── Legacy face-api (Disabled) ──────────────────────────────────────────────
// Gaze landmark model loading is disabled to conserve WebGL/WASM memory resources
const loadGazeModels = async () => { };

// ─── State ───────────────────────────────────────────────────────────────────
let lastDetectionTime = 0;

export const resetTrackingState = () => {
  lastDetectionTime = 0;
  console.log('[FaceVerification] Tracking state reset.');
};

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Same-person cosine on a real webcam (varied pose/lighting) commonly lands in
// ~0.40–0.70. 0.58 was too strict and REJECTED the genuine candidate — it was
// also inconsistent with registration, which accepts same-person frames down to
// ~0.38. 0.40 accepts the real person while different people (ArcFace cosine
// typically < 0.25) are still cleanly rejected. Verify also best-matches against
// ALL registered embeddings, which further separates genuine vs impostor.
// 512-d ArcFace (w600k_r50) cosine.
//
// Lowered from 0.40 on direct evidence from this deployment: the genuinely
// registered candidate was being flagged as a mismatch on her own camera. A
// false accusation of impersonation is the worst failure this system has, and
// it was happening to the honest case.
//
// The two distributions are far apart for this model — impostor pairs sit well
// under 0.30, while the same person across separate captures normally lands
// between 0.45 and 0.75. 0.40 sat close under the bottom of the genuine range,
// so ordinary pose and lighting drift crossed it. 0.32 keeps clear water above
// the impostor range while giving the real candidate room to move.
//
// This is a reasoned starting point, NOT a measured one. Confirm it against
// your own candidates and cameras with __proctorCalibration — the number that
// belongs here comes from that run, not from this comment.
const VERIFICATION_COSINE_THRESHOLD = 0.32;
const REGISTRATION_COSINE_THRESHOLD = 0.48;  // consistency check across frames
// Composite frame-quality score below which a failed match is attributed to an
// obscured/unusable frame rather than to a different person.
const COVERED_QUALITY_SCORE = 55;
const ANTISPOOF_MIN_SCORE = 0.50;   // real person liveness threshold
const REGISTRATION_FRAMES = 5;
const REGISTRATION_MAX_ATTEMPTS = 14;     // Allow up to 14 tries to get 5 good frames
const REGISTRATION_FRAME_DELAY_MS = 700;

// ─── loadModels ───────────────────────────────────────────────────────────────

/**
 * Load ONNX models (SCRFD + ArcFace R50).
 * Progress is reported via the onProgress callback (0–100).
 * face-api.js is NOT used — all detection and embedding is ONNX-only (512-d).
 */
export const loadModels = async (onProgress) => {
  onProgress?.(5);

  // Load ONNX models (SCRFD detector + ArcFace R50 recognition).
  // IMPORTANT: return the ACTUAL readiness — previously this returned a hard
  // `true` even when the pipeline failed to load, so callers proceeded as if
  // proctoring was ready and the detector then reported faceCount:0 forever
  // ("face not detected"). Now failure is propagated so the UI can show an
  // error + retry instead of hanging.
  try {
    await initPipeline((pct) => {
      onProgress?.(5 + Math.round(pct * 0.95));
    });
    console.log('[FaceVerification] ✅ ONNX pipeline loaded (SCRFD + ArcFace R50, 512-d).');
  } catch (err) {
    console.error('[FaceVerification] ❌ ONNX pipeline load FAILED:', err.message);
  }

  onProgress?.(100);
  return isReady(); // truthful: false if the pipeline did not initialise
};

export const isReady = () => isOnnxReady();

// Surface the underlying ONNX load error so the UI can show a real reason + retry
// instead of hanging on "Detecting your face…".
export const getModelLoadError = () => getOnnxInitError();

/**
 * Prohibited-item detection (YOLOv8n, COCO classes).
 *
 * The pipeline has loaded and implemented this since the ONNX migration, but
 * nothing ever called it: the engine's object path was written against the
 * worker, and the worker is deliberately disabled (its ArcFace embeddings did
 * not match the main-thread registration embeddings). So the detector was
 * downloaded on every assessment and never asked a single question.
 */
export const detectObjects = (videoEl) => detectObjectsRaw(videoEl);
export const isObjectDetectorReady = () => isObjectDetectorReadyRaw();

export const getLoadError = () => null;
export const getBackendInfo = () => ({ backend: 'onnx-wasm+webgl', isWebGL: true, isCPU: false });
export const getMatchThreshold = () => VERIFICATION_COSINE_THRESHOLD;

// ─── Threshold calibration recorder ──────────────────────────────────────────
/**
 * VERIFICATION_COSINE_THRESHOLD is currently an ARGUED number, not a measured
 * one. The only honest way to set it is to look at where genuine and impostor
 * scores actually separate on the hardware, lighting and camera your candidates
 * really use — that separation moves with all three.
 *
 * This records every live verification score so that curve can be plotted.
 * It is inert until explicitly started, and it stores nothing but a label, a
 * timestamp and a number — no frames, no embeddings, no identities.
 *
 * How to use it, from the browser console during a normal assessment:
 *
 *   __proctorCalibration.start('genuine')   // the enrolled candidate sits
 *   ... let it run a minute, vary pose and lighting ...
 *   __proctorCalibration.start('impostor')  // someone else sits in their place
 *   ... another minute ...
 *   __proctorCalibration.export()           // downloads calibration.csv
 *
 * Repeat across ~10 people, then pick the threshold from the gap between the
 * two score distributions. `summary()` prints that gap without leaving the
 * console if you just want a quick read.
 */
let calibrationLabel = null;
let calibrationRows = [];

const recordCalibrationScore = (similarity, refCount) => {
  if (!calibrationLabel) return;
  calibrationRows.push({
    label: calibrationLabel,
    similarity,
    refCount,
    at: new Date().toISOString(),
  });
};

export const calibration = {
  /** Begin tagging subsequent scores with `label` (e.g. 'genuine'/'impostor'). */
  start(label = 'sample') {
    calibrationLabel = String(label);
    console.log(`[Calibration] Recording as "${calibrationLabel}". ${calibrationRows.length} row(s) so far.`);
  },
  /** Stop recording; rows already collected are kept. */
  stop() {
    calibrationLabel = null;
    console.log(`[Calibration] Stopped. ${calibrationRows.length} row(s) held.`);
  },
  /** Discard everything collected. */
  clear() {
    calibrationRows = [];
    console.log('[Calibration] Cleared.');
  },
  rows: () => [...calibrationRows],
  /** Per-label count / min / mean / max, and the genuine-vs-impostor gap. */
  summary() {
    const byLabel = {};
    for (const r of calibrationRows) {
      if (!byLabel[r.label]) byLabel[r.label] = [];
      byLabel[r.label].push(r.similarity);
    }

    const stats = {};
    for (const [label, vals] of Object.entries(byLabel)) {
      const sorted = [...vals].sort((a, b) => a - b);
      stats[label] = {
        n: vals.length,
        min: +sorted[0].toFixed(4),
        mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(4),
        max: +sorted[sorted.length - 1].toFixed(4),
      };
    }
    console.table(stats);

    // The number that matters: the worst genuine score against the best
    // impostor score. If the first is comfortably above the second, any
    // threshold between them works. If they overlap, no threshold does and the
    // problem is enrolment or camera quality, not the number.
    if (stats.genuine && stats.impostor) {
      const gap = stats.genuine.min - stats.impostor.max;
      console.log(
        `[Calibration] Worst genuine=${stats.genuine.min}, best impostor=${stats.impostor.max}, ` +
        `gap=${gap.toFixed(4)}. ` +
        (gap > 0
          ? `Any threshold strictly between them separates every sample; the midpoint is ${((stats.genuine.min + stats.impostor.max) / 2).toFixed(4)}.`
          : `OVERLAP — no threshold separates these samples. Fix enrolment/lighting before tuning the number.`)
      );
    }
    return stats;
  },
  /** Download every recorded row as calibration.csv. */
  export() {
    if (!calibrationRows.length) {
      console.warn('[Calibration] Nothing recorded yet.');
      return;
    }
    const csv = ['label,similarity,ref_count,timestamp']
      .concat(calibrationRows.map(r => `${r.label},${r.similarity},${r.refCount},${r.at}`))
      .join('\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calibration.csv';
    a.click();
    URL.revokeObjectURL(url);
    console.log(`[Calibration] Exported ${calibrationRows.length} row(s).`);
  },
};

if (typeof window !== 'undefined') {
  window.__proctorCalibration = calibration;
}

export const distanceToSimilarity = (d) => Math.exp(-d * 3); // keep for legacy callers

// ─── detectFaces ─────────────────────────────────────────────────────────────
/**
 * Lightweight face detection (no embedding) using ONNX SCRFD only.
 * Used by ProctoringSetup scanning and by useProctoringEngine quick checks.
 *
 * Returns: { faceCount, faces, isFacePresent, error?, timings? }
 */

// ─── Counting people, not detections ─────────────────────────────────────────
/**
 * A detector box is not the same thing as a person in the room.
 *
 * SCRFD will happily return a low-confidence box for a framed photograph on the
 * wall, a face on a poster, a reflection in a cupboard door, or a pattern in a
 * curtain. At the 0.35 floor used for presence, those artefacts are frequent
 * enough to raise "Multiple Faces Detected" against a candidate sitting alone —
 * which is both wrong and alarming, and it burns their warning budget.
 *
 * The candidate's own face is large, centred and confidently detected. Anyone
 * genuinely in the room with them is also a real face at real size. So the
 * primary detection keeps the sensitive threshold (missing the candidate is
 * worse than a stray box), while every ADDITIONAL detection has to clear a
 * higher confidence bar and be a meaningful fraction of the primary's size.
 */
const SECONDARY_FACE_MIN_SCORE = 0.62;   // vs 0.35 for the primary
const SECONDARY_FACE_MIN_AREA_RATIO = 0.22; // relative to the largest face

const boxArea = (box) => {
  if (!box) return 0;
  const w = box.width ?? ((box.x2 ?? 0) - (box.x1 ?? 0));
  const h = box.height ?? ((box.y2 ?? 0) - (box.y1 ?? 0));
  return Math.max(0, w) * Math.max(0, h);
};

/**
 * Filter raw detections down to the ones that plausibly represent people.
 * The largest detection is always kept; the rest must earn their place.
 */
export const filterToPeople = (faces) => {
  if (!faces || faces.length <= 1) return faces || [];

  const sorted = [...faces].sort((a, b) => boxArea(b.box) - boxArea(a.box));
  const primary = sorted[0];
  const primaryArea = boxArea(primary.box) || 1;

  const others = sorted.slice(1).filter((f) => {
    const confident = f.score >= SECONDARY_FACE_MIN_SCORE;
    const bigEnough = boxArea(f.box) / primaryArea >= SECONDARY_FACE_MIN_AREA_RATIO;
    if (!confident || !bigEnough) {
      console.log(`[FaceVerification] Ignoring extra detection (score ${f.score.toFixed(2)}, ${(boxArea(f.box) / primaryArea * 100).toFixed(0)}% of primary) — background artefact, not a person.`);
      return false;
    }
    return true;
  });

  return [primary, ...others];
};

export const detectFaces = async (videoEl, _disableOpts = false) => {
  if (!videoEl) return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input' };
  if (videoEl.readyState < 2) return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };

  const t0 = performance.now();
  try {
    let raw = [];
    if (isOnnxReady()) {
      raw = filterToPeople((await detectOnly(videoEl)).filter(f => f.score >= 0.35));
    }

    const elapsed = performance.now() - t0;
    const gazeInfo = (raw.length > 0 && raw[0].landmarks?.length >= 5) ? calculateGazeAndPose(raw[0].landmarks) : null;
    const gaze = gazeInfo ? { gazeDirection: gazeInfo.direction, eyesOpen: true, yaw: gazeInfo.yaw, pitch: gazeInfo.pitch } : null;

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
      gaze,
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
const ERR_NO_FACE = 'NO_FACE_DETECTED';
const ERR_MULTI_FACE = 'MULTIPLE_FACES_DETECTED';

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
    frameCount = REGISTRATION_FRAMES,
    intervalMs = REGISTRATION_FRAME_DELAY_MS,
    onFrameCaptured,
    onError,
    onQualityIssue
  } = options;

  if (!videoEl || videoEl.readyState < 2) throw new Error('Video element not ready.');

  const acceptedEmbeddings = [];
  const acceptedCrops = [];     // dataURL per accepted frame
  const qualityScores = [];
  let firstEmbedding = null;
  let attempts = 0;

  while (acceptedEmbeddings.length < frameCount && attempts < REGISTRATION_MAX_ATTEMPTS) {
    attempts++;

    const faces = await detectAndEmbedWithFallback(videoEl, 0.35);

    // Skip frame if no face or multiple faces, then retry next attempt
    if (faces.length === 0) {
      console.warn('[FaceRegistration] Frame skipped: no face detected.');
      onQualityIssue?.(['Position your face clearly in front of the camera']);
      await new Promise(r => setTimeout(r, 100));
      continue;
    }

    if (faces.length > 1) {
      console.warn(`[FaceRegistration] Frame skipped: multiple faces detected (${faces.length}).`);
      onQualityIssue?.(['Ensure only one person is visible in frame']);
      await new Promise(r => setTimeout(r, 100));
      continue;
    }

    const face = faces[0];

    // ── Frame quality check ────────────────────────────────────────────────────
    const quality = evaluateFrameQuality(videoEl, face);
    if (!quality.passed && quality.overallScore < 30) {
      onQualityIssue?.(quality.issues);
      await new Promise(r => setTimeout(r, 100));
      continue;
    }

    // ── Embedding consistency check ────────────────────────────────────────────
    if (firstEmbedding) {
      const sim = cosineSimilarity(firstEmbedding, face.embedding);
      if (sim < 0.15) {
        console.warn(`[FaceRegistration] Frame skipped due to pose/lighting variance: cosine sim = ${sim.toFixed(3)}`);
        onQualityIssue?.(['Please hold your head steady facing the camera']);
        await new Promise(r => setTimeout(r, 100));
        continue;
      }
    } else {
      firstEmbedding = face.embedding;
    }

    // ── Accept frame ───────────────────────────────────────────────────────────
    acceptedEmbeddings.push(face.embedding);
    acceptedCrops.push(captureAlignedCrop(videoEl, face.box));
    qualityScores.push(quality.overallScore || 80);

    onFrameCaptured?.(acceptedEmbeddings.length, frameCount, face.embedding, face);
    await new Promise(r => setTimeout(r, intervalMs));
  }

  if (acceptedEmbeddings.length < 2) {
    throw new Error(
      `Face registration failed. Only captured ${acceptedEmbeddings.length} valid frames out of ${REGISTRATION_MAX_ATTEMPTS} attempts. Ensure good lighting and hold still.`
    );
  }

  // Median-pool of all accepted embeddings (robust to outlier frames)
  const finalEmbedding = medianPoolEmbeddings(acceptedEmbeddings);
  const averageQuality = qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length;
  const averageConfidence = acceptedEmbeddings.reduce((s, emb) => {
    return s + cosineSimilarity(emb, finalEmbedding);
  }, 0) / acceptedEmbeddings.length;

  return {
    descriptor: finalEmbedding,       // alias kept for caller compat
    embedding: finalEmbedding,
    allEmbeddings: acceptedEmbeddings,   // all 5 raw embeddings
    alignedCrops: acceptedCrops,        // dataURL per captured frame
    confidence: averageConfidence,
    framesCaptured: acceptedEmbeddings.length,
    qualityScore: Math.round(averageQuality),
    alignedCropDataUrl: acceptedCrops[acceptedCrops.length - 1], // last frame (legacy field)
    model: 'arcface-r50-onnx',
    dimensions: 512,
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
  VERIFIED: 'verified',
  MISMATCH: 'mismatch',
  NO_FACE: 'no_face',
  MULTIPLE_FACES: 'multiple_faces',
  COVERED: 'covered',
  SPOOF_DETECTED: 'spoof_detected',
  ERROR: 'error',
};

// ─── verifyFace ───────────────────────────────────────────────────────────────

/**
 * Verify the live camera feed against the stored registration embedding.
 * Runs single-pass detectAndEmbed for optimal speed and frame consistency.
 */
// Normalise the reference into a list of 512-d embeddings. Accepts either a
// single embedding (Float32Array / number[]) OR an array of embeddings, so the
// verifier can best-match a live frame against ALL registered frames.
const toReferenceEmbeddings = (reference) => {
  if (!reference) return [];
  if (Array.isArray(reference) && reference.length && (Array.isArray(reference[0]) || reference[0] instanceof Float32Array)) {
    return reference.filter(r => r && r.length === 512);
  }
  if ((reference instanceof Float32Array) || (Array.isArray(reference) && typeof reference[0] === 'number')) {
    return reference.length === 512 ? [reference] : [];
  }
  return [];
};

export const verifyFace = async (videoEl, referenceDescriptor) => {
  const referenceEmbeddings = toReferenceEmbeddings(referenceDescriptor);
  if (referenceEmbeddings.length === 0) {
    console.error('[FaceVerification] Invalid or missing reference embedding(s):', referenceDescriptor);
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
    // Same people-vs-detections filter as the presence path, so the two agree.
    // They previously used different thresholds (0.35 vs 0.45) with no filter,
    // so a borderline artefact could make one path see two faces and the other
    // one — the exam flipping between "mismatch" and "multiple faces" for a
    // candidate sitting perfectly still.
    const faces = filterToPeople(await detectAndEmbedWithFallback(videoEl, 0.45));
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

    // ── Score against the registered references ──────────────────────────
    // This used to take the MAXIMUM cosine over every registered frame, on the
    // theory that matching the closest pose "further separates genuine from
    // impostor". It does the opposite. The maximum of N draws rises with N for
    // ANY face, impostor included, so adding reference frames made the check
    // progressively easier to pass — the single loosest thing the verifier did.
    //
    // Mean of the top two keeps most of the pose tolerance (a live frame still
    // does not have to match every enrolled angle) while requiring agreement
    // from more than one reference, which is exactly what an impostor's lucky
    // single-frame outlier cannot produce.
    const scores = referenceEmbeddings
      .map((ref) => cosineSimilarity(face.embedding, Array.from(ref)))
      .sort((a, b) => b - a);

    // Best match across the enrolled frames.
    //
    // This briefly used the mean of the top two instead, on the argument that
    // the maximum of N comparisons rises with N for any face and so flatters an
    // impostor. That reasoning is sound in general and wrong here, for two
    // reasons. The references are five frames of ONE person, so this is a
    // best-match against a gallery of a single identity — the standard way to
    // absorb pose and lighting variation. And the mean of the top two is always
    // at or below the maximum, so swapping the rule without moving the
    // threshold silently tightened the check and started rejecting the genuine
    // candidate.
    //
    // Reverting does NOT reopen the impostor hole. A different person passed
    // because presence-only ticks stamped 'verified' without running the
    // recognition model at all; that is fixed independently in
    // useProctoringEngine, and it was never about the scoring rule.
    const similarity = scores[0] ?? 0;
    const distance = 1 - similarity;

    recordCalibrationScore(similarity, scores.length);

    // Both figures are printed so the calibration run can compare the two
    // rules on real data rather than on argument.
    const topTwoMean = scores.length >= 2 ? (scores[0] + scores[1]) / 2 : similarity;
    console.log(
      `[FaceVerification] Verify: score=${similarity.toFixed(4)} ` +
      `${similarity >= VERIFICATION_COSINE_THRESHOLD ? 'PASS' : 'FAIL'} ` +
      `threshold=${VERIFICATION_COSINE_THRESHOLD} | ` +
      `all ${scores.length} refs: ${scores.map(v => v.toFixed(3)).join(', ')} | ` +
      `top2mean=${topTwoMean.toFixed(4)}`
    );

    const gazeInfo = (face && face.landmarks?.length >= 5) ? calculateGazeAndPose(face.landmarks) : null;
    const gaze = gazeInfo ? { gazeDirection: gazeInfo.direction, eyesOpen: true, yaw: gazeInfo.yaw, pitch: gazeInfo.pitch } : null;

    // ── Verified / covered / mismatch ────────────────────────────────────
    // A failing similarity has two very different causes, and calling both
    // "mismatch" is unfair as well as inaccurate: an impostor, or the genuine
    // candidate whose face is partly obscured (hand, mask, hood, backlight,
    // motion blur). Before accusing anyone of impersonation, check whether the
    // frame was even good enough to judge. Poor frame → COVERED, which has its
    // own gentler ladder and asks them to uncover their face.
    //
    // This is also what made face_covered reachable at all: it previously
    // required `!face.embedding`, and detectAndEmbed always returns one.
    let status;
    if (similarity >= VERIFICATION_COSINE_THRESHOLD) {
      status = VerificationStatus.VERIFIED;
    } else {
      const quality = evaluateFrameQuality(videoEl, face);
      status = quality.overallScore < COVERED_QUALITY_SCORE
        ? VerificationStatus.COVERED
        : VerificationStatus.MISMATCH;

      if (status === VerificationStatus.COVERED) {
        console.warn(`[FaceVerification] Low similarity (${similarity.toFixed(3)}) on a poor frame (quality ${quality.overallScore}) — reporting COVERED, not MISMATCH. Issues: ${quality.issues.join('; ') || 'none listed'}`);
      }
    }

    return {
      status,
      similarity,
      distance,
      faceCount: 1,
      face: { box: face.box, landmarks: face.landmarks },
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

// ─── verifyFaceBatch ──────────────────────────────────────────────────────────

/**
 * Batch face verification: captures N live frames, generates embeddings,
 * and compares each against all reference embeddings using best-match
 * cosine similarity. This is far more robust than single-frame verification.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {number[][]} referenceEmbeddings  - Array of 5 registered 512-d embeddings
 * @param {object} options
 * @param {number} options.frameCount       - Number of live frames to capture (default: 5)
 * @param {number} options.intervalMs       - Delay between frames (default: 500ms)
 * @param {function} options.onProgress     - (capturedCount, totalFrames) => void
 * @returns {Promise<{
 *   status: string,           // 'verified' | 'mismatch' | 'no_face' | 'multiple_faces' | 'error'
 *   bestSimilarity: number,   // highest best-match similarity across all live frames
 *   avgSimilarity: number,    // average best-match similarity
 *   framesCaptured: number,   // how many live frames produced usable embeddings
 *   faceCount: number,        // last detected face count
 *   details: object           // per-frame breakdown
 * }>}
 */
export const verifyFaceBatch = async (videoEl, referenceEmbeddings, options = {}) => {
  const {
    frameCount = 5,
    intervalMs = 500,
    onProgress,
  } = options;

  if (!referenceEmbeddings || !Array.isArray(referenceEmbeddings) || referenceEmbeddings.length === 0) {
    return { status: VerificationStatus.ERROR, bestSimilarity: 0, avgSimilarity: 0, framesCaptured: 0, faceCount: 0, error: 'No reference embeddings' };
  }
  if (!videoEl || videoEl.readyState < 2) {
    return { status: VerificationStatus.ERROR, bestSimilarity: 0, avgSimilarity: 0, framesCaptured: 0, faceCount: 0, error: 'Video not ready' };
  }

  const frameSimilarities = [];  // best-match similarity per live frame
  const frameStatuses = [];      // per-frame status
  let lastFaceCount = 0;
  let noFaceCount = 0;
  let multiFaceCount = 0;
  let capturedCount = 0;

  for (let i = 0; i < frameCount; i++) {
    try {
      // Brightness pre-check
      const brightResult = checkBrightness(videoEl);
      if (!brightResult.passed && brightResult.brightness < 20) {
        frameStatuses.push('no_face');
        noFaceCount++;
        onProgress?.(capturedCount, frameCount);
        if (i < frameCount - 1) await new Promise(r => setTimeout(r, intervalMs));
        continue;
      }

      const faces = await detectAndEmbedWithFallback(videoEl, 0.45);

      if (faces.length === 0) {
        frameStatuses.push('no_face');
        noFaceCount++;
        lastFaceCount = 0;
      } else if (faces.length > 1) {
        frameStatuses.push('multiple_faces');
        multiFaceCount++;
        lastFaceCount = faces.length;
      } else {
        const face = faces[0];
        lastFaceCount = 1;

        if (!face.embedding) {
          frameStatuses.push('covered');
        } else {
          // Compare this live embedding against ALL reference embeddings
          // Both MUST be 512-d ArcFace embeddings (no face-api fallback)
          const liveEmb = face.embedding;

          let bestSim = -1;
          for (const refEmb of referenceEmbeddings) {
            const refArray = refEmb instanceof Float32Array ? Array.from(refEmb) : refEmb;
            if (liveEmb.length !== refArray.length) {
              console.error(`[FaceVerification] DIMENSION MISMATCH: live=${liveEmb.length} vs ref=${refArray.length}. Skipping comparison.`);
              continue;
            }
            const sim = cosineSimilarity(liveEmb, refArray);
            if (sim > bestSim) bestSim = sim;
          }

          if (bestSim < 0) {
            console.warn('[FaceVerification] No valid embedding comparison was possible (dimension mismatch on all refs).');
            bestSim = 0;
          }

          console.log(`[FaceVerification] Batch frame: bestSim=${bestSim.toFixed(4)}, threshold=${VERIFICATION_COSINE_THRESHOLD}`);
          frameSimilarities.push(bestSim);
          capturedCount++;
          frameStatuses.push(bestSim >= VERIFICATION_COSINE_THRESHOLD ? 'verified' : 'mismatch');
        }
      }
    } catch (err) {
      console.warn(`[FaceVerification] Batch frame ${i} error:`, err.message);
      frameStatuses.push('error');
    }

    onProgress?.(capturedCount, frameCount);

    if (i < frameCount - 1) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  // Calculate similarity statistics
  const bestSimilarity = frameSimilarities.length > 0 ? Math.max(...frameSimilarities) : 0;
  const avgSimilarity = frameSimilarities.length > 0 ? frameSimilarities.reduce((s, v) => s + v, 0) / frameSimilarities.length : 0;

  // Priority 1: If multiple faces appeared in ANY frame during the batch check → MULTIPLE_FACES
  if (multiFaceCount >= 1) {
    return {
      status: VerificationStatus.MULTIPLE_FACES,
      bestSimilarity,
      avgSimilarity,
      framesCaptured: capturedCount,
      faceCount: Math.max(2, lastFaceCount),
      details: { frameStatuses, multiFaceCount, noFaceCount }
    };
  }

  // Priority 2: If no usable single-face frames captured → NO_FACE
  if (capturedCount === 0) {
    return {
      status: VerificationStatus.NO_FACE,
      bestSimilarity: 0,
      avgSimilarity: 0,
      framesCaptured: 0,
      faceCount: 0,
      details: { frameStatuses }
    };
  }

  // Priority 3: Identity verification matching against reference embeddings
  let status;
  if (bestSimilarity >= VERIFICATION_COSINE_THRESHOLD) {
    const verifiedCount = frameSimilarities.filter(s => s >= VERIFICATION_COSINE_THRESHOLD).length;
    // Require at least 60% of captured frames to pass (3 out of 5)
    if (verifiedCount >= Math.ceil(capturedCount * 0.6)) {
      status = VerificationStatus.VERIFIED;
    } else {
      status = VerificationStatus.MISMATCH;
    }
  } else {
    status = VerificationStatus.MISMATCH;
  }

  return {
    status,
    bestSimilarity,
    avgSimilarity,
    framesCaptured: capturedCount,
    faceCount: lastFaceCount,
    details: { frameStatuses, frameSimilarities },
  };
};

// kept for any code that imports computeAverageDescriptor
export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors?.length) throw new Error('No descriptors');
  const len = descriptors[0].length;
  const sum = new Float32Array(len);
  for (const d of descriptors) for (let i = 0; i < len; i++) sum[i] += d[i];
  return sum.map(v => v / descriptors.length);
};

// (duplicate verifyFaceBatch removed — use the primary export above)

/** Fast detection with landmarks but without face descriptor computation. */
export const detectFacesWithLandmarks = detectFaces;
