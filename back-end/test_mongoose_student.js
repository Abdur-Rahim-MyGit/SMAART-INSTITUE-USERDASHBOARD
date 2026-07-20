const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Student = require('./models/Student');

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/minds';
  console.log('Connecting to:', uri);
  try {
    await mongoose.connect(uri);
    console.log('Database name:', mongoose.connection.name);

    const studentId = '69a0132cdd2dc157b475af32';
    const student = await Student.findById(studentId);
    if (student) {
      console.log('✅ Found student using Mongoose:', student._id, student.email);
    } else {
      console.log('❌ Student NOT found using Mongoose!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

test();
