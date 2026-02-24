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

        const assessment = await Assessment.findOne({ assessmentCode: 'ASM00002' });

        if (!assessment) {
            console.error('Assessment ASM00002 not found');
            process.exit(1);
        }

        console.log(`T2 Assessment: ${assessment.assessmentName}`);
        console.log(`Total Questions in Assessment Pool: ${assessment.questions.length}`);

        const distribution = {};
        const missingFields = {
            quotient: 0,
            difficulty: 0
        };

        assessment.questions.forEach(q => {
            const qt = q.quotient || 'MISSING';
            const diff = q.difficultyLevel || 'MISSING';

            if (qt === 'MISSING') missingFields.quotient++;
            if (diff === 'MISSING') missingFields.difficulty++;

            const key = `${qt.toUpperCase()}_${diff.toLowerCase()}`;
            distribution[key] = (distribution[key] || 0) + 1;
        });

        console.log('Actual Question Distribution in T2 Assessment:');
        console.log(JSON.stringify(distribution, null, 2));
        console.log('Missing Fields:', missingFields);

        process.exit(0);
    } catch (err) {
        console.error('Diagnostic Error:', err);
        process.exit(1);
    }
};

run();
