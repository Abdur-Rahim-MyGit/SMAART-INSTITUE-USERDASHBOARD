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

  // Liveness ping from the exam client. A gap here is itself a violation —
  // the candidate cannot forge an absence, so going offline is incriminating
  // rather than exculpatory.
  heartbeat: {
    lastAt: { type: Date },
    sequence: { type: Number, default: 0 },
    missedCount: { type: Number, default: 0 }
  },

  // Face embedding captured at setup, held SERVER-side. Previously the
  // descriptor lived only in React state, so the server had no way to know
  // whether the registered candidate actually sat the exam.
  referenceDescriptor: { type: [Number], default: undefined, select: false },

  // Outcome of the human review for a held attempt.
  decision: {
    state: { type: String, enum: ['pending', 'released', 'invalidated', 'retake'], default: 'pending' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    note: { type: String }
  },

  faceRegistered: { type: Boolean, default: false },
  faceRegisteredAt: { type: Date },
  faceVerificationPassRate: { type: Number, default: 0 }, // 0-1 ratio of verified checks vs total
  totalFaceChecks: { type: Number, default: 0 },
  faceChecksPassed: { type: Number, default: 0 },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

// Index for fast lookups
ProctoringSessionSchema.index({ userId: 1, assessmentId: 1 });
ProctoringSessionSchema.index({ resultId: 1 });
ProctoringSessionSchema.index({ status: 1 });

module.exports = mongoose.model('ProctoringSession', ProctoringSessionSchema);
