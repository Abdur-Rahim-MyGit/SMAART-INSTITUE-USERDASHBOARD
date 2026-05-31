const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseCode: {
    type: String,
    required: true
  },
  moduleId: {
    type: String,
    required: true
  },
  dayId: {
    type: Number,
    required: true
  },
  stepId: {
    type: Number,
    required: true
  },
  // Video fields
  last_timestamp: {
    type: Number, // in seconds
    default: 0
  },
  videoDuration: {
    type: Number,
    default: 0
  },
  videoCompleted: {
    type: Boolean,
    default: false
  },
  // Assignment fields
  assignmentStatus: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Submitted'],
    default: 'Not Started'
  },
  assignmentProgress: {
    type: Number, // percentage, e.g. 0 to 100
    default: 0
  },
  // Test / Quiz fields
  testScore: {
    type: Number,
    default: null
  },
  testTotalPoints: {
    type: Number,
    default: null
  },
  testCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'user_progress'
});

// Single unique index to fetch or update progress per user, course, module, day, and step
userProgressSchema.index({ user: 1, courseCode: 1, moduleId: 1, dayId: 1, stepId: 1 }, { unique: true });

module.exports = mongoose.model('UserProgress', userProgressSchema);
