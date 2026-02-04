const express = require('express');
const VAKResult = require('../models/VAKResult');

const router = express.Router();

// Get VAK results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const vakResult = await VAKResult.findOne({ userId })
            .sort({ createdAt: -1 }) // Get most recent result
            .populate('resultId', 'completionStatus submittedAt');

        if (!vakResult) {
            return res.status(404).json({
                success: false,
                error: 'No VAK results found for this user'
            });
        }

        res.json({
            success: true,
            data: {
                learningStyle: vakResult.learningStyle,
                description: vakResult.description,
                scores: vakResult.scores,
                submittedAt: vakResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching VAK results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch VAK results',
            message: err.message
        });
    }
});

// Get VAK result by result ID
router.get('/result/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const vakResult = await VAKResult.findOne({ resultId });

        if (!vakResult) {
            return res.status(404).json({
                success: false,
                error: 'VAK result not found'
            });
        }

        res.json({
            success: true,
            data: {
                learningStyle: vakResult.learningStyle,
                description: vakResult.description,
                scores: vakResult.scores,
                submittedAt: vakResult.createdAt
            }
        });
    } catch (err) {
        console.error('Error fetching VAK result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch VAK result',
            message: err.message
        });
    }
});

module.exports = router;
