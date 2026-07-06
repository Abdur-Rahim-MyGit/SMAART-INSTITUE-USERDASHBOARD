const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const itsupportSchema = new mongoose.Schema({
  itsupportId: {
    type: String,
    unique: true,
    sparse: true
  },
  fullName: {
    type: String,
    required: [true, 'Please provide full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number'],
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    default: 'support',
    immutable: true
  },
  profileImage: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  lastLoginIp: String,
  loginHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String,
    browser: String,
    os: String,
    device: String,
    location: String,
    success: {
      type: Boolean,
      default: true
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  loginOtp: String,
  loginOtpExpire: Date
}, {
  timestamps: true
});

// Hash password before saving
itsupportSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
itsupportSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate IT Support ID (atomic counter to prevent race conditions)
itsupportSchema.pre('save', async function (next) {
  if (!this.itsupportId) {
    try {
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        attempts++;

        const counter = await Counter.findByIdAndUpdate(
          { _id: 'itsupportId' },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        const yearSuffix = String(new Date().getFullYear()).slice(-2);
        const generatedId = `ITS${String(counter.seq).padStart(2, '0')}${yearSuffix}`;

        // Check if this ID actually exists
        const existingITSupport = await mongoose.models.ITSupport.findOne({ itsupportId: generatedId });

        if (!existingITSupport) {
          this.itsupportId = generatedId;
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error(`Failed to generate unique IT Support ID after ${maxAttempts} attempts`);
      }

    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better query performance
itsupportSchema.index({ email: 1 }, { unique: true });
itsupportSchema.index({ itsupportId: 1 }, { unique: true, sparse: true });
itsupportSchema.index({ status: 1 });
itsupportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ITSupport', itsupportSchema);
