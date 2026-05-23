require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Check what role names exist in roleskillslist for CV roles
  const cvRoles = await db.collection('roleskillslist')
    .distinct('Job Role', { 'Job Role': { $regex: /computer vision|vision/i } });
  console.log('CV related roles in roleskillslist:', cvRoles);
  
  // Also test the URL-encoded role with special chars
  // "Computer Vision & Specialised AI" - what the dashboard sends
  const testRole = 'Computer Vision & Specialised AI';
  const regex = new RegExp(`^${testRole.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const rows = await db.collection('roleskillslist')
    .find({ 'Job Role': { $regex: regex } })
    .toArray();
  console.log('\nRows for "Computer Vision & Specialised AI":', rows.length);
  
  // Get all distinct job roles (first 20)
  const allRoles = await db.collection('roleskillslist').distinct('Job Role');
  console.log('\nAll roles (first 20):', allRoles.slice(0, 20));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
