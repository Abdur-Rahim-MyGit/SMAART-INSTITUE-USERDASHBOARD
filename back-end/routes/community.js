const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CommunityPost = require('../models/CommunityPost');
const CommunityGroup = require('../models/CommunityGroup');
const MentorshipLog = require('../models/MentorshipLog');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Registration = require('../models/Registration');
const { protect } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
const { uploadCommunity, cloudinary } = require('../middleware/upload');
const { notifyCommunityReply } = require('../services/notificationService');
const { classifyDistress } = require('../helpers/distressClassifier');
const CoachAlert = require('../models/CoachAlert');
const { scanImage } = require('../helpers/nsfwModeration');

// Apply protection to all community routes
router.use(protect);

// hydrate authors that live in User/Student/Teacher so names show up and ownership checks work
const hydrateAuthors = async (posts) => {
  const docs = Array.isArray(posts) ? posts : [posts];
  const missingIds = new Set();

  const collectMissing = (author) => {
    if (!author) return;
    const hasDetails = typeof author === 'object' && (author.fullName || author.email || author.profileImage);
    if (hasDetails) return;
    const id = author._id?.toString?.() || author.toString?.();
    if (id) missingIds.add(id);
  };

  docs.forEach((post) => {
    collectMissing(post?.author);
    post?.replies?.forEach((reply) => collectMissing(reply.author));
  });

  if (!missingIds.size) return posts;

  const ids = [...missingIds];
  const [users, students, teachers, registrations] = await Promise.all([
    User.find({ _id: { $in: ids } }).select('fullName email profileImage'),
    Student.find({ _id: { $in: ids } }).select('fullName email profileImage'),
    Teacher.find({ _id: { $in: ids } }).select('fullName email profileImage'),
    Registration.find({ _id: { $in: ids } }).select('fullName email profileImage'),
  ]);

  const authorMap = new Map();
  [...users, ...students, ...teachers, ...registrations].forEach((a) => {
    authorMap.set(a._id.toString(), a);
  });

  const resolveAuthor = (author) => {
    if (!author) return author;
    const hasDetails = typeof author === 'object' && (author.fullName || author.email || author.profileImage);
    if (hasDetails) return author;
    const id = author._id?.toString?.() || author.toString?.();
    return authorMap.get(id) || author;
  };

  docs.forEach((post) => {
    post.author = resolveAuthor(post.author);
    post?.replies?.forEach((reply) => {
      reply.author = resolveAuthor(reply.author);
    });
  });

  return posts;
};

// normalize incoming collegeId query param
const getCollegeFilter = (collegeId) => {
  if (!collegeId || collegeId === 'undefined' || collegeId === 'null') return null;
  return collegeId;
};

// Get community stats
router.get('/stats', async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ status: 'active' });
    const totalDiscussions = await CommunityPost.countDocuments({ status: 'active' });
    const totalGroups = await CommunityGroup.countDocuments({ status: 'active' });

    // Active today - users who logged in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.countDocuments({
      lastLogin: { $gte: today }
    });

    res.json({
      success: true,
      data: {
        totalMembers,
        totalDiscussions,
        totalGroups,
        activeToday
      }
    });
  } catch (error) {
    console.error('Error fetching community stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch community stats' });
  }
});

// Get coach alerts (moderator/admin only)
router.get('/coachalerts', requireRole('moderator', 'admin'), async (req, res) => {
  try {
    const { resolved } = req.query;

    const query = {};
    if (resolved === 'true') query.resolved = true;
    if (resolved === 'false') query.resolved = false;

    const alerts = await CoachAlert.find(query)
      .sort({ timestamp: -1 })
      .lean();

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching coach alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch coach alerts' });
  }
});

