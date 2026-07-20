const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        searchDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('assessment') || content.includes('Assessment')) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('navigate') && (line.includes('assessment') || line.includes('Assessment') || line.includes('test') || line.includes('test/'))) {
            console.log(`File: ${fullPath}`);
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src');
