const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    const enrollments = await CourseEnrollment.find()
        .populate('student', 'email fullName')
        .populate('course', 'title modules');

    console.log(`Found ${enrollments.length} enrollments.`);

    enrollments.forEach((e, idx) => {
        console.log(`\n--- Enrollment ${idx + 1} ---`);
        console.log(`ID: ${e._id}`);
        console.log(`User: ${e.student?.email} (${e.student?.fullName})`);
        console.log(`Course: ${e.course?.title}`);
        console.log(`Progress Stored: ${e.progress}%`);
        console.log(`Status: ${e.status}`);
        console.log(`ModuleProgress Count: ${e.moduleProgress?.length}`);

        if (e.moduleProgress) {
            e.moduleProgress.forEach((mp, mIdx) => {
                const completedTasks = mp.completedTasks ? mp.completedTasks.length : 0;
                const videoProgress = mp.videoProgress ? mp.videoProgress.length : 0;
                console.log(`  Module ${mIdx + 1} (${mp.status}): ${completedTasks} tasks, ${videoProgress} videos`);

                // If the user says "6 sessions only 3 completed", maybe they mean tasks?
                // Or maybe dayProgress?
                if (mp.completedTasks) {
                    console.log(`    Completed Task Days: ${[...new Set(mp.completedTasks.map(t => t.dayId))].join(', ')}`);
                }
                if (mp.videoProgress) {
                    console.log(`    Completed Video Days: ${[...new Set(mp.videoProgress.filter(v => v.isCompleted).map(v => v.dayId))].join(', ')}`);
                }
            });
        }
    });

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
