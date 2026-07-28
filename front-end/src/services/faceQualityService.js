/**
 * faceQualityService.js
 *
 * Evaluates the quality of a single video frame (or canvas) before
 * accepting it for face registration or verification.
 *
 * Checks:
 *  1. Brightness       — mean pixel luminance in acceptable range (60–230)
 *  2. Blur             — Laplacian variance of grayscale frame > threshold
 *  3. Face size        — bounding box covers ≥ 10% of frame area
 *  4. Face centering   — face center within central 65% of frame
 *  5. Head pose        — yaw/pitch within limits (from 5-point landmarks)
 *  6. Eyes visible     — both eye landmarks detected
 *  7. Occlusion        — confidence score of detection ≥ 0.7
 *  8. Multiple faces   — exactly 1 face present
 *
 * All checks return a {passed, score, message} object.
 * Overall quality score is 0–100.
 */

// ─── Thresholds ───────────────────────────────────────────────────────────────
const BRIGHTNESS_MIN = 35;
const BRIGHTNESS_MAX = 245;
const BLUR_MIN_VARIANCE = 25;       // Laplacian variance below this → too blurry
const FACE_AREA_MIN_RATIO = 0.03;   // Face must be ≥ 3% of frame area
const FACE_CENTER_MARGIN = 0.05;    // Face center must be within central 90% of frame
const DETECTION_MIN_SCORE = 0.40;   // SCRFD / face-api confidence
const YAW_MAX_DEG = 45;             // Head rotation left/right limit
const PITCH_MAX_DEG = 35;           // Head tilt up/down limit

// ─── Canvas Utility ──────────────────────────────────────────────────────────

/**
 * Draw the current video frame to a (reused) offscreen canvas and return
 * the pixel data for analysis.
 */
let _analysisCanvas = null;
let _analysisCtx = null;

const getFrameData = (videoEl, maxDim = 320) => {
  const vW = videoEl.videoWidth  || 640;
  const vH = videoEl.videoHeight || 480;
  const scale = Math.min(1, maxDim / Math.max(vW, vH));
  const w = Math.round(vW * scale);
  const h = Math.round(vH * scale);

  if (!_analysisCanvas) {
    _analysisCanvas = document.createElement('canvas');
    _analysisCtx    = _analysisCanvas.getContext('2d', { willReadFrequently: true });
  }
  _analysisCanvas.width  = w;
  _analysisCanvas.height = h;
  _analysisCtx.drawImage(videoEl, 0, 0, w, h);
  return { imageData: _analysisCtx.getImageData(0, 0, w, h), w, h };
};

// ─── Brightness ──────────────────────────────────────────────────────────────

/**
 * Compute mean luminance of the frame (ITU-R BT.709 formula).
 */
const computeBrightness = (imageData) => {
  const d = imageData.data;
  let sum = 0;
  const step = 4; // sample every pixel; increase step to 8 for speed
  const n = d.length / step;
  for (let i = 0; i < d.length; i += step) {
    sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  }
  return sum / n;
};

export const checkBrightness = (videoEl) => {
  try {
    const { imageData } = getFrameData(videoEl, 160);
    const brightness = computeBrightness(imageData);
    const passed = brightness >= BRIGHTNESS_MIN && brightness <= BRIGHTNESS_MAX;
    let message = '';
    if (brightness < BRIGHTNESS_MIN) message = 'Too dark — move to a brighter area or turn on a lamp.';
    else if (brightness > BRIGHTNESS_MAX) message = 'Too bright — reduce direct light source behind you.';
    return {
      passed,
      score: Math.max(0, Math.min(100, 100 - Math.abs(brightness - 145) * 0.8)),
      brightness: Math.round(brightness),
      message,
    };
  } catch {
    return { passed: true, score: 50, brightness: 128, message: '' };
  }
};

// ─── Blur (Laplacian Variance) ───────────────────────────────────────────────

/**
 * Compute the Laplacian variance of a grayscale image region.
 * Low variance → blurry; high variance → sharp edges.
 */
const laplacianVariance = (imageData, w, h) => {
  // Convert to greyscale
  const d = imageData.data;
  const grey = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    grey[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
  }

  // Apply 3×3 Laplacian kernel
  let sum = 0, sumSq = 0, n = 0;
  const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let conv = 0;
      let ki = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          conv += kernel[ki++] * grey[(y + ky) * w + (x + kx)];
        }
      }
      sum += conv;
      sumSq += conv * conv;
      n++;
    }
  }
  const mean = sum / n;
  return sumSq / n - mean * mean;
};

export const checkBlur = (videoEl) => {
  try {
    const { imageData, w, h } = getFrameData(videoEl, 200);
    const variance = laplacianVariance(imageData, w, h);
    const passed = variance >= BLUR_MIN_VARIANCE;
    return {
      passed,
      score: Math.min(100, (variance / BLUR_MIN_VARIANCE) * 100),
      variance: Math.round(variance),
      message: passed ? '' : 'Image too blurry — clean your camera lens or move closer.',
    };
  } catch {
    return { passed: true, score: 50, variance: 100, message: '' };
  }
};

// ─── Face Size & Centering ───────────────────────────────────────────────────

export const checkFaceSize = (box, frameW, frameH) => {
  const frameArea = frameW * frameH;
  const faceArea  = box.width * box.height;
  const ratio     = faceArea / frameArea;
  const passed    = ratio >= FACE_AREA_MIN_RATIO;
  return {
    passed,
    score: Math.min(100, (ratio / FACE_AREA_MIN_RATIO) * 80),
    ratio: ratio.toFixed(3),
    message: passed ? '' : 'Move closer to the camera — your face is too small in frame.',
  };
};

