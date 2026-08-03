const mongoose = require('mongoose');
const { RISK_WEIGHTS } = require('../config/proctoringPolicy');

// The event enum is DERIVED from the policy's RISK_WEIGHTS (the single source of
// truth for what the engine + gate + analytics emit) UNIONed with the ONNX
// pipeline / info-level events that carry no risk weight. This guarantees the
// enum can never drift behind the policy again — previously `timing_anomaly`
// (and 7 others) were scored by the policy/gate but rejected by this enum,
// throwing a ValidationError on save (500 at submit).
const POLICY_EVENT_TYPES = Object.keys(RISK_WEIGHTS);
const ONNX_INFO_EVENT_TYPES = [
  'spoof_detected',          // Anti-spoof: photo or video replay detected
  'camera_quality_check',    // Pre-assessment camera quality gate result
  'registration_quality',    // Face registration quality score logged
  'tracker_loss',            // Lightweight tracker lost the face between verifications
  'identity_confidence',     // Per-verification cosine similarity score logged
  'verification_batch',      // 5-frame batch verification completed (info-level)
  'face_absent_reminder',    // Gentle reminder shown (not a violation)
];
const EVENT_TYPES = Array.from(new Set([...POLICY_EVENT_TYPES, ...ONNX_INFO_EVENT_TYPES]));

const ProctoringEventSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProctoringSession', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventType: {
    type: String,
    enum: EVENT_TYPES,
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
