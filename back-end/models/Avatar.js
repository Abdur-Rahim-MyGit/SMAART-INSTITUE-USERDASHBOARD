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

  // Streak for daily logins/activities
  streak: {
    type: Number,
    default: 0
  },

  // Last activity date for streak calculation
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
avatarSchema.virtual('levelProgress').get(function() {
  return Math.min(100, Math.round((this.xp / this.xpToNextLevel) * 100));
});

// Method to add XP and handle level-ups
avatarSchema.methods.addXP = async function(amount) {
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
avatarSchema.methods.processLevelUnlock = function(level) {
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

// Method to update streak
avatarSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActivity = new Date(this.lastActivityDate);
  const diffDays = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    // Consecutive day - increase streak
    this.streak += 1;
  } else if (diffDays > 1) {
    // Streak broken
    this.streak = 1;
  }
  // If same day, don't change streak
  
  this.lastActivityDate = now;
  await this.save();
  return this.streak;
};

// Static method to get or create avatar for user
avatarSchema.statics.getOrCreate = async function(userId) {
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
