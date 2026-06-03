const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const BACKEND_URL = 'http://localhost:5000/api';
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function run() {
  try {
    const studentId = '69e0c4dc56ab75fec31c6109';
    const email = 'aalam@gmail.com';
    const courseCode = 'CRS00001';

    console.log(`Generating token for studentId: ${studentId}, email: ${email}...`);
    const token = jwt.sign(
      {
        userId: studentId,
        id: studentId,
        email: email,
        userType: 'student',
        role: 'student'
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Token generated successfully.');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // Get Course details to see step counts
    const courseRes = await axios.get(`${BACKEND_URL}/courses/code/${courseCode}`, { headers });
    const course = courseRes.data.data;
    console.log(`Course Title: ${course.title}`);
    
    // S01 has 7 days of learning flow
    const daysCount = course.modules[0].days.length;
    console.log(`Number of days in course: ${daysCount}`);

    // Connect to MongoDB directly to make sure we clean up any existing enrollment first
    await mongoose.connect(MONGODB_URI);
    const CourseEnrollment = mongoose.model('CourseEnrollment', new mongoose.Schema({}, { strict: false }));
    const UserProgress = mongoose.model('UserProgress', new mongoose.Schema({}, { strict: false }), 'user_progress');

    console.log('Cleaning up existing enrollment and progress for clean test...');
    await CourseEnrollment.deleteMany({ student: studentId, course: course._id });
    await UserProgress.deleteMany({ user: studentId, courseCode });

    // Let's complete each day (1 to 7)
    for (let dayId = 1; dayId <= daysCount; dayId++) {
      console.log(`Completing Day ${dayId}...`);

      // 1. Save user progress
      await axios.post(`${BACKEND_URL}/courseEnrollments/user-progress/save`, {
        courseCode,
        moduleId: '1',
        dayId,
        stepId: dayId,
        videoCompleted: true,
        assignmentStatus: 'Submitted',
        assignmentProgress: 100
      }, { headers });

      // 2. Save task progress (which triggers the course completion check)
      const taskRes = await axios.post(`${BACKEND_URL}/courseEnrollments/task-progress`, {
        studentId,
        courseCode,
        moduleId: 1,
        dayId,
        taskId: 1,
        completed: true
      }, { headers });

      console.log(`- Day ${dayId} complete. Enrollment progress: ${taskRes.data.data.progress}%`);
    }

    const enrollment = await CourseEnrollment.findOne({ student: studentId, course: course._id });
    
    console.log('\n--- Direct DB Verification ---');
    if (enrollment) {
      console.log(`Enrollment Status: ${enrollment.status}`);
      console.log(`Enrollment Progress: ${enrollment.progress}%`);
    } else {
      console.log('No enrollment record found.');
    }

  } catch (err) {
    console.error('Error Details:', err);
    if (err.response) {
      console.error('Response Data:', err.response.data);
      console.error('Response Status:', err.response.status);
    }
  } finally {
    await mongoose.disconnect();
  }
}

run();
