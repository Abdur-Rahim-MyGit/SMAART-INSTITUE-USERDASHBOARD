require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course not found');
            process.exit(1);
        }
        course.modules.forEach((mod, modIdx) => {
            if (modIdx !== 0) return; // Only Module 1 for now
            console.log(`Module ${modIdx + 1}: ${mod.title}`);
            mod.days.forEach(day => {
                if (day.dayNumber !== 3) return; // Only Day 3
                console.log(`  Day ${day.dayNumber}: ${day.moduleDetails?.title || 'No Title'}`);
                if (day.steps) {
                    day.steps.forEach(step => {
                        console.log(`\n    --- Step: ${step.title} (${step.type}) ---`);
                        console.log(JSON.stringify(step.content, null, 2));
                    });
                }
            });
        });
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
