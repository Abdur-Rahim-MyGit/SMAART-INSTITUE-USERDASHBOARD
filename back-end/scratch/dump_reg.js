require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const s = await mongoose.connection.db.collection('students').findOne({ email: 'dharsini882@gmail.com' });
    console.log('STUDENT REGISTRATION FULL DUMP:');
    console.log(JSON.stringify(s.registration, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
