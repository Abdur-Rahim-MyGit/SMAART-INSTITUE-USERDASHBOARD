const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  // Check what's in the careerdirections collection for these 3 directions
  const directions = [
    'Entrepreneurship',
    'Cloud & Infrastructure for AI',
    'Computer Vision & Specialised AI'
  ];

  for (const dir of directions) {
    const doc = await db.collection('careerdirections').findOne({
      'Career Direction': { $regex: dir.split('&')[0].trim(), $options: 'i' }
    });
    if (doc) {
      console.log(`\n=== ${doc['Career Direction']} ===`);
      console.log('Direction ID:', doc['Direction ID']);
      console.log('Overview/Description:', String(doc['Overview / Description'] || '').substring(0, 100));
      // Get all role columns
      for (let i = 1; i <= 10; i++) {
        const role = doc[`Job Role ${i}`];
        const roleId = doc[`Role ID ${i}`];
        if (role) console.log(`  Role ${i}: ${role} (${roleId})`);
      }
    } else {
      console.log(`\n❌ Not found: ${dir}`);
    }
  }

  // Check careerroles for Cloud Engineer + Entrepreneurship roles
  console.log('\n\n=== Sample caeerroles for Cloud/DevOps ===');
  const cloudRoles = await db.collection('careerroles').find({
    'Job Family': { $regex: 'Cloud|DevOps', $options: 'i' },
    narrative_para1: { $exists: true }
  }, { 'Job Role': 1, 'Role ID': 1, 'Job Family': 1 }).limit(10).toArray();
  cloudRoles.forEach(r => console.log(' -', r['Job Role'], '|', r['Role ID']));

  // Check Entrepreneurship roles
  console.log('\n=== Entrepreneurship roles in careerroles ===');
  const entRoles = await db.collection('careerroles').find({
    'Job Family': { $regex: 'Entrepreneur|Business|Startup', $options: 'i' },
  }, { 'Job Role': 1, 'Role ID': 1, 'Job Family': 1 }).limit(10).toArray();
  entRoles.forEach(r => console.log(' -', r['Job Role'], '|', r['Role ID'], '|', r['Job Family']));

  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
