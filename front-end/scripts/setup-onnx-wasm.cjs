const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'node_modules', 'onnxruntime-web', 'dist');
const DEST_DIR = path.join(ROOT, 'public', 'onnx-wasm');

if (!fs.existsSync(SRC_DIR)) {
  console.error('❌ node_modules/onnxruntime-web/dist does not exist. Run npm install first.');
  process.exit(1);
}

fs.mkdirSync(DEST_DIR, { recursive: true });

console.log('Copying ONNX Runtime Web dist files to public/onnx-wasm...');
const files = fs.readdirSync(SRC_DIR);
let count = 0;

for (const file of files) {
  const srcPath = path.join(SRC_DIR, file);
  const destPath = path.join(DEST_DIR, file);
  if (fs.statSync(srcPath).isFile()) {
    fs.copyFileSync(srcPath, destPath);
    count++;
  }
}

console.log(`✅ Successfully copied ${count} ONNX Runtime Web files into public/onnx-wasm!`);
