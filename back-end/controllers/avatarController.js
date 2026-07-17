/**
 * Avatar Controller
 * Handles all avatar-related operations including:
 * - Fetching avatar state
 * - Level-up processing
 * - XP management
 * - Accessory toggling
 * - Animation changes
 */

const Avatar = require('../models/Avatar');
const User = require('../models/User');
const { notifyLevelUp, notifyStreakMilestone } = require('../services/notificationService');

// Default asset URLs (replace with your actual Cloudinary/S3 URLs)
const DEFAULT_ASSETS = {
  baseModel: 'https://models.readyplayer.me/default-avatar.glb',
  accessories: {
    shoes: 'https://your-storage.com/avatars/accessories/shoes.glb',
    jacket: 'https://your-storage.com/avatars/accessories/jacket.glb',
    glasses: 'https://your-storage.com/avatars/accessories/glasses.glb'
  },
  animations: {
    idle: 'https://your-storage.com/avatars/animations/idle.glb',
    celebrate: 'https://your-storage.com/avatars/animations/celebrate.glb',
    wave: 'https://your-storage.com/avatars/animations/wave.glb',
    dance: 'https://your-storage.com/avatars/animations/dance.glb'
  }
};

/**
 * GET /api/avatar
 * Fetch the current user's avatar state including all unlocks
 */
