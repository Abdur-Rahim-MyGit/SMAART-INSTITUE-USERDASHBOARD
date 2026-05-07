
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Student = require('../models/Student');
const College = require('../models/College');
const Registration = require('../models/Registration');

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'sharuk@gmail.com';
    const student = await Student.findOne({ email: email.toLowerCase() }).populate('college').select('+password');
    const studentRaw = await Student.findOne({ email: email.toLowerCase() }).lean();
    
    if (student) {
      console.log('Student found:');
      console.log('ID:', student._id);
      console.log('Email:', student.email);
      console.log('College ID (Populated):', student.college?._id);
      console.log('College Field (Raw):', studentRaw.college);
      console.log('College Field Type:', typeof studentRaw.college);
      console.log('Is College Field ObjectId:', studentRaw.college instanceof mongoose.Types.ObjectId);
      console.log('Must Change Password:', student.mustChangePassword);
      console.log('Has Password:', !!student.password);
    } else {
      console.log('Student not found in Student collection');
    }

    const reg = await Registration.findOne({ email: email.toLowerCase() }).select('+password');
    if (reg) {
      console.log('\nRegistration found:');
      console.log('ID:', reg._id);
      console.log('Email:', reg.email);
      console.log('Institution:', reg.institution);
      console.log('Has Password:', !!reg.password);
    } else {
      console.log('\nRegistration not found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkUser();
