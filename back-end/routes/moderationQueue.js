const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const ModerationLog = require('../models/ModerationLog');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');

// All moderation queue routes require authentication + moderator/admin role
router.use(protect, requireRole('moderator', 'admin'));

// GET /moderation/queue?status=pending|reviewed|actioned&page=1&limit=10
router.get('/queue', async (req, res) => {
  try {
    const {
      status = 'pending',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {
      flaggedAt: { $exists: true },
      'resolution.status': status
    };

    const currentPage = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

    const [items, total] = await Promise.all([
      CommunityPost.find(query)
        .sort({ flaggedAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      CommunityPost.countDocuments(query)
    ]);

    // Hydrate author info (name + suspension status)
    const User = require('../models/User');
    const Student = require('../models/Student');
    const Teacher = require('../models/Teacher');
    const Registration = require('../models/Registration');

    const authorIds = [...new Set(items.map(i => i.author?.toString()).filter(Boolean))];
    const authorMap = new Map();

    if (authorIds.length > 0) {
      const [users, students, teachers, regs] = await Promise.all([
        User.find({ _id: { $in: authorIds } }).select('fullName email status suspendedUntil').lean(),
        Student.find({ _id: { $in: authorIds } }).select('fullName email status suspendedUntil').lean(),
        Teacher.find({ _id: { $in: authorIds } }).select('fullName email status suspendedUntil').lean(),
        Registration.find({ _id: { $in: authorIds } }).select('fullName email status suspendedUntil').lean(),
      ]);
      [...users, ...students, ...teachers, ...regs].forEach(a => authorMap.set(a._id.toString(), a));
    }

    items.forEach(item => {
      const id = item.author?.toString();
      if (id && authorMap.has(id)) {
        item.author = authorMap.get(id);
      }
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /moderation/queue/:id/resolution to transition status and add notes
router.patch('/queue/:id/resolution', async (req, res) => {
  try {
    const { status, notes, hide } = req.body;

    if (!['reviewed', 'actioned'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status transition' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post || !post.flaggedAt) {
      return res.status(404).json({ success: false, error: 'Flagged post not found' });
    }

    const currentStatus = post.resolution?.status || 'pending';
    const allowedNext = currentStatus === 'pending'
      ? ['reviewed', 'actioned']
      : currentStatus === 'reviewed'
        ? ['actioned']
        : [];

    if (!allowedNext.includes(status)) {
      return res.status(400).json({ success: false, error: `Cannot transition from ${currentStatus} to ${status}` });
    }

    post.resolution.status = status;
    if (notes) {
      post.resolution.notes = notes;
    }
    post.moderatorId = req.user._id;

    if (status === 'actioned') {
      post.resolution.resolvedAt = new Date();
      if (hide === true) {
        post.status = 'hidden';
      }
    }

    await post.save();

    res.json({ success: true, data: post });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error updating moderation resolution:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /moderation/queue/:postId/dismiss
router.post('/queue/:postId/dismiss', async (req, res) => {
  try {
    const { postId } = req.params;
    let postObjectId;
    try {
      postObjectId = new mongoose.Types.ObjectId(postId);
    } catch (castError) {
      return res.status(400).json({ success: false, error: 'Invalid postId' });
    }

    const post = await CommunityPost.findById(postObjectId);
    if (!post || !post.flaggedAt) {
      return res.status(404).json({ success: false, error: 'Flagged post not found' });
    }

    post.resolution = post.resolution || {};
    post.resolution.status = 'actioned';
    post.resolution.resolvedAt = new Date();
    post.moderatorId = req.user._id;

    await post.save();

    await ModerationLog.create({
      action: 'dismissed',
      actorId: req.user?._id || req.user?.id || new mongoose.Types.ObjectId(),
      targetId: post.author,
      postId: postObjectId,
      reason: 'Post dismissed from moderation queue'
    });

    res.json({ success: true, data: post });
  } catch (error) {
    console.log('[MODERATION ERROR]', error);
    console.error('Error dismissing flagged post:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
