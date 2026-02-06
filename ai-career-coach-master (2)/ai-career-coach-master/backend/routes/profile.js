const express = require('express');
const router = express.Router();
const {
    getProfile,
    createOrUpdateProfile,
    analyzeProfile,
    addEducation,
    addExperience,
    updateSkills,
    generateCareerAnalysis,
    getPersonalizedResources
} = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { profileValidation, validate } = require('../middleware/validators');

// All routes are protected
router.use(protect);

router.route('/')
    .get(getProfile)
    .post(profileValidation, validate, createOrUpdateProfile);

router.post('/analyze', analyzeProfile);
router.post('/generate-career-analysis', generateCareerAnalysis);
router.get('/resources', getPersonalizedResources);
router.post('/education', addEducation);
router.post('/experience', addExperience);
router.put('/skills', updateSkills);

module.exports = router;
