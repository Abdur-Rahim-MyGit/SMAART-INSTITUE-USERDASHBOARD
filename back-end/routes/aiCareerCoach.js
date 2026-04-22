const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const authMiddleware = require('../middleware/authMiddleware');
const aiCareerCoachController = require('../controllers/aiCareerCoachController');

/**
 * AI Career Coach Routes
 * All routes require authentication
 */

// Profile Management
router.get('/profile', authMiddleware, aiCareerCoachController.getProfile);
router.put('/profile', authMiddleware, aiCareerCoachController.updateProfile);
router.post('/profile/analyze', authMiddleware, aiCareerCoachController.analyzeProfile);

// Career Features
router.get('/recommendations', authMiddleware, aiCareerCoachController.getCareerRecommendations);
router.post('/skill-gap', authMiddleware, aiCareerCoachController.analyzeSkillGap);
router.post('/learning-plan', authMiddleware, aiCareerCoachController.generateLearningPlan);
router.post('/resume', authMiddleware, aiCareerCoachController.generateResume);

// Chat Features
router.post('/chat', authMiddleware, aiCareerCoachController.chat);
router.get('/chat/sessions', authMiddleware, aiCareerCoachController.getChatSessions);
router.get('/chat/:sessionId', authMiddleware, aiCareerCoachController.getChatHistory);

module.exports = router;
