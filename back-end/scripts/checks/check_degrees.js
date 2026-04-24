const mongoose = require('mongoose');

const mongoURI = 'mongodb://localhost:27017/minds';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('✅ Connected to MINDS database');
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));
  
  // Specifically look for 'degree' related collections
  const degreeCol = collections.find(c => c.name.toLowerCase().includes('degree'));
  if (degreeCol) {
    console.log(`🔍 Found degree-related collection: ${degreeCol.name}`);
    const sample = await mongoose.connection.db.collection(degreeCol.name).findOne();
    console.log('Sample Document:', JSON.stringify(sample, null, 2));
  } else {
    console.log('❌ No degree-related collection found.');
  }

  process.exit(0);
}).catch(err => {
  console.error('❌ Connection error:', err);
  process.exit(1);
});
