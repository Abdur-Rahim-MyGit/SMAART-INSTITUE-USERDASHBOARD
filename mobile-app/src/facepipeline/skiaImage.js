/**
 * Native replacement for onnxPipeline.js's canvas-based image/tensor utilities.
 * The web version uses an HTMLCanvasElement (videoToTensor, cropAndAlignFace);
 * React Native has no DOM canvas, so this uses @shopify/react-native-skia's
 * offscreen surfaces to do the equivalent pixel work: decode a captured photo
 * once, then resize/align/read-back pixels from that single decode to build
 * the same normalized tensors the ONNX models expect.
 *
 * Every Skia call here (Data.fromURI, Image.MakeImageFromEncoded, Surface.
 * MakeOffscreen, Matrix(number[]), canvas.concat/drawImage/drawImageRect,
 * image.readPixels, ColorType.RGBA_8888) was cross-checked against the
 * installed @shopify/react-native-skia@2.6.2 TypeScript source
 * (node_modules/@shopify/react-native-skia/src/skia/types/*.ts), not just
 * docs — including the row-major 9-value layout Matrix() expects
 * (scaleX, skewX, transX, skewY, scaleY, transY, persp0, persp1, persp2),
 * confirmed via Matrix4.ts's convertToColumnMajor3.
 *
 * ⚠️ STILL VERIFY ON FIRST DEVICE BUILD: type signatures were checked, but
 * this has not actually been *run* — no Android/iOS SDK was available in the
 * environment this was written in. If face registration produces visibly
 * wrong crops, render the aligned crop to an <Image> on screen first (see
 * FaceVerificationTestScreen) to confirm whether the bug is in this
 * alignment step before suspecting the model math.
 */
import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';
import { estimateAffineTransform, ARCFACE_DST } from './geometry';

export const ARCFACE_INPUT_SIZE = 112;

// drawImageRect's `paint` param is typed as required (not `paint?`), unlike
// drawImage's — reuse one default paint rather than risking `null` there.
const defaultPaint = () => Skia.Paint();

/** Decode a captured photo once; reuse the returned handle for every step below. */
export async function decodePhoto(fileUri) {
  const data = await Skia.Data.fromURI(fileUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Failed to decode captured photo.');
  return image;
}

function readRgbaPixels(skImage, width, height) {
  const pixels = skImage.readPixels(0, 0, {
    width,
    height,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  });
  if (!pixels) throw new Error('Failed to read pixels from rendered surface.');
  return pixels; // Uint8Array, 4 bytes/pixel (RGBA)
}

function drawResized(image, srcRect, size) {
  const surface = Skia.Surface.MakeOffscreen(size.width, size.height);
  if (!surface) throw new Error('Failed to create offscreen Skia surface.');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));
  canvas.drawImageRect(image, srcRect, Skia.XYWHRect(0, 0, size.width, size.height), defaultPaint());
  return readRgbaPixels(surface.makeImageSnapshot(), size.width, size.height);
}

/**
 * Normalize an RGBA pixel buffer into the (1,3,H,W) Float32Array tensor the
 * ONNX models expect — same per-pixel math as onnxPipeline.js's videoToTensor.
 */
function rgbaToTensor(pixels, width, height, bgr) {
  const numPixels = width * height;
  const tensor = new Float32Array(3 * numPixels);
  for (let i = 0; i < numPixels; i++) {
    const r = (pixels[i * 4] - 127.5) / 128;
    const g = (pixels[i * 4 + 1] - 127.5) / 128;
    const b = (pixels[i * 4 + 2] - 127.5) / 128;
    if (bgr) {
      tensor[0 * numPixels + i] = b;
      tensor[1 * numPixels + i] = g;
      tensor[2 * numPixels + i] = r;
    } else {
      tensor[0 * numPixels + i] = r;
      tensor[1 * numPixels + i] = g;
      tensor[2 * numPixels + i] = b;
    }
  }
  return tensor;
}

/**
 * Stretch-resize a decoded photo to size×size (NOT letterboxed — SCRFD's
 * stride math assumes a direct non-aspect-preserving resize, same as the web
 * app's `ctx.drawImage(videoEl, 0, 0, width, height)`).
 */
export function photoToDetectorTensor(image, size, bgr = false) {
  const pixels = drawResized(image, Skia.XYWHRect(0, 0, image.width(), image.height()), {
    width: size,
    height: size,
  });
  return rgbaToTensor(pixels, size, size, bgr);
}

/**
 * Affine-align a face crop to 112×112 using 5-point landmarks, mirroring
 * onnxPipeline.js's cropAndAlignFace + canvasToArcFaceTensor. Falls back to a
 * simple centered crop if landmarks are missing or the transform is degenerate
 * (same fallback the web version uses).
 */
export function alignFaceAsArcFaceTensor(image, landmarks) {
  const size = ARCFACE_INPUT_SIZE;
  const surface = Skia.Surface.MakeOffscreen(size, size);
  if (!surface) throw new Error('Failed to create offscreen Skia surface.');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const transform = landmarks && landmarks.length >= 5 ? estimateAffineTransform(landmarks, ARCFACE_DST) : null;

  if (transform) {
    const { m11, m12, m21, m22, dx, dy } = transform;
    // Row-major SkMatrix: [scaleX, skewX, transX, skewY, scaleY, transY, 0, 0, 1]
    const matrix = Skia.Matrix([m11, m21, dx, m12, m22, dy, 0, 0, 1]);
    canvas.save();
    canvas.concat(matrix);
    canvas.drawImage(image, 0, 0);
    canvas.restore();
  } else {
    const src = landmarks && landmarks.length ? landmarks : [[0, 0], [image.width(), image.height()]];
    const xs = src.map((p) => p[0]);
    const ys = src.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const faceW = Math.max(50, (maxX - minX) * 2.2);
    const faceH = Math.max(50, (maxY - minY) * 2.8);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2 + (maxY - minY) * 0.1;
    const cropX = Math.max(0, cx - faceW / 2);
    const cropY = Math.max(0, cy - faceH / 2);

    canvas.drawImageRect(
      image,
      Skia.XYWHRect(cropX, cropY, faceW, faceH),
      Skia.XYWHRect(0, 0, size, size),
      defaultPaint()
    );
  }

  const pixels = readRgbaPixels(surface.makeImageSnapshot(), size, size);
  return rgbaToTensor(pixels, size, size, false); // ArcFace uses RGB order, not BGR
}

/**
 * Downsized RGBA pixel buffer for cheap frame-quality analysis (brightness,
 * blur, face centering) — mirrors faceQualityService.js's getFrameData.
 * Returns { pixels, width, height, scale } — `scale` converts full-photo
 * coordinates (e.g. a face box) into this buffer's coordinate space.
 */
export function photoToQualityBuffer(image, maxDim = 320) {
  const scale = Math.min(1, maxDim / Math.max(image.width(), image.height()));
  const width = Math.max(1, Math.round(image.width() * scale));
  const height = Math.max(1, Math.round(image.height() * scale));
  const pixels = drawResized(image, Skia.XYWHRect(0, 0, image.width(), image.height()), { width, height });
  return { pixels, width, height, scale };
}
