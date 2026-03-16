const mongoose = require('mongoose');

const coachAlertSchema = new mongoose.Schema({
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
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  resolved: {
    type: Boolean,
    default: false
  }
});

coachAlertSchema.index({ riskLevel: 1, timestamp: -1 });
coachAlertSchema.index({ studentId: 1, timestamp: -1 });

module.exports = mongoose.model('CoachAlert', coachAlertSchema);
