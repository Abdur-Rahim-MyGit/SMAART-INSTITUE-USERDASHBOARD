const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  // SECTION 1: Institution Identity
  collegeCode: {
    type: String,
    unique: true,
    sparse: true // Auto-generated
  },
  collegeNumber: {
    type: String
  },
  collegeName: { // institution_name
    type: String,
    required: [true, 'Please provide college name'],
    trim: true,
    unique: true
  },
  institutionType: {
    type: String,
    enum: ['College', 'University', 'Central University', 'State University', 'Private University', 'Deemed University', 'Autonomous College', 'Non - Autonomous college'],
    required: true
  },
  governanceType: {
    type: String,
    enum: ['Private', 'Government', 'Autonomous', 'Deemed', ''],
  },
  logo: String, // institution_logo
  email: { // institution_email
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    unique: true
  },
  website: String, // institution_website
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number']
  },
  // Address contains State, City, Country, Address Line, Pincode
  address: {
    street: String, // address_line
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  onboardingDate: { // date_of_onboarding
    type: Date,
    default: Date.now
  },

  // SECTION 2: Institution Relationship
  affiliatedUniversity: String, // For Colleges
  universityType: { // For Universities
    type: String,
    enum: ['State', 'Central', 'Private', 'Deemed']
  },

  // SECTION 4: Primary Coordinator
  coordinatorInfo: {
    name: String,
    designation: String,
    email: String,
    mobile: String
  },

  // SECTION 5: Platform Admin (Referenced)
  collegeAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  collegeAdminPassword: {
    type: String,
    default: ''
  },

  // SECTION 6: Compliance
  registrationNumber: {
    type: String,
    required: true
  },
  accreditationStatus: {
    type: String,
    enum: ['NAAC', 'NBA', 'Both', 'Applied', 'Not Applicable'],
    required: true
  },
  gstNumber: String,
  panNumber: String,

  // SECTION 7: Documents
  mouDocument: String, // mou_or_authorization_letter
  universityActProof: String, // registration_or_act_proof
  ndaDocument: String, // nda_or_service_agreement
  chairmanVideo: {
    type: String,
    required: false // Changed to optional for easier onboarding
  },

  // Media slideshow beside the student login card — set by the SMAART admin
  // (admin panel Community Hub). Images and/or videos, shown in order.
  loginMedia: [{
    url: String,
    resourceType: { type: String, enum: ['image', 'video'], default: 'image' }
  }],

  // Legacy/Additional Documents (Optional)
  additionalAgreement: String,
  institutionalReports: [{
    title: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // SECTION 8: Platform Configuration
  maxFaculty: {
    type: Number,
    required: true,
    default: 100
  },
  maxStudents: {
    type: Number,
    required: true,
    default: 1000
  },

  // SECTION 9: Status & Validity
  validityStartDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  validityEndDate: Date,
  validityDuration: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['Draft', 'Pending Approval', 'Active', 'Suspended', 'Inactive'],
    default: 'Draft'
  },

  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Legacy Fields (kept for backward compatibility or internal logic)
  affiliation: String,
  numberOfDepartments: {
    type: Number,
    default: 0
  },
  departments: [{
    name: { type: String, required: true },
    code: { type: String, required: true },
    totalYears: { type: Number, required: true }
  }],
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
  totalStudents: {
    type: Number,
    default: 0
  },
  activeCourses: {
    type: Number,
    default: 0
  },
  description: String,
  establishedYear: Number,
  accreditation: String
}, {
  timestamps: true
});

// Generate college code and update numberOfDepartments before saving
collegeSchema.pre('save', async function (next) {
  if (!this.collegeCode) {
    try {
      const Counter = mongoose.model('Counter');
      const currentYear = new Date().getFullYear().toString().slice(-2);
      
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'collegeNumberCounter' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      
      this.collegeNumber = String(counter.seq).padStart(2, '0');
      this.collegeCode = `CLG${this.collegeNumber}${currentYear}`;
    } catch (error) {
      return next(error);
    }
  }
  if (this.departments && Array.isArray(this.departments)) {
    this.numberOfDepartments = this.departments.length;
  }
  next();
});

// Indexes for better performance and uniqueness
collegeSchema.index({ collegeName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
collegeSchema.index({ email: 1 }, { unique: true });
collegeSchema.index({ contactNumber: 1 });
collegeSchema.index({ collegeCode: 1 }, { unique: true });

module.exports = mongoose.model('College', collegeSchema);
