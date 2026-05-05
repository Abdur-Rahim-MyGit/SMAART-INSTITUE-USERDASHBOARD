const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const {
  broadcastToAll,
  sendUnreadCountUpdate,
  emitNotificationStateToUser,
  emitNotificationsClearedToUser,
} = require('../services/websocketService');
const { sendSystemAnnouncementEmail } = require('../services/emailService');

const getAuthenticatedUserId = (req) => (req.user?._id || req.user?.id || '').toString();

router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = getAuthenticatedUserId(req);

    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await Notification.getUnreadCount(getAuthenticatedUserId(req));
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to get unread count' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    emitNotificationStateToUser(userId, {
      action: 'read',
      notificationId: req.params.id,
    });
    await sendUnreadCountUpdate(userId);

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

router.patch('/read-all', protect, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await Notification.markAllAsRead(userId);

    emitNotificationStateToUser(userId, { action: 'read_all' });
    await sendUnreadCountUpdate(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

router.delete('/clear-all', protect, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await Notification.deleteMany({ userId });

    emitNotificationsClearedToUser(userId);
    await sendUnreadCountUpdate(userId);

    res.json({
      success: true,
      message: 'All notifications cleared',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId,
    }).lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    emitNotificationStateToUser(userId, {
      action: 'delete',
      notificationId: req.params.id,
    });
    await sendUnreadCountUpdate(userId);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

router.post('/test', protect, async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Not available in production' });
  }

  try {
    const notification = await Notification.createNotification({
      userId: getAuthenticatedUserId(req),
      type: req.body.type || 'system',
      title: req.body.title || 'Test Notification',
      message: req.body.message || 'This is a test notification to verify the system is working correctly.',
      icon: req.body.icon || 'bell',
      color: req.body.color || '#30919D',
      link: req.body.link || '/dashboard',
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({ success: false, message: 'Failed to create test notification' });
  }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const User = require('../models/User');
    const Student = require('../models/Student');
    const UserBadge = require('../models/UserBadge');
    const CourseEnrollment = require('../models/CourseEnrollment');

    let userData = await User.findById(userId).select('lastLogin previousLogin fullName');
    if (!userData) {
      userData = await Student.findById(userId).select('lastLogin previousLogin fullName');
    }

    const badgesEarned = await UserBadge.countDocuments({ userId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const enrollments = await CourseEnrollment.find({ userId });
    let todayCompletedSessions = 0;

    for (const enrollment of enrollments) {
      if (!enrollment.dayProgress) continue;
      for (const [, dayData] of enrollment.dayProgress.entries()) {
        if (dayData.completedAt && new Date(dayData.completedAt) >= today && new Date(dayData.completedAt) < tomorrow) {
          todayCompletedSessions += 1;
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
        totalEnrollments: enrollments.length,
      },
    });
  } catch (error) {
    console.error('Error fetching notification summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

router.post('/broadcast', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    const Student = require('../models/Student');
    const students = await Student.find({ status: 'active' }).select('_id');

    const notifications = students.map((student) => ({
      userId: student._id,
      type: 'system',
      title,
      message,
      icon: 'megaphone',
      color: '#002147',
      link: null,
    }));

    await Notification.insertMany(notifications);

    broadcastToAll({
      type: 'system',
      title,
      message,
      icon: 'megaphone',
      color: '#002147',
      link: null,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      message: `Broadcast sent to ${students.length} students`,
      recipientCount: students.length,
    });

    setImmediate(async () => {
      try {
        const fullStudents = await Student.find({ status: 'active' }).select('email fullName').lean();
        for (const student of fullStudents) {
          if (student.email) {
            await sendSystemAnnouncementEmail({
              to: student.email,
              fullName: student.fullName,
              title,
              message,
            });
          }
        }
        console.log(`[Broadcast] Emails sent to ${fullStudents.length} students`);
      } catch (emailErr) {
        console.error('[Broadcast] Email error:', emailErr.message);
      }
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
  }
});

module.exports = router;
