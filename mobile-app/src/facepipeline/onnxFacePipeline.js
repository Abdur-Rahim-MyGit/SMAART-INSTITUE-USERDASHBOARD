/**
 * Native counterpart to front-end/src/services/faceVerificationService.js +
 * onnxPipeline.js. Same models (SCRFD-500M + ArcFace R50), same thresholds,
 * same cosine-similarity math — so a registration done on mobile is
 * comparable to a verification done on mobile using the exact same math the
 * web app uses (see docs/04-React-Native-App-Requirements-and-Roadmap.docx,
 * Section 7, for why that consistency matters).
 *
 * Key structural difference from the web version: there's no continuous
 * <video> element to sample from. Instead, the calling screen captures
 * discrete still photos (react-native-vision-camera's capturePhotoToFile),
 * and each function here operates on one photo at a time. registerFace()
 * takes a `capturePhoto` callback and loops it, mirroring the web version's
 * frame-sampling loop but with discrete captures instead of a video stream.
 */
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Platform } from 'react-native';
import { ensureAllModelsDownloaded } from './modelDownloader';
import { decodePhoto, photoToDetectorTensor, alignFaceAsArcFaceTensor, photoToQualityBuffer } from './skiaImage';
import { decodeSCRFD, SCRFD_INPUT_SIZE } from './scrfdDecode';
import { cosineSimilarity, l2Normalize, medianPoolEmbeddings } from './geometry';
import { evaluateFrameQuality } from './faceQuality';

const ARCFACE_INPUT_SIZE = 112;

// Same thresholds as faceVerificationService.js — do not drift from these
// without re-validating against the web app's calibration.
export const VERIFICATION_COSINE_THRESHOLD = 0.58;
export const REGISTRATION_COSINE_THRESHOLD = 0.38; // matches web's per-frame consistency check
const REGISTRATION_FRAMES = 5;
const REGISTRATION_MAX_ATTEMPTS = 14;

export const VerificationStatus = {
  VERIFIED: 'verified',
  MISMATCH: 'mismatch',
  NO_FACE: 'no_face',
  MULTIPLE_FACES: 'multiple_faces',
  COVERED: 'covered',
  ERROR: 'error',
};

let scrfdSession = null;
let arcfaceSession = null;
let initialized = false;
let initializing = null;

/**
 * Try an accelerated execution provider first (CoreML on iOS, NNAPI on
 * Android), falling back to plain CPU if the provider name isn't supported
 * by the installed onnxruntime-react-native build. Correctness doesn't
 * depend on which EP wins — only speed does — so this fallback is safe.
 */
async function createSession(modelPath) {
  const accelerated = Platform.select({ ios: ['coreml'], android: ['nnapi'], default: null });
  if (accelerated) {
    try {
      return await InferenceSession.create(modelPath, { executionProviders: accelerated });
    } catch (err) {
      console.warn(`[OnnxFacePipeline] Accelerated EP ${accelerated} unavailable, falling back to CPU:`, err.message);
    }
  }
  return InferenceSession.create(modelPath);
}

export async function initPipeline(onProgress) {
  if (initialized) return true;
  if (initializing) return initializing;

  initializing = (async () => {
    const paths = await ensureAllModelsDownloaded((pct) => onProgress?.(Math.round(pct * 0.6), 'Downloading models...'));
    onProgress?.(65, 'Loading face detector...');
    scrfdSession = await createSession(paths.scrfd);
    onProgress?.(85, 'Loading face recognition model...');
    arcfaceSession = await createSession(paths.arcface);
    onProgress?.(100, 'Ready');
    initialized = true;
    return true;
  })();

  try {
    return await initializing;
  } finally {
    initializing = null;
  }
}

export const isReady = () => initialized;

/**
 * Detect + embed every face in a captured photo.
 * @param {string} fileUri  local file:// URI from vision-camera's capturePhotoToFile
 * @returns {Promise<Array<{box, score, landmarks, embedding}>>}
 */
export async function detectAndEmbed(fileUri) {
  if (!initialized) throw new Error('[OnnxFacePipeline] Not initialized — call initPipeline() first.');

  const image = await decodePhoto(fileUri);
  const origWidth = image.width();
  const origHeight = image.height();

  const detectorTensorData = photoToDetectorTensor(image, SCRFD_INPUT_SIZE, false);
  const detectorTensor = new Tensor('float32', detectorTensorData, [1, 3, SCRFD_INPUT_SIZE, SCRFD_INPUT_SIZE]);
  const scrfdInputName = scrfdSession.inputNames[0];
  const scrfdOutputs = await scrfdSession.run({ [scrfdInputName]: detectorTensor });
  const faces = decodeSCRFD(scrfdOutputs, origWidth, origHeight);

  const results = [];
  for (const face of faces) {
    if (face.box.width < 30 || face.box.height < 30) continue;

    const arcfaceTensorData = alignFaceAsArcFaceTensor(image, face.landmarks);
    const arcfaceTensor = new Tensor('float32', arcfaceTensorData, [1, 3, ARCFACE_INPUT_SIZE, ARCFACE_INPUT_SIZE]);
    const arcfaceInputName = arcfaceSession.inputNames[0];
    const arcfaceOutputs = await arcfaceSession.run({ [arcfaceInputName]: arcfaceTensor });
    const rawEmbedding = arcfaceOutputs[Object.keys(arcfaceOutputs)[0]].data;
    const embedding = l2Normalize(Array.from(rawEmbedding));

    results.push({ box: face.box, score: face.score, landmarks: face.landmarks, embedding, image });
  }
  return results;
}

