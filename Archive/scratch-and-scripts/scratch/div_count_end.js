const fs = require('fs');
let content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
const lines = content.split('\n');
let subContent = lines.slice(1000).join('\n');
subContent = subContent.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""');
const open = (subContent.match(/<div(?![^>]*\/>)/g) || []).length;
const close = (subContent.match(/<\/div>/g) || []).length;
console.log(`Lines 1000-end - Open: ${open}, Close: ${close}`);
