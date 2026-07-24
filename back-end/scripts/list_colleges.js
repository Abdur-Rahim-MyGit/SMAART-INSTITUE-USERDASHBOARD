// Script to list all colleges and their status
const mongoose = require('mongoose');
require('dotenv').config();

const College = require('./models/College');

async function listColleges() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('Connecting to:', mongoUri.replace(/\/\/.*:.*@/, '//****:****@'));
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in database:');
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Get all colleges
    const colleges = await College.find({}).sort({ collegeName: 1 });
    
    console.log(`\nTotal colleges in database: ${colleges.length}\n`);
    console.log('='.repeat(80));
    
    colleges.forEach((college, index) => {
      console.log(`\n${index + 1}. ${college.collegeName}`);
      console.log(`   Code: ${college.collegeCode}`);
      console.log(`   Status: ${college.status}`);
      console.log(`   Email: ${college.email}`);
      if (college.address) {
        console.log(`   City: ${college.address.city}, State: ${college.address.state}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Count by status
    const statusCounts = await College.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('\nColleges by status:');
    statusCounts.forEach(s => {
      console.log(`  ${s._id}: ${s.count}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

listColleges();
