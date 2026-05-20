const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');

let divDepth = 0;
content.split('\n').forEach((line, i) => {
    const opens = (line.match(/<div(?![^>]*\/>)/g) || []).length;
    const closes = (line.match(/<\/div>/g) || []).length;
    divDepth += opens - closes;
    if (divDepth < 0) {
        console.log(`EXTRA </div> at line ${i+1}`);
        divDepth = 0;
    }
});
console.log(`Final div depth: ${divDepth}`);
