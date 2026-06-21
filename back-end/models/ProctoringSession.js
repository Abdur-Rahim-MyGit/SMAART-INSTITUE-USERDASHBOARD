const mongoose = require('mongoose');

const ProctoringSessionSchema = new mongoose.Schema({
  resultId: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  status: { type: String, enum: ['active', 'completed', 'terminated', 'flagged'], default: 'active' },
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
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
}, { timestamps: true });

// Index for fast lookups
ProctoringSessionSchema.index({ userId: 1, assessmentId: 1 });
ProctoringSessionSchema.index({ resultId: 1 });
ProctoringSessionSchema.index({ status: 1 });

module.exports = mongoose.model('ProctoringSession', ProctoringSessionSchema);
