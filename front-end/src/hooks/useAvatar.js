/**
 * Avatar Hook - useAvatar
 * Custom hook for managing avatar state and API interactions
 * 
 * Features:
 * - Fetch avatar data from backend
 * - Handle XP additions and level-ups
 * - Toggle accessories
 * - Trigger celebrations
 * - Update streak
 */

import { useState, useEffect, useCallback } from 'react';

// API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Custom hook for avatar management
 */
export const useAvatar = () => {
  const [avatarData, setAvatarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [newUnlock, setNewUnlock] = useState(null);

  // Get auth token from session storage
  const getAuthToken = () => {
    return sessionStorage.getItem('token');
  };

  // API request helper
  const apiRequest = async (endpoint, options = {}) => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  };

  /**
   * Fetch avatar data from backend
   */
  const fetchAvatar = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest('/avatar');

      if (response.success) {
        setAvatarData(response.data);
      }
    } catch (err) {
      console.error('Error fetching avatar:', err);
      setError(err.message);

      // Set default avatar data for offline/error state
      setAvatarData({
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        baseModel: '',
        accessories: {
          shoes: { unlocked: false, equipped: false, modelUrl: null },
          jacket: { unlocked: false, equipped: false, modelUrl: null },
          glasses: { unlocked: false, equipped: false, modelUrl: null }
        },
        animations: {
          idle: { unlocked: true, url: null },
          celebrate: { unlocked: false, url: null }
        },
        currentAnimation: 'idle'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add XP and check for level-ups
   */
  const addXP = useCallback(async (amount, source = 'activity') => {
    try {
      const response = await apiRequest('/avatar/add-xp', {
        method: 'POST',
        body: JSON.stringify({ amount, source })
      });

      if (response.success) {
        // Check for new unlocks
        if (response.data.unlocks && response.data.unlocks.length > 0) {
          // Trigger celebration for each unlock
          response.data.unlocks.forEach((unlock, index) => {
            setTimeout(() => {
              setNewUnlock(unlock);
              triggerCelebration();
            }, index * 2000); // Stagger celebrations
          });
        }

        // Update local state
        setAvatarData(prev => ({
          ...prev,
          xp: response.data.currentXP,
          xpToNextLevel: response.data.xpToNextLevel,
          level: response.data.level,
          levelProgress: response.data.levelProgress
        }));

        return response.data;
      }
    } catch (err) {
      console.error('Error adding XP:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Manual level up (for testing/admin)
   */
  const levelUp = useCallback(async () => {
    try {
      const response = await apiRequest('/avatar/level-up', {
        method: 'POST'
      });

      if (response.success) {
        triggerCelebration();

        if (response.data.unlocks && response.data.unlocks.length > 0) {
          setNewUnlock(response.data.unlocks[0]);
        }

        // Refetch avatar data
        await fetchAvatar();

        return response.data;
      }
    } catch (err) {
      console.error('Error leveling up:', err);
      setError(err.message);
    }
  }, [fetchAvatar]);

  /**
   * Toggle an accessory on/off
   */
  const toggleAccessory = useCallback(async (accessory) => {
    try {
      const response = await apiRequest('/avatar/toggle-accessory', {
        method: 'POST',
        body: JSON.stringify({ accessory })
      });

      if (response.success) {
        // Update local state
        setAvatarData(prev => ({
          ...prev,
          accessories: {
            ...prev.accessories,
            [accessory]: {
              ...prev.accessories[accessory],
              equipped: response.data.equipped
            }
          }
        }));

        return response.data;
      }
    } catch (err) {
      console.error('Error toggling accessory:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Set current animation
   */
  const setAnimation = useCallback(async (animation) => {
    try {
      const response = await apiRequest('/avatar/set-animation', {
        method: 'POST',
        body: JSON.stringify({ animation })
      });

      if (response.success) {
        setAvatarData(prev => ({
          ...prev,
          currentAnimation: animation
        }));

        return response.data;
      }
    } catch (err) {
      console.error('Error setting animation:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Update daily streak (7-day cycle)
   */
  const updateStreak = useCallback(async () => {
    try {
      const response = await apiRequest('/avatar/update-streak', {
        method: 'POST'
      });

      if (response.success) {
        setAvatarData(prev => ({
          ...prev,
          streak: response.data.streak,
          streakStatus: {
            cycleDay: response.data.cycleDay,
            isHoliday: response.data.isHoliday,
            isActive: response.data.isActive,
            cyclesCompleted: response.data.cyclesCompleted,
            totalStreakDays: response.data.totalStreakDays,
            daysUntilHoliday: response.data.daysUntilHoliday,
            cycleProgress: response.data.cycleProgress,
            lastStreakDate: response.data.lastStreakDate,
            streakStartDate: response.data.streakStartDate
          },
          xp: response.data.xp,
          level: response.data.level
        }));

        // Bonus XP celebration
        if (response.data.bonusXP > 0) {
          triggerCelebration();
        }

        return response.data;
      }
    } catch (err) {
      console.error('Error updating streak:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Fetch streak status (read-only, no mutation)
   */
  const fetchStreakStatus = useCallback(async () => {
    try {
      const response = await apiRequest('/avatar/streak-status');
      if (response.success) {
        setAvatarData(prev => ({
          ...prev,
          streak: response.data.streak,
          streakStatus: {
            cycleDay: response.data.cycleDay,
            isHoliday: response.data.isHoliday,
            isActive: response.data.isActive,
            cyclesCompleted: response.data.cyclesCompleted,
            totalStreakDays: response.data.totalStreakDays,
            daysUntilHoliday: response.data.daysUntilHoliday,
            cycleProgress: response.data.cycleProgress,
            lastStreakDate: response.data.lastStreakDate,
            streakStartDate: response.data.streakStartDate
          }
        }));
        return response.data;
      }
    } catch (err) {
      console.error('Error fetching streak status:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Get unlock status
   */
  const getUnlockStatus = useCallback(async () => {
    try {
      const response = await apiRequest('/avatar/unlock-status');
      return response.data;
    } catch (err) {
      console.error('Error getting unlock status:', err);
      setError(err.message);
      return null;
    }
  }, []);

  /**
   * Set base model URL (Ready Player Me)
   */
  const setBaseModel = useCallback(async (modelUrl) => {
    try {
      const response = await apiRequest('/avatar/set-base-model', {
        method: 'POST',
        body: JSON.stringify({ modelUrl })
      });

      if (response.success) {
        setAvatarData(prev => ({
          ...prev,
          baseModel: modelUrl
        }));

        return response.data;
      }
    } catch (err) {
      console.error('Error setting base model:', err);
      setError(err.message);
    }
  }, []);

  /**
   * Trigger celebration animation
   */
  const triggerCelebration = useCallback((duration = 3000) => {
    setCelebrating(true);
    setTimeout(() => {
      setCelebrating(false);
      setNewUnlock(null);
    }, duration);
  }, []);

  /**
   * Clear new unlock notification
   */
  const clearUnlock = useCallback(() => {
    setNewUnlock(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  return {
    // State
    avatarData,
    loading,
    error,
    celebrating,
    newUnlock,

    // Actions
    fetchAvatar,
    addXP,
    levelUp,
    toggleAccessory,
    setAnimation,
    updateStreak,
    fetchStreakStatus,
    getUnlockStatus,
    setBaseModel,
    triggerCelebration,
    clearUnlock
  };
};

export default useAvatar;
