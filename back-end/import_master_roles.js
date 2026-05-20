require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

// Connect to MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';

const careerRolesSchema = new mongoose.Schema({}, { strict: false });
const CareerRoleModel = mongoose.models['CareerRole'] || mongoose.model('CareerRole', careerRolesSchema, 'careerroles');

async function importRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const filePath = '/home/soubanaadi/Documents/User-Dashboard/SMAART-INSTITUE-USERDASHBOARD/Req/Master Job Role List- 1000 roles (14.5.26)_.xlsx';
    console.log(`Reading Excel file: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read from range: 1 to skip the title row and use the real headers
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '', range: 1 });
    console.log(`Parsed ${data.length} rows. Starting import...`);

    let upsertCount = 0;
    
    for (const row of data) {
      const jobRole = row['Job Role'];
      if (!jobRole) continue; // Skip if empty role
      
      const mappedData = {
        role_name: jobRole,
        role_id: row['Role ID'],
        job_family_code: row['Job Family Code'],
        job_family: row['Job Family'],
        level: row['Level'],
        updatedAt: new Date()
      };

      await CareerRoleModel.findOneAndUpdate(
        { role_name: jobRole },
        { $set: mappedData },
        { upsert: true, new: true }
      );
      
      upsertCount++;
      if (upsertCount % 100 === 0) {
        console.log(`Processed ${upsertCount} roles...`);
      }
    }

    console.log(`\nImport complete! Successfully upserted ${upsertCount} roles into the 'careerroles' collection.`);
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importRoles();
