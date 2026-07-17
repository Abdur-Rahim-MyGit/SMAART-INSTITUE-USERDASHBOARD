const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/ComprehensiveSignup.jsx', 'utf8');
const lines = content.split('\n');

let inSubmit = false;
let bracketCount = 0;

lines.forEach((line, idx) => {
  if (line.includes('handleSubmit') || line.includes('handleFinalSubmit') || line.includes('save') || line.includes('fetch(') || line.includes('axios.')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
