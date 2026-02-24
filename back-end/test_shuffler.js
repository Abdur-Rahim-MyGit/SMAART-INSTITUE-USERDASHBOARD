const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { selectStratifiedQuestions } = require('./utils/questionShuffler');

dotenv.config();

const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const assessment = await Assessment.findOne({ assessmentCode: 'ASM00001' });

        if (!assessment) {
            console.error('Assessment ASM00001 not found');
            process.exit(1);
        }

        console.log(`Total Pool Size: ${assessment.questions.length}`);

        // Test with a few different user IDs
        const userIds = ['user123', 'user456', 'user789', '65d123456789012345678901'];

        userIds.forEach(uid => {
            console.log(`\n--- Testing for User: ${uid} ---`);
            const selected = selectStratifiedQuestions(assessment.questions, uid);
            console.log(`Final Selected Count: ${selected.length}`);

            if (selected.length !== 36) {
                console.error(`❌ FAILED: Expected 36, got ${selected.length}`);
            } else {
                console.log(`✅ SUCCESS: Got exactly 36 questions.`);

                // Check quotient distribution
                const qCounts = {};
                selected.forEach(q => {
                    const qt = (q.quotient || 'NONE').toUpperCase();
                    qCounts[qt] = (qCounts[qt] || 0) + 1;
                });
                console.log('Quotient Distribution:', JSON.stringify(qCounts, null, 2));
            }
        });

        process.exit(0);
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
};

run();
