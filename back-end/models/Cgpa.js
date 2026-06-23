const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  code: { type: String },
  name: { type: String },
  input: { type: String },
  credits: { type: String },
  inputSlab: { type: String },
  inputNumeric: { type: String }
});

const semesterSchema = new mongoose.Schema({
  semester: { type: Number, required: true },
  subjects: [subjectSchema]
});

const cgpaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  activeMethod: {
    type: String,
    enum: ['slab', 'continuous', 'equal'],
    default: 'slab'
  },
  semesters: [semesterSchema],
  cgpa: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  totalCredits: { type: Number, default: 0 },
  totalSubjects: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Cgpa', cgpaSchema);
