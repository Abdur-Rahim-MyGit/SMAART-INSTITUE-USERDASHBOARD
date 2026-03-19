const mongoose = require('mongoose');

const userCertificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  issuer: {
    type: String,
    required: true
  },
  issueDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date
  },
  certificateUrl: {
    type: String,
    required: true
  },
  verificationUrl: {
    type: String
  },
  qrCodeIdentifier: {
    type: String
  },
  category: {
    type: String,
    default: 'Other'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserCertificate', userCertificateSchema);
