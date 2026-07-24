const fs = require('fs');
const https = require('https');
const path = require('path');

const ROOT = process.cwd();
const ONNX_DIR = path.join(ROOT, 'public', 'models', 'onnx');

// Create directory if not exists
fs.mkdirSync(ONNX_DIR, { recursive: true });

const MODELS = [
  {
    url: 'https://huggingface.co/hsuyabc/scrfd_2.5g_bnkps.onnx/resolve/main/scrfd_2.5g_bnkps.onnx',
    filename: 'scrfd_500m_bnkps.onnx' // We name it 500m so we don't have to change hardcoded paths
  },
  {
    url: 'https://huggingface.co/richarrrddd/w600k_r50_v1/resolve/main/w600k_r50.onnx',
    filename: 'w600k_r50.onnx'
  }
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${path.basename(dest)}...`);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirects
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      } else if (res.statusCode === 200) {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✅ Saved: ${path.basename(dest)}`);
          resolve();
        });
      } else {
        reject(new Error(`HTTP Status ${res.statusCode} for ${url}`));
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading ONNX models...');
  try {
    for (const model of MODELS) {
      const dest = path.join(ONNX_DIR, model.filename);
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
        await downloadFile(model.url, dest);
      } else {
        console.log(`⏭️  Skipping ${model.filename}, already exists.`);
      }
    }
    console.log('🎉 All ONNX models downloaded successfully!');
  } catch (err) {
    console.error('❌ Download failed:', err.message);
    process.exit(1);
  }
}

run();
