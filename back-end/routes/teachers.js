const express = require('express');
const Teacher = require('../models/Teacher');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protectOrBypass } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
router.use(generalLimiter);

// SECURITY: require authentication for all teacher endpoints (was fully open).
router.use(protectOrBypass);


// Get all teachers with search and filter functionality
router.get('/', async (req, res) => {
    try {
        const { search, college, status, limit = 50 } = req.query;
        let query = {};

        // Filter by college
        if (college) {
            query.college = college;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Search functionality
        if (search) {
            const safe = require('../utils/escapeRegex')(search); // SECURITY: ReDoS-safe
            query.$or = [
                { fullName: { $regex: safe, $options: 'i' } },
                { teacherId: { $regex: safe, $options: 'i' } },
                { email: { $regex: safe, $options: 'i' } },
                { employeeId: { $regex: safe, $options: 'i' } }
            ];
        }

        const teachers = await Teacher.find(query)
            .select('-password')
            .populate('college', 'name code')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: teachers.length,
            data: teachers
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch teachers',
            message: err.message
        });
    }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .select('-password')
            .populate('college', 'name code location')
            .populate('assignedStudents', 'fullName studentId email');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch teacher',
            message: err.message
        });
    }
});

// Get teacher by teacherId
router.get('/teacherId/:teacherId', async (req, res) => {
    try {
        const teacher = await Teacher.findOne({
            teacherId: req.params.teacherId.toUpperCase()
        })
            .select('-password')
            .populate('college', 'name code');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            data: teacher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch teacher',
            message: err.message
        });
    }
});

// Create new teacher (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
    try {
        const teacher = new Teacher(req.body);
        await teacher.save();

        // Remove password from response
        const teacherData = teacher.toObject();
        delete teacherData.password;

        res.status(201).json({
            success: true,
            message: 'Teacher created successfully',
            data: teacherData
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create teacher',
            message: err.message
        });
    }
});

// Update teacher (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
    try {
        // Don't allow password update through this route
        delete req.body.password;

        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            message: 'Teacher updated successfully',
            data: teacher
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update teacher',
            message: err.message
        });
    }
});

// Delete teacher (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            message: 'Teacher deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete teacher',
            message: err.message
        });
    }
});

// Get teacher's assigned students
router.get('/:id/students', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .select('assignedStudents fullName teacherId')
            .populate('assignedStudents', 'fullName studentId email rollNumber status');

        if (!teacher) {
            return res.status(404).json({
                success: false,
                error: 'Teacher not found'
            });
        }

        res.json({
            success: true,
            count: teacher.assignedStudents.length,
            data: teacher.assignedStudents
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students',
            message: err.message
        });
    }
});

module.exports = router;
