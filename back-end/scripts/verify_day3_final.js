require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('../models/Course');

const verifyDay3 = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected\n');

        const course = await Course.findOne({ courseCode: 'CRS00001' });
        if (!course) {
            console.error('Course CRS00001 not found');
            process.exit(1);
        }

        const module = course.modules[0];
        const day3 = module.days.find(d => d.dayNumber === 3);

        if (!day3) {
            console.error('Day 3 not found');
            process.exit(1);
        }

        console.log('=== DAY 3 VERIFICATION ===\n');
        console.log(`Total Steps: ${day3.steps.length}\n`);

        day3.steps.forEach((step, idx) => {
            console.log(`Step ${step.stepNumber}: ${step.title}`);
            console.log(`  Type: ${step.type}`);
            console.log(`  Required: ${step.isRequired}`);

            if (step.type === 'submission' && step.content?.scenarios) {
                console.log(`  Scenarios: ${step.content.scenarios.length}`);
                step.content.scenarios.forEach(s => {
                    console.log(`    - ${s.title}`);
                });
            }

            if (step.type === 'reflection' && step.content?.questions) {
                console.log(`  Questions: ${step.content.questions.length}`);
            }

            if (step.type === 'flashcard' && step.content?.cards) {
                console.log(`  Flash Cards: ${step.content.cards.length}`);
            }

            console.log('');
        });

        console.log('✅ Day 3 structure verified successfully!');
        mongoose.disconnect();
    } catch (error) {
        console.error('Verification Error:', error);
        mongoose.disconnect();
        process.exit(1);
    }
};

verifyDay3();
