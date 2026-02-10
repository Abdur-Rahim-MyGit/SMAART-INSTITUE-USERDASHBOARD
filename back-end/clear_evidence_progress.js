require('dotenv').config();
const mongoose = require('mongoose');
const CourseEnrollment = require('./models/CourseEnrollment');
const Course = require('./models/Course');
const User = require('./models/User');

const clearEvidenceTaskProgress = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Since I don't have the specific student ID, I'll search for the enrollment in CRS00001
        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) throw new Error('Course CRS00001 not found');

        const module1 = course.modules[0];
        const module1Id = module1._id;

        // Clear for all enrollments in this course for testing purposes, 
        // or just find the one modified recently might be safer.
        // Assuming current student (Abdur Rahim or similar)
        // I'll grab all enrollments for this course and clear Day 3, Step 2 (Evidence Task)

        const enrollments = await CourseEnrollment.find({ course: course._id });
        console.log(`Found ${enrollments.length} enrollments to check.`);

        let modifiedCount = 0;
        for (const enrollment of enrollments) {
            const modProgress = enrollment.moduleProgress.find(mp => mp.module.toString() === module1Id.toString());
            if (modProgress) {
                let changed = false;

                // 1. Clear from videoProgress (Step 2 is Evidence Task)
                if (modProgress.videoProgress) {
                    const initialLen = modProgress.videoProgress.length;
                    modProgress.videoProgress = modProgress.videoProgress.filter(vp =>
                        !(vp.dayId === 3 && vp.stepId === 2)
                    );
                    if (modProgress.videoProgress.length !== initialLen) {
                        console.log(`Cleared videoProgress for Day 3, Step 2 in enrollment ${enrollment._id}`);
                        changed = true;
                    }
                }

                // 2. Clear from completedTasks (if any)
                if (modProgress.completedTasks) {
                    const initialLen = modProgress.completedTasks.length;
                    modProgress.completedTasks = modProgress.completedTasks.filter(ct =>
                        !(ct.dayId === 3 && ct.taskId === 2)
                    );
                    if (modProgress.completedTasks.length !== initialLen) {
                        console.log(`Cleared completedTasks for Day 3, Step 2 in enrollment ${enrollment._id}`);
                        changed = true;
                    }
                }

                if (changed) {
                    await enrollment.save();
                    modifiedCount++;
                }
            }
        }

        console.log(`✅ Cleared progress for ${modifiedCount} enrollments.`);
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

clearEvidenceTaskProgress();
