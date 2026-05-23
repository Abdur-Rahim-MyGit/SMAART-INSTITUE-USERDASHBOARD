require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Sample of each category
  const aiSample = await db.collection('career-agent-certifaction').findOne({ category: 'AI-Tool' });
  const domainSample = await db.collection('career-agent-certifaction').findOne({ category: 'Domain' });
  
  console.log('AI-Tool sample:');
  console.log(JSON.stringify(aiSample, null, 2));
  
  console.log('\nDomain sample:');
  console.log(JSON.stringify(domainSample, null, 2));
  
  // Check if there's a job_role or role field
  const withRole = await db.collection('career-agent-certifaction').findOne({ job_role: { $exists: true } });
  console.log('\nDoc with job_role:', JSON.stringify(withRole, null, 2));
  
  const withJobFamily = await db.collection('career-agent-certifaction').findOne({ job_family: { $exists: true } });
  console.log('\nDoc with job_family:', JSON.stringify(withJobFamily, null, 2));
  
  // Get distinct skill_ids
  const distinct = await db.collection('career-agent-certifaction').distinct('skill_id');
  console.log('\nSample skill_ids (first 10):', distinct.slice(0, 10));

  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
