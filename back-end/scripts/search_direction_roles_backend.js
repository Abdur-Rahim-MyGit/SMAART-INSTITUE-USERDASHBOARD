const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/routes/careerAgent.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('direction-roles')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
