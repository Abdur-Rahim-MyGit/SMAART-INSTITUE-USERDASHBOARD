const express = require('express');
const router = express.Router();
const { getTaskProgress, updateTaskProgress } = require('../controllers/communityTaskProgressController');
const { protect } = require('../middleware/auth'); // Standard auth middleware

router.route('/')
    .get(protect, getTaskProgress)
    .put(protect, updateTaskProgress);

module.exports = router;
