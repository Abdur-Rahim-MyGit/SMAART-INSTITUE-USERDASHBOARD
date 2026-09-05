const mongoose = require('mongoose');

/**
 * EmployerLead — a FALLBACK record of a "/employer/register" submission.
 *
 * The primary destination for a submission is the admin project's own
 * Recruiter collection (its real review queue) — routes/employerRegistration.js
 * forwards every submission there first. This model only exists to make sure
 * a submission is never silently lost when that forward call fails (the
 * admin backend is down, unreachable, etc.): the same fields are saved here
 * so someone can register the employer manually later.
 *
 * Field names mirror the admin project's own registration form exactly
 * (Recruiter model / EmployerRegistration.js) rather than being renamed, so
 * a saved fallback record can be replayed into the admin API as-is.
 */
const employerLeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  fullName: { type: String, required: true, trim: true }, // contact person
  designation: { type: String, trim: true },
  branch: { type: String, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  mobile: { type: String, required: true, trim: true },
  country: { type: String, trim: true, default: 'India' },
  gstin: { type: String, trim: true },
  cin: { type: String, trim: true },
  identifier: { type: String, trim: true }, // non-India business registration number
  sourceType: { type: String, default: 'SMAART_NETWORK' },
  termsAccepted: {
    hiringTerms: { type: Boolean, default: false },
    fairHiring: { type: Boolean, default: false },
    dataProcessing: { type: Boolean, default: false },
  },

  forwardedToAdmin: { type: Boolean, default: false },
  forwardError: String,
  status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Not Interested'], default: 'New', index: true },
}, { timestamps: true });

employerLeadSchema.index({ email: 1 });
employerLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmployerLead', employerLeadSchema);
