require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const mod = course.modules[0];
        console.log(`\n================ MODULE 1: ${mod.title} ================`);
        const day3 = mod.days.find(d => d.dayNumber === 3);
        day3.steps.forEach(step => {
            console.log(`\nStep Number: ${step.stepNumber}`);
            console.log(`Title: ${step.title}`);
            console.log(`Type: ${step.type}`);
        });

        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
