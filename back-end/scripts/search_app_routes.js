const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/App.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('assessment') || line.includes('Assessment') || line.includes('test') || line.includes('Test')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
