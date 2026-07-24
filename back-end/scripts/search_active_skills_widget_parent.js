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
      if (content.includes('ActiveSkillsWidget')) {
        console.log(`File: ${fullPath}`);
        content.split('\n').forEach((line, idx) => {
          if (line.includes('<ActiveSkillsWidget')) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src');
