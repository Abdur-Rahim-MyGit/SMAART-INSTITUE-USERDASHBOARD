const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const loginOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  tempToken: {
    type: String,
    required: true,
    unique: true,
  },
  userData: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  // === NEW: Enhanced OTP fields ===
  // Type of flow this OTP is for
  flowType: {
    type: String,
    enum: ['login', 'password-reset', 'first-login', 'account-verify', 'password-change'],
    default: 'login'
  },
  // Maximum allowed attempts before lockout
  maxAttempts: {
    type: Number,
    default: 5
  },
  // Prevent OTP reuse after successful verification
  isUsed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 180, // Document expires after 3 minutes (180 seconds)
  },
});

// Hash OTP before saving
loginOtpSchema.pre('save', async function(next) {
  if (this.isModified('otp')) {
    this.otp = await bcrypt.hash(this.otp, 10);
  }
  next();
});

// Method to verify OTP
loginOtpSchema.methods.verifyOtp = async function(inputOtp) {
  return await bcrypt.compare(inputOtp, this.otp);
};

const LoginOtp = mongoose.model('LoginOtp', loginOtpSchema);

module.exports = LoginOtp;
