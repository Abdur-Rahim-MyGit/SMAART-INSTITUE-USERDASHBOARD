require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const dumpMA = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module1 = course.modules[0];

        const day3MA = module1.microAssessments?.find(ma => ma.dayId === 3);
        if (day3MA) {
            console.log(JSON.stringify(day3MA.questions, null, 2));
        } else {
            console.log('No Day 3 MA found');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

dumpMA();
