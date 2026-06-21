import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

let model = null;
let isLoading = false;

/**
 * Initializes and loads the BlazeFace model.
 * Handles errors gracefully to fall back if CDN is blocked or loading fails.
 */
export const loadModel = async () => {
  if (model) return model;
  if (isLoading) {
    while (isLoading) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return model;
  }

  isLoading = true;
  try {
    console.log('[FaceDetectionService] Initializing TensorFlow.js and loading BlazeFace...');
    // Ensure TFJS is ready
    await tf.ready();
    
    // Load BlazeFace model (loads model weights from CDN)
    model = await blazeface.load({
      maxFaces: 5,
      inputWidth: 128,
      inputHeight: 128,
      iouThreshold: 0.3,
      scoreThreshold: 0.75
    });
    console.log('[FaceDetectionService] BlazeFace model loaded successfully.');
    return model;
  } catch (error) {
    console.error('[FaceDetectionService] Error loading BlazeFace model:', error);
    model = null;
    throw error;
  } finally {
    isLoading = false;
  }
};

export const detectFaces = async (videoElement) => {
  if (!videoElement || videoElement.readyState < 2) {
    return { faceCount: 0, faces: [], isFacePresent: false, error: 'Video not ready' };
  }

  try {
    // CRITICAL FIX: Explicitly set width/height attributes if missing/0.
    // BlazeFace needs defined dimensions to process the canvas texture correctly.
    if (!videoElement.width || videoElement.width === 0) {
      videoElement.width = videoElement.videoWidth || 320;
    }
    if (!videoElement.height || videoElement.height === 0) {
      videoElement.height = videoElement.videoHeight || 240;
    }

    const faceModel = await loadModel();
    if (!faceModel) {
      return { faceCount: 0, faces: [], isFacePresent: false, error: 'Model not loaded' };
    }

    // Run model prediction
    const returnTensors = false; // we want pixel coordinates
    const predictions = await faceModel.estimateFaces(videoElement, returnTensors);

    if (!predictions || predictions.length === 0) {
      return { faceCount: 0, faces: [], isFacePresent: false };
    }

    // Map predictions to a standard format and apply size/confidence filters
    const faces = predictions
      .map((pred) => {
        const start = pred.topLeft;
        const end = pred.bottomRight;
        const width = end[0] - start[0];
        const height = end[1] - start[1];
        
        // Robust extraction of probability from tensor/typed-array/number
        let probability = 1.0;
        if (pred.probability) {
          if (typeof pred.probability === 'number') {
            probability = pred.probability;
          } else if (pred.probability.dataSync) {
            probability = pred.probability.dataSync()[0];
          } else if (Array.isArray(pred.probability) || pred.probability.buffer) {
            probability = pred.probability[0];
          }
        }
        
        return {
          topLeft: start,
          bottomRight: end,
          width,
          height,
          probability,
          landmarks: pred.landmarks
        };
      })
      .filter((face) => {
        // Candidate face heuristics:
        // 1. Must be high confidence (e.g. > 0.82)
        // 2. Must be of a reasonable size (e.g. at least 35px wide and tall) to filter out background noise/objects
        const isHighConfidence = face.probability > 0.82;
        const isReasonableSize = face.width >= 35 && face.height >= 35;
        return isHighConfidence && isReasonableSize;
      });

    return {
      faceCount: faces.length,
      faces,
      isFacePresent: faces.length > 0
    };
  } catch (error) {
    console.error('[FaceDetectionService] Face detection run failed:', error);
    return { faceCount: 0, faces: [], isFacePresent: false, error: error.message };
  }
};
