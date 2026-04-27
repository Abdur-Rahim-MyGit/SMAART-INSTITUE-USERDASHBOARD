const express = require('express');
const CoachSession = require('../models/CoachSession');
const Coach = require('../models/Coach');
const { notifySessionScheduled } = require('../services/notificationService');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Get all coach sessions with filters
router.get('/', async (req, res) => {
    try {
        const { coach, student, college, status, domain, limit = 50 } = req.query;
        let query = {};

        if (coach) query.coach = coach;
        if (student) query.student = student;
        if (college) query.college = college;
        if (status) query.status = status;
        if (domain) query.domain = domain;

        const sessions = await CoachSession.find(query)
            .populate('student', 'fullName email studentId')
            .populate('coach', 'name email coachId')
            .populate('college', 'name code')
            .sort({ requestDate: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: sessions.length,
            data: sessions
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coach sessions',
            message: err.message
        });
    }
});

// Get session by ID
router.get('/:id', async (req, res) => {
    try {
        const session = await CoachSession.findById(req.params.id)
            .populate('student', 'fullName email studentId mobile')
            .populate('coach', 'name email coachId specialization')
            .populate('college', 'name code location');

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Coach session not found'
            });
        }

        res.json({
            success: true,
            data: session
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coach session',
            message: err.message
        });
    }
});

// Create new coach session
router.post('/', async (req, res) => {
    try {
        const session = new CoachSession(req.body);
        await session.save();

        // Send notification for session scheduled
        try {
            const coach = await Coach.findById(session.coach);
            const coachName = coach?.name || 'your coach';
            await notifySessionScheduled(session.student, session, coachName);
            console.log(`🔔 Notification sent for session scheduled with ${coachName}`);
        } catch (notifyError) {
            console.error("⚠️ Error sending session notification:", notifyError);
        }

        res.status(201).json({
            success: true,
            message: 'Coach session created successfully',
            data: session
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create coach session',
            message: err.message
        });
    }
});

// Update coach session
router.put('/:id', async (req, res) => {
    try {
        const session = await CoachSession.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Coach session not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach session updated successfully',
            data: session
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update coach session',
            message: err.message
        });
    }
});

// Delete coach session
router.delete('/:id', async (req, res) => {
    try {
        const session = await CoachSession.findByIdAndDelete(req.params.id);

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Coach session not found'
            });
        }

        res.json({
            success: true,
            message: 'Coach session deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete coach session',
            message: err.message
        });
    }
});

module.exports = router;
