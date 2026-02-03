const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  certificateType: {
    type: String,
    required: true,
    enum: ['capacity', 'capability', 'leadership']
  },
  certificateTitle: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validatedSkills: [{
    label: String,
    score: Number
  }],
  readinessBand: {
    type: String,
    enum: ['Emerging', 'Developing', 'Proficient', 'Advanced', 'Expert'],
    default: 'Proficient'
  },
  assessmentWindow: {
    type: String,
    required: true
  },
  issuingAuthority: {
    type: String,
    default: 'SMAART UK'
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'expired'],
    default: 'active'
  },
  verificationCount: {
    type: Number,
    default: 0
  },
  lastVerifiedAt: {
    type: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    generatedBy: String
  }
}, {
  timestamps: true
});

// Index for faster verification lookups
certificateSchema.index({ certificateId: 1, status: 1 });
certificateSchema.index({ userId: 1, certificateType: 1 });

// Method to increment verification count
certificateSchema.methods.recordVerification = function() {
  this.verificationCount += 1;
  this.lastVerifiedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Certificate', certificateSchema);
