const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Personal Details
  studentId: String,
  fullName: { type: String, required: true },
  nickname: String,
  profilePhoto: String, // Cloudinary URL for profile photo
  educationLevel: String, // User's chosen domain
  dob: Date,
  gender: String,
  email: { type: String, required: true },
  mobileNumber: { type: String, required: false }, // Made optional for progressive section saving
  alternateMobile: String,
  password: { type: String, required: false },
  institution: String,
  department: String,
  yearOfStudy: String,
  yearOfPassing: String,

  // Address (legacy support)
  address: {
    doorNo: String,
    city: String,
    state: String,
    country: String,
    pincode: String,
  },

  // 10th Standard Details
  tenthDetails: {
    schoolName: String,
    yearOfPassing: String,
    percentage: String,
    marksheet: String, // file path
  },

  // 12th Standard Details
  twelfthDetails: {
    schoolName: String,
    stream: String,
    yearOfPassing: String,
    percentage: String,
    marksheet: String, // file path
  },

  // Higher Education Details
  higherEducation: [{
    _id: false,
    id: String,
    qualificationLevel: String,
    degree: String,
    specialization: String,
    institutionName: String,
    university: String,
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
    jobTitle: String,
    industry: String,
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
  }],

  // Technical Certificates
  certificates: [{
    _id: false,
    id: String,
    title: String,
    issuingOrg: String,
    certificateFile: String, // file path
    yearOfCompletion: String,
  }],

  // Legacy fields for backward compatibility
  course: String,
  yearSemester: String,
  admissionDate: Date,
  rollNumber: String,
  academicStatus: String,
  marksheets: mongoose.Schema.Types.Mixed,
  idProof: mongoose.Schema.Types.Mixed,
  otherDetails: mongoose.Schema.Types.Mixed,
  extracurricularActivities: mongoose.Schema.Types.Mixed,

  submissionDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  
  // Single-session enforcement fields
  currentSessionId: { type: String, default: null },
  lastLogin: { type: Date, default: null },
  previousLogin: { type: Date, default: null },
  
  // Streak data - Sunday-based weekly cycle
  streakData: {
    // Which day of the current week the user is on (1-6 for Mon-Sat)
    streakCycleDay: { type: Number, default: 0, min: 0, max: 6 },
    // How many full weeks the user has completed
    streakCyclesCompleted: { type: Number, default: 0, min: 0 },
    // When the current cycle started
    streakStartDate: { type: Date, default: null },
    // "YYYY-MM-DD" of the last recorded activity day
    lastStreakDate: { type: String, default: '' },
    // Whether the user currently has an active streak
    streakActive: { type: Boolean, default: false },
    // Total consecutive days (excluding Sundays)
    totalStreakDays: { type: Number, default: 0 },
    // Log of completed weeks
    streakHistory: [{
      cycleNumber: Number,
      startDate: Date,
      endDate: Date,
      completedAt: { type: Date, default: Date.now }
    }],
    // Sundays taken as holidays
    sundayHolidays: [{
      date: String,
      completedAt: { type: Date, default: Date.now }
    }]
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Hash password before saving
registrationSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
registrationSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Registration', registrationSchema);

