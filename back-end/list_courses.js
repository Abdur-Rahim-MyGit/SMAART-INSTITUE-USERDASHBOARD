const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({}).sort({ sequence: 1, createdAt: 1 });

        console.log(`Found ${courses.length} courses.\n`);

        courses.forEach((course, i) => {
            console.log(`[${i + 1}] Title: ${course.title} (ID: ${course._id}, Code: ${course.courseCode})`);
            console.log(`    Status: ${course.status}`);
            console.log(`    Modules: ${course.modules?.length || 0}`);
            if (course.modules && course.modules.length > 0) {
                course.modules.forEach((mod, j) => {
                    console.log(`      Mod ${mod.sequence || j + 1}: ${mod.title} (Days: ${mod.days?.length || 0})`);
                });
            }
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
