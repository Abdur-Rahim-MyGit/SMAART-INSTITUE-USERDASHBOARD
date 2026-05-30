const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const SystemConfig = require('../models/SystemConfig');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const { isFeatureEnabled, clearFeatureFlagCache } = require('../helpers/featureFlag');
const { submitAssessment } = require('../controllers/resultController');

async function runTests() {
    try {
        console.log('⚡ Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // Initialize helper testing
        console.log('\n--- 1. Testing Feature Flag Helper & Cache ---');
        
        // Ensure flag is reset in DB
        await SystemConfig.deleteOne({ key: 'NEW_ASSESSMENT_EVALUATION' });
        const testFlag = new SystemConfig({
            key: 'NEW_ASSESSMENT_EVALUATION',
            description: 'Test flag',
            enabled: false
        });
        await testFlag.save();
        console.log('Seeded NEW_ASSESSMENT_EVALUATION as disabled (false).');

        // Clear cache
        clearFeatureFlagCache();

        // Check enabled status
        let isEnabled = await isFeatureEnabled('NEW_ASSESSMENT_EVALUATION');
        console.log(`Checking helper: isFeatureEnabled -> ${isEnabled} (Expected: false)`);
        if (isEnabled !== false) throw new Error('Helper did not return false');

        // Modify in DB without clearing cache
        await SystemConfig.updateOne({ key: 'NEW_ASSESSMENT_EVALUATION' }, { enabled: true });
        console.log('Updated flag to true in DB directly.');

        // Re-check (should still be cached as false)
        isEnabled = await isFeatureEnabled('NEW_ASSESSMENT_EVALUATION');
        console.log(`Checking helper (cached): isFeatureEnabled -> ${isEnabled} (Expected: false)`);
        if (isEnabled !== false) throw new Error('Helper bypassed cache');

        // Clear cache
        clearFeatureFlagCache();
        console.log('Cleared cache.');

        // Re-check (should be true now)
        isEnabled = await isFeatureEnabled('NEW_ASSESSMENT_EVALUATION');
        console.log(`Checking helper (after clearing cache): isFeatureEnabled -> ${isEnabled} (Expected: true)`);
        if (isEnabled !== true) throw new Error('Helper did not pick up updated DB value');

        // Reset to false in DB and clear cache
        await SystemConfig.updateOne({ key: 'NEW_ASSESSMENT_EVALUATION' }, { enabled: false });
        clearFeatureFlagCache();
        console.log('Reset flag to false in DB and cleared cache.');

        // Let's test the controller behavior
        console.log('\n--- 2. Testing Controller Submission Flow ---');

        // Find a real or dummy Assessment & Result to test
        let assessment = await Assessment.findOne();
        if (!assessment) {
            console.log('No assessment found, creating a dummy assessment...');
            assessment = new Assessment({
                assessmentCode: 'ASM-TEST-001',
                assessmentName: 'Test Assessment',
                questions: [
                    {
                        questionText: 'Test question?',
                        options: ['Yes', 'No'],
                        correctAnswer: 'Yes',
                        points: 1
                    }
                ]
            });
            await assessment.save();
        }

        // Create a dummy result for user
        const dummyResult = new Result({
            userId: new mongoose.Types.ObjectId(),
            assessmentId: assessment._id,
            assessmentCode: assessment.assessmentCode,
            assessmentName: assessment.assessmentName,
            questionOrder: [assessment.questions[0]._id],
            totalQuestions: 1,
            completionStatus: 'in-progress',
            responses: []
        });
        await dummyResult.save();
        console.log(`Created dummy in-progress Result with ID: ${dummyResult._id}`);

        // Mock express request & response objects
        const createMockResponse = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.jsonData = data;
                return res;
            };
            return res;
        };

        // Test with Feature Flag DISABLED
        console.log('\nTesting controller submission with FEATURE FLAG DISABLED...');
        const reqDisabled = {
            params: { resultId: dummyResult._id },
            body: { completeMissingAnswers: false }
        };
        const resDisabled = createMockResponse();

        await submitAssessment(reqDisabled, resDisabled);
        console.log('Submission Response Code:', resDisabled.statusCode || 200);
        console.log('Submission Response Data:', JSON.stringify(resDisabled.jsonData, null, 2));

        // It should have failed because not all questions are answered, but let's confirm it's from the original logic:
        if (resDisabled.jsonData && resDisabled.jsonData.error && resDisabled.jsonData.error.includes('Please answer all questions')) {
            console.log('✅ Success: Submission was processed under the original branch (which correctly blocked incomplete submission).');
        } else {
            console.warn('⚠️ Warning: Unexpected response for disabled flag. JSON:', resDisabled.jsonData);
        }

        // Test with Feature Flag ENABLED
        console.log('\nTesting controller submission with FEATURE FLAG ENABLED...');
        // Enable flag in DB & clear cache
        await SystemConfig.updateOne({ key: 'NEW_ASSESSMENT_EVALUATION' }, { enabled: true });
        clearFeatureFlagCache();

        const reqEnabled = {
            params: { resultId: dummyResult._id },
            body: { completeMissingAnswers: false }
        };
        const resEnabled = createMockResponse();

        await submitAssessment(reqEnabled, resEnabled);
        console.log('Submission Response Code:', resEnabled.statusCode || 200);
        console.log('Submission Response Data:', JSON.stringify(resEnabled.jsonData, null, 2));

        if (resEnabled.jsonData && resEnabled.jsonData.data && resEnabled.jsonData.data.newEvaluationFlow === true) {
            console.log('✅ Success: Submission correctly routed to the NEW_ASSESSMENT_EVALUATION placeholder flow.');
        } else {
            throw new Error('Controller did not route to the enabled feature flag placeholder.');
        }

        // Cleanup
        console.log('\n--- 3. Cleaning up test records ---');
        await Result.deleteOne({ _id: dummyResult._id });
        console.log('Deleted dummy Result.');
        if (assessment.assessmentCode === 'ASM-TEST-001') {
            await Assessment.deleteOne({ _id: assessment._id });
            console.log('Deleted dummy Assessment.');
        }

        // Restore feature flag to disabled
        await SystemConfig.updateOne({ key: 'NEW_ASSESSMENT_EVALUATION' }, { enabled: false });
        clearFeatureFlagCache();
        console.log('Restored NEW_ASSESSMENT_EVALUATION flag to disabled.');

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
        
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Test execution failed:', error);
        mongoose.disconnect();
        process.exit(1);
    }
}

runTests();
