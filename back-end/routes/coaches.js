const express = require('express');
const Coach = require('../models/Coach');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protectOrBypass } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
router.use(generalLimiter);

// SECURITY: require authentication for all coach endpoints (was fully open).
router.use(protectOrBypass);


// Get all coaches with search and filter functionality
router.get('/', async (req, res) => {
    try {
        const { search, status, availability, limit = 50 } = req.query;
        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by availability
        if (availability) {
            query.availability = availability;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { coachId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { specialization: { $regex: search, $options: 'i' } }
            ];
        }

        const coaches = await Coach.find(query)
            .populate('assignedColleges', 'name code')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: coaches.length,
            data: coaches
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coaches',
            message: err.message
        });
    }
});

// Get coach by ID
router.get('/:id', async (req, res) => {
    try {
        const coach = await Coach.findById(req.params.id)
            .populate('assignedColleges', 'name code location');

        if (!coach) {
            return res.status(404).json({
                success: false,
                error: 'Coach not found'
            });
        }

        res.json({
            success: true,
            data: coach
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coach',
            message: err.message
        });
    }
});

// Create new coach (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
    try {
        const coach = new Coach(req.body);
        await coach.save();

        res.status(201).json({
            success: true,
            message: 'Coach created successfully',
            data: coach
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create coach',
            message: err.message
        });
    }
});

// Update coach (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
    try {
        const coach = await Coach.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!coach) {
            return res.status(404).json({
                success: false,
                error: 'Coach not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach updated successfully',
            data: coach
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update coach',
            message: err.message
        });
    }
});

// Delete coach (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
        const coach = await Coach.findByIdAndDelete(req.params.id);

        if (!coach) {
            return res.status(404).json({
                success: false,
                error: 'Coach not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete coach',
            message: err.message
        });
    }
});

module.exports = router;
