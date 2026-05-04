const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const studentSchema = new mongoose.Schema({
  studentId: {
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
    default: 'student',
    immutable: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'Student must be assigned to a college']
  },
  rollNumber: {
    type: String,
    required: [true, 'Please provide roll number']
  },
  section: String,
  department: String,
  semester: Number,
  batch: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  parentName: String,
  parentMobile: String,
  parentEmail: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  assignedTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  assessments: [{
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment'
    },
    score: Number,
    completedAt: Date
  }],
  coachingSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoachSession'
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'graduated'],
    default: 'active'
  },
  profileImage: String,
  admissionDate: {
    type: Date,
    default: Date.now
  },
  // Active vision board for dashboard display
  activeVisionBoardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisionBoardPro',
    default: null
  },
  lastLogin: Date,
  // First login password change requirement
  mustChangePassword: {
    type: Boolean,
    default: true  // New students must change password on first login
  },
  isFirstLogin: {
    type: Boolean,
    default: true  // Track if this is student's first login
  },
  passwordChangedAt: Date,

  // === NEW: Authentication Flow Flags ===
  // True after completing student registration form
  isRegistered: {
    type: Boolean,
    default: false
  },
  // True after completing all mandatory assessments
  isAssessmentCompleted: {
    type: Boolean,
    default: false
  },
  // Account lock for failed OTP attempts (null = not locked)
  accountLockedUntil: {
    type: Date,
    default: null
  },
  // Track OTP verification attempts (reset after success)
  otpAttempts: {
    type: Number,
    default: 0
  },
  // Rate limiting for OTP resends
  lastOtpSentAt: {
    type: Date,
    default: null
  },
  // Session management for One Person Login
  currentSessionId: {
    type: String,
    default: null
  },
  // Hard 3-hour session expiry — set on login, checked on every request
  sessionExpiresAt: {
    type: Date,
    default: null
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

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // CRITICAL FIX: Added return to prevent double hashing
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate student ID (atomic counter to prevent race conditions)
studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'studentId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.studentId = `STU${String(counter.seq).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better query performance
studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ studentId: 1 }, { unique: true, sparse: true });
studentSchema.index({ college: 1 });
studentSchema.index({ rollNumber: 1, college: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ assignedTeacher: 1 });
studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentSchema);
