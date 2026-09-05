const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');

let stack = [];
content.split('\n').forEach((line, i) => {
    const tokens = line.match(/<div(?![^>]*\/>)|<\/div>/g) || [];
    tokens.forEach(token => {
        if (token.startsWith('<div')) {
            stack.push(i + 1);
        } else {
            if (stack.length === 0) {
                console.log(`Extra </div> at line ${i+1}`);
            } else {
                stack.pop();
            }
        }
    });
});
if (stack.length > 0) {
    console.log(`Unclosed <div> started at lines: ${stack.join(', ')}`);
} else {
    console.log('All <div> tags are balanced.');
}
