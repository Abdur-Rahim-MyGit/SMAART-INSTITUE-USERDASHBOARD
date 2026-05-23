require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // 1. Check careerdirections structure for CV direction
  const dirDoc = await db.collection('careerdirections').findOne({
    'Career Direction': { $regex: /computer vision/i }
  });
  console.log('=== CAREERDIRECTIONS DOC ===');
  console.log(JSON.stringify(dirDoc, null, 2));

  // 2. Check all keys in careerdirections
  const sample = await db.collection('careerdirections').findOne({});
  console.log('\n=== CAREERDIRECTIONS KEYS ===');
  console.log(Object.keys(sample));

  // 3. Check URLs in career-agent-certifaction - are they really all the same?
  const urls = await db.collection('career-agent-certifaction').distinct('official_url');
  console.log('\n=== DISTINCT official_url values (first 10) ===');
  console.log(urls.slice(0, 10));
  console.log('Total distinct URLs:', urls.length);

  // 4. Check a sample of certs with actual different URLs
  const withRealUrl = await db.collection('career-agent-certifaction')
    .find({ official_url: { $ne: 'https://www.coursera.org/professional-certificates/google-it-automation' } })
    .limit(5)
    .toArray();
  console.log('\n=== Certs with NON-default URL ===');
  console.log(JSON.stringify(withRealUrl.map(c => ({ skill: c.skill_name, url: c.official_url, cert: c.suggested_certificates })), null, 2));

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
