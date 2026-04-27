const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Assessment = require('../models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const a = await Assessment.findOne({ assessmentCode: 'ASM00001' });

        if (!a) {
            fs.writeFileSync('diag_result.json', JSON.stringify({ error: 'Assessment not found' }));
            process.exit(0);
        }

        const counts = {};
        const untagged = [];

        a.questions.forEach((q, i) => {
            const qt = (q.quotient || 'MISSING').toUpperCase();
            const diff = (q.difficultyLevel || 'MISSING').toLowerCase();
            const key = `${qt}_${diff}`;
            counts[key] = (counts[key] || 0) + 1;

            if (qt === 'MISSING' || diff === 'MISSING') {
                untagged.push({ index: i, text: q.questionText.substring(0, 50), quotient: q.quotient, difficulty: q.difficultyLevel });
            }
        });

        const result = {
            totalQuestions: a.questions.length,
            counts,
            untagged,
            distribution: {
                'CRQ': { easy: 2, medium: 4, hard: 1 },
                'SRQ': { easy: 2, medium: 3, hard: 1 },
                'LQ': { easy: 2, medium: 3, hard: 1 },
                'SIQ': { easy: 2, medium: 3, hard: 1 },
                'PEQ': { easy: 2, medium: 4, hard: 1 },
                'DAQ': { easy: 1, medium: 1, hard: 2 }
            }
        };

        const outputPath = path.join(__dirname, 'diag_result.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log('Diagnostic finished');
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('diag_result.json', JSON.stringify({ error: err.message, stack: err.stack }));
        process.exit(1);
    }
};

run();
