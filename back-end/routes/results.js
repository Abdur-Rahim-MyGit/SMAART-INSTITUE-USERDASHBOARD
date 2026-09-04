const express = require('express');
const mongoose = require('mongoose');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const ProctoringSession = require('../models/ProctoringSession');
const SupportTicket = require('../models/SupportTicket');
const { protect } = require('../middleware/auth');
const { signAssessmentToken, verifyAssessmentToken } = require('../middleware/assessmentAuth');
const { shuffleArrayDeterministic, selectQuestionsForUser, selectStratifiedQuestions, selectStratifiedQuestionsForStage } = require('../utils/questionShuffler');
const { notifyAssessmentComplete } = require('../services/notificationService');
const { getStageByCode, STAGE_DISTRIBUTIONS, getDurationMinutes } = require('../config/stage_distributions');
const { scoreResponse, shuffleOptionsForQuestion } = require('../services/mcqScoring');

/**
 * The subset of mcqConfig the exam UI is allowed to know.
 *
 * Marks, negative marking and passing marks are deliberately withheld: they
 * are grading policy, and publishing them lets a candidate reason about which
 * questions are worth guessing on. Only presentation flags go out.
 */
const publicMcqConfig = (assessment) => {
    const c = assessment?.mcqConfig || {};
    return {
        allowBackNavigation: c.allowBackNavigation !== false,
        allowMarkForReview: c.allowMarkForReview !== false,
        multipleCorrect: !!c.multipleCorrect
    };
};

/**
 * Apply this attempt's option order to the outgoing questions, persisting it
 * the first time so every later serve is identical.
 *
 * Persistence is not optional. A stored answer of "B" is meaningless without
 * knowing which option B was for THIS candidate — without the map the attempt
 * cannot be graded or replayed, and a refresh would move the letters under an
 * already-selected answer.
 *
 * Returns the questions with options reordered. Untouched when the assessment
 * does not enable randomizeOptions, so Likert flows are unaffected.
 */
const applyOptionOrder = async (questions, result, assessment) => {
    if (!assessment?.mcqConfig?.randomizeOptions) return questions;
    if (!Array.isArray(questions) || questions.length === 0) return questions;

    const stored = result.optionOrder || new Map();
    let mutated = false;

    const ordered = questions.map((q) => {
        const qId = String(q._id);
        const options = q.options || [];
        if (options.length < 2) return q;

        const savedOrder = stored.get ? stored.get(qId) : stored[qId];

        if (savedOrder && savedOrder.length === options.length) {
            // Replay the persisted order.
            const byValue = new Map(options.map((o) => [String(o.value), o]));
            const replayed = savedOrder.map((v) => byValue.get(String(v))).filter(Boolean);
            if (replayed.length === options.length) return { ...q, options: replayed };
        }

        // First serve for this question — generate and remember.
        const shuffled = shuffleOptionsForQuestion(options, `${result._id}:${qId}`);
        if (stored.set) stored.set(qId, shuffled.map((o) => String(o.value)));
        mutated = true;
        return { ...q, options: shuffled };
    });

    if (mutated) {
        result.optionOrder = stored;
        try {
            await result.save();
        } catch (err) {
            // Never fail the exam over a shuffle bookkeeping error — fall back
            // to the canonical order rather than blocking the candidate.
            console.error('⚠️ Could not persist optionOrder, serving canonical order:', err.message);
            return questions;
        }
    }

    return ordered;
};
const resultController = require('../controllers/resultController');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


console.log("✅ Results Route Loaded with Multi-Stage Support (T1-T4)");

// Apply protection to all result routes
router.use(protect);

// Staff may act on any user; everyone else is scoped to their own id (prevents
// reading another user's results/scores via a guessed userId).
const STAFF_ROLES = ['admin', 'teacher', 'moderator'];
const isStaff = (u) => STAFF_ROLES.includes(u?.role) || (Array.isArray(u?.roles) && u.roles.some((r) => STAFF_ROLES.includes(r)));

// Fisher-Yates shuffle algorithm (non-deterministic - for non-stage assessments)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Helper: Determine band level from percentage
 */
const determineLevel = (pct) => {
    if (pct >= 81) return 'Advanced';
    if (pct >= 61) return 'Strong';
    if (pct >= 41) return 'Progressing';
    if (pct >= 21) return 'Developing';
    return 'Emerging';
};

