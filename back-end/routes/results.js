const express = require('express');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const ProctoringSession = require('../models/ProctoringSession');
const SupportTicket = require('../models/SupportTicket');
const { protect } = require('../middleware/auth');
const { signAssessmentToken, verifyAssessmentToken } = require('../middleware/assessmentAuth');
const { shuffleArrayDeterministic, selectQuestionsForUser, selectStratifiedQuestions, selectStratifiedQuestionsForStage } = require('../utils/questionShuffler');
const { notifyAssessmentComplete } = require('../services/notificationService');
const { getStageByCode, STAGE_DISTRIBUTIONS } = require('../config/stage_distributions');
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
        const assessment = await Assessment.findById(assessmentId);

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
            questionMap.set(q._id.toString(), q);
        });

        // --- PROCTORING LOCK CHECK ---
        const activeLock = await ProctoringSession.findOne({
            userId,
            assessmentId,
            isLocked: true
        });

        if (activeLock) {
            let isStillLocked = true;
            if (activeLock.activeTicketId) {
                const ticket = await SupportTicket.findById(activeLock.activeTicketId);
                // If ticket is resolved/closed, auto-unlock the assessment
                if (ticket && (ticket.status === 'resolved' || ticket.status === 'closed')) {
                    activeLock.isLocked = false;
                    activeLock.status = 'active';
                    await activeLock.save();
                    isStillLocked = false;
                }
            }
            if (isStillLocked) {
                console.log(`🔒 Assessment ${assessmentId} is locked for user ${userId} due to proctoring violation`);
                return res.status(403).json({
                    success: false,
                    error: 'Your assessment is currently locked due to a proctoring violation. A support ticket has been raised.',
                    locked: true
                });
            }
        }
        // --- END PROCTORING LOCK CHECK ---

        // Check if user already has an in-progress attempt
        const existingResult = await Result.findOne({
            userId,
            assessmentId,
            completionStatus: 'in-progress'
        });

        // Detect which stage this assessment belongs to
        const stageInfo = getStageByCode(assessment.assessmentCode);
        const stageKey = stageInfo ? stageInfo.stage : null;
        const expectedQuestions = stageInfo ? stageInfo.totalQuestions : assessment.questions.length;

        if (existingResult) {
            console.log(`🔄 [DEBUG] Resuming result ${existingResult._id}`);

            let questionOrder = existingResult.questionOrder || [];

            // Failsafe 1: If questionOrder is empty
            if (questionOrder.length === 0) {
                console.log("⚠️ [DEBUG] questionOrder is empty, using assessment logic");
                questionOrder = assessment.questions.map(q => q._id);
            }

            let questions = questionOrder.map(qId => {
                const idStr = qId.toString();
                const question = questionMap.get(idStr);
                if (!question) return null;

                return {
                    _id: question._id,
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
                    _id: q._id,
                    questionText: q.questionText,
                    type: q.type,
                    options: q.options,
                    order: q.order || idx
                }));

                const validIds = new Set(assessment.questions.map(q => q._id.toString()));
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
                        _id: q._id,
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

            // Sign assessment token for existing result
            const assessmentToken = signAssessmentToken({
                resultId: existingResult._id,
                userId: req.user._id || req.user.id,
                assessmentId
            });

            return res.json({
                success: true,
                message: 'Resuming existing attempt',
                data: {
                    resultId: existingResult._id,
                    questions,
                    answeredCount: existingResult.answeredQuestions || 0,
                    responses: existingResult.responses || [],
                    assessmentToken
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
            const questionIds = assessment.questions.map(q => q._id);
            shuffledQuestionIds = shuffleArray(questionIds);
            totalQuestions = assessment.questions.length;
        }

        // Create new result document
        const result = new Result({
            userId,
            assessmentId: assessment._id,
            assessmentCode: assessment.assessmentCode,
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
                _id: question._id,
                questionText: question.questionText,
                type: question.type,
                options: question.options,
                order: question.order || 0
            };
        });

        console.log(`✅ Assessment started successfully with ${shuffledQuestions.length} questions`);

        // Sign assessment token for new result
            const assessmentToken = signAssessmentToken({
                resultId: result._id,
                userId: userId,
                assessmentId: assessment._id
            });

        res.status(201).json({
            success: true,
            message: 'Assessment started successfully',
            data: {
                resultId: result._id,
                questions: shuffledQuestions,
                totalQuestions: totalQuestions,
                assessmentToken
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
        const assessment = await Assessment.findById(result.assessmentId);
        let isCorrect = undefined;
        let score = 0;

        if (assessment) {
            const question = assessment.questions.id(questionId);
            if (question && question.correctAnswer !== undefined) {
                isCorrect = question.correctAnswer === selectedValue;
                score = isCorrect ? (question.points || 1) : 0;
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