// Get all discussions with pagination
router.get('/discussions', async (req, res) => {
  try {
    console.log('[GET discussions] query params:', req.query);
    const { page = 1, limit = 10, category, search, sortBy = 'createdAt', channelType } = req.query;
    const collegeId = getCollegeFilter(req.query.collegeId);

    const allowedChannels = ['support', 'discussion', 'mentor', 'coach'];
    const normalizedChannel = (channelType || '').toString().toLowerCase();
    const channelFilter = allowedChannels.includes(normalizedChannel) ? normalizedChannel : null;
    const query = { status: 'active' };

    // Default to discussion-like channels unless explicitly filtered
    if (channelFilter === 'support') {
      // STRICT: only support posts (case-insensitive)
      query.channelType = { $regex: /^support$/i };
    } else if (channelFilter) {
      query.channelType = channelFilter;
    } else {
      // Include discussion/mentor/coach + legacy posts; exclude support by omission
      query.$or = [
        { channelType: 'discussion' },
        { channelType: 'mentor' },
        { channelType: 'coach' },
        { channelType: { $exists: false } },
        { channelType: null }
      ];
    }

    if (collegeId) {
      query.college = collegeId;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search };
    }

    let discussions;
    if (sortBy === 'popularity') {
      const aggQuery = { ...query };

      // Aggregation doesn't auto-cast strings to ObjectIds in $match
      if (aggQuery.college && typeof aggQuery.college === 'string') {
        try {
          aggQuery.college = new mongoose.Types.ObjectId(aggQuery.college);
        } catch (e) {
          delete aggQuery.college;
        }
      }

      discussions = await CommunityPost.aggregate([
        { $match: aggQuery },
        {
          $addFields: {
            popularityScore: {
              $add: [
                { $size: { $ifNull: ["$likes", []] } },
                { $size: { $ifNull: ["$reactions", []] } },
                { $size: { $ifNull: ["$replies", []] } }
              ]
            }
          }
        },
        { $sort: { isPinned: -1, popularityScore: -1, createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
      ]);
    } else {
      discussions = await CommunityPost.find(query)
        .sort({ isPinned: -1, [sortBy]: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();
    }

    await hydrateAuthors(discussions);

    const total = await CommunityPost.countDocuments(query);

    res.json({
      success: true,
      data: discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch discussions' });
  }
});

// Get discussions by user
router.get('/discussions/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, search, sortBy = 'createdAt' } = req.query;
    const collegeId = getCollegeFilter(req.query.collegeId);

    const query = { author: userId, status: 'active' };
    if (collegeId) query.college = collegeId;
    if (search) query.$text = { $search: search };

    const discussions = await CommunityPost.find(query)
      .sort({ [sortBy]: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    await hydrateAuthors(discussions);

    const total = await CommunityPost.countDocuments(query);

    res.json({
      success: true,
      data: discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user discussions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user discussions' });
  }
});

// Get bookmarked discussions by user
router.get('/discussions/bookmarks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, search, sortBy = 'createdAt' } = req.query;
    const collegeId = getCollegeFilter(req.query.collegeId);

    const query = { isBookmarkedBy: userId, status: 'active' };
    if (collegeId) query.college = collegeId;
    if (search) query.$text = { $search: search };

    const discussions = await CommunityPost.find(query)
      .sort({ [sortBy]: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    await hydrateAuthors(discussions);

    const total = await CommunityPost.countDocuments(query);

    res.json({
      success: true,
      data: discussions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching bookmarked discussions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookmarked discussions' });
  }
});

// Create a discussion (multipart supported)
router.post('/discussions', uploadCommunity.single('media'), async (req, res) => {
  try {
    const { title, content, authorId, authorEmail, channelType, tags, category, isMentorInteraction } = req.body;

    const normalizedChannel = (channelType || '').toString().toLowerCase();
    const resolvedChannelType = ['support', 'discussion', 'mentor', 'coach'].includes(normalizedChannel)
      ? normalizedChannel
      : 'discussion';

    let resolvedAuthorId = authorId;
    let author = null;

    if (authorId) {
      author = await User.findById(authorId).select('college fullName email status suspendedUntil');
      if (!author) author = await Student.findById(authorId).select('college fullName email status suspendedUntil');
      if (!author) author = await Teacher.findById(authorId).select('college fullName email status suspendedUntil');
      if (!author) author = await Registration.findById(authorId).select('institution fullName email status suspendedUntil');
    }

    // If no author found by ID and email is provided, look up by email
    if (!author && authorEmail) {
      const normalizedEmail = authorEmail.toLowerCase().trim();

      author = await Student.findOne({ email: normalizedEmail }).select('college fullName email status suspendedUntil');
      if (author) resolvedAuthorId = author._id;

      if (!author) {
        author = await User.findOne({ email: normalizedEmail }).select('college fullName email status suspendedUntil');
        if (author) resolvedAuthorId = author._id;
      }

      if (!author) {
        author = await Teacher.findOne({ email: normalizedEmail }).select('college fullName email status suspendedUntil');
        if (author) resolvedAuthorId = author._id;
      }

      if (!author) {
        author = await Registration.findOne({ email: normalizedEmail }).select('institution fullName email status suspendedUntil');
        if (author) resolvedAuthorId = author._id;
      }
    }

    if (!author) {
      return res.status(400).json({ success: false, error: 'Author not found. Please log out and log in again.' });
    }

    // Block suspended users from posting
    const now = new Date();
    if (author.status === 'suspended' || (author.suspendedUntil && new Date(author.suspendedUntil) > now)) {
      return res.status(403).json({ success: false, error: 'Your account is suspended and cannot create posts.' });
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }

    // Moderate title and content
    const { moderateText } = require('../helpers/textModeration');
    const titleCheck = moderateText(title);
    const contentCheck = moderateText(content);

    if (!titleCheck.isClean) {
      return res.status(400).json({
        success: false,
        error: 'Your title contains inappropriate language. Please revise before posting.',
        flaggedWords: titleCheck.flaggedWords
      });
    }

    if (!contentCheck.isClean) {
      return res.status(400).json({
        success: false,
        error: 'Your content contains inappropriate language. Please revise before posting.',
        flaggedWords: contentCheck.flaggedWords
      });
    }

    // Run NSFW scan on uploaded images before persisting
    let mediaPayload;
    if (req.file) {
      const resourceType = req.file.mimetype?.startsWith('video/') ? 'video' : 'image';

      if (resourceType === 'image') {
        const nsfwResult = await scanImage(req.file.path || req.file.originalname);

        if (!nsfwResult.safe) {
          try {
            if (req.file.filename) {
              await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'image' });
            }
          } catch (cleanupError) {
            console.warn('[Community] Failed to cleanup rejected image:', cleanupError.message);
          }

          return res.status(400).json({
            success: false,
            error: 'The uploaded image failed our safety checks.',
            score: nsfwResult.score,
            categories: nsfwResult.categories,
          });
        }
      }

      mediaPayload = {
        url: req.file.path,
        publicId: req.file.filename,
        resourceType
      };
    }

    const discussion = new CommunityPost({
      title,
      content,
      channelType: resolvedChannelType,
      isMentorInteraction,
      author: resolvedAuthorId,
      college: author.college || null,
      category: category || 'general',
      tags: tags || [],
      media: mediaPayload,
      poll: req.body.poll ? (typeof req.body.poll === 'string' ? JSON.parse(req.body.poll) : req.body.poll) : undefined
    });

    // Distress monitoring for support channel
    if (discussion.channelType === 'support') {
      const { riskLevel } = classifyDistress(`${title}\n${content}`);
      if (riskLevel === 'medium' || riskLevel === 'high') {
        discussion.flaggedAt = discussion.flaggedAt || new Date();
        discussion.flagReason = `distress:${riskLevel}`;
        discussion.resolution = discussion.resolution || { status: 'pending' };
        discussion.resolution.status = 'pending';

        await CoachAlert.create({
          studentId: resolvedAuthorId,
          postId: discussion._id,
          riskLevel,
          timestamp: new Date(),
          resolved: false
        });
      }
    }

    await discussion.save();

    const populatedDiscussion = await CommunityPost.findById(discussion._id).lean();

    await hydrateAuthors(populatedDiscussion);

    res.status(201).json({ success: true, data: populatedDiscussion });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to create discussion' });
  }
});

// Get single discussion
router.get('/discussions/:id', async (req, res) => {
  try {
    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    discussion.views = (discussion.views || 0) + 1;
    await discussion.save();

    const populatedDiscussion = await CommunityPost.findById(req.params.id).lean();
    await hydrateAuthors(populatedDiscussion);

    res.json({ success: true, data: populatedDiscussion });
  } catch (error) {
    console.error('Error fetching discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch discussion' });
  }
});

// Mark/Unmark a reply as Best Answer
router.post('/discussions/:id/best-answer', async (req, res) => {
  try {
    const { replyId, authorId } = req.body;
    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const requesterId = (req.user?._id || req.user?.id || authorId || '').toString();
    const requesterRole = (req.user?.role || req.user?.userType || '').toLowerCase();
    const isAuthor = discussion.author?.toString() === requesterId;
    const isModerator = ['admin', 'moderator', 'staff', 'superadmin'].includes(requesterRole);

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ success: false, error: 'Only the author or a moderator can mark a best answer' });
    }

    const replyDoc = discussion.replies.id(replyId);
    if (!replyDoc) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }

    if (discussion.bestAnswer && discussion.bestAnswerReply?.toString() === replyId) {
      discussion.bestAnswer = false;
      discussion.bestAnswerReply = undefined;
    } else {
      discussion.bestAnswer = true;
      discussion.bestAnswerReply = replyId;
    }

    await discussion.save();

    const populated = await CommunityPost.findById(req.params.id).lean();
    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error marking best answer:', error);
    res.status(500).json({ success: false, error: 'Failed to mark best answer' });
  }
});

// Peer vote on a discussion (quality score)
router.post('/discussions/:id/vote', async (req, res) => {
  try {
    const { userId, vote } = req.body;
    const normalizedVote = vote === 'up' || vote === 'down' ? vote : null;
    if (!normalizedVote) {
      return res.status(400).json({ success: false, error: 'vote must be "up" or "down"' });
    }

    const voterId = (req.user?._id || req.user?.id || userId || '').toString();
    if (!voterId) {
      return res.status(400).json({ success: false, error: 'userId is required to vote' });
    }

    const discussion = await CommunityPost.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const actorRole = (req.user?.role || req.user?.userType || '').toString().toLowerCase();
    if (actorRole === 'student' && discussion.author?.toString() === voterId) {
      return res.status(403).json({ success: false, error: 'You cannot vote on your own post' });
    }

    const existingIndex = discussion.peerVotes.findIndex(v => v.userId.toString() === voterId);
    if (existingIndex >= 0) {
      discussion.peerVotes[existingIndex].vote = normalizedVote;
    } else {
      discussion.peerVotes.push({ userId: voterId, vote: normalizedVote });
    }

    const upVotes = discussion.peerVotes.filter(v => v.vote === 'up').length;
    const downVotes = discussion.peerVotes.filter(v => v.vote === 'down').length;
    const totalVotes = upVotes + downVotes;
    discussion.qualityScore = totalVotes === 0 ? 0 : (upVotes - downVotes) / totalVotes;

    await discussion.save();

    const populated = await CommunityPost.findById(req.params.id).lean();
    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error recording peer vote:', error);
    res.status(500).json({ success: false, error: 'Failed to record vote' });
  }
});

// Report a discussion
router.post('/discussions/:id/report', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    // Check if already reported by this user
    const alreadyReported = discussion.reports.some(r => r.user.toString() === userId);
    if (alreadyReported) {
      return res.status(400).json({ success: false, error: 'You have already reported this discussion' });
    }

    discussion.reports.push({
      user: userId,
      reason: reason || 'Inappropriate content'
    });

    // Flag the post for moderator review
    discussion.flaggedAt = discussion.flaggedAt || new Date();
    discussion.flagReason = discussion.flagReason || reason || 'Inappropriate content';
    discussion.resolution = discussion.resolution || { status: 'pending' };
    discussion.resolution.status = 'pending';
    discussion.status = 'active'; // keep visible until a moderator acts

    await discussion.save();
    res.json({ success: true, message: 'Discussion reported successfully' });
  } catch (error) {
    console.error('Error reporting discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to report discussion' });
  }
});

