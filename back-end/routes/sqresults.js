const express = require('express');
const router = express.Router();
const SQResult = require('../models/SQResult');

/**
 * Get SQ results for a specific user (latest result)
 * GET /api/sqresults/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const sqResult = await SQResult.findOne({ userId })
            .sort({ createdAt: -1 })
            .lean();

        if (!sqResult) {
            return res.status(404).json({
                success: false,
                message: 'No SQ results found for this user'
            });
        }

        res.json({
            success: true,
            data: sqResult
        });
    } catch (error) {
        console.error('Error fetching SQ results:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching SQ results',
            error: error.message
        });
    }
});

/**
 * Get all SQ results for a specific user
 * GET /api/sqresults/user/:userId/all
 */
router.get('/user/:userId/all', async (req, res) => {
    try {
        const { userId } = req.params;

        const sqResults = await SQResult.find({ userId })
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            data: sqResults,
            count: sqResults.length
        });
    } catch (error) {
        console.error('Error fetching all SQ results:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching SQ results',
            error: error.message
        });
    }
});

/**
 * Get SQ result by result ID
 * GET /api/sqresults/:resultId
 */
router.get('/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const sqResult = await SQResult.findOne({ resultId }).lean();

        if (!sqResult) {
            return res.status(404).json({
                success: false,
                message: 'SQ result not found'
            });
        }

        res.json({
            success: true,
            data: sqResult
        });
    } catch (error) {
        console.error('Error fetching SQ result:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching SQ result',
            error: error.message
        });
    }
});

module.exports = router;
