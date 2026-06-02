const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkEnrollments() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    const CourseEnrollment = require('../models/CourseEnrollment');
    const enrollments = await CourseEnrollment.find();
    console.log(`Found ${enrollments.length} enrollments total.`);

    let issues = 0;
    for (const e of enrollments) {
      const date = e.enrollmentDate || e.createdAt;
      if (!date) {
        issues++;
        console.log(`⚠️ Enrollment ${e._id} has no enrollmentDate and no createdAt!`);
      } else {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          issues++;
          console.log(`⚠️ Enrollment ${e._id} has invalid date: ${date}`);
        }
      }
    }

    console.log(`Check finished. Enrollments with date issues: ${issues}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkEnrollments();
