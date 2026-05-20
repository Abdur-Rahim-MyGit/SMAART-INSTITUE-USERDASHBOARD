const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const docs = await db.collection('careerdirections').find({
    'Career Direction': { $regex: 'Entrepreneur', $options: 'i' }
  }).limit(5).toArray();

  docs.forEach(d => {
    console.log('\n--- Career Direction:', d['Career Direction'], '| Spec:', d['Spec ID']);
    for (let i = 1; i <= 8; i++) {
      if (d[`Job Role ${i}`]) console.log(`   Role ${i}: ${d['Job Role '+i]} (${d['Role ID '+i]})`);
    }
  });

  console.log('\nTotal entrepreneur docs:', await db.collection('careerdirections').countDocuments({
    'Career Direction': { $regex: 'Entrepreneur', $options: 'i' }
  }));

  mongoose.disconnect();
}).catch(e => console.error(e.message));
