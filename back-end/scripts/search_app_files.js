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
    } else if (file.toLowerCase().includes('app') || file.toLowerCase().includes('route')) {
      console.log(fullPath);
    }
  }
}

searchDir('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src');
