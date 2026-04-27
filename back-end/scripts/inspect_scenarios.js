require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const mod = course.modules[0];
        const day3 = mod.days.find(d => d.dayNumber === 3);

        const step5 = day3.steps.find(s => s.stepNumber === 5);
        const step7 = day3.steps.find(s => s.stepNumber === 7);

        console.log('\n--- Step 5 Content ---');
        console.log(JSON.stringify(step5.content, null, 2));

        console.log('\n--- Step 7 Content ---');
        console.log(JSON.stringify(step7.content, null, 2));

        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
