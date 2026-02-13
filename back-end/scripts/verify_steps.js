require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module1 = course.modules[0];
        const days = module1.days.filter(d => [4, 5, 6].includes(d.dayNumber));

        days.forEach(d => {
            console.log(`Day ${d.dayNumber}:`);
            console.log(`- Steps count: ${d.steps?.length || 0}`);
            if (d.steps) {
                d.steps.forEach(s => {
                    console.log(`  Step ${s.stepNumber}: ${s.type}`);
                    console.log(`    Content videoUrl: ${s.content?.videoUrl}`);
                    console.log(`    IntroText length: ${s.introText?.length || 0}`);
                });
            }
        });
        mongoose.disconnect();
    });
