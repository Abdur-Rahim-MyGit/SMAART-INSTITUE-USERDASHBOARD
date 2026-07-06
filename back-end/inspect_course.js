const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

require('./models/Course');
const Course = mongoose.model('Course');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const courses = await Course.find({});
    console.log(`Scanning ${courses.length} courses...`);
    courses.forEach(c => {
      if (c.modules) {
        c.modules.forEach(m => {
          if (m.steps) {
            m.steps.forEach(s => {
              if (s.type === 'case-study' || s.contentType === 'case-study') {
                console.log(`Course: ${c.courseCode}, Title: ${c.title}`);
                console.log(`- Step ${s.stepNumber}: ${s.title}, Type: ${s.type}`);
              }
            });
          }
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
