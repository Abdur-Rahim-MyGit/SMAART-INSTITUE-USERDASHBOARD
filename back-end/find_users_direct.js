const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const users = await User.find();
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(`- ID: ${u._id}`);
      console.log(`  Name: ${u.fullName}`);
      console.log(`  Email: ${u.email}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
