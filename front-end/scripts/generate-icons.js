import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('public', 'logo.png');
const out192 = path.resolve('public', 'pwa-192x192.png');
const out512 = path.resolve('public', 'pwa-512x512.png');

if (!fs.existsSync(inputPath)) {
  console.error('Input file does not exist:', inputPath);
  process.exit(1);
}

async function generate() {
  try {
    await sharp(inputPath)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(out192);
    console.log('Generated pwa-192x192.png');

    await sharp(inputPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png()
      .toFile(out512);
    console.log('Generated pwa-512x512.png');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generate();
