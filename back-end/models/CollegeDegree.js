const mongoose = require('mongoose');

const collegeDegreeSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: [true, 'Please provide college ID']
  },
  degree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Degree',
    required: [true, 'Please provide degree ID']
  },
  uniqueId: {
    type: String,
    required: [true, 'Please provide unique degree ID']
  },
  level: {
    type: String,
    required: [true, 'Please provide degree level']
  },
  domain: {
    type: String,
    required: [true, 'Please provide domain/field']
  },
  fullName: {
    type: String,
    required: [true, 'Please provide degree full name']
  },
  abbreviation: {
    type: String,
    required: [true, 'Please provide abbreviation']
  },
  specialization: {
    type: String,
    default: 'General'
  },
  duration: {
    type: String,
    default: 'N/A'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness per college-degree combination
collegeDegreeSchema.index({ college: 1, degree: 1 }, { unique: true });
collegeDegreeSchema.index({ college: 1, uniqueId: 1 }, { unique: true });

module.exports = mongoose.model('CollegeDegree', collegeDegreeSchema);
