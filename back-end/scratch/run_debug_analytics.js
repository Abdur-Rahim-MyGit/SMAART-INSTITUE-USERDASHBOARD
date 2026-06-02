const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugAllAnalytics() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const Student = require('../models/Student');
    const CourseEnrollment = require('../models/CourseEnrollment');
    const { getStudentAnalytics } = require('../controllers/analyticsController');

    const students = await Student.find();
    console.log(`Found ${students.length} students in database. Testing analytics for each...`);

    let failures = 0;
    for (const student of students) {
      // Check if student has enrollments
      const count = await CourseEnrollment.countDocuments({ student: student._id });
      
      const req = { user: student };
      let errorThrown = null;
      
      const res = {
        json: function(data) {
          // Success
        },
        status: function(code) {
          return this;
        }
      };

      try {
        await getStudentAnalytics(req, res);
      } catch (err) {
        errorThrown = err;
      }

      if (errorThrown) {
        failures++;
        console.error(`❌ Student ${student.fullName} (_id: ${student._id}) failed! Enrollments: ${count}`);
        console.error(errorThrown);
      } else {
        console.log(`✅ Student ${student.fullName} (_id: ${student._id}) passed. Enrollments: ${count}`);
      }
    }

    console.log(`\nTesting completed. Failures: ${failures}/${students.length}`);

  } catch (err) {
    console.error('CRITICAL ERROR IN RUNTIME:', err);
  } finally {
    await mongoose.disconnect();
  }
}

debugAllAnalytics();
