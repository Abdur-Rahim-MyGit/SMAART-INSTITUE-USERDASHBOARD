const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const user = await User.findById('69e0c4dc56ab75fec31c6109');
    if (user) {
      console.log('User found:');
      console.log(`- ID: ${user._id}`);
      console.log(`  Name: ${user.fullName}`);
      console.log(`  Email: ${user.email}`);
    } else {
      console.log('User 69e0c4dc56ab75fec31c6109 not found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
