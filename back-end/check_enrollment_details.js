const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Register schemas
require('./models/User');
require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const enrollment = await CourseEnrollment.findOne({})
      .sort({ updatedAt: -1 })
      .populate('student')
      .populate('course');

    if (!enrollment) {
      console.log('No enrollments found.');
      process.exit(0);
    }

    const studentName = enrollment.student ? enrollment.student.fullName : 'Unknown';
    const studentEmail = enrollment.student ? enrollment.student.email : 'Unknown';
    const courseTitle = enrollment.course ? enrollment.course.title : 'Unknown';

    console.log(`\nInspecting enrollment for student: ${studentName} (${studentEmail})`);
    console.log(`Course: ${courseTitle}`);

    enrollment.moduleProgress.forEach((mp, mIdx) => {
      console.log(`\n--- Module ${mIdx + 1} ---`);
      if (mp.videosWatched && mp.videosWatched.length > 0) {
        console.log(`  videosWatched (${mp.videosWatched.length}):`);
        mp.videosWatched.forEach(vw => {
          console.log(`    - videoId: ${vw.videoId}, duration: ${vw.duration}, watchedAt: ${vw.watchedAt ? vw.watchedAt.toISOString() : 'N/A'}`);
        });
      }
      if (mp.videoProgress && mp.videoProgress.length > 0) {
        console.log(`  videoProgress (${mp.videoProgress.length}):`);
        mp.videoProgress.forEach(vp => {
          console.log(`    - dayId: ${vp.dayId}, stepId: ${vp.stepId}, isCompleted: ${vp.isCompleted}, lastUpdated: ${vp.lastUpdated ? vp.lastUpdated.toISOString() : 'N/A'}`);
        });
      }
      if (mp.quizzesTaken && mp.quizzesTaken.length > 0) {
        console.log(`  quizzesTaken (${mp.quizzesTaken.length}):`);
        mp.quizzesTaken.forEach(q => {
          console.log(`    - quizId: ${q.quizId}, score: ${q.score}, completedAt: ${q.completedAt ? q.completedAt.toISOString() : 'N/A'}`);
        });
      }
      if (mp.reflectionsSubmitted && mp.reflectionsSubmitted.length > 0) {
        console.log(`  reflectionsSubmitted (${mp.reflectionsSubmitted.length}):`);
        mp.reflectionsSubmitted.forEach(r => {
          console.log(`    - questionIndex: ${r.questionIndex}, submittedAt: ${r.submittedAt ? r.submittedAt.toISOString() : 'N/A'}`);
        });
      }
      if (mp.completedTasks && mp.completedTasks.length > 0) {
        console.log(`  completedTasks (${mp.completedTasks.length}):`);
        mp.completedTasks.forEach(ct => {
          console.log(`    - dayId: ${ct.dayId}, taskId: ${ct.taskId}, completedAt: ${ct.completedAt ? ct.completedAt.toISOString() : 'N/A'}`);
        });
      }
      if (mp.taskResults && mp.taskResults.length > 0) {
        console.log(`  taskResults (${mp.taskResults.length}):`);
        mp.taskResults.forEach(tr => {
          console.log(`    - dayId: ${tr.dayId}, stepId: ${tr.stepId}, score: ${tr.score}, completedAt: ${tr.completedAt ? tr.completedAt.toISOString() : 'N/A'}`);
        });
      }
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
