const mongoose = require('mongoose');

async function listDbs(dbNames) {
  for (const dbName of dbNames) {
    const db = mongoose.connection.useDb(dbName);
    const collections = await db.db.listCollections().toArray();
    console.log(`\nDatabase: ${dbName}`);
    console.log('Collections:', collections.map(c => c.name));
    
    // Specifically look for 'degree' related collections
    const degreeCol = collections.find(c => c.name.toLowerCase().includes('degree'));
    if (degreeCol) {
        console.log(`  🔍 Found degree-related collection: ${degreeCol.name}`);
        const sample = await db.db.collection(degreeCol.name).findOne();
        console.log('  Sample:', JSON.stringify(sample, null, 2));
    }
  }
}

mongoose.connect('mongodb://localhost:27017/minds', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
    await listDbs(['minds', 'aiCareerEngine', 'smaart-dashboard']);
    process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
