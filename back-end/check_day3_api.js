require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const checkDay3API = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected\n');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.error('Course not found');
            process.exit(1);
        }

        const module = course.modules[0];
        const day3 = module.days.find(d => d.dayNumber === 3);

        console.log('=== DAY 3 API RESPONSE SIMULATION ===\n');
        console.log(`Day Title: ${day3.title}`);
        console.log(`Day Number: ${day3.dayNumber}`);
        console.log(`Total Steps: ${day3.steps.length}\n`);

        console.log('Steps Array:');
        day3.steps.forEach((step, idx) => {
            console.log(`\n[${idx}] Step Object:`);
            console.log(`  id: ${step.id || step._id}`);
            console.log(`  stepNumber: ${step.stepNumber}`);
            console.log(`  title: ${step.title}`);
            console.log(`  type: ${step.type}`);
            console.log(`  isRequired: ${step.isRequired}`);
        });

        console.log('\n\n=== JSON OUTPUT (as API would return) ===');
        console.log(JSON.stringify({
            steps: day3.steps.map(s => ({
                id: s.id || s._id,
                stepNumber: s.stepNumber,
                title: s.title,
                type: s.type,
                isRequired: s.isRequired
            }))
        }, null, 2));

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

checkDay3API();
