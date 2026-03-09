const express = require('express');
const router = express.Router();
const careerGuideController = require('../controllers/careerGuideController');
const { protect: authMiddleware } = require('../middleware/auth');

/**
 * Career Guide Agent AI Routes
 * Highly Structured Multifactor Career Analysis
 */

// Generate new career guide report
router.post('/generate', authMiddleware, careerGuideController.generateGuideReport);

// Get all reports for the current user
router.get('/reports', authMiddleware, careerGuideController.getReports);

// Get latest completed report
router.get('/latest', authMiddleware, careerGuideController.getLatestReport);

module.exports = router;
