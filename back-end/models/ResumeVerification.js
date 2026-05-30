const mongoose = require('mongoose');

const resumeVerificationSchema = new mongoose.Schema(
  {
    resumePublicId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    fingerprint: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    holderName: String,
    targetRole: String,
    email: String,
    organization: {
      type: String,
      default: 'SMAART Institute',
    },
    status: {
      type: String,
      enum: ['saved', 'issued', 'revoked'],
      default: 'issued',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    exportHistory: [
      {
        exportedAt: { type: Date, default: Date.now },
        ip: String,
      },
    ],
  },
  { timestamps: true }
);

resumeVerificationSchema.index({ userId: 1, fingerprint: 1 }, { unique: true });

module.exports = mongoose.model('ResumeVerification', resumeVerificationSchema);
