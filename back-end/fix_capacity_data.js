require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const fixCapacityData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const course = await Course.findOne({ title: 'Capacity' });
        if (!course) {
            console.error('Course "Capacity" not found');
            process.exit(1);
        }

        console.log('Fixing module sequences...');
        // Correct sequences: 1, 2, 3
        course.modules.forEach((mod, i) => {
            mod.sequence = i + 1;
        });

        console.log('Fixing Step numbering in Module 1...');
        const mod1 = course.modules[0];
        if (mod1) {
            mod1.days.forEach((day, dIdx) => {
                if (day.steps && day.steps.length > 0) {
                    day.steps.forEach((step, sIdx) => {
                        step.stepNumber = sIdx + 1;
                    });
                }
            });
        }

        course.markModified('modules');
        await course.save();
        console.log('✅ Capacity data fixed successfully!');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error fixing data:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

fixCapacityData();
