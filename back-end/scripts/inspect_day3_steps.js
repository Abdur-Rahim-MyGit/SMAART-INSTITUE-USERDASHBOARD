require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspectSteps = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const day3 = course.modules[0].days.find(d => d.dayNumber === 3);

        console.log('--- Day 3 Steps Overview ---');
        day3.steps.forEach(s => {
            console.log(`Step ${s.stepNumber}: ${s.title} [${s.type}]`);
            if (s.stepNumber === 5) {
                console.log(`  Content: ${JSON.stringify(s.content, null, 2)}`);
            }
        });

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

inspectSteps();
