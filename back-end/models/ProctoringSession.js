const mongoose = require('mongoose');

const ProctoringSessionSchema = new mongoose.Schema({
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  status: { type: String, enum: ['active', 'completed', 'terminated', 'flagged', 'locked'], default: 'active' },
  isLocked: { type: Boolean, default: false },
  lockReason: { type: String },
  activeTicketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket' },
  identityVerified: { type: Boolean, default: false },
  identityVerifiedAt: { type: Date },
  referencePhotoUrl: { type: String },
  environmentCheck: {
    fullScreenGranted: { type: Boolean, default: false },
    cameraGranted: { type: Boolean, default: false },
    browserInfo: { type: String },
    screenResolution: { type: String }
  },
  totalViolations: { type: Number, default: 0 },
  violationsByType: { type: Map, of: Number, default: {} },
  riskScore: { type: Number, default: 0 }, // 0-100 composite score calculated on backend
  faceRegistered: { type: Boolean, default: false },
  faceRegisteredAt: { type: Date },
  faceVerificationPassRate: { type: Number, default: 0 }, // 0-1 ratio of verified checks vs total
  totalFaceChecks: { type: Number, default: 0 },
  faceChecksPassed: { type: Number, default: 0 },

  // ── Face Embedding Persistence (v2: ArcFace ONNX) ──────────────────────────
  faceEmbedding: { type: String, default: null },       // JSON-stringified Float32Array[512]
  faceEmbeddingModel: { type: String, default: null },  // e.g. 'arcface-r50-onnx'
  faceEmbeddingDims: { type: Number, default: null },   // 512
  faceRegistrationQuality: { type: Number, default: null }, // 0–100 quality score at registration
  faceRegistrationFrames: { type: Number, default: null },  // frames captured (should be 5)
  faceAlignedCropUrl: { type: String, default: null },  // Cloudinary / local URL of registration crop
  antispoofPassed: { type: Boolean, default: null },    // Anti-spoof result at registration

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

// Indexes for fast lookups
ProctoringSessionSchema.index({ userId: 1, assessmentId: 1 });
ProctoringSessionSchema.index({ resultId: 1 });
ProctoringSessionSchema.index({ status: 1 });
// TTL index: auto-delete completed sessions (and their embedded face data) after 30 days
// Satisfies DPDPA 2023 requirement: session records purged within 30 days of completion
ProctoringSessionSchema.index({ completedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ProctoringSession', ProctoringSessionSchema);
