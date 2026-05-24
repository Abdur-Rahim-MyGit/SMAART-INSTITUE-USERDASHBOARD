require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // 1. Check if official_url has been updated in DB (are all still the same?)
  const urls = await db.collection('career-agent-certifaction').distinct('official_url');
  console.log('=== DISTINCT official_url in DB ===');
  console.log(urls);
  console.log('Total distinct URLs:', urls.length);

  // 2. Check sample records WITH different URLs
  const sample3 = await db.collection('career-agent-certifaction').find({}).limit(3).toArray();
  console.log('\n=== Sample 3 records official_url ===');
  sample3.forEach(c => console.log(`  ${c.skill_id} | "${c.suggested_certificates}" → ${c.official_url}`));

  // 3. Check roleskillslist for "Python Developer"
  const pythonRows = await db.collection('roleskillslist')
    .find({ 'Job Role': { $regex: /python/i } })
    .toArray();
  console.log('\n=== roleskillslist rows for Python ===');
  const pythonRoles = [...new Set(pythonRows.map(r => r['Job Role']))];
  console.log('Distinct Python roles:', pythonRoles);
  console.log('Count:', pythonRows.length);

  // 4. Check what exact role names exist in roleskillslist for Software Dev direction
  const swRoles = ['Software Engineer','Python Developer','Backend Developer','Full Stack Developer','API Developer','Frontend Developer','Java Developer','Node.js Developer','Go Developer','.NET Developer'];
  const found = {};
  for (const r of swRoles) {
    const c = await db.collection('roleskillslist').countDocuments({ 'Job Role': r });
    found[r] = c;
  }
  console.log('\n=== SW direction roles in roleskillslist ===');
  console.log(found);

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
