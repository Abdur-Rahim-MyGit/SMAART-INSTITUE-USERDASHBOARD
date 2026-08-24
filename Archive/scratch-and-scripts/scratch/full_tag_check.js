const fs = require('fs');
const content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');

const tags = ['div', 'section', 'main', 'header', 'footer', 'aside', 'article', 'nav'];
tags.forEach(tag => {
    const open = (content.match(new RegExp('<' + tag + '(?![^>]*\\/>)', 'g')) || []).length;
    const close = (content.match(new RegExp('</' + tag + '>', 'g')) || []).length;
    if (open !== close) {
        console.log(`Tag <${tag}> is unbalanced: ${open} open, ${close} close`);
    }
});
