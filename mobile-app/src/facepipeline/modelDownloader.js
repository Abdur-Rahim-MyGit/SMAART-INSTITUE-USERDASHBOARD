/**
 * Downloads the ONNX model weights on first run instead of bundling them into
 * the app binary. The ArcFace R50 model alone is ~174MB — shipping that in the
 * store install would blow past both stores' cellular-download-warning size
 * and slow every install, for weight files that rarely change. See Section 8
 * ("Technology Stack") and Section 15 ("Risks") of
 * docs/04-React-Native-App-Requirements-and-Roadmap.docx.
 *
 * Serves the *same* model files the web app already ships from
 * front-end/public/models/onnx/ — set EXPO_PUBLIC_MODEL_BASE_URL to wherever
 * that folder is publicly reachable (see .env.example).
 */
import { File, Paths } from 'expo-file-system';

const MODEL_BASE_URL = process.env.EXPO_PUBLIC_MODEL_BASE_URL || 'http://localhost:5173/models/onnx';

export const MODELS = {
  scrfd: { file: 'scrfd_500m_bnkps.onnx', approxBytes: 3_300_000 },
  arcface: { file: 'w600k_r50.onnx', approxBytes: 174_400_000 },
};

const modelsDir = () => Paths.document; // persists across app restarts, not cleared by the OS

function localFileFor(modelKey) {
  return new File(modelsDir(), MODELS[modelKey].file);
}

export function isModelDownloaded(modelKey) {
  return localFileFor(modelKey).exists;
}

/**
 * Downloads a model if not already present locally. Safe to call every app
 * start — it's a no-op once the file exists.
 * @param {'scrfd'|'arcface'} modelKey
 * @param {(pct: number) => void} onProgress 0-100
 * @returns {Promise<string>} local file URI, ready to pass to InferenceSession.create
 */
export async function ensureModelDownloaded(modelKey, onProgress) {
  const dest = localFileFor(modelKey);
  if (dest.exists) {
    onProgress?.(100);
    return dest.uri;
  }

  const url = `${MODEL_BASE_URL}/${MODELS[modelKey].file}`;
  const task = File.createDownloadTask(url, modelsDir(), {
    onProgress: ({ bytesWritten, totalBytes }) => {
      const total = totalBytes || MODELS[modelKey].approxBytes;
      onProgress?.(Math.min(99, Math.round((bytesWritten / total) * 100)));
    },
  });

  const downloaded = await task.downloadAsync();
  onProgress?.(100);
  return downloaded.uri;
}

/** Downloads both models sequentially, reporting combined progress 0-100. */
export async function ensureAllModelsDownloaded(onProgress) {
  const keys = ['scrfd', 'arcface'];
  const weights = { scrfd: 0.05, arcface: 0.95 }; // arcface is ~50x larger — weight progress accordingly
  let combined = 0;

  const paths = {};
  for (const key of keys) {
    paths[key] = await ensureModelDownloaded(key, (pct) => {
      const contribution = (pct / 100) * weights[key] * 100;
      onProgress?.(Math.round(combined + contribution));
    });
    combined += weights[key] * 100;
  }
  onProgress?.(100);
  return paths;
}
