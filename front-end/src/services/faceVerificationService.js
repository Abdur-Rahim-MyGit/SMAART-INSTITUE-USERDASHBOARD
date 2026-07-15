import * as faceapi from '@vladmandic/face-api';
import { analyzeGaze, resetCalibration } from './eyeGazeService';

export { resetCalibration as resetGazeCalibration };

// ─── State ───────────────────────────────────────────────────────────
let modelsLoaded = false;
let isLoadingModels = false;
let loadError = null;
let activeBackend = 'unknown';

// ─── ROI & Smart Detection Tracking State ─────────────────────────────
let lastFaceBox = null;      // Stores { x, y, width, height }
let lastDistance = 1.0;      // Euclidean distance of last match
let consecutiveSkips = 0;   // Count of frames where SSD detection was skipped
const MAX_CONSECUTIVE_SKIPS = 5; // Force SSD detection every N frames to avoid drift
const SKIP_DISTANCE_THRESHOLD = 0.35; // Skip SSD if last Euclidean distance is very low (high similarity)
const SKIP_DISPLACEMENT_THRESHOLD = 15; // Skip SSD only if face box moved less than N pixels

// ─── Constants ───────────────────────────────────────────────────────
const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.40; // Stricter threshold to prevent false identity verification matches
const REGISTRATION_CONSISTENCY_THRESHOLD = 0.30; // Strict threshold for registration frame consistency
const MIN_FACE_CONFIDENCE = 0.5;
const REGISTRATION_FRAMES = 5;
const REGISTRATION_INTERVAL_MS = 600;

// ─── Model & Backend Initialization ──────────────────────────────────

/**
 * Load models & verify WebGL acceleration.
 */
export const loadModels = async (onProgress) => {
  if (modelsLoaded) return true;
  if (isLoadingModels) {
    let waitCount = 0;
    while (isLoadingModels && waitCount < 150) {
      await new Promise(r => setTimeout(r, 200));
      waitCount++;
    }
    return modelsLoaded;
  }

  isLoadingModels = true;
  loadError = null;

  try {
    console.log('[FaceVerification] Loading models and configuring WebGL backend...');
    onProgress?.(10);

    // 1. Explicitly check/set WebGL backend
    try {
      const tf = faceapi.tf;
      if (tf) {
        console.log('[FaceVerification] Current TFJS Backend before setup:', tf.getBackend());
        await tf.setBackend('webgl');
        await tf.ready();
        activeBackend = tf.getBackend();
        console.log('[FaceVerification] TFJS Backend initialized to:', activeBackend);
      }
    } catch (backendErr) {
      console.warn('[FaceVerification] WebGL initialization failed, falling back to default:', backendErr.message);
      if (faceapi.tf) {
        activeBackend = faceapi.tf.getBackend();
      }
    }
    onProgress?.(20);

    // Load models
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    console.log('[FaceVerification] ✅ SSD MobileNet V1 loaded');
    onProgress?.(50);

    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log('[FaceVerification] ✅ Face Landmark 68 loaded');
    onProgress?.(70);

    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    console.log('[FaceVerification] ✅ Face Recognition model loaded');
    onProgress?.(100);

    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('[FaceVerification] Model loading failed:', error);
    loadError = error;
    throw error;
  } finally {
    isLoadingModels = false;
  }
};

export const isReady = () => modelsLoaded;
export const getLoadError = () => loadError;
export const getBackendInfo = () => ({
  backend: activeBackend,
  isWebGL: activeBackend === 'webgl',
  isCPU: activeBackend === 'cpu'
});

// Reset tracking states (called on starting new assessment or resetting setup)
export const resetTrackingState = () => {
  lastFaceBox = null;
  lastDistance = 1.0;
  consecutiveSkips = 0;
  console.log('[FaceVerification] ROI and Smart Detection states reset.');
};

// ─── Offscreen Canvas helper for ROI Cropping ───────────────────────
const getRoiCanvas = (input, box, padding = 0.3) => {
  const canvas = document.createElement('canvas');
  
  // Input dimensions
  const inputW = input.videoWidth || input.width || 640;
  const inputH = input.videoHeight || input.height || 480;

  // Add padding around the previous box
  const padW = box.width * padding;
  const padH = box.height * padding;

  // Define crop boundaries (constrained to input size)
  const roiX = Math.max(0, box.x - padW);
  const roiY = Math.max(0, box.y - padH);
  const roiW = Math.min(inputW - roiX, box.width + 2 * padW);
  const roiH = Math.min(inputH - roiY, box.height + 2 * padH);

  canvas.width = roiW;
  canvas.height = roiH;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(input, roiX, roiY, roiW, roiH, 0, 0, roiW, roiH);

  return { canvas, roiX, roiY, roiW, roiH };
};

// ─── Face Detection Pipeline with ROI & Smart Detection ──────────────

