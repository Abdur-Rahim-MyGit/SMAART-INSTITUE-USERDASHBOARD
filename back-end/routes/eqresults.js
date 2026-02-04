const express = require('express');
const EQResult = require('../models/EQResult');
const { getPercentileDescription } = require('../utils/eqUtils');

const router = express.Router();

// Get EQ results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const eqResult = await EQResult.findOne({ userId })
            .sort({ createdAt: -1 }) // Get most recent result
            .populate('resultId', 'completionStatus submittedAt');

        if (!eqResult) {
            return res.status(404).json({
                success: false,
                error: 'No EQ results found for this user'
            });
        }

        res.json({
            success: true,
            data: {
                normalizedScore: eqResult.normalizedScore,
                percentileRange: eqResult.percentileRange,
                colorCode: eqResult.colorCode,
                description: getPercentileDescription(eqResult.percentileRange),
                submittedAt: eqResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching EQ results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EQ results',
            message: err.message
        });
    }
});

// Get EQ result by result ID
router.get('/result/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const eqResult = await EQResult.findOne({ resultId });

        if (!eqResult) {
            return res.status(404).json({
                success: false,
                error: 'EQ result not found'
            });
        }

        res.json({
            success: true,
            data: {
                normalizedScore: eqResult.normalizedScore,
                percentileRange: eqResult.percentileRange,
                colorCode: eqResult.colorCode,
                description: getPercentileDescription(eqResult.percentileRange),
                submittedAt: eqResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching EQ result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EQ result',
            message: err.message
        });
    }
});

module.exports = router;
