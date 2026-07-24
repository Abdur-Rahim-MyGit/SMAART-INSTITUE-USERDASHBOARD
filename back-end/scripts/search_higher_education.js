const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/ComprehensiveSignup.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('degreeStatus') || line.includes('cgpaPercentage') || line.includes('higherEducation') || line.includes('qualificationLevel')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
