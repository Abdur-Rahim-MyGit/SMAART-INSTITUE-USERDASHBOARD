const mongoose = require('mongoose');

const moderationLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['warn', 'suspend', 'delete_post', 'escalate', 'dismissed'],
    required: true
  },
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost'
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

moderationLogSchema.index({ action: 1, timestamp: -1 });
moderationLogSchema.index({ targetId: 1, timestamp: -1 });

module.exports = mongoose.model('ModerationLog', moderationLogSchema);
