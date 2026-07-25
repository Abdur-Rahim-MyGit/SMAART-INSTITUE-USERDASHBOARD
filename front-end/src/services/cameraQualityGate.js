/**
 * cameraQualityGate.js
 *
 * Pre-assessment camera hardware and live feed quality evaluation.
 * Runs before the face registration step to ensure the camera meets
 * minimum requirements for reliable proctoring.
 *
 * Checks:
 *  1. Resolution   — ≥ 480p (640×480)
 *  2. Frame rate   — ≥ 10 fps
 *  3. Brightness   — mean luminance in [55, 235]
 *  4. Blur         — Laplacian variance > 70 (averaged over 3 frames)
 *  5. Face visible — SCRFD detects exactly 1 face
 *  6. Face size    — bounding box ≥ 10% of frame area
 *  7. Stability    — face center displacement < 30px across 3 frames
 *
 * Returns a structured report that ProctoringSetup renders as a checklist.
 */

import { checkBrightness, checkBlur, checkFaceSize, checkFaceCentering } from './faceQualityService';
import { detectFacesFast } from './faceVerificationService';

// ─── Resolution Check ─────────────────────────────────────────────────────────

const checkResolution = (stream) => {
  const track = stream?.getVideoTracks?.()?.[0];
  if (!track) return { passed: false, score: 0, message: 'No video track found.' };

  const settings = track.getSettings?.() || {};
  const w = settings.width  || 0;
  const h = settings.height || 0;

  const passed = w >= 640 && h >= 480;
  return {
    passed,
    score: passed ? 100 : Math.round((Math.min(w, 640) / 640) * 100),
    width: w,
    height: h,
    message: passed
      ? ''
      : `Camera resolution too low (${w}×${h}). Use your laptop camera or a higher-resolution webcam.`,
  };
};

// ─── FPS Check ────────────────────────────────────────────────────────────────

const checkFPS = (stream) => {
  const track = stream?.getVideoTracks?.()?.[0];
  if (!track) return { passed: false, score: 0, message: 'No video track.' };

  const settings = track.getSettings?.() || {};
  const fps = settings.frameRate || 0;

  const passed = fps >= 10;
  return {
    passed,
    score: Math.min(100, Math.round((fps / 15) * 100)),
    fps: Math.round(fps),
    message: passed ? '' : `Frame rate too low (${Math.round(fps)}fps). Close other camera-using apps.`,
  };
};

// ─── Face Stability ───────────────────────────────────────────────────────────

const checkFaceStability = (positions) => {
  if (positions.length < 2) return { passed: true, score: 100, message: '' };

  let maxDisp = 0;
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i][0] - positions[i - 1][0];
    const dy = positions[i][1] - positions[i - 1][1];
    maxDisp = Math.max(maxDisp, Math.hypot(dx, dy));
  }

  const passed = maxDisp < 30;
  return {
    passed,
    score: passed ? 100 : Math.max(0, 100 - maxDisp * 2),
    maxDisplacement: Math.round(maxDisp),
    message: passed ? '' : 'Keep your head still during setup.',
  };
};

// ─── Main Gate Function ───────────────────────────────────────────────────────

/**
 * Run all pre-assessment camera quality checks.
 *
 * @param {HTMLVideoElement} videoEl  — The live camera preview element
 * @param {MediaStream}      stream   — The active media stream
 * @param {function}         onProgress (step, total, checkName) => void
 *
 * @returns {Promise<{
 *   allPassed: boolean,
 *   overallScore: number,
 *   checks: {
 *     resolution, fps, brightness, blur, faceVisible, faceSize, faceCentering, stability
 *   },
 *   failedChecks: string[],
 *   guidance: string[]
 * }>}
 */
