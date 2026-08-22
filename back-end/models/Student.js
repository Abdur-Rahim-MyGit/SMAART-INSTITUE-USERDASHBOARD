const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Counter = require('./Counter');
const { createDefaultUserSettings, userSettingsSchema } = require('./schemas/userSettings');

// ---------------------------------------------------------------------------
// MERGED MODEL NOTE
// The former `registrations` collection has been folded into `students`.
// - Admin-provisioned identity/account fields stay at the TOP LEVEL.
// - The student's self-service profile intake lives under the embedded
//   `registration` sub-object below.
// - `status` = account lifecycle; `profileStatus` = registration approval.
// - `college`, `rollNumber` and `password` are REQUIRED only once a student is
//   provisioned (status !== 'pending'), so self-registered users can exist as
//   `pending` students before an admin assigns them a college.
// This file must be kept byte-identical with the copy in the USERDASHBOARD repo
// (back-end/models/Student.js).
// ---------------------------------------------------------------------------

const batchSubSchema = new mongoose.Schema({
  batch: { 
    type: String
  },
  startYear: String,
  endYear: String,
  validityDuration: { 
    type: String, 
    default: '1' 
  },
  subscriptionPlan: {
    plan: {
      type: String,
      enum: ['Smaart Core', 'Smaart Standard', 'Smaart Complete'],
      default: 'Smaart Core'
    },
    addons: {
      aiq: { type: Boolean, default: true },
      piq: { type: Boolean, default: false },
      sq: { type: Boolean, default: false },
      britishCouncil: { type: Boolean, default: false }
    }
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, { _id: false });

const departmentSubSchema = new mongoose.Schema({
  degreeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Degree',
    required: [true, 'Degree reference is required']
  },
  uniqueId: {
    type: String,
    required: [true, 'Degree unique ID is required']
  },
  level: {
    type: String,
    required: [true, 'Degree level is required']
  },
  domain: {
    type: String,
    required: [true, 'Domain is required']
  },
  fullName: {
    type: String,
    required: [true, 'Degree full name is required']
  },
  abbreviation: {
    type: String,
    required: [true, 'Abbreviation is required']
  },
  specialization: {
    type: mongoose.Schema.Types.Mixed,
    default: 'General'
  },
  duration: {
    type: String,
    default: 'N/A'
  },
  batch: {
    type: batchSubSchema,
    default: undefined,
    set: function(v) {
      if (typeof v === 'string') {
        if (v.trim() === '') return undefined;
        return { batch: v };
      }
      return v;
    }
  }
}, { _id: false });

// Self-service profile intake (formerly the `registrations` collection).
// Reconciled overlap fields (mobile, dateOfBirth, profileImage, gender,
// password, cgpa, batch, address, notificationPrefs, session/streak data,
// approval status) live at the top level of the student document, NOT here.
const registrationSubSchema = new mongoose.Schema({
  nickname: String,
  bio: { type: String, default: '' },
  educationLevel: String, // User's chosen domain
  alternateMobile: String,
  institution: String,
  department: String, // free-text institution/department (distinct from the structured top-level `department`)
  yearOfStudy: String,
  yearOfPassing: String,

  // 10th Standard Details
  tenthDetails: {
    schoolName: String,
    board: String,
    yearOfPassing: String,
    percentage: String,
    marksheet: String, // file path
  },

  // 12th Standard Details
  twelfthDetails: {
    schoolName: String,
    stream: String,
    board: String,
    yearOfPassing: String,
    percentage: String,
    marksheet: String, // file path
  },

  // Higher Education Details
  higherEducation: [{
    _id: false,
    id: String,
    qualificationLevel: String,
    degree: String, // Domain (e.g. Engineering)
    degreeFullName: String, // (e.g. Bachelor of Technology)
    specialization: String,
    institutionName: String,
    university: String,
    location: String,
    yearOfPassing: String,
    cgpaPercentage: String,
    degreeStatus: String,
    certificate: String, // file path
  }],

  // Extra-Curricular Activities
  extracurricular: [{
    _id: false,
    id: String,
    activityType: String,
    level: String,
    description: String,
    achievements: String,
  }],

  // Job Preferences
  jobPreferences: [{
    _id: false,
    id: String,
    preferredRole: String,
    jobType: String,
    preferredLocation: String,
    willingToRelocate: String,
    expectedSalary: String,
  }],

  // Sector Preferences
  sectorPreferences: {
    preferredSectors: [String],
    secondarySectors: [String],
  },

  // Career Goals
  careerGoals: {
    shortTerm: String,
    mediumTerm: String,
    longTerm: String,
  },

  // Personal Development Goals
  personalDevelopmentGoals: {
    shortTerm: String,
    mediumTerm: String,
    longTerm: String,
  },

  // Work Experience
  workExperience: [{
    _id: false,
    id: String,
    experienceType: String,
    organizationName: String,
    companyName: String,
    jobTitle: String,
    role: String,
    duration: String,
    industry: String,
    location: String,
    startDate: Date,
    endDate: Date,
    currentlyWorking: Boolean,
    description: String,
    certificate: String, // file path
  }],

  // Projects
  projects: [{
    _id: false,
    id: String,
    title: String,
    qualificationLevel: String,
    institution: String,
    teamType: String,
    startDate: Date,
    endDate: Date,
    description: String,
    projectUrl: String,
    link: String,
  }],

  // Technical Certificates (rich objects; distinct from top-level `certificates: [String]`)
  certificates: [{
    _id: false,
    id: String,
    title: String,
    issuingOrg: String,
    issuer: String,
    certificateFile: String, // file path
    link: String,
    yearOfCompletion: String,
    issueDate: Date,
    expiryDate: Date,
    verificationUrl: String,
    qrCodeIdentifier: String,
  }],

  // Legacy fields carried over from the old registration document
  course: String,
  yearSemester: String,
  rollNumber: String,
  academicStatus: String,
  marksheets: mongoose.Schema.Types.Mixed,
  idProof: mongoose.Schema.Types.Mixed,
  otherDetails: mongoose.Schema.Types.Mixed,
  extracurricularActivities: mongoose.Schema.Types.Mixed,

  submissionDate: { type: Date, default: Date.now },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  // Optional back-reference to the legacy User document (aids transition)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit mobile number']
  },
  password: {
    type: String,
    required: [function () { return this.status !== 'pending'; }, 'Please provide password'],
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
    required: [function () { return this.status !== 'pending'; }, 'Student must be assigned to a college']
  },
  rollNumber: {
    type: String,
    required: [function () { return this.status !== 'pending'; }, 'Please provide roll number']
  },
  section: String,
  department: {
    type: departmentSubSchema,
    default: undefined
  },
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
    doorNo: String,
    city: String,
    state: String,
    country: String,
    district: String,
    pincode: String
  },
  timezone: { type: String, default: 'Asia/Kolkata' },
  dateFormat: { type: String, default: 'DD/MM/YYYY' },
  notificationPrefs: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    assessments: { type: Boolean, default: true },
    courses: { type: Boolean, default: true },
    coaching: { type: Boolean, default: true },
    community: { type: Boolean, default: true }
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
    },
    overallCgpa: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    semesterPerformances: [{
      semesterNumber: { type: Number, required: true },
      sgpa: { type: Number, min: 0, max: 10 },
      cgpa: { type: Number, min: 0, max: 10 },
      creditsEarned: { type: Number, default: 0 },
      passingYear: { type: String, default: '' },
      lastUpdated: { type: Date, default: Date.now }
    }],
    activeBacklogs: {
      type: Number,
      default: 0,
      min: 0
    },
    historyOfArrears: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  cgpa: {
    type: String,
    default: ''
  },
  // Account lifecycle status
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended', 'graduated'],
    default: 'active'
  },
  // Registration/profile approval status (formerly Registration.status)
  profileStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  profileImage: String,
  idProof: String,
  // NOTE: `certificates` is defined ONCE above as rich objects. A duplicate
  // `certificates: [String]` used to sit here and, being later in the object
  // literal, silently overrode the rich definition — every registration
  // submit then failed with "Cast to [string] failed". Do not re-add it.
  academicRecords: [{
    semester: Number,
    method: {
      type: String,
      enum: ['slab', 'continuous', 'equal'],
      default: 'slab'
    },
    totalCredits: Number,
    earnedCredits: Number,
    sgpa: Number,
    cgpa: Number,
    status: {
      type: String,
      enum: ['Pass', 'Result Pending', 'Fail', 'Arrear Cleared', 'Has Arrears'],
      default: 'Pass'
    },
    subjects: [{
      code: String,
      name: String,
      credits: Number,
      grade: String,
      pointsEarned: Number,
      isArrearClearance: {
        type: Boolean,
        default: false
      },
      editedBy: String,
      editedAt: Date
    }],
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  activeArrears: [{
    subjectCode: String,
    subjectName: String,
    credits: Number,
    failedInSemester: Number
  }],
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
  previousLogin: { type: Date, default: null },
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
  mustChangePassword: {
    type: Boolean,
    default: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  hasWatchedFirstLoginVideo: {
    type: Boolean,
    default: false
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
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  loginOtp: String,
  loginOtpExpire: Date,
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
  }],

  // Streak data - Sunday-based weekly cycle (formerly Registration.streakData)
  streakData: {
    streakCycleDay: { type: Number, default: 0, min: 0, max: 6 },
    streakCyclesCompleted: { type: Number, default: 0, min: 0 },
    streakStartDate: { type: Date, default: null },
    lastStreakDate: { type: String, default: '' },
    streakActive: { type: Boolean, default: false },
    totalStreakDays: { type: Number, default: 0 },
    streakHistory: [{
      cycleNumber: Number,
      startDate: Date,
      endDate: Date,
      completedAt: { type: Date, default: Date.now }
    }],
    sundayHolidays: [{
      date: String,
      completedAt: { type: Date, default: Date.now }
    }]
  },

  // Self-service profile intake (formerly the `registrations` collection)
  registration: {
    type: registrationSubSchema,
    default: undefined
  }
}, {
  timestamps: true
});

