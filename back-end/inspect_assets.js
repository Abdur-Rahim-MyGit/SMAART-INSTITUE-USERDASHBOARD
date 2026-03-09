const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const baseDir = 'b:/FEB Final - 26 MINDS  USER DASHBOARD/SMAART-INSTITUE-USERDASHBOARD';
const assetsDir = path.join(baseDir, 'docs', 'AGENT ASSETS');

const files = [
    'india_degrees_by_level.xlsx',
    'india_jobs_detailed.xlsx'
];

const results = {};

files.forEach(filename => {
    const filePath = path.join(assetsDir, filename);
    if (fs.existsSync(filePath)) {
        try {
            const workbook = XLSX.readFile(filePath);
            results[filename] = {};
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                results[filename][sheetName] = {
                    columns: data[0] || [],
                    sample: data.slice(1, 4)
                };
            });
        } catch (e) {
            results[filename] = `Error: ${e.message}`;
        }
    } else {
        results[filename] = 'File not found';
    }
});

console.log(JSON.stringify(results, null, 2));
