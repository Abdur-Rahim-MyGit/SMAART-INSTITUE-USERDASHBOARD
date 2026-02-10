require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const inspect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const course = await Course.findOne({ courseCode: 'CRS00001' });

        course.modules.forEach((mod, modIdx) => {
            console.log(`\n\n================ MODULE ${modIdx + 1}: ${mod.title} ================`);
            const day3 = mod.days.find(d => d.dayNumber === 3);
            if (!day3) {
                console.log(`Day 3 not found for Module ${modIdx + 1}`);
                return;
            }
            day3.steps.forEach(step => {
                console.log(`\n--- Step: ${step.title} (${step.type}) ---`);
                if (step.type === 'quiz' || step.type === 'domain_assessment' || step.type === 'reflection') {
                    console.log(`Questions Count: ${step.content?.questions?.length || 0}`);
                    if (step.content?.questions) {
                        step.content.questions.forEach((q, i) => {
                            console.log(`  Q${i + 1}: ${q.question || q.questionText || q.title || 'No Question Text'}`);
                        });
                    }
                } else {
                    console.log(`Content Type: ${step.type}`);
                    // For video/flashcard, just check if URL exists
                    console.log(`URL/File: ${step.content?.videoUrl || step.content?.fileUrl || step.content?.url || 'N/A'}`);
                }
            });
        });
        mongoose.disconnect();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
