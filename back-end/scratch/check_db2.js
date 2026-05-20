const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  
  // Get all role titles from roles-profile-data
  const allRoles = await db.collection('roles-profile-data').find({}, { 'Role Title': 1, 'Job Family': 1 }).toArray();
  console.log('ALL roles in roles-profile-data:');
  allRoles.forEach(r => console.log(' -', r['Role Title'], '|', r['Job Family']));
  
  // Get a sample with Career Growth Path field
  const sampleDoc = await db.collection('roles-profile-data').findOne({});
  console.log('\nALL FIELD KEYS in sample doc:');
  Object.keys(sampleDoc).forEach(k => console.log(' KEY:', JSON.stringify(k), '=> VALUE:', JSON.stringify(String(sampleDoc[k] || '')).substring(0, 60)));
  
  // Check careerroles - how many have all 3 narratives
  const careRolesWithNarrative = await db.collection('careerroles').find({ narrative_para1: { $exists: true, $ne: '' } }).toArray();
  console.log('\ncaeerroles with narrative_para1:', careRolesWithNarrative.length);
  careRolesWithNarrative.forEach(r => console.log(' -', r['Job Role'] || r['role_name']));
  
  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
