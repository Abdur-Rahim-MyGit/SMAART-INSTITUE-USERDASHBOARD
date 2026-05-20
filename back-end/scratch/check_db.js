const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;
  
  // Get all role titles from roles-profile-data
  const profiles = await db.collection('roles-profile-data').find({}).limit(5).toArray();
  console.log('roles-profile-data sample (5 docs):');
  profiles.forEach(p => {
    console.log('Role Title:', p['Role Title']);
    console.log('Job Family:', p['Job Family']);
    console.log('What This Role Actually Does:', String(p['What This Role Actually Does'] || '').substring(0, 100));
    console.log('How AI Is Changing:', String(p['How AI Is Changing This Role'] || '').substring(0, 80));
    console.log('Who Should Consider:', String(p['Who Should Consider This Role'] || '').substring(0, 80));
    console.log('Career Growth Path:', String(p['Career Growth Path'] || p['Career Growth'] || '').substring(0, 80));
    // Print all keys
    console.log('ALL KEYS:', Object.keys(p).join(' | '));
    console.log('---');
  });
  
  const count = await db.collection('roles-profile-data').countDocuments();
  console.log('Total docs in roles-profile-data:', count);
  
  // Check Cloud Engineer
  const cloudEngineer = await db.collection('roles-profile-data').findOne({ 'Role Title': { $regex: 'Cloud Engineer', $options: 'i' } });
  console.log('Cloud Engineer found:', cloudEngineer ? 'YES' : 'NO');
  if (cloudEngineer) {
    console.log('Keys:', Object.keys(cloudEngineer).join(' | '));
    console.log('What This Role Actually Does:', String(cloudEngineer['What This Role Actually Does'] || '').substring(0, 200));
  }
  
  // Check careerroles for Cloud Engineer
  const careRoleCloud = await db.collection('careerroles').findOne({ 'Job Role': { $regex: 'Cloud Engineer', $options: 'i' } });
  console.log('careerroles - Cloud Engineer:', careRoleCloud ? JSON.stringify(careRoleCloud) : 'NOT FOUND');
  
  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
