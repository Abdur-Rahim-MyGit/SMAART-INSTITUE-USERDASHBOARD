require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // roleSkills uses 'roleTitle' not 'Job Role'
  const distinctTitles = await db.collection('roleSkills').distinct('roleTitle');
  console.log('=== roleSkills distinct roleTitle values ===');
  console.log(distinctTitles.sort());
  console.log('Total:', distinctTitles.length);

  const python = await db.collection('roleSkills').findOne({ roleTitle: { $regex: /python/i } });
  console.log('\n=== Python in roleSkills ===');
  console.log(python ? python.roleTitle : 'NOT FOUND');

  // Show sample with full structure
  const s = await db.collection('roleSkills').findOne({});
  console.log('\n=== Sample roleSkills doc ===');
  console.log(JSON.stringify(s, null, 2));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
