/**
 * Eye Gaze Service
 *
 * Analyzes eye gaze direction and blink state using the 68-point
 * face landmark model already loaded by faceVerificationService.
 *
 * Landmark index reference (face-api.js):
 *   Left  eye: points 36–41
 *   Right eye: points 42–47
 *
 * Provides:
 *  - Eye Aspect Ratio (EAR) → detect closed eyes / prolonged blinking
 *  - Horizontal gaze ratio  → detect looking LEFT or RIGHT off-screen
 *
 * Zero additional dependencies — reuses the already-loaded face-api model.
 */

// ─── Thresholds ─────────────────────────────────────────────────────────────
const EAR_CLOSED_THRESHOLD = 0.23;   // EAR below this → eye is closed
const GAZE_SIDE_THRESHOLD  = 0.55;   // Ratio above this (right) or below 1-this (left) → looking away
const GAZE_CALIBRATION_FRAMES = 5;   // How many frames to use for centre calibration

// ─── Calibration State ──────────────────────────────────────────────────────
// We store the student's "neutral" gaze ratio during the first few seconds
// so that slight natural asymmetry is normalised.
let calibrationSamples = [];
let calibratedCenter   = 0.5; // default; updated after calibration
let isCalibrated       = false;

// ─── Math Helpers ────────────────────────────────────────────────────────────

/**
 * Euclidean distance between two 2-D points.
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 */
const dist2d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Eye Aspect Ratio — Soukupová & Čech (2016)
 * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
 * 6 points ordered: left-corner, top-left, top-right, right-corner, bot-right, bot-left
 *
 * @param {Array<{x,y}>} pts – 6 eye landmark points
 * @returns {number}
 */
const computeEAR = (pts) => {
  const A = dist2d(pts[1], pts[5]);
  const B = dist2d(pts[2], pts[4]);
  const C = dist2d(pts[0], pts[3]);
  if (C < 0.001) return 0;
  return (A + B) / (2.0 * C);
};

/**
 * Horizontal gaze ratio — where the approximate iris centre sits
 * within the horizontal span of the eye.
 * Returns 0.0 (far left) → 0.5 (centre) → 1.0 (far right).
 *
 * @param {Array<{x,y}>} pts – 6 eye landmark points
 * @returns {number}
 */
const computeGazeRatio = (pts) => {
  const leftX  = pts[0].x;
  const rightX = pts[3].x;
  const span   = rightX - leftX;
  if (span < 1) return 0.5;
  // Average of the four "inner" points ≈ iris centre x
  const irisX = (pts[1].x + pts[2].x + pts[4].x + pts[5].x) / 4;
  return (irisX - leftX) / span;
};

// ─── Calibration ─────────────────────────────────────────────────────────────

/**
 * Reset gaze calibration (call when a new session starts).
 */
export const resetCalibration = () => {
  calibrationSamples = [];
  calibratedCenter   = 0.5;
  isCalibrated       = false;
};

/**
 * Feed a raw gaze ratio sample into the calibration buffer.
 * Once GAZE_CALIBRATION_FRAMES samples are collected the neutral
 * centre is fixed and further calibration calls are no-ops.
 *
 * @param {number} rawRatio
 */
const feedCalibration = (rawRatio) => {
  if (isCalibrated) return;
  calibrationSamples.push(rawRatio);
  if (calibrationSamples.length >= GAZE_CALIBRATION_FRAMES) {
    calibratedCenter = calibrationSamples.reduce((a, b) => a + b, 0) / calibrationSamples.length;
    isCalibrated = true;
    console.log(`[EyeGaze] ✅ Calibrated neutral centre: ${calibratedCenter.toFixed(3)}`);
  }
};

// ─── Main Analysis ───────────────────────────────────────────────────────────

/**
 * Analyse gaze direction and blink state from face-api landmark positions.
 *
 * @param {Object} landmarks – face-api LandmarkResult (.positions array)
 * @returns {{
 *   gazeDirection: 'center'|'left'|'right'|'closed',
 *   eyesOpen: boolean,
 *   leftEAR: number,
 *   rightEAR: number,
 *   avgEAR: number,
 *   leftGaze: number,
 *   rightGaze: number,
 *   avgGaze: number,
 *   calibrated: boolean
 * }}
 */
export const analyzeGaze = (landmarks) => {
  const positions = landmarks.positions;

  const leftEyePts  = positions.slice(36, 42); // indices 36-41
  const rightEyePts = positions.slice(42, 48); // indices 42-47

  const leftEAR  = computeEAR(leftEyePts);
  const rightEAR = computeEAR(rightEyePts);
  const avgEAR   = (leftEAR + rightEAR) / 2;

  const eyesOpen = avgEAR >= EAR_CLOSED_THRESHOLD;

  const leftGaze  = computeGazeRatio(leftEyePts);
  const rightGaze = computeGazeRatio(rightEyePts);
  const avgGaze   = (leftGaze + rightGaze) / 2;

  // Feed calibration if still collecting
  feedCalibration(avgGaze);

  // Determine direction relative to calibrated centre
  let gazeDirection = 'center';
  if (!eyesOpen) {
    gazeDirection = 'closed';
  } else {
    const deviation = avgGaze - calibratedCenter;
    // Positive deviation → looking right; negative → looking left
    if (deviation > (GAZE_SIDE_THRESHOLD - 0.5)) {
      gazeDirection = 'right';
    } else if (deviation < -(GAZE_SIDE_THRESHOLD - 0.5)) {
      gazeDirection = 'left';
    }
  }

  return {
    gazeDirection,
    eyesOpen,
    leftEAR,
    rightEAR,
    avgEAR,
    leftGaze,
    rightGaze,
    avgGaze,
    calibrated: isCalibrated,
  };
};

export default analyzeGaze;
