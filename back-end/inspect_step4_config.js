require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspectStep4 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.log('Course not found');
            process.exit(1);
        }

        const module1 = course.modules[0];
        const day3 = module1.days.find(d => d.dayNumber === 3);

        if (!day3) {
            console.log('Day 3 not found');
            process.exit(1);
        }

        const step4 = day3.steps.find(s => s.stepNumber === 4);

        console.log('\n=== DAY 3 STEP 4 ===');
        if (step4) {
            console.log('Title:', step4.title);
            console.log('Type:', step4.type);
            console.log('\nContent:');
            console.log(JSON.stringify(step4.content, null, 2));
        } else {
            console.log('Step 4 not found');
            console.log('Available steps:', day3.steps.map(s => s.stepNumber));
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
};

inspectStep4();
