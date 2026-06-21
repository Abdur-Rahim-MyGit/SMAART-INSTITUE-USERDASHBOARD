const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }), 'registrations');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const email = 'vumakumar@gmail.com';

    const user = await User.findOne({ email });
    console.log('USER DOCUMENT:', JSON.stringify(user, null, 2));

    const student = await Student.findOne({ email });
    console.log('STUDENT DOCUMENT:', JSON.stringify(student, null, 2));

    const registration = await Registration.findOne({ email });
    console.log('REGISTRATION DOCUMENT:', JSON.stringify(registration, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
