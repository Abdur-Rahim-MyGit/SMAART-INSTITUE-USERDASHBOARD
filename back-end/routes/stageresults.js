const express = require('express');
const mongoose = require('mongoose');
const StageResult = require('../models/StageResult');
const BaseLineResult = require('../models/BaseLineResult');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const ProctoringSession = require('../models/ProctoringSession');
const ProctoringEvent = require('../models/ProctoringEvent');
const { getStageByCode } = require('../config/stage_distributions');
const { protect } = require('../middleware/auth');
const { computePLVI, totalGrowth } = require('../utils/plvi');
const { countActiveLearningDays } = require('../utils/activeDays');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Apply auth protection
router.use(protect);

// Staff may act on any user; everyone else is scoped to their own id. Prevents
// reading or resetting another user's stage results via a guessed userId.
const STAFF_ROLES = ['admin', 'teacher', 'moderator'];
const isStaff = (u) => STAFF_ROLES.includes(u?.role) || (Array.isArray(u?.roles) && u.roles.some((r) => STAFF_ROLES.includes(r)));
const ownUserId = (req, fromBody = false) => (isStaff(req.user) ? (fromBody ? req.body.userId : req.params.userId) : String(req.user._id));

/**
 * GET /api/stageresults/user/:userId
 * Get all stage results for a user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = ownUserId(req);

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

        // PLVI + growth (Blueprint v1.0) — computed on read against the T1 baseline.
        // Denominator = distinct active LEARNING days (falls back to calendar days).
        const t1 = resultMap.T1;
        if (t1 && t1.stageScore != null) {
            for (const k of ['T2', 'T3', 'T4']) {
                const s = resultMap[k];
                if (!s || s.stageScore == null) continue;
                const activeDays = await countActiveLearningDays(userId, t1.completedAt, s.completedAt);
                const p = computePLVI(t1.stageScore, s.stageScore, t1.completedAt, s.completedAt, activeDays);
                if (p) { s.plvi = p.plvi; s.plviBand = p.band; s.tDays = p.tDays; s.tDaysBasis = p.tDaysBasis; }
                s.growthDelta = totalGrowth(t1.stageScore, s.stageScore);
            }
        }

        // Top-level summary for the passport (Total Growth Δ = T4 − T1, final PLVI band)
        const meta = { totalGrowthDelta: null, finalPlvi: null, finalPlviBand: null };
        if (t1 && resultMap.T4 && resultMap.T4.stageScore != null) {
            meta.totalGrowthDelta = totalGrowth(t1.stageScore, resultMap.T4.stageScore);
            meta.finalPlvi = resultMap.T4.plvi ?? null;
            meta.finalPlviBand = resultMap.T4.plviBand ?? null;
        }

        res.json({
            success: true,
            data: resultMap,
            meta
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
        const { stage } = req.params;
        const userId = ownUserId(req);
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

            // Normalize the response (T1 is a baseline: pass 0, single attempt, no competence tier)
            const data = stageResult ? {
                stage: 'T1',
                stageScore: stageResult.stageScore,
                stageBand: stageResult.stageBand,
                competenceTier: stageResult.competenceTier || 'Baseline',
                quotientProfile: stageResult.quotientProfile,
                passed: stageResult.passed,
                completedAt: stageResult.createdAt,
                passingPercentage: 0,
                maxAttempts: 1,
                remainingAttempts: 0
            } : {
                stage: 'T1',
                stageScore: baselineResult.baselineScore,
                stageBand: baselineResult.stageBand,
                competenceTier: 'Baseline',
                quotientProfile: baselineResult.t1Profile,
                passed: true,
                completedAt: baselineResult.createdAt,
                passingPercentage: 0,
                maxAttempts: 1,
                remainingAttempts: 0
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

        // PLVI + growth vs the T1 baseline (active-learning-days denominator, calendar fallback).
        let plvi = null, plviBand = null, tDays = null, tDaysBasis = null, growthDelta = null;
        const baseline = await BaseLineResult.findOne({ userId }).sort({ createdAt: -1 })
            || await StageResult.findOne({ userId, stage: 'T1' }).sort({ createdAt: -1 });
        if (baseline) {
            const t1Score = baseline.baselineScore != null ? baseline.baselineScore : baseline.stageScore;
            const activeDays = await countActiveLearningDays(userId, baseline.createdAt, stageResult.createdAt);
            const p = computePLVI(t1Score, stageResult.stageScore, baseline.createdAt, stageResult.createdAt, activeDays);
            if (p) { plvi = p.plvi; plviBand = p.band; tDays = p.tDays; tDaysBasis = p.tDaysBasis; }
            growthDelta = totalGrowth(t1Score, stageResult.stageScore);
        }

        // Attempt/threshold parity so a reloaded report matches a fresh submit.
        const { getStageConfig } = require('../config/stage_distributions');
        const cfg = getStageConfig(stageKey) || {};
        const maxAttempts = cfg.maxAttempts || 3;
        const attemptCount = await StageResult.countAttemptsForUserStage(userId, stageKey);

        res.json({
            success: true,
            data: {
                stage: stageResult.stage,
                stageScore: stageResult.stageScore,
                stageBand: stageResult.stageBand,
                competenceTier: stageResult.competenceTier,
                quotientProfile: stageResult.quotientProfile,
                passed: stageResult.passed,
                attemptNumber: stageResult.attemptNumber || 1,
                completedAt: stageResult.createdAt,
                score: stageResult.score,
                totalScore: stageResult.totalScore,
                percentage: stageResult.percentage,
                totalQuestions: stageResult.totalQuestions,
                passingPercentage: cfg.passingPercentage !== undefined ? cfg.passingPercentage : 60,
                maxAttempts,
                remainingAttempts: stageResult.passed ? 0 : Math.max(0, maxAttempts - attemptCount),
                plvi,
                plviBand,
                tDays,
                tDaysBasis,
                growthDelta
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
        const userId = ownUserId(req);

        const [stageResults, baselineResult] = await Promise.all([
            StageResult.find({ userId }).select('stage passed stageScore createdAt'),
            BaseLineResult.findOne({ userId }).select('createdAt')
        ]);

        const status = {
            T1: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 1 },
            T2: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            T3: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 },
            T4: { completed: false, completedAt: null, score: undefined, attemptCount: 0, locked: false, remainingAttempts: 3 }
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
        const { stage } = req.params;
        const userId = ownUserId(req);
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
        const { stage } = req.body;
        const userId = ownUserId(req, true);
        const stageKey = stage.toUpperCase();

        const stageCoursesMap = {
            'T2': ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10'],
            'T3': ['S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19'],
            'T4': ['S20', 'S21', 'S22', 'S23', 'S24', 'S25']
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

        const userIdFilter = mongoose.Types.ObjectId.isValid(userId)
            ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
            : userId;

        // 2. Delete enrollments for these courses for this user
        const deleteRes = await CourseEnrollment.deleteMany({
            student: userIdFilter,
            course: { $in: courseIds }
        });

        // 3. Clear StageResult attempts
        const stageResultRes = await StageResult.deleteMany({
            userId: userIdFilter,
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
 * Remove the raw attempt records behind a stage: the Result documents (which
 * carry attemptNumber and any pending review) and the proctoring sessions and
 * events bound to them.
 *
 * Resetting used to delete only the StageResult / BaseLineResult summaries.
 * The retake budget is counted from the Result attempts, and a held attempt
 * leaves a locked ProctoringSession behind, so after a "successful" reset the
 * very next attempt was numbered as if nothing had been cleared and was held
 * again on submission. From the candidate's side the button did nothing.
 *
 * @param {string} userId
 * @param {string|null} stageKey  'T1'..'T4', or null for every stage
 */
