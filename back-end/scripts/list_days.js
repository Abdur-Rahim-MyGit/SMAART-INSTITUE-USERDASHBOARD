require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course CRS00001 not found');
            process.exit(0);
        }
        console.log(`Course: ${course.title}`);
        course.modules.forEach((m, mIdx) => {
            console.log(`Module ${mIdx + 1}: ${m.title}`);
            console.log('Days:', m.days.map(d => ({ day: d.dayNumber, title: d.title })));
        });
        mongoose.disconnect();
    });
