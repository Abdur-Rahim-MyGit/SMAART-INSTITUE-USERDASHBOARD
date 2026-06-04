const express = require('express');
const College = require('../models/College');
const CollegeBanner = require('../models/CollegeBanner');
const { searchLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Get all colleges with search functionality - PROTECTED with rate limiting
router.get('/', searchLimiter, async (req, res) => {
  try {
    const { search, limit = 50 } = req.query;

    // No status filter — show all colleges in institution selector
    let query = {};

    let colleges = [];
    if (search) {
      const searchLower = search.trim().toLowerCase();
      const escapedSearch = searchLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp('\\b' + escapedSearch, 'i');
      const prefixRegex = new RegExp('^' + escapedSearch, 'i');

      // 1. Fetch prefix matches first (Name or Code starts with search)
      const prefixMatches = await College.find({
        ...query,
        $or: [
          { collegeName: prefixRegex },
          { collegeCode: prefixRegex }
        ]
      })
        .select('collegeName collegeCode address institutionType affiliation status logo')
        .sort({ collegeName: 1 })
        .limit(parseInt(limit));

      colleges = [...prefixMatches];

      // 2. If we need more results, fetch substring matches
      if (colleges.length < parseInt(limit)) {
        const remainingLimit = parseInt(limit) - colleges.length;
        const prefixIds = prefixMatches.map(c => c._id);

        const substringMatches = await College.find({
          ...query,
          _id: { $nin: prefixIds },
          $or: [
            { collegeName: searchRegex }
          ]
        })
          .select('collegeName collegeCode address institutionType affiliation status logo')
          .sort({ collegeName: 1 })
          .limit(remainingLimit);

        colleges = [...colleges, ...substringMatches];
      }
    } else {
      // Default: regular fetch
      colleges = await College.find(query)
        .select('collegeName collegeCode address institutionType affiliation status logo')
        .sort({ collegeName: 1 })
        .limit(parseInt(limit));
    }

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

// Get college banners by college ID
router.get('/:id/banners', async (req, res) => {
  try {
    const banners = await CollegeBanner.find({
      collegeId: req.params.id,
      isActive: true
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: banners
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch college banners',
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

// Get college by name
router.get('/name/:name', async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name);
    const college = await College.findOne({
      collegeName: { $regex: new RegExp(`^${name}$`, 'i') }
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

module.exports = router;
