const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { selectStratifiedQuestionsForStage } = require('./utils/questionShuffler');

dotenv.config({ path: path.join(__dirname, '.env') });

const Result = require('./models/Result');
const Assessment = require('./models/Assessment');

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const t2 = await Assessment.findOne({ assessmentCode: 'ASM00002' });
        if (!t2) {
            console.log('T2 Assessment not found');
            process.exit(1);
        }

        const results = await Result.find({
            assessmentId: t2._id,
            completionStatus: 'in-progress',
            totalQuestions: { $lt: 34 }
        });

        console.log(`Found ${results.length} stuck T2 results to fix.`);

        for (const res of results) {
            console.log(`Fixing result ${res._id} for user ${res.userId}...`);

            // Regenerate the question order using the new shuffler logic
            const newQuestions = selectStratifiedQuestionsForStage(t2.questions, res.userId, 'T2');

            if (newQuestions.length === 34) {
                res.questionOrder = newQuestions.map(q => q._id);
                res.totalQuestions = 34;
                await res.save();
                console.log(`✅ Success! Updated ${res._id} to 34 questions.`);
            } else {
                console.log(`❌ Failed: Shuffler only returned ${newQuestions.length} for ${res._id}. Check if DB fix was applied.`);
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
