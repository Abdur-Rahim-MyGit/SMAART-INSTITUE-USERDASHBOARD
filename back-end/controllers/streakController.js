const UserStreak = require('../models/UserStreak');
const UserAchievement = require('../models/UserAchievement');

// Helper to get calendar date string in Asia/Kolkata or user's timezone
const getCalendarDateString = (date, timezone = 'Asia/Kolkata') => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

// Helper to get day of the week (0 = Sunday, 1 = Monday, etc.)
const getDayOfWeek = (date, timezone = 'Asia/Kolkata') => {
  const tempDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return tempDate.getDay();
};

// Calculate missed active days (excluding Sundays)
const calculateMissedDaysExcludingSundays = (lastDateStr, currentDateStr, timezone = 'Asia/Kolkata') => {
  const lastDate = new Date(lastDateStr + 'T12:00:00');
  const currentDate = new Date(currentDateStr + 'T12:00:00');
  
  let missedCount = 0;
  // Loop from tomorrow of lastDate to yesterday of currentDate
  let iterDate = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
  while (iterDate < currentDate) {
    const dayOfWeek = getDayOfWeek(iterDate, timezone);
    if (dayOfWeek !== 0) { // Exclude Sunday (0)
      missedCount++;
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }
  return missedCount;
};

// Record active day
exports.recordActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const timezone = req.user?.timezone || 'Asia/Kolkata';
    const todayStr = getCalendarDateString(now, timezone);
    const todayDayOfWeek = getDayOfWeek(now, timezone);

    // Find or create streak record
    let streak = await UserStreak.findOne({ user: userId });

    if (todayDayOfWeek === 0) {
      // Sundays are excluded, do not increment or update activity date.
      // Just return current status.
      return res.json({
        success: true,
        message: 'Sundays are rest days! Streak remains unchanged.',
        data: streak || { currentStreak: 0, longestStreak: 0, lastActivityDate: null, preResetStreak: 0 }
      });
    }

    if (!streak) {
      // First ever activity!
      streak = new UserStreak({
        user: userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: now
      });
      await streak.save();
      return res.json({
        success: true,
        message: 'First active day! Streak started.',
        data: streak
      });
    }

    // Check last activity calendar date
    const lastActivityDateStr = getCalendarDateString(streak.lastActivityDate, timezone);

    if (todayStr === lastActivityDateStr) {
      // Already active today!
      return res.json({
        success: true,
        message: 'Already recorded activity for today.',
        data: streak
      });
    }

    // Calculate missed active days between last activity and today
    const missedDays = calculateMissedDaysExcludingSundays(lastActivityDateStr, todayStr, timezone);

    let message = '';
    if (missedDays === 0) {
      // Consecutive active day!
      streak.currentStreak += 1;
      message = 'Streak incremented!';
    } else if (missedDays <= 2) {
      // Skipped 1 or 2 days (grace period)! Preserve and increment streak.
      streak.currentStreak += 1;
      message = `Streak preserved by grace period! You missed ${missedDays} active day(s), but your streak is kept alive.`;
    } else {
      // Exceeded 2 days grace period! Reset to 1, but save the pre-reset streak so they can restore it.
      streak.preResetStreak = streak.currentStreak;
      streak.currentStreak = 1;
      message = `Exceeded grace period of 2 days (missed ${missedDays} days). Streak reset to 1.`;
    }

    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }

    streak.lastActivityDate = now;
    await streak.save();

    // Award achievement and voucher if streak reaches 6 days
    if (streak.currentStreak === 6) {
      const milestoneExists = await UserAchievement.findOne({
        user: userId,
        achievementType: 'STREAK_6_DAYS',
        'voucher.status': 'Active'
      });

      if (!milestoneExists) {
        const voucherCode = 'STK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const achievement = new UserAchievement({
          user: userId,
          achievementType: 'STREAK_6_DAYS',
          title: '6-Day Streak Champion!',
          description: 'Awarded for maintaining a 6-day active streak. Use this voucher to restore a broken streak or claim benefits.',
          voucher: {
            code: voucherCode,
            status: 'Active',
            issuedAt: new Date()
          }
        });
        await achievement.save();
        message += ` 🎉 Congratulations! You earned a 6-Day Streak Achievement and Restoration Voucher: ${voucherCode}!`;
      }
    }

    return res.json({
      success: true,
      message,
      data: streak
    });
  } catch (error) {
    console.error('Error recording streak activity:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record streak activity',
      message: error.message
    });
  }
};

// Get current streak status
exports.getStreakStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let streak = await UserStreak.findOne({ user: userId });
    if (!streak) {
      streak = new UserStreak({
        user: userId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
      });
      await streak.save();
    }

    // Fetch achievements & vouchers
    const achievements = await UserAchievement.find({ user: userId }).sort({ earnedAt: -1 });

    return res.json({
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        lastActivityDate: streak.lastActivityDate,
        preResetStreak: streak.preResetStreak,
        canRestore: streak.preResetStreak > 0,
        achievements
      }
    });
  } catch (error) {
    console.error('Error fetching streak status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch streak status',
      message: error.message
    });
  }
};

// Restore streak using a voucher
exports.restoreStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    const { voucherCode } = req.body;

    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        error: 'Voucher code is required'
      });
    }

    // Find active voucher
    const achievement = await UserAchievement.findOne({
      user: userId,
      'voucher.code': voucherCode,
      'voucher.status': 'Active'
    });

    if (!achievement) {
      return res.status(400).json({
        success: false,
        error: 'Invalid, expired, or already redeemed voucher code'
      });
    }

    const streak = await UserStreak.findOne({ user: userId });
    if (!streak || streak.preResetStreak <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No broken streak available to restore. Or streak was already restored.'
      });
    }

    const oldStreak = streak.currentStreak;
    const restoredStreak = streak.preResetStreak;

    // Restore streak
    streak.currentStreak = restoredStreak;
    if (restoredStreak > streak.longestStreak) {
      streak.longestStreak = restoredStreak;
    }
    streak.preResetStreak = 0; // Reset pre-reset streak after restore
    await streak.save();

    // Redeem voucher
    achievement.voucher.status = 'Redeemed';
    achievement.voucher.redeemedAt = new Date();
    await achievement.save();

    return res.json({
      success: true,
      message: `Streak successfully restored from ${oldStreak} back to ${restoredStreak}!`,
      data: streak
    });
  } catch (error) {
    console.error('Error restoring streak:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restore streak',
      message: error.message
    });
  }
};
