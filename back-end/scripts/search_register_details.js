const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/routes/users.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('register-details')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
