const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Assessment = require('./models/Assessment');
const Result = require('./models/Result');
const BaseLineResult = require('./models/BaseLineResult');
const baselineUtils = require('./utils/baselineUtils');

dotenv.config();

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find all baseline results that are misconfigured (e.g. baselineScore is 0 but score > 0, or totalScore is 300)
        const faultyResults = await BaseLineResult.find({
            $or: [
                { totalScore: 300 },
                { baselineScore: 0, score: { $gt: 0 } }
            ]
        });

        console.log(`🔍 Found ${faultyResults.length} baseline results to fix.`);

        for (const blResult of faultyResults) {
            console.log(`⚙️  Fixing result for user: ${blResult.userId} (ResultID: ${blResult.resultId})`);

            // Get the raw result document to get responses
            const mainResult = await Result.findById(blResult.resultId);
            if (!mainResult) {
                console.warn(`⚠️  Main result not found for ${blResult.resultId}`);
                continue;
            }

            // Get the assessment to get correct answers and quotients
            const assessment = await Assessment.findById(mainResult.assessmentId);
            if (!assessment) {
                console.warn(`⚠️  Assessment not found for ${mainResult.assessmentId}`);
                continue;
            }

            // Recalculate using the new utility
            const profileData = baselineUtils.calculateBaseLineProfile(assessment, mainResult);

            // Save corrected data
            blResult.baselineScore = profileData.baselineScore;
            blResult.stageBand = profileData.stageBand;
            blResult.t1Profile = profileData.t1Profile;
            blResult.score = profileData.score;
            blResult.totalScore = profileData.totalScore;
            blResult.percentage = profileData.percentage;

            await blResult.save();
            console.log(`✅ Fixed result: Score ${blResult.score}/${blResult.totalScore}, Band: ${blResult.stageBand}`);
        }

        console.log('🏁 Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing data:', err);
        process.exit(1);
    }
};

fixData();
