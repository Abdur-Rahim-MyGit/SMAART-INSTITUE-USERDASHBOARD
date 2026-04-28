const mongoose = require('mongoose');
const crypto = require('crypto');

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
    type: String,
    unique: true
  },
  category: {
    type: String,
    default: 'Other'
  }
}, {
  timestamps: true
});

// Generate unique identifier for QR and sharing if not provided
userCertificateSchema.pre('save', function(next) {
  if (!this.qrCodeIdentifier) {
    const year = new Date().getFullYear();
    const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.qrCodeIdentifier = `EXT-${year}-${randomStr}`;
  }
  
  if (!this.verificationUrl) {
    // We will use the frontend URL + the qr identifier
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    this.verificationUrl = `${frontendUrl}/verify-certificate/${this.qrCodeIdentifier}`;
  }
  
  next();
});

module.exports = mongoose.model('UserCertificate', userCertificateSchema);
