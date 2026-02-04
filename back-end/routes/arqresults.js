const express = require('express');
const ARQResult = require('../models/ARQResult');

const router = express.Router();

// Get ARQ results for a specific user
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📥 Fetching ARQ results for userId:', userId);

        // Find the most recent ARQ result for this user
        const arqResult = await ARQResult.findOne({ userId })
            .sort({ createdAt: -1 })
            .populate('userId', 'fullName email')
            .populate('resultId', 'submittedAt timeTaken');

        if (!arqResult) {
            return res.status(404).json({
                success: false,
                error: 'ARQ results not found for this user'
            });
        }

        console.log('✅ ARQ results found:', arqResult._id);

        res.json({
            success: true,
            data: {
                adaptabilityScore: arqResult.adaptabilityScore,
                resilienceScore: arqResult.resilienceScore,
                compositeScore: arqResult.compositeScore,
                percentileRange: arqResult.percentileRange,
                colorCode: arqResult.colorCode,
                quartile: arqResult.quartile,
                createdAt: arqResult.createdAt,
                submittedAt: arqResult.resultId?.submittedAt
            }
        });
    } catch (err) {
        console.error('❌ Error fetching ARQ results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch ARQ results',
            message: err.message
        });
    }
});

module.exports = router;
