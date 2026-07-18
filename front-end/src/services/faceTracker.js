/**
 * faceTracker.js
 *
 * Lightweight between-verification face tracker.
 *
 * After each full SCRFD+ArcFace verification cycle, the tracker uses
 * cheap pixel-level block matching on a downscaled frame to estimate
 * whether the face has moved significantly. This avoids running the
 * expensive ONNX pipeline every frame.
 *
 * Strategy:
 *  - Store a 32×32 grayscale "fingerprint" of the face crop after each verification
 *  - On each tracker tick (~66ms / 15fps), compute the SAD (sum of absolute
 *    differences) between the current face region and the stored fingerprint
 *  - If SAD > threshold → face moved significantly → trigger early re-verification
 *  - If face region is empty → immediately signal face lost
 *
 * Memory: ~4 KB per tracker instance. No WebGL, no WASM.
 */

const TRACKER_RESOLUTION = 32;        // Downscale face crop to 32×32 for matching
const TRACKER_INTERVAL_MS = 66;       // ~15 fps tracking
const MOVEMENT_SAD_THRESHOLD = 1800;  // SAD above this → face moved → re-verify
const MAX_MISS_FRAMES = 5;            // Face absent for N frames → signal lost

// ─── Grayscale Pixel Fingerprint ─────────────────────────────────────────────

let _trackerCanvas = null;
let _trackerCtx    = null;

const getFaceFingerprint = (videoEl, box) => {
  if (!_trackerCanvas) {
    _trackerCanvas = document.createElement('canvas');
    _trackerCanvas.width  = TRACKER_RESOLUTION;
    _trackerCanvas.height = TRACKER_RESOLUTION;
    _trackerCtx = _trackerCanvas.getContext('2d', { willReadFrequently: true });
  }

  const vW = videoEl.videoWidth  || 640;
  const vH = videoEl.videoHeight || 480;

  // Expand box slightly for context
  const pad  = 0.2;
  const bx   = Math.max(0, box.x - box.width  * pad);
  const by   = Math.max(0, box.y - box.height * pad);
  const bw   = Math.min(vW - bx, box.width  * (1 + 2 * pad));
  const bh   = Math.min(vH - by, box.height * (1 + 2 * pad));

  _trackerCtx.drawImage(videoEl, bx, by, bw, bh, 0, 0, TRACKER_RESOLUTION, TRACKER_RESOLUTION);
  const { data } = _trackerCtx.getImageData(0, 0, TRACKER_RESOLUTION, TRACKER_RESOLUTION);

  // Convert to grayscale uint8
  const grey = new Uint8Array(TRACKER_RESOLUTION * TRACKER_RESOLUTION);
  for (let i = 0; i < grey.length; i++) {
    grey[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  }
  return grey;
};

const computeSAD = (a, b) => {
  let sad = 0;
  for (let i = 0; i < a.length; i++) sad += Math.abs(a[i] - b[i]);
  return sad;
};

// ─── Tracker Class ────────────────────────────────────────────────────────────

export class FaceTracker {
  constructor({ onMovement, onFaceLost }) {
    this._fingerprint = null;
    this._lastBox     = null;
    this._intervalId  = null;
    this._missFrames  = 0;
    this._onMovement  = onMovement; // () => void — significant movement detected
    this._onFaceLost  = onFaceLost; // () => void — face absent
    this._videoEl     = null;
  }

  /**
   * Update the tracker with the latest verified face box.
   * Call this after every successful verification cycle.
   */
  update(videoEl, box) {
    this._videoEl    = videoEl;
    this._lastBox    = box;
    this._missFrames = 0;
    try {
      this._fingerprint = getFaceFingerprint(videoEl, box);
    } catch {
      this._fingerprint = null;
    }
  }

  /**
   * Start the tracking interval.
   * @param {HTMLVideoElement} videoEl
   */
  start(videoEl) {
    this._videoEl = videoEl;
    this.stop(); // Clear any existing interval
    this._intervalId = setInterval(() => this._tick(), TRACKER_INTERVAL_MS);
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
  }

  reset() {
    this.stop();
    this._fingerprint = null;
    this._lastBox     = null;
    this._missFrames  = 0;
  }

  _tick() {
    const videoEl = this._videoEl;
    if (!videoEl || videoEl.readyState < 2) return;
    if (!this._fingerprint || !this._lastBox) return;

    try {
      const currentPrint = getFaceFingerprint(videoEl, this._lastBox);
      const sad = computeSAD(this._fingerprint, currentPrint);

      if (sad > MOVEMENT_SAD_THRESHOLD * 2) {
        // Face region has changed drastically — likely absent or different person
        this._missFrames++;
        if (this._missFrames >= MAX_MISS_FRAMES) {
          this._missFrames = 0;
          this._onFaceLost?.();
        }
      } else if (sad > MOVEMENT_SAD_THRESHOLD) {
        // Significant movement — trigger early re-verification
        this._missFrames = 0;
        this._onMovement?.();
      } else {
        this._missFrames = 0;
      }
    } catch {
      // Non-fatal — tracker can miss a frame
    }
  }
}
