const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Connection error:', error);
    process.exit(1);
  }
}

// Define the Schema for Career Directions (Dynamic)
const careerDirectionSchema = new mongoose.Schema({}, { strict: false });
const CareerDirection = mongoose.models.CareerDirectionNew || mongoose.model('CareerDirectionNew', careerDirectionSchema, 'careerdirections');

async function importDirections() {
  await connectDB();

  const excelPath = path.join(__dirname, '..', '..', 'docs', 'Career Direction-Bcom BBA BCA BSc (15.05.26) .xlsx');
  
  if (!require('fs').existsSync(excelPath)) {
    console.error('Excel file not found at:', excelPath);
    process.exit(1);
  }

  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Use header: 1 to get raw rows
  const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (rows.length < 1) {
    console.error('No data found in excel');
    process.exit(1);
  }

  const headers = rows[0];
  const dataToInsert = [];

  // Skip header row and process data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows or decorative rows
    if (!row || row.length === 0 || (row[0] && typeof row[0] === 'string' && (row[0].startsWith('◆') || row[0].startsWith('Career Directions')))) {
      continue;
    }

    // Map row array to object using headers
    const doc = {};
    headers.forEach((header, index) => {
      if (header) {
        doc[header] = row[index] !== undefined ? row[index] : null;
      }
    });

    // Ensure we have at least a Direction ID before inserting
    if (doc['Direction ID']) {
      dataToInsert.push(doc);
    }
  }

  console.log(`Prepared ${dataToInsert.length} records for import.`);

  if (dataToInsert.length > 0) {
    try {
      // Clear existing collection as requested to start fresh
      await CareerDirection.deleteMany({});
      console.log('Cleared existing careerdirections collection.');

      await CareerDirection.insertMany(dataToInsert);
      console.log(`Successfully imported ${dataToInsert.length} career directions.`);
    } catch (err) {
      console.error('Error during insertion:', err);
    }
  }

  console.log('Import complete.');
  process.exit(0);
}

importDirections();
