const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');

const teacherSchema = new mongoose.Schema({
  teacherId: {
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
    default: 'teacher',
    immutable: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'Teacher must be assigned to a college']
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject']
  },
  qualification: String,
  specialization: String,
  experience: Number, // Years of experience
  employeeId: String,
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'active'
  },
  profileImage: String,
  certificates: [String],
  assignedClasses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  lastLogin: Date,
  // Session management for One Person Login
  currentSessionId: {
    type: String,
    default: null
  },
  // Hard 3-hour session expiry — set on login, checked on every request
  sessionExpiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // CRITICAL FIX: Added return to prevent double hashing
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
teacherSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate teacher ID (atomic counter to prevent race conditions)
teacherSchema.pre('save', async function (next) {
  if (!this.teacherId) {
    try {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'teacherId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.teacherId = `TCH${String(counter.seq).padStart(5, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Indexes for better query performance
teacherSchema.index({ email: 1 }, { unique: true });
teacherSchema.index({ teacherId: 1 }, { unique: true, sparse: true });
teacherSchema.index({ college: 1 });
teacherSchema.index({ department: 1, college: 1 });
teacherSchema.index({ status: 1 });
teacherSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Teacher', teacherSchema);
