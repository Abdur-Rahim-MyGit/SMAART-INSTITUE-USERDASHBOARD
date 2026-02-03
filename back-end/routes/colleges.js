const express = require('express');
const College = require('../models/College');
const { searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Get all colleges with search functionality - PROTECTED with rate limiting
router.get('/', searchLimiter, async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    // SECURITY FIX: Only return active colleges (case-insensitive)
    let query = { status: { $regex: '^active$', $options: 'i' } };

    // If search term provided, use text search
    if (search) {
      query = {
        ...query,
        $or: [
          { collegeName: { $regex: search, $options: 'i' } },
          { collegeCode: { $regex: search, $options: 'i' } },
          { 'address.city': { $regex: search, $options: 'i' } },
          { 'address.state': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const colleges = await College.find(query)
      .select('collegeName collegeCode address institutionType affiliation status')
      .sort({ collegeName: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: colleges.length,
      data: colleges
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch colleges',
      message: err.message
    });
  }
});

// Get college by ID
router.get('/:id', async (req, res) => {
  try {
    const college = await College.findById(req.params.id);

    if (!college) {
      return res.status(404).json({
        success: false,
        error: 'College not found'
      });
    }

    res.json({
      success: true,
      data: college
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college',
      message: err.message
    });
  }
});

// Get college by code
router.get('/code/:code', async (req, res) => {
  try {
    const college = await College.findOne({
      code: req.params.code.toUpperCase(),
      isActive: true
    });

    if (!college) {
      return res.status(404).json({
        success: false,
        error: 'College not found'
      });
    }

    res.json({
      success: true,
      data: college
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college',
      message: err.message
    });
  }
});

// Create new college (admin only - can be protected with auth middleware later)
router.post('/', async (req, res) => {
  try {
    const collegeData = req.body;

    // Check if college with same name or code already exists
    const existingCollege = await College.findOne({
      $or: [
        { name: collegeData.name },
        { code: collegeData.code?.toUpperCase() }
      ]
    });

    if (existingCollege) {
      return res.status(400).json({
        success: false,
        error: 'College with this name or code already exists'
      });
    }

    const college = new College(collegeData);
    await college.save();

    res.status(201).json({
      success: true,
      message: 'College created successfully',
      data: college
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to create college',
      message: err.message
    });
  }
});

module.exports = router;
