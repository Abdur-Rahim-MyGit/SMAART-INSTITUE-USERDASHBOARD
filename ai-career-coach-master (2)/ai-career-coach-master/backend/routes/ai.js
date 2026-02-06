const express = require('express');
const router = express.Router();
const {
    chat,
    getRecommendations,
    generateLearningPlan,
    analyzeSkillGap,
    generateResume
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

// All AI routes are protected
router.use(protect);

router.post('/chat', chat);
router.get('/recommendations', getRecommendations);
router.post('/learning-plan', generateLearningPlan);
router.post('/skill-gap', analyzeSkillGap);
router.post('/resume', generateResume);

module.exports = router;
