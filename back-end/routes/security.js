const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const securityController = require('../controllers/securityController');

// Apply protection to all security routes
router.use(protect);

router.post('/log-violation', securityController.logViolation);
router.post('/lockout-submit', securityController.lockoutSubmit);
router.get('/warning-status', securityController.getWarningStatus);

module.exports = router;
