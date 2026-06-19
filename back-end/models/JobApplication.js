const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String },
  studentEmail: { type: String },
  studentMobile: { type: String },
  college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
  job: { type: mongoose.Schema.Types.ObjectId, default: null },
  jobSource: { type: String },
  postingOrigin: { type: String },
  jobTitle: { type: String },
  companyName: { type: String },
  resumeUrl: { type: String },
  coverLetter: { type: String },
  status: { type: String, default: 'applied' },
  appliedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('JobApplication', JobApplicationSchema);
