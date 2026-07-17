const fs = require('fs');

function searchModel(file) {
  const content = fs.readFileSync(file, 'utf8');
  console.log(`--- ${file} ---`);
  content.split('\n').forEach((line, idx) => {
    if (line.toLowerCase().includes('district') || line.toLowerCase().includes('pincode')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

searchModel('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/models/Student.js');
searchModel('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/models/Registration.js');
