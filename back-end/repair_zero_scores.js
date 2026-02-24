const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { getStageByCode } = require('./config/stage_distributions');

dotenv.config({ path: path.join(__dirname, '.env') });

const Result = require('./models/Result');
const StageResult = require('./models/StageResult');
const BaseLineResult = require('./models/BaseLineResult');
const Assessment = require('./models/Assessment');

const determineLevel = (pct) => {
    if (pct >= 81) return 'Advanced';
    if (pct >= 61) return 'Strong';
    if (pct >= 41) return 'Progressing';
    if (pct >= 21) return 'Developing';
    return 'Emerging';
};

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('🔍 Searching for 0-score StageResults...');
        const stageResults = await StageResult.find({ stageScore: 0 });

        console.log(`Found ${stageResults.length} results to check.`);

        for (const sr of stageResults) {
            console.log(`Recalculating SR: ${sr._id} for User: ${sr.userId} Stage: ${sr.stage}`);

            const stageInfo = getStageByCode(sr.assessmentCode);
            if (!stageInfo || !stageInfo.weightedFormula) {
                console.log(`Skipping - no formula or config for ${sr.assessmentCode}`);
                continue;
            }

            // The quotient profile already has 'earned' and 'possible'
            // We can just pass it to the formula
            const newScore = stageInfo.weightedFormula(sr.quotientProfile);

            if (newScore > 0) {
                sr.stageScore = newScore;
                sr.stageBand = determineLevel(newScore);
                sr.passed = newScore >= 40;
                await sr.save();
                console.log(`✅ Fixed! New Score: ${newScore}, Band: ${sr.stageBand}`);

                // Also fix BaseLineResult if T1
                if (sr.stage === 'T1') {
                    const bl = await BaseLineResult.findOne({ resultId: sr.resultId });
                    if (bl) {
                        bl.baselineScore = newScore;
                        bl.stageBand = sr.stageBand;
                        await bl.save();
                        console.log('✅ Also fixed BaseLineResult.');
                    }
                }
            } else {
                console.log('⚠️ Recalculated score is still 0. Possible genuine failure or empty responses.');
            }
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

run();
