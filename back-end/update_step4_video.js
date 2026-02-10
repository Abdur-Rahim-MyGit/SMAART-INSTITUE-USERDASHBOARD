require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Course = require('./models/Course');

const updateStep4 = async () => {
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

        if (step4) {
            console.log('Current videoUrl:', step4.content.videoUrl);
            step4.content.videoUrl = "https://res.cloudinary.com/dlpmrdcqp/video/upload/WhatsApp_Video_2026-01-19_at_14.40.50_1_lucryr.mp4";

            // Mark as modified if using nested schema
            course.markModified('modules');

            await course.save();
            console.log('Step 4 videoUrl updated successfully');
        } else {
            console.log('Step 4 not found');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        mongoose.disconnect();
    }
};

updateStep4();
