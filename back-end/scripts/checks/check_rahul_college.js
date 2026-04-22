const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const College = require('./models/College');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const college = await College.findById('6a0118ddd2dc157b475ad2a');
  if (college) {
    console.log('College Name:', college.collegeName);
    console.log('Logo:', college.logo);
  } else {
    console.log('College not found');
  }
  process.exit(0);
}
check();
