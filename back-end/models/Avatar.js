/**
 * Avatar Model - 3D Avatar with Level-Based Unlock System
 * 
 * Level Unlock Rules:
 * - Level 1: Base avatar
 * - Level 2: Shoes unlock
 * - Level 3: Jacket unlock
 * - Level 4: Glasses unlock
 * - Level 5: Celebration animation unlock
 * 
 * GLB files are stored in Cloudinary/S3 and referenced by URL
 */

const mongoose = require('mongoose');

const avatarSchema = new mongoose.Schema({
  // Reference to the user who owns this avatar
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Current level (1-5+)
  level: {
    type: Number,
    default: 1,
    min: 1
  },

  // XP points for leveling up
  xp: {
    type: Number,
    default: 0,
    min: 0
  },

  // XP required for next level (increases per level)
  xpToNextLevel: {
    type: Number,
    default: 100
  },

  // ── 7-Day Cycle Streak System ──
  // Cycle: 6 consecutive activity days + 1 mandatory holiday (day 7)
  // Missing any of days 1-6 resets the streak to zero

  // Which day of the current cycle the user is on (1-7)
  streakCycleDay: {
    type: Number,
    default: 0,
    min: 0,
    max: 7
  },

  // How many full 7-day cycles the user has completed
  streakCyclesCompleted: {
    type: Number,
    default: 0,
    min: 0
  },

  // When the current cycle started
  streakStartDate: {
    type: Date,
    default: null
  },

  // "YYYY-MM-DD" of the last recorded activity day
  lastStreakDate: {
    type: String,
    default: ''
  },

  // Whether the user currently has an active streak
  streakActive: {
    type: Boolean,
    default: false
  },

  // Log of completed cycles
  streakHistory: [{
    cycleNumber: Number,
    startDate: Date,
    endDate: Date,
    completedAt: { type: Date, default: Date.now }
  }],

  // Sunday holidays tracking
  sundayHolidays: [{
    date: String,
    completedAt: { type: Date, default: Date.now }
  }],

  // Keep legacy field for backward compat (read-only, computed)
  streak: {
    type: Number,
    default: 0
  },

  lastActivityDate: {
    type: Date,
    default: Date.now
  },

  // Ready Player Me base avatar model URL (GLB)
  baseModel: {
    type: String,
    default: '' // URL to the base avatar GLB from Ready Player Me
  },

  // Accessory unlock states
  accessories: {
    shoes: {
      unlocked: { type: Boolean, default: false },
      modelUrl: { type: String, default: '' }, // GLB URL for shoes
      equipped: { type: Boolean, default: false }
    },
    jacket: {
      unlocked: { type: Boolean, default: false },
      modelUrl: { type: String, default: '' }, // GLB URL for jacket
      equipped: { type: Boolean, default: false }
    },
    glasses: {
      unlocked: { type: Boolean, default: false },
      modelUrl: { type: String, default: '' }, // GLB URL for glasses
      equipped: { type: Boolean, default: false }
    }
  },

  // Animation states
  animations: {
    idle: {
      url: { type: String, default: '' }, // Mixamo idle animation GLB/FBX URL
      unlocked: { type: Boolean, default: true }
    },
    celebrate: {
      url: { type: String, default: '' }, // Mixamo celebration animation URL
      unlocked: { type: Boolean, default: false }
    },
    wave: {
      url: { type: String, default: '' },
      unlocked: { type: Boolean, default: false }
    },
    dance: {
      url: { type: String, default: '' },
      unlocked: { type: Boolean, default: false }
    }
  },

  // Current active animation
  currentAnimation: {
    type: String,
    enum: ['idle', 'celebrate', 'wave', 'dance'],
    default: 'idle'
  },

  // Customization options
  customization: {
    skinTone: { type: String, default: '#f5d6bc' },
    hairColor: { type: String, default: '#3d2314' },
    eyeColor: { type: String, default: '#4a3c31' }
  },

  // Timestamps for unlock events (for celebration UX)
  unlockHistory: [{
    item: String,
    unlockedAt: { type: Date, default: Date.now },
    level: Number
  }]

}, {
  timestamps: true
});

