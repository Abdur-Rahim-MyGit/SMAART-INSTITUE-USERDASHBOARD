const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const { getStageByCode } = require('../config/stage_distributions');
const { notifyAssessmentComplete } = require('../services/notificationService');
const { isFeatureEnabled } = require('../helpers/featureFlag');

const determineLevel = (pct) => {
    if (pct >= 81) return 'Advanced';
    if (pct >= 61) return 'Strong';
    if (pct >= 41) return 'Progressing';
    if (pct >= 21) return 'Developing';
    return 'Emerging';
};

// Blueprint v1.0 competence classification for the OVERALL stage score.
// This is separate from the per-quotient 5-band `determineLevel` above:
//   Pass with Distinction: score >= 75
//   Pass:                   passScore (60) <= score < 75
//   Not Yet Competent:      score < passScore
// T1 is a baseline diagnostic (passScore 0) and has no competence tier.
const competenceTier = (score, passScore = 60, distinctionScore = 75) => {
    if (passScore === 0) return 'Baseline';
    if (distinctionScore && score >= distinctionScore) return 'Distinction';
    if (score >= passScore) return 'Pass';
    return 'Not Yet Competent';
};

/**
 * Submits an assessment result and grades it.
 * Evaluated under the 'NEW_ASSESSMENT_EVALUATION' feature flag check.
 */
