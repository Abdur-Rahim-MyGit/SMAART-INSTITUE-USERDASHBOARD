/**
 * Database Migration: Clear All Stale Session IDs
 * Run this script once to clear all existing currentSessionId values
 * before enabling single-session enforcement.
 * 
 * Usage: node scripts/clearSessions.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function clearAllSessions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear sessions in all user collections
    const Registration = require('../models/Registration');
    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');
    const User = require('../models/User');

    console.log('\n🧹 Clearing all session IDs...\n');

    const regResult = await Registration.updateMany(
      { currentSessionId: { $ne: null } },
      { $set: { currentSessionId: null } }
    );
    console.log(`   Registrations: ${regResult.modifiedCount} sessions cleared`);

    const studentResult = await Student.updateMany(
      { currentSessionId: { $ne: null } },
      { $set: { currentSessionId: null } }
    );
    console.log(`   Students: ${studentResult.modifiedCount} sessions cleared`);

    const teacherResult = await Teacher.updateMany(
      { currentSessionId: { $ne: null } },
      { $set: { currentSessionId: null } }
    );
    console.log(`   Teachers: ${teacherResult.modifiedCount} sessions cleared`);

    const userResult = await User.updateMany(
      { currentSessionId: { $ne: null } },
      { $set: { currentSessionId: null } }
    );
    console.log(`   Users: ${userResult.modifiedCount} sessions cleared`);

    const total = regResult.modifiedCount + studentResult.modifiedCount + 
                  teacherResult.modifiedCount + userResult.modifiedCount;

    console.log(`\n✅ Done! Total sessions cleared: ${total}`);
    console.log('\n📝 You can now re-enable single-session enforcement in auth.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

clearAllSessions();