// Virtual to calculate progress to next level
avatarSchema.virtual('levelProgress').get(function () {
  return Math.min(100, Math.round((this.xp / this.xpToNextLevel) * 100));
});

// Method to add XP and handle level-ups
avatarSchema.methods.addXP = async function (amount) {
  this.xp += amount;

  const unlocks = [];

  // Check for level up
  while (this.xp >= this.xpToNextLevel) {
    this.xp -= this.xpToNextLevel;
    this.level += 1;

    // Increase XP requirement for next level (progressive difficulty)
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);

    // Process unlocks based on new level
    const newUnlock = this.processLevelUnlock(this.level);
    if (newUnlock) {
      unlocks.push(newUnlock);
    }
  }

  await this.save();
  return { newLevel: this.level, unlocks };
};

// Process unlocks based on level
avatarSchema.methods.processLevelUnlock = function (level) {
  const unlockMap = {
    2: { type: 'accessory', item: 'shoes' },
    3: { type: 'accessory', item: 'jacket' },
    4: { type: 'accessory', item: 'glasses' },
    5: { type: 'animation', item: 'celebrate' }
  };

  const unlock = unlockMap[level];
  if (!unlock) return null;

  let unlockInfo = null;

  if (unlock.type === 'accessory') {
    if (!this.accessories[unlock.item].unlocked) {
      this.accessories[unlock.item].unlocked = true;
      this.accessories[unlock.item].equipped = true;
      unlockInfo = { type: 'accessory', item: unlock.item, level };
    }
  } else if (unlock.type === 'animation') {
    if (!this.animations[unlock.item].unlocked) {
      this.animations[unlock.item].unlocked = true;
      unlockInfo = { type: 'animation', item: unlock.item, level };
    }
  }

  if (unlockInfo) {
    this.unlockHistory.push({
      item: unlock.item,
      unlockedAt: new Date(),
      level
    });
  }

  return unlockInfo;
};

/**
 * Helper: get "YYYY-MM-DD" for a Date in local timezone
 */
function toDateStr(d) {
  const dt = new Date(d);
  return dt.getFullYear() + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0');
}

/**
 * Helper: Check if a date is Sunday (0 = Sunday)
 */
function isSunday(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay() === 0;
}

/**
 * Helper: count calendar days between two "YYYY-MM-DD" strings
 */
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * 7-Day Cycle Streak Update (Strict Calendar Weekly Schedule)
 * 
 * Monday = Day 1, Tuesday = Day 2, ..., Saturday = Day 6, Sunday = Day 7 (Holiday)
 * - Users MUST be active on the specific calendar days they visit.
 * - Missing a day resets the continuous streak counter, but the visual cycle progress
 *   is strictly tied to the current week's Monday-Sunday calendar layout.
 */
