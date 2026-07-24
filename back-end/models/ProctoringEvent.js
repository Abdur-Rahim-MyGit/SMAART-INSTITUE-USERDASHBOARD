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
      // Candidate away from the camera for a full minute — a materially
      // different thing from a brief absence, so it carries its own weight.
      'student_absent_extended',
      // Liveness / attention
      'attention_check_fail', 'identity_verified', 'face_registered',
      // Eye gaze violations (NEW)
      'gaze_away',         // student looking persistently left or right
      'eyes_closed',       // eyes shut for extended period
      // Audio / voice violations (NEW)
      'voice_detected',    // sustained speech detected during exam
      'prolonged_silence', // no activity for 4+ minutes
      // Attention — sustained downward head pose is the best available proxy
      // for reading a phone in the lap. Inference, never proof.
      'looking_down',
      // Environment — strong signals that are hard to explain away
      'second_screen_detected',   // screen.isExtended
      'virtual_camera_detected',  // OBS / ManyCam / Snap Camera feeding the webcam
      'multiple_exam_windows',    // same assessment open in more than one tab
      // Server-derived. The candidate cannot suppress these, because the
      // signal is either an absence of contact or an analysis of their own
      // submitted data.
      'proctoring_offline',
      'timing_anomaly',
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
