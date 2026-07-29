/**
 * Ported from front-end/src/services/faceQualityService.js. All of this is
 * pure pixel-array / landmark math — identical on native, just fed from
 * skiaImage.js's photoToQualityBuffer() instead of an HTMLCanvasElement.
 */

const BRIGHTNESS_MIN = 35;
const BRIGHTNESS_MAX = 245;
const BLUR_MIN_VARIANCE = 25;
const FACE_AREA_MIN_RATIO = 0.03;
const FACE_CENTER_MARGIN = 0.05;
const DETECTION_MIN_SCORE = 0.4;
const YAW_MAX_DEG = 45;
const PITCH_MAX_DEG = 35;

function computeBrightness(pixels) {
  let sum = 0;
  const n = pixels.length / 4;
  for (let i = 0; i < pixels.length; i += 4) {
    sum += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
  }
  return sum / n;
}

export function checkBrightness(pixels) {
  try {
    const brightness = computeBrightness(pixels);
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
}

function laplacianVariance(pixels, w, h) {
  const grey = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    grey[i] = 0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2];
  }
  let sum = 0, sumSq = 0, n = 0;
  const kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let conv = 0, ki = 0;
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
}

export function checkBlur(pixels, w, h) {
  try {
    const variance = laplacianVariance(pixels, w, h);
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
}

export function checkFaceSize(box, frameW, frameH) {
  const ratio = (box.width * box.height) / (frameW * frameH);
  const passed = ratio >= FACE_AREA_MIN_RATIO;
  return {
    passed,
    score: Math.min(100, (ratio / FACE_AREA_MIN_RATIO) * 80),
    ratio: ratio.toFixed(3),
    message: passed ? '' : 'Move closer to the camera — your face is too small in frame.',
  };
}

export function checkFaceCentering(box, frameW, frameH) {
  const normX = (box.x + box.width / 2) / frameW;
  const normY = (box.y + box.height / 2) / frameH;
  const margin = FACE_CENTER_MARGIN;
  const passed = normX >= margin && normX <= 1 - margin && normY >= margin && normY <= 1 - margin;
  return {
    passed,
    score: passed ? 100 : 30,
    normX: normX.toFixed(2),
    normY: normY.toFixed(2),
    message: passed ? '' : 'Center your face in the camera frame.',
  };
}

/** Points: 0=left_eye, 1=right_eye, 2=nose_tip, 3=left_mouth, 4=right_mouth */
export function checkHeadPose(landmarks) {
  if (!landmarks || landmarks.length < 5) {
    return { passed: true, score: 100, yaw: 0, pitch: 0, direction: 'center', message: '' };
  }
  const [lEye, rEye, nose, lMouth, rMouth] = landmarks;

  const eyeMidX = (lEye[0] + rEye[0]) / 2;
  const eyeSpan = Math.abs(rEye[0] - lEye[0]);
  const yawDeg = ((nose[0] - eyeMidX) / (eyeSpan + 1e-6)) * 90;

  const eyeMidY = (lEye[1] + rEye[1]) / 2;
  const mouthMidY = (lMouth[1] + rMouth[1]) / 2;
  const faceH = mouthMidY - eyeMidY;
  const pitchDeg = ((nose[1] - eyeMidY) / (faceH + 1e-6) - 0.5) * 60;

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

  const passed = Math.abs(yawDeg) <= YAW_MAX_DEG && Math.abs(pitchDeg) <= PITCH_MAX_DEG;
  return {
    passed,
    score: passed ? 100 : 40,
    yaw: Math.round(yawDeg),
    pitch: Math.round(pitchDeg),
    direction,
    message: passed ? '' : message || 'Please face the camera directly.',
  };
}

export function checkEyesVisible(landmarks) {
  if (!landmarks || landmarks.length < 2) return { passed: true, score: 80, message: '' };
  const [lEye, rEye] = landmarks;
  const visible = lEye && rEye && lEye[0] > 0 && rEye[0] > 0;
  return {
    passed: visible,
    score: visible ? 100 : 0,
    message: visible ? '' : 'Eyes not visible — remove glasses, hat, or anything covering your eyes.',
  };
}

export function checkDetectionScore(score) {
  const passed = score >= DETECTION_MIN_SCORE;
  return {
    passed,
    score: Math.round(score * 100),
    message: passed ? '' : 'Face not clearly detected — improve lighting and face position.',
  };
}

/**
 * Run all quality checks on a single detected face.
 * @param {{pixels, width, height, scale}} qualityBuffer  — from photoToQualityBuffer()
 * @param {{box, score, landmarks}} face — box/landmarks in ORIGINAL photo coordinates
 */
export function evaluateFrameQuality(qualityBuffer, face) {
  const { pixels, width: frameW, height: frameH, scale } = qualityBuffer;

  // Rescale the face box from original-photo coordinates into this downsized buffer.
  const box = {
    x: face.box.x * scale,
    y: face.box.y * scale,
    width: face.box.width * scale,
    height: face.box.height * scale,
  };

  const brightness = checkBrightness(pixels);
  const blur = checkBlur(pixels, frameW, frameH);
  const size = checkFaceSize(box, frameW, frameH);
  const centering = checkFaceCentering(box, frameW, frameH);
  const pose = checkHeadPose(face.landmarks);
  const eyes = checkEyesVisible(face.landmarks);
  const confidence = checkDetectionScore(face.score);

  const checks = { brightness, blur, size, centering, pose, eyes, confidence };

  const overallScore = Math.round(
    brightness.score * 0.15 +
      blur.score * 0.2 +
      size.score * 0.2 +
      centering.score * 0.15 +
      pose.score * 0.15 +
      eyes.score * 0.1 +
      confidence.score * 0.05
  );

  const issues = Object.values(checks)
    .filter((c) => !c.passed && c.message)
    .map((c) => c.message);

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
}
