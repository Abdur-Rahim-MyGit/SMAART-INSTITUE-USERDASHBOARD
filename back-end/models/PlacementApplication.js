const mongoose = require('mongoose');

/**
 * PlacementApplication
 * --------------------
 * A student's application to a placement posting (college `jobpostings` or
 * SMAART `smaartjobpostings`). Backed by the `placementapplications`
 * collection that routes/placements.js historically wrote to without a schema.
 *
 * `strict: false` keeps any legacy / admin-panel fields that are not listed
 * here, so adopting the model never drops data on save.
 */

const STATUS_HISTORY_ACTORS = ['student', 'recruiter', 'college', 'admin', 'staff', 'system', 'migration'];

const statusHistoryEntrySchema = new mongoose.Schema({
  status: { type: String, required: true, trim: true, maxlength: 60 },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, default: null, trim: true, maxlength: 500 },
  changedBy: { type: String, default: 'system', trim: true },
  changedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // True when the entry was reconstructed from appliedAt/updatedAt rather than
  // recorded at the moment the stage changed. The UI labels such timelines.
  synthesized: { type: Boolean, default: false },
}, { _id: false });

const placementApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentName: { type: String, trim: true },
  studentEmail: { type: String, trim: true, lowercase: true },
  studentMobile: { type: String, trim: true },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },

  job: { type: mongoose.Schema.Types.ObjectId, default: null },
  // Legacy alias of `job`, kept because an older unique index targets it.
  jobPosting: { type: mongoose.Schema.Types.ObjectId, default: null },
  jobSource: { type: String, enum: ['jobpostings', 'smaartjobpostings'], required: true },
  postingOrigin: { type: String, enum: ['SMAART', 'College', 'External'], default: 'College' },
  jobTitle: { type: String, trim: true },
  companyName: { type: String, trim: true },

  resumeUrl: { type: String, default: null },
  portfolioUrl: { type: String, default: null },
  linkedInUrl: { type: String, default: null },
  coverLetter: { type: String, maxlength: 6000 },
  activeBacklog: { type: Number, default: null },

  status: { type: String, default: 'applied', trim: true, maxlength: 60 },
  statusHistory: { type: [statusHistoryEntrySchema], default: [] },
  // Latest note left by staff when changing the stage; shown to the student.
  recruiterNote: { type: String, default: null, trim: true, maxlength: 500 },

  // Offer response
  eSignature: { type: String, default: null },
  signatureDate: { type: Date, default: null },
  declineReason: { type: String, default: null, trim: true },

  appliedAt: { type: Date, default: Date.now },
}, {
  collection: 'placementapplications',
  strict: false,
  timestamps: true,
});

placementApplicationSchema.index({ student: 1, createdAt: -1 });
placementApplicationSchema.index({ college: 1, status: 1 });

/**
 * Builds a two-point history (applied -> current status) for documents that
 * predate `statusHistory`. Pure: returns a new plain object, never writes.
 * Works on lean objects and hydrated documents alike.
 */
placementApplicationSchema.statics.buildFallbackHistory = function buildFallbackHistory(app) {
  const history = [{
    status: 'applied',
    changedAt: app.appliedAt || app.createdAt || null,
    note: null,
    changedBy: 'migration',
    changedById: null,
    synthesized: true,
  }];
  const current = app.status || 'applied';
  if (String(current).toLowerCase() !== 'applied') {
    history.push({
      status: current,
      changedAt: app.updatedAt || null,
      note: app.declineReason || null,
      changedBy: 'migration',
      changedById: null,
      synthesized: true,
    });
  }
  return history;
};

/** Returns the app with a guaranteed non-empty statusHistory (no DB write). */
placementApplicationSchema.statics.withStatusHistory = function withStatusHistory(app) {
  if (!app) return app;
  const plain = typeof app.toObject === 'function' ? app.toObject() : app;
  if (Array.isArray(plain.statusHistory) && plain.statusHistory.length > 0) return plain;
  return { ...plain, statusHistory: this.buildFallbackHistory(plain) };
};

placementApplicationSchema.statics.STATUS_HISTORY_ACTORS = STATUS_HISTORY_ACTORS;

module.exports = mongoose.models.PlacementApplication
  || mongoose.model('PlacementApplication', placementApplicationSchema);
