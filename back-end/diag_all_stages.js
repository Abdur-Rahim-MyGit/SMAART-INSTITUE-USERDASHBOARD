const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const codes = ['ASM00001', 'ASM00002', 'ASM00003', 'ASM00004'];

        for (const code of codes) {
            const assessment = await Assessment.findOne({ assessmentCode: code });
            if (!assessment) {
                console.log(`\n--- ${code} NOT FOUND ---`);
                continue;
            }

            console.log(`\n--- ${code}: ${assessment.assessmentName} ---`);
            console.log(`Total Pool Size: ${assessment.questions.length}`);

            const distribution = {};
            assessment.questions.forEach(q => {
                const qt = (q.quotient || 'MISSING').toUpperCase();
                const diff = (q.difficultyLevel || 'MISSING').toLowerCase();
                const key = `${qt}_${diff}`;
                distribution[key] = (distribution[key] || 0) + 1;
            });
            console.log('Distribution:', JSON.stringify(distribution, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic Error:', err);
        process.exit(1);
    }
};

run();
