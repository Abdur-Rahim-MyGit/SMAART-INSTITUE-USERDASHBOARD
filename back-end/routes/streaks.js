const express = require('express');
const router = express.Router();
const streakController = require('../controllers/streakController');
const { protect } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

// Protect all routes
router.use(protect);
router.use(generalLimiter);

// Streak Routes
router.post('/activity', streakController.recordActivity);
router.get('/status', streakController.getStreakStatus);
router.post('/restore', streakController.restoreStreak);

module.exports = router;
