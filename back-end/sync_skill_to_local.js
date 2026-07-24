const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/minds';

  console.log('Connecting to Atlas to fetch assessment...');
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
  console.log('Connected to Atlas.');

  const assessmentId = '6a5a2792bc1532c9c8fcb259';
  const assessment = await atlasConn.db.collection('skillassessments').findOne({
    _id: new mongoose.Types.ObjectId(assessmentId)
  });

  if (!assessment) {
    console.error('❌ Assessment not found on Atlas!');
    await atlasConn.close();
    process.exit(1);
  }
  console.log('Fetched assessment from Atlas:', assessment.assessmentName);

  console.log('Connecting to local DB to insert...');
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log('Connected to local DB.');

  await localConn.db.collection('skillassessments').replaceOne(
    { _id: assessment._id },
    assessment,
    { upsert: true }
  );
  console.log('✅ Assessment successfully synced to local DB!');

  await atlasConn.close();
  await localConn.close();
}

run().catch(console.error);
