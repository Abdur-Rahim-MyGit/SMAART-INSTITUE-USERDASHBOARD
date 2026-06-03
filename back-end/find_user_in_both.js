const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const user = await User.findById('69e0c4dc56ab75fec31c6109');
    if (user) {
      console.log('Found in User collection:');
      console.log(`- ID: ${user._id}`);
      console.log(`  Name: ${user.fullName}`);
      console.log(`  Email: ${user.email}`);
    } else {
      console.log('Not found in User collection.');
    }

    const student = await Student.findById('69e0c4dc56ab75fec31c6109');
    if (student) {
      console.log('Found in Student collection:');
      console.log(`- ID: ${student._id}`);
      console.log(`  Name: ${student.fullName}`);
      console.log(`  Email: ${student.email}`);
    } else {
      console.log('Not found in Student collection.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
