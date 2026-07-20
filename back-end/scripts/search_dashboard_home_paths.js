const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/front-end/src/pages/DashboardHome.jsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('paths') || line.includes('Paths') || line.includes('career-agent')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
