const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const CourseEnrollment = require('./models/CourseEnrollment');

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const enrollments = await CourseEnrollment.find({})
            .sort({ updatedAt: -1 })
            .limit(10);

        console.log(`Found ${enrollments.length} recent enrollments.\n`);

        for (const en of enrollments) {
            let student = await User.findById(en.student) || await Student.findById(en.student);
            const studentName = student ? student.fullName : 'Unknown';
            const studentEmail = student ? student.email : 'Unknown';
            const badges = student ? student.badges : [];

            console.log(`Enrollment ID: ${en._id}`);
            console.log(`Student: ${studentName} (${studentEmail}) [${en.student}]`);
            console.log(`Badges: ${JSON.stringify(badges)}`);

            const completedDays = new Set();
            en.moduleProgress.forEach(mp => {
                if (mp.videoProgress) mp.videoProgress.forEach(vp => { if (vp.isCompleted) completedDays.add(vp.dayId); });
                if (mp.completedTasks) mp.completedTasks.forEach(ct => { completedDays.add(ct.dayId); });
            });
            console.log(`Completed Days: ${Array.from(completedDays).sort()}`);
            console.log('---');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
