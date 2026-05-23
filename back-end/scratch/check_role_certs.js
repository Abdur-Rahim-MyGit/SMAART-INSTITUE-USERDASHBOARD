require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // Check a specific role's skills from roleskillslist
  const roleSkills = await db.collection('roleskillslist')
    .find({ 'Job Role': 'Computer Vision Engineer' })
    .toArray();
  
  console.log('Role skills count:', roleSkills.length);
  if (roleSkills.length > 0) {
    console.log('Sample skill:', JSON.stringify(roleSkills[0], null, 2));
    const skillIds = roleSkills.map(r => r['Skill ID']).filter(Boolean);
    console.log('Skill IDs in role:', skillIds.slice(0, 10));
    
    // Now check if these IDs exist in the certs collection
    const matchingCerts = await db.collection('career-agent-certifaction')
      .find({ skill_id: { $in: skillIds } })
      .limit(5)
      .toArray();
    console.log('\nMatching certs:', JSON.stringify(matchingCerts, null, 2));
  }
  
  // Also check what fields exist in roleskillslist
  const sample = await db.collection('roleskillslist').findOne({});
  console.log('\nroleskillslist sample keys:', Object.keys(sample));

  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
