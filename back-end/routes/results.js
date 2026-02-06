const express = require('express');
const Result = require('../models/Result');
const Assessment = require('../models/Assessment');
const { protect } = require('../middleware/auth');
const { shuffleArrayDeterministic, selectQuestionsForUser, selectStratifiedQuestions } = require('../utils/questionShuffler');
const { checkAssessmentBadges } = require('../utils/badgeUtils');
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
