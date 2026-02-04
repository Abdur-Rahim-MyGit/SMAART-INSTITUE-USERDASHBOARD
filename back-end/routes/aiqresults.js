const express = require('express');
const AIQResult = require('../models/AIQResult');

const router = express.Router();

// Get AIQ results for a specific user (latest result)
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📥 Fetching AIQ results for userId:', userId);

        const aiqResult = await AIQResult.findOne({ userId })
            .sort({ createdAt: -1 })
            .populate('resultId', 'submittedAt completionStatus');

        if (!aiqResult) {
            return res.status(404).json({
                success: false,
                error: 'No AIQ results found for this user'
            });
        }

        console.log('✅ Found AIQ result:', aiqResult._id);

        res.json({
            success: true,
            data: aiqResult
        });
    } catch (err) {
        console.error('❌ Error fetching AIQ results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AIQ results',
            message: err.message
        });
    }
});

// Get all AIQ results for a user
router.get('/user/:userId/all', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📥 Fetching all AIQ results for userId:', userId);

        const aiqResults = await AIQResult.find({ userId })
            .sort({ createdAt: -1 })
            .populate('resultId', 'submittedAt completionStatus');

        console.log(`✅ Found ${aiqResults.length} AIQ results`);

        res.json({
            success: true,
            count: aiqResults.length,
            data: aiqResults
        });
    } catch (err) {
        console.error('❌ Error fetching AIQ results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AIQ results',
            message: err.message
        });
    }
});

// Get specific AIQ result by ID
router.get('/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const aiqResult = await AIQResult.findOne({ resultId })
            .populate('userId', 'fullName email')
            .populate('resultId', 'submittedAt completionStatus');

        if (!aiqResult) {
            return res.status(404).json({
                success: false,
                error: 'AIQ result not found'
            });
        }

        res.json({
            success: true,
            data: aiqResult
        });
    } catch (err) {
        console.error('Error fetching AIQ result:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch AIQ result',
            message: err.message
        });
    }
});

module.exports = router;
