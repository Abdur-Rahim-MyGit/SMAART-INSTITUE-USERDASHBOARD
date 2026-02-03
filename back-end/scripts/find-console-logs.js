/**
 * Script to find and report console.log statements in the codebase
 * Run: node scripts/find-console-logs.js
 */

const fs = require('fs');
const path = require('path');

const excludeDirs = ['node_modules', 'logs', 'uploads', '.git', 'dist', 'build'];
const includeExtensions = ['.js', '.jsx'];

let totalCount = 0;
const fileResults = [];

function searchDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!excludeDirs.includes(file)) {
                searchDirectory(filePath);
            }
        } else if (includeExtensions.includes(path.extname(file))) {
            searchFile(filePath);
        }
    });
}

function searchFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const matches = [];

    lines.forEach((line, index) => {
        if (line.includes('console.log') || line.includes('console.error') ||
            line.includes('console.warn') || line.includes('console.info')) {
            matches.push({
                line: index + 1,
                content: line.trim()
            });
            totalCount++;
        }
    });

    if (matches.length > 0) {
        fileResults.push({
            file: filePath,
            count: matches.length,
            matches
        });
    }
}

// Start search
console.log('🔍 Searching for console statements...\n');
searchDirectory(path.join(__dirname, '..'));

// Display results
console.log(`📊 Found ${totalCount} console statements in ${fileResults.length} files\n`);

if (fileResults.length > 0) {
    console.log('Files with console statements:\n');

    fileResults
        .sort((a, b) => b.count - a.count)
        .forEach(result => {
            console.log(`\n📄 ${result.file} (${result.count} occurrences)`);
            result.matches.slice(0, 3).forEach(match => {
                console.log(`   Line ${match.line}: ${match.content.substring(0, 80)}...`);
            });
            if (result.matches.length > 3) {
                console.log(`   ... and ${result.matches.length - 3} more`);
            }
        });

    console.log('\n\n💡 Recommendation: Replace console statements with logger from utils/logger.js');
    console.log('   Example: logger.info("message") or logger.error("error", { details })');
}

process.exit(0);
