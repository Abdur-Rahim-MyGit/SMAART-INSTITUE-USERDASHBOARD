require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // 1. Check what collections exist that are related to role-skills
  const collections = await db.listCollections().toArray();
  const names = collections.map(c => c.name).sort();
  console.log('=== ALL COLLECTIONS ===');
  console.log(names);

  // 2. Check roleskillslist for "Python Developer"
  const pythonSkills = await db.collection('roleskillslist')
    .find({ 'Job Role': 'Python Developer' })
    .limit(5)
    .toArray();
  console.log('\n=== roleskillslist Python Developer (first 5) ===');
  console.log(JSON.stringify(pythonSkills, null, 2));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
