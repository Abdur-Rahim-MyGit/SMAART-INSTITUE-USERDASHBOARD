const express = require('express');
const mongoose = require('mongoose');
const BaseLineResult = require('../models/BaseLineResult');

const router = express.Router();

// Get BaseLine results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Validation for MongoDB ObjectId to prevent 500 errors on invalid IDs
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid User ID format'
            });
        }

        const baseLineResult = await BaseLineResult.findOne({ userId })
            .sort({ createdAt: -1 }); // Get most recent result

        if (!baseLineResult) {
            return res.status(404).json({
                success: false,
                error: 'No Base Line results found for this user'
            });
        }

        res.json({
            success: true,
            data: baseLineResult
        });
    } catch (err) {
        console.error('❌ Error fetching BaseLine results:', err);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Base Line results',
            message: err.message
        });
    }
});

// DEV: Reset BaseLine results for a user (for testing re-test flow)
router.delete('/reset/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, error: 'Invalid User ID format' });
        }

        const result = await BaseLineResult.deleteMany({ userId });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} baseline results for user ${userId}`
        });
    } catch (err) {
        console.error('❌ Error resetting BaseLine results:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
