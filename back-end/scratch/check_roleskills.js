require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check roleSkills collection for Python Developer
  const rs = await db.collection('roleSkills').findOne({ 'Job Role': 'Python Developer' });
  console.log('=== roleSkills for Python Developer ===');
  console.log(rs ? JSON.stringify(rs, null, 2) : 'NOT FOUND');

  // Check what role names exist in roleSkills (sample)
  const sample = await db.collection('roleSkills').find({}).limit(5).toArray();
  console.log('\n=== roleSkills sample keys and Role fields ===');
  if (sample.length > 0) {
    console.log('Keys:', Object.keys(sample[0]));
    sample.forEach(r => console.log('  Role:', r['Job Role'] || r['role_name'] || r['roleName'] || Object.keys(r).slice(0,4)));
  } else {
    console.log('EMPTY collection');
  }

  // Check role-skills endpoint: what the route uses
  const distinct = await db.collection('roleSkills').distinct('Job Role');
  console.log('\n=== All distinct role names in roleSkills ===');
  console.log(distinct.sort());

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
