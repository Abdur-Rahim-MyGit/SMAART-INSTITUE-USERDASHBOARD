require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';

async function importVerbatim() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    
    // Explicitly target the 'careerroles' collection
    const collection = mongoose.connection.collection('careerroles');

    const filePath = '/home/soubanaadi/Documents/User-Dashboard/SMAART-INSTITUE-USERDASHBOARD/Req/Master Job Role List- 1000 roles (14.5.26)_.xlsx';
    console.log(`Reading Excel file: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Range 1 to use the actual headers
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '', range: 1 });
    console.log(`Parsed ${data.length} rows. Starting import into careerroles verbatim...`);

    let insertCount = 0;
    
    for (const row of data) {
      const jobRole = row['Job Role'];
      if (!jobRole) continue;
      
      const mappedData = {
        'role_name': jobRole, // Keep for unique index and backend compatibility
        'Role ID': row['Role ID'],
        'Job Family Code': row['Job Family Code'],
        'Job Family': row['Job Family'],
        'Job Role': jobRole,
        'Level': row['Level'],
        updatedAt: new Date()
      };

      await collection.updateOne(
        { 'role_name': jobRole },
        { $set: mappedData },
        { upsert: true }
      );
      
      insertCount++;
    }

    console.log(`\nImport complete! Successfully pushed ${insertCount} records into the 'careerroles' collection VERBATIM.`);
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importVerbatim();
