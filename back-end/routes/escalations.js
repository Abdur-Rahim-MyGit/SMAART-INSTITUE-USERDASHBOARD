const express = require('express');
const Escalation = require('../models/Escalation');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Get all escalations with filters
router.get('/', async (req, res) => {
    try {
        const { student, college, status, priority, category, assignedTherapist, limit = 50 } = req.query;
        let query = {};

        if (student) query.student = student;
        if (college) query.college = college;
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (category) query.category = category;
        if (assignedTherapist) query.assignedTherapist = assignedTherapist;

        const escalations = await Escalation.find(query)
            .populate('student', 'fullName email studentId')
            .populate('college', 'name code')
            .populate('assignedTherapist', 'name email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: escalations.length,
            data: escalations
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch escalations',
            message: err.message
        });
    }
});

// Get escalation by ID
router.get('/:id', async (req, res) => {
    try {
        const escalation = await Escalation.findById(req.params.id)
            .populate('student', 'fullName email studentId mobile')
            .populate('college', 'name code location')
            .populate('assignedTherapist', 'name email specialization')
            .populate('notes.addedBy', 'fullName email');

        if (!escalation) {
            return res.status(404).json({
                success: false,
                error: 'Escalation not found'
            });
        }

        res.json({
            success: true,
            data: escalation
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch escalation',
            message: err.message
        });
    }
});

// Create new escalation
router.post('/', async (req, res) => {
    try {
        const escalation = new Escalation(req.body);
        await escalation.save();

        res.status(201).json({
            success: true,
            message: 'Escalation created successfully',
            data: escalation
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create escalation',
            message: err.message
        });
    }
});

// Update escalation
router.put('/:id', async (req, res) => {
    try {
        const escalation = await Escalation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!escalation) {
            return res.status(404).json({
                success: false,
                error: 'Escalation not found'
            });
        }

        res.json({
            success: true,
            message: 'Escalation updated successfully',
            data: escalation
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update escalation',
            message: err.message
        });
    }
});

// Delete escalation
router.delete('/:id', async (req, res) => {
    try {
        const escalation = await Escalation.findByIdAndDelete(req.params.id);

        if (!escalation) {
            return res.status(404).json({
                success: false,
                error: 'Escalation not found'
            });
        }

        res.json({
            success: true,
            message: 'Escalation deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete escalation',
            message: err.message
        });
    }
});

module.exports = router;
