const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/ComprehensiveSignup.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('district')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
