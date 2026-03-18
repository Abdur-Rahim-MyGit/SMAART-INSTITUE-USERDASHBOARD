const mongoose = require('mongoose');

const collegeSchema = new mongoose.Schema({
  collegeCode: {
    type: String,
    unique: true,
    sparse: true // Allow null values during creation
  },
  collegeName: {
    type: String,
    required: [true, 'Please provide college name'],
    trim: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number']
    // Removed unique constraint - duplicates allowed
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    lowercase: true,
    unique: true
  },
  coordinatorInfo: {
    name: String,
    designation: String,
    email: String,
    mobile: String
  },
  institutionType: {
    type: String,
    enum: ['Government', 'Private', 'Autonomous', 'Deemed'],
    required: true
  },
  affiliation: String,
  numberOfDepartments: {
    type: Number,
    default: 0
  },
  departments: [String],
  mouDocument: String,
  additionalAgreement: String,
  institutionalReports: [{
    title: String,
    fileUrl: String,
    uploadDate: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  onboardingDate: {
    type: Date,
    default: Date.now
  },
  collegeAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  activeCourses: {
    type: Number,
    default: 0
  },
  logo: String,
  chairmanVideo: String,
  principalVideo: String
}, {
  timestamps: true
});

// Generate college code before saving
collegeSchema.pre('save', async function(next) {
  if (!this.collegeCode) {
    const count = await mongoose.model('College').countDocuments();
    this.collegeCode = `CLG${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes for better performance and uniqueness
collegeSchema.index({ collegeName: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
collegeSchema.index({ email: 1 }, { unique: true });
collegeSchema.index({ contactNumber: 1 }); // Non-unique index for performance only
collegeSchema.index({ collegeCode: 1 }, { unique: true });

module.exports = mongoose.model('College', collegeSchema);
