const mongoose = require('mongoose');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');
const User = require('./models/User');

const mongoURI = 'mongodb+srv://smaartmind:smaartmind123@smaartminds.hhyscvh.mongodb.net/?appName=SmaartMinds';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected to Production DB'))
    .catch(err => console.error('MongoDB Connection Error:', err));

async function inspectEnrollment() {
    try {
        // Find ANY enrollment to check structure
        const enrollment = await CourseEnrollment.findOne()
            .populate('student', 'fullName email')
            .populate('course')
            .sort({ updatedAt: -1 });

        if (!enrollment) {
            console.log('No enrollments found at all.');
            return;
        }

        console.log(`\nFound Enrollment for ${enrollment.student?.email} (Status: ${enrollment.status})`);

        await analyzeEnrollment(enrollment);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
}

async function analyzeEnrollment(enrollment) {
    console.log(`\n--- Analyzing Enrollment for ${enrollment.student?.email} ---`);
    console.log(`Course: ${enrollment.course?.title}`);
    console.log(`Total Modules in Course: ${enrollment.course?.modules?.length}`);
    console.log(`Current Progress Field: ${enrollment.progress}%`);
    console.log(`Module Progress Entries: ${enrollment.moduleProgress?.length}`);

    let completedModulesCount = 0;
    console.log('\nModule Details:');
    if (enrollment.moduleProgress) {
        enrollment.moduleProgress.forEach((mp, index) => {
            let status = mp.status;
            console.log(`  Module ID: ${mp.module}, Status: ${status}`);
            if (status === 'completed') completedModulesCount++;
        });
    }

    // Manually calculate expected progress
    const totalModules = enrollment.course?.modules?.length || 0;
    let calculatedProgress = 0;

    if (totalModules > 0) {
        calculatedProgress = Math.round((completedModulesCount / totalModules) * 100);
    }

    console.log(`\nStatistics:`);
    console.log(`  Completed Modules: ${completedModulesCount}`);
    console.log(`  Total Modules: ${totalModules}`);
    console.log(`  Calculated Progress: ${completedModulesCount} / ${totalModules} * 100 = ${calculatedProgress}%`);
    console.log(`  Stored Progress: ${enrollment.progress}%`);

    if (enrollment.progress !== calculatedProgress && Math.abs(enrollment.progress - calculatedProgress) > 1) {
        console.log('⚠️  MISMATCH DETECTED!');
    } else {
        console.log('✅ Progress matches calculation.');
    }
}

inspectEnrollment();