exports.getAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create avatar for user
    const avatar = await Avatar.getOrCreate(userId);

    // Use req.user which is already typed (Student/Teacher/User/Registration) by protect middleware
    const user = req.user;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Attempt to get gender (a top-level field on the merged student document)
    let gender = user.gender;

    if (!gender && user.email) {
      // Defensive fallback: look the gender up on the student by email.
      const Student = require('../models/Student');
      const normalizedEmail = user.email.toLowerCase().trim();
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const studentDoc = await Student.findOne({
        email: { $regex: new RegExp(`^${escapeRegex(normalizedEmail)}$`, 'i') }
      }).select('gender').lean();
      gender = studentDoc?.gender;
    }

    // Prepare response with only unlocked items
    const milestoneData = await avatar.calculateMilestone();
    const response = {
      success: true,
      data: {
        userId: avatar.userId,
        level: avatar.level,
        xp: avatar.xp,
        xpToNextLevel: avatar.xpToNextLevel,
        levelProgress: avatar.levelProgress,
        streak: avatar.streak,
        streakStatus: avatar.getStreakStatus(),
        averageProgress: milestoneData.averageProgress,
        milestone: milestoneData.milestone,
        baseModel: avatar.baseModel || DEFAULT_ASSETS.baseModel,
        accessories: {
          shoes: {
            unlocked: avatar.accessories.shoes.unlocked,
            equipped: avatar.accessories.shoes.equipped,
            modelUrl: avatar.accessories.shoes.unlocked
              ? (avatar.accessories.shoes.modelUrl || DEFAULT_ASSETS.accessories.shoes)
              : null
          },
          jacket: {
            unlocked: avatar.accessories.jacket.unlocked,
            equipped: avatar.accessories.jacket.equipped,
            modelUrl: avatar.accessories.jacket.unlocked
              ? (avatar.accessories.jacket.modelUrl || DEFAULT_ASSETS.accessories.jacket)
              : null
          },
          glasses: {
            unlocked: avatar.accessories.glasses.unlocked,
            equipped: avatar.accessories.glasses.equipped,
            modelUrl: avatar.accessories.glasses.unlocked
              ? (avatar.accessories.glasses.modelUrl || DEFAULT_ASSETS.accessories.glasses)
              : null
          }
        },
        animations: {
          idle: {
            unlocked: true,
            url: avatar.animations.idle.url || DEFAULT_ASSETS.animations.idle
          },
          celebrate: {
            unlocked: avatar.animations.celebrate.unlocked,
            url: avatar.animations.celebrate.unlocked
              ? (avatar.animations.celebrate.url || DEFAULT_ASSETS.animations.celebrate)
              : null
          }
        },
        currentAnimation: avatar.currentAnimation,
        customization: avatar.customization,
        user: {
          fullName: user?.fullName,
          profileImage: user?.profileImage,
          gender: gender
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch avatar',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/level-up
 * Manually trigger level up (for testing or admin purposes)
 */
exports.levelUp = async (req, res) => {
  try {
    const userId = req.user.id;

    const avatar = await Avatar.getOrCreate(userId);

    // Add enough XP to trigger level up
    const result = await avatar.addXP(avatar.xpToNextLevel);

    // Send notification for level up
    try {
      await notifyLevelUp(userId, result.newLevel, result.unlocks || []);
      console.log(`🔔 Notification sent for level up to ${result.newLevel}`);
    } catch (notifyError) {
      console.error("⚠️ Error sending level up notification:", notifyError);
    }

    res.json({
      success: true,
      message: `Leveled up to ${result.newLevel}!`,
      data: {
        newLevel: result.newLevel,
        unlocks: result.unlocks,
        xp: avatar.xp,
        xpToNextLevel: avatar.xpToNextLevel
      }
    });
  } catch (error) {
    console.error('Error leveling up:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to level up',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/add-xp
 * Add XP points (from completing assessments, courses, etc.)
 */
exports.addXP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, source } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid XP amount'
      });
    }

    const avatar = await Avatar.getOrCreate(userId);
    const previousLevel = avatar.level;
    const result = await avatar.addXP(amount);

    // If user leveled up, send notification
    if (result.newLevel > previousLevel) {
      try {
        await notifyLevelUp(userId, result.newLevel, result.unlocks || []);
        console.log(`🔔 Notification sent for level up to ${result.newLevel}`);
      } catch (notifyError) {
        console.error("⚠️ Error sending level up notification:", notifyError);
      }
    }

    res.json({
      success: true,
      message: `Added ${amount} XP!`,
      data: {
        xpAdded: amount,
        source: source || 'unknown',
        currentXP: avatar.xp,
        xpToNextLevel: avatar.xpToNextLevel,
        levelProgress: avatar.levelProgress,
        level: result.newLevel,
        unlocks: result.unlocks
      }
    });
  } catch (error) {
    console.error('Error adding XP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add XP',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/toggle-accessory
 * Toggle an accessory on/off (if unlocked)
 */
exports.toggleAccessory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accessory } = req.body;

    const validAccessories = ['shoes', 'jacket', 'glasses'];
    if (!validAccessories.includes(accessory)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid accessory type'
      });
    }

    const avatar = await Avatar.getOrCreate(userId);

    if (!avatar.accessories[accessory].unlocked) {
      return res.status(403).json({
        success: false,
        message: `${accessory} is not unlocked yet`
      });
    }

    // Toggle equipped state
    avatar.accessories[accessory].equipped = !avatar.accessories[accessory].equipped;
    await avatar.save();

    res.json({
      success: true,
      message: `${accessory} ${avatar.accessories[accessory].equipped ? 'equipped' : 'unequipped'}`,
      data: {
        accessory,
        equipped: avatar.accessories[accessory].equipped
      }
    });
  } catch (error) {
    console.error('Error toggling accessory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle accessory',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/set-animation
 * Set the current animation (if unlocked)
 */
exports.setAnimation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animation } = req.body;

    const validAnimations = ['idle', 'celebrate', 'wave', 'dance'];
    if (!validAnimations.includes(animation)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid animation type'
      });
    }

    const avatar = await Avatar.getOrCreate(userId);

    if (!avatar.animations[animation].unlocked) {
      return res.status(403).json({
        success: false,
        message: `${animation} animation is not unlocked yet`
      });
    }

    avatar.currentAnimation = animation;
    await avatar.save();

    res.json({
      success: true,
      message: `Animation set to ${animation}`,
      data: {
        currentAnimation: animation
      }
    });
  } catch (error) {
    console.error('Error setting animation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set animation',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/update-streak
 * Update daily streak using Sunday-based weekly cycle system
 * Cycle = 6 activity days (Mon-Sat) + Sunday as mandatory holiday
 * 
 * NOTE: Streak data is stored in both Avatar AND Registration models
 * for comprehensive student tracking
 */
exports.updateStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get previous cycles completed before update
    const avatarBefore = await Avatar.findOne({ userId });
    const prevCyclesCompleted = avatarBefore?.streakCyclesCompleted || 0;

    const avatar = await Avatar.getOrCreate(userId);
    const streakStatus = await avatar.updateStreak();

    // Also mirror streak data onto the merged student document for student tracking
    const Student = require('../models/Student');
    const user = await User.findById(userId);
    const streakData = {
      streakCycleDay: avatar.streakCycleDay,
      streakCyclesCompleted: avatar.streakCyclesCompleted,
      streakStartDate: avatar.streakStartDate,
      lastStreakDate: avatar.lastStreakDate,
      streakActive: avatar.streakActive,
      totalStreakDays: streakStatus.totalStreakDays,
      streakHistory: avatar.streakHistory,
      sundayHolidays: avatar.sundayHolidays || []
    };
    const streakFilter = user ? { email: user.email } : { _id: userId };
    await Student.updateOne(streakFilter, { $set: { streakData } });

    // Bonus XP for completing a full week (cycle)
    let bonusXP = 0;
    let isMilestone = false;

    // Check if a new cycle was completed
    if (streakStatus.cyclesCompleted > prevCyclesCompleted) {
      bonusXP = 50; // Week completion bonus
      isMilestone = true;
      await avatar.addXP(bonusXP);
    }

    // Extra bonus for multi-cycle milestones (every 4 weeks)
    if (streakStatus.cyclesCompleted > 0 && streakStatus.cyclesCompleted % 4 === 0 && streakStatus.cycleDay === 1) {
      bonusXP += 200; // Monthly milestone (4 weeks ≈ 28 days)
      isMilestone = true;
      await avatar.addXP(200);
    }

    // Send notification for streak milestones
    if (isMilestone) {
      try {
        await notifyStreakMilestone(userId, streakStatus.totalStreakDays, bonusXP);
        console.log(`🔔 Streak milestone: ${streakStatus.cyclesCompleted} weeks, +${bonusXP} XP`);
      } catch (notifyError) {
        console.error("⚠️ Error sending streak notification:", notifyError);
      }
    }

    res.json({
      success: true,
      data: {
        ...streakStatus,
        streak: avatar.streak,
        bonusXP,
        level: avatar.level,
        xp: avatar.xp
      }
    });
  } catch (error) {
    console.error('Error updating streak:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update streak',
      error: error.message
    });
  }
};

