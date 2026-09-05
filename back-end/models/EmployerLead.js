const mongoose = require('mongoose');

/**
 * EmployerLead — a self-serve submission from the public "/employer/register"
 * page on the user dashboard.
 *
 * Deliberately NOT the admin project's full employer-portal account (that
 * still lives in the separate admin app when it's reachable). This is just a
 * lightweight inbound-inquiry record so a submission is never lost when the
 * admin app isn't running — someone on the team follows up and onboards the
 * employer manually from here.
 */
const employerLeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  designation: { type: String, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  website: { type: String, trim: true },
  industry: { type: String, trim: true },
  companySize: { type: String, trim: true },
  city: { type: String, trim: true },
  message: { type: String, trim: true },

  status: { type: String, enum: ['New', 'Contacted', 'Converted', 'Not Interested'], default: 'New', index: true },
  notifiedAt: Date,
}, { timestamps: true });

employerLeadSchema.index({ email: 1 });
employerLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EmployerLead', employerLeadSchema);
