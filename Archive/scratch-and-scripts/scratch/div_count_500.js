const fs = require('fs');
let content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
const lines = content.split('\n');
let subContent = lines.slice(0, 500).join('\n');
subContent = subContent.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""');
const open = (subContent.match(/<div(?![^>]*\/>)/g) || []).length;
const close = (subContent.match(/<\/div>/g) || []).length;
console.log(`First 500 lines - Open: ${open}, Close: ${close}`);
