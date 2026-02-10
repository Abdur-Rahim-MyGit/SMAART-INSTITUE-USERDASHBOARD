require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const verifyStep3Content = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const step3Id = '698acc34147220afd4911392';
        let found = false;

        course.modules[0].days.forEach(day => {
            if (day.dayNumber === 3) {
                const step = day.steps.id(step3Id);
                if (step) {
                    console.log('--- Step 3 Details ---');
                    console.log('ID:', step._id);
                    console.log('Title:', step.title);
                    console.log('Type:', step.type);
                    console.log('Content Keys:', Object.keys(step.content || {}));
                    console.log('Full Content:', JSON.stringify(step.content, null, 2));
                    found = true;
                }
            }
        });

        if (!found) console.log('Step 3 with ID not found in Day 3');

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

verifyStep3Content();
