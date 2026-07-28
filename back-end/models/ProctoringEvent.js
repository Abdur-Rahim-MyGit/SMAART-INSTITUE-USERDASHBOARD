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
      // Eye gaze violations
      'gaze_away',
      'eyes_closed',
      // Audio / voice violations
      'voice_detected',
      'prolonged_silence',
      // v2: ONNX Pipeline events
      'spoof_detected',          // Anti-spoof: photo or video replay detected
      'camera_quality_check',    // Pre-assessment camera quality gate result
      'registration_quality',    // Face registration quality score logged
      'tracker_loss',            // Lightweight tracker lost the face between verifications
      'identity_confidence',     // Per-verification cosine similarity score logged
      // v3: Batch verification events
      'verification_batch',      // 5-frame batch verification completed (info-level)
      'face_absent_reminder',    // Gentle reminder shown (not a violation)
    ],
    required: true 
  },
  severity: { type: String, enum: ['info', 'low', 'medium', 'high', 'critical'], default: 'low' },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
  screenshotUrl: { type: String },
  // v2: Structured metadata for ONNX pipeline events
  metadata: {
    qualityScore:    { type: Number },   // 0–100 frame quality at time of event
    similarityScore: { type: Number },   // cosine similarity 0–1
    antispoofScore:  { type: Number },   // liveness score 0–1
    model:           { type: String },   // e.g. 'arcface-r50-onnx'
    framesCaptured:  { type: Number },   // for registration_quality event
  }
}, { timestamps: true });

// Index for query performance
ProctoringEventSchema.index({ sessionId: 1 });
ProctoringEventSchema.index({ userId: 1 });

module.exports = mongoose.model('ProctoringEvent', ProctoringEventSchema);
