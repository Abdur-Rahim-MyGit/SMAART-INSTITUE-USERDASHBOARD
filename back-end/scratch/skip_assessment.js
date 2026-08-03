require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const filter = { email: { $regex: 'dharsini', $options: 'i' } };
    
    // Check students
    const students = await mongoose.connection.db.collection('students').find(filter).toArray();
    console.log('Found Students:', students.map(s => ({ email: s.email, isAssessmentCompleted: s.isAssessmentCompleted, isRegistered: s.isRegistered })));

    // Update students
    const studentRes = await mongoose.connection.db.collection('students').updateMany(filter, {
      $set: {
        isAssessmentCompleted: true,
        isRegistered: true,
        profileStatus: 'approved'
      }
    });
    console.log('Students updated:', studentRes.modifiedCount);

    // Update users
    const userRes = await mongoose.connection.db.collection('users').updateMany(filter, {
      $set: {
        isAssessmentCompleted: true,
        isRegistered: true,
        profileStatus: 'approved'
      }
    });
    console.log('Users updated:', userRes.modifiedCount);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
