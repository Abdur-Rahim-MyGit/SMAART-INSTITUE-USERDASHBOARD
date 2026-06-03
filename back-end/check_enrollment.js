const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const CourseEnrollment = require('./models/CourseEnrollment');
const Student = require('./models/Student');
const Course = require('./models/Course');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const student = await Student.findOne({ email: 'aalam@gmail.com' });
    const course = await Course.findOne({ courseCode: 'CRS00001' });

    if (!student || !course) {
      console.log('Student or Course not found');
      return;
    }

    console.log(`Student ID: ${student._id}`);
    console.log(`Course ID: ${course._id}`);

    const enrollment = await CourseEnrollment.findOne({
      student: student._id,
      course: course._id
    });

    if (enrollment) {
      console.log('Enrollment found!');
      console.log(`- ID: ${enrollment._id}`);
      console.log(`  Status: ${enrollment.status}`);
      console.log(`  Progress: ${enrollment.progress}%`);
      console.log(`  Completed: ${enrollment.completed}`);
      console.log(`  Completion Date: ${enrollment.completionDate}`);
    } else {
      console.log('No enrollment found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
