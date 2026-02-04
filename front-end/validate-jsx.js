// Quick JSX validator for ModuleViewPage.jsx
const fs = require('fs');

const filePath = 'src/pages/ModuleViewPage.jsx';
const content = fs.readFileSync(filePath, 'utf8');

// Extract lines 700-985 (Level 3 view)
const lines = content.split('\n');
const relevantLines = lines.slice(699, 985);

// Count opening and closing tags
let divStack = [];
let lineNum = 700;

for (const line of relevantLines) {
    // Count opening divs
    const openMatches = line.match(/<div[^>]*>/g);
    if (openMatches) {
        openMatches.forEach(() => {
            divStack.push(lineNum);
        });
    }

    // Count self-closing divs
    const selfClosing = line.match(/<div[^>]*\/>/g);
    if (selfClosing) {
        selfClosing.forEach(() => {
            if (divStack.length > 0) divStack.pop();
        });
    }

    // Count closing divs
    const closeMatches = line.match(/<\/div>/g);
    if (closeMatches) {
        closeMatches.forEach(() => {
            if (divStack.length > 0) {
                divStack.pop();
            } else {
                console.log(`ERROR: Extra closing </div> at line ${lineNum}`);
            }
        });
    }

    lineNum++;
}

console.log(`\nDiv balance check:`);
console.log(`Unclosed divs: ${divStack.length}`);
if (divStack.length > 0) {
    console.log(`Opened at lines: ${divStack.join(', ')}`);
}
