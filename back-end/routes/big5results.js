const express = require('express');
const Big5Result = require('../models/Big5Result');

const router = express.Router();

// Get Big5 results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📥 Fetching Big5 results for userId:', userId);

        const big5Result = await Big5Result.findOne({ userId })
            .sort({ createdAt: -1 }) // Get most recent result
            .select('scores calculatedAt');

        console.log('📊 Big5 result found:', big5Result ? 'Yes' : 'No');
        if (big5Result) {
            console.log('  Scores:', JSON.stringify(big5Result.scores, null, 2));
        }

        if (!big5Result) {
            return res.status(404).json({
                success: false,
                error: 'No Big Five results found for this user'
            });
        }

        res.json({
            success: true,
            data: big5Result
        });
    } catch (err) {
        console.error('❌ Error fetching Big5 results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Big5 results',
            message: err.message
        });
    }
});

module.exports = router;
