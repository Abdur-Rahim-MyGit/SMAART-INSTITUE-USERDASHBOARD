const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
  level: {
    type: String,
    required: true,
    enum: ['Undergraduate (UG)', 'Postgraduate (PG)', 'Doctoral (PhD/Research)', 'Professional / Integrated', 'Diploma'],
    index: true
  },
  domain: {
    type: String,
    required: true,
    index: true
  },
  fullName: {
    type: String,
    required: true,
    index: true
  },
  specialization: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for unique entries and fast filtering
degreeSchema.index({ level: 1, domain: 1, fullName: 1, specialization: 1 }, { unique: true });

module.exports = mongoose.model('Degree', degreeSchema);
