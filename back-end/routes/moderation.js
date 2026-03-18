const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const CommunityPost = require('../models/CommunityPost');
const ModerationLog = require('../models/ModerationLog');

// Trace incoming requests to verify router reachability
router.use((req, res, next) => {
  console.log('[MODERATION ROUTER]', req.method, req.path, 'user:', req.user?.role);
  next();
});

// All moderation actions require moderator/admin role (protect already ran upstream)
router.use(requireRole('moderator', 'admin'));

// Utility to record a moderation action
const logAction = async ({ action, actorId, targetId, postId, reason }) => {
  const payload = {
    action,
    actorId: actorId || new mongoose.Types.ObjectId(),
    targetId,
    reason
  };
  if (postId) {
    payload.postId = new mongoose.Types.ObjectId(postId);
  }
  await ModerationLog.create(payload);
};

// POST /moderation/warn/:userId
router.post('/warn/:userId', async (req, res) => {
  try {
    console.log('[WARN ROUTE HIT]', req.params);
    const { userId } = req.params;
    const { reason = 'Policy violation' } = req.body;
    console.log('[WARN] looking up user:', userId);

    let target = await User.findById(userId);
    if (!target) target = await Student.findById(userId);
    if (!target) target = await Teacher.findById(userId);
    if (!target) target = await Registration.findById(userId);

    console.log('[WARN] user found:', target ? target.fullName : 'NOT FOUND');
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await logAction({
      action: 'warn',
      actorId: req.user?._id || req.user?.id || new mongoose.Types.ObjectId(),
      targetId: target._id,
      reason
    });

    res.json({ success: true, message: 'Warning issued', userId: target._id });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error issuing warning:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /moderation/suspend/:userId
router.post('/suspend/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { until, durationDays = 7, reason = 'Policy violation' } = req.body;

    console.log('[SUSPEND] looking up user:', userId);

    let target = await User.findById(userId);
    if (!target) target = await Student.findById(userId);
    if (!target) target = await Teacher.findById(userId);
    if (!target) target = await Registration.findById(userId);

    console.log('[SUSPEND] user found:', target ? target.fullName : 'NOT FOUND');
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
      actorId: req.user?._id || req.user?.id || new mongoose.Types.ObjectId(),
      targetId: target._id,
      reason: `${reason} (until ${untilDate.toISOString()})`
    });

    res.json({ success: true, message: 'User suspended', userId: target._id, suspendedUntil: untilDate });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error suspending user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /moderation/post/:postId
router.delete('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    let postObjectId;
    try {
      postObjectId = new mongoose.Types.ObjectId(postId);
    } catch (castError) {
      return res.status(400).json({ success: false, error: 'Invalid postId' });
    }

    const post = await CommunityPost.findById(postObjectId);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await CommunityPost.deleteOne({ _id: postObjectId });

    await logAction({
      action: 'delete_post',
      actorId: req.user?._id || req.user?.id || new mongoose.Types.ObjectId(),
      targetId: post.author,
      postId,
      reason: req.body.reason || 'Removed by moderator'
    });

    res.json({ success: true, message: 'Post removed by moderator' });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error deleting post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /moderation/escalate/:postId
router.post('/escalate/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    let postObjectId;
    try {
      postObjectId = new mongoose.Types.ObjectId(postId);
    } catch (castError) {
      return res.status(400).json({ success: false, error: 'Invalid postId' });
    }
    const { reason = 'Escalated to admin' } = req.body;

    const post = await CommunityPost.findById(postObjectId);
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
      actorId: req.user?._id || req.user?.id || new mongoose.Types.ObjectId(),
      targetId: post.author,
      postId: postObjectId,
      reason
    });

    res.json({ success: true, message: 'Post escalated to admin', postId });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error escalating post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