// Pre-init hook: runs before Mongoose hydrates a raw MongoDB document into a
// Student instance. If `department` is stored as a plain string (corrupted data
// from a previous bug), we strip it here so Mongoose never tries to cast a
// primitive value into the departmentSubSchema — which would throw:
//   "Tried to set nested object field `department` to primitive value …"
studentSchema.pre('init', function (obj) {
  if (obj && typeof obj.department === 'string') {
    delete obj.department;
  }
  if (obj && obj.department && typeof obj.department.batch === 'string') {
    obj.department.batch = { batch: obj.department.batch };
  }
});

// Pre-validate hook to clean up empty strings for ObjectId fields and incomplete department objects
studentSchema.pre('validate', function (next) {
  if (this.college === '') this.college = undefined;
  if (this.degree === '') this.degree = undefined;

  if (this.department === '') {
    this.department = undefined;
  } else if (this.department) {
    const deptObj = this.department.toObject ? this.department.toObject() : this.department;
    if (
      Object.keys(deptObj).length === 0 ||
      !deptObj.uniqueId ||
      !deptObj.level ||
      !deptObj.domain ||
      !deptObj.fullName ||
      !deptObj.abbreviation
    ) {
      this.department = undefined;
    }
  }
  next();
});

// Hash password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next(); // CRITICAL FIX: Added return to prevent double hashing
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match password
studentSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Alias kept for code paths migrated from the Registration model
studentSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate student ID (atomic counter to prevent race conditions).
// Only runs once the student is assigned a college — `pending` self-registered
// students keep a null studentId (sparse unique) until an admin provisions them.
studentSchema.pre('save', async function (next) {
  if (!this.studentId && this.college) {
    try {
      const College = mongoose.model('College');
      const collegeDoc = await College.findById(this.college);
      if (!collegeDoc) {
        throw new Error('Assigned college not found for student ID generation');
      }

      const collegeNumber = collegeDoc?.collegeNumber || '00';
      const currentYear = new Date().getFullYear().toString().slice(-2);
      const counterId = `studentId_${collegeNumber}_${currentYear}`;

      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        attempts++;

        const counter = await Counter.findByIdAndUpdate(
          { _id: counterId },
          { $inc: { seq: 1 } },
          { new: true, upsert: true }
        );

        const generatedId = `STU${collegeNumber}${currentYear}${String(counter.seq).padStart(5, '0')}`;

        // Check if this ID actually exists (handling desync between counter and collection)
        const existingStudent = await mongoose.models.Student.findOne({ studentId: generatedId });

        if (!existingStudent) {
          this.studentId = generatedId;
          isUnique = true;
        }
      }

      if (!isUnique) {
        throw new Error(`Failed to generate unique Student ID after ${maxAttempts} attempts`);
      }

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
studentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Student', studentSchema);
