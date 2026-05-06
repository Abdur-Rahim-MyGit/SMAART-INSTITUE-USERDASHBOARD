const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');
const { createDefaultUserSettings, userSettingsSchema } = require('./schemas/userSettings');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true  // Allows multiple null values, but enforces uniqueness on non-null
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
    required: false,
    validate: {
      validator: function (v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Please provide a valid 10-digit mobile number'
    }
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'moderator', 'consultant', 'college_admin', 'coach', 'student', 'teacher'],
    default: 'student'
  },
  qualification: String,
  specialization: String,
  location: String,
  referralCode: String,
  certificates: [String],
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  department: String,
  subject: String,
  rollNumber: String,
  section: String,
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  suspendedUntil: {
    type: Date,
    default: null
  },
  profileImage: String,
bio: {
    type: String,
    trim: true,
    default: ''
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata'
  },
  dateFormat: {
    type: String,
    default: 'DD/MM/YYYY'
  },
  // Active vision board for dashboard display
  activeVisionBoardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisionBoardPro',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  previousLogin: Date,
  currentSessionId: {
    type: String,
    default: null
  },
// Hard 3-hour session expiry — set on login, checked on every request
  sessionExpiresAt: {
    type: Date,
    default: null
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  settings: {
    type: userSettingsSchema,
    default: createDefaultUserSettings
  },
  badges: [{
    badgeId: String,
    title: String,
    description: String,
    tier: { type: String, enum: ['bronze', 'silver', 'gold'] },
    xp: { type: Number, default: 0 },
    category: String,
    earnedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.userId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'userId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.userId = `USR${String(counter.seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ userId: 1 }, { unique: true, sparse: true });
userSchema.index({ college: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ mobile: 1 });

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

