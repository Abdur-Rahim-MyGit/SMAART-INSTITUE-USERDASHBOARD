const express = require('express');
const CQResult = require('../models/CQResult');
const { getPercentileDescription } = require('../utils/cqUtils');

const router = express.Router();

// Get CQ results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const cqResult = await CQResult.findOne({ userId })
            .sort({ createdAt: -1 }) // Get most recent result
            .populate('resultId', 'completionStatus submittedAt');

        if (!cqResult) {
            return res.status(404).json({
                success: false,
                error: 'No CQ results found for this user'
            });
        }

        res.json({
            success: true,
            data: {
                opennessScore: cqResult.opennessScore,
                creativityScore: cqResult.creativityScore,
                compositeScore: cqResult.compositeScore,
                percentileRange: cqResult.percentileRange,
                colorCode: cqResult.colorCode,
                quartile: cqResult.quartile,
                description: getPercentileDescription(cqResult.percentileRange),
                submittedAt: cqResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching CQ results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CQ results',
            message: err.message
        });
    }
});

// Get CQ result by result ID
router.get('/result/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const cqResult = await CQResult.findOne({ resultId });

        if (!cqResult) {
            return res.status(404).json({
                success: false,
                error: 'CQ result not found'
            });
        }

        res.json({
            success: true,
            data: {
                opennessScore: cqResult.opennessScore,
                creativityScore: cqResult.creativityScore,
                compositeScore: cqResult.compositeScore,
                percentileRange: cqResult.percentileRange,
                colorCode: cqResult.colorCode,
                quartile: cqResult.quartile,
                description: getPercentileDescription(cqResult.percentileRange),
                submittedAt: cqResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching CQ result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch CQ result',
            message: err.message
        });
    }
});

module.exports = router;