let lastDetectionTime = 0;

/**
 * Detect faces using experimental optimizations.
 */
export const detectFaces = async (input, disableOptimizations = false) => {
  if (!input) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input element' };
  }
  if (input.tagName === 'VIDEO' && input.readyState < 2) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };
  }
  if (!modelsLoaded) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Models not loaded' };
  }

  const now = performance.now();
  const timeElapsedSinceLastCheck = now - lastDetectionTime;
  lastDetectionTime = now;

  // Disable ROI/skips if check interval was long (e.g. > 1800ms) to avoid head movement drift
  if (lastFaceBox && timeElapsedSinceLastCheck > 1800) {
    lastFaceBox = null;
    consecutiveSkips = 0;
  }

  const options = new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_FACE_CONFIDENCE });
  
  // Timing instrumentation
  let tDetect = 0;
  let tLandmark = 0;
  let tRecog = 0;
  let isSkipped = false;
  let isRoiUsed = false;

  try {
    let detections = [];
    let roiOffset = { x: 0, y: 0 };

    // ─── OPTIMIZATION 1: Smart Detection (Skip SSD) ───
    if (
      !disableOptimizations &&
      lastFaceBox &&
      lastDistance < SKIP_DISTANCE_THRESHOLD &&
      consecutiveSkips < MAX_CONSECUTIVE_SKIPS
    ) {
      isSkipped = true;
      consecutiveSkips++;
      
      // Simulate detection output using previous face box coordinates
      const mockDetection = new faceapi.FaceDetection(
        MIN_FACE_CONFIDENCE,
        new faceapi.Rect(lastFaceBox.x, lastFaceBox.y, lastFaceBox.width, lastFaceBox.height),
        { width: input.videoWidth || input.width || 640, height: input.videoHeight || input.height || 480 }
      );
      detections = [mockDetection];
      console.log(`[FaceVerification] 🧠 Smart Detection active (reusing face box, skip count: ${consecutiveSkips})`);
    } 
    // ─── OPTIMIZATION 2: Region of Interest (ROI) ───
    else if (!disableOptimizations && lastFaceBox) {
      isRoiUsed = true;
      consecutiveSkips = 0; 
      
      const { canvas, roiX, roiY } = getRoiCanvas(input, lastFaceBox, 0.35);
      roiOffset = { x: roiX, y: roiY };

      const t0 = performance.now();
      const roiDetections = await faceapi.detectAllFaces(canvas, options);
      tDetect = performance.now() - t0;

      if (roiDetections.length > 0) {
        // Map detected box back to the full frame coordinates
        const roiFace = roiDetections[0];
        const mappedBox = new faceapi.Rect(
          roiFace.box.x + roiOffset.x,
          roiFace.box.y + roiOffset.y,
          roiFace.box.width,
          roiFace.box.height
        );
        
        // Reconstruct FaceDetection in original coordinate space
        const mappedDetection = new faceapi.FaceDetection(
          roiFace.score,
          mappedBox,
          { width: input.videoWidth || input.width || 640, height: input.videoHeight || input.height || 480 }
        );
        detections = [mappedDetection];
      } else {
        // Fallback: face lost in ROI, clear tracking and do full-frame immediately
        console.log('[FaceVerification] ⚠️ Face lost in ROI. Falling back to full-frame.');
        lastFaceBox = null;
        const t0_fallback = performance.now();
        detections = await faceapi.detectAllFaces(input, options);
        tDetect = performance.now() - t0_fallback;
      }
    } 
    // ─── BASELINE: Full Frame Detection ───
    else {
      consecutiveSkips = 0;
      const t0 = performance.now();
      detections = await faceapi.detectAllFaces(input, options);
      tDetect = performance.now() - t0;
    }

    if (detections.length === 0) {
      lastFaceBox = null; // Clear state
      return { faceCount: 0, faces: [], isFacePresent: false, timings: { detect: tDetect, landmark: 0, recog: 0, total: tDetect } };
    }

    // Capture the primary face bounding box for subsequent tracking
    const primaryFace = detections[0];
    const newBox = {
      x: primaryFace.box.x,
      y: primaryFace.box.y,
      width: primaryFace.box.width,
      height: primaryFace.box.height
    };

    // Calculate displacement if we had a previous box
    if (lastFaceBox && !isSkipped) {
      const dx = Math.abs(newBox.x - lastFaceBox.x);
      const dy = Math.abs(newBox.y - lastFaceBox.y);
      if (dx > SKIP_DISPLACEMENT_THRESHOLD || dy > SKIP_DISPLACEMENT_THRESHOLD) {
        consecutiveSkips = 0;
      }
    }
    lastFaceBox = newBox;

    // ─── Landmark Detection ───
    const tLandmarkStart = performance.now();
    const landmarks = await faceapi.detectFaceLandmarks(input, primaryFace);
    tLandmark = performance.now() - tLandmarkStart;

    if (!landmarks) {
      if (isSkipped) {
        console.log('[FaceVerification] 🧠 Smart Detection box invalid (no landmarks). Falling back to full-frame...');
        lastFaceBox = null;
        consecutiveSkips = 0;
        return detectFaces(input, true);
      }
      lastFaceBox = null;
      return { faceCount: 0, faces: [], isFacePresent: false, timings: { detect: tDetect, landmark: tLandmark, recog: 0, total: tDetect + tLandmark } };
    }

    // ─── Face Recognition Embedding ───
    const tRecogStart = performance.now();
    const descriptor = await faceapi.computeFaceDescriptor(input, landmarks);
    tRecog = performance.now() - tRecogStart;

    if (!descriptor) {
      if (isSkipped) {
        console.log('[FaceVerification] 🧠 Smart Detection box invalid (no descriptor). Falling back to full-frame...');
        lastFaceBox = null;
        consecutiveSkips = 0;
        return detectFaces(input, true);
      }
      lastFaceBox = null;
      return { faceCount: 0, faces: [], isFacePresent: false, timings: { detect: tDetect, landmark: tLandmark, recog: tRecog, total: tDetect + tLandmark + tRecog } };
    }

    const faces = [{
      detection: primaryFace,
      landmarks,
      descriptor,
      box: primaryFace.box,
      score: primaryFace.score,
      hasLandmarks: !!landmarks,
      hasDescriptor: !!descriptor
    }];

    const totalPipelineTime = tDetect + tLandmark + tRecog;

    return {
      faceCount: 1,
      faces,
      isFacePresent: true,
      timings: {
        detect: tDetect,
        landmark: tLandmark,
        recog: tRecog,
        total: totalPipelineTime,
        isSkipped,
        isRoiUsed
      }
    };
  } catch (error) {
    console.error('[FaceVerification] Optimized pipeline failed:', error);
    lastFaceBox = null;
    if (isSkipped) {
      console.log('[FaceVerification] Pipeline error during smart detection skip. Falling back to full-frame...');
      return detectFaces(input, true);
    }
    return { faceCount: 0, faces: [], isFacePresent: false, error: error.message };
  }
};

