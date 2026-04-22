const express = require('express');
const Registration = require('../models/Registration');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Get unique institutions from registrations
router.get('/institutions', async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;
    
    // Get unique institutions from registrations
    let pipeline = [
      {
        $match: {
          institution: { $exists: true, $ne: null, $ne: "" }
        }
      },
      {
        $group: {
          _id: "$institution",
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
      pipeline[0].$match.institution = {
        $regex: search,
        $options: 'i'
      };
    }

    // Add limit
    pipeline.push({ $limit: parseInt(limit) });

    const institutions = await Registration.aggregate(pipeline);

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

// Get all registrations
router.get('/', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const registrations = await Registration.find({})
      .select('fullName email institution studentId status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Registration.countDocuments();

    res.json({
      success: true,
      count: registrations.length,
      total,
      data: registrations
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
      message: err.message
    });
  }
});

// Get registration by ID
router.get('/:id', async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    res.json({
      success: true,
      data: registration
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
