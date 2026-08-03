/**
 * Fetch / place the YOLO object-detection model for proctoring.
 *
 * The proctoring engine's object detection (phone/book) uses a YOLOv8n ONNX
 * model at:  front-end/public/models/onnx/yolov8n.onnx
 *
 * The pipeline (src/services/onnxPipeline.js) expects a standard Ultralytics
 * YOLOv8 export: input [1,3,640,640] RGB 0–1, output [1,84,8400] (or the
 * transposed [1,8400,84]). If the file is absent, object detection simply
 * no-ops — the rest of proctoring is unaffected.
 *
 * ── Recommended (canonical) — export it yourself ────────────────────────────
 *   pip install ultralytics
 *   yolo export model=yolov8n.pt format=onnx imgsz=640 opset=12
 *   # then move yolov8n.onnx → front-end/public/models/onnx/
 *
 * ── Or download a pre-exported one ──────────────────────────────────────────
 *   Set YOLO_MODEL_URL to a trusted URL of a *standard* YOLOv8n ONNX and run:
 *   node scripts/fetch-yolo-model.mjs
 *   (Do NOT use a quantized/NMS-embedded export — the output shape must be
 *    [1,84,8400]. If detections never fire, the model layout is different.)
 *
 * Usage:  node scripts/fetch-yolo-model.mjs
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEST_DIR = path.join(__dirname, '..', 'public', 'models', 'onnx');
const DEST = path.join(DEST_DIR, 'yolov8n.onnx');
const URL = process.env.YOLO_MODEL_URL || '';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close(); fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve, reject);
      }
      if (res.statusCode !== 200) { file.close(); fs.unlinkSync(dest); return reject(new Error(`HTTP ${res.statusCode}`)); }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => { try { fs.unlinkSync(dest); } catch (_) {} reject(err); });
  });
}

(async () => {
  if (fs.existsSync(DEST) && fs.statSync(DEST).size > 1_000_000) {
    console.log(`✅ Model already present: ${DEST} (${(fs.statSync(DEST).size / 1e6).toFixed(1)} MB)`);
    return;
  }
  fs.mkdirSync(DEST_DIR, { recursive: true });

  if (!URL) {
    console.log('ℹ️  No YOLO_MODEL_URL set. Export the model yourself:');
    console.log('    pip install ultralytics');
    console.log('    yolo export model=yolov8n.pt format=onnx imgsz=640 opset=12');
    console.log(`    move yolov8n.onnx → ${DEST}`);
    console.log('\n(Object detection stays disabled — proctoring works without it — until the file exists.)');
    return;
  }

  console.log(`⬇️  Downloading YOLOv8n ONNX from ${URL} …`);
  try {
    await download(URL, DEST);
    console.log(`✅ Saved to ${DEST} (${(fs.statSync(DEST).size / 1e6).toFixed(1)} MB)`);
    console.log('   Verify object detection fires in a live proctored session (hold a phone in frame).');
  } catch (err) {
    console.error('❌ Download failed:', err.message);
    console.error('   Export it manually (see header) and place it at', DEST);
    process.exitCode = 1;
  }
})();