// Start a new assessment attempt
router.get('/assessment/:assessmentId/start', async (req, res) => {
    try {
        const { assessmentId } = req.params;
        // Robust User ID extraction (handles Mongoose docs, POJOs, and different ID naming conventions)
        const userId = req.user?._id || req.user?.id || (req.user?._doc ? req.user._doc._id : null);

        if (!userId) {
            console.error('❌ User identification failed. req.user keys:', req.user ? Object.keys(req.user) : 'null');
            return res.status(401).json({
                success: false,
                error: 'User ID is required. Please re-login.'
            });
        }

        console.log(`🚀 Starting/Resuming assessment ${assessmentId} for user ${userId}`);

        // Fetch the assessment
        let assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            const db = mongoose.connection.db;
            assessment = await db.collection('skillassessments').findOne({ _id: new mongoose.Types.ObjectId(assessmentId) });
        }

        if (!assessment) {
            console.error(`❌ Assessment ${assessmentId} not found`);
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Create a fast lookup map for questions by ID
        const questionMap = new Map();
        assessment.questions.forEach(q => {
            const qId = q._id || q.questionId;
            if (qId) {
                questionMap.set(qId.toString(), q);
            }
        });

        // --- PROCTORING LOCK CHECK (BYPASSED) ---
        // Access suspension disabled per user directive
        // --- END PROCTORING LOCK CHECK ---

        // Check if user already has an in-progress attempt
        let existingResult = await Result.findOne({
            userId,
            assessmentId,
            completionStatus: 'in-progress'
        });

        // Detect which stage this assessment belongs to
        const stageInfo = getStageByCode(assessment.assessmentCode);
        const stageKey = stageInfo ? stageInfo.stage : null;
        const expectedQuestions = stageInfo ? stageInfo.totalQuestions : assessment.questions.length;

        // Shared with the submit path, so "expired on resume" and "submitted
        // late" can never be measured against different limits.
        const durationMinutes = getDurationMinutes(assessment);

        if (existingResult) {
            const elapsedSeconds = Math.floor((Date.now() - existingResult.startedAt.getTime()) / 1000);
            const remainingSeconds = Math.max(durationMinutes * 60 - elapsedSeconds, 0);

            if (remainingSeconds <= 0) {
                console.log(`⌛ [AUTO-SUBMIT] Resumed attempt ${existingResult._id} has expired (${elapsedSeconds}s elapsed). Auto-submitting and starting fresh...`);
                existingResult.completionStatus = 'completed';
                existingResult.submittedAt = new Date();

                // Grade unanswered questions as UNANSWERED
                const unansweredQuestions = assessment.questions.filter(
                    q => !existingResult.responses.some(r => r.questionId.toString() === q._id.toString())
                );
                unansweredQuestions.forEach(q => {
                    existingResult.responses.push({
                        questionId: q._id,
                        questionText: q.questionText || '',
                        selectedValue: 'UNANSWERED',
                        isCorrect: false,
                        score: 0,
                        answeredAt: new Date()
                    });
                });
                existingResult.updateAnsweredCount();
                await existingResult.save();

                existingResult = null; // Forces creation of a fresh attempt below
            }
        }

        if (existingResult) {
            console.log(`🔄 [DEBUG] Resuming result ${existingResult._id}`);

            let questionOrder = existingResult.questionOrder || [];

            // Failsafe 1: If questionOrder is empty
            if (questionOrder.length === 0) {
                console.log("⚠️ [DEBUG] questionOrder is empty, using assessment logic");
                questionOrder = assessment.questions.map(q => q._id || q.questionId);
            }

            let questions = questionOrder.map(qId => {
                const idStr = qId.toString();
                const question = questionMap.get(idStr);
                if (!question) return null;

                return {
                    _id: question._id || question.questionId,
                    questionText: question.questionText || "Question text missing",
                    type: question.type || "mcq",
                    options: question.options || [],
                    order: question.order || 0
                };
            }).filter(q => q !== null);


            // Failsafe 2: If questions still empty but assessment has them
            if (questions.length === 0 && assessment.questions && assessment.questions.length > 0) {
                console.log("⚠️ [DEBUG] No questions matched order. Falling back to all assessment questions.");
                questions = assessment.questions.map((q, idx) => ({
                    _id: q._id || q.questionId,
                    questionText: q.questionText,
                    type: q.type,
                    options: q.options,
                    order: q.order || idx
                }));

                const validIds = new Set(assessment.questions.map(q => (q._id || q.questionId).toString()));
                const originalResponseCount = existingResult.responses.length;

                existingResult.responses = existingResult.responses.filter(r =>
                    validIds.has(r.questionId.toString())
                );

                if (existingResult.responses.length !== originalResponseCount) {
                    console.log(`🧹 [DEBUG] Cleaned ${originalResponseCount - existingResult.responses.length} orphaned responses`);
                    existingResult.updateAnsweredCount();
                    await existingResult.save();
                }
            }

            // Failsafe 3: If STILL 0, try to re-fetch questions directly from DB
            if (questions.length === 0) {
                console.log("🚨 [DEBUG] CRITICAL: Questions still 0. Re-fetching directly...");
                const freshAssessment = await Assessment.findById(assessment._id).lean();
                if (freshAssessment && freshAssessment.questions) {
                    questions = freshAssessment.questions.map((q, idx) => ({
                        _id: q._id || q.questionId,
                        questionText: q.questionText,
                        type: q.type,
                        options: q.options,
                        order: q.order || idx
                    }));
                }
            }

            // FIX: If resuming a stage assessment with incorrect totalQuestions
            if (stageKey && existingResult.totalQuestions > expectedQuestions) {
                console.log(`⚠️ [FIX] Resumed ${stageKey} session has incorrect totalQuestions (${existingResult.totalQuestions}). Fixing to ${expectedQuestions}.`);
                existingResult.totalQuestions = expectedQuestions;
                await existingResult.save();
            }

            console.log(`📤 [DEBUG] Final question count to send: ${questions.length}`);

            // Calculate remaining seconds for the resumed session
            const elapsedSeconds = Math.floor((Date.now() - existingResult.startedAt.getTime()) / 1000);
            const remainingSeconds = Math.max(durationMinutes * 60 - elapsedSeconds, 0);

            // Sign assessment token for existing result
            const assessmentToken = signAssessmentToken({
                resultId: existingResult._id,
                userId: req.user._id || req.user.id,
                assessmentId
            });

            const orderedQuestions = await applyOptionOrder(questions, existingResult, assessment);

            return res.json({
                success: true,
                message: 'Resuming existing attempt',
                data: {
                    resultId: existingResult._id,
                    questions: orderedQuestions,
                    answeredCount: existingResult.answeredQuestions || 0,
                    responses: existingResult.responses || [],
                    assessmentToken,
                    mcqConfig: publicMcqConfig(assessment),
                    startedAt: existingResult.startedAt,
                    durationMinutes,
                    remainingSeconds
                }
            });
        }

        console.log(`✨ Creating new attempt for assessment ${assessment.assessmentCode}`);

        let shuffledQuestionIds;
        let totalQuestions;

        if (stageKey) {
            // Stage Assessment: Check attempt limits before allowing a new attempt
            const StageResult = require('../models/StageResult');

            // Check if user already passed this stage
            const passedResult = await StageResult.findOne({
                userId,
                stage: stageKey,
                passed: true
            });

            if (passedResult) {
                console.log(`✅ User ${userId} already PASSED ${stageKey}. Blocking new attempt.`);
                return res.status(400).json({
                    success: false,
                    error: `You have already passed the ${stageInfo.name} assessment.`,
                    alreadyPassed: true
                });
            }

            // Check attempt count
            const maxAttempts = stageInfo.maxAttempts || 3;
            const attemptCount = await StageResult.countAttemptsForUserStage(userId, stageKey);

            if (attemptCount >= maxAttempts) {
                console.log(`🔒 User ${userId} exhausted all ${maxAttempts} attempts for ${stageKey}. Must restart course.`);
                return res.status(403).json({
                    success: false,
                    error: `You have used all ${maxAttempts} attempts for the ${stageInfo.name} assessment. You must restart the course to try again.`,
                    locked: true,
                    mustRestartCourse: true,
                    attemptCount,
                    maxAttempts
                });
            }

            console.log(`🎯 ${stageKey} Assessment - Attempt ${attemptCount + 1}/${maxAttempts} for user ${userId}`);
            console.log(`🎯 Using Stratified Sampling with SEQ quotient support`);

            // Fetch previously attempted question IDs for this user (from completed results of this assessment)
            const previousResults = await Result.find({
                userId,
                assessmentId,
                completionStatus: 'completed'
            }).select('questionOrder');

            const previousQuestionIds = [];
            previousResults.forEach(r => {
                if (r.questionOrder) {
                    r.questionOrder.forEach(qId => previousQuestionIds.push(qId));
                }
            });

            console.log(`📊 Excluding ${previousQuestionIds.length} previously used questions for better variety`);

            // Perform stratified selection
            const selectedQuestions = selectStratifiedQuestionsForStage(
                assessment.questions,
                userId,
                stageKey,
                previousQuestionIds
            );

            shuffledQuestionIds = selectedQuestions.map(q => q._id);
            totalQuestions = selectedQuestions.length;

            console.log(`✅ Stratified selection complete for ${stageKey}. Count: ${totalQuestions}`);
            if (totalQuestions !== expectedQuestions) {
                console.warn(`⚠️ Warning: Expected ${expectedQuestions} questions, got ${totalQuestions}. Check Question Bank tagging.`);
            }
        } else {

            // Other assessments: Random shuffle, all questions
            const questionIds = assessment.questions.map(q => q._id || q.questionId);
            shuffledQuestionIds = shuffleArray(questionIds);
            totalQuestions = assessment.questions.length;
        }

        // Create new result document
        const result = new Result({
            userId,
            assessmentId: assessment._id,
            assessmentCode: assessment.assessmentCode || ("SKILL-" + assessment._id.toString().slice(-6).toUpperCase()),
            assessmentName: assessment.assessmentName,
            questionOrder: shuffledQuestionIds,
            totalQuestions: totalQuestions,
            completionStatus: 'in-progress'
        });

        await result.save();

        // Map shuffled IDs to actual question data
        const shuffledQuestions = shuffledQuestionIds.map(qId => {
            const idStr = qId.toString();
            const question = questionMap.get(idStr);
            return {
                _id: question?._id || question?.questionId,
                questionText: question?.questionText,
                type: question?.type,
                options: question?.options,
                order: question?.order || 0
            };
        });

        console.log(`✅ Assessment started successfully with ${shuffledQuestions.length} questions`);

        // Sign assessment token for new result
            const assessmentToken = signAssessmentToken({
                resultId: result._id,
                userId: userId,
                assessmentId: assessment._id
            });

        const orderedQuestions = await applyOptionOrder(shuffledQuestions, result, assessment);

        res.status(201).json({
            success: true,
            message: 'Assessment started successfully',
            data: {
                resultId: result._id,
                questions: orderedQuestions,
                totalQuestions: totalQuestions,
                assessmentToken,
                mcqConfig: publicMcqConfig(assessment),
                startedAt: result.startedAt,
                durationMinutes,
                remainingSeconds: durationMinutes * 60
            }
        });
    } catch (err) {
        console.error('❌ Error starting/resuming assessment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to start assessment',
            message: err.message
        });
    }
});

