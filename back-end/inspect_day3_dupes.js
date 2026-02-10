require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspectMicroAssessments = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module = course.modules[0];
        const day3 = module.days.find(d => d.dayNumber === 3);

        console.log('--- Day 3 Steps in DB ---');
        day3.steps.forEach((s, i) => {
            console.log(`Step ${i}: ${s.title} (type: ${s.type}, _id: ${s._id})`);
        });

        console.log('\n--- Module Micro-Assessments for Day 3 ---');
        const dayAssessments = module.microAssessments.filter(ma => ma.dayId === 3);
        dayAssessments.forEach((ma, i) => {
            console.log(`MA ${i}: ${ma.title} (stepId: ${ma.stepId}, _id: ${ma._id})`);
        });

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

inspectMicroAssessments();
