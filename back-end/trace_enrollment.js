const mongoose = require('mongoose');
const User = require('./models/User');
const CourseEnrollment = require('./models/CourseEnrollment');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    const users = await User.find({}, 'email fullName');
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        const enrollments = await CourseEnrollment.find({ student: user._id })
            .populate('course', 'title modules');

        if (enrollments.length > 0) {
            console.log(`\nUser: ${user.fullName} (${user.email})`);
            enrollments.forEach(e => {
                console.log(`- Course: ${e.course?.title}`);
                console.log(`  Stored Progress: ${e.progress}%`);
                console.log(`  ModuleProgress Length: ${e.moduleProgress?.length}`);
                e.moduleProgress.forEach((mp, i) => {
                    const completedTasks = mp.completedTasks ? mp.completedTasks.length : 0;
                    const videoProgress = mp.videoProgress ? mp.videoProgress.length : 0;
                    console.log(`    Mod ${i + 1} (${mp.status}): ${completedTasks} tasks, ${videoProgress} videos`);
                });
            });
        }
    }

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
