require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const restoreFlashcards = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        const module1 = course.modules[0];
        const day3 = module1.days?.find(d => d.dayNumber === 3);

        if (!day3) {
            console.log('Day 3 not found');
            mongoose.disconnect();
            return;
        }

        const originalCards = [
            {
                front: 'What does the C in CLEAR-5 stand for?',
                back: 'Clarify - Define the problem clearly before proceeding.'
            },
            {
                front: 'What does the L in CLEAR-5 stand for?',
                back: 'Look at Evidence - Gather and analyze relevant data.'
            },
            {
                front: 'What does the E in CLEAR-5 stand for?',
                back: 'Explore Options - Consider multiple solutions.'
            },
            {
                front: 'What does the A in CLEAR-5 stand for?',
                back: 'Assess Consequences - Evaluate the impact of each option.'
            },
            {
                front: 'What does the R in CLEAR-5 stand for?',
                back: 'Respond - Make a reasoned judgment and take action.'
            }
        ];

        const flashcardStep = day3.steps.find(s => s.type === 'flashcard' || s.stepNumber === 5);
        if (flashcardStep) {
            flashcardStep.content.cards = originalCards;
            console.log('✅ Restored the original 5 flashcards to Step 5.');
        } else {
            console.log('❌ Flashcard step not found.');
        }

        course.markModified('modules');
        await course.save();
        console.log('✅ Changes saved to database.');

        mongoose.disconnect();
    } catch (error) {
        console.error(error);
        mongoose.disconnect();
    }
};

restoreFlashcards();