/**
 * GET /api/avatar/streak-status
 * Get the current streak status without modifying it
 * 
 * NOTE: Returns streak data synced from Avatar model
 * Streak data is also available in Registration model for student records
 */
exports.getStreakStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const avatar = await Avatar.getOrCreate(userId);
    const streakStatus = avatar.getStreakStatus();

    // Also get streak data from the merged student document (if available)
    const Student = require('../models/Student');
    const user = await User.findById(userId);
    let registrationStreak = null;

    const streakFilter = user ? { email: user.email } : { _id: userId };
    const studentDoc = await Student.findOne(streakFilter).select('streakData').lean();
    if (studentDoc && studentDoc.streakData) {
      registrationStreak = studentDoc.streakData;
    }

    res.json({
      success: true,
      data: {
        ...streakStatus,
        streak: avatar.streak,
        level: avatar.level,
        xp: avatar.xp,
        // Include registration streak data for reference
        registrationStreakData: registrationStreak
      }
    });
  } catch (error) {
    console.error('Error getting streak status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get streak status',
      error: error.message
    });
  }
};

/**
 * POST /api/avatar/set-base-model
 * Set the Ready Player Me base avatar model URL
 */
exports.setBaseModel = async (req, res) => {
  try {
    const userId = req.user.id;
    const { modelUrl } = req.body;

    if (!modelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Model URL is required'
      });
    }

    const avatar = await Avatar.getOrCreate(userId);
    avatar.baseModel = modelUrl;
    await avatar.save();

    res.json({
      success: true,
      message: 'Base model updated',
      data: {
        baseModel: avatar.baseModel
      }
    });
  } catch (error) {
    console.error('Error setting base model:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set base model',
      error: error.message
    });
  }
};

/**
 * GET /api/avatar/unlock-status
 * Get what's unlocked and what's coming next
 */
exports.getUnlockStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const avatar = await Avatar.getOrCreate(userId);

    const unlockMap = {
      2: { type: 'accessory', item: 'shoes', name: 'Stylish Shoes', icon: '👟' },
      3: { type: 'accessory', item: 'jacket', name: 'Cool Jacket', icon: '🧥' },
      4: { type: 'accessory', item: 'glasses', name: 'Smart Glasses', icon: '👓' },
      5: { type: 'animation', item: 'celebrate', name: 'Celebration Dance', icon: '🎉' }
    };

    const unlockedItems = [];
    const upcomingItems = [];

    for (const [level, unlock] of Object.entries(unlockMap)) {
      const lvl = parseInt(level);
      const isUnlocked = avatar.level >= lvl;

      const item = {
        level: lvl,
        ...unlock,
        unlocked: isUnlocked
      };

      if (isUnlocked) {
        unlockedItems.push(item);
      } else {
        upcomingItems.push(item);
      }
    }

    res.json({
      success: true,
      data: {
        currentLevel: avatar.level,
        xpToNextLevel: avatar.xpToNextLevel,
        levelProgress: avatar.levelProgress,
        unlockedItems,
        upcomingItems,
        nextUnlock: upcomingItems[0] || null
      }
    });
  } catch (error) {
    console.error('Error getting unlock status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unlock status',
      error: error.message
    });
  }
};
