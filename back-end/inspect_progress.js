const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find the most recently updated enrollment
        const latestEnrollment = await CourseEnrollment.findOne({})
            .sort({ updatedAt: -1 })
            .populate('student')
            .populate('course');

        if (!latestEnrollment) {
            console.log('No enrollments found.');
            process.exit(0);
        }

        const student = latestEnrollment.student;
        console.log(`\n--- Inspecting Enrollment for ${student.fullName} (${student.email}) ---`);
        console.log(`Course: ${latestEnrollment.course.title}`);
        console.log(`Student ID: ${student._id}`);
        console.log(`Badges in DB: ${JSON.stringify(student.badges || [])}`);

        const completedDays = new Set();

        console.log('\nModule Progress Breakdown:');
        latestEnrollment.moduleProgress.forEach((mp, idx) => {
            console.log(`\nModule ${idx + 1}:`);
            console.log(`- Video Progress: ${JSON.stringify(mp.videoProgress || [])}`);
            console.log(`- Completed Tasks: ${JSON.stringify(mp.completedTasks || [])}`);

            if (mp.videoProgress) {
                mp.videoProgress.forEach(vp => {
                    if (vp.isCompleted) completedDays.add(vp.dayId);
                });
            }
            if (mp.completedTasks) {
                mp.completedTasks.forEach(ct => {
                    completedDays.add(ct.dayId);
                });
            }
        });

        const completedDaysArray = Array.from(completedDays).sort((a, b) => a - b);
        console.log(`\nCompleted Days Collected: ${completedDaysArray}`);
        const has1 = completedDays.has(1);
        const has2 = completedDays.has(2);
        const has3 = completedDays.has(3);
        console.log(`Has Day 1: ${has1}`);
        console.log(`Has Day 2: ${has2}`);
        console.log(`Has Day 3: ${has3}`);

        const eligibility = has1 && has2 && has3;
        console.log(`Eligible for EARLY-ACHIEVER: ${eligibility}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
