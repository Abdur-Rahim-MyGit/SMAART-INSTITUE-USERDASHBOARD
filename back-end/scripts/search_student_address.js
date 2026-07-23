const fs = require('fs');
const content = fs.readFileSync('c:/Users/Rashad/Documents/SMAART-INSTITUE-USERDASHBOARD/back-end/models/Student.js', 'utf8');
const lines = content.split('\n');

let printLines = false;
let braceCount = 0;

lines.forEach((line, idx) => {
  if (line.includes('address:')) {
    printLines = true;
  }
  if (printLines) {
    console.log(`Line ${idx + 1}: ${line}`);
    if (line.includes('{')) braceCount++;
    if (line.includes('}')) braceCount--;
    if (braceCount === 0 && line.includes('}')) {
      printLines = false;
    }
  }
});
