const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const CommunityGroup = require('../models/CommunityGroup');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const { protect } = require('../middleware/auth');
const { uploadCommunity } = require('../middleware/upload');
    // Send notification to post author about the reply (don't notify if replying to own post)
    if (discussion.author.toString() !== authorId) {
      try {
        // Get replier's name for the notification
        let replier = await User.findById(authorId).select('fullName');
        if (!replier) replier = await Student.findById(authorId).select('fullName');
        if (!replier) replier = await Teacher.findById(authorId).select('fullName');
        if (!replier) replier = await Registration.findById(authorId).select('fullName');
        const replierName = replier?.fullName || 'Someone';

        await notifyCommunityReply(
          discussion.author,
          discussion.title || 'your post',
          replierName,
          discussion._id
        );
        console.log(`🔔 Notification sent for community reply to ${discussion.author}`);
      } catch (notifyError) {
        console.error("⚠️ Error sending reply notification:", notifyError);
      }
    }
    const populatedDiscussion = await CommunityPost.findById(discussion._id).lean();

    await hydrateAuthors(populatedDiscussion);

    res.json({ success: true, data: populatedDiscussion });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, error: 'Failed to add reply' });
  }
});

// Edit a reply (within 15 minutes)
router.put('/discussions/:id/reply/:replyId', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const { id, replyId } = req.params;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const discussion = await CommunityPost.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }

    if (reply.author.toString() !== authorId) {
      return res.status(403).json({ success: false, error: 'You can only edit your own reply' });
    }

    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - new Date(reply.createdAt).getTime() > fifteenMinutes) {
      return res.status(403).json({ success: false, error: 'Edit window has expired' });
    }

    reply.content = content;
    await discussion.save();

    const populated = await CommunityPost.findById(id).lean();

    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error editing reply:', error);
    res.status(500).json({ success: false, error: 'Failed to edit reply' });
  }
});

// Delete a reply
router.delete('/discussions/:id/reply/:replyId', async (req, res) => {
  try {
    const { id, replyId } = req.params;
    const { authorId } = req.body;

    const discussion = await CommunityPost.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const reply = discussion.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }

    if (reply.author.toString() !== authorId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own reply' });
    }

    reply.remove();
    await discussion.save();

    const populated = await CommunityPost.findById(id).lean();

    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ success: false, error: 'Failed to delete reply' });
  }
});

// Get featured groups
router.get('/groups/featured', async (req, res) => {
  try {
    const groups = await CommunityGroup.find({ isFeatured: true, status: 'active' })
      .select('name description icon color members')
      .limit(5);

    const groupsWithCount = groups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.length
    }));

    res.json({ success: true, data: groupsWithCount });
  } catch (error) {
    console.error('Error fetching featured groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch featured groups' });
  }
});

