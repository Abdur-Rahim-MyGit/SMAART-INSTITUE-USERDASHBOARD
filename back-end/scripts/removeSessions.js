const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Load models
require('../models/Course');
const Course = mongoose.model('Course');

async function removeSessions() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully.');

        const courses = await Course.find({});
        console.log(`Found ${courses.length} courses.`);

        for (const course of courses) {
            console.log(`Processing course: ${course.title} (${course.courseCode})`);
            let modified = false;

            if (course.modules && course.modules.length > 0) {
                course.modules.forEach(module => {
                    // Filter out sessions beyond Day 3
                    if (module.days && module.days.length > 0) {
                        const originalCount = module.days.length;
                        module.days = module.days.filter(day => day.dayNumber <= 3);
                        if (module.days.length !== originalCount) {
                            console.log(`  Module: ${module.title} - Removed ${originalCount - module.days.length} days.`);
                            modified = true;
                        }
                    }

                    // Filter out microAssessments beyond Day 3
                    if (module.microAssessments && module.microAssessments.length > 0) {
                        const originalMACount = module.microAssessments.length;
                        module.microAssessments = module.microAssessments.filter(ma => ma.dayId <= 3);
                        if (module.microAssessments.length !== originalMACount) {
                            console.log(`  Module: ${module.title} - Removed ${originalMACount - module.microAssessments.length} microAssessments.`);
                            modified = true;
                        }
                    }
                });
            }

            if (modified) {
                await course.save();
                console.log(`  Successfully updated course: ${course.title}`);
            } else {
                console.log(`  No changes needed for course: ${course.title}`);
            }
        }

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    }
}

removeSessions();
