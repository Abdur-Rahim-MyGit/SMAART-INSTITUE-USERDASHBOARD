const express = require('express');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/auth');
const { shuffleArrayDeterministic, selectQuestionsForUser, selectStratifiedQuestions } = require('../utils/questionShuffler');
const { checkAssessmentBadges } = require('../utils/badgeUtils');
const { notifyAssessmentComplete } = require('../services/notificationService');

const router = express.Router();

console.log("✅ Results Route Loaded with T1 Fixes (V2)");

// Apply protection to all result routes
router.use(protect);

// Fisher-Yates shuffle algorithm (non-deterministic - for non-T1 assessments)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Start a new assessment attempt
router.get('/assessment/:assessmentId/start', async (req, res) => {
    try {
        const { assessmentId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
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

        // Check if user already has an in-progress attempt
        const existingResult = await Result.findOne({
            userId,
            assessmentId,
            completionStatus: 'in-progress'
        });

        if (existingResult) {
            console.log(`🔄 [DEBUG] Resuming result ${existingResult._id}`);
            console.log(`📊 [DEBUG] Assessment ID: ${assessmentId}, Name: ${assessment.assessmentName}, Qs in Assm: ${assessment.questions ? assessment.questions.length : 'NULL'}`);

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

            console.log(`📊 [DEBUG] Validated questions count: ${questions.length}`);

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

                // CLEANUP: If we are rescuing the session, we should also clean the responses
                // otherwise old/dead IDs from previous broken sessions will stick around
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

            // Failsafe 3: If STILL 0, try to re-fetch questions directly from DB for sanity
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

            // FIX: If resuming a T1 assessment that was created with full question set (300) instead of 36
            const isT1Resume = assessment.assessmentCode === 'ASM00001' ||
                (assessment.assessmentName && assessment.assessmentName.toLowerCase().includes('baseline'));

            if (isT1Resume && existingResult.totalQuestions > 36) {
                console.log(`⚠️ [FIX] Resumed T1 session has incorrect totalQuestions (${existingResult.totalQuestions}). Fixing to 36.`);
                existingResult.totalQuestions = 36;
                // If the user has more than 36 questions in questionOrder, strictly speaking we should probably trim them 
                // but usually the frontend slices them anyway. The critical part is totalQuestions for validation.
                await existingResult.save();
            }

            console.log(`📤 [DEBUG] Final question count to send: ${questions.length}`);

            return res.json({
                success: true,
                message: 'Resuming existing attempt',
                data: {
                    resultId: existingResult._id,
                    questions,
                    answeredCount: existingResult.answeredQuestions || 0,
                    responses: existingResult.responses || []
                }
            });
        }

        console.log(`✨ Creating new attempt for assessment ${assessment.assessmentCode}`);

        // Check if this is T1 Baseline Assessment
        const isT1Assessment = assessment.assessmentCode === 'ASM00001' ||
            assessment.questionCategory === 'T1' ||
            assessment.assessmentName?.toLowerCase().includes('baseline');

        let questionIds;
        let shuffledQuestionIds;
        let totalQuestions;

        if (isT1Assessment) {
            // T1 Assessment: Stratified Sampling (36 questions)
            console.log(`🎯 T1 Assessment detected - Using Stratified Sampling for user ${userId}`);

            // Perform stratified selection using the full question objects
            // This ensures we get the exact 7/6/6/6/7/4 distribution across difficulties
            const selectedQuestions = selectStratifiedQuestions(assessment.questions, userId);

            // Extract IDs for the result record
            shuffledQuestionIds = selectedQuestions.map(q => q._id);
            totalQuestions = selectedQuestions.length;

            console.log(`✅ Stratified selection complete. Count: ${totalQuestions}`);
            if (totalQuestions !== 36) {
                console.warn(`⚠️ Warning: Expected 36 questions, got ${totalQuestions}. Check Question Bank tagging.`);
            }
        } else {
            // Other assessments: Random shuffle, all questions
            questionIds = assessment.questions.map(q => q._id);
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

        // Map shuffled IDs to actual question data (O(1) lookup)
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

        res.status(201).json({
            success: true,
            message: 'Assessment started successfully',
            data: {
                resultId: result._id,
                questions: shuffledQuestions,
                totalQuestions: assessment.questions.length
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
router.post('/:resultId/answer', async (req, res) => {
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
router.post('/:resultId/submit', async (req, res) => {
    try {
        const { resultId } = req.params;

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

        // T1 Baseline Assessment Specific Fix (Migration/Legacy Support)
        // If we are strictly at 36 answers and expected 300, it's definitely the T1 Baseline configuration issue.
        if (result.totalQuestions === 300 && result.responses.length === 36) {
            console.log(`🔧 [FIX] Forced T1 Baseline Correction: 36/300 detected for result ${resultId}`);
            result.totalQuestions = 36;
        }

        // Fallback for other mismatches if identified as T1 Baseline
        const isT1Assessment = result.assessmentCode === 'ASM00001' ||
            (result.assessmentName && result.assessmentName.toLowerCase().includes('baseline'));

        if (isT1Assessment && result.totalQuestions > 36 && result.responses.length >= 36) {
            console.log(`🔧 [FIX] Correcting T1 Assessment totalQuestions from ${result.totalQuestions} to 36 for result ${resultId}`);
            result.totalQuestions = 36;
        }

        // Validate all questions answered
        if (result.responses.length < result.totalQuestions) {
            console.warn(`❌ Submission Blocked: ${result.responses.length}/${result.totalQuestions} answered. ResultID: ${resultId}`);
            return res.status(400).json({
                success: false,
                error: `Please answer all questions. ${result.responses.length}/${result.totalQuestions} answered.`
            });
        }

        // Calculate time taken
        const timeTaken = Math.floor((Date.now() - result.startedAt.getTime()) / 1000);

        // Update result
        result.completionStatus = 'completed';
        result.submittedAt = new Date();
        result.timeTaken = timeTaken;

        await result.save();

        // Check if this is a Big Five assessment
        const assessment = await Assessment.findById(result.assessmentId);
        console.log('🔍 Assessment details:', {
            code: assessment?.assessmentCode,
            name: assessment?.assessmentName,
            description: assessment?.description
        });

        // Big Five logic disabled for now as ASM00001 is used for Base Line Test - T1
        const isBig5 = false; // assessment && assessment.assessmentCode === "ASM00001";


        // Calculate total score for generic assessments
        const calculatedScore = result.responses.reduce((sum, r) => sum + (r.score || 0), 0);
        // Default max score is totalQuestions * 1 (assuming 1 point per question)
        const maxScore = result.totalQuestions;
        let percentage = maxScore > 0 ? Math.round((calculatedScore / maxScore) * 100) : 0;

        let responseData = {
            resultId: result._id,
            timeTaken,
            answeredQuestions: result.answeredQuestions,
            totalQuestions: result.totalQuestions,
            score: calculatedScore,
            totalScore: maxScore,
            percentage: percentage
        };

        // Check if this is T1 Assessment
        const isT1Baseline = assessment.assessmentCode === 'ASM00001' ||
            assessment.questionCategory === 'T1' ||
            assessment.assessmentName?.toLowerCase().includes('baseline');

        if (isT1Baseline) {
            console.log('📊 Calculating T1 Baseline and Quotient Scores...');

            // Fetch full question details for quotient mapping
            // Start by fetching the original assessment to get quotient tags
            const fullAssessment = await Assessment.findById(result.assessmentId);

            // Map QuestionId -> Quotient
            const questionQuotientMap = {};
            fullAssessment.questions.forEach(q => {
                if (q.quotient) {
                    questionQuotientMap[q._id.toString()] = q.quotient.toUpperCase();
                }
            });

            // Initialize Quotient Buckets
            const quotientScores = {
                'CRQ': { earned: 0, total: 0 },
                'SRQ': { earned: 0, total: 0 },
                'LQ': { earned: 0, total: 0 },
                'SIQ': { earned: 0, total: 0 },
                'PEQ': { earned: 0, total: 0 },
                'DAQ': { earned: 0, total: 0 }
            };

            // Aggregate Scores
            result.responses.forEach(r => {
                const qId = r.questionId.toString();
                const quotient = questionQuotientMap[qId];

                if (quotient && quotientScores[quotient]) {
                    quotientScores[quotient].total += 1; // max score per question is 1
                    quotientScores[quotient].earned += (r.score || 0);
                }
            });

            // Calculate Percentages & Levels
            const finalProfile = {};
            let totalPercentageSum = 0;
            let quotientCount = 0;

            const determineLevel = (pct) => {
                if (pct >= 81) return 'Advanced';
                if (pct >= 61) return 'Strong';
                if (pct >= 41) return 'Progressing';
                if (pct >= 21) return 'Developing';
                return 'Emerging';
            };

            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.total > 0) {
                    const pct = Math.round((data.earned / data.total) * 100);
                    finalProfile[key] = {
                        rawScore: pct,
                        level: determineLevel(pct),
                        earned: data.earned,
                        possible: data.total
                    };
                    totalPercentageSum += pct;
                    quotientCount++;
                }
            }

            // Calculate Baseline Score (Simple Average of Quotients)
            // This prevents questions from larger buckets dominating the score
            const baselineScore = quotientCount > 0 ? Math.round(totalPercentageSum / quotientCount) : 0;

            console.log('✅ T1 Profile Calculated:', finalProfile);
            console.log('🏆 Baseline Score:', baselineScore);

            // Append to response
            responseData.t1Profile = finalProfile;
            responseData.baselineScore = baselineScore;
            responseData.stageBand = determineLevel(baselineScore);
            responseData.assessmentType = 'T1_BASELINE';

            // Set percentage for badge checking
            percentage = baselineScore;

            // Save T1 results to BaseLineResult collection
            try {
                const BaseLineResult = require('../models/BaseLineResult');

                const baselineResult = new BaseLineResult({
                    userId: result.userId,
                    resultId: result._id,
                    baselineScore: baselineScore,
                    stageBand: determineLevel(baselineScore),
                    t1Profile: finalProfile,
                    score: calculatedScore,
                    totalScore: maxScore,
                    percentage: percentage,
                    assessmentType: 'T1_BASELINE'
                });

                await baselineResult.save();
                console.log('✅ BaseLineResult saved to database:', baselineResult._id);

                responseData.baselineResultId = baselineResult._id;
            } catch (saveError) {
                console.error('❌ Error saving BaseLineResult:', saveError);
                // Don't fail the entire request if saving fails, just log it
            }
        }



        // Check if this is a Base Line Test (MCQ based)
        const isBaseLineTest = assessment && (assessment.assessmentCode === "ASM99999-T1" || assessment.assessmentCode === "ASM00001");
        if (isBaseLineTest) {
            try {
                const BaseLineResult = require('../models/BaseLineResult');
                const baselineUtils = require('../utils/baselineUtils');

                console.log('📊 Calculating refined Base Line scores...');
                const profileData = baselineUtils.calculateBaseLineProfile(assessment, result);

                // Explicitly save the main result document to persist updated response.isCorrect
                await result.save();

                const baseLineResult = new BaseLineResult({
                    userId: result.userId,
                    resultId: result._id,
                    ...profileData
                });

                await baseLineResult.save();
                console.log('✅ Refined Base Line Result saved successfully:', baseLineResult._id);

                // Add all calculated fields to responseData
                Object.assign(responseData, profileData);

                // Set percentage for badge checking
                percentage = profileData.baselineScore || 0;
            } catch (blError) {
                console.error('Error calculating Base Line scores:', blError);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to calculate Base Line scores',
                    message: blError.message
                });
            }
        }


        // Check for Assessment Badges
        try {
            const badgesEarned = await checkAssessmentBadges(
                result.userId,
                result.assessmentCode || assessment?.assessmentCode,
                percentage
            );

            if (badgesEarned && badgesEarned.length > 0) {
                console.log(`🏆 Awarded ${badgesEarned.length} badges for assessment ${result.assessmentId}`);
                responseData.badgesEarned = badgesEarned;
            }
        } catch (badgeError) {
            console.error("⚠️ Error checking assessment badges:", badgeError);
        }

        // Send notification for assessment completion
        try {
            await notifyAssessmentComplete(
                result.userId,
                assessment?.assessmentName || 'Assessment',
                percentage
            );
            console.log(`🔔 Notification sent for assessment completion: ${assessment?.assessmentName}`);
        } catch (notifyError) {
            console.error("⚠️ Error sending assessment notification:", notifyError);
        }

        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            data: responseData
        });
    } catch (err) {
        console.error('❌ Error submitting assessment:', err);
        console.error('❌ Error message:', err.message);
        console.error('❌ Error stack:', err.stack);
        res.status(500).json({
            success: false,
            error: 'Failed to submit assessment',
            message: err.message
        });
    }
});

// Get all results for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.query;

        console.log('📥 Fetching results for userId:', userId, 'status:', status);

        let query = { userId };
        if (status) {
            query.completionStatus = status;
        }

        const results = await Result.find(query)
            .select('assessmentName assessmentCode completionStatus submittedAt startedAt scores answeredQuestions totalQuestions')
            .sort({ createdAt: -1 });

        console.log('📊 Found', results.length, 'results for user:', userId);

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

module.exports = router;
