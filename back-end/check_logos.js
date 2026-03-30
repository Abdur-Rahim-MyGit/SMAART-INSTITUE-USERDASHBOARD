const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const College = require('./models/College');

async function checkColleges() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Searching for colleges with logos...');
    const colleges = await College.find({ logo: { $exists: true, $ne: '' } });
    console.log(`Found ${colleges.length} colleges with logos.`);
    colleges.forEach(c => {
      console.log(`- ${c.collegeName}: ${c.logo}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkColleges();
