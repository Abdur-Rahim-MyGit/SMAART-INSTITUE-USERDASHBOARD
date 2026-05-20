const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Degree = require('../models/Degree');
require('dotenv').config();

// Configuration
const JSON_FILE_PATH = path.join(__dirname, '../../Req/Master_Degrees(1).json');

async function importDegrees() {
  let connection;
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ Error: MONGODB_URI is not defined in .env');
      process.exit(1);
    }

    console.log('⏳ Connecting to MongoDB...');
    connection = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    if (!fs.existsSync(JSON_FILE_PATH)) {
      console.error(`❌ Error: JSON file not found at ${JSON_FILE_PATH}`);
      process.exit(1);
    }

    console.log('📖 Reading JSON file...');
    const rawData = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const degrees = JSON.parse(rawData);
    console.log(`📊 Found ${degrees.length} records in JSON.`);

    const formattedDegrees = degrees.map(d => ({
      uniqueId: d['Degree ID'],
      level: d['Degree Level'],
      domain: d['Domain'],
      fullName: d['Degree Full Name'],
      abbreviation: d['Abbreviation'],
      specialization: d['Specialisation'] || 'General'
    }));


    // Check for existing data
    const existingCount = await Degree.countDocuments();
    console.log(`🗃️ Current collection has ${existingCount} records.`);

    // The user said "put these datas inside it", which usually means seeding.
    // Given the unique index in the model, we'll use insertMany with ordered: false
    // to skip duplicates if they already exist, or we can clear it if the user wants.
    // To be safe and ensure the collection matches the JSON exactly, we'll clear it.
    
    console.log('🧹 Clearing existing degrees to ensure data integrity...');
    await Degree.deleteMany({});
    console.log('✅ Collection cleared.');

    console.log('🚀 Importing degrees...');
    const result = await Degree.insertMany(formattedDegrees, { ordered: false });
    
    console.log(`✨ Successfully imported ${result.length} degrees!`);
    
  } catch (error) {
    if (error.name === 'MongoBulkWriteError') {
      console.log(`⚠️ Some records were skipped due to duplicates: ${error.writeErrors?.length || 0}`);
      console.log(`✅ Successfully inserted: ${error.result?.nInserted || 0}`);
    } else {
      console.error('❌ Import failed:', error);
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('🔌 Disconnected from MongoDB');
    }
    process.exit(0);
  }
}

importDegrees();
