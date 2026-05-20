require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';

const careerRolesSchema = new mongoose.Schema({}, { strict: false });
const CareerRoleModel = mongoose.models['CareerRole'] || mongoose.model('CareerRole', careerRolesSchema, 'careerroles');

async function importMarketIntel() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully to Atlas.');

    const filePath = '/home/soubanaadi/Documents/User-Dashboard/SMAART-INSTITUE-USERDASHBOARD/Req/Master_Market Intel_Narratives(14.05.26).xlsx';
    console.log(`Reading Excel file: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Read from range 4 because the actual headers are on row 5
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '', range: 4 });
    console.log(`Parsed ${data.length} rows. Starting import/update into careerroles...`);

    let updateCount = 0;
    
    for (const row of data) {
      const roleName = row['Role Name'];
      
      // Skip empty rows or section headers
      if (!roleName || roleName.trim() === '') continue;
      
      const mappedData = {
        ai_exposure_pct: row['AI Exposure '] || '',
        ai_exposure_level: row['AI Exposure Level'] || '',
        ai_exposure_detail: row['AI Exposure Detail'] || '',
        human_value_tasks: row['Human Value Tasks'] || '',
        salary_range_low: row['Salary Low (INR)'] || '',
        salary_range_high: row['Salary High (INR)'] || '',
        job_adverts_1yr: row['Job Adverts (~1yr)'] || '',
        english_requirement: row['English Requirement'] || '',
        english_explanation: row['English Explanation'] || '',
        narrative_para1: row['Para 1: What This Role Actually Does'] || '',
        narrative_para2: row['Para 2: How AI Is Changing This Role'] || '',
        narrative_para3: row['Para 3: Who Should Consider This Role'] || '',
        updatedAt: new Date()
      };

      // Upsert into careerroles matching by exact role_name
      await CareerRoleModel.findOneAndUpdate(
        { role_name: roleName.trim() },
        { $set: mappedData },
        { upsert: true, new: true }
      );
      
      updateCount++;
      if (updateCount % 100 === 0) {
        console.log(`Processed ${updateCount} roles with Market Intel...`);
      }
    }

    console.log(`\nImport complete! Successfully updated ${updateCount} roles with Market Intelligence in the 'careerroles' collection.`);
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importMarketIntel();
