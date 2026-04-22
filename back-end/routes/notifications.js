const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination
 * @access  Private
 */
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId)
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.markAllAsRead(req.user.id);
    res.json({ 
      success: true, 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

/**
 * @route   DELETE /api/notifications/clear-all
 * @desc    Delete all notifications for user
 * @access  Private
 */
router.delete('/clear-all', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user.id });
    res.json({ 
      success: true, 
      message: 'All notifications cleared',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

/**
 * @route   POST /api/notifications/test
 * @desc    Create a test notification (Development only)
 * @access  Private
 */
router.post('/test', protect, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }

  try {
    const notification = await Notification.createNotification({
      userId: req.user.id,
      type: req.body.type || 'system',
      title: req.body.title || '🔔 Test Notification',
      message: req.body.message || 'This is a test notification to verify the system is working correctly.',
      icon: req.body.icon || 'bell',
      color: req.body.color || '#30919D',
      link: req.body.link || '/dashboard'
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create test notification' });
  }
});

/**
 * @route   GET /api/notifications/summary
 * @desc    Get consolidated notification summary (daily progress, badges, login times)
 * @access  Private
 */
router.get('/summary', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const Student = require('../models/Student');
    const UserBadge = require('../models/UserBadge');
    const CourseEnrollment = require('../models/CourseEnrollment');

    // Get user data (try both User and Student collections)
    let userData = await User.findById(userId).select('lastLogin previousLogin fullName');
    if (!userData) {
      userData = await Student.findById(userId).select('lastLogin previousLogin fullName');
    }

    // Get badges earned count
    const badgesEarned = await UserBadge.countDocuments({ userId });

    // Get today's completed sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const enrollments = await CourseEnrollment.find({ userId });
    let todayCompletedSessions = 0;

    for (const enrollment of enrollments) {
      if (enrollment.dayProgress) {
        for (const [dayKey, dayData] of enrollment.dayProgress.entries()) {
          if (dayData.completedAt && new Date(dayData.completedAt) >= today && new Date(dayData.completedAt) < tomorrow) {
            todayCompletedSessions++;
          }
        }
      }
    }

    res.json({
      success: true,
      summary: {
        fullName: userData?.fullName || 'Student',
        lastLogin: userData?.previousLogin || null,
        currentLogin: userData?.lastLogin || new Date(),
        badgesEarned,
        todayCompletedSessions,
        totalEnrollments: enrollments.length
      }
    });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

/**
 * @route   POST /api/notifications/broadcast
 * @desc    Broadcast a notification to all students (Admin only)
 * @access  Private (Admin)
 */
router.post('/broadcast', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    // Get all students
    const Student = require('../models/Student');
    const students = await Student.find({ status: 'active' }).select('_id');

    // Create notifications for all students
    const notifications = students.map(student => ({
      userId: student._id,
      type: 'system',
      title: title,
      message: message,
      icon: 'megaphone',
      color: '#002147', // Navy blue for admin announcements
      link: null // No hyperlinks - display only
    }));

    // Bulk insert
    await Notification.insertMany(notifications);

    res.json({
      success: true,
      message: `Broadcast sent to ${students.length} students`,
      recipientCount: students.length
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
  }
});

module.exports = router;
