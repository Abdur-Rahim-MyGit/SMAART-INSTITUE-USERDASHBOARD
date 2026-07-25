const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/services';
if (fs.existsSync(dir)) {
  fs.readdirSync(dir).forEach(file => {
    console.log(`File: ${file}`);
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    content.split('\n').forEach((line, idx) => {
      if (line.includes('assessment') || line.includes('Assessment') || line.includes('apiCall')) {
        console.log(`  Line ${idx + 1}: ${line.trim()}`);
      }
    });
  });
} else {
  console.log('Dir does not exist');
}
