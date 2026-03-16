const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const CommunityPost = require('../models/CommunityPost');
const ModerationLog = require('../models/ModerationLog');

// All moderation actions require auth + moderator/admin role
router.use(protect, requireRole('moderator', 'admin'));

// Utility to record a moderation action
const logAction = async ({ action, actorId, targetId, postId, reason }) => {
  await ModerationLog.create({ action, actorId, targetId, postId, reason });
};

// POST /moderation/warn/:userId
router.post('/warn/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Policy violation' } = req.body;

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await logAction({
      action: 'warn',
      actorId: req.user._id,
      targetId: target._id,
      reason
    });

    res.json({ success: true, message: 'Warning issued', userId: target._id });
  } catch (error) {
    console.error('Error issuing warning:', error);
    res.status(500).json({ success: false, error: 'Failed to issue warning' });
  }
});

// POST /moderation/suspend/:userId
router.post('/suspend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { until, durationDays = 7, reason = 'Policy violation' } = req.body;

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const untilDate = until ? new Date(until) : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    if (Number.isNaN(untilDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid suspension date' });
    }

    target.suspendedUntil = untilDate;
    target.status = 'suspended';
    await target.save();

    await logAction({
      action: 'suspend',
      actorId: req.user._id,
      targetId: target._id,
      reason: `${reason} (until ${untilDate.toISOString()})`
    });

    res.json({ success: true, message: 'User suspended', userId: target._id, suspendedUntil: untilDate });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({ success: false, error: 'Failed to suspend user' });
  }
});

// DELETE /moderation/post/:postId
router.delete('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await CommunityPost.deleteOne({ _id: postId });

    await logAction({
      action: 'delete_post',
      actorId: req.user._id,
      targetId: post.author,
      postId,
      reason: req.body.reason || 'Removed by moderator'
    });

    res.json({ success: true, message: 'Post removed by moderator' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: 'Failed to delete post' });
  }
});

// POST /moderation/escalate/:postId
router.post('/escalate/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason = 'Escalated to admin' } = req.body;

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    post.flaggedAt = post.flaggedAt || new Date();
    post.flagReason = reason;
    post.moderatorId = req.user._id;
    post.resolution = post.resolution || { status: 'pending' };
    post.resolution.status = 'actioned';
    post.resolution.notes = reason;
    post.resolution.resolvedAt = new Date();
    post.status = 'hidden';

    await post.save();

    await logAction({
      action: 'escalate',
      actorId: req.user._id,
      targetId: post.author,
      postId,
      reason
    });

    res.json({ success: true, message: 'Post escalated to admin', postId });
  } catch (error) {
    console.error('Error escalating post:', error);
    res.status(500).json({ success: false, error: 'Failed to escalate post' });
  }
});

module.exports = router;
