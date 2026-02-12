const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ title: 'Capacity' });
        if (!course) {
            console.log('Course "Capacity" not found');
            process.exit(1);
        }

        const firstModule = course.modules[0];
        console.log('--- MODULE DETAILS ---');
        console.log(JSON.stringify(firstModule, null, 2));

        console.log('\n--- DAYS DETAILS ---');
        firstModule.days.forEach((day, i) => {
            console.log(`\nDay ${day.dayNumber}: ${day.moduleDetails?.title || day.title}`);
            console.log(`Steps: ${day.steps?.length || 0}`);
            if (day.steps) {
                day.steps.forEach((step, j) => {
                    console.log(`  Step ${step.stepNumber}: ${step.title} (${step.type})`);
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
