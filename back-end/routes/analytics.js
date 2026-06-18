const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStudentAnalytics,
  getCollegeAnalytics,
  getAdminAnalytics,
  getCalendarEvents
} = require('../controllers/analyticsController');

// All routes are protected by default
router.use(protect);

// Student progression analytics (Accessible by students)
router.get('/student', authorize('student'), getStudentAnalytics);

// College participation and rankings (Accessible by college admins, teachers, and system admins)
router.get('/college', authorize('college_admin', 'teacher', 'admin'), getCollegeAnalytics);

// Global system-wide analytics (Accessible by system admins only)
router.get('/admin', authorize('admin'), getAdminAnalytics);

// Calendar events (Accessible by all protected users)
router.get('/calendar-events', getCalendarEvents);

module.exports = router;
