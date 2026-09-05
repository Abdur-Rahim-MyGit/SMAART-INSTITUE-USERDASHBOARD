const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../back-end/.env') });

require('../back-end/models/Course');
const Course = mongoose.model('Course');
const UserProgress = mongoose.model('UserProgress');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const course = await Course.findOne({ courseCode: 'CRS00014' });
    if (!course) {
      console.log('Course CRS00014 not found');
    } else {
      console.log('Course Title:', course.title);
      console.log('Modules Count:', course.modules ? course.modules.length : 0);
      if (course.modules && course.modules[0] && course.modules[0].days) {
        course.modules[0].days.forEach((day) => {
          console.log(`\nDay ID: ${day.dayId}`);
          if (day.tasks) {
            day.tasks.forEach((task) => {
              console.log(`- Task ID: ${task.taskId}, Title: ${task.title}, Type: ${task.taskType}`);
              if (task.questions) {
                console.log(`  Questions count: ${task.questions.length}`);
                task.questions.forEach((q, idx) => {
                  console.log(`    [${idx}] ${q.question || q.scenario || q.questionText}`);
                });
              }
              if (task.mcq) {
                console.log(`  MCQ: ${task.mcq.question}`);
              }
            });
          }
        });
      }
    }

    const progress = await UserProgress.find({ courseCode: 'CRS00014' });
    console.log('\n--- User Progress for CRS00014 ---');
    progress.forEach(p => {
      console.log(`Step ${p.stepId}: status=${p.assignmentStatus}, testCompleted=${p.testCompleted}, testScore=${p.testScore}/${p.testTotalPoints}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
