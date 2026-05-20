const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  
  // Get all field keys from roles-profile-data (first doc)
  const sampleDoc = await db.collection('roles-profile-data').findOne({});
  console.log('\nALL FIELD KEYS in roles-profile-data sample doc:');
  Object.keys(sampleDoc).forEach(k => {
    const val = String(sampleDoc[k] || '');
    console.log(' KEY:', JSON.stringify(k), '=> VALUE:', JSON.stringify(val.substring(0, 60)));
  });

  // List all roles in roles-profile-data (compact)
  const rolesProfileData = await db.collection('roles-profile-data').find({}, { 'Role Title': 1, 'Job Family': 1 }).toArray();
  console.log('\nAll roles in roles-profile-data (' + rolesProfileData.length + '):');
  rolesProfileData.forEach(r => console.log(' -', r['Role Title']));

  // careerroles with narrative_para1
  const careRolesWithNarrative = await db.collection('careerroles').find({ narrative_para1: { $exists: true, $ne: '' } }).count();
  console.log('\ncaeerroles with narrative_para1 count:', careRolesWithNarrative);

  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
