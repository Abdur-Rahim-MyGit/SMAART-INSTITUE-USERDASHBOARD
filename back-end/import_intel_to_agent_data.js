require('dotenv').config();
const mongoose = require('mongoose');
const xlsx = require('xlsx');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smaart_dashboard';

async function importToAgentData() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    
    // Explicitly target the 'career_agent_data' collection
    const collection = mongoose.connection.collection('career_agent_data');

    const filePath = '/home/soubanaadi/Documents/User-Dashboard/SMAART-INSTITUE-USERDASHBOARD/Req/Master_Market Intel_Narratives(14.05.26).xlsx';
    console.log(`Reading Excel file: ${filePath}`);
    
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const data = xlsx.utils.sheet_to_json(sheet, { defval: '', range: 4 });
    console.log(`Parsed ${data.length} rows. Starting import into career_agent_data...`);

    let insertCount = 0;
    
    for (const row of data) {
      const roleName = row['Role Name'];
      if (!roleName || roleName.trim() === '') continue;
      
      const mappedData = {
        'Role ID': row['Role ID'],
        'Job Family': row['Job Family'],
        'Role Name': roleName,
        'AI Exposure': row['AI Exposure '],
        'AI Exposure Level': row['AI Exposure Level'],
        'AI Exposure Detail': row['AI Exposure Detail'],
        'Human Value Tasks': row['Human Value Tasks'],
        'Salary Low (INR)': row['Salary Low (INR)'],
        'Salary High (INR)': row['Salary High (INR)'],
        'Job Adverts (~1yr)': row['Job Adverts (~1yr)'],
        'English Requirement': row['English Requirement'],
        'English Explanation': row['English Explanation'],
        'Para 1: What This Role Actually Does': row['Para 1: What This Role Actually Does'],
        'Para 2: How AI Is Changing This Role': row['Para 2: How AI Is Changing This Role'],
        'Para 3: Who Should Consider This Role': row['Para 3: Who Should Consider This Role'],
        updatedAt: new Date()
      };

      await collection.updateOne(
        { 'Role Name': roleName.trim() },
        { $set: mappedData },
        { upsert: true }
      );
      
      insertCount++;
    }

    console.log(`\nImport complete! Successfully pushed ${insertCount} records into the 'career_agent_data' collection.`);
    process.exit(0);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importToAgentData();
