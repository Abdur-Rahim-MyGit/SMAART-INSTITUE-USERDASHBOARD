const express = require('express');
const Student = require('../models/Student');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
router.use(generalLimiter);

// NOTE: the `registrations` collection was merged into `students`. These
// endpoints now read the self-service intake from the embedded
// `registration` sub-object on the student document.

// Get unique institutions from students' registration data
router.get('/institutions', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    let pipeline = [
      {
        $match: {
          'registration.institution': { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$registration.institution",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: "$_id",
          studentCount: "$count",
          _id: 0
        }
      },
      {
        $sort: { name: 1 }
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline[0].$match['registration.institution'] = {
        $regex: require('../utils/escapeRegex')(search), // SECURITY: ReDoS-safe
        $options: 'i'
      };
    }

    // Add limit
    pipeline.push({ $limit: parseInt(limit) });

    const institutions = await Student.aggregate(pipeline);

    res.json({
      success: true,
      count: institutions.length,
      data: institutions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch institutions',
      message: err.message
    });
  }
});

// Get all registrations (students that have completed self-registration)
// SECURITY: staff-only. (/institutions above stays public for the signup selector.)
router.get('/', protect, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const filter = { $or: [{ isRegistered: true }, { registration: { $exists: true, $ne: null } }] };

    const students = await Student.find(filter)
      .select('fullName email studentId profileStatus registration.institution createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const data = students.map(s => ({
      _id: s._id,
      fullName: s.fullName,
      email: s.email,
      studentId: s.studentId,
      institution: s.registration ? s.registration.institution : undefined,
      status: s.profileStatus,
      createdAt: s.createdAt,
    }));

    const total = await Student.countDocuments(filter);

    res.json({
      success: true,
      count: data.length,
      total,
      data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
      message: err.message
    });
  }
});

// Get a single student's registration by student id
// SECURITY: staff-only.
router.get('/:id', protect, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: student
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration',
      message: err.message
    });
  }
});

module.exports = router;