// Like/Unlike a discussion (primary route)
const likeHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    const actorId = (req.user?._id || req.user?.id || userId || '').toString();
    if (!actorId) {
      return res.status(400).json({ success: false, error: 'userId is required to like' });
    }

    const discussion = await CommunityPost.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const actorRole = (req.user?.role || req.user?.userType || '').toString().toLowerCase();
    if (actorRole === 'student' && discussion.author?.toString() === actorId) {
      return res.status(403).json({ success: false, error: 'You cannot react to your own post' });
    }

    const likeIndex = discussion.likes.findIndex(l => l.toString() === actorId);

    if (likeIndex === -1) {
      discussion.likes.push(actorId);
    } else {
      discussion.likes.splice(likeIndex, 1);
    }

    await discussion.save();
    res.json({ success: true, data: { likes: discussion.likes.length, isLiked: likeIndex === -1 } });
  } catch (error) {
    console.error('Error liking discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to like discussion' });
  }
};

router.post('/discussions/:id/like', likeHandler);
// Alias to support clients calling /api/community/:id/like
router.post('/:id/like', likeHandler);

// React to a discussion
router.post('/discussions/:id/react', async (req, res) => {
  try {
    const { userId, type } = req.body;
    const actorId = (req.user?._id || req.user?.id || userId || '').toString();
    if (!actorId) {
      return res.status(400).json({ success: false, error: 'userId is required to react' });
    }

    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const actorRole = (req.user?.role || req.user?.userType || '').toString().toLowerCase();
    if (actorRole === 'student' && discussion.author?.toString() === actorId) {
      return res.status(403).json({ success: false, error: 'You cannot react to your own post' });
    }

    if (!['like', 'heart', 'insightful', 'support'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid reaction type' });
    }

    // Find if user already reacted
    const reactionIndex = (discussion.reactions || []).findIndex(r => r.user.toString() === actorId);

    if (reactionIndex === -1) {
      // New reaction
      if (!discussion.reactions) discussion.reactions = [];
      discussion.reactions.push({ user: actorId, type });
    } else {
      // User already reacted
      if (discussion.reactions[reactionIndex].type === type) {
        // Toggle off if same type
        discussion.reactions.splice(reactionIndex, 1);
      } else {
        // Change type if different
        discussion.reactions[reactionIndex].type = type;
      }
    }

    await discussion.save();

    // Calculate counts
    const counts = {
      like: (discussion.reactions || []).filter(r => r.type === 'like').length,
      heart: (discussion.reactions || []).filter(r => r.type === 'heart').length,
      insightful: (discussion.reactions || []).filter(r => r.type === 'insightful').length,
      support: (discussion.reactions || []).filter(r => r.type === 'support').length
    };

    res.json({
      success: true,
      data: {
        reactions: discussion.reactions,
        counts,
        currentUserReaction: (discussion.reactions || []).find(r => r.user.toString() === userId)?.type || null
      }
    });
  } catch (error) {
    console.error('Error reacting to discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to react to discussion' });
  }
});

