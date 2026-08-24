const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
const tokens = content.match(/<div(?![^>]*\/>)|<\/div>/g) || [];
let stack = [];
tokens.forEach(token => {
    if (token === '<div') stack.push('div');
    else {
        if (stack.length === 0) console.log('Extra </div> found');
        else stack.pop();
    }
});
console.log('Final stack size:', stack.length);
