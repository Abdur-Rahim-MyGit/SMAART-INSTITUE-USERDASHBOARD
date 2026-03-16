const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
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
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ success: false, error: 'Failed to load moderation queue' });
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
    console.error('Error updating moderation resolution:', error);
    res.status(500).json({ success: false, error: 'Failed to update moderation resolution' });
  }
});

module.exports = router;
