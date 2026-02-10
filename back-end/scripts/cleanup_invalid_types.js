require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const cleanupInvalidTypes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.error('Course CRS00001 not found');
            process.exit(1);
        }

        console.log(`Found Course: ${course.title}`);
        console.log('Cleaning up invalid step types...');

        let changesCount = 0;

        // Iterate through all modules
        course.modules.forEach((module, mIdx) => {
            module.days.forEach((day, dIdx) => {
                if (day.steps && day.steps.length > 0) {
                    day.steps.forEach((step, sIdx) => {
                        if (step.type === 'domain_assessment') {
                            console.log(`  Found invalid type in Module ${mIdx + 1}, Day ${dIdx + 1}, Step ${sIdx + 1}`);
                            console.log(`    Changing 'domain_assessment' to 'assessment'`);
                            step.type = 'assessment';
                            changesCount++;
                        }
                    });
                }
            });
        });

        if (changesCount > 0) {
            course.markModified('modules');
            await course.save();
            console.log(`✅ Cleaned up ${changesCount} invalid step types`);
        } else {
            console.log('✅ No invalid types found');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Cleanup Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

cleanupInvalidTypes();