/**
 * Detect faces in legacy format.
 */
export const detectFacesLegacy = async (input) => {
  const result = await detectFaces(input);

  if (result.error || !result.isFacePresent) {
    return result;
  }

  const legacyFaces = result.faces.map(f => ({
    topLeft: [f.box.x, f.box.y],
    bottomRight: [f.box.x + f.box.width, f.box.y + f.box.height],
    width: f.box.width,
    height: f.box.height,
    probability: f.score,
    landmarks: f.landmarks
  }));

  return {
    faceCount: legacyFaces.length,
    faces: legacyFaces,
    isFacePresent: legacyFaces.length > 0,
    timings: result.timings
  };
};

// ─── Face Registration ───────────────────────────────────────────────

export const registerFace = async (videoElement, options = {}) => {
  const {
    frameCount = REGISTRATION_FRAMES,
    intervalMs = REGISTRATION_INTERVAL_MS,
    onFrameCaptured,
    onError
  } = options;

  if (!modelsLoaded) throw new Error('Models not loaded. Call loadModels() first.');
  if (!videoElement || videoElement.readyState < 2) throw new Error('Video element not ready.');

  const descriptors = [];
  const scores = [];

  // Temporarily disable ROI and Skips during registration for baseline purity
  lastFaceBox = null;

  let attempts = 0;
  const maxAttempts = Math.ceil(frameCount * 2.5);

  while (descriptors.length < frameCount && attempts < maxAttempts) {
    attempts++;
    try {
      const result = await detectFaces(videoElement, true);

      // If we haven't registered the first frame, we are lenient on temporary startup check issues
      if (descriptors.length === 0) {
        if (result.error || result.faceCount === 0 || result.faceCount > 1) {
          const err = result.error || (result.faceCount === 0 ? 'No face detected' : 'Multiple faces detected');
          onError?.(`${err} (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        }
      } else {
        // Once we have a baseline identity, ANY inconsistency throws immediately
        if (result.faceCount === 0) {
          throw new Error('Registration failed: Face was lost. Please keep your face centered in the camera feed.');
        }
        if (result.faceCount > 1) {
          throw new Error('Registration failed: Multiple faces detected. Ensure only one person is in front of the camera.');
        }
        if (result.error) {
          throw new Error(`Registration failed: ${result.error}`);
        }
      }

      const face = result.faces[0];
      if (!face.hasDescriptor || !face.descriptor) {
        if (descriptors.length === 0) {
          onError?.(`Could not extract face features (Attempt ${attempts}/${maxAttempts})`);
          await new Promise(r => setTimeout(r, intervalMs));
          continue;
        } else {
          throw new Error('Registration failed: Could not extract face features.');
        }
      }

      // Check consistency: ensure subsequent frames belong to the same face as the first frame
      if (descriptors.length > 0) {
        const distance = faceapi.euclideanDistance(descriptors[0], face.descriptor);
        if (distance > REGISTRATION_CONSISTENCY_THRESHOLD) {
          console.warn(`[FaceRegistration] ⚠️ Face mismatch detected: distance = ${distance.toFixed(4)}`);
          throw new Error('Registration failed: Face mismatch detected. Ensure the same person remains in the frame.');
        }
      }

      descriptors.push(face.descriptor);
      scores.push(face.score);
      onFrameCaptured?.(descriptors.length, frameCount, face.descriptor, face);

      if (descriptors.length < frameCount) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    } catch (err) {
      // Propagate the registration failure error to terminate the loop
      throw err;
    }
  }

  if (descriptors.length < 2) {
    throw new Error(`Face registration failed. Only captured ${descriptors.length} valid frames.`);
  }

  const averageDescriptor = computeAverageDescriptor(descriptors);
  const averageConfidence = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  return {
    descriptor: averageDescriptor,
    confidence: averageConfidence,
    framesCaptured: descriptors.length
  };
};

// ─── Face Verification ───────────────────────────────────────────────

export const VerificationStatus = {
  VERIFIED: 'verified',
  MISMATCH: 'mismatch',
  NO_FACE: 'no_face',
  MULTIPLE_FACES: 'multiple_faces',
  COVERED: 'covered',
  ERROR: 'error'
};

export const verifyFace = async (videoElement, referenceDescriptor) => {
  if (!referenceDescriptor) {
    return {
      status: VerificationStatus.ERROR,
      distance: Infinity,
      similarity: 0,
      faceCount: 0,
      error: 'No reference descriptor provided'
    };
  }

  // Disable optimizations (ROI and SSD skipping) during verification to ensure
  // perfect bounding box alignment and prevent descriptor corruption (which causes false mismatches).
  const result = await detectFaces(videoElement, true);

  if (result.error) {
    return {
      status: VerificationStatus.ERROR,
      distance: Infinity,
      similarity: 0,
      faceCount: 0,
      error: result.error
    };
  }

  if (result.faceCount === 0) {
    lastDistance = 1.0; 
    return {
      status: VerificationStatus.NO_FACE,
      distance: Infinity,
      similarity: 0,
      faceCount: 0,
      timings: result.timings
    };
  }

  if (result.faceCount > 1) {
    return {
      status: VerificationStatus.MULTIPLE_FACES,
      distance: Infinity,
      similarity: 0,
      faceCount: result.faceCount,
      timings: result.timings
    };
  }

  const face = result.faces[0];

  if (!face.hasLandmarks || !face.hasDescriptor) {
    lastDistance = 1.0;
    return {
      status: VerificationStatus.COVERED,
      distance: Infinity,
      similarity: 0,
      faceCount: 1,
      timings: result.timings
    };
  }

  // Compare embedding
  const distance = faceapi.euclideanDistance(referenceDescriptor, face.descriptor);
  const similarity = distanceToSimilarity(distance);
  
  // Track last verified distance for Smart Detection
  lastDistance = distance;

  // Temporary console debug logging for verification diagnostics
  console.log('[FaceVerification Debug Log]', {
    registrationDescriptor: referenceDescriptor,
    liveDescriptor: face.descriptor,
    euclideanDistance: distance,
    similarityScore: similarity,
    verificationStatus: distance < MATCH_THRESHOLD ? 'VERIFIED' : 'MISMATCH'
  });

  if (distance < MATCH_THRESHOLD) {
    // Attach gaze analysis piggy-backed on the same landmark result
    const gaze = face.hasLandmarks ? analyzeGaze(face.landmarks) : null;
    return {
      status: VerificationStatus.VERIFIED,
      distance,
      similarity,
      faceCount: 1,
      gaze,
      timings: result.timings
    };
  } else {
    const gaze = face.hasLandmarks ? analyzeGaze(face.landmarks) : null;
    return {
      status: VerificationStatus.MISMATCH,
      distance,
      similarity,
      faceCount: 1,
      gaze,
      timings: result.timings
    };
  }
};

// ─── Utilities ───────────────────────────────────────────────────────

export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors || descriptors.length === 0) throw new Error('No descriptors to average');
  const length = descriptors[0].length;
  const sum = new Float32Array(length);

  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) sum[i] += desc[i];
  }

  const avg = new Float32Array(length);
  for (let i = 0; i < length; i++) avg[i] = sum[i] / descriptors.length;
  return avg;
};

export const distanceToSimilarity = (distance) => Math.exp(-distance * 3);
export const getMatchThreshold = () => MATCH_THRESHOLD;
