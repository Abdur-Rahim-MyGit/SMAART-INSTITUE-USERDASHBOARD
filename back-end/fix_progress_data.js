const mongoose = require('mongoose');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to Production DB for repair...'))
    .catch(err => console.error('Connection Error:', err));

async function fixAllProgress() {
    try {
        const enrollments = await CourseEnrollment.find().populate('course');
        console.log(`Found ${enrollments.length} enrollments to check.`);

        let fixedCount = 0;

        for (const enrollment of enrollments) {
            if (!enrollment.course) {
                console.log(`Skipping enrollment ${enrollment._id}: Course not found (might be deleted)`);
                continue;
            }

            const totalModules = enrollment.course.modules ? enrollment.course.modules.length : 0;
            if (totalModules === 0) continue;

            const completedModules = enrollment.moduleProgress ? enrollment.moduleProgress.filter(m => m.status === 'completed').length : 0;
            const correctProgress = Math.round((completedModules / totalModules) * 100);

            if (enrollment.progress !== correctProgress) {
                console.log(`Updating ${enrollment._id}: ${enrollment.progress}% -> ${correctProgress}% (Course: ${enrollment.course.title})`);

                enrollment.progress = correctProgress;

                // Update status too
                if (correctProgress === 100) {
                    enrollment.status = 'completed';
                } else if (correctProgress > 0) {
                    enrollment.status = 'in_progress';
                } else {
                    enrollment.status = 'enrolled';
                }

                await enrollment.save();
                fixedCount++;
            }
        }

        console.log(`\nRepair completed. Fixed ${fixedCount} enrollments.`);

    } catch (error) {
        console.error('Error during repair:', error);
    } finally {
        mongoose.disconnect();
    }
}

fixAllProgress();
