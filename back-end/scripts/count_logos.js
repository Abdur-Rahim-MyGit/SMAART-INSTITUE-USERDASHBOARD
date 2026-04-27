const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const College = require('./models/College');

async function count() {
  await mongoose.connect(process.env.MONGODB_URI);
  const n = await College.countDocuments({ logo: { $exists: true, $ne: '' } });
  console.log('Colleges with logos:', n);
  const colleges = await College.find({ logo: { $exists: true, $ne: '' } }, 'collegeName logo');
  colleges.forEach(c => console.log(`- ${c.collegeName}: ${c.logo}`));
  process.exit(0);
}
count();
