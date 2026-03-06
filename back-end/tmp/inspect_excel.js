const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'AI AGNEENT OUTPUT.xlsx');
try {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('Rows (first 5):', rows.slice(0, 5));
} catch (err) {
    console.error('Error reading excel:', err.message);
}