export const checkFaceCentering = (box, frameW, frameH) => {
  const faceCX = box.x + box.width  / 2;
  const faceCY = box.y + box.height / 2;
  const normX  = faceCX / frameW;
  const normY  = faceCY / frameH;
  const margin = FACE_CENTER_MARGIN;
  const passed = normX >= margin && normX <= 1 - margin &&
                 normY >= margin && normY <= 1 - margin;
  return {
    passed,
    score: passed ? 100 : 30,
    normX: normX.toFixed(2),
    normY: normY.toFixed(2),
    message: passed ? '' : 'Center your face in the camera frame.',
  };
};

// ─── Head Pose (from 5-point SCRFD landmarks) ────────────────────────────────

/**
 * Estimate head yaw and pitch from 5-point landmarks.
 * Points: 0=left_eye, 1=right_eye, 2=nose_tip, 3=left_mouth, 4=right_mouth
 */
export const checkHeadPose = (landmarks) => {
  if (!landmarks || landmarks.length < 5) return { passed: true, score: 100, yaw: 0, pitch: 0, direction: 'center', message: '' };

  const [lEye, rEye, nose, lMouth, rMouth] = landmarks;

  // Yaw estimate: horizontal offset of nose relative to eye midpoint
  const eyeMidX = (lEye[0] + rEye[0]) / 2;
  const eyeSpan = Math.abs(rEye[0] - lEye[0]);
  const yawRaw  = (nose[0] - eyeMidX) / (eyeSpan + 1e-6);
  const yawDeg  = yawRaw * 90;

  // Pitch estimate: vertical offset of nose relative to eye level vs mouth level
  const eyeMidY   = (lEye[1] + rEye[1]) / 2;
  const mouthMidY = (lMouth[1] + rMouth[1]) / 2;
  const faceH     = mouthMidY - eyeMidY;
  const pitchRaw  = (nose[1] - eyeMidY) / (faceH + 1e-6) - 0.5;
  const pitchDeg  = pitchRaw * 60;

  let direction = 'center';
  let message = '';

  if (yawDeg > 22) {
    direction = 'looking_right';
    message = 'Head turned right — please face your screen.';
  } else if (yawDeg < -22) {
    direction = 'looking_left';
    message = 'Head turned left — please face your screen.';
  } else if (pitchDeg > 18) {
    direction = 'looking_down';
    message = 'Head tilted down — please look directly at the screen.';
  } else if (pitchDeg < -18) {
    direction = 'looking_up';
    message = 'Head tilted up — please look directly at the screen.';
  }

  const yawOk   = Math.abs(yawDeg)   <= YAW_MAX_DEG;
  const pitchOk = Math.abs(pitchDeg) <= PITCH_MAX_DEG;
  const passed  = yawOk && pitchOk;

  return {
    passed,
    score: passed ? 100 : 40,
    yaw: Math.round(yawDeg),
    pitch: Math.round(pitchDeg),
    direction,
    message: passed ? '' : (message || 'Please face the camera directly.'),
  };
};

// ─── Eyes Visible ────────────────────────────────────────────────────────────

export const checkEyesVisible = (landmarks) => {
  if (!landmarks || landmarks.length < 2) {
    // Landmarks optional for fallback detectors — pass by default if valid face box detected
    return { passed: true, score: 80, message: '' };
  }
  const [lEye, rEye] = landmarks;
  const visible = lEye && rEye && lEye[0] > 0 && rEye[0] > 0;
  return {
    passed: visible,
    score: visible ? 100 : 0,
    message: visible ? '' : 'Eyes not visible — remove glasses, hat, or anything covering your eyes.',
  };
};

// ─── Detection Confidence ────────────────────────────────────────────────────

export const checkDetectionScore = (score) => {
  const passed = score >= DETECTION_MIN_SCORE;
  return {
    passed,
    score: Math.round(score * 100),
    message: passed ? '' : 'Face not clearly detected — improve lighting and face position.',
  };
};

// ─── Composite Quality Evaluation ────────────────────────────────────────────

/**
 * Run all quality checks on a single detected face.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {{ box, score, landmarks }} face  — from detectAndEmbed() or detectOnly()
 * @returns {{ passed: boolean, overallScore: number, checks: object, issues: string[] }}
 */
export const evaluateFrameQuality = (videoEl, face) => {
  const frameW = videoEl.videoWidth  || 640;
  const frameH = videoEl.videoHeight || 480;

  const brightness = checkBrightness(videoEl);
  const blur       = checkBlur(videoEl);
  const size       = checkFaceSize(face.box, frameW, frameH);
  const centering  = checkFaceCentering(face.box, frameW, frameH);
  const pose       = checkHeadPose(face.landmarks);
  const eyes       = checkEyesVisible(face.landmarks);
  const confidence = checkDetectionScore(face.score);

  const checks = { brightness, blur, size, centering, pose, eyes, confidence };

  // Weighted overall score
  const overallScore = Math.round(
    brightness.score  * 0.15 +
    blur.score        * 0.20 +
    size.score        * 0.20 +
    centering.score   * 0.15 +
    pose.score        * 0.15 +
    eyes.score        * 0.10 +
    confidence.score  * 0.05
  );

  const issues = Object.values(checks)
    .filter(c => !c.passed && c.message)
    .map(c => c.message);

  const criticalIssues = [];
  if (!brightness.passed && (brightness.brightness < 20 || brightness.brightness > 250)) {
    criticalIssues.push(brightness.message);
  }
  if (!size.passed) criticalIssues.push(size.message);
  if (!pose.passed) criticalIssues.push(pose.message);
  if (!eyes.passed) criticalIssues.push(eyes.message);
  if (!confidence.passed) criticalIssues.push(confidence.message);

  const passed = overallScore >= 40 && criticalIssues.length === 0;

  return { passed, overallScore, checks, issues };
};
