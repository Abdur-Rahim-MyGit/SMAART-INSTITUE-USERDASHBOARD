const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');

const tags = [
    { open: '<div', close: '</div>' },
    { open: '<motion.div', close: '</motion.div>' },
    { open: '<AnimatePresence', close: '</AnimatePresence>' },
    { open: '<PageTransition', close: '</PageTransition>' },
    { open: '<main', close: '</main>' },
    { open: '<header', close: '</header>' },
    { open: '<section', close: '</section>' },
    { open: '<button', close: '</button>' },
    { open: '<span', close: '</span>' },
    { open: '<p', close: '</p>' },
    { open: '<h1', close: '</h1>' },
    { open: '<h2', close: '</h2>' },
    { open: '<h3', close: '</h3>' },
    { open: '<label', close: '</label>' },
    { open: '<select', close: '</select>' },
    { open: '<option', close: '</option>' },
    { open: '<textarea', close: '</textarea>' }
];

tags.forEach(tag => {
    // Regex to match opening tags (not self-closing)
    const openRegex = new RegExp(tag.open.replace('.', '\\.') + '(?![^>]*/>)', 'g');
    const closeRegex = new RegExp(tag.close.replace('.', '\\.'), 'g');
    
    const openMatches = (content.match(openRegex) || []).length;
    const closeMatches = (content.match(closeRegex) || []).length;
    
    if (openMatches !== closeMatches) {
        console.log(`Tag ${tag.open} is unbalanced: ${openMatches} open, ${closeMatches} close`);
    }
});

// Check braces
let braceDepth = 0;
content.split('').forEach((char, i) => {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
});
console.log(`Final brace depth: ${braceDepth}`);
