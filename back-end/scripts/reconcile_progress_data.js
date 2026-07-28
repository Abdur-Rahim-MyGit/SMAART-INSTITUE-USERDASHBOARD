const mongoose = require('mongoose');
const Course = require('./models/Course');
const CourseEnrollment = require('./models/CourseEnrollment');

const mongoURI = process.env.MONGODB_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to Production DB for repair...'))
    .catch(err => console.error('Connection Error:', err));

async function reconcileAllProgress() {
    try {
        // Fetch all enrollments, populate course to make logic in pre('save') hook efficient
        const enrollments = await CourseEnrollment.find().populate('course');
        console.log(`Found ${enrollments.length} enrollments to reconcile.`);

        let processedCount = 0;

        for (const enrollment of enrollments) {
            const oldProgress = enrollment.progress;
            const oldStatus = enrollment.status;

            // Triggering 'save' will invoke the pre('save') hook in CourseEnrollment.js
            // which contains the NEW day-based progress calculation logic.
            // We mark progress as modified just to be sure, or simply call save.

            // Log details before saving
            console.log(`Processing ${enrollment._id} (${enrollment.course?.title || 'Unknown Course'})...`);

            await enrollment.save();

            if (enrollment.progress !== oldProgress || enrollment.status !== oldStatus) {
                console.log(`   Updated: ${oldProgress}% (${oldStatus}) -> ${enrollment.progress}% (${enrollment.status})`);
            } else {
                console.log(`   No change needed (${enrollment.progress}%).`);
            }

            processedCount++;
        }

        console.log(`\nReconciliation completed. Processed ${processedCount} enrollments.`);

    } catch (error) {
        console.error('Error during reconciliation:', error);
    } finally {
        mongoose.disconnect();
    }
}

reconcileAllProgress();