// Save individual answer (real-time)
router.post('/:resultId/answer', verifyAssessmentToken, async (req, res) => {
    try {
        const { resultId } = req.params;
        const { questionId, selectedValue, questionText } = req.body;

        if (!questionId || !selectedValue) {
            return res.status(400).json({
                success: false,
                error: 'Question ID and selected value are required'
            });
        }

        // Find the result document
        const result = await Result.findById(resultId);

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        if (result.completionStatus === 'completed') {
            return res.status(400).json({
                success: false,
                error: 'Assessment already completed'
            });
        }

        // Fetch assessment to check for correct answers (Real-time grading)
        let assessment = await Assessment.findById(result.assessmentId);
        if (!assessment) {
            const db = require('mongoose').connection.db;
            assessment = await db.collection('skillassessments').findOne({ _id: new mongoose.Types.ObjectId(result.assessmentId) });
        }
        let isCorrect = undefined;
        let score = 0;

        if (assessment) {
            const question = (assessment.questions && typeof assessment.questions.id === 'function')
                ? assessment.questions.id(questionId)
                : (assessment.questions || []).find(q => q._id.toString() === questionId);
            if (question && question.correctAnswer !== undefined) {
                // Was `question.correctAnswer === selectedValue`, a strict
                // compare on a Mixed field: a stored number 2 never equalled
                // the string "2" that arrives over JSON, and a multi-correct
                // array never equalled anything. Both graded silently wrong.
                const graded = scoreResponse({
                    question,
                    selectedValue,
                    config: assessment.mcqConfig || {}
                });
                isCorrect = graded.isCorrect;
                score = graded.score;
            }
        }

        // Check if answer already exists for this question
        const existingAnswerIndex = result.responses.findIndex(
            r => r.questionId.toString() === questionId
        );

        if (existingAnswerIndex !== -1) {
            // Update existing answer
            result.responses[existingAnswerIndex].selectedValue = selectedValue;
            result.responses[existingAnswerIndex].isCorrect = isCorrect;
            result.responses[existingAnswerIndex].score = score;
            result.responses[existingAnswerIndex].answeredAt = new Date();
        } else {
            // Add new answer
            result.responses.push({
                questionId,
                questionText: questionText || '',
                selectedValue,
                isCorrect,
                score,
                answeredAt: new Date()
            });
        }

        // Update answered count
        result.updateAnsweredCount();

        await result.save();

        res.json({
            success: true,
            message: 'Answer saved successfully',
            data: {
                answeredQuestions: result.answeredQuestions,
                totalQuestions: result.totalQuestions,
                progress: Math.round((result.answeredQuestions / result.totalQuestions) * 100)
            }
        });
    } catch (err) {
        console.error('Error saving answer:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to save answer',
            message: err.message
        });
    }
});

