const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentReply: {
    type: mongoose.Schema.Types.ObjectId
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: [true, 'Please provide content'],
    maxlength: 5000
  },
  channelType: {
    type: String,
    enum: ['support', 'discussion', 'mentor', 'coach'],
    default: 'discussion'
  },
  isMentorInteraction: {
    type: Boolean,
    default: false
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'career', 'study', 'exams', 'skills', 'motivation', 'other'],
    default: 'general'
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  peerVotes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vote: {
      type: String,
      enum: ['up', 'down'],
      required: true
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['like', 'heart', 'insightful', 'support'],
      required: true
    }
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [replySchema],
  views: {
    type: Number,
    default: 0
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isBookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'hidden'],
    default: 'active'
  },
  media: {
    url: String,
    publicId: String,
    resourceType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image'
    }
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Moderation lifecycle fields
  flagReason: {
    type: String,
    trim: true
  },
  flaggedAt: {
    type: Date
  },
  moderatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    resolvedAt: Date
  },
  bestAnswer: {
    type: Boolean,
    default: false
  },
  bestAnswerReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reply' // This refers to a subdocument ID within the replies array
  },
  poll: {
    question: String,
    options: [{
      text: { type: String, required: true },
      voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }],
    expiresAt: Date
  }
}, {
  timestamps: true
});

// Index for better search performance
communityPostSchema.index({ title: 'text', content: 'text', tags: 'text' });
communityPostSchema.index({ author: 1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ category: 1 });
communityPostSchema.index({ channelType: 1, createdAt: -1 });
communityPostSchema.index({ flaggedAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
