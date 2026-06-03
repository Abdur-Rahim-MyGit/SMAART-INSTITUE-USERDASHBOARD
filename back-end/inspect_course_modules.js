const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const Course = mongoose.model('Course', new mongoose.Schema({}, { strict: false }));

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const course = await Course.findOne({ courseCode: 'CRS00001' });
    if (!course) {
      console.log('Course CRS00001 not found.');
    } else {
      console.log('Course ID:', course._id);
      console.log('Title:', course.title);
      console.log('Modules length:', course.modules ? course.modules.length : 'undefined');
      if (course.modules) {
        course.modules.forEach((mod, idx) => {
          console.log(`- Module ${idx + 1}: ${mod.title}, days count: ${mod.days ? mod.days.length : 'undefined'}`);
        });
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
