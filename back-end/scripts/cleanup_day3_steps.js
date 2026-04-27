require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const removeEarlyStepsDay3 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) throw new Error('Course CRS00001 not found');

        const module1 = course.modules[0];
        const day3 = module1.days?.find(d => d.dayNumber === 3);

        if (!day3 || !day3.steps) {
            console.log('Day 3 or steps not found');
            mongoose.disconnect();
            return;
        }

        console.log(`Original steps count: ${day3.steps.length}`);

        // 1. Remove first 3 steps (assuming they are the ones the user refers to as 1, 2, 3)
        // From inspection:
        // 1. Mastering Critical Thinking
        // 2. STEP 2 — Decision Making Foundations
        // 3. STEP 3 — Logical Reasoning
        day3.steps.splice(0, 3);

        console.log(`Remaining steps count: ${day3.steps.length}`);

        // 2. Resequence remaining steps and update titles
        day3.steps.forEach((step, idx) => {
            const newStepNum = idx + 1;
            step.stepNumber = newStepNum;

            // Update titles if they follow the "STEP X" pattern
            if (step.title.startsWith('STEP')) {
                // Handle different patterns: "STEP 4 — ", "STEP 5: ", etc.
                const parts = step.title.split(/[:—]/);
                if (parts.length > 1) {
                    const content = parts.slice(1).join(step.title.includes('—') ? '—' : ':').trim();
                    step.title = `STEP ${newStepNum}: ${content}`;
                } else {
                    // Fallback if split fails
                    step.title = step.title.replace(/STEP \d+/, `STEP ${newStepNum}`);
                }
            } else if (idx === 0) { // Fallback for Micro-Assessment if title was different
                step.title = `STEP 1: MICRO-ASSESSMENT`;
            }

            console.log(`Updated Step ${idx}: ${step.title} (stepNumber: ${step.stepNumber})`);
        });

        // 3. Update microAssessments mapping for Day 3
        if (module1.microAssessments) {
            const ma = module1.microAssessments.find(ma => ma.dayId === 3);
            if (ma) {
                console.log(`Updating microAssessment stepId from ${ma.stepId} to 1`);
                ma.stepId = 1;
                ma.title = day3.steps[0].title;
            }
        }

        await course.save();
        console.log('✅ Day 3 steps cleaned up and resequenced successfully.');

        mongoose.disconnect();
    } catch (error) {
        console.error('Error during cleanup:', error);
        mongoose.disconnect();
    }
};

removeEarlyStepsDay3();
