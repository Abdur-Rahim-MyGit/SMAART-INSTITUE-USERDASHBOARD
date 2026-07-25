const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(` - ${c.name}`));

    // Search for collections containing 'assessment' or 'skill'
    const matching = collections.filter(c => c.name.toLowerCase().includes('assessment') || c.name.toLowerCase().includes('skill'));
    console.log('\nMatching collections:');
    for (const coll of matching) {
      console.log(`\n--- Collection: ${coll.name} ---`);
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`Count: ${count}`);
      if (count > 0) {
        const samples = await mongoose.connection.db.collection(coll.name).find().limit(2).toArray();
        console.log('Sample documents:', JSON.stringify(samples, null, 2));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
