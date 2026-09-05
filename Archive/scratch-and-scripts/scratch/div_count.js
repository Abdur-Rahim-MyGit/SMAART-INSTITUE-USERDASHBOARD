const fs = require('fs');
let content = fs.readFileSync('front-end/src/pages/Profile.jsx', 'utf8');
content = content.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '""');
const open = (content.match(/<div(?![^>]*\/>)/g) || []).length;
const close = (content.match(/<\/div>/g) || []).length;
console.log(`Open: ${open}, Close: ${close}`);