// Get all groups
router.get('/groups', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;

    const query = { status: 'active', isPublic: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const groups = await CommunityGroup.find(query)
      .select('name description icon color members category isFeatured')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const groupsWithCount = groups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.length
    }));

    const total = await CommunityGroup.countDocuments(query);

    res.json({
      success: true,
      data: groupsWithCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Join/Leave a group
router.post('/groups/:id/membership', async (req, res) => {
  try {
    const { userId, action } = req.body;
    const group = await CommunityGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const memberIndex = group.members.indexOf(userId);

    if (action === 'join' && memberIndex === -1) {
      group.members.push(userId);
    } else if (action === 'leave' && memberIndex !== -1) {
      group.members.splice(memberIndex, 1);
    }

    await group.save();
    res.json({
      success: true,
      data: {
        isMember: action === 'join',
        memberCount: group.members.length
      }
    });
  } catch (error) {
    console.error('Error updating group membership:', error);
    res.status(500).json({ success: false, error: 'Failed to update membership' });
  }
});

// Get top contributors
router.get('/contributors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Aggregate to count posts and replies per user
    const contributors = await CommunityPost.aggregate([
      { $match: { status: 'active' } },
      {
        $facet: {
          authors: [
            { $group: { _id: '$author', postCount: { $sum: 1 }, likesReceived: { $sum: { $size: '$likes' } } } }
          ],
          repliers: [
            { $unwind: '$replies' },
            { $group: { _id: '$replies.author', replyCount: { $sum: 1 } } }
          ]
        }
      },
      {
        $project: {
          combined: {
            $concatArrays: [
              {
                $map: {
                  input: '$authors',
                  as: 'a',
                  in: { userId: '$$a._id', postCount: '$$a.postCount', likesReceived: '$$a.likesReceived', replyCount: 0 }
                }
              },
              {
                $map: {
                  input: '$repliers',
                  as: 'r',
                  in: { userId: '$$r._id', postCount: 0, likesReceived: 0, replyCount: '$$r.replyCount' }
                }
              }
            ]
          }
        }
      },
      { $unwind: '$combined' },
      {
        $group: {
          _id: '$combined.userId',
          postCount: { $sum: '$combined.postCount' },
          replyCount: { $sum: '$combined.replyCount' },
          likesReceived: { $sum: '$combined.likesReceived' }
        }
      },
      {
        $addFields: {
          points: {
            $add: [
              { $multiply: ['$postCount', 10] },
              { $multiply: ['$replyCount', 5] },
              { $multiply: ['$likesReceived', 2] }
            ]
          }
        }
      },
      { $sort: { points: -1 } },
      { $limit: limit }
    ]);

    // Populate user details
    const userIds = contributors.map(c => c._id);
    const [users, students, teachers, registrations] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select('fullName profileImage'),
      Student.find({ _id: { $in: userIds } }).select('fullName profileImage'),
      Teacher.find({ _id: { $in: userIds } }).select('fullName profileImage'),
      Registration.find({ _id: { $in: userIds } }).select('fullName profileImage'),
    ]);

    const userMap = {};
    [...users, ...students, ...teachers, ...registrations].forEach(u => {
      userMap[u._id.toString()] = u;
    });

    const result = contributors.map((c, index) => {
      const user = userMap[c._id?.toString()] || {};
      let badge = 'Bronze';
      if (c.points >= 2000) badge = 'Gold';
      else if (c.points >= 1000) badge = 'Silver';

      return {
        _id: c._id,
        author: {
          fullName: user.fullName || 'Anonymous',
          profileImage: user.profileImage
        },
        points: c.points,
        postCount: c.postCount,
        replyCount: c.replyCount,
        badge,
        rank: index + 1
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching contributors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch contributors' });
  }
});

// Seed initial community data (for development)
router.post('/seed', async (req, res) => {
  try {
    // Check if already seeded
    const existingGroups = await CommunityGroup.countDocuments();
    if (existingGroups > 0) {
      return res.json({ success: true, message: 'Community data already exists' });
    }

    // Create featured groups
    const groups = [
      { name: 'Career Explorers', description: 'Discover and discuss career opportunities', icon: 'TrendingUp', color: 'bg-teal', category: 'career', isFeatured: true },
      { name: 'Study Buddies', description: 'Find study partners and share resources', icon: 'BookOpen', color: 'bg-gold', category: 'study', isFeatured: true },
      { name: 'Achievement Hunters', description: 'Celebrate achievements and milestones', icon: 'Award', color: 'bg-purple-500', category: 'skills', isFeatured: true },
      { name: 'Exam Warriors', description: 'Tips and strategies for competitive exams', icon: 'Target', color: 'bg-blue-500', category: 'exams', isFeatured: true },
      { name: 'Skill Builders', description: 'Learn and develop new skills together', icon: 'Wrench', color: 'bg-green-500', category: 'skills', isFeatured: true }
    ];

    await CommunityGroup.insertMany(groups);

    // Create sample discussions if author exists
    const author = await User.findOne() || await Student.findOne();
    if (author) {
      const discussions = [
        {
          title: 'Welcome to the Community!',
          content: 'This is a place to share your thoughts, ask questions, and connect with others. Feel free to start a discussion!',
          author: author._id,
          category: 'general',
          tags: ['welcome', 'community'],
          likes: [],
          views: 10
        },
        {
          title: 'Tips for Career Growth',
          content: 'What are your best tips for advancing your career in 2026? Share your experiences and advice here.',
          author: author._id,
          category: 'career',
          tags: ['career', 'advice'],
          likes: [],
          views: 25,
          poll: {
            question: 'What is most important for career growth?',
            options: [
              { text: 'Continuous Learning', voters: [] },
              { text: 'Networking', voters: [] },
              { text: 'Mentorship', voters: [] }
            ],
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        {
          title: 'Study Resources for AI',
          content: 'I found some great resources for learning Artificial Intelligence. Check them out in the library section!',
          author: author._id,
          category: 'study',
          tags: ['ai', 'learning', 'resources'],
          likes: [],
          views: 15
        }
      ];
      await CommunityPost.insertMany(discussions);
    }

    res.json({ success: true, message: 'Community data seeded successfully' });
  } catch (error) {
    console.error('Error seeding community data:', error);
    res.status(500).json({ success: false, error: 'Failed to seed community data' });
  }
});

// Search users for mentions
router.get('/search-users', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const searchRegex = new RegExp(query, 'i');

    // Search across all user types
    const [users, students, teachers] = await Promise.all([
      User.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex }
        ],
        status: 'active'
      }).select('fullName email profileImage').limit(10).lean(),
      Student.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex }
        ]
      }).select('fullName email profileImage').limit(10).lean(),
      Teacher.find({
        $or: [
          { fullName: searchRegex },
          { email: searchRegex }
        ]
      }).select('fullName email profileImage').limit(10).lean()
    ]);

    const allUsers = [...users, ...students, ...teachers]
      .map(u => ({
        _id: u._id,
        fullName: u.fullName,
        email: u.email,
        profileImage: u.profileImage
      }))
      .slice(0, 10);

    res.json({ success: true, data: allUsers });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
});

// Add threaded reply to an existing reply
router.post('/discussions/:id/reply/:replyId/thread', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const { id, replyId } = req.params;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    const discussion = await CommunityPost.findById(id);
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const parentReply = discussion.replies.id(replyId);
    if (!parentReply) {
      return res.status(404).json({ success: false, error: 'Parent reply not found' });
    }

    // Moderate reply content
    const { moderateText } = require('../helpers/textModeration');
    const contentCheck = moderateText(content);

    if (!contentCheck.isClean) {
      return res.status(400).json({
        success: false,
        error: 'Your reply contains inappropriate language. Please revise before posting.',
        flaggedWords: contentCheck.flaggedWords
      });
    }

    // Extract mentions from content
    const mentionRegex = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;
    const mentions = [];
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // Extract user ID
    }

    // Add threaded reply
    discussion.replies.push({
      author: authorId,
      content,
      parentReply: replyId,
      mentions: mentions.length > 0 ? mentions : undefined
    });

    await discussion.save();

    const populated = await CommunityPost.findById(id).lean();
    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error adding threaded reply:', error);
    res.status(500).json({ success: false, error: 'Failed to add threaded reply' });
  }
});

module.exports = router;
