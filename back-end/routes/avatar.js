/**
 * Avatar Routes
 * API endpoints for the 3D Avatar Level-Based Unlock System
 */

const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/avatar
 * @desc    Get current user's avatar state
 * @access  Private
 */
router.get('/', avatarController.getAvatar);

/**
 * @route   GET /api/avatar/unlock-status
 * @desc    Get what's unlocked and what's coming next
 * @access  Private
 */
router.get('/unlock-status', avatarController.getUnlockStatus);

/**
 * @route   POST /api/avatar/level-up
 * @desc    Manually trigger level up
 * @access  Private
 */
router.post('/level-up', avatarController.levelUp);

/**
 * @route   POST /api/avatar/add-xp
 * @desc    Add XP points
 * @access  Private
 * @body    { amount: Number, source?: String }
 */
router.post('/add-xp', avatarController.addXP);

/**
 * @route   POST /api/avatar/toggle-accessory
 * @desc    Toggle accessory on/off
 * @access  Private
 * @body    { accessory: 'shoes' | 'jacket' | 'glasses' }
 */
router.post('/toggle-accessory', avatarController.toggleAccessory);

/**
 * @route   POST /api/avatar/set-animation
 * @desc    Set current animation
 * @access  Private
 * @body    { animation: 'idle' | 'celebrate' | 'wave' | 'dance' }
 */
router.post('/set-animation', avatarController.setAnimation);

/**
 * @route   GET /api/avatar/streak-status
 * @desc    Get current streak status (7-day cycle)
 * @access  Private
 */
router.get('/streak-status', avatarController.getStreakStatus);

/**
 * @route   POST /api/avatar/update-streak
 * @desc    Update daily streak (7-day cycle system)
 * @access  Private
 */
router.post('/update-streak', avatarController.updateStreak);

/**
 * @route   POST /api/avatar/set-base-model
 * @desc    Set Ready Player Me base avatar URL
 * @access  Private
 * @body    { modelUrl: String }
 */
router.post('/set-base-model', avatarController.setBaseModel);

module.exports = router;
