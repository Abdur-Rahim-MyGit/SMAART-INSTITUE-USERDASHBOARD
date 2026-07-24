const mongoose = require('mongoose');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to Production DB...');

    // Find enrollments with 100% progress
    const enrollments = await CourseEnrollment.find({ progress: 100 })
        .populate('student', 'email fullName')
        .populate('course', 'title modules');

    console.log(`Found ${enrollments.length} enrollments with 100% progress.`);

    enrollments.forEach(e => {
        console.log(`\nUser: ${e.student?.email} (${e.student?.fullName})`);
        console.log(`Course: ${e.course?.title}`);
        console.log(`Total Modules in Course: ${e.course?.modules?.length}`);
        console.log(`ModuleProgress Entries: ${e.moduleProgress?.length}`);
        const completed = e.moduleProgress.filter(mp => mp.status === 'completed').length;
        console.log(`Completed Modules (count): ${completed}`);
    });

    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    mongoose.disconnect();
});
