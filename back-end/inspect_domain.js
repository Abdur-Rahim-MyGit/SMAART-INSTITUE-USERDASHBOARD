require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const day3 = course.modules[0].days.find(d => d.dayNumber === 3);
        const domainStep = day3.steps.find(s => s.type === 'domain_assessment');
        console.log(JSON.stringify(domainStep.content, null, 2));
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
