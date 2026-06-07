const express = require('express');
const StageResult = require('../models/StageResult');
const BaseLineResult = require('../models/BaseLineResult');
const { protect } = require('../middleware/auth');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Apply auth protection
router.use(protect);

/**
 * GET /api/stageresults/user/:userId
 * Get all stage results for a user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch from both StageResult (new T2-T4) and BaseLineResult (legacy T1)
        const [stageResults, baselineResult] = await Promise.all([
            StageResult.find({ userId }).sort({ stage: 1, createdAt: -1 }),
            BaseLineResult.findOne({ userId }).sort({ createdAt: -1 })
        ]);

        // Build a map of stage -> result
        const resultMap = {};

        // Add T1 from baseline
        if (baselineResult) {
            resultMap.T1 = {
                stage: 'T1',
                stageScore: baselineResult.baselineScore,
                stageBand: baselineResult.stageBand,
                quotientProfile: baselineResult.t1Profile,
                passed: true,
                score: baselineResult.score,
                totalScore: baselineResult.totalScore,
                percentage: baselineResult.percentage,
                totalQuestions: baselineResult.totalScore || 36,
                completedAt: baselineResult.createdAt,
                resultId: baselineResult.resultId,
                assessmentType: 'T1_BASELINE'
            };
        }

        // Add T1 from StageResult if it exists (overrides baseline)
        // Add T2, T3, T4 from StageResult
        stageResults.forEach(sr => {
            // Only keep the latest per stage
            if (!resultMap[sr.stage]) {
                resultMap[sr.stage] = {
                    stage: sr.stage,
                    stageScore: sr.stageScore,
                    stageBand: sr.stageBand,
                    quotientProfile: sr.quotientProfile,
                    passed: sr.passed,
                    score: sr.score,
                    totalScore: sr.totalScore,
                    percentage: sr.percentage,
                    totalQuestions: sr.totalQuestions,
                    completedAt: sr.createdAt,
                    resultId: sr.resultId,
                    assessmentType: sr.assessmentType
                };
            }
        });

        res.json({
            success: true,
            data: resultMap
        });
    } catch (err) {
        console.error('❌ Error fetching stage results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stage results',
            message: err.message
        });
    }
});

/**
 * GET /api/stageresults/user/:userId/stage/:stage
 * Get result for a specific stage (T1, T2, T3, T4)
 */
router.get('/user/:userId/stage/:stage', async (req, res) => {
    try {
        const { userId, stage } = req.params;
        const stageKey = stage.toUpperCase();

        // For T1, also check BaseLineResult for backward compat
        if (stageKey === 'T1') {
            const [stageResult, baselineResult] = await Promise.all([
                StageResult.findOne({ userId, stage: 'T1' }).sort({ createdAt: -1 }),
                BaseLineResult.findOne({ userId }).sort({ createdAt: -1 })
            ]);

            const result = stageResult || baselineResult;

            if (!result) {
                return res.status(404).json({
                    success: false,
                    error: `No ${stageKey} result found for this user`
                });
            }

            // Normalize the response
            const data = stageResult ? {
                stage: 'T1',
                stageScore: stageResult.stageScore,
                stageBand: stageResult.stageBand,
                quotientProfile: stageResult.quotientProfile,
                passed: stageResult.passed,
                completedAt: stageResult.createdAt
            } : {
                stage: 'T1',
                stageScore: baselineResult.baselineScore,
                stageBand: baselineResult.stageBand,
                quotientProfile: baselineResult.t1Profile,
                passed: true,
                completedAt: baselineResult.createdAt
            };

            return res.json({ success: true, data });
        }

        // For T2-T4
        const stageResult = await StageResult.findOne({ userId, stage: stageKey })
            .sort({ createdAt: -1 });

        if (!stageResult) {
            return res.status(404).json({
                success: false,
                error: `No ${stageKey} result found for this user`
            });
        }

        res.json({
            success: true,
            data: {
                stage: stageResult.stage,
                stageScore: stageResult.stageScore,
                stageBand: stageResult.stageBand,
                quotientProfile: stageResult.quotientProfile,
                passed: stageResult.passed,
                attemptNumber: stageResult.attemptNumber || 1,
                completedAt: stageResult.createdAt,
                score: stageResult.score,
                totalScore: stageResult.totalScore,
                percentage: stageResult.percentage,
                totalQuestions: stageResult.totalQuestions
            }
        });
    } catch (err) {
        console.error('❌ Error fetching stage result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stage result',
            message: err.message
        });
    }
});

/**
 * GET /api/stageresults/user/:userId/status
 * Get completion status for all stages
 */
