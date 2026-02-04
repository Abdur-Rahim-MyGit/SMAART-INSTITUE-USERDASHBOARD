const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Course = require('./models/Course');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const inspectSteps = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const courses = await Course.find({ status: 'active' }).limit(1);
        if (courses.length === 0) {
            console.log('No active courses found.');
            process.exit(0);
        }

        const course = courses[0];
        console.log(`Course Title: ${course.title}`);

        if (course.modules && course.modules.length > 0) {
            const firstModule = course.modules[0];
            console.log(`Module: ${firstModule.title}`);

            if (firstModule.days && firstModule.days.length > 0) {
                const firstDay = firstModule.days[0];
                console.log(`Day ${firstDay.dayNumber}: ${firstDay.moduleDetails?.title || 'No Title'}`);

                if (firstDay.steps && firstDay.steps.length > 0) {
                    console.log('Steps found:');
                    firstDay.steps.forEach(step => {
                        console.log(`- Step ${step.stepNumber}: [${step.type}] ${step.title}`);
                        if (step.type === 'video') {
                            console.log('  Video Content:', JSON.stringify(step.content, null, 2));
                        }
                    });
                } else {
                    console.log('No steps found in this day.');
                }
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

inspectSteps();
