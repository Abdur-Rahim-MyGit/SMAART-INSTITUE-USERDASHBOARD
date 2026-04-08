const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Student = require('./models/Student');
const College = require('./models/College');

async function debugUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find a student with a college
    const student = await Student.findOne({ college: { $exists: true, $ne: null } })
      .populate('college', 'logo collegeName');
    
    if (student) {
      console.log('--- Student with College ---');
      console.log('Email:', student.email);
      console.log('College:', student.college);
    } else {
      console.log('No student found with a college');
    }

    // Find a user with a college
    const user = await User.findOne({ college: { $exists: true, $ne: null } })
      .populate('college', 'logo collegeName');
    
    if (user) {
      console.log('\n--- User with College ---');
      console.log('Email:', user.email);
      console.log('College:', user.college);
    } else {
      console.log('No user found with a college');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugUser();
