const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Searching for questions with "SEQ" quotient...');
        const assessments = await Assessment.find({ 'questions.quotient': /seq/i });

        console.log(`Found ${assessments.length} assessments with potential "SEQ" typos.`);

        let totalFixed = 0;
        for (const assessment of assessments) {
            let fixedCount = 0;
            assessment.questions.forEach(q => {
                if (q.quotient && q.quotient.toUpperCase() === 'SEQ') {
                    q.quotient = 'SRQ';
                    fixedCount++;
                }
            });

            if (fixedCount > 0) {
                await assessment.save();
                console.log(`✅ Fixed ${fixedCount} questions in assessment: ${assessment.assessmentName} (${assessment.assessmentCode})`);
                totalFixed += fixedCount;
            }
        }

        console.log(`\nMigration complete. Total questions fixed: ${totalFixed}`);
        process.exit(0);
    } catch (err) {
        console.error('Migration Error:', err);
        process.exit(1);
    }
};

run();
