const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const Course = require('./models/Course');
const { normalizeCourseStages } = require('./utils/courseStageDefaults');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const courses = await Course.find();
    console.log(`Found ${courses.length} courses to normalize.`);

    for (const course of courses) {
      console.log(`Normalizing course: ${course.title} (${course.courseCode})`);
      const courseObj = course.toObject();
      const normalized = normalizeCourseStages(courseObj, courseObj);
      
      course.modules = normalized.modules;
      course.markModified('modules');
      
      await course.save();
      console.log(`- Saved course: ${course.title}. Modules count: ${course.modules.length}`);
    }

    console.log('✅ All courses normalized successfully!');
  } catch (err) {
    console.error('Error normalizing courses:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
