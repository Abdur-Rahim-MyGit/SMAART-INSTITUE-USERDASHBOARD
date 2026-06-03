const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const UserProgress = mongoose.model('UserProgress', new mongoose.Schema({}, { strict: false }));
const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const progressList = await UserProgress.find();
    console.log(`Total user progress records: ${progressList.length}`);
    const userIds = [...new Set(progressList.map(p => p.user?.toString()))];
    console.log('User IDs in progress:', userIds);
    for (const uid of userIds) {
      if (!uid) continue;
      const user = await User.findById(uid);
      if (user) {
        console.log(`- User ${uid}: ${user.fullName} (${user.email})`);
      } else {
        console.log(`- User ${uid}: NOT FOUND in User collection`);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
