const mongoose = require('mongoose');

const collegeRankingSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  collegeName: {
    type: String,
    required: true
  },
  studentCount: {
    type: Number,
    default: 0
  },
  activeStudents: {
    type: Number,
    default: 0
  },
  averageProgress: {
    type: Number,
    default: 0
  },
  participationRate: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    required: true
  }
});

const dailyAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true, // Keep one entry per day
    index: true
  },
  dailyActiveUsers: {
    type: Number,
    default: 0
  },
  activeStudentsCount: {
    type: Number,
    default: 0
  },
  totalEnrollments: {
    type: Number,
    default: 0
  },
  completedEnrollments: {
    type: Number,
    default: 0
  },
  averageCourseCompletionSpeed: {
    type: Number, // Average completion speed in days
    default: 0
  },
  hoursActive: {
    type: Number, // Total estimated hours spent
    default: 0
  },
  collegeRankings: [collegeRankingSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
