// Script to check streak data for users
const mongoose = require('mongoose');
require('dotenv').config();

const Avatar = require('./models/Avatar');
const User = require('./models/User');

async function checkStreaks() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://souban:souban123@cluster0.bkxwjdl.mongodb.net/?appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    const db = mongoose.connection.db;
    console.log('Database name:', db.databaseName);
    
    // Get all avatars with streak data
    const avatars = await Avatar.find({
      $or: [
        { streakActive: true },
        { streak: { $gt: 0 } },
        { streakCyclesCompleted: { $gt: 0 } }
      ]
    }).populate('userId', 'name email').limit(20);
    
    console.log(`\nFound ${avatars.length} avatars with streak data:\n`);
    console.log('='.repeat(80));
    
    if (avatars.length === 0) {
      console.log('No streak data found. This is expected for new users.');
      console.log('\nThe streak system is designed to work as follows:');
      console.log('- User logs in for the first time -> streak starts at Day 1');
      console.log('- User logs in consecutively (Mon-Sat) -> streak increases');
      console.log('- Sunday is a mandatory holiday');
      console.log('- Missing a day resets the streak');
    } else {
      avatars.forEach((avatar, index) => {
        console.log(`\n${index + 1}. User: ${avatar.userId?.name || 'Unknown'}`);
        console.log(`   Email: ${avatar.userId?.email || 'N/A'}`);
        console.log(`   Streak Active: ${avatar.streakActive}`);
        console.log(`   Current Cycle Day: ${avatar.streakCycleDay}`);
        console.log(`   Cycles Completed: ${avatar.streakCyclesCompleted}`);
        console.log(`   Total Streak Days: ${avatar.streak}`);
        console.log(`   Last Streak Date: ${avatar.lastStreakDate}`);
        console.log(`   Streak Start Date: ${avatar.streakStartDate}`);
        
        const status = avatar.getStreakStatus();
        console.log(`   ─ Status ─`);
        console.log(`   Total Streak Days (computed): ${status.totalStreakDays}`);
        console.log(`   Is Holiday Today: ${status.isHoliday}`);
        console.log(`   Cycle Progress: ${status.cycleProgress.join(', ')}`);
      });
    }

    // Also check total avatars
    const totalAvatars = await Avatar.countDocuments();
    console.log(`\n\nTotal avatars in database: ${totalAvatars}`);

    // Check users
    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkStreaks();
