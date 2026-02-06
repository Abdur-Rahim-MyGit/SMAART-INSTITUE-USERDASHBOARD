const express = require('express');

const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const { protect } = require('../middleware/auth');
const {
    getUserBadges,
    getUserBadgeStats,
    awardBadge,
    updateBadgeProgress
} = require('../utils/badgeUtils');

const { notifyBadgeEarned } = require('../services/notificationService');
const router = express.Router();

// Apply authentication to all routes
router.use(protect);

/**
 * GET /api/badges
 * Get all available badges
 */
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find({ isActive: true })
            .sort({ displayOrder: 1, tier: -1 });

        res.json({
            success: true,
            count: badges.length,
            data: badges
        });
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badges',
            message: error.message
        });
    }
});

/**
 * GET /api/badges/user/:userId
 * Get all badges for a specific user (earned and available)
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const badges = await getUserBadges(userId);

        res.json({
            success: true,
            count: badges.length,
            data: badges
        });
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user badges',
            message: error.message
        });
    }
});

/**
 * GET /api/badges/user/:userId/stats
 * Get badge statistics for a user
 */
router.get('/user/:userId/stats', async (req, res) => {
    try {
        const { userId } = req.params;

        const stats = await getUserBadgeStats(userId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching badge stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch badge statistics',
            message: error.message
        });
    }
});

/**
 * GET /api/badges/user/:userId/earned
 * Get only earned badges for a user
 */
router.get('/user/:userId/earned', async (req, res) => {
    try {
        const { userId } = req.params;


        const userBadges = await UserBadge.find({ userId, isEarned: true })
            .populate('badgeId')
            .sort({ earnedDate: -1 });

        const badges = userBadges.map(ub => ({
            id: ub.badgeId.badgeId,
            _id: ub.badgeId._id,
            title: ub.badgeId.title,
            description: ub.badgeId.description,
            category: ub.badgeId.category,
            tier: ub.badgeId.tier,
            xp: ub.badgeId.xp,
            icon: ub.badgeId.icon,
            color: ub.badgeId.color,
            earnedDate: ub.earnedDate,
            metadata: ub.metadata,
            percentile: ub.metadata?.percentile
        }));

        res.json({
            success: true,
            count: badges.length,
            data: badges
        });
    } catch (error) {
        console.error('Error fetching earned badges:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch earned badges',
            message: error.message
        });
    }
});

/**
 * POST /api/badges/award
 * Award a badge to a user (Admin/System use)
 */
router.post('/award', async (req, res) => {
    try {
        const { userId, badgeId, metadata } = req.body;

        if (!userId || !badgeId) {
            return res.status(400).json({
                success: false,
                error: 'userId and badgeId are required'
            });
        }

        const result = await awardBadge(userId, badgeId, metadata);


        // Send notification for badge earned
        if (result && result.badge) {
            try {
                await notifyBadgeEarned(userId, {
                    badgeId: result.badge.badgeId || badgeId,
                    title: result.badge.title || 'New Badge',
                    xp: result.badge.xp || 0
                });
            } catch (notifError) {
                console.error('Failed to send badge notification:', notifError);
            }
        }
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error awarding badge:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to award badge',
            message: error.message
        });
    }
});

/**
 * PUT /api/badges/user/:userId/progress
 * Update progress for a badge
 */
router.put('/user/:userId/progress', async (req, res) => {
    try {
        const { userId } = req.params;
        const { badgeId, currentProgress } = req.body;

        if (!badgeId || currentProgress === undefined) {
            return res.status(400).json({
                success: false,
                error: 'badgeId and currentProgress are required'
            });
        }

        const userBadge = await updateBadgeProgress(userId, badgeId, currentProgress);

        res.json({
            success: true,
            data: userBadge
        });
    } catch (error) {
        console.error('Error updating badge progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update badge progress',
            message: error.message
        });
    }
});

/**
 * PUT /api/badges/user/:userId/:badgeId/view
 * Mark a badge as viewed
 */
router.put('/user/:userId/:badgeId/view', async (req, res) => {
    try {
        const { userId, badgeId } = req.params;

        const userBadge = await UserBadge.findOneAndUpdate(
            { userId, badgeId },
            { viewed: true, viewedAt: new Date() },
            { new: true }
        );

        if (!userBadge) {
            return res.status(404).json({
                success: false,
                error: 'Badge not found for user'
            });
        }

        res.json({
            success: true,
            data: userBadge
        });
    } catch (error) {
        console.error('Error marking badge as viewed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark badge as viewed',
            message: error.message
        });
    }
});

/**
 * POST /api/badges/create
 * Create a new badge (Admin only)
 */
router.post('/create', async (req, res) => {
    try {
        const badge = new Badge(req.body);
        await badge.save();

        res.status(201).json({
            success: true,
            message: 'Badge created successfully',
            data: badge
        });
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create badge',
            message: error.message
        });
    }
});

/**
 * PUT /api/badges/:badgeId
 * Update a badge (Admin only)
 */
router.put('/:badgeId', async (req, res) => {
    try {
        const { badgeId } = req.params;

        const badge = await Badge.findByIdAndUpdate(
            badgeId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!badge) {
            return res.status(404).json({
                success: false,
                error: 'Badge not found'
            });
        }

        res.json({
            success: true,
            message: 'Badge updated successfully',
            data: badge
        });
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update badge',
            message: error.message
        });
    }
});

module.exports = router;
