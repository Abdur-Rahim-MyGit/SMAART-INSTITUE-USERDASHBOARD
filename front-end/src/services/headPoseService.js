/**
 * Head pose estimation from the 68-point face landmarks we already compute.
 *
 * Why this exists: the single most common way to cheat a webcam-proctored exam
 * is a phone in the lap. No browser API can see that phone — but it can see
 * the posture it forces, which is a sustained downward head tilt quite unlike
 * the brief glances people make at a keyboard.
 *
 * This is INFERENCE, not proof. A candidate may be looking at a keyboard, a
 * scratch pad, or simply resting. It is therefore weighted as a flag and never
 * as a verdict, and it needs a long sustained window before it reports at all.
 *
 * Deliberately geometric rather than a solvePnP fit: we run this every second
 * on whatever laptop the candidate owns, and the landmarks are already there,
 * so a few ratios cost nothing.
 */

// face-api's 68-point layout
const IDX = {
  jawLeft: 0,
  chin: 8,
  jawRight: 16,
  noseBridge: 27,
  noseTip: 30,
  leftEyeOuter: 36,
  leftEyeInner: 39,
  rightEyeInner: 42,
  rightEyeOuter: 45,
  mouthLeft: 48,
  mouthRight: 54
};

// Ratio below which the face reads as tilted down. Calibrated per-candidate at
// the start of the session, because face shape and camera height vary hugely —
// a fixed threshold would flag tall people on low laptops all day.
const PITCH_DOWN_FACTOR = 0.78;

// Frames of calibration before the baseline is trusted.
const CALIBRATION_FRAMES = 30;

let baselineRatio = null;
let calibrationSamples = [];

export const resetHeadPoseCalibration = () => {
  baselineRatio = null;
  calibrationSamples = [];
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Estimate head pose.
 *
 * Pitch proxy: the vertical distance from the eye line to the nose tip,
 * normalised by face width. When the head tilts down, the nose tip rises
 * toward the eye line in the projected image and this ratio shrinks.
 *
 * Yaw proxy: how far the nose sits between the two eye corners. Centred is
 * ~0.5; turning the head pushes it toward 0 or 1.
 *
 * @param {object} landmarks - face-api landmarks
 * @returns {{ pose: 'center'|'down'|'left'|'right', pitchRatio: number, yawRatio: number, calibrated: boolean }|null}
 */
export const analyzeHeadPose = (landmarks) => {
  if (!landmarks?.positions || landmarks.positions.length < 68) return null;

  const p = landmarks.positions;

  const leftEyeOuter = p[IDX.leftEyeOuter];
  const rightEyeOuter = p[IDX.rightEyeOuter];
  const noseTip = p[IDX.noseTip];
  const chin = p[IDX.chin];

  const faceWidth = distance(leftEyeOuter, rightEyeOuter);
  if (!faceWidth) return null;

  // Midpoint of the eye line
  const eyeMidY = (leftEyeOuter.y + rightEyeOuter.y) / 2;

  // ── Pitch ──────────────────────────────────────────────────────────────
  // Normalised by face width so it is invariant to how close the candidate
  // sits to the camera — otherwise leaning in would read as looking down.
  const pitchRatio = (noseTip.y - eyeMidY) / faceWidth;

  // ── Yaw ────────────────────────────────────────────────────────────────
  const spanLeft = Math.abs(noseTip.x - leftEyeOuter.x);
  const yawRatio = spanLeft / faceWidth;

  // ── Calibration ────────────────────────────────────────────────────────
  // The first N frames establish this candidate's neutral posture at their own
  // camera height. Until then we never report anything but 'center'.
  if (baselineRatio === null) {
    // Ignore obviously bad frames (chin above the eyes means a bad fit).
    if (chin.y > eyeMidY) calibrationSamples.push(pitchRatio);

    if (calibrationSamples.length >= CALIBRATION_FRAMES) {
      const sorted = [...calibrationSamples].sort((a, b) => a - b);
      // Median, so a few frames of the candidate glancing away during setup
      // cannot skew the baseline.
      baselineRatio = sorted[Math.floor(sorted.length / 2)];
    }

    return { pose: 'center', pitchRatio, yawRatio, calibrated: false };
  }

  let pose = 'center';

  if (pitchRatio < baselineRatio * PITCH_DOWN_FACTOR) {
    pose = 'down';
  } else if (yawRatio < 0.32) {
    pose = 'left';
  } else if (yawRatio > 0.68) {
    pose = 'right';
  }

  return { pose, pitchRatio, yawRatio, calibrated: true };
};

export default analyzeHeadPose;
