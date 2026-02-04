/**
 * Avatar Service
 * API service for avatar-related operations
 */

import { apiCall } from './api';

/**
 * Avatar API Service
 */
const avatarService = {
  /**
   * Fetch current user's avatar data
   */
  getAvatar: async () => {
    return apiCall('/avatar');
  },

  /**
   * Get unlock status and upcoming unlocks
   */
  getUnlockStatus: async () => {
    return apiCall('/avatar/unlock-status');
  },

  /**
   * Add XP points
   * @param {number} amount - Amount of XP to add
   * @param {string} source - Source of XP (e.g., 'assessment', 'course', 'daily')
   */
  addXP: async (amount, source = 'activity') => {
    return apiCall('/avatar/add-xp', {
      method: 'POST',
      body: JSON.stringify({ amount, source })
    });
  },

  /**
   * Manually trigger level up
   */
  levelUp: async () => {
    return apiCall('/avatar/level-up', {
      method: 'POST'
    });
  },

  /**
   * Toggle accessory equipped state
   * @param {string} accessory - 'shoes' | 'jacket' | 'glasses'
   */
  toggleAccessory: async (accessory) => {
    return apiCall('/avatar/toggle-accessory', {
      method: 'POST',
      body: JSON.stringify({ accessory })
    });
  },

  /**
   * Set current animation
   * @param {string} animation - 'idle' | 'celebrate' | 'wave' | 'dance'
   */
  setAnimation: async (animation) => {
    return apiCall('/avatar/set-animation', {
      method: 'POST',
      body: JSON.stringify({ animation })
    });
  },

  /**
   * Update daily streak
   */
  updateStreak: async () => {
    return apiCall('/avatar/update-streak', {
      method: 'POST'
    });
  },

  /**
   * Set Ready Player Me base avatar model
   * @param {string} modelUrl - GLB model URL
   */
  setBaseModel: async (modelUrl) => {
    return apiCall('/avatar/set-base-model', {
      method: 'POST',
      body: JSON.stringify({ modelUrl })
    });
  }
};

/**
 * XP Rewards Configuration
 * Use these constants when awarding XP throughout the app
 */
export const XP_REWARDS = {
  // Assessments
  COMPLETE_ASSESSMENT: 50,
  ASSESSMENT_HIGH_SCORE: 25, // Bonus for 80%+ score

  // Courses
  COMPLETE_LESSON: 20,
  COMPLETE_MODULE: 50,
  COMPLETE_COURSE: 200,

  // Daily Activities
  DAILY_LOGIN: 10,
  STREAK_BONUS_7_DAYS: 50,
  STREAK_BONUS_30_DAYS: 200,

  // Community
  CREATE_POST: 15,
  HELPFUL_REPLY: 10,

  // Vision Board
  CREATE_VISION_BOARD: 30,
  UPDATE_VISION_BOARD: 10,

  // Profile
  COMPLETE_PROFILE: 50,
  UPLOAD_AVATAR: 25
};

/**
 * Helper to award XP from different parts of the app
 */
export const awardXP = async (rewardType, customAmount = null) => {
  const amount = customAmount || XP_REWARDS[rewardType] || 0;

  if (amount > 0) {
    try {
      const result = await avatarService.addXP(amount, rewardType);
      return result;
    } catch (error) {
      console.error('Error awarding XP:', error);
      return null;
    }
  }
  return null;
};

export default avatarService;
