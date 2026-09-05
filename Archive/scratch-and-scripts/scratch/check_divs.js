const fs = require('fs');
let content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
const originalLines = content.split('\n');

// Simplified cleanup: replace strings with empty strings to avoid false matches
// but keep line numbers correct
content = content.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, (m) => ' '.repeat(m.length));

let stack = [];
const regex = /<div|<\/div>/g;
let match;
while ((match = regex.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    if (match[0] === '<div') {
        stack.push(lineNum);
    } else {
        if (stack.length === 0) {
            console.log('Extra </div> at line ' + lineNum);
        } else {
            stack.pop();
        }
    }
}
if (stack.length > 0) {
    console.log('Unclosed <div> started at lines: ' + stack.join(', '));
} else {
    console.log('All <div> tags are balanced.');
}
