const fs = require('fs');
const filePath = 'c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/BaseLineTest.jsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('sidebar') || line.toLowerCase().includes('layout')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
