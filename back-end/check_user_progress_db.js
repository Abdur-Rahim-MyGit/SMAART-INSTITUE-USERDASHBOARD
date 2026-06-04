const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Register schemas
require('./models/User');
require('./models/Course');
const UserProgress = require('./models/UserProgress');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const progressCount = await UserProgress.countDocuments({});
    console.log(`Total UserProgress records: ${progressCount}`);

    const records = await UserProgress.find({})
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('user');

    records.forEach((r, idx) => {
      console.log(`\nRecord ${idx + 1}:`);
      console.log(`- User: ${r.user ? r.user.fullName : 'Unknown'} (${r.user ? r.user.email : 'Unknown'})`);
      console.log(`- CourseCode: ${r.courseCode}, ModuleId: ${r.moduleId}, DayId: ${r.dayId}, StepId: ${r.stepId}`);
      console.log(`- Video: completed=${r.videoCompleted}, duration=${r.videoDuration}, time=${r.last_timestamp}`);
      console.log(`- Assignment: status=${r.assignmentStatus}, progress=${r.assignmentProgress}`);
      console.log(`- Test: completed=${r.testCompleted}, score=${r.testScore}/${r.testTotalPoints}`);
      console.log(`- CreatedAt: ${r.createdAt.toISOString()}, UpdatedAt: ${r.updatedAt.toISOString()}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
