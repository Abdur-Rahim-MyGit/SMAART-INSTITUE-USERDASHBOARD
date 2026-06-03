const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const courses = await Course.find();
    console.log(`Total courses in DB: ${courses.length}`);
    for (const c of courses) {
      console.log(`- ID: ${c._id}`);
      console.log(`  Title: ${c.title}`);
      console.log(`  CourseCode: ${c.courseCode}`);
      console.log(`  CourseNumber: ${c.courseNumber}`);
      console.log(`  Category: ${c.category}`);
      console.log(`  Modules count: ${c.modules ? c.modules.length : 'undefined'}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
