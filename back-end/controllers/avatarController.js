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
 * Update daily streak (call on user login/activity)
 */
exports.updateStreak = async (req, res) => {
  try {
    const userId = req.user.id;

    const avatar = await Avatar.getOrCreate(userId);
    const newStreak = await avatar.updateStreak();

    // Bonus XP for streak milestones
    let bonusXP = 0;
    let isMilestone = false;
    
    if (newStreak % 30 === 0) {
      bonusXP = 200; // Monthly streak bonus
      isMilestone = true;
      await avatar.addXP(bonusXP);
    } else if (newStreak % 7 === 0) {
      bonusXP = 50; // Weekly streak bonus
      isMilestone = true;
      await avatar.addXP(bonusXP);
    }

    // Send notification for streak milestones
    if (isMilestone) {
      try {
        await notifyStreakMilestone(userId, newStreak, bonusXP);
        console.log(`🔔 Notification sent for ${newStreak} day streak milestone`);
      } catch (notifyError) {
        console.error("⚠️ Error sending streak notification:", notifyError);
      }    }

    res.json({
      success: true,
      data: {
        streak: newStreak,
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
