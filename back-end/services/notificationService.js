const Notification = require('../models/Notification');

// Icon and color mappings for notification types
const NOTIFICATION_CONFIG = {
  badge: { icon: 'trophy', color: '#FFD700' },
  assessment: { icon: 'clipboard-check', color: '#30919D' },
  course: { icon: 'book-open', color: '#4F46E5' },
  achievement: { icon: 'star', color: '#F59E0B' },
  community: { icon: 'users', color: '#EC4899' },
  coaching: { icon: 'calendar', color: '#10B981' },
  support: { icon: 'headphones', color: '#6366F1' },
  task: { icon: 'check-circle', color: '#EF4444' },
  certificate: { icon: 'award', color: '#8B5CF6' },
  system: { icon: 'bell', color: '#64748B' }
};

/**
 * Create a notification for a user
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
const createNotification = async (data) => {
  const config = NOTIFICATION_CONFIG[data.type] || NOTIFICATION_CONFIG.system;

  const notification = await Notification.createNotification({
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    icon: data.icon || config.icon,
    color: data.color || config.color,
    link: data.link || null,
    metadata: data.metadata || {}
  });

  return notification;
};

/**
 * Notify user about badge earned
 */
const notifyBadgeEarned = async (userId, badge) => {
  return createNotification({
    userId,
    type: 'badge',
    title: '🏆 New Badge Earned!',
    message: `Congratulations! You've earned the "${badge.title}" badge.`,
    link: '/badges',
    metadata: {
      badgeId: badge.badgeId,
      xpEarned: badge.xp
    }
  });
};

/**
 * Notify user about assessment results
 */
const notifyAssessmentComplete = async (userId, assessment, resultId) => {
  return createNotification({
    userId,
    type: 'assessment',
    title: '📊 Assessment Results Ready',
    message: `Your ${assessment.name || 'assessment'} results are now available. View your score and insights!`,
    link: `/assessments/results/${resultId}`,
    metadata: {
      assessmentId: assessment._id
    }
  });
};

/**
 * Notify user about course enrollment
 */
const notifyCourseEnrollment = async (userId, course) => {
  return createNotification({
    userId,
    type: 'course',
    title: '📚 Course Enrolled!',
    message: `Welcome to "${course.title}"! Start your learning journey now.`,
    link: `/courses/${course._id}`,
    metadata: {
      courseId: course._id
    }
  });
};

/**
 * Notify user about course completion
 */
const notifyCourseCompleted = async (userId, course) => {
  return createNotification({
    userId,
    type: 'course',
    title: '🎓 Course Completed!',
    message: `Amazing! You've completed "${course.title}". Your certificate is ready!`,
    link: '/certificates',
    icon: 'graduation-cap',
    color: '#10B981',
    metadata: {
      courseId: course._id
    }
  });
};

/**
 * Notify user about session (day) completion
 */
const notifySessionCompleted = async (userId, course, dayId) => {
  return createNotification({
    userId,
    type: 'achievement',
    title: '💪 Session Completed!',
    message: `Great job! You've finished all activities for Day ${dayId} in "${course.title}".`,
    link: `/courses/${course._id}`,
    icon: 'check-circle',
    color: '#10B981',
    metadata: {
      courseId: course._id,
      dayId
    }
  });
};

/**
 * Notify user about module unlock
 */
const notifyModuleUnlocked = async (userId, course, moduleName) => {
  return createNotification({
    userId,
    type: 'course',
    title: '🔓 New Module Unlocked!',
    message: `"${moduleName}" is now available in "${course.title}".`,
    link: `/courses/${course._id}`,
    icon: 'unlock',
    metadata: {
      courseId: course._id
    }
  });
};

/**
 * Notify user about level up
 */
const notifyLevelUp = async (userId, newLevel, unlockedItems = []) => {
  let message = `You've reached Level ${newLevel}!`;
  if (unlockedItems.length > 0) {
    message += ` New items unlocked: ${unlockedItems.join(', ')}.`;
  }

  return createNotification({
    userId,
    type: 'achievement',
    title: '🎉 Level Up!',
    message,
    link: '/avatar',
    icon: 'trending-up',
    color: '#F59E0B',
    metadata: {
      level: newLevel
    }
  });
};

/**
 * Notify user about streak milestone
 */
