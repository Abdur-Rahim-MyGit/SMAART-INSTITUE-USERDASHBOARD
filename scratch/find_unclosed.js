const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
const lines = content.split('\n');
let stack = [];
lines.forEach((line, i) => {
    const tokens = line.match(/<div(?![^>]*\/>)|<\/div>/g) || [];
    tokens.forEach(token => {
        if (token === '<div') stack.push(i + 1);
        else {
            if (stack.length === 0) console.log('Extra </div> at line ' + (i + 1));
            else stack.pop();
        }
    });
});
console.log('Unclosed <div> starts at lines:', stack);
