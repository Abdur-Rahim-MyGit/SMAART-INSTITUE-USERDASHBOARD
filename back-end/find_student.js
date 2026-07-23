const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/minds';
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Find a student
    const student = await db.collection('students').findOne({});
    if (student) {
      console.log('Found student in students collection:', student._id, student.email);
    } else {
      console.log('No student in students collection.');
    }

    const user = await db.collection('users').findOne({ role: 'student' });
    if (user) {
      console.log('Found user with role student:', user._id, user.email);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
