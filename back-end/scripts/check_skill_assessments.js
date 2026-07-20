const mongoose = require('mongoose');
require('dotenv').config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('\n--- Skill Assessments sample ---');
    const skillCount = await mongoose.connection.db.collection('skillassessments').countDocuments();
    console.log(`Count: ${skillCount}`);
    if (skillCount > 0) {
      const docs = await mongoose.connection.db.collection('skillassessments').find().limit(3).toArray();
      console.log(JSON.stringify(docs, null, 2));
    }

    console.log('\n--- Assessments sample ---');
    const assessCount = await mongoose.connection.db.collection('assessments').countDocuments();
    console.log(`Count: ${assessCount}`);
    if (assessCount > 0) {
      const docs = await mongoose.connection.db.collection('assessments').find().limit(3).toArray();
      console.log(JSON.stringify(docs, null, 2));
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
