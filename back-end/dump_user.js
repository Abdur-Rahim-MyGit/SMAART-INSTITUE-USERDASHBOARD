const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: 'c:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/back-end/.env' });

const MONGODB_URI = process.env.MONGODB_URI;

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const Student = mongoose.model('Student', new mongoose.Schema({}, { strict: false }), 'students');
const Registration = mongoose.model('Registration', new mongoose.Schema({}, { strict: false }), 'registrations');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const email = 'vumakumar@gmail.com';
    const user = await User.findOne({ email });
    const student = await Student.findOne({ email });
    const registration = await Registration.findOne({ email });
    
    const output = {
        user, student, registration
    };
    
    fs.writeFileSync('c:/Users/dhars/Desktop/SMAART-INSTITUTE/SMAART-INSTITUE-USERDASHBOARD/back-end/user_dump.json', JSON.stringify(output, null, 2));
    console.log('Dumped to user_dump.json');
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}
run();