avatarSchema.methods.updateStreak = async function () {
  const todayStr = toDateStr(new Date());
  const todayDateObj = new Date(todayStr + 'T12:00:00');
  
  // Convert 0=Sun, 1=Mon... to 1=Mon, ..., 7=Sun
  let currentWeekday = todayDateObj.getDay();
  currentWeekday = currentWeekday === 0 ? 7 : currentWeekday;
  if (this.lastStreakDate === todayStr) {
    await this.save();
    return this.getStreakStatus();
  }

  const todayIsSunday = currentWeekday === 7;

  // ── Case 2: Today is Sunday (Holiday) ──
  if (todayIsSunday) {
    if (this.streakActive) {
      this.lastStreakDate = todayStr;
      this.lastActivityDate = new Date();
      if (!this.sundayHolidays) this.sundayHolidays = [];
      if (!this.sundayHolidays.includes(todayStr)) this.sundayHolidays.push(todayStr);
    } else {
      this.streakActive = true;
      this.streakStartDate = new Date();
      this.lastStreakDate = todayStr;
      this.lastActivityDate = new Date();
    }
    
    // Set internal cycle tracking to exactly Sunday (Day 7)
    this.streakCycleDay = 7; 
    await this.save();
    return this.getStreakStatus();
  }

  // ── Case 3: We are on an Activity Day (Mon-Sat) ──
  const gap = this.lastStreakDate ? daysBetween(this.lastStreakDate, todayStr) : null;
  const lastDateObj = this.lastStreakDate ? new Date(this.lastStreakDate + 'T12:00:00') : null;
  const lastWasSunday = lastDateObj ? lastDateObj.getDay() === 0 : false;
  const lastWasSaturday = lastDateObj ? lastDateObj.getDay() === 6 : false;

  let validSequence = false;
  if (gap === 1) {
    validSequence = true; // normal consecutive day
  } else if (gap === 2 && lastWasSaturday) {
    validSequence = true; // graceful skip over Sunday
  }

  // If previous activity was from a different week entirely, we implicitly reset the cycle tracking
  let isNewWeek = false;
  if (gap && gap >= currentWeekday) {
     isNewWeek = true;
  }

  // ── Broken Streak: missed days within a week or crossed weeks without preserving ──
  if (!this.streakActive || !validSequence) {
    this._resetStreak();
    this.streakActive = true;
    this.streakStartDate = new Date();
    this.lastStreakDate = todayStr;
    this.lastActivityDate = new Date();
    this.streakCycleDay = currentWeekday; // Strictly assign to actual day of week
    this.streak = 1;
    await this.save();
    return this.getStreakStatus();
  }

  // ── Continue an active streak ──
  // Check if they successfully completed the ENTIRE week (Mon-Sat)
  if (this.streakCycleDay === 6 && currentWeekday === 1 && validSequence) {
    // Starting a new week after completing the previous 6-day stretch!
    this.streakHistory.push({
      cycleNumber: this.streakCyclesCompleted + 1,
      startDate: this.streakStartDate,
      endDate: new Date(),
      completedAt: new Date()
    });
    this.streakCyclesCompleted += 1;
    this.streakStartDate = new Date();
  }

  // Visually lock the cycle to exactly what day of the week it is
  this.streakCycleDay = currentWeekday;
  
  this.lastStreakDate = todayStr;
  this.lastActivityDate = new Date();
  this.streak = this.streakCyclesCompleted * 6 + this.streakCycleDay;

  await this.save();
  return this.getStreakStatus();
};

/**
 * Reset streak to zero (internal helper)
 */
avatarSchema.methods._resetStreak = function () {
  this.streakCycleDay = 0;
  this.streakCyclesCompleted = 0;
  this.streakActive = false;
  this.streakStartDate = null;
  this.streak = 0;
};

/**
 * Get full streak status for the API response (Sunday-based strict calendar)
 */
