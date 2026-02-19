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
 * Helper: count calendar days between two "YYYY-MM-DD" strings
 */
function daysBetween(dateStrA, dateStrB) {
  const a = new Date(dateStrA + 'T00:00:00');
  const b = new Date(dateStrB + 'T00:00:00');
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * 7-Day Cycle Streak Update
 * 
 * Cycle = 6 activity days + 1 holiday (day 7)
 * - Days 1-6: user MUST be active each consecutive day
 * - Day 7: mandatory holiday, no activity needed
 * - After day 7: new cycle begins at day 1
 * - Missing any day during 1-6: streak resets to zero
 */
avatarSchema.methods.updateStreak = async function () {
  const todayStr = toDateStr(new Date());

  // ── Case 1: Same day ── already counted, just return
  if (this.lastStreakDate === todayStr) {
    await this.save();
    return this.getStreakStatus();
  }

  // ── Case 2: No active streak ── start a brand-new cycle
  if (!this.streakActive || this.streakCycleDay === 0) {
    this.streakCycleDay = 1;
    this.streakActive = true;
    this.streakStartDate = new Date();
    this.lastStreakDate = todayStr;
    this.lastActivityDate = new Date();
    // Update legacy field
    this.streak = this.streakCyclesCompleted * 6 + 1;
    await this.save();
    return this.getStreakStatus();
  }

  // ── We have an active streak, check gap ──
  const gap = daysBetween(this.lastStreakDate, todayStr);

  // Was yesterday the holiday (day 7)?
  if (this.streakCycleDay === 7) {
    // Holiday was day 7. The next valid activity day is day 7+1 gap.
    // gap === 1 means user is here the day after holiday → start new cycle
    if (gap === 1) {
      // Complete the old cycle
      this.streakHistory.push({
        cycleNumber: this.streakCyclesCompleted + 1,
        startDate: this.streakStartDate,
        endDate: new Date(),
        completedAt: new Date()
      });
      this.streakCyclesCompleted += 1;
      // Start new cycle
      this.streakCycleDay = 1;
      this.streakStartDate = new Date();
      this.lastStreakDate = todayStr;
      this.lastActivityDate = new Date();
      this.streak = this.streakCyclesCompleted * 6 + 1;
      await this.save();
      return this.getStreakStatus();
    } else {
      // Missed the day after holiday → reset
      this._resetStreak();
      // But today counts as day 1 of a new streak
      this.streakCycleDay = 1;
      this.streakActive = true;
      this.streakStartDate = new Date();
      this.lastStreakDate = todayStr;
      this.lastActivityDate = new Date();
      this.streak = 1;
      await this.save();
      return this.getStreakStatus();
    }
  }

  // ── Currently on days 1-6 ──
  if (gap === 1) {
    // Consecutive day → advance
    this.streakCycleDay += 1;
    this.lastStreakDate = todayStr;
    this.lastActivityDate = new Date();

    if (this.streakCycleDay === 7) {
      // Reached the holiday! Don't require activity today.
      // The holiday auto-completes. Mark it.
      this.streak = this.streakCyclesCompleted * 6 + 6;
    } else {
      this.streak = this.streakCyclesCompleted * 6 + this.streakCycleDay;
    }

    await this.save();
    return this.getStreakStatus();
  } else {
    // Missed a day during activity period → streak broken
    this._resetStreak();
    // Today starts a new attempt
    this.streakCycleDay = 1;
    this.streakActive = true;
    this.streakStartDate = new Date();
    this.lastStreakDate = todayStr;
    this.lastActivityDate = new Date();
    this.streak = 1;
    await this.save();
    return this.getStreakStatus();
  }
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
 * Get full streak status for the API response
 */
avatarSchema.methods.getStreakStatus = function () {
  const cycleDay = this.streakCycleDay || 0;
  const isHoliday = cycleDay === 7;
  const cyclesCompleted = this.streakCyclesCompleted || 0;
  const totalStreakDays = cyclesCompleted * 6 + (cycleDay > 0 && cycleDay <= 7 ? (cycleDay === 7 ? 6 : cycleDay) : 0);
  const daysUntilHoliday = cycleDay > 0 && cycleDay < 7 ? 7 - cycleDay : 0;

  // Build a visual progress array for 7 days
  const cycleProgress = [];
  for (let i = 1; i <= 7; i++) {
    if (i <= cycleDay) {
      cycleProgress.push(i === 7 ? 'holiday' : 'completed');
    } else if (i === 7) {
      cycleProgress.push('holiday-pending');
    } else {
      cycleProgress.push('pending');
    }
  }

  return {
    cycleDay,
    isHoliday,
    isActive: this.streakActive,
    cyclesCompleted,
    totalStreakDays,
    daysUntilHoliday,
    cycleProgress,
    lastStreakDate: this.lastStreakDate,
    streakStartDate: this.streakStartDate
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