export const runCameraQualityGate = async (videoEl, stream, onProgress) => {
  const totalSteps = 8;
  let step = 0;
  const tick = (name) => { step++; onProgress?.(step, totalSteps, name); };

  // 1. Resolution
  tick('Resolution');
  const resolution = checkResolution(stream);

  // 2. FPS
  tick('Frame rate');
  const fps = checkFPS(stream);

  // 3. Wait for video to be stable
  await new Promise(r => setTimeout(r, 500));

  // 4. Brightness (average 3 frames)
  tick('Brightness');
  let brightnessSum = 0;
  for (let i = 0; i < 3; i++) {
    const b = checkBrightness(videoEl);
    brightnessSum += b.brightness;
    await new Promise(r => setTimeout(r, 150));
  }
  const brightnessAvg = brightnessSum / 3;
  const brightness = {
    passed: brightnessAvg >= 55 && brightnessAvg <= 235,
    score: Math.max(0, Math.min(100, 100 - Math.abs(brightnessAvg - 145) * 0.8)),
    brightness: Math.round(brightnessAvg),
    message: brightnessAvg < 55
      ? 'Too dark — improve your lighting.'
      : brightnessAvg > 235
      ? 'Too bright — reduce direct light in background.'
      : '',
  };

  // 5. Blur (average 3 frames)
  tick('Sharpness');
  let blurScoreSum = 0;
  let blurPassed = true;
  for (let i = 0; i < 3; i++) {
    const b = checkBlur(videoEl);
    blurScoreSum += b.score;
    if (!b.passed) blurPassed = false;
    await new Promise(r => setTimeout(r, 150));
  }
  const blur = {
    passed: blurPassed,
    score: Math.round(blurScoreSum / 3),
    message: blurPassed ? '' : 'Image too blurry — clean your camera lens or move closer.',
  };

  // 6. Face detection (3 frames for stability)
  tick('Face detection');
  const facePositions = [];
  let detectedFace = null;
  let faceCount = 0;

  for (let i = 0; i < 3; i++) {
    const faces = (await detectFacesFast(videoEl)).faces;
    faceCount = faces.length;
    if (faces.length === 1) {
      const f = faces[0];
      const cx = f.box.x + f.box.width  / 2;
      const cy = f.box.y + f.box.height / 2;
      facePositions.push([cx, cy]);
      detectedFace = f;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  const faceVisible = {
    passed: facePositions.length >= 2,
    score: (facePositions.length / 3) * 100,
    faceCount,
    message: faceCount === 0
      ? 'No face detected — position yourself in front of the camera.'
      : faceCount > 1
      ? 'Multiple faces detected — only the candidate should be in frame.'
      : facePositions.length < 2
      ? 'Face detected intermittently — hold still and face the camera.'
      : '',
  };

  // 7. Face size
  tick('Face size');
  const faceSize = detectedFace
    ? checkFaceSize(detectedFace.box, videoEl.videoWidth || 640, videoEl.videoHeight || 480)
    : { passed: false, score: 0, message: 'Move closer to the camera.' };

  // 8. Face centering
  tick('Face centering');
  const faceCentering = detectedFace
    ? checkFaceCentering(detectedFace.box, videoEl.videoWidth || 640, videoEl.videoHeight || 480)
    : { passed: false, score: 0, message: 'Center your face in the camera frame.' };

  // Stability
  tick('Stability');
  const stability = checkFaceStability(facePositions);

  const checks = { resolution, fps, brightness, blur, faceVisible, faceSize, faceCentering, stability };

  const failedChecks = Object.entries(checks)
    .filter(([, c]) => !c.passed)
    .map(([name]) => name);

  const guidance = Object.values(checks)
    .filter(c => !c.passed && c.message)
    .map(c => c.message);

  const overallScore = Math.round(
    resolution.score    * 0.10 +
    fps.score           * 0.05 +
    brightness.score    * 0.15 +
    blur.score          * 0.15 +
    faceVisible.score   * 0.25 +
    faceSize.score      * 0.15 +
    faceCentering.score * 0.10 +
    stability.score     * 0.05
  );

  const allPassed = failedChecks.length === 0;

  return { allPassed, overallScore, checks, failedChecks, guidance };
};
