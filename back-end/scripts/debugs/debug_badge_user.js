const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const CourseEnrollment = require('./models/CourseEnrollment');
const { awardEarlyAchieverBadge } = require('./utils/badgeHelper');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const studentId = '691c4a243408254901245d8d'; // Imran's ID
        console.log(`\n--- Debugging Badge for User ${studentId} ---`);

        let user = await Student.findById(studentId);
        console.log(`Found in Student collection: ${!!user}`);
        if (!user) {
            user = await User.findById(studentId);
            console.log(`Found in User collection: ${!!user}`);
        }

        if (user) {
            console.log(`User Name: ${user.fullName}`);
            console.log(`Existing Badges: ${JSON.stringify(user.badges)}`);
        }

        const enrollments = await CourseEnrollment.find({ student: studentId })
            .sort({ enrollmentDate: 1 });

        console.log(`Found ${enrollments.length} enrollments.`);

        for (const en of enrollments) {
            console.log(`\nEnrollment for Course: ${en.course}`);
            const completedDays = new Set();
            en.moduleProgress.forEach(mp => {
                if (mp.videoProgress) mp.videoProgress.forEach(vp => {
                    if (vp.isCompleted) {
                        completedDays.add(vp.dayId);
                        console.log(`Day ${vp.dayId} (Video) is completed`);
                    }
                });
                if (mp.completedTasks) mp.completedTasks.forEach(ct => {
                    completedDays.add(ct.dayId);
                    console.log(`Day ${ct.dayId} (Task) is completed`);
                });
            });
            console.log(`Total Completed Days for this enrollment: ${Array.from(completedDays).sort()}`);
        }

        console.log('\nRunning awardEarlyAchieverBadge...');
        const result = await awardEarlyAchieverBadge(studentId);
        console.log(`Result: ${JSON.stringify(result)}`);

        // Re-check user
        const updatedUser = await Student.findById(studentId) || await User.findById(studentId);
        console.log(`Updated User Badges: ${JSON.stringify(updatedUser.badges)}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
