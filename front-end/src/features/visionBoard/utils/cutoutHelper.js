/**
 * Background removal ("cutout") for vision board assets.
 *
 * The @imgly/background-removal bundle and its ONNX runtime are several
 * megabytes, so the library is imported lazily — the editor must not pay for
 * it until the student actually clicks "Remove background".
 *
 * The model files are fetched from imgly's CDN. We deliberately do NOT pin a
 * publicPath: the library derives it from its own installed version
 * (https://staticimgly.com/@imgly/background-removal-data/<version>/dist/).
 * A hardcoded path silently breaks on every package upgrade — the previous
 * value pointed at a host and a version that no longer serve the manifest,
 * which is why every cutout failed.
 */

let modulePromise = null;

const loadLibrary = () => {
  if (!modulePromise) {
    modulePromise = import('@imgly/background-removal').catch((error) => {
      modulePromise = null;
      throw error;
    });
  }
  return modulePromise;
};

/** Warm the library up in the background; failures are not fatal. */
export const preloadCutoutLibrary = () => {
  loadLibrary().catch(() => {});
};

export class CutoutError extends Error {
  constructor(reason, cause) {
    super(reason);
    this.name = 'CutoutError';
    this.reason = reason;
    this.cause = cause;
  }
}

/**
 * Removes the background from an image.
 * @param {File|Blob|string} imageSource - File, Blob, or (data) URL.
 * @param {(progress: number) => void} [onProgress] - 0..1 model download progress.
 * @returns {Promise<string>} data URL of the cut-out image.
 */
export async function removeBackground(imageSource, onProgress) {
  let imgly;
  try {
    imgly = await loadLibrary();
  } catch (error) {
    throw new CutoutError('library', error);
  }

  let blob;
  try {
    blob = await imgly.removeBackground(imageSource, {
      // Model + wasm assets are downloaded once and then served from cache.
      progress: (key, current, total) => {
        if (typeof onProgress === 'function' && total > 0) {
          onProgress(Math.min(1, current / total));
        }
      },
    });
  } catch (error) {
    const message = String(error?.message || error || '');
    // The library throws this when it cannot reach its asset manifest.
    const isNetwork = /Resource metadata not found|Failed to fetch|NetworkError|publicPath/i.test(message);
    throw new CutoutError(isNetwork ? 'network' : 'processing', error);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = () => reject(new CutoutError('processing', reader.error));
    reader.readAsDataURL(blob);
  });
}

export default { removeBackground, preloadCutoutLibrary, CutoutError };
