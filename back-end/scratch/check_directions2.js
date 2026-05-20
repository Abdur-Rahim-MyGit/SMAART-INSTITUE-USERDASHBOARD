const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri).then(async () => {
  const db = mongoose.connection.db;

  // Get the EXACT direction names and roles for the 3 user-selected directions
  // Direction 1: Entrepreneurship
  const entDocs = await db.collection('careerdirections').find({
    'Career Direction': { $regex: 'Entrepreneur', $options: 'i' }
  }).toArray();
  console.log('\n=== Entrepreneurship docs:', entDocs.length);
  entDocs.slice(0, 1).forEach(doc => {
    console.log('Career Direction:', doc['Career Direction']);
    console.log('Spec ID:', doc['Spec ID']);
    for (let i = 1; i <= 10; i++) {
      if (doc[`Job Role ${i}`]) console.log(`  Role ${i}: ${doc[`Job Role ${i}`]} | ${doc[`Role ID ${i}`]}`);
    }
  });

  // Direction 2: Cloud & Infrastructure for AI
  const cloudAIDocs = await db.collection('careerdirections').find({
    'Career Direction': { $regex: 'Cloud.*Infrastructure.*AI|Infrastructure.*AI', $options: 'i' }
  }).toArray();
  console.log('\n=== Cloud & Infrastructure for AI docs:', cloudAIDocs.length);
  cloudAIDocs.slice(0, 2).forEach(doc => {
    console.log('Career Direction:', doc['Career Direction']);
    console.log('Spec ID:', doc['Spec ID']);
    for (let i = 1; i <= 10; i++) {
      if (doc[`Job Role ${i}`]) console.log(`  Role ${i}: ${doc[`Job Role ${i}`]} | ${doc[`Role ID ${i}`]}`);
    }
  });

  // Direction 3: Computer Vision
  const cvDocs = await db.collection('careerdirections').find({
    'Career Direction': { $regex: 'Computer Vision', $options: 'i' }
  }).toArray();
  console.log('\n=== Computer Vision docs:', cvDocs.length);
  cvDocs.slice(0, 1).forEach(doc => {
    console.log('Career Direction:', doc['Career Direction']);
    for (let i = 1; i <= 10; i++) {
      if (doc[`Job Role ${i}`]) console.log(`  Role ${i}: ${doc[`Job Role ${i}`]} | ${doc[`Role ID ${i}`]}`);
    }
  });

  // Verify narrative data for a CV Engineer role
  const cvEngineer = await db.collection('careerroles').findOne({
    'Job Role': { $regex: 'Computer Vision', $options: 'i' },
    narrative_para1: { $exists: true, $ne: '' }
  });
  console.log('\nComputer Vision Engineer narrative:', cvEngineer ? String(cvEngineer.narrative_para1).substring(0, 100) : 'NOT FOUND');

  const nlpEngineer = await db.collection('careerroles').findOne({
    'Job Role': { $regex: 'NLP Engineer', $options: 'i' }
  });
  console.log('NLP Engineer narrative:', nlpEngineer ? String(nlpEngineer.narrative_para1 || '').substring(0, 80) : 'NOT FOUND');

  mongoose.disconnect();
}).catch(e => console.error('Error:', e.message));
