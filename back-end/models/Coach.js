const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  coachId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please provide coach name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
    lowercase: true
  },
  mobile: {
    type: String,
    required: [true, 'Please provide mobile number']
  },
  qualification: {
    type: String,
    required: true
  },
  specialization: [String],
  experience: Number,
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'on-demand'],
    default: 'part-time'
  },
  assignedColleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  completedSessions: {
    type: Number,
    default: 0
  },
  profileImage: String
}, {
  timestamps: true
});

// Generate coach ID before saving (atomic — avoids duplicate-key races)
const { nextSequentialCode } = require('../utils/idGenerator');
coachSchema.pre('save', async function(next) {
  try {
    if (!this.coachId) {
      this.coachId = await nextSequentialCode('coachId', 'CCH', 'Coach', 'coachId');
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Coach', coachSchema);