// Bookmark/Unbookmark a discussion
router.post('/discussions/:id/bookmark', async (req, res) => {
  try {
    const { userId } = req.body;
    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    const bookmarkIndex = discussion.isBookmarkedBy.indexOf(userId);

    if (bookmarkIndex === -1) {
      discussion.isBookmarkedBy.push(userId);
    } else {
      discussion.isBookmarkedBy.splice(bookmarkIndex, 1);
    }

    await discussion.save();
    res.json({ success: true, data: { isBookmarked: bookmarkIndex === -1 } });
  } catch (error) {
    console.error('Error bookmarking discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to bookmark discussion' });
  }
});

// Vote in a poll
router.post('/discussions/:id/vote', async (req, res) => {
  try {
    const { userId, optionIndex } = req.body;
    const discussion = await CommunityPost.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    if (!discussion.poll) {
      return res.status(400).json({ success: false, error: 'This discussion has no poll' });
    }

    // Check if poll has expired
    if (discussion.poll.expiresAt && new Date() > new Date(discussion.poll.expiresAt)) {
      return res.status(400).json({ success: false, error: 'This poll has expired' });
    }

    if (optionIndex < 0 || optionIndex >= discussion.poll.options.length) {
      return res.status(400).json({ success: false, error: 'Invalid option index' });
    }

    // Check if user has already voted in any option
    const existingVoteIndex = discussion.poll.options.findIndex(opt =>
      opt.voters.some(voterId => voterId.toString() === userId)
    );

    if (existingVoteIndex !== -1) {
      // If user voted for the same option, remove the vote (toggle)
      if (existingVoteIndex === optionIndex) {
        discussion.poll.options[existingVoteIndex].voters = discussion.poll.options[existingVoteIndex].voters.filter(
          voterId => voterId.toString() !== userId
        );
      } else {
        // Change vote: remove from old, add to new
        discussion.poll.options[existingVoteIndex].voters = discussion.poll.options[existingVoteIndex].voters.filter(
          voterId => voterId.toString() !== userId
        );
        discussion.poll.options[optionIndex].voters.push(userId);
      }
    } else {
      // New vote
      discussion.poll.options[optionIndex].voters.push(userId);
    }

    await discussion.save();

    const populated = await CommunityPost.findById(req.params.id).lean();
    await hydrateAuthors(populated);

    res.json({ success: true, data: populated });
  } catch (error) {
    console.error('Error voting in poll:', error);
    res.status(500).json({ success: false, error: 'Failed to vote in poll' });
  }
});

