const mongoose = require('mongoose');

const ProctoringEventSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProctoringSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: { 
    type: String, 
    enum: [
      // Browser / window violations
      'tab_switch', 'minimize', 'fullscreen_exit', 'inactivity',
      // Face detection violations
      'face_absent', 'multiple_faces', 'face_mismatch', 'face_covered',
      // Liveness / attention
      'attention_check_fail', 'identity_verified', 'face_registered',
      // Eye gaze violations (NEW)
      'gaze_away',         // student looking persistently left or right
      'eyes_closed',       // eyes shut for extended period
      // Audio / voice violations (NEW)
      'voice_detected',    // sustained speech detected during exam
      'prolonged_silence', // no activity for 4+ minutes
    ],
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
