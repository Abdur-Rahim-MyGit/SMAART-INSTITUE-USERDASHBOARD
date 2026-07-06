/**
 * Face Verification Service
 * 
 * Uses @vladmandic/face-api for:
 *  - Face detection (SSD MobileNet V1)
 *  - Face landmarks (68-point model)
 *  - Face recognition (128-dimensional embeddings)
 * 
 * Provides face registration (capture reference embedding) and
 * continuous verification (compare against reference) for proctoring.
 * 
 * All processing runs client-side — zero server calls for face data.
 */
import * as faceapi from '@vladmandic/face-api';
import { analyzeGaze, resetCalibration } from './eyeGazeService';

export { resetCalibration as resetGazeCalibration };

// ─── State ───────────────────────────────────────────────────────────
let modelsLoaded = false;
let isLoadingModels = false;
let loadError = null;

// ─── Constants ───────────────────────────────────────────────────────
const MODEL_URL = '/models';
const MATCH_THRESHOLD = 0.6; // Euclidean distance < 0.6 = match (face-api.js standard)
const MIN_FACE_CONFIDENCE = 0.5; // SSD MobileNet detection confidence
const REGISTRATION_FRAMES = 5; // Number of frames to capture for robust reference
const REGISTRATION_INTERVAL_MS = 600; // Milliseconds between capture frames

// ─── Model Loading ───────────────────────────────────────────────────

/**
 * Load all required face-api.js models.
 * Models are loaded from /public/models/ (served statically by Vite).
 * 
 * @param {Function} onProgress - Optional callback for progress updates (0-100)
 * @returns {Promise<boolean>}
 */
export const loadModels = async (onProgress) => {
  if (modelsLoaded) return true;
  if (isLoadingModels) {
    // Wait for concurrent load
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
    console.log('[FaceVerification] Loading face-api.js models from', MODEL_URL);
    onProgress?.(10);

    // 1. SSD MobileNet V1 — face detector
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    console.log('[FaceVerification] ✅ SSD MobileNet V1 loaded');
    onProgress?.(40);

    // 2. Face Landmark 68 — facial landmark detection
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    console.log('[FaceVerification] ✅ Face Landmark 68 loaded');
    onProgress?.(70);

    // 3. Face Recognition — 128-d embedding generation
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

/**
 * Check if models are loaded and ready.
 */
export const isReady = () => modelsLoaded;

/**
 * Get the last model loading error, if any.
 */
export const getLoadError = () => loadError;

// ─── Face Detection ──────────────────────────────────────────────────

/**
 * Detect all faces in a video/canvas element with landmarks and descriptors.
 * 
 * @param {HTMLVideoElement|HTMLCanvasElement} input
 * @returns {Promise<object>} - { faceCount, faces, isFacePresent, error? }
 */
export const detectFaces = async (input) => {
  if (!input) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'No input element' };
  }

  // For video elements, check readyState
  if (input.tagName === 'VIDEO' && input.readyState < 2) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };
  }

  if (!modelsLoaded) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Models not loaded' };
  }

  try {
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_FACE_CONFIDENCE });
    const detections = await faceapi
      .detectAllFaces(input, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const faces = detections.map(d => ({
      detection: d.detection,
      landmarks: d.landmarks,
      descriptor: d.descriptor,
      box: d.detection.box,
      score: d.detection.score,
      hasLandmarks: !!d.landmarks,
      hasDescriptor: !!d.descriptor
    }));

    return {
      faceCount: faces.length,
      faces,
      isFacePresent: faces.length > 0
    };
  } catch (error) {
    console.error('[FaceVerification] Detection failed:', error);
    return { faceCount: 0, faces: [], isFacePresent: false, error: error.message };
  }
};

/**
 * Detect faces and return result in the legacy format (backward compat with faceDetectionService).
 * Maps face-api.js results to the same shape BlazeFace used to return.
 */
