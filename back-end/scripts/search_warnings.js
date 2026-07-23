const fs = require('fs');
const filePath = 'c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/ComprehensiveSignup.jsx';
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

lines.forEach((line, idx) => {
  if (line.includes('showDashboardWarning') || line.includes('setShowDashboardWarning')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
