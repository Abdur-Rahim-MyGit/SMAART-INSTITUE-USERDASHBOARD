const express = require('express');
const Student = require('../models/Student');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protectOrBypass } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
router.use(generalLimiter);

// SECURITY: require an authenticated session (or trusted admin dashboard).
// Blocks the previously-open anonymous access to all student PII.
router.use(protectOrBypass);

// Get all students with search and filter functionality (staff only)
router.get('/', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const { search, college, status, assignedTeacher, limit = 50 } = req.query;
        let query = {};

        // Filter by college
        if (college) {
            query.college = college;
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by assigned teacher
        if (assignedTeacher) {
            query.assignedTeacher = assignedTeacher;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { studentId: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { rollNumber: { $regex: search, $options: 'i' } }
            ];
        }

        const students = await Student.find(query)
            .select('-password')
            .populate('college', 'collegeName collegeCode')
            .populate('assignedTeacher', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch students',
            message: err.message
        });
    }
});

// Get student by email (for resolving user ID from email in session)
router.get('/by-email/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase().trim();
        // SECURITY: escape regex metacharacters so the email param cannot be used
        // as a ReDoS pattern or to enumerate records via `.*`-style wildcards.
        const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const student = await Student.findOne({
            email: { $regex: new RegExp(`^${escapedEmail}$`, 'i') }
        })
            .select('_id fullName email studentId')
            .lean();

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student by email',
            message: err.message
        });
    }
});

// Get student by ID
router.get('/:id', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('-password')
            .populate('college', 'collegeName collegeCode address')
            .populate('assignedTeacher', 'fullName email')
            .populate('enrolledCourses', 'title courseCode')
            .populate('assessments.assessment', 'assessmentName assessmentCode');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student',
            message: err.message
        });
    }
});

// Get student by studentId
router.get('/studentId/:studentId', async (req, res) => {
    try {
        const student = await Student.findOne({
            studentId: req.params.studentId.toUpperCase()
        })
            .select('-password')
            .populate('college', 'collegeName collegeCode')
            .populate('assignedTeacher', 'fullName email');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student',
            message: err.message
        });
    }
});

// Create new student (staff only)
router.post('/', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        const student = new Student(req.body);
        await student.save();

        // Remove password from response
        const studentData = student.toObject();
        delete studentData.password;

        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: studentData
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create student',
            message: err.message
        });
    }
});

// Update student (staff only)
router.put('/:id', requireRole('admin', 'teacher'), async (req, res) => {
    try {
        // Don't allow password update through this route
        delete req.body.password;

        const student = await Student.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update student',
            message: err.message
        });
    }
});

// Delete student (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete student',
            message: err.message
        });
    }
});

// Get student's enrolled courses
router.get('/:id/courses', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('enrolledCourses fullName studentId')
            .populate('enrolledCourses', 'title courseCode description duration status');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            count: student.enrolledCourses.length,
            data: student.enrolledCourses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch courses',
            message: err.message
        });
    }
});

// Get student's assessments
router.get('/:id/assessments', async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .select('assessments fullName studentId')
            .populate('assessments.assessment', 'assessmentName assessmentCode questionCategory');

        if (!student) {
            return res.status(404).json({
                success: false,
                error: 'Student not found'
            });
        }

        res.json({
            success: true,
            count: student.assessments.length,
            data: student.assessments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessments',
            message: err.message
        });
    }
});

module.exports = router;
