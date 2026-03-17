const mongoose = require('mongoose');

const mentorshipLogSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  responseTime: {
    type: Number,
    required: true,
    min: 0
  }
});

mentorshipLogSchema.index({ mentorId: 1, timestamp: -1 });
mentorshipLogSchema.index({ studentId: 1, timestamp: -1 });
mentorshipLogSchema.index({ postId: 1 });

module.exports = mongoose.model('MentorshipLog', mentorshipLogSchema);
