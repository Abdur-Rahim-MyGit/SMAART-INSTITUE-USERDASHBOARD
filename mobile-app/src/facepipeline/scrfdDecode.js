/**
 * SCRFD output decoding — ported verbatim from front-end/src/services/onnxPipeline.js.
 * Pure math over the raw ONNX output tensors; identical on web and native.
 */
import { iou, nms } from './geometry';

export const SCRFD_INPUT_SIZE = 640;
export const NMS_THRESHOLD = 0.4;
const SCRFD_STRIDES = [8, 16, 32];
const SCRFD_NUM_ANCHORS = 2;

function generateAnchorCenters(height, width, stride) {
  const centers = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let a = 0; a < SCRFD_NUM_ANCHORS; a++) {
        centers.push([(x + 0.5) * stride, (y + 0.5) * stride]);
      }
    }
  }
  return centers;
}

/**
 * Decode SCRFD raw outputs into [{box, score, landmarks}].
 * See onnxPipeline.js for the full rationale on the dims-based tensor
 * classification — kept identical here since it's pure output-shape logic.
 */
export function decodeSCRFD(outputs, origW, origH) {
  const scaleX = origW / SCRFD_INPUT_SIZE;
  const scaleY = origH / SCRFD_INPUT_SIZE;

  const allBoxes = [];
  const allScores = [];
  const allLandmarks = [];

  const anchorToStride = {};
  const strideGrids = {};
  for (const stride of SCRFD_STRIDES) {
    const gh = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const gw = Math.ceil(SCRFD_INPUT_SIZE / stride);
    const na = gh * gw * SCRFD_NUM_ANCHORS;
    anchorToStride[na] = stride;
    strideGrids[stride] = { gh, gw, numAnchors: na };
  }

  const strideTensors = {};
  for (const stride of SCRFD_STRIDES) {
    strideTensors[stride] = { score: null, bbox: null, kps: null };
  }

  const outputEntries = Object.entries(outputs).filter(([, t]) => t?.data);
  const usedTensors = new Set();

  // Phase A: named outputs (e.g. 'score_8', 'bbox_16')
  for (const stride of SCRFD_STRIDES) {
    for (const type of ['score', 'bbox', 'kps']) {
      const key = `${type}_${stride}`;
      if (outputs[key]?.data) {
        strideTensors[stride][type] = outputs[key];
        usedTensors.add(outputs[key]);
      }
    }
  }

  // Phase B: classify unassigned tensors using dims shape
  for (const [, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    if (!tensor.dims || tensor.dims.length === 0) continue;

    const lastDim = tensor.dims[tensor.dims.length - 1];
    let type = null;
    let numAnchors = 0;

    if (lastDim === 4) {
      type = 'bbox';
      numAnchors = tensor.data.length / 4;
    } else if (lastDim === 10) {
      type = 'kps';
      numAnchors = tensor.data.length / 10;
    } else {
      type = 'score';
      numAnchors = lastDim <= 2 ? tensor.data.length / lastDim : tensor.data.length;
    }

    const stride = anchorToStride[numAnchors];
    if (stride && strideTensors[stride] && !strideTensors[stride][type]) {
      strideTensors[stride][type] = tensor;
      usedTensors.add(tensor);
    }
  }

  // Phase C: fallback for flattened tensors, by unique size
  for (const [, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    const len = tensor.data.length;
    for (const stride of SCRFD_STRIDES) {
      const na = strideGrids[stride].numAnchors;
      if (!strideTensors[stride].kps && len === na * 10) {
        strideTensors[stride].kps = tensor;
        usedTensors.add(tensor);
        break;
      }
      if (!strideTensors[stride].bbox && len === na * 4) {
        strideTensors[stride].bbox = tensor;
        usedTensors.add(tensor);
        break;
      }
    }
  }
  for (const [, tensor] of outputEntries) {
    if (usedTensors.has(tensor)) continue;
    const len = tensor.data.length;
    for (const stride of SCRFD_STRIDES) {
      const na = strideGrids[stride].numAnchors;
      if (!strideTensors[stride].score && (len === na || len === na * 2)) {
        strideTensors[stride].score = tensor;
        usedTensors.add(tensor);
        break;
      }
    }
  }

  for (const stride of SCRFD_STRIDES) {
    const { score: scoreTensor, bbox: bboxTensor, kps: kpsTensor } = strideTensors[stride];
    if (!scoreTensor || !bboxTensor) continue;

    const { gh, gw } = strideGrids[stride];
    const scoreData = scoreTensor.data;
    const bboxData = bboxTensor.data;
    const kpsData = kpsTensor?.data;
    const centers = generateAnchorCenters(gh, gw, stride);
    const has2Classes = scoreData.length >= centers.length * 2;

    for (let i = 0; i < centers.length; i++) {
      const rawScore = has2Classes ? scoreData[i * 2 + 1] : scoreData[i];
      const score = 1 / (1 + Math.exp(-rawScore));
      if (score < 0.5) continue;

      const [cx, cy] = centers[i];

      const x1 = (cx - bboxData[i * 4 + 0] * stride) * scaleX;
      const y1 = (cy - bboxData[i * 4 + 1] * stride) * scaleY;
      const x2 = (cx + bboxData[i * 4 + 2] * stride) * scaleX;
      const y2 = (cy + bboxData[i * 4 + 3] * stride) * scaleY;

      const faceW = x2 - x1;
      const faceH = y2 - y1;
      if (faceW < 30 || faceH < 30) continue;
      if (faceW > origW * 0.75 || faceH > origH * 0.75) continue;

      const kps = [];
      if (kpsData) {
        for (let k = 0; k < 5; k++) {
          kps.push([
            (cx + kpsData[i * 10 + k * 2] * stride) * scaleX,
            (cy + kpsData[i * 10 + k * 2 + 1] * stride) * scaleY,
          ]);
        }
      }

      allBoxes.push([x1, y1, x2, y2]);
      allScores.push(score);
      allLandmarks.push(kps);
    }
  }

  if (allBoxes.length === 0) return [];

  let keepIdx = nms(allBoxes, allScores, NMS_THRESHOLD);
  keepIdx.sort((a, b) => allScores[b] - allScores[a]);

  if (keepIdx.length > 1) {
    const filteredKeep = [keepIdx[0]];
    for (let k = 1; k < keepIdx.length; k++) {
      const idx = keepIdx[k];
      if (allScores[idx] >= 0.6 && iou(allBoxes[keepIdx[0]], allBoxes[idx]) <= 0.15) {
        filteredKeep.push(idx);
      }
    }
    keepIdx = filteredKeep;
  }

  return keepIdx.map((i) => ({
    box: {
      x: Math.max(0, allBoxes[i][0]),
      y: Math.max(0, allBoxes[i][1]),
      width: Math.min(origW, allBoxes[i][2] - allBoxes[i][0]),
      height: Math.min(origH, allBoxes[i][3] - allBoxes[i][1]),
    },
    score: allScores[i],
    landmarks: allLandmarks[i],
  }));
}
