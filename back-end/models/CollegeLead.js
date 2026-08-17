const mongoose = require('mongoose');

/**
 * CollegeLead — a PROSPECT institution in the sales pipeline.
 *
 * Deliberately separate from models/College.js:
 *   - College = an ONBOARDED partner (contract, admin user, subscription, validity dates)
 *     and every College document is surfaced in the public institution selector
 *     (see routes/colleges.js — that GET / has no status filter).
 *   - CollegeLead = someone we want to sell to. No contract, no login, never shown to students.
 *
 * On conversion, a CollegeLead is promoted into a College and `convertedCollegeId` is set.
 */

const STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Meeting',
  'Proposal',
  'Negotiation',
  'Won',
  'Nurturing',
  'Lost'
];

const LOST_REASONS = [
  'Wrong contact',
  'Not interested',
  'Budget',
  'Chose competitor',
  'Not eligible',
  'Duplicate',
  'No response'
];

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Call', 'Email', 'WhatsApp', 'Meeting', 'Note', 'StageChange', 'Assignment', 'System'],
    required: true
  },
  direction: { type: String, enum: ['Outbound', 'Inbound', ''], default: '' },
  outcome: {
    type: String,
    enum: ['Connected', 'No answer', 'Busy', 'Wrong number', 'Switched off', 'Replied', 'Bounced', 'Completed', ''],
    default: ''
  },
  durationSec: Number,
  body: String,
  meta: { type: mongoose.Schema.Types.Mixed },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const collegeLeadSchema = new mongoose.Schema({
  // ---- Identity ----
  leadCode: { type: String, unique: true, sparse: true }, // LEAD-CLG-00001
  collegeName: { type: String, required: true, trim: true },
  shortName: String,
  aisheCode: String, // official AISHE institution code, when known

  institutionType: {
    type: String,
    enum: ['College', 'University', 'Central University', 'State University', 'Private University',
      'Deemed University', 'Autonomous College', 'Non - Autonomous college'],
    default: 'College'
  },
  category: {
    type: String,
    enum: ['Engineering', 'Arts & Science', 'Medical', 'Management', 'Law', 'Polytechnic', 'University', 'Other'],
    default: 'Other'
  },
  governanceType: { type: String, enum: ['Private', 'Government', 'Government Aided', 'Autonomous', 'Deemed', ''], default: '' },
  affiliatedUniversity: String,
  establishedYear: Number,
  approxStudentStrength: Number,

  // ---- Contact ----
  website: String,
  emails: [{ type: String, lowercase: true, trim: true }],
  phones: [{ type: String, trim: true }],

  /**
   * Contact provenance. Nothing is dialled or mailed until this is 'verified'.
   *   pending  — we have the institution but no confirmed phone/email yet
   *   verified — confirmed against an official source (AISHE export, college website, direct call)
   *   invalid  — checked and wrong
   */
  contactStatus: { type: String, enum: ['pending', 'verified', 'invalid'], default: 'pending' },
  contactSourceUrl: String,
  contactVerifiedAt: Date,
  contactVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  address: {
    street: String,
    area: String,
    city: { type: String, default: 'Chennai' },
    district: String,
    state: { type: String, default: 'Tamil Nadu' },
    pincode: String,
    country: { type: String, default: 'India' }
  },
  location: {
    type: { type: String, enum: ['Point'], default: undefined },
    coordinates: { type: [Number], default: undefined } // [lng, lat]
  },

  // ---- Decision makers at the institution ----
  contacts: [{
    name: String,
    designation: String, // Principal, TPO, Dean, HOD, Correspondent
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    isPrimary: { type: Boolean, default: false },
    verified: { type: Boolean, default: false }
  }],

  // ---- Pipeline ----
  stage: { type: String, enum: STAGES, default: 'New', index: true },
  lostReason: { type: String, enum: [...LOST_REASONS, ''], default: '' },
  lostNote: String,

  score: { type: Number, default: 0, min: 0, max: 100 },
  scoreBreakdown: { type: mongoose.Schema.Types.Mixed },

  source: {
    type: String,
    enum: ['AISHE Import', 'TNEA List', 'Manual', 'Website Enquiry', 'Referral', 'Event', 'Cold Outreach', 'Partner'],
    default: 'Manual'
  },
  sourceBatch: String, // e.g. "chennai-seed-2026-08"

  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  ownerHistory: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now }
  }],

  tags: [String],

  // ---- Follow-up tracking ----
  nextFollowUpAt: Date,
  lastActivityAt: Date,
  attemptCount: { type: Number, default: 0 },

  // ---- Commercials ----
  expectedSeats: Number,
  expectedValue: Number,
  proposedPlan: { type: String, enum: ['Smaart Core', 'Smaart Standard', 'Smaart Complete', ''], default: '' },

  // ---- Conversion / dedupe ----
  convertedCollegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  convertedAt: Date,
  isDuplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'CollegeLead' },

  activities: [activitySchema],

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Queue queries the lead page actually runs
collegeLeadSchema.index({ ownerId: 1, nextFollowUpAt: 1 });
collegeLeadSchema.index({ stage: 1, lastActivityAt: -1 });
collegeLeadSchema.index({ 'address.city': 1, category: 1 });
collegeLeadSchema.index({ contactStatus: 1 });
collegeLeadSchema.index({ phones: 1 });
collegeLeadSchema.index({ emails: 1 });
// Case-insensitive uniqueness on name — the natural key for re-running the seeder
collegeLeadSchema.index({ collegeName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
collegeLeadSchema.index({ collegeName: 'text', shortName: 'text', 'address.area': 'text' });
collegeLeadSchema.index({ location: '2dsphere' }, { sparse: true });

collegeLeadSchema.pre('save', async function (next) {
  if (!this.leadCode) {
    try {
      const Counter = mongoose.model('Counter');
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'collegeLeadCounter' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.leadCode = `LEAD-CLG-${String(counter.seq).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

collegeLeadSchema.statics.STAGES = STAGES;
collegeLeadSchema.statics.LOST_REASONS = LOST_REASONS;

module.exports = mongoose.model('CollegeLead', collegeLeadSchema);