const notifyStreakMilestone = async (userId, streakDays) => {
  const milestoneMessages = {
    7: "One week strong! 🔥",
    14: "Two weeks of dedication! 🌟",
    30: "A month of consistency! 🏆",
    60: "Two months unstoppable! 💪",
    90: "Quarter-year champion! 👑",
    100: "100 days legend! 🎖️",
    365: "A whole year! You're amazing! 🏅"
  };

  return createNotification({
    userId,
    type: 'achievement',
    title: `🔥 ${streakDays}-Day Streak!`,
    message: milestoneMessages[streakDays] || `${streakDays} days of learning! Keep it up!`,
    link: '/dashboard',
    icon: 'flame',
    color: '#EF4444',
    metadata: {
      streakDays
    }
  });
};

/**
 * Notify user about community reply
 */
const notifyCommunityReply = async (userId, postTitle, senderName, postId) => {
  return createNotification({
    userId,
    type: 'community',
    title: '💬 New Reply',
    message: `${senderName} replied to your post "${postTitle.substring(0, 50)}..."`,
    link: `/community/post/${postId}`,
    metadata: {
      postId,
      senderName
    }
  });
};

/**
 * Notify user about mention
 */
const notifyMention = async (userId, senderName, postId, context) => {
  return createNotification({
    userId,
    type: 'community',
    title: '📢 You were mentioned',
    message: `${senderName} mentioned you: "${context.substring(0, 80)}..."`,
    link: `/community/post/${postId}`,
    metadata: {
      postId,
      senderName
    }
  });
};

/**
 * Notify user about coaching session
 */
const notifySessionScheduled = async (userId, session, coachName) => {
  const sessionDate = new Date(session.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return createNotification({
    userId,
    type: 'coaching',
    title: '📅 Session Scheduled',
    message: `Your session with ${coachName} is confirmed for ${sessionDate}.`,
    link: '/mind-care',
    metadata: {
      sessionId: session._id
    }
  });
};

/**
 * Notify user about support ticket response
 */
const notifyTicketResponse = async (userId, ticketId, ticketSubject) => {
  return createNotification({
    userId,
    type: 'support',
    title: '📩 Ticket Update',
    message: `New response on your ticket: "${ticketSubject.substring(0, 50)}..."`,
    link: `/support/ticket/${ticketId}`,
    metadata: {
      ticketId
    }
  });
};

/**
 * Notify user about certificate issued
 */
const notifyCertificateIssued = async (userId, certificateType, courseName) => {
  return createNotification({
    userId,
    type: 'certificate',
    title: '📜 Certificate Issued!',
    message: `Your ${certificateType} certificate for "${courseName}" is ready to download!`,
    link: '/certificates',
    icon: 'award',
    color: '#8B5CF6'
  });
};

/**
 * Notify user about task reminder
 */
const notifyTaskDue = async (userId, taskTitle, hoursUntilDue) => {
  const timeText = hoursUntilDue <= 1 ? 'in 1 hour' : `in ${hoursUntilDue} hours`;

  return createNotification({
    userId,
    type: 'task',
    title: '⏰ Task Due Soon',
    message: `"${taskTitle}" is due ${timeText}.`,
    link: '/tasks',
    icon: 'clock',
    color: '#EF4444'
  });
};

/**
 * Send system announcement to all users or specific users
 */
const notifySystemAnnouncement = async (userIds, title, message, link = null) => {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'system',
    title,
    message,
    link,
    icon: 'megaphone',
    color: '#64748B'
  }));

  return Notification.insertMany(notifications);
};

/**
 * Notify user with welcome message on registration
 */
const notifyWelcome = async (userId, fullName) => {
  return createNotification({
    userId,
    type: 'system',
    title: '🎉 Welcome to SMAART Minds!',
    message: `Hi ${fullName}! We're excited to have you. Start by taking your baseline assessment to discover your strengths.`,
    link: '/assessments',
    icon: 'sparkles',
    color: '#30919D'
  });
};

/**
 * Notify user about new course available
 */
const notifyNewCourse = async (userIds, course) => {
  const notifications = userIds.map(userId => ({
    userId,
    type: 'course',
    title: '📚 New Course Available!',
    message: `"${course.title}" is now available. Enroll now to start learning!`,
    link: `/courses/${course._id}`,
    icon: 'book-open',
    color: '#4F46E5',
    metadata: { courseId: course._id }
  }));

  return Notification.insertMany(notifications);
};

module.exports = {
  createNotification,
  notifyBadgeEarned,
  notifyAssessmentComplete,
  notifyCourseEnrollment,
  notifyCourseCompleted,
  notifySessionCompleted,
  notifyModuleUnlocked,
  notifyLevelUp,
  notifyStreakMilestone,
  notifyCommunityReply,
  notifyMention,
  notifySessionScheduled,
  notifyTicketResponse,
  notifyCertificateIssued,
  notifyTaskDue,
  notifySystemAnnouncement,
  notifyWelcome,
  notifyNewCourse
};