avatarSchema.methods.getStreakStatus = function () {
  const cyclesCompleted = this.streakCyclesCompleted || 0;
  
  // What calendar day is it actually right now?
  const todayStr = toDateStr(new Date());
  const todayDateObj = new Date(todayStr + 'T12:00:00');
  let currentWeekday = todayDateObj.getDay();
  currentWeekday = currentWeekday === 0 ? 7 : currentWeekday; // 1=Mon ... 7=Sun

  // Evaluate the actual continuous streak number logically
  // If the last activity is from before this week (and they missed days),
  // they only have a streak of what they completed this week, or 0.
  const gap = this.lastStreakDate ? daysBetween(this.lastStreakDate, todayStr) : null;
  let activeStreakCount = 0;
  
  // NEW users (registered today) should have 1 day streak, not the cycle day
  const isNewStreakToday = this.streakStartDate && toDateStr(this.streakStartDate) === todayStr;
  
  if (isNewStreakToday) {
    // New user who registered today - only 1 day
    activeStreakCount = 1;
  } else if (this.streakActive && gap !== null && gap <= 2) {
      activeStreakCount = (cyclesCompleted * 6) + (this.streakCycleDay === 7 ? 6 : this.streakCycleDay);
  }

  // Check if today is Sunday
  const todayIsSunday = currentWeekday === 7;
  const lastWasSunday = this.lastStreakDate ? isSunday(this.lastStreakDate) : false;
  const isHoliday = todayIsSunday && this.streakActive;
  
  // Days until next Sunday
  const daysUntilSunday = 7 - currentWeekday;

  // Build a visual progress array specifically for Mon-Sun fixed boxes!
  const cycleProgress = [];
  
  // Is this specific user active continuously in the CURRENT week?
  // For NEW users (registered today), they shouldn't have past days marked as completed
  const hasConsecutiveDays = gap !== null && gap <= 2 && this.streakActive;
  const hasActiveWeeklyStreak = hasConsecutiveDays && !isNewStreakToday;

  // Build Mon -> Sat blocks
  for (let i = 1; i <= 6; i++) {
    if (i < currentWeekday) {
       // Past days in the current week
       // NEW users (registered today) should have past days as missed
       if (isNewStreakToday) {
          cycleProgress.push('missed');
       } else if (hasActiveWeeklyStreak && this.streakCycleDay >= i) {
          cycleProgress.push('completed');
       } else {
          // They missed this day earlier in the current week
          cycleProgress.push('missed'); 
       }
    } else if (i === currentWeekday && !todayIsSunday) {
       // Today!
       cycleProgress.push('current');
    } else {
       // Future days in current week
       cycleProgress.push('pending');
    }
  }
  
  // Add Sunday (holiday) status
  if (currentWeekday === 7) {
    cycleProgress.push('holiday'); // Currently enjoying holiday
  } else if (gap === 0 && todayIsSunday) {
    cycleProgress.push('holiday'); // Claimed holiday
  } else {
    cycleProgress.push('holiday-pending'); // Holiday is in the future
  }

  return {
    cycleDay: currentWeekday, // Visual cycle always aligns with current weekday
    isHoliday,
    isActive: this.streakActive,
    cyclesCompleted,
    totalStreakDays: activeStreakCount,
    daysUntilHoliday: daysUntilSunday,
    cycleProgress,
    lastStreakDate: this.lastStreakDate,
    streakStartDate: this.streakStartDate
  };
};

/**
 * Calculate user's overall average progress across all active CourseEnrollment records
 * and translate it into a milestone level/tier.
 */
avatarSchema.methods.calculateMilestone = async function () {
  const CourseEnrollment = mongoose.model('CourseEnrollment');
  const enrollments = await CourseEnrollment.find({
    student: this.userId,
    status: { $in: ['enrolled', 'in_progress', 'completed'] }
  });

  if (!enrollments || enrollments.length === 0) {
    return {
      averageProgress: 0,
      milestone: 'Beginner'
    };
  }

  const totalProgress = enrollments.reduce((sum, e) => sum + (e.progress || 0), 0);
  const averageProgress = Math.round(totalProgress / enrollments.length);

  let milestone = 'Beginner';
  if (averageProgress >= 75) {
    milestone = 'Job-ready/Professional';
  } else if (averageProgress >= 50) {
    milestone = 'Master';
  } else if (averageProgress >= 25) {
    milestone = 'Intermediate';
  }

  return {
    averageProgress,
    milestone
  };
};

// Static method to get or create avatar for user
avatarSchema.statics.getOrCreate = async function (userId) {
  let avatar = await this.findOne({ userId });

  if (!avatar) {
    avatar = await this.create({
      userId,
      level: 1,
      xp: 0
    });
  }

  return avatar;
};

// Ensure virtuals are included in JSON output
avatarSchema.set('toJSON', { virtuals: true });
avatarSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Avatar', avatarSchema);