const purgeAttemptRecords = async (userId, stageKey) => {
    const assessments = await Assessment.find({}).select('_id assessmentCode').lean();
    const assessmentIds = assessments
        .filter((a) => {
            const info = getStageByCode(a.assessmentCode);
            if (!info) return false;
            return stageKey ? info.stage === stageKey : true;
        })
        .map((a) => a._id);

    if (assessmentIds.length === 0) {
        return { results: 0, sessions: 0, events: 0 };
    }

    const results = await Result.find({ userId, assessmentId: { $in: assessmentIds } }).select('_id').lean();
    const resultIds = results.map((r) => r._id);

    const sessions = await ProctoringSession.find({
        userId,
        $or: [{ resultId: { $in: resultIds } }, { assessmentId: { $in: assessmentIds } }]
    }).select('_id').lean();
    const sessionIds = sessions.map((s) => s._id);

    const [eventsDel, sessionsDel, resultsDel] = await Promise.all([
        sessionIds.length ? ProctoringEvent.deleteMany({ sessionId: { $in: sessionIds } }) : { deletedCount: 0 },
        sessionIds.length ? ProctoringSession.deleteMany({ _id: { $in: sessionIds } }) : { deletedCount: 0 },
        resultIds.length ? Result.deleteMany({ _id: { $in: resultIds } }) : { deletedCount: 0 }
    ]);

    return { results: resultsDel.deletedCount, sessions: sessionsDel.deletedCount, events: eventsDel.deletedCount };
};

/**
 * DELETE /api/stageresults/reset/:userId/:stage
 * DEV: Reset stage results for testing
 */
router.delete('/reset/:userId/:stage', async (req, res) => {
    try {
        const { stage } = req.params;
        const userId = ownUserId(req);
        const stageKey = stage.toUpperCase();

        if (stageKey === 'ALL') {
            const [result, blResult, purged] = await Promise.all([
                StageResult.deleteMany({ userId }),
                BaseLineResult.deleteMany({ userId }),
                purgeAttemptRecords(userId, null)
            ]);
            console.log(`♻️ Reset ALL for user ${userId}: ${result.deletedCount} stage results, ${blResult.deletedCount} baseline results, ${purged.results} attempts, ${purged.sessions} proctoring sessions, ${purged.events} events`);
            return res.json({
                success: true,
                message: `Deleted all (${result.deletedCount}) stage results, (${blResult.deletedCount}) baseline results and (${purged.results}) attempts for user ${userId}`
            });
        }

        const [result, purged] = await Promise.all([
            StageResult.deleteMany({ userId, stage: stageKey }),
            purgeAttemptRecords(userId, stageKey)
        ]);

        // If T1, also clear BaseLineResult
        let baselineDeleted = 0;
        if (stageKey === 'T1') {
            const blResult = await BaseLineResult.deleteMany({ userId });
            baselineDeleted = blResult.deletedCount;
        }

        console.log(`♻️ Reset ${stageKey} for user ${userId}: ${result.deletedCount} stage results, ${purged.results} attempts, ${purged.sessions} proctoring sessions, ${purged.events} events`);
        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} stage results${baselineDeleted ? ` and ${baselineDeleted} baseline results` : ''} and ${purged.results} attempts for user ${userId}, stage ${stageKey}`
        });
    } catch (err) {
        console.error('❌ Error resetting stage results:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
