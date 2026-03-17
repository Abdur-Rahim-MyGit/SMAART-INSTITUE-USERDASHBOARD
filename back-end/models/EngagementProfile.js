const mongoose = require('mongoose');

const EngagementProfileSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  communityScore: { type: Number, default: 0 },
  qualityScore: { type: Number, default: 0 },
  participationRate: { type: Number, default: 0 },
  mentorshipFrequency: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EngagementProfile', EngagementProfileSchema);