export const detectFacesLegacy = async (input) => {
  const result = await detectFaces(input);

  if (result.error || !result.isFacePresent) {
    return result;
  }

  // Map to legacy format expected by existing code
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
    isFacePresent: legacyFaces.length > 0
  };
};

// ─── Face Registration ───────────────────────────────────────────────

/**
 * Register a face by capturing multiple frames and averaging their embeddings.
 * This creates a robust reference descriptor that handles minor pose/lighting variation.
 * 
 * @param {HTMLVideoElement} videoElement - Live webcam feed
 * @param {object} options
 * @param {number} options.frameCount - Number of frames to capture (default: 5)
 * @param {number} options.intervalMs - Delay between frames (default: 600ms)
 * @param {Function} options.onFrameCaptured - Callback(frameIndex, totalFrames, descriptor)
 * @param {Function} options.onError - Callback(error)
 * @returns {Promise<{ descriptor: Float32Array, confidence: number, framesCaptured: number }>}
 */
export const registerFace = async (videoElement, options = {}) => {
  const {
    frameCount = REGISTRATION_FRAMES,
    intervalMs = REGISTRATION_INTERVAL_MS,
    onFrameCaptured,
    onError
  } = options;

  if (!modelsLoaded) {
    throw new Error('Models not loaded. Call loadModels() first.');
  }

  if (!videoElement || videoElement.readyState < 2) {
    throw new Error('Video element not ready.');
  }

  const descriptors = [];
  const scores = [];

  for (let i = 0; i < frameCount; i++) {
    try {
      const result = await detectFaces(videoElement);

      if (result.error) {
        console.warn(`[FaceVerification] Registration frame ${i + 1} error:`, result.error);
        onError?.(result.error);
        continue; // Skip this frame, don't fail entirely
      }

      if (result.faceCount === 0) {
        console.warn(`[FaceVerification] Registration frame ${i + 1}: No face found`);
        onError?.('No face detected in this frame');
        continue;
      }

      if (result.faceCount > 1) {
        console.warn(`[FaceVerification] Registration frame ${i + 1}: Multiple faces`);
        onError?.('Multiple faces detected — only one person should be visible');
        continue;
      }

      const face = result.faces[0];
      if (!face.hasDescriptor || !face.descriptor) {
        console.warn(`[FaceVerification] Registration frame ${i + 1}: No descriptor generated`);
        onError?.('Could not extract face features');
        continue;
      }

      descriptors.push(face.descriptor);
      scores.push(face.score);
      onFrameCaptured?.(i + 1, frameCount, face.descriptor, face);

      console.log(`[FaceVerification] Registration frame ${i + 1}/${frameCount} captured (confidence: ${(face.score * 100).toFixed(1)}%)`);
    } catch (err) {
      console.error(`[FaceVerification] Registration frame ${i + 1} failed:`, err);
      onError?.(err.message);
    }

    // Wait between frames (except after the last one)
    if (i < frameCount - 1) {
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  // Need at least 2 successful frames for a reliable registration
  if (descriptors.length < 2) {
    throw new Error(`Face registration failed — only captured ${descriptors.length} valid frame(s). Need at least 2. Please ensure your face is clearly visible and well-lit.`);
  }

  // Average all descriptors to create a robust reference embedding
  const averageDescriptor = computeAverageDescriptor(descriptors);
  const averageConfidence = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  console.log(`[FaceVerification] ✅ Face registered with ${descriptors.length}/${frameCount} frames (avg confidence: ${(averageConfidence * 100).toFixed(1)}%)`);

  return {
    descriptor: averageDescriptor,
    confidence: averageConfidence,
    framesCaptured: descriptors.length
  };
};

// ─── Face Verification ───────────────────────────────────────────────

/**
 * Verification status types.
 */
export const VerificationStatus = {
  VERIFIED: 'verified',
  MISMATCH: 'mismatch',
  NO_FACE: 'no_face',
  MULTIPLE_FACES: 'multiple_faces',
  COVERED: 'covered',
  ERROR: 'error'
};

/**
 * Verify the current face against a registered reference descriptor.
 * 
 * @param {HTMLVideoElement} videoElement - Live webcam feed
 * @param {Float32Array} referenceDescriptor - The registered face embedding
 * @returns {Promise<object>} - { status, distance, similarity, faceCount, faces }
 */
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

  const result = await detectFaces(videoElement);

  if (result.error) {
    return {
      status: VerificationStatus.ERROR,
      distance: Infinity,
      similarity: 0,
      faceCount: 0,
      error: result.error
    };
  }

  // No face detected at all
  if (result.faceCount === 0) {
    return {
      status: VerificationStatus.NO_FACE,
      distance: Infinity,
      similarity: 0,
      faceCount: 0
    };
  }

  // Multiple faces
  if (result.faceCount > 1) {
    return {
      status: VerificationStatus.MULTIPLE_FACES,
      distance: Infinity,
      similarity: 0,
      faceCount: result.faceCount
    };
  }

  // Single face — check if it has landmarks/descriptor
  const face = result.faces[0];

  // Face detected but no landmarks → covered/obstructed
  if (!face.hasLandmarks || !face.hasDescriptor) {
    return {
      status: VerificationStatus.COVERED,
      distance: Infinity,
      similarity: 0,
      faceCount: 1
    };
  }

  // Compare embeddings using Euclidean distance
  const distance = faceapi.euclideanDistance(referenceDescriptor, face.descriptor);
  const similarity = distanceToSimilarity(distance);

  if (distance < MATCH_THRESHOLD) {
    // Attach gaze analysis piggy-backed on the same landmark result
    const gaze = face.hasLandmarks ? analyzeGaze(face.landmarks) : null;
    return {
      status: VerificationStatus.VERIFIED,
      distance,
      similarity,
      faceCount: 1,
      gaze,
    };
  } else {
    const gaze = face.hasLandmarks ? analyzeGaze(face.landmarks) : null;
    return {
      status: VerificationStatus.MISMATCH,
      distance,
      similarity,
      faceCount: 1,
      gaze,
    };
  }
};

// ─── Utility Functions ───────────────────────────────────────────────

/**
 * Compute the element-wise average of multiple 128-d descriptors.
 * This creates a more robust reference that averages out minor frame-to-frame variation.
 * 
 * @param {Float32Array[]} descriptors
 * @returns {Float32Array}
 */
export const computeAverageDescriptor = (descriptors) => {
  if (!descriptors || descriptors.length === 0) {
    throw new Error('No descriptors to average');
  }

  const length = descriptors[0].length; // 128
  const sum = new Float32Array(length);

  for (const desc of descriptors) {
    for (let i = 0; i < length; i++) {
      sum[i] += desc[i];
    }
  }

  const avg = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    avg[i] = sum[i] / descriptors.length;
  }

  return avg;
};

/**
 * Convert Euclidean distance to a 0-1 similarity score.
 * distance 0 = perfect match (similarity 1.0)
 * distance 1.0+ = completely different (similarity ~0)
 * 
 * @param {number} distance - Euclidean distance between two 128-d descriptors
 * @returns {number} - 0 to 1 similarity score
 */
export const distanceToSimilarity = (distance) => {
  // Using exponential decay: similarity = e^(-distance * 3)
  // At distance 0.0 → similarity 1.0
  // At distance 0.3 → similarity ~0.41
  // At distance 0.6 → similarity ~0.17 (threshold boundary)
  // At distance 1.0 → similarity ~0.05
  return Math.exp(-distance * 3);
};

/**
 * Cosine similarity between two 128-d descriptors.
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite).
 * 
 * @param {Float32Array} a
 * @param {Float32Array} b
 * @returns {number}
 */
export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
};

/**
 * Get the match threshold used for verification.
 */
export const getMatchThreshold = () => MATCH_THRESHOLD;
