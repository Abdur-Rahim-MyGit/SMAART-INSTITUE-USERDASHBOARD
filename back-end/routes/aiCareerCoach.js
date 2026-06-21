const express = require('express');
const router = express.Router();
const { generalLimiter, aiLimiter } = require('../middleware/rateLimiter');
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
router.post('/profile/analyze', authMiddleware, aiLimiter, aiCareerCoachController.analyzeProfile);

// Career Features
router.get('/recommendations', authMiddleware, aiCareerCoachController.getCareerRecommendations);
router.post('/skill-gap', authMiddleware, aiLimiter, aiCareerCoachController.analyzeSkillGap);
router.post('/learning-plan', authMiddleware, aiLimiter, aiCareerCoachController.generateLearningPlan);
router.post('/resume', authMiddleware, aiLimiter, aiCareerCoachController.generateResume);
router.post('/generate-summary', authMiddleware, aiLimiter, aiCareerCoachController.generateProfessionalSummary);

// Chat Features
router.post('/chat', authMiddleware, aiLimiter, aiCareerCoachController.chat);
router.get('/chat/sessions', authMiddleware, aiCareerCoachController.getChatSessions);
router.get('/chat/:sessionId', authMiddleware, aiCareerCoachController.getChatHistory);

module.exports = router;
