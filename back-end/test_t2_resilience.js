const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { selectStratifiedQuestionsForStage } = require('./utils/questionShuffler');

dotenv.config({ path: path.join(__dirname, '.env') });

const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const assessment = await Assessment.findOne({ assessmentCode: 'ASM00002' });

        if (!assessment) {
            console.error('Assessment ASM00002 not found');
            process.exit(1);
        }

        console.log(`T2 Assessment: ${assessment.assessmentName}`);
        console.log(`Total Pool Size: ${assessment.questions.length}`);

        const userIds = ['testuser_1', 'testuser_2', '65d123456789012345678901'];

        userIds.forEach(uid => {
            console.log(`\n--- Testing for User: ${uid} ---`);
            const selected = selectStratifiedQuestionsForStage(assessment.questions, uid, 'T2');
            console.log(`Final Selected Count: ${selected.length}`);

            if (selected.length !== 34) {
                console.error(`❌ FAILED: Expected 34, got ${selected.length}`);
            } else {
                console.log(`✅ SUCCESS: Got exactly 34 questions.`);

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
