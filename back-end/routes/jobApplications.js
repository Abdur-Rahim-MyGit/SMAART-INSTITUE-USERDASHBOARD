const express = require('express');
const router = express.Router();
const jobApplicationsController = require('../controllers/jobApplicationsController');
const { protect } = require('../middleware/auth');
const { uploadRegistration } = require('../middleware/upload');

// Create application (with optional resume file)
router.post('/', protect, uploadRegistration.single('resume'), jobApplicationsController.createApplication);

// List applications (admin / user scope)
router.get('/', protect, jobApplicationsController.listApplications);

// Get single application
router.get('/:applicationId', protect, jobApplicationsController.getApplication);

// Delete application
router.delete('/:applicationId', protect, jobApplicationsController.deleteApplication);

module.exports = router;
