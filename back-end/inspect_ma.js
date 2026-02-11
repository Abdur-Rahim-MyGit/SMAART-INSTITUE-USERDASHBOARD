require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspectMA = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module1 = course.modules[0];

        console.log('--- Module Micro-Assessments ---');
        const day3MA = module1.microAssessments?.find(ma => ma.dayId === 3);
        if (day3MA) {
            console.log(`Day 3 MA: ${day3MA.title}, stepId: ${day3MA.stepId}`);
        } else {
            console.log('No Day 3 MA found in microAssessments array');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

inspectMA();