/**
 * Capture-and-register loop. Mirrors faceVerificationService.js's registerFace,
 * but pulls frames via a capturePhoto() callback instead of sampling a <video>.
 *
 * @param {() => Promise<string>} capturePhoto  returns a local file:// URI per call
 * @param {object} options
 * @param {(count:number, total:number) => void} [options.onFrameCaptured]
 * @param {(issues: string[]) => void} [options.onQualityIssue]
 */
export async function registerFace(capturePhoto, options = {}) {
  const {
    frameCount = REGISTRATION_FRAMES,
    maxAttempts = REGISTRATION_MAX_ATTEMPTS,
    onFrameCaptured,
    onQualityIssue,
  } = options;

  const acceptedEmbeddings = [];
  const qualityScores = [];
  let firstEmbedding = null;
  let attempts = 0;

  while (acceptedEmbeddings.length < frameCount && attempts < maxAttempts) {
    attempts++;
    const fileUri = await capturePhoto();
    const faces = await detectAndEmbed(fileUri);

    if (faces.length === 0) {
      onQualityIssue?.(['Position your face clearly in front of the camera']);
      continue;
    }
    if (faces.length > 1) {
      onQualityIssue?.(['Ensure only one person is visible in frame']);
      continue;
    }

    const face = faces[0];
    const qualityBuffer = photoToQualityBuffer(face.image);
    const quality = evaluateFrameQuality(qualityBuffer, face);
    if (!quality.passed) {
      onQualityIssue?.(quality.issues.length ? quality.issues : ['Frame quality too low, try again']);
      continue;
    }

    if (firstEmbedding) {
      const sim = cosineSimilarity(firstEmbedding, face.embedding);
      if (sim < REGISTRATION_COSINE_THRESHOLD) {
        onQualityIssue?.(['Please hold your head steady facing the camera']);
        continue;
      }
    } else {
      firstEmbedding = face.embedding;
    }

    acceptedEmbeddings.push(face.embedding);
    qualityScores.push(quality.overallScore);
    onFrameCaptured?.(acceptedEmbeddings.length, frameCount);
  }

  if (acceptedEmbeddings.length < 2) {
    throw new Error(
      `Face registration failed. Only captured ${acceptedEmbeddings.length} valid frame(s) out of ${maxAttempts} attempts. Ensure good lighting and hold still.`
    );
  }

  const finalEmbedding = medianPoolEmbeddings(acceptedEmbeddings);
  const averageQuality = qualityScores.reduce((s, v) => s + v, 0) / qualityScores.length;
  const averageConfidence =
    acceptedEmbeddings.reduce((s, emb) => s + cosineSimilarity(emb, finalEmbedding), 0) / acceptedEmbeddings.length;

  return {
    embedding: Array.from(finalEmbedding),
    allEmbeddings: acceptedEmbeddings.map((e) => Array.from(e)),
    confidence: averageConfidence,
    framesCaptured: acceptedEmbeddings.length,
    qualityScore: Math.round(averageQuality),
    model: 'arcface-r50-onnx',
    dimensions: 512,
  };
}

/**
 * Verify a single captured photo against a previously registered embedding.
 * @param {string} fileUri
 * @param {number[]|Float32Array} referenceEmbedding  512-d
 */
export async function verifyFace(fileUri, referenceEmbedding) {
  if (!referenceEmbedding || referenceEmbedding.length !== 512) {
    return { status: VerificationStatus.ERROR, similarity: 0, faceCount: 0, error: 'No valid reference embedding provided' };
  }

  try {
    const faces = await detectAndEmbed(fileUri);

    if (faces.length === 0) {
      return { status: VerificationStatus.NO_FACE, similarity: 0, faceCount: 0 };
    }
    if (faces.length > 1) {
      return { status: VerificationStatus.MULTIPLE_FACES, similarity: 0, faceCount: faces.length };
    }

    const face = faces[0];
    const similarity = cosineSimilarity(face.embedding, Array.from(referenceEmbedding));
    const status = similarity >= VERIFICATION_COSINE_THRESHOLD ? VerificationStatus.VERIFIED : VerificationStatus.MISMATCH;

    return { status, similarity, distance: 1 - similarity, faceCount: 1 };
  } catch (err) {
    return { status: VerificationStatus.ERROR, similarity: 0, faceCount: 0, error: err.message };
  }
}

export { cosineSimilarity };
