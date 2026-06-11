const express = require('express');
const BaseLineResult = require('../models/BaseLineResult');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
router.use(generalLimiter);

// SECURITY: this router was previously unauthenticated. Require a valid session.
router.use(protect);

// Staff may act on any user; everyone else is scoped to their own id. This blocks
// reading/resetting another user's baseline results while keeping self-service intact.
const STAFF_ROLES = ['admin', 'teacher', 'moderator'];
const isStaff = (u) => STAFF_ROLES.includes(u?.role) || (Array.isArray(u?.roles) && u.roles.some((r) => STAFF_ROLES.includes(r)));
const effectiveUserId = (req) => (isStaff(req.user) ? req.params.userId : String(req.user._id));

// Get BaseLine results for a specific user
router.get('/user/:userId', async (req, res) => {
    try {
        const userId = effectiveUserId(req);

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

// Reset BaseLine results for a user (re-test flow). Non-staff can only reset their own.
router.delete('/reset/:userId', async (req, res) => {
    try {
        const userId = effectiveUserId(req);
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