router.get('/user/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;

        const [stageResults, baselineResult] = await Promise.all([
            StageResult.find({ userId }).select('stage passed stageScore createdAt'),
            BaseLineResult.findOne({ userId }).select('createdAt')
        ]);

        const status = {
            T1: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 1 },
            T2: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            T3: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            T4: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            AIQ: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            SQ: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            PIQ: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 }
        };

        // Check T1 from BaseLineResult
        if (baselineResult) {
            status.T1 = { completed: true, completedAt: baselineResult.createdAt, score: 100, attemptCount: 1, locked: false, remainingAttempts: 0 };
        }

        // Group stageResults by stage
        const { getStageConfig } = require('../config/stage_distributions');
        const resultsByStage = {};
        stageResults.forEach(sr => {
            if (!resultsByStage[sr.stage]) {
                resultsByStage[sr.stage] = [];
            }
            resultsByStage[sr.stage].push(sr);
        });

        Object.keys(status).forEach(stageKey => {
            if (stageKey === 'T1') return; // T1 is handled separately

            const results = resultsByStage[stageKey] || [];
            const hasPassed = results.some(r => r.passed);
            const attemptCount = results.length;
            const highestScore = results.reduce((max, r) => Math.max(max, r.stageScore || 0), 0);
            const stageConfig = getStageConfig(stageKey) || { maxAttempts: 3 };
            const locked = !hasPassed && attemptCount >= stageConfig.maxAttempts;
            const passedResult = results.find(r => r.passed);

            status[stageKey] = {
                completed: hasPassed,
                completedAt: passedResult ? passedResult.createdAt : (results[results.length - 1]?.createdAt || null),
                score: passedResult ? passedResult.stageScore : highestScore,
                attemptCount,
                locked,
                remainingAttempts: Math.max(0, stageConfig.maxAttempts - attemptCount)
            };
        });

        res.json({ success: true, data: status });
    } catch (err) {
        console.error('❌ Error fetching stage status:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stage status',
            message: err.message
        });
    }
});

/**
 * GET /api/stageresults/user/:userId/stage/:stage/attempts
 * Get all attempt history for a specific stage (for retry tracking)
 */
router.get('/user/:userId/stage/:stage/attempts', async (req, res) => {
    try {
        const { userId, stage } = req.params;
        const stageKey = stage.toUpperCase();

        const attempts = await StageResult.find({ userId, stage: stageKey })
            .sort({ attemptNumber: 1, createdAt: 1 })
            .select('stage stageScore stageBand passed attemptNumber createdAt timeTaken percentage');

        const hasPassed = attempts.some(a => a.passed);
        const { getStageConfig } = require('../config/stage_distributions');
        const stageConfig = getStageConfig(stageKey);
        const maxAttempts = stageConfig?.maxAttempts || 3;
        const passingPercentage = stageConfig?.passingPercentage || 70;

        res.json({
            success: true,
            data: {
                stage: stageKey,
                attempts,
                attemptCount: attempts.length,
                maxAttempts,
                passingPercentage,
                hasPassed,
                locked: !hasPassed && attempts.length >= maxAttempts,
                remainingAttempts: Math.max(0, maxAttempts - attempts.length)
            }
        });
    } catch (err) {
        console.error('❌ Error fetching stage attempts:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stage attempts',
            message: err.message
        });
    }
});

/**
 * POST /api/stageresults/restart-course
 * Reset/restart the courses for a student's current stage and delete attempt results
 */
router.post('/restart-course', async (req, res) => {
    try {
        const { userId, stage } = req.body;
        const stageKey = stage.toUpperCase();

        const stageCoursesMap = {
            'T2': ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10'],
            'T3': ['S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19'],
            'T4': ['S20', 'S21', 'S22', 'S23', 'S24', 'S25'],
            'AIQ': ['AIQ01', 'AIQ02', 'AIQ03', 'AIQ04', 'AIQ05'],
            'SQ': ['SQ01', 'SQ02', 'SQ03', 'SQ04', 'SQ05'],
            'PIQ': ['PIQ01', 'PIQ02', 'PIQ03', 'PIQ04', 'PIQ05']
        };

        const courseCodes = stageCoursesMap[stageKey];
        if (!courseCodes) {
            return res.status(400).json({
                success: false,
                error: `Stage ${stageKey} does not have courses configured for restart.`
            });
        }

        const Course = require('../models/Course');
        const CourseEnrollment = require('../models/CourseEnrollment');

        // 1. Find course ObjectIds
        const courses = await Course.find({ courseCode: { $in: courseCodes } }).select('_id');
        const courseIds = courses.map(c => c._id);

        // 2. Delete enrollments for these courses for this user
        const deleteRes = await CourseEnrollment.deleteMany({
            student: userId,
            course: { $in: courseIds }
        });

        // 3. Clear StageResult attempts
        const stageResultRes = await StageResult.deleteMany({
            userId,
            stage: stageKey
        });

        res.json({
            success: true,
            message: `Successfully restarted ${stageKey} stage. Deleted ${deleteRes.deletedCount} course enrollments and cleared stage results/attempts.`
        });
    } catch (err) {
        console.error('❌ Error restarting stage course:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to restart stage course',
            message: err.message
        });
    }
});

/**
 * DELETE /api/stageresults/reset/:userId/:stage
 * DEV: Reset stage results for testing
 */
router.delete('/reset/:userId/:stage', async (req, res) => {
    try {
        const { userId, stage } = req.params;
        const stageKey = stage.toUpperCase();

        if (stageKey === 'ALL') {
            const [result, blResult] = await Promise.all([
                StageResult.deleteMany({ userId }),
                BaseLineResult.deleteMany({ userId })
            ]);
            return res.json({
                success: true,
                message: `Deleted all (${result.deletedCount}) stage results and (${blResult.deletedCount}) baseline results for user ${userId}`
            });
        }

        const result = await StageResult.deleteMany({ userId, stage: stageKey });

        // If T1, also clear BaseLineResult
        let baselineDeleted = 0;
        if (stageKey === 'T1') {
            const blResult = await BaseLineResult.deleteMany({ userId });
            baselineDeleted = blResult.deletedCount;
        }

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} stage results${baselineDeleted ? ` and ${baselineDeleted} baseline results` : ''} for user ${userId}, stage ${stageKey}`
        });
    } catch (err) {
        console.error('❌ Error resetting stage results:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
