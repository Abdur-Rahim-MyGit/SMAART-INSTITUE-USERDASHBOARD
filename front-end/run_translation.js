import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EN_PATH = path.join(__dirname, 'src', 'locales', 'en', 'translation.json');
const AR_DIR = path.join(__dirname, 'src', 'locales', 'ar');
const AR_PATH = path.join(AR_DIR, 'translation.json');

// Ensure target directory exists
if (!fs.existsSync(AR_DIR)) {
  fs.mkdirSync(AR_DIR, { recursive: true });
}

function flatten(obj, prefix = '') {
  let result = {};
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(result, flatten(obj[key], prefix + key + '.'));
    } else {
      result[prefix + key] = obj[key];
    }
  }
  return result;
}

function unflatten(flat) {
  let result = {};
  for (let key in flat) {
    let parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];
      if (i === parts.length - 1) {
        current[part] = flat[key];
      } else {
        if (!current[part] || typeof current[part] !== 'object') {
          current[part] = {};
        }
        current = current[part];
      }
    }
  }
  return result;
}

async function translateText(text) {
  if (!text || typeof text !== 'string') return '';
  
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Google Translate HTTP error! status: ${res.status}`);
  }
  const data = await res.json();
  
  let translated = '';
  if (data && data[0]) {
    for (let sentence of data[0]) {
      if (sentence && sentence[0]) {
        translated += sentence[0];
      }
    }
  }
  return translated || text;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log("Loading English translations...");
  const enData = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));
  const enFlat = flatten(enData);
  
  let arFlat = {};
  if (fs.existsSync(AR_PATH)) {
    console.log("Loading existing Arabic translations...");
    try {
      const arData = JSON.parse(fs.readFileSync(AR_PATH, 'utf-8'));
      arFlat = flatten(arData);
    } catch (e) {
      console.warn("Could not parse existing Arabic file, starting fresh", e);
    }
  }

  const keys = Object.keys(enFlat);
  console.log(`Total keys in English: ${keys.length}`);
  
  let translatedCount = 0;
  let skippedCount = 0;

  const queue = [];
  for (const key of keys) {
    const enVal = enFlat[key];
    if (arFlat[key] && arFlat[key] !== enVal) {
      skippedCount++;
      continue;
    }
    if (!enVal || !isNaN(enVal)) {
      arFlat[key] = enVal;
      skippedCount++;
      continue;
    }
    queue.push(key);
  }

  console.log(`Skipped/Pre-existing: ${skippedCount}`);
  console.log(`Remaining keys to translate: ${queue.length}`);

  const CONCURRENCY = 25;
  let index = 0;

  async function worker() {
    while (true) {
      const myIndex = index++;
      if (myIndex >= queue.length) break;
      
      const key = queue[myIndex];
      const enVal = enFlat[key];

      try {
        const arVal = await translateText(enVal);
        arFlat[key] = arVal;
        translatedCount++;
        
        if (translatedCount % 20 === 0) {
          console.log(`Translated ${translatedCount}/${queue.length}...`);
          const arNested = unflatten(arFlat);
          fs.writeFileSync(AR_PATH, JSON.stringify(arNested, null, 2), 'utf-8');
        }
        
        // Slight staggered delay
        await sleep(50);
      } catch (err) {
        console.error(`Error at index ${myIndex} (value: "${enVal}"):`, err.message);
        await sleep(500);
        // Retry once
        try {
          const arVal = await translateText(enVal);
          arFlat[key] = arVal;
          translatedCount++;
        } catch (retryErr) {
          console.error(`Failed retry for "${enVal}":`, retryErr.message);
          arFlat[key] = enVal; // fallback
        }
      }
    }
  }

  // Start concurrent worker threads/tasks
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // Final save
  const arNested = unflatten(arFlat);
  fs.writeFileSync(AR_PATH, JSON.stringify(arNested, null, 2), 'utf-8');
  console.log(`Translation completed! Total newly translated: ${translatedCount}, Total skipped: ${skippedCount}`);
}

run();
