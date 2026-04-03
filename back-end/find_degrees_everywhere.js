const mongoose = require('mongoose');

async function findDegrees() {
  const admin = await mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  
  for (const dbInfo of dbs.databases) {
    const db = mongoose.connection.useDb(dbInfo.name);
    const collections = await db.db.listCollections().toArray();
    
    for (const col of collections) {
      if (col.name.toLowerCase().includes('degree')) {
          console.log(`✅ Found "${col.name}" in database "${dbInfo.name}"`);
          const count = await db.db.collection(col.name).countDocuments();
          console.log(`   Count: ${count}`);
          if (count > 0) {
              const sample = await db.db.collection(col.name).findOne();
              console.log(`   Sample: ${JSON.stringify(sample, null, 2)}`);
          }
      }
    }
  }
}

mongoose.connect('mongodb://localhost:27017/minds', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
    await findDegrees();
    process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
