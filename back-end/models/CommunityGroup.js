const mongoose = require('mongoose');

const communityGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a group name'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'Users'
  },
  color: {
    type: String,
    default: 'bg-teal'
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    enum: ['career', 'study', 'skills', 'interests', 'other'],
    default: 'other'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost'
  }],
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  type: {
    type: String,
    enum: ['official', 'student'],
    default: 'official'
  },
  channels: [{
    name: {
      type: String,
      required: true,
      maxlength: 50
    },
    description: String,
    icon: String,
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Dynamic ref handled by population usually, but schema needs a ref. We might need to store broader ref or just ID.
      // For simplicity in this stack, we'll store ObjectId and manual lookup or use a mixed ref if needed. 
      // Given the previous issue with "Anonymous", we know we need to careful with refs.
      // Let's just store ObjectId and rely on our manual hydration or loose refs.
    },
    senderName: String, // Cache name to avoid massive lookups for chat
    senderModel: {
      type: String,
      enum: ['User', 'Student', 'Teacher', 'Registration']
    },
    content: String,
    image: String,
    video: String,
    poll: {
      question: String,
      options: [{
        text: { type: String, required: true },
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
      }],
      expiresAt: Date
    },
    sharedPost: {
      discussionId: mongoose.Schema.Types.ObjectId,
      title: String,
      content: String,
      author: {
        name: String,
        id: mongoose.Schema.Types.ObjectId
      },
      category: String,
      media: {
        url: String,
        type: { type: String }
      },
      poll: {
        question: String,
        options: [{
          text: String,
          voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }],
        expiresAt: Date
      },
      createdAt: Date
    },
    reactions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      emoji: String
    }],
    mentions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isPinned: {
      type: Boolean,
      default: false
    },
    channelId: String,
    createdAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

communityGroupSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('CommunityGroup', communityGroupSchema);
