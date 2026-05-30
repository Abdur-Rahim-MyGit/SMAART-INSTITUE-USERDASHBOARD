const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://souban:souban123@ac-3hctxon-shard-00-00.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-01.bkxwjdl.mongodb.net:27017,ac-3hctxon-shard-00-02.bkxwjdl.mongodb.net:27017/?ssl=true&replicaSet=atlas-taxso3-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0';

async function simulate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const Course = require('../models/Course');
    const CourseEnrollment = require('../models/CourseEnrollment');
    const User = require('../models/User');

    const student = await User.findOne({ fullName: /rahman/i });
    if (!student) {
      console.error('Student Rahman not found.');
      return;
    }

    const course = await Course.findOne({ courseCode: 'CRS00004' });
    if (!course) {
      console.error('Course CRS00004 not found.');
      return;
    }

    console.log(`Simulating progress for student ${student.fullName} in course ${course.title}...`);

    // Let's find or create enrollment
    let enrollment = await CourseEnrollment.findOne({ student: student._id, course: course._id });
    if (!enrollment) {
      enrollment = new CourseEnrollment({
        student: student._id,
        course: course._id,
        status: 'in_progress',
        enrollmentDate: new Date(),
        progress: 0,
        moduleProgress: []
      });
    }

    // Set some moduleProgress for module index 0 (Self-Awareness Foundations)
    const moduleDoc = course.modules[0];
    let modProg = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
    if (!modProg) {
      enrollment.moduleProgress.push({
        module: moduleDoc._id,
        completedTasks: []
      });
      modProg = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
    }

    // Mark steps 1, 2, 3, 4, 5 as completed
    modProg.completedTasks = [
      { dayId: 1, taskId: 1, completedAt: new Date() },
      { dayId: 2, taskId: 1, completedAt: new Date() },
      { dayId: 3, taskId: 1, completedAt: new Date() },
      { dayId: 4, taskId: 1, completedAt: new Date() },
      { dayId: 5, taskId: 1, completedAt: new Date() }
    ];

    enrollment.totalTimeSpent = 120; // 120 minutes = 2 hours
    enrollment.lastAccessedAt = new Date();

    // Trigger pre-save hooks to recalculate progress
    await enrollment.save();

    console.log('Enrollment updated successfully:');
    console.log('- Status:', enrollment.status);
    console.log('- Progress:', enrollment.progress, '%');
    console.log('- Completed tasks count:', modProg.completedTasks.length);

    // Now call analyticsController getStudentAnalytics mock
    const analyticsController = require('../controllers/analyticsController');
    const req = {
      user: { _id: student._id }
    };
    const res = {
      json: (data) => {
        console.log('\n--- Mock Student Analytics Response ---');
        console.log(JSON.stringify(data, null, 2));
      },
      status: (code) => {
        console.log('Status code:', code);
        return res;
      }
    };

    await analyticsController.getStudentAnalytics(req, res);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

simulate();
