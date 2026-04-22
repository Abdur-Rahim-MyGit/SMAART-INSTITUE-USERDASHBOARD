const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Student = require('./models/Student');
const User = require('./models/User');
const College = require('./models/College');

async function debugUser() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Searching for Rahul...');
  let user = await User.findOne({ fullName: /Rahul/i }).populate('college');
  if (!user) {
    user = await Student.findOne({ fullName: /Rahul/i }).populate('college');
  }

  if (user) {
    console.log('User Found:', user.fullName);
    console.log('Email:', user.email);
    console.log('College ID from Doc:', user.college?._id || user.college);
    console.log('College Name:', user.college?.collegeName);
    console.log('College Logo:', user.college?.logo);
  } else {
    console.log('Rahul not found');
  }
  process.exit(0);
}
debugUser();
