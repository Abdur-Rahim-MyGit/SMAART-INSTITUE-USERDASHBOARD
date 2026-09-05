const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');

const regex = /<div(?![^>]*\/>)|<\/div>|<motion.div(?![^>]*\/>)|<\/motion.div>|<AnimatePresence(?![^>]*\/>)|<\/AnimatePresence>|{|}|\(|\)/g;
let stack = [];
content.split('\n').forEach((line, i) => {
    let match;
    while ((match = regex.exec(line)) !== null) {
        const token = match[0];
        if (token === '{' || token === '(' || token.startsWith('<')) {
            stack.push({ token, line: i + 1 });
        } else {
            const last = stack.pop();
            if (!last) {
                console.log(`Extra closing token ${token} at line ${i + 1}`);
                continue;
            }
            const expected = {
                '}': '{',
                ')': '(',
                '</div>': '<div',
                '</motion.div>': '<motion.div',
                '</AnimatePresence>': '<AnimatePresence'
            }[token];
            
            if (expected && last.token !== expected) {
                console.log(`Mismatch at line ${i + 1}: got ${token}, expected close for ${last.token} from line ${last.line}`);
            }
        }
    }
});
if (stack.length > 0) {
    console.log('Unclosed tokens:');
    stack.forEach(s => console.log(`  ${s.token} from line ${s.line}`));
}
