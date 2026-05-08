const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// ─── Helpers ────────────────────────────────────────────────────────────────

// Check if user can post/manage announcements
const canPost = (role) => ['admin', 'college_admin'].includes(role);
const isAdmin = (role) => role === 'admin';

// Build the visibility filter based on current user
const buildVisibilityFilter = (user) => {
  const now = new Date();
  const baseFilter = {
    $or: [{ expiryDate: null }, { expiryDate: { $gt: now } }]
  };

  if (isAdmin(user.role)) {
    // Admin sees everything
    return baseFilter;
  }

  if (user.role === 'college_admin') {
    // College admin sees: all-target + their own college
    return {
      ...baseFilter,
      $or: [
        { targetType: 'all' },
        { targetType: 'college', targetCollegeIds: user.college?._id || user.college }
      ]
    };
  }

  // Student sees: all-target + announcements for their college
  return {
    ...baseFilter,
    $or: [
      { targetType: 'all' },
      { targetType: 'college', targetCollegeIds: user.college?._id || user.college }
    ]
  };
};

// ─── GET /api/announcements ──────────────────────────────────────────────────
// Returns announcements visible to the current user, sorted pinned-first
router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const filter = buildVisibilityFilter(user);
    const { dateFilter } = req.query; // 'today' | 'week' | undefined

    if (dateFilter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (dateFilter === 'week') {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      filter.createdAt = { $gte: start };
    }

    const announcements = await Announcement.find(filter)
      .populate('createdById', 'fullName role college')
      .populate('targetCollegeIds', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: announcements });
  } catch (err) {
    console.error('[Announcements] GET error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── POST /api/announcements ─────────────────────────────────────────────────
// Create a new announcement (admin / college_admin only)
router.post('/', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !canPost(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorised to post announcements' });
    }

    const { title, description, attachmentUrl, attachmentType, targetType, targetCollegeIds, expiryDate } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, error: 'Title and description are required' });
    }

    // College admin can only target their own college
    let resolvedTarget = targetType || 'all';
    let resolvedCollegeIds = targetCollegeIds || [];

    if (user.role === 'college_admin') {
      resolvedTarget = 'college';
      resolvedCollegeIds = [user.college?._id || user.college];
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      description: description.trim(),
      attachmentUrl: attachmentUrl?.trim() || null,
      attachmentType: attachmentType || null,
      createdByRole: user.role,
      createdById: user._id,
      targetType: resolvedTarget,
      targetCollegeIds: resolvedCollegeIds,
      expiryDate: expiryDate || null
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('createdById', 'fullName role college')
      .populate('targetCollegeIds', 'name')
      .lean();

    // ── Generate Notifications ──────────────────────────────────────────────
    setImmediate(async () => {
      try {
        let recipientQuery = { status: 'active' };
        if (resolvedTarget === 'college' && resolvedCollegeIds.length > 0) {
          recipientQuery.college = { $in: resolvedCollegeIds };
        }

        const students = await Student.find(recipientQuery).select('_id').lean();
        
        if (students.length > 0) {
          const notifications = students.map(student => ({
            userId: student._id,
            type: 'system',
            title: `New Announcement: ${title}`,
            message: description.length > 100 ? `${description.substring(0, 97)}...` : description,
            icon: 'megaphone',
            color: '#002147',
            link: '/community',
            metadata: {
              postId: announcement._id,
              senderId: user._id,
              senderName: user.fullName
            }
          }));

          // Using Notification.createNotification for each to trigger WS events
          // or we can use insertMany and then manually trigger if needed.
          // Since createNotification handles the emitter, we'll loop or use a custom bulk emit.
          for (const n of notifications) {
            await Notification.createNotification(n);
          }
          console.log(`[Announcements] Notifications sent to ${students.length} students`);
        }
      } catch (err) {
        console.error('[Announcements] Notification error:', err);
      }
    });

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('[Announcements] POST error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── PUT /api/announcements/:id ──────────────────────────────────────────────
// Edit an announcement — admin edits any, college_admin edits only their own
router.put('/:id', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !canPost(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorised' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });

    // College admin can only edit their own
    if (user.role === 'college_admin' && String(announcement.createdById) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Cannot edit another admin\'s announcement' });
    }

    const { title, description, attachmentUrl, attachmentType, expiryDate } = req.body;
    if (title?.trim()) announcement.title = title.trim();
    if (description?.trim()) announcement.description = description.trim();
    announcement.attachmentUrl = attachmentUrl?.trim() || null;
    announcement.attachmentType = attachmentType || null;
    announcement.expiryDate = expiryDate || null;

    await announcement.save();
    const populated = await Announcement.findById(announcement._id)
      .populate('createdById', 'fullName role college')
      .populate('targetCollegeIds', 'name')
      .lean();

    res.json({ success: true, data: populated });
  } catch (err) {
    console.error('[Announcements] PUT error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── DELETE /api/announcements/:id ──────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !canPost(user.role)) {
      return res.status(403).json({ success: false, error: 'Not authorised' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });

    if (user.role === 'college_admin' && String(announcement.createdById) !== String(user._id)) {
      return res.status(403).json({ success: false, error: 'Cannot delete another admin\'s announcement' });
    }

    await announcement.deleteOne();
    res.json({ success: true, message: 'Announcement deleted' });
  } catch (err) {
    console.error('[Announcements] DELETE error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── PATCH /api/announcements/:id/pin ───────────────────────────────────────
// Toggle pin — SMAART admin only
router.patch('/:id/pin', protect, async (req, res) => {
  try {
    const user = req.user;
    if (!user || !isAdmin(user.role)) {
      return res.status(403).json({ success: false, error: 'Only SMAART Admin can pin announcements' });
    }

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    res.json({ success: true, data: { isPinned: announcement.isPinned } });
  } catch (err) {
    console.error('[Announcements] PIN error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// ─── PATCH /api/announcements/:id/react ─────────────────────────────────────
// Toggle/Update reaction — Any authenticated user
router.patch('/:id/react', protect, async (req, res) => {
  try {
    const user = req.user;
    const { emoji } = req.body;

    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    if (!emoji) return res.status(400).json({ success: false, error: 'Emoji is required' });

    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ success: false, error: 'Announcement not found' });

    if (!announcement.reactions) announcement.reactions = [];

    const existingIndex = announcement.reactions.findIndex(
      (r) => r.userId.toString() === user._id.toString()
    );

    if (existingIndex > -1) {
      if (announcement.reactions[existingIndex].emoji === emoji) {
        // Remove reaction if same emoji
        announcement.reactions.splice(existingIndex, 1);
      } else {
        // Update emoji if different
        announcement.reactions[existingIndex].emoji = emoji;
      }
    } else {
      // Add new reaction
      announcement.reactions.push({ userId: user._id, emoji });
    }

    await announcement.save();

    res.json({ 
      success: true, 
      data: { 
        reactions: announcement.reactions
      } 
    });
  } catch (err) {
    console.error('[Announcements] REACT error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
