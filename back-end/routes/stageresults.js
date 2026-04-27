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
            StageResult.find({ userId }).select('stage createdAt'),
            BaseLineResult.findOne({ userId }).select('createdAt')
        ]);

        const status = {
            T1: { completed: false, completedAt: null },
            T2: { completed: false, completedAt: null },
            T3: { completed: false, completedAt: null },
            T4: { completed: false, completedAt: null }
        };

        // Check T1 from BaseLineResult
        if (baselineResult) {
            status.T1 = { completed: true, completedAt: baselineResult.createdAt };
        }

        // Check all stages from StageResult
        stageResults.forEach(sr => {
            status[sr.stage] = { completed: true, completedAt: sr.createdAt };
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
 * DELETE /api/stageresults/reset/:userId/:stage
 * DEV: Reset stage results for testing
 */
router.delete('/reset/:userId/:stage', async (req, res) => {
    try {
        const { userId, stage } = req.params;
        const stageKey = stage.toUpperCase();

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
