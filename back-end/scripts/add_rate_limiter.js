const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');

fs.readdir(routesDir, (err, files) => {
    if (err) {
        console.error("Could not list the directory.", err);
        process.exit(1);
    }

    files.forEach((file, index) => {
        if (!file.endsWith('.js')) return;

        const filePath = path.join(routesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        if (content.includes('generalLimiter')) {
            console.log(`Skipping ${file} - generalLimiter already present.`);
            return;
        }

        // Find where to insert
        // Look for: const router = express.Router(); or similar
        const routerRegex = /const\s+router\s*=\s*express\.Router\([^)]*\);/g;
        const match = routerRegex.exec(content);

        if (match) {
            const insertIndex = match.index + match[0].length;
            const insertText = `\nconst { generalLimiter } = require('../middleware/rateLimiter');\nrouter.use(generalLimiter);\n`;
            
            content = content.slice(0, insertIndex) + insertText + content.slice(insertIndex);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        } else {
            console.log(`Warning: Could not find router initialization in ${file}`);
        }
    });
});
