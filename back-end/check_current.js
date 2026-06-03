const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

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
    console.log('Connected to MongoDB.');

    const enrollments = await CourseEnrollment.find().populate('student');
    console.log(`\nEnrollments found: ${enrollments.length}`);
    for (const e of enrollments) {
      console.log(`- Enrollment ID: ${e._id}`);
      console.log(`  Student: ${e.student ? `${e.student.fullName} (${e.student.email})` : 'Unknown'}`);
      console.log(`  Status: ${e.status}, Progress: ${e.progress}%`);
    }

    const progress = await UserProgress.find();
    console.log(`\nUserProgress entries: ${progress.length}`);
    for (const p of progress) {
      console.log(`- User: ${p.user}, Course: ${p.courseCode}, Day: ${p.dayId}, Step: ${p.stepId}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
