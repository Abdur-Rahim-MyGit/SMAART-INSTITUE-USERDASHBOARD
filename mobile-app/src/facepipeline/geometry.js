/**
 * Pure-math helpers ported verbatim from front-end/src/services/onnxPipeline.js
 * and faceVerificationService.js. No DOM/canvas dependency, so these need no
 * adaptation for React Native — same numbers in, same numbers out.
 */

// Standard ArcFace alignment targets (mean face template) — must match the
// web app exactly, or aligned crops (and therefore embeddings) won't match.
export const ARCFACE_DST = [
  [38.2946, 51.6963],
  [73.5318, 51.6963],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.3655],
];

/**
 * Solve 6-parameter 2D affine transform (m11, m12, m21, m22, dx, dy) mapping src -> dst.
 * Ported verbatim from onnxPipeline.js.
 */
export function estimateAffineTransform(src, dst) {
  const N = src.length;
  let S_xx = 0, S_yy = 0, S_xy = 0, S_x = 0, S_y = 0;
  let S_xu = 0, S_yu = 0, S_u = 0;
  let S_xv = 0, S_yv = 0, S_v = 0;

  for (let i = 0; i < N; i++) {
    const x = src[i][0];
    const y = src[i][1];
    const u = dst[i][0];
    const v = dst[i][1];

    S_xx += x * x;
    S_yy += y * y;
    S_xy += x * y;
    S_x += x;
    S_y += y;

    S_xu += x * u;
    S_yu += y * u;
    S_u += u;

    S_xv += x * v;
    S_yv += y * v;
    S_v += v;
  }

  const a00 = S_xx, a01 = S_xy, a02 = S_x;
  const a10 = S_xy, a11 = S_yy, a12 = S_y;
  const a20 = S_x, a21 = S_y, a22 = N;

  const det =
    a00 * (a11 * a22 - a12 * a21) - a01 * (a10 * a22 - a12 * a20) + a02 * (a10 * a21 - a11 * a20);

  if (Math.abs(det) < 1e-6) return null;

  const invDet = 1 / det;

  const i00 = (a11 * a22 - a12 * a21) * invDet;
  const i01 = (a02 * a21 - a01 * a22) * invDet;
  const i02 = (a01 * a12 - a02 * a11) * invDet;

  const i10 = (a12 * a20 - a10 * a22) * invDet;
  const i11 = (a00 * a22 - a02 * a20) * invDet;
  const i12 = (a02 * a10 - a00 * a12) * invDet;

  const i20 = (a10 * a21 - a11 * a20) * invDet;
  const i21 = (a01 * a20 - a00 * a21) * invDet;
  const i22 = (a00 * a11 - a01 * a10) * invDet;

  const m11 = i00 * S_xu + i01 * S_yu + i02 * S_u;
  const m21 = i10 * S_xu + i11 * S_yu + i12 * S_u;
  const dx = i20 * S_xu + i21 * S_yu + i22 * S_u;

  const m12 = i00 * S_xv + i01 * S_yv + i02 * S_v;
  const m22 = i10 * S_xv + i11 * S_yv + i12 * S_v;
  const dy = i20 * S_xv + i21 * S_yv + i22 * S_v;

  return { m11, m12, m21, m22, dx, dy };
}

export function l2Normalize(vec) {
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? Math.max(-1, Math.min(1, dot / denom)) : 0;
}

export function iou(a, b) {
  const ix1 = Math.max(a[0], b[0]);
  const iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]);
  const iy2 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const areaA = (a[2] - a[0]) * (a[3] - a[1]);
  const areaB = (b[2] - b[0]) * (b[3] - b[1]);
  return inter / (areaA + areaB - inter + 1e-6);
}

export function nms(boxes, scores, threshold) {
  const order = scores.map((s, i) => i).sort((a, b) => scores[b] - scores[a]);
  const keep = [];
  const suppressed = new Set();

  for (const i of order) {
    if (suppressed.has(i)) continue;
    keep.push(i);
    for (const j of order) {
      if (i === j || suppressed.has(j)) continue;
      if (iou(boxes[i], boxes[j]) > threshold) suppressed.add(j);
    }
  }
  return keep;
}

/** Median-pool a set of equal-length embeddings — robust to a single outlier frame. */
export function medianPoolEmbeddings(embeddings) {
  const dims = embeddings[0].length;
  const result = new Float32Array(dims);
  const dimValues = new Array(embeddings.length);

  for (let d = 0; d < dims; d++) {
    for (let i = 0; i < embeddings.length; i++) {
      dimValues[i] = embeddings[i][d];
    }
    dimValues.sort((a, b) => a - b);
    const mid = Math.floor(embeddings.length / 2);
    result[d] =
      embeddings.length % 2 === 0 ? (dimValues[mid - 1] + dimValues[mid]) / 2 : dimValues[mid];
  }
  return result;
}
