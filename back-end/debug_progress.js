require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const CourseEnrollment = require('./models/CourseEnrollment');
const Registration = require('./models/Registration');
const Course = require('./models/Course'); // Added this

async function checkUserProgress(email) {
    try {
        const mongoURI = process.env.MONGODB_URI;
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User not found: ${email}`);
            return;
        }
        console.log(`\n--- User Info ---`);
        console.log(`ID: ${user._id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Full Name: ${user.fullName}`);

        const registration = await Registration.findOne({ email });
        if (registration) {
            console.log(`\n--- Registration Info ---`);
            console.log(`ID: ${registration._id}`);
            console.log(`UserId in Reg: ${registration.userId}`);
            console.log(`Full Name: ${registration.fullName}`);
        }

        const enrollments = await CourseEnrollment.find({ student: user._id }).populate('course', 'title courseCode');
        console.log(`\n--- Enrollments (${enrollments.length}) ---`);
        enrollments.forEach((e, i) => {
            console.log(`[${i + 1}] Course: ${e.course?.title} (${e.course?.courseCode})`);
            console.log(`    Enrollment ID: ${e._id}`);
            console.log(`    Progress: ${e.progress}%`);
            console.log(`    Module Progress Count: ${e.moduleProgress?.length || 0}`);

            if (e.moduleProgress && e.moduleProgress.length > 0) {
                e.moduleProgress.forEach((mp, j) => {
                    console.log(`      Mod ${j + 1}: status=${mp.status}, videoProgress=${mp.videoProgress?.length || 0}, tasks=${mp.completedTasks?.length || 0}`);
                });
            }
        });

        // Also check if any enrollments exist for the REGISTRATION ID (by mistake)
        if (registration) {
            const regEnrollments = await CourseEnrollment.find({ student: registration._id }).populate('course', 'title');
            if (regEnrollments.length > 0) {
                console.log(`\n⚠️ FOUND ${regEnrollments.length} ENROLLMENTS LINKED TO REGISTRATION ID INSTEAD OF USER ID!`);
                regEnrollments.forEach((e, i) => {
                    console.log(`[${i + 1}] Wrong-ID Enrollment for Course: ${e.course?.title}`);
                    console.log(`    Enrollment ID: ${e._id}`);
                    console.log(`    Progress: ${e.progress}%`);
                    console.log(`    Module Progress Count: ${e.moduleProgress?.length || 0}`);
                    console.log(`    Full Module Progress: ${JSON.stringify(e.moduleProgress, null, 2)}`);
                });
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

const email = process.argv[2] || 'naifbasha50@gmail.com';
checkUserProgress(email);