// Add reply to a discussion
router.post('/discussions/:id/reply', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const discussion = await CommunityPost.findById(req.params.id);
    let author = await User.findById(authorId).select('college role');
    if (!author) author = await Student.findById(authorId).select('college role');
    if (!author) author = await Teacher.findById(authorId).select('college role');
    if (!author) author = await Registration.findById(authorId).select('institution');

    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }

    // Enforce same-college interaction when college is set on post
    if (discussion.college && author && author.college && discussion.college.toString() !== author.college.toString()) {
      return res.status(403).json({ success: false, error: 'Replies are restricted to your institution.' });
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

    discussion.replies.push({
      author: authorId,
      content
    });

    await discussion.save();

    // Log mentor/coach interactions for mentorship tracking
    try {
      const role = (author?.role || '').toString().toLowerCase();
      const isMentorOrCoach = role === 'mentor' || role === 'coach';
      const isMentorChannel = discussion.isMentorInteraction || discussion.channelType === 'mentor' || discussion.channelType === 'coach';

      if (isMentorOrCoach && isMentorChannel) {
        const replyDoc = discussion.replies[discussion.replies.length - 1];
        const replyTimestamp = replyDoc?.createdAt ? new Date(replyDoc.createdAt) : new Date();
        const responseTimeMinutes = Math.max(0, Math.round((replyTimestamp - new Date(discussion.createdAt)) / 60000));

        await MentorshipLog.create({
          mentorId: authorId,
          studentId: discussion.author,
          postId: discussion._id,
          timestamp: replyTimestamp,
          responseTime: responseTimeMinutes
        });
      }
    } catch (logError) {
      console.error('Error logging mentorship interaction:', logError);
    }

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
