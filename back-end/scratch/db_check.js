const mongoose = require('mongoose');

async function checkRemoteDatabase() {
  const mongoUri = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';
  console.log('Connecting to remote MongoDB...');
  
  try {
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Successfully connected to remote MongoDB!\n');
    
    const db = mongoose.connection.db;
    console.log('Current database:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('Collections in this database:');
    collections.forEach(col => console.log(` - ${col.name}`));
    
    // Check colleges
    try {
      const collegeCol = db.collection('colleges');
      const collegeCount = await collegeCol.countDocuments();
      console.log(`\nColleges Count: ${collegeCount}`);
      
      const allColleges = await collegeCol.find({}).toArray();
      console.log('\n--- Registered Colleges ---');
      allColleges.forEach((c, idx) => {
        console.log(`[${idx + 1}] Name: "${c.collegeName}" | Code: "${c.collegeCode}" | Status: "${c.status}"`);
      });
    } catch (e) {
      console.log('Error listing colleges:', e.message);
    }

    // Check students
    try {
      const studentCol = db.collection('students');
      const studentCount = await studentCol.countDocuments();
      console.log(`\nStudents Count: ${studentCount}`);
      
      const sampleStudents = await studentCol.find({}).limit(5).toArray();
      console.log('\n--- Sample Students ---');
      sampleStudents.forEach((s, idx) => {
        console.log(`[${idx + 1}] Email: "${s.email}" | Name: "${s.fullName}" | College ID: "${s.college || s.collegeId}"`);
      });
    } catch (e) {
      console.log('Error listing students:', e.message);
    }
    
  } catch (error) {
    console.error('Remote database connection or query error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkRemoteDatabase();
