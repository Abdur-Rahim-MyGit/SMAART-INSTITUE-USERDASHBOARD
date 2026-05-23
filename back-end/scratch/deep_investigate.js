require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // 1. Check career_agent_data structure
  const sample = await db.collection('career_agent_data').findOne({});
  console.log('=== career_agent_data sample keys ===');
  if (sample) {
    console.log(Object.keys(sample));
    console.log('\nFull sample:');
    console.log(JSON.stringify(sample, null, 2));
  } else {
    console.log('EMPTY collection');
  }

  // 2. Check if career-agent-certifaction has any field with a real URL
  const certSample = await db.collection('career-agent-certifaction').findOne({});
  console.log('\n=== career-agent-certifaction ALL FIELDS ===');
  console.log(JSON.stringify(certSample, null, 2));

  // 3. Check ALL unique certs for "Computer Vision Engineer" role
  // to understand the data fully
  const cvSkills = await db.collection('roleskillslist')
    .find({ 'Job Role': 'Computer Vision Engineer' })
    .toArray();
  const cvIds = cvSkills.map(r => r['Skill ID']).filter(Boolean);
  console.log('\n=== CV Engineer Skill IDs ===', cvIds);

  const cvCerts = await db.collection('career-agent-certifaction')
    .find({ skill_id: { $in: cvIds } })
    .toArray();
  console.log('\n=== CV Engineer Certs (all fields) ===');
  cvCerts.forEach(c => {
    console.log(`  ${c.skill_id} | ${c.category} | ${c.skill_name} | CERT: ${c.suggested_certificates} | URL: ${c.official_url}`);
  });

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
