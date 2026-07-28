const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath, query);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(query)) {
        console.log(`File: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(query)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

console.log('--- Search Results for "/assessment/" ---');
searchDir('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src', '/assessment/');
console.log('--- Search Results for "assessments/baseline" ---');
searchDir('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src', 'assessments/baseline');
