const express = require('express');
const Enrollment = require('../models/Enrollment');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Get all enrollments with search and filter functionality
router.get('/', async (req, res) => {
    try {
        const { student, course, status, limit = 50 } = req.query;
        let query = {};

        // Filter by student
        if (student) {
            query.student = student;
        }

        // Filter by course
        if (course) {
            query.course = course;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        const enrollments = await Enrollment.find(query)
            .populate('student', 'fullName studentId email')
            .populate('course', 'title courseCode duration')
            .sort({ enrollmentDate: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch enrollments',
            message: err.message
        });
    }
});

// Get enrollment by ID
router.get('/:id', async (req, res) => {
    try {
        const enrollment = await Enrollment.findById(req.params.id)
            .populate('student', 'fullName studentId email')
            .populate('course', 'title courseCode description modules');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Enrollment not found'
            });
        }

        res.json({
            success: true,
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch enrollment',
            message: err.message
        });
    }
});

// Create new enrollment
router.post('/', async (req, res) => {
    try {
        const enrollment = new Enrollment(req.body);
        await enrollment.save();

        res.status(201).json({
            success: true,
            message: 'Enrollment created successfully',
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create enrollment',
            message: err.message
        });
    }
});

// Update enrollment
router.put('/:id', async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Enrollment not found'
            });
        }

        // Recalculate progress if needed
        if (req.body.progress) {
            await enrollment.calculateProgress();
        }

        res.json({
            success: true,
            message: 'Enrollment updated successfully',
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update enrollment',
            message: err.message
        });
    }
});

// Delete enrollment
router.delete('/:id', async (req, res) => {
    try {
        const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Enrollment not found'
            });
        }

        res.json({
            success: true,
            message: 'Enrollment deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete enrollment',
            message: err.message
        });
    }
});

module.exports = router;
