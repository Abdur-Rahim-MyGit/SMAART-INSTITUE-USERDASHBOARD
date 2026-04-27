const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const College = require('./models/College');

async function testPopulation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('--- Testing Student Population ---');
    const student = await Student.findOne({ college: { $exists: true, $ne: null } })
      .populate('college', 'logo collegeName');
    
    if (student) {
      console.log('Student Email:', student.email);
      console.log('College Data:', student.college);
      if (student.college && student.college.logo) {
        console.log('✅ College Logo Found:', student.college.logo);
      } else {
        console.log('❌ College Logo Missing in populated object');
      }
    } else {
      console.log('No student with college found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testPopulation();
