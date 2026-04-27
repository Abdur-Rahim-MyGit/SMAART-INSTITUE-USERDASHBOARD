require('dotenv').config();
const mongoose = require('mongoose');
const CourseEnrollment = require('./models/CourseEnrollment');

const resetDay3Progress = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find the enrollment for CRS00001
        const enrollment = await CourseEnrollment.findOne({
            // We can target specific student if we had their ID, 
            // but for now let's just clear for the most recent one or all for this course
            // Usually safest to clear all for the specific course in a demo environment
        });

        if (enrollment) {
            console.log(`Clearing Day 3 progress for student ID: ${enrollment.student}`);

            enrollment.moduleProgress.forEach(mp => {
                // Clear video progress for Day 3
                if (mp.videoProgress) {
                    mp.videoProgress = mp.videoProgress.filter(vp => vp.dayId !== 3);
                }
                // Clear completed tasks for Day 3
                if (mp.completedTasks) {
                    mp.completedTasks = mp.completedTasks.filter(ct => ct.dayId !== 3);
                }
                // Clear task results for Day 3
                if (mp.taskResults) {
                    mp.taskResults = mp.taskResults.filter(tr => tr.dayId !== 3);
                }
            });

            enrollment.markModified('moduleProgress');
            await enrollment.save();
            console.log('✅ Day 3 progress cleared successfully.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

resetDay3Progress();
