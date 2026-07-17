const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/components/DashboardLayout.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('isImmersiveRoute')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
