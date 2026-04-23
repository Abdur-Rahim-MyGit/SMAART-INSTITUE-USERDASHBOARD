const Notification = require('../models/Notification');
const emailService  = require('./emailService');

// Icon and color mappings for notification types
const NOTIFICATION_CONFIG = {
  badge:       { icon: 'trophy',          color: '#FFD700' },
  assessment:  { icon: 'clipboard-check', color: '#30919D' },
  course:      { icon: 'book-open',       color: '#4F46E5' },
  achievement: { icon: 'star',            color: '#F59E0B' },
  community:   { icon: 'users',           color: '#EC4899' },
  coaching:    { icon: 'calendar',        color: '#10B981' },
  support:     { icon: 'headphones',      color: '#6366F1' },
  task:        { icon: 'check-circle',    color: '#EF4444' },
  certificate: { icon: 'award',           color: '#8B5CF6' },
  warning:     { icon: 'alert-triangle',  color: '#F97316' },
  suspension:  { icon: 'shield-off',      color: '#DC2626' },
  system:      { icon: 'bell',            color: '#64748B' }
};

/**
 * Fire-and-forget email dispatch.
 * Resolves userId → email, then calls the given emailFn.
 * Errors are swallowed so email failures never break in-app notifications.
 *
 * @param {string|ObjectId} userId
 * @param {Function} emailFn  – async fn that receives { to, fullName, ...extras }
 * @param {Object}   extras   – additional payload merged into the email helper args
 */
const _sendEmail = (userId, emailFn, extras = {}) => {
  // Non-blocking – we intentionally do NOT await this
  emailService.resolveUserEmail(userId)
    .then(user => {
      if (!user?.email) return;
      return emailFn({ to: user.email, fullName: user.fullName, ...extras });
    })
    .catch(err => console.error('[NotificationService] Email dispatch error:', err.message));
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
 * Notify user about badge earned - ONLY ONCE per badge
 */
const notifyBadgeEarned = async (userId, badge) => {
  // Check if notification already exists for this badge
  const existingNotification = await Notification.findOne({
    userId,
    type: 'badge',
    'metadata.badgeId': badge.badgeId
  });

  if (existingNotification) {
    console.log(`ℹ️ Badge notification for "${badge.title}" already exists, skipping...`);
    return null;
  }

  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendBadgeEarnedEmail, {
    badgeTitle: badge.title,
    badgeTier:  badge.tier,
    xpEarned:   badge.xp
  });

  return createNotification({
    userId,
    type: 'badge',
    title: '🏆 New Badge Earned!',
    message: `Congratulations! You've earned the "${badge.title}" badge.`,
    link: null,
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
  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendAssessmentResultsEmail, {
    assessmentName: assessment.name || 'Assessment',
    score:          assessment.score,
    maxScore:       assessment.maxScore,
    resultId
  });

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
  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendCourseEnrollmentEmail, {
    courseTitle: course.title,
    startDate:   course.startDate
  });

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
 * Notify user about course completion - ONLY ONCE per course
 */
const notifyCourseCompleted = async (userId, course) => {
  // Check if notification already exists for this course completion
  const existingNotification = await Notification.findOne({
    userId,
    type: 'course',
    title: '🎓 Course Completed!',
    'metadata.courseId': course._id.toString()
  });

  if (existingNotification) {
    console.log(`ℹ️ Course completion notification already exists, skipping...`);
    return null;
  }

  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendCourseCompletedEmail, {
    courseTitle:     course.title,
    completionDate:  new Date()
  });

  return createNotification({
    userId,
    type: 'course',
    title: '🎓 Course Completed!',
    message: `Amazing! You've completed "${course.title}". Your certificate is ready!`,
    link: null,
    icon: 'graduation-cap',
    color: '#10B981',
    metadata: {
      courseId: course._id.toString()
    }
  });
};

/**
 * Notify user about session (day) completion - ONLY ONCE per session
 */
const notifySessionCompleted = async (userId, course, dayId) => {
  // Check if notification already exists for this course/day combo
  const existingNotification = await Notification.findOne({
    userId,
    type: 'achievement',
    'metadata.courseId': course._id.toString(),
    'metadata.dayId': dayId
  });

  if (existingNotification) {
    console.log(`ℹ️ Session notification for Day ${dayId} already exists, skipping...`);
    return null; // Already notified, don't create duplicate
  }

  return createNotification({
    userId,
    type: 'achievement',
    title: '💪 Session Completed!',
    message: `Great job! You've finished all activities for Day ${dayId} in "${course.title}".`,
    link: null, // No hyperlinks - display only
    icon: 'check-circle',
    color: '#10B981',
    metadata: {
      courseId: course._id.toString(),
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

  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendCoachingSessionEmail, {
    coachName,
    sessionDate: session.scheduledAt,
    sessionTime: new Date(session.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    sessionType: session.type || session.sessionType
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
const notifyTicketResponse = async (userId, ticketId, ticketSubject, agentName) => {
  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendTicketUpdateEmail, {
    ticketSubject,
    ticketId,
    agentName
  });

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
const notifyCertificateIssued = async (userId, certificateType, courseName, certificateId) => {
  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendCertificateEmail, {
    certificateType,
    courseName,
    certificateId
  });

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
  // 📧 Welcome email – we already know the email from the registration context;
  // however to stay consistent we use the userId-resolver path here too.
  _sendEmail(userId, emailService.sendWelcomeEmail, {});

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

/**
 * Notify user about a moderator warning
 */
const notifyModerationWarning = async (userId, reason, warningCount) => {
  // 📧 Email – fire-and-forget
  _sendEmail(userId, emailService.sendModerationWarningEmail, { reason, warningCount });

  return createNotification({
    userId,
    type: 'warning',
    title: '⚠️ Community Warning',
    message: `A moderator has issued a warning on your account. Reason: ${reason || 'Policy violation'}`,
    link: '/community',
    icon: 'alert-triangle',
    color: '#F97316',
    metadata: {
      action: 'warn',
      reason
    }
  });
};

/**
 * Notify user about account suspension
 */
const notifyModerationSuspension = async (userId, reason, durationDays) => {
  return createNotification({
    userId,
    type: 'suspension',
    title: '🚫 Account Posting Suspended',
    message: `Your posting privileges have been suspended. Reason: ${reason || 'Policy violation'}. Duration: ${durationDays} days.`,
    link: '/community',
    icon: 'shield-off',
    color: '#DC2626',
    metadata: {
      action: 'suspend',
      reason,
      durationDays
    }
  });
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
  notifyNewCourse,
  notifyModerationWarning,
  notifyModerationSuspension
};
