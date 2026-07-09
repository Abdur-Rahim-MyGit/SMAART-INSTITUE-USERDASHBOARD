const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');
const { createDefaultUserSettings, userSettingsSchema } = require('./schemas/userSettings');

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
  degree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeDegree'
  },
  academic: {
    degreeLevel: {
      type: String,
      default: ''
    },
    domain: {
      type: String,
      default: ''
    },
    degreeGroup: {
      type: String,
      default: ''
    },
    specialisation: {
      type: String,
      default: ''
    }
  },
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
  activeVisionBoardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VisionBoardPro',
    default: null
  },
  lastLogin: Date,
  mustChangePassword: {
    type: Boolean,
    default: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  passwordChangedAt: Date,
  isRegistered: {
    type: Boolean,
    default: false
  },
  isAssessmentCompleted: {
    type: Boolean,
    default: false
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  lastOtpSentAt: {
    type: Date,
    default: null
  },
  currentSessionId: {
    type: String,
    default: null
  },
  // Hard 3-hour session expiry — set on login, checked on every request
  sessionExpiresAt: {
    type: Date,
    default: null
  },
  savedJobs: [{
    jobId: { type: mongoose.Schema.Types.ObjectId, required: true },
    source: { type: String, required: true },
    savedAt: { type: Date, default: Date.now }
  }],
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
  }],
  pushSubscriptions: [{
    endpoint: String,
    expirationTime: Date,
    keys: {
      p256dh: String,
      auth: String
    }
  }]
}, {
  timestamps: true
});

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    try {
      const College = mongoose.model('College');
      const collegeDoc = await College.findById(this.college);
      const collegeNumber = collegeDoc?.collegeNumber || '00';
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const counterId = `studentId_${collegeNumber}_${currentYear}`;

      const counter = await Counter.findByIdAndUpdate(
        { _id: counterId },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.studentId = `STU${collegeNumber}${currentYear}${String(counter.seq).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

studentSchema.index({ email: 1 }, { unique: true });
studentSchema.index({ studentId: 1 }, { unique: true, sparse: true });
studentSchema.index({ college: 1 });
studentSchema.index({ rollNumber: 1, college: 1 });
studentSchema.index({ status: 1 });

studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentSchema);

