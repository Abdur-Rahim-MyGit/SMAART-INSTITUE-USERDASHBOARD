require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const fixDay3Injection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        const module = course.modules[0];

        // 1. Fix the stepId in microAssessments for Day 3
        if (module.microAssessments) {
            const day3Assessment = module.microAssessments.find(ma => ma.dayId === 3);
            if (day3Assessment) {
                console.log(`Updating microAssessment ${day3Assessment.title} stepId from ${day3Assessment.stepId} to 1`);
                day3Assessment.stepId = 1;
            }
        }

        // 2. Ensure Day 3 steps are correctly ordered in DB
        const day3 = module.days.find(d => d.dayNumber === 3);
        if (day3) {
            console.log('Verifying Day 3 steps order...');
            // Assessment should be step 1
            // Evidence Task should be step 2
            // Reflection should be step 3
            // Flashcard should be step 4
            // Trigger should be step 5

            day3.steps.forEach((step, idx) => {
                step.stepNumber = idx + 1;
            });
        }

        course.markModified('modules');
        await course.save();
        console.log('✅ Day 3 injection issues fixed!');

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

fixDay3Injection();
