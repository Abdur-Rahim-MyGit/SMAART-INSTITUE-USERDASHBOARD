const express = require('express');
const router = express.Router();
const degreeController = require('../controllers/degreeController');

// Define degree routes
router.get('/levels', degreeController.getLevels);
router.get('/domains', degreeController.getDomains);
router.get('/fullNames', degreeController.getFullNames);
router.get('/specializations', degreeController.getSpecializations);

module.exports = router;
