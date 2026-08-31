const mongoose = require('mongoose');
const EventEmitter = require('events');

// Singleton emitter – keeps the model free of WS dependencies
const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(50);

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: [
      'badge',           // Badge earned
      'assessment',      // Assessment completed/results ready
      'course',          // Course enrollment/completion/module unlock
      'achievement',     // Level up, streak milestone, XP milestone
      'community',       // Reply, like, mention, group activity
      'coaching',        // Session scheduled/reminder/completed
      'support',         // Ticket response
      'task',            // Task due/overdue
      'certificate',     // Certificate issued
      'warning',         // Moderator warning
      'suspension',      // Account suspension
      'system',          // System announcements, maintenance
      'info',            // Compatibility with admin
      'success',         // Compatibility with admin
      'error'            // Compatibility with admin
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'bell' // lucide icon name
  },
  color: {
    type: String,
    default: '#30919D' // teal - default brand color
  },
  link: {
    type: String,
    default: null // Route to navigate to when clicked
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  metadata: {
    // Optional additional data for specific notification types
    badgeId: String,
    courseId: mongoose.Schema.Types.ObjectId,
    assessmentId: mongoose.Schema.Types.ObjectId,
    postId: mongoose.Schema.Types.ObjectId,
    sessionId: mongoose.Schema.Types.ObjectId,
    ticketId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    senderName: String,
    xpEarned: Number,
    level: Number,
    streakDays: Number
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// Auto-delete notifications older than 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Virtual for time ago display
notificationSchema.virtual('timeAgo').get(function() {
  const seconds = Math.floor((new Date() - this.createdAt) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
});

// Ensure virtuals are included in JSON output
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  if (data.userId && !data.recipient) data.recipient = data.userId;
  if (!data.userId && data.recipient) data.userId = data.recipient;
  if (data.isRead !== undefined && data.read === undefined) data.read = data.isRead;
  if (data.read !== undefined && data.isRead === undefined) data.isRead = data.read;

  const notification = new this(data);
  await notification.save();
  // Fire real-time event for WebSocket layer
  notificationEmitter.emit('new_notification', notification.toJSON());
  // Mirror as an Expo push notification — fire-and-forget, never blocks or
  // fails the request that created the notification. Lazy require avoids any
  // module load-order coupling between model and service layers.
  try {
    require('../services/expoPush').sendPushForNotification(notification);
  } catch (err) {
    console.error('[Notification] Push mirror error:', err.message);
  }
  return notification;
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    $or: [
      { userId, isRead: false },
      { recipient: userId, read: false }
    ]
  });
};

// Static method to mark all as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    {
      $or: [
        { userId, isRead: false },
        { recipient: userId, read: false }
      ]
    },
    { $set: { isRead: true, read: true } }
  );
};

const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;
module.exports.notificationEmitter = notificationEmitter;
