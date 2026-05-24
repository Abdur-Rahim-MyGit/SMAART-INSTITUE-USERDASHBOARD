require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const roleTitle = 'Computer Vision Engineer';

  const escapedTitle = roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleRegex = new RegExp(`^${escapedTitle}$`, 'i');

  // Step 1: Get role skills
  const roleSkillRows = await db.collection('roleskillslist')
    .find({ 'Job Role': { $regex: titleRegex } })
    .toArray();

  const skillIds = roleSkillRows.map(r => r['Skill ID']).filter(Boolean);
  console.log('Skill IDs for', roleTitle, ':', skillIds);

  // Step 2: Fetch matching certs
  let certs = [];
  if (skillIds.length > 0) {
    certs = await db.collection('career-agent-certifaction')
      .find({ skill_id: { $in: skillIds } })
      .toArray();
  }

  const technical = certs.filter(c => c.category === 'Technical');
  const ai = certs.filter(c => c.category === 'AI-Tool');
  const domain = certs.filter(c => c.category === 'Domain');

  console.log('\nResults:');
  console.log('  Technical:', technical.length, 'certs');
  console.log('  AI-Tool  :', ai.length, 'certs');
  console.log('  Domain   :', domain.length, 'certs');

  console.log('\nSample Technical:', JSON.stringify(technical[0], null, 2));
  console.log('\nSample AI:', JSON.stringify(ai[0], null, 2));
  console.log('\nSample Domain:', JSON.stringify(domain[0], null, 2));

  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
