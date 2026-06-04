const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

async function check() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smaart-db');
    const courses = await Course.find({});
    console.log(`Found ${courses.length} courses`);
    let flashcardCount = 0;
    
    courses.forEach(c => {
        if (c.modules) {
            c.modules.forEach(m => {
                if (m.days) {
                    m.days.forEach(d => {
                        if (d.steps) {
                            d.steps.forEach(s => {
                                if (s.type === 'flashcard' || s.type === 'flashcards') {
                                    const cards = s.content?.cards || [];
                                    flashcardCount += cards.length;
                                }
                            })
                        }
                    })
                }
            })
        }
    });
    console.log(`Total flashcards found in modules.days.steps: ${flashcardCount}`);
    
    let flowCardsCount = 0;
    courses.forEach(c => {
        if (c.learningFlow) {
            Object.values(c.learningFlow).forEach(step => {
                if (step.activityType === 'flashcard' || step.contentType === 'flashcard' || step.type === 'flashcard') {
                    if (step.cards) flowCardsCount += step.cards.length;
                }
            })
        }
    });
    console.log(`Total flashcards found in learningFlow: ${flowCardsCount}`);
    
    process.exit(0);
}
check();
