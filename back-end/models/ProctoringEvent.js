const mongoose = require('mongoose');

const ProctoringEventSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProctoringSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: { 
    type: String, 
    enum: ['tab_switch', 'minimize', 'fullscreen_exit', 'face_absent', 'multiple_faces', 'attention_check_fail', 'inactivity', 'identity_verified', 'face_mismatch', 'face_covered', 'face_registered'], 
    required: true 
  },
  severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'low' },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
  screenshotUrl: { type: String } // Path to stored webcam snapshot image file
}, { timestamps: true });

// Index for query performance
ProctoringEventSchema.index({ sessionId: 1 });
ProctoringEventSchema.index({ userId: 1 });

module.exports = mongoose.model('ProctoringEvent', ProctoringEventSchema);
