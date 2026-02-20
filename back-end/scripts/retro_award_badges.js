const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const CourseEnrollment = require('../models/CourseEnrollment');
const Course = require('../models/Course');
const { isSessionCompleted, isModuleCompleted } = require('../utils/progressUtils');
const { checkSkillCompletionBadges, checkCourseCompletionBadges } = require('../utils/badgeUtils');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

async function catchUpBadges() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find all enrollments
        const enrollments = await CourseEnrollment.find({}).populate('course');
        console.log(`🔍 Checking ${enrollments.length} enrollments for missing badges...`);

        let badgesAwarded = 0;

        for (const enrollment of enrollments) {
            const course = enrollment.course;
            if (!course || !course.modules) continue;

            const studentId = enrollment.student;

            // Check each module in the course
            for (const moduleDoc of course.modules) {
                try {
                    const isDone = await isModuleCompleted(enrollment, course, moduleDoc);
                    console.log(`  - Module "${moduleDoc.title}": isDone=${isDone}`);

                    if (!isDone) {
                        // Let's see which days are missing
                        for (const day of moduleDoc.days) {
                            const dayDone = await isSessionCompleted(enrollment, course, moduleDoc, day.dayNumber);
                            if (!dayDone) {
                                console.log(`      ✘ Day ${day.dayNumber} is NOT complete`);
                                // Dump required steps
                                const dayObj = moduleDoc.days.find(d => d.dayNumber === day.dayNumber);
                                const requiredSteps = dayObj.steps ? dayObj.steps.filter(s => s.isRequired !== false) : [];
                                console.log(`        Required steps: ${JSON.stringify(requiredSteps.map(s => ({ type: s.type, num: s.stepNumber })), null, 2)}`);

                                const mProg = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
                                if (mProg) {
                                    console.log(`        Video progress: ${JSON.stringify((mProg.videoProgress || []).filter(vp => vp.dayId === day.dayNumber).map(vp => ({ step: vp.stepId, done: vp.isCompleted })), null, 2)}`);
                                    console.log(`        Completed tasks: ${JSON.stringify((mProg.completedTasks || []).filter(ct => ct.dayId === day.dayNumber).map(ct => ct.taskId), null, 2)}`);
                                }
                            }
                        }
                    }

                    if (isDone) {
                        console.log(`  - Checking module "${moduleDoc.title}" for student ${studentId}`);
                        const result = await checkSkillCompletionBadges(studentId, moduleDoc._id, moduleDoc.title);
                        if (result && result.newlyEarned) {
                            console.log(`  ✅ Awarded [MOD-COMPLETE] for "${moduleDoc.title}" to ${studentId}`);
                            badgesAwarded++;
                        }
                    }
                } catch (modErr) {
                    console.error(`  ❌ Error checking module ${moduleDoc._id}:`, modErr.message);
                }
            }

            // Check course completion
            if (enrollment.status === 'completed') {
                try {
                    const result = await checkCourseCompletionBadges(studentId, course._id, course);
                    if (result && result.newlyEarned) {
                        console.log(`  ✅ Awarded [CRS-COMPLETE] for "${course.title}" to ${studentId}`);
                        badgesAwarded++;
                    }
                } catch (crsErr) {
                    console.error(`  ❌ Error checking course ${course._id}:`, crsErr.message);
                }
            }
        }

        console.log(`\n🎉 Retroactive awarding complete! Total badges newly awarded: ${badgesAwarded}`);
        mongoose.disconnect();
    } catch (err) {
        console.error('❌ Critical error in catch-up script:', err);
        process.exit(1);
    }
}

catchUpBadges();
