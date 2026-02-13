require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course not found');
            process.exit(0);
        }
        const module1 = course.modules[0];
        console.log('--- Module 1 Days 4, 5, 6 ---');
        const targetDays = module1.days.filter(d => [4, 5, 6].includes(d.dayNumber));
        console.log(JSON.stringify(targetDays, null, 2));
        mongoose.disconnect();
    });
