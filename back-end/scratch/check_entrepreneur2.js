const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  
  // Get ONE Entrepreneurship doc and see ALL its fields
  const doc = await db.collection('careerdirections').findOne({
    'Career Direction': { $regex: 'Entrepreneur', $options: 'i' }
  });
  
  console.log('All fields in first Entrepreneurship doc:');
  Object.keys(doc).forEach(k => {
    if (k !== '_id') console.log(`  "${k}": ${String(doc[k]).substring(0, 80)}`);
  });

  // Also check careerdirections for something like "Career Overview" having entrepreneurship-specific role list
  console.log('\n\n-- Also check if any careerdirections have Entrepreneurship-like roles (Founder, CEO, etc.)');
  const founderDoc = await db.collection('careerdirections').findOne({
    $or: [
      { 'Career Direction': { $regex: 'Founder|Startup|Venture', $options: 'i' } },
      { 'Career Overview': { $regex: 'Entrepreneur', $options: 'i' } }
    ]
  });
  if (founderDoc) {
    console.log('Found:', founderDoc['Career Direction']);
    Object.keys(founderDoc).forEach(k => {
      if (k !== '_id') console.log(`  "${k}": ${String(founderDoc[k]).substring(0, 80)}`);
    });
  }

  // Check careerroles for entrepreneur/founder/startup type roles
  console.log('\n\n-- Entrepreneur-flavored roles in careerroles:');
  const entRoles = await db.collection('careerroles').find({
    $or: [
      { 'Job Family': { $regex: 'Entrepreneur|Startup|Founder|Venture|Business Owner', $options: 'i' } },
      { 'Job Role': { $regex: 'Founder|Entrepreneur|Startup', $options: 'i' } }
    ]
  }, { 'Job Role': 1, 'Role ID': 1, 'Job Family': 1 }).limit(12).toArray();
  
  if (entRoles.length > 0) {
    entRoles.forEach(r => console.log(` - ${r['Job Role']} | ${r['Role ID']} | ${r['Job Family']}`));
  } else {
    console.log('None found. Checking what job families exist...');
    const families = await db.collection('careerroles').distinct('Job Family');
    console.log('All Job Families:', families.slice(0, 20).join(', '));
  }

  mongoose.disconnect();
}).catch(e => console.error(e.message));