// Submit completed assessment
router.post('/:resultId/submit', verifyAssessmentToken, resultController.submitAssessment);

// Get all results for a user
router.get('/user/:userId', async (req, res) => {
    try {
        // Non-staff can only read their own results.
        const userId = isStaff(req.user) ? req.params.userId : String(req.user._id);
        const { status } = req.query;


        let query = { userId };
        if (status) {
            query.completionStatus = status;
        }

        const results = await Result.find(query)
            .select('assessmentName assessmentCode completionStatus submittedAt startedAt scores answeredQuestions totalQuestions')
            .sort({ createdAt: -1 });


        res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (err) {
        console.error('❌ Error fetching user results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch results',
            message: err.message
        });
    }
});

// Get specific result details
router.get('/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const result = await Result.findById(resultId)
            .populate('userId', 'fullName email')
            .populate('assessmentId', 'assessmentName description');

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found'
            });
        }

        // SECURITY: non-staff may only view their own result detail.
        const ownerId = String(result.userId?._id || result.userId || '');
        if (!isStaff(req.user) && ownerId && ownerId !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to view this result'
            });
        }

        // Calculate score on the fly if not explicitly stored
        const calculatedScore = result.responses.reduce((sum, r) => sum + (r.score || 0), 0);
        const maxScore = result.totalQuestions;
        const percentage = maxScore > 0 ? Math.round((calculatedScore / maxScore) * 100) : 0;

        // Clone result to plain object to attach extra fields
        const resultObj = result.toObject();
        resultObj.score = calculatedScore;
        resultObj.totalScore = maxScore;
        resultObj.percentage = percentage;

        res.json({
            success: true,
            data: resultObj
        });
    } catch (err) {
        console.error('Error fetching result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch result',
            message: err.message
        });
    }
});

// Reset assessment (Development Only)
router.post('/:resultId/reset', async (req, res) => {
    try {
        const { resultId } = req.params;
        const userId = req.user._id || req.user.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'User session invalid' });
        }

        const result = await Result.findOne({ _id: resultId, userId });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Result not found or unauthorized'
            });
        }

        // Delete the result to allow a clean restart
        await Result.deleteOne({ _id: resultId });

        console.log(`♻️ Assessment ${resultId} reset for user ${userId}`);

        res.json({
            success: true,
            message: 'Assessment reset successfully. You can now start fresh.'
        });
    } catch (err) {
        console.error('Error resetting assessment:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to reset assessment'
        });
    }
});

module.exports = router;
