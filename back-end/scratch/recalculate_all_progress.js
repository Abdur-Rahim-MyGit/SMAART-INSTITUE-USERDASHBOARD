const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function recalculate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Register all required schemas
    require('../models/Course');
    require('../models/User');
    const CourseEnrollment = require('../models/CourseEnrollment');
    
    const enrollments = await CourseEnrollment.find({});

    console.log(`Found ${enrollments.length} enrollments in total. Recalculating progress and time spent...`);

    let updatedCount = 0;
    for (const enrollment of enrollments) {
      // Running save will trigger the mongoose pre-save hook we defined
      // which recalculates progress, status, and totalTimeSpent!
      await enrollment.save();
      console.log(`Updated enrollment ${enrollment._id} | Student ID: ${enrollment.student} | Total Time: ${enrollment.totalTimeSpent} mins | Progress: ${enrollment.progress}%`);
      updatedCount++;
    }

    console.log(`\nSuccessfully recalculated and updated ${updatedCount} enrollments.`);
  } catch (err) {
    console.error('Error during recalculation:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

recalculate();
