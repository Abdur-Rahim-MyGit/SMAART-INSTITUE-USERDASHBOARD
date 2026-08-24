const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../back-end/.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in env!');
  process.exit(1);
}

// Inline model definitions to avoid requiring backend dependencies
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String
});
const User = mongoose.model('User', UserSchema);

const ModuleProgressSchema = new mongoose.Schema({
  module: mongoose.Schema.Types.ObjectId,
  status: String,
  completedTasks: Array,
  videoProgress: Array
});

const CourseEnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: mongoose.Schema.Types.ObjectId,
  status: String,
  progress: Number,
  moduleProgress: [ModuleProgressSchema]
});
const CourseEnrollment = mongoose.model('CourseEnrollment', CourseEnrollmentSchema);

const UserProgressSchema = new mongoose.Schema({
  user: mongoose.Schema.Types.ObjectId,
  courseCode: String,
  moduleId: String,
  dayId: Number,
  stepId: Number
}, { collection: 'user_progress' });
const UserProgress = mongoose.model('UserProgress', UserProgressSchema);

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    const enrollments = await CourseEnrollment.find().populate('student');
    console.log(`\nFound ${enrollments.length} total enrollments:`);
    for (const e of enrollments) {
      console.log(`- Enrollment ID: ${e._id}`);
      console.log(`  Student: ${e.student ? `${e.student.fullName} (${e.student.email}) [${e.student._id}]` : 'Unknown'}`);
      console.log(`  Course ID: ${e.course}`);
      console.log(`  Status: ${e.status}, Progress: ${e.progress}%`);
    }

    const userProgressCount = await UserProgress.countDocuments();
    console.log(`\nTotal UserProgress entries: ${userProgressCount}`);

    // If an argument "reset" is passed, perform the reset
    const action = process.argv[2];
    if (action === 'reset') {
      console.log('\n--- Resetting Completed and In-Progress Courses ---');
      
      const enrollmentDeleteResult = await CourseEnrollment.deleteMany({});
      console.log(`Deleted ${enrollmentDeleteResult.deletedCount} CourseEnrollment records.`);

      const progressDeleteResult = await UserProgress.deleteMany({});
      console.log(`Deleted ${progressDeleteResult.deletedCount} UserProgress records.`);
      
      console.log('Reset completed successfully.');
    } else {
      console.log('\nTo reset all enrollments and user progress, run this script with the "reset" argument:');
      console.log('node scratch/list_and_reset.js reset');
    }

  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