const submitAssessment = async (req, res) => {
    try {
        const { resultId } = req.params;
        const {
            submissionReason = 'manual',
            completeMissingAnswers = false
        } = req.body || {};
        // SECURITY (audit CRITICAL): forcePassDev/forceFailDev are grading
        // shortcuts for LOCAL testing only. Force them OFF in production so a
        // student cannot self-grade a 70% pass by sending {forcePassDev:true}
        // in the submit body. Dev behaviour is unchanged.
        const isProd = process.env.NODE_ENV === 'production';
        const forcePassDev = isProd ? false : !!(req.body && req.body.forcePassDev);
        const forceFailDev = isProd ? false : !!(req.body && req.body.forceFailDev);

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

        // Fetch the assessment
        let assessment = await Assessment.findById(result.assessmentId);
        if (!assessment) {
            const db = require('mongoose').connection.db;
            assessment = await db.collection('skillassessments').findOne({ _id: new (require('mongoose').Types.ObjectId)(result.assessmentId) });
        }

        console.log('🔍 Assessment details:', {
            code: assessment?.assessmentCode,
            name: assessment?.assessmentName,
            description: assessment?.description
        });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Check if the new assessment evaluation feature flag is enabled
        const useNewEvaluation = await isFeatureEnabled('NEW_ASSESSMENT_EVALUATION');

        if (useNewEvaluation) {
            console.log(`🚀 [NEW_ASSESSMENT_EVALUATION] Feature flag is ENABLED. Routing to new evaluation placeholder.`);
            
            // =========================================================================
            // PLACEHOLDER FOR NEW EVALUATION LOGIC
            // =========================================================================
            // TODO: Future developers can drop the new evaluation and grading rules here.
            // For now, return a placeholder response.
            return res.json({
                success: true,
                message: 'Assessment evaluated under NEW_ASSESSMENT_EVALUATION flow (placeholder active)',
                data: {
                    resultId: result._id,
                    newEvaluationFlow: true,
                    status: 'pending_logic'
                }
            });
            // =========================================================================
        }

        // =========================================================================
        // EXISTING EVALUATION & GRADING LOGIC (DISABLED BRANCH)
        // =========================================================================
        
        // Detect stage
        const stageInfo = getStageByCode(assessment?.assessmentCode);

        // Fix totalQuestions for stage assessments if mismatched
        if (stageInfo && result.totalQuestions > stageInfo.totalQuestions && result.responses.length >= stageInfo.totalQuestions) {
            console.log(`🔧 [FIX] Correcting ${stageInfo.stage} Assessment totalQuestions from ${result.totalQuestions} to ${stageInfo.totalQuestions} for result ${resultId}`);
            result.totalQuestions = stageInfo.totalQuestions;
        }

        // Legacy T1 fix
        if (result.totalQuestions === 300 && result.responses.length === 36) {
            console.log(`🔧 [FIX] Forced T1 Baseline Correction: 36/300 detected for result ${resultId}`);
            result.totalQuestions = 36;
        }

        if (forcePassDev) {
            console.log(`🔧 [DEV] forcePassDev active. Overwriting responses to achieve 70% correct score.`);
            
            // 1. Ensure responses for all questions in order
            const existingQuestionIds = new Set(
                result.responses.map((response) => response.questionId.toString())
            );
            const missingQuestionIds = (result.questionOrder || []).filter(
                (questionId) => !existingQuestionIds.has(questionId.toString())
            );

            missingQuestionIds.forEach((questionId) => {
                const question = assessment.questions.id(questionId);
                result.responses.push({
                    questionId,
                    questionText: question?.questionText || '',
                    selectedValue: 'A',
                    isCorrect: false,
                    score: 0,
                    answeredAt: new Date()
                });
            });
            result.updateAnsweredCount();

            // 2. Map question ID to correct answer
            const questionDetailsMap = {};
            assessment.questions.forEach(q => {
                questionDetailsMap[q._id.toString()] = q;
            });

            // 3. Set exactly 70% of responses to correct answers
            const total = result.responses.length;
            const targetCorrect = Math.ceil(total * 0.70);

            result.responses.forEach((r, idx) => {
                const qId = r.questionId.toString();
                const question = questionDetailsMap[qId];
                if (!question) return;

                if (idx < targetCorrect) {
                    // Make correct
                    r.selectedValue = question.correctAnswer || 'A';
                    r.isCorrect = true;
                    r.score = question.points || 1;
                } else {
                    // Make incorrect
                    const options = (question.options || []).map(o => o.value);
                    const wrongOption = options.find(val => val !== question.correctAnswer) || 'X';
                    r.selectedValue = wrongOption;
                    r.isCorrect = false;
                    r.score = 0;
                }
            });
        } else if (forceFailDev) {
            console.log(`🔧 [DEV] forceFailDev active. Overwriting responses to achieve 0% score.`);
            
            // 1. Ensure responses for all questions in order
            const existingQuestionIds = new Set(
                result.responses.map((response) => response.questionId.toString())
            );
            const missingQuestionIds = (result.questionOrder || []).filter(
                (questionId) => !existingQuestionIds.has(questionId.toString())
            );

            missingQuestionIds.forEach((questionId) => {
                const question = assessment.questions.id(questionId);
                result.responses.push({
                    questionId,
                    questionText: question?.questionText || '',
                    selectedValue: 'A',
                    isCorrect: false,
                    score: 0,
                    answeredAt: new Date()
                });
            });
            result.updateAnsweredCount();

            // 2. Map question ID to correct answer
            const questionDetailsMap = {};
            assessment.questions.forEach(q => {
                questionDetailsMap[q._id.toString()] = q;
            });

            // 3. Set all responses to incorrect answers
            result.responses.forEach((r) => {
                const qId = r.questionId.toString();
                const question = questionDetailsMap[qId];
                if (!question) return;

                // Make incorrect by choosing something other than correctAnswer
                const options = (question.options || []).map(o => o.value);
                const wrongOption = options.find(val => val !== question.correctAnswer) || 'X';
                r.selectedValue = wrongOption;
                r.isCorrect = false;
                r.score = 0;
            });
        } else if (completeMissingAnswers) {
            const existingQuestionIds = new Set(
                result.responses.map((response) => response.questionId.toString())
            );

            const missingQuestionIds = (result.questionOrder || []).filter(
                (questionId) => !existingQuestionIds.has(questionId.toString())
            );

            if (missingQuestionIds.length > 0) {
                console.log(
                    `🛟 Auto-completing ${missingQuestionIds.length} unanswered questions for ${submissionReason} submission on result ${resultId}`
                );

                missingQuestionIds.forEach((questionId) => {
                    const question = assessment.questions.id(questionId);

                    result.responses.push({
                        questionId,
                        questionText: question?.questionText || '',
                        selectedValue: 'UNANSWERED',
                        isCorrect: false,
                        score: 0,
                        answeredAt: new Date()
                    });
                });

                result.updateAnsweredCount();
            }
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

        // Calculate total score for generic assessments
        const calculatedScore = result.responses.reduce((sum, r) => sum + (r.score || 0), 0);
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

        // Process stage-specific scoring
        if (stageInfo) {

            // Fetch full question details for quotient mapping
            const fullAssessment = await Assessment.findById(result.assessmentId);

            // Map QuestionId -> Question details
            const questionDetailsMap = {};
            fullAssessment.questions.forEach(q => {
                questionDetailsMap[q._id.toString()] = q;
            });

            // Initialize Quotient Buckets
            const quotientScores = {
                'CRQ': { earned: 0, possible: 0 },
                'SRQ': { earned: 0, possible: 0 },
                'LQ': { earned: 0, possible: 0 },
                'SIQ': { earned: 0, possible: 0 },
                'PEQ': { earned: 0, possible: 0 },
                'DAQ': { earned: 0, possible: 0 },
                'SEQ': { earned: 0, possible: 0 }
            };

            const selectedAnswers = [];

            // Aggregate Scores
            result.responses.forEach(r => {
                const qId = r.questionId.toString();
                const question = questionDetailsMap[qId];

                if (!question) return;

                const quotient = (question.quotient || 'CRQ').toUpperCase();

                if (quotientScores[quotient]) {
                    quotientScores[quotient].possible += 1;

                    // Check correctness
                    const isCorrect = question.correctAnswer === r.selectedValue;
                    if (isCorrect) {
                        quotientScores[quotient].earned += 1;
                    }

                    // Update response record
                    r.isCorrect = isCorrect;
                    r.score = isCorrect ? 1 : 0;

                    selectedAnswers.push({
                        questionId: r.questionId,
                        selectedValue: r.selectedValue,
                        isCorrect
                    });
                }
            });

            // Save updated isCorrect flags
            await result.save();

            // Calculate Percentages & Levels
            const finalProfile = {};
            let totalCorrect = 0;
            let totalAnswered = 0;

            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    finalProfile[key] = {
                        rawScore: pct,
                        level: determineLevel(pct),
                        earned: data.earned,
                        possible: data.possible
                    };
                    totalCorrect += data.earned;
                    totalAnswered += data.possible;
                }
            }

            // Calculate Stage Score using the weighted formula
            const stageScore = stageInfo.weightedFormula
                ? stageInfo.weightedFormula(quotientScores)
                : (totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0);

            const stageBand = determineLevel(stageScore);

            // Use stage-specific passing percentage (Blueprint v1.0: pass = 60; defaults to 60)
            const passingPercentage = stageInfo.passingPercentage !== undefined ? stageInfo.passingPercentage : 60;
            const distinctionPercentage = stageInfo.distinctionPercentage !== undefined ? stageInfo.distinctionPercentage : 75;
            // T1 (Baseline) always passes (passingPercentage=0), T2-T4+ require the pass threshold
            const passed = passingPercentage === 0 ? true : stageScore >= passingPercentage;
            // Blueprint v1.0 overall-stage competence tier (Distinction / Pass / Not Yet Competent)
            const tier = competenceTier(stageScore, passingPercentage, distinctionPercentage);

            // Count existing attempts for this user+stage to set attemptNumber
            const StageResult = require('../models/StageResult');
            const existingAttemptCount = await StageResult.countAttemptsForUserStage(result.userId, stageInfo.stage);

            console.log(`✅ ${stageInfo.stage} Profile Calculated:`, finalProfile);
            console.log(`🏆 ${stageInfo.stage} Score: ${stageScore}, Band: ${stageBand}, Passed: ${passed}`);

            // Append to response
            responseData.t1Profile = finalProfile; // Keep backward compat key for frontend
            responseData.quotientProfile = finalProfile;
            responseData.baselineScore = stageScore; // Keep backward compat
            responseData.stageScore = stageScore;
            responseData.stageBand = stageBand;
            responseData.competenceTier = tier;
            responseData.passed = passed;
            responseData.stage = stageInfo.stage;
            responseData.assessmentType = `${stageInfo.stage}_${stageInfo.name.toUpperCase()}`;

            // Set percentage for badge checking
            percentage = stageScore;

            // Save to StageResult collection (always — both pass and fail)
            try {
                const attemptNumber = existingAttemptCount + 1;

                const stageResult = new StageResult({
                    userId: result.userId,
                    resultId: result._id,
                    stage: stageInfo.stage,
                    stageScore,
                    stageBand,
                    competenceTier: tier,
                    passed,
                    attemptNumber,
                    quotientProfile: finalProfile,
                    questionIds: result.questionOrder,
                    selectedAnswers,
                    score: totalCorrect,
                    totalScore: totalAnswered,
                    percentage: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
                    totalQuestions: result.totalQuestions,
                    timeTaken,
                    assessmentCode: assessment.assessmentCode,
                    assessmentType: `${stageInfo.stage}_${stageInfo.name.toUpperCase()}`
                });

                await stageResult.save();
                console.log(`✅ StageResult saved for ${stageInfo.stage} (Attempt #${attemptNumber}, Passed: ${passed}):`, stageResult._id);
                responseData.stageResultId = stageResult._id;
                responseData.attemptNumber = attemptNumber;
                responseData.maxAttempts = stageInfo.maxAttempts || 3;
                responseData.passingPercentage = passingPercentage;

                // Calculate remaining attempts
                if (!passed) {
                    const maxAttempts = stageInfo.maxAttempts || 3;
                    const remainingAttempts = Math.max(0, maxAttempts - attemptNumber);
                    responseData.remainingAttempts = remainingAttempts;
                    responseData.mustRestartCourse = remainingAttempts === 0;
                    console.log(`❌ ${stageInfo.stage} FAILED (Attempt #${attemptNumber}/${maxAttempts}). Score: ${stageScore}%. Remaining: ${remainingAttempts}`);
                }
            } catch (saveError) {
                console.error(`❌ Error saving StageResult for ${stageInfo.stage}:`, saveError);
            }

            // Also save to BaseLineResult for T1 backward compatibility
            if (stageInfo.stage === 'T1') {
                try {
                    const BaseLineResult = require('../models/BaseLineResult');

                    const baselineResult = new BaseLineResult({
                        userId: result.userId,
                        resultId: result._id,
                        baselineScore: stageScore,
                        stageBand,
                        t1Profile: finalProfile,
                        score: totalCorrect,
                        totalScore: totalAnswered,
                        percentage: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
                        assessmentType: 'T1_BASELINE'
                    });

                    await baselineResult.save();
                    console.log('✅ BaseLineResult saved (backward compat):', baselineResult._id);
                    responseData.baselineResultId = baselineResult._id;
                } catch (blError) {
                    console.error('❌ Error saving BaseLineResult:', blError);
                }
            }
        } else {
            // Non-stage assessment - original generic logic
            // Check if this is a Base Line Test (MCQ based) - Legacy
            const isBaseLineTest = assessment && (assessment.assessmentCode === "ASM99999-T1" || assessment.assessmentCode === "ASM00001");
            if (isBaseLineTest) {
                try {
                    const BaseLineResult = require('../models/BaseLineResult');
                    const baselineUtils = require('../utils/baselineUtils');

                    const profileData = baselineUtils.calculateBaseLineProfile(assessment, result);

                    await result.save();

                    const baseLineResult = new BaseLineResult({
                        userId: result.userId,
                        resultId: result._id,
                        ...profileData
                    });

                    await baseLineResult.save();
                    console.log('✅ Refined Base Line Result saved successfully:', baseLineResult._id);

                    Object.assign(responseData, profileData);
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

            // Check if this is a skill assessment (either from skillassessments collection or type === 'skill')
            const isSkillAssessment = assessment && (assessment.assessmentType === 'skill' || !assessment.assessmentCode);
            if (isSkillAssessment) {
                const passMark = 70;
                const passed = percentage >= passMark;
                
                responseData.assessmentType = 'skill';
                responseData.passed = passed;
                responseData.passingPercentage = passMark;
                responseData.skillName = assessment.instructions || assessment.questionCategory;
                
                console.log(`🎯 Skill assessment completed: ${responseData.skillName}. Score: ${percentage}%, Passed: ${passed}`);
            }
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

        return res.json({
            success: true,
            message: 'Assessment submitted successfully',
            data: responseData
        });
    } catch (err) {
        console.error('❌ Error submitting assessment:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to submit assessment',
            message: err.message
        });
    }
};

module.exports = {
    submitAssessment
};
