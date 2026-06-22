/**
 * Face Detection Service — Backward Compatibility Wrapper
 * 
 * This service now delegates to the faceVerificationService which uses
 * @vladmandic/face-api (SSD MobileNet V1 + FaceLandmark68 + FaceRecognition).
 * 
 * The `detectFaces()` export maintains the same return signature as the original
 * BlazeFace-based implementation so existing consumers don't need changes.
 */
import {
  loadModels,
  detectFacesLegacy,
  isReady
} from './faceVerificationService';

/**
 * Load models — delegates to faceVerificationService.
 * Called by ProctoringSetup before face checks begin.
 */
export const loadModel = async () => {
  if (isReady()) return true;
  await loadModels();
  return true;
};

/**
 * Detect faces — returns the legacy format { faceCount, faces, isFacePresent }.
 * This maintains backward compatibility with useProctoringEngine and ProctoringSetup.
 * 
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<{ faceCount: number, faces: Array, isFacePresent: boolean, error?: string }>}
 */
export const detectFaces = async (videoElement) => {
  // Ensure models are loaded (lazy init)
  if (!isReady()) {
    try {
      await loadModels();
    } catch (err) {
      return { faceCount: 0, faces: [], isFacePresent: false, error: 'Model loading failed: ' + err.message };
    }
  }

  return detectFacesLegacy(videoElement);
};
