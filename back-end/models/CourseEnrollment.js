const mongoose = require('mongoose');

const moduleProgressSchema = new mongoose.Schema({
  module: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed'],
    default: 'not_started'
  },
  videosWatched: [{
    videoId: mongoose.Schema.Types.ObjectId,
    watchedAt: Date,
    duration: Number
  }],
  videoProgress: [{
    dayId: Number,
    stepId: { type: Number, default: 1 }, // NEW: Support for multiple steps per day
    maxWatchedTime: { type: Number, default: 0 }, // in seconds
    videoDuration: { type: Number, default: 0 }, // in seconds
    isCompleted: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now }
  }],
  quizzesTaken: [{
    quizId: mongoose.Schema.Types.ObjectId,
    score: Number,
    totalPoints: Number,
    attempts: Number,
    completedAt: Date
  }],
  reflectionsSubmitted: [{
    questionIndex: Number,
    answer: String,
    submittedAt: Date
  }],
  handoutsDownloaded: [{
    handoutId: String,
    downloadedAt: Date
  }],
  startedAt: Date,
  completedAt: Date,
  timeSpent: { type: Number, default: 0 }, // in minutes
  completedTasks: [{
    dayId: Number,
    taskId: Number,
    completedAt: { type: Date, default: Date.now }
  }]
});

const courseEnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'in_progress', 'completed', 'dropped', 'suspended'],
    default: 'enrolled'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  moduleProgress: [moduleProgressSchema],
  preAssessmentScore: {
    score: Number,
    totalPoints: Number,
    completedAt: Date
  },
  postAssessmentScore: {
    score: Number,
    totalPoints: Number,
    completedAt: Date
  },
  overallScore: {
    type: Number,
    default: 0
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateIssuedDate: Date,
  completionDate: Date,
  lastAccessedAt: Date,
  totalTimeSpent: { type: Number, default: 0 }, // in minutes
  rating: {
    score: { type: Number, min: 1, max: 5 },
    feedback: String,
    ratedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
courseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
courseEnrollmentSchema.index({ college: 1, status: 1 });
courseEnrollmentSchema.index({ status: 1, progress: 1 });

// Calculate progress percentage
courseEnrollmentSchema.methods.calculateProgress = function () {
  if (!this.moduleProgress || this.moduleProgress.length === 0) {
    return 0;
  }

  const completedModules = this.moduleProgress.filter(m => m.status === 'completed').length;
  return Math.round((completedModules / this.moduleProgress.length) * 100);
};

// Update progress before saving
courseEnrollmentSchema.pre('save', async function (next) {
  try {
    // Only calculate progress if there is module progress
    if (this.moduleProgress && this.moduleProgress.length > 0) {
      // Need to fetch the course to know total number of modules
      const Course = mongoose.model('Course');
      const course = await Course.findById(this.course);

      if (course && course.modules && course.modules.length > 0) {
        const completedModules = this.moduleProgress.filter(m => m.status === 'completed').length;
        // Calculate progress based on TOTAL modules in the course, not just started ones
        this.progress = Math.min(100, Math.round((completedModules / course.modules.length) * 100));
      } else {
        // Fallback if course lookup fails (use existing method but limit to 100)
        this.progress = Math.min(100, this.calculateProgress());
      }
    } else {
      this.progress = 0;
    }

    // Update status based on progress
    if (this.progress === 0) {
      this.status = 'enrolled';
    } else if (this.progress === 100) {
      this.status = 'completed';
      if (!this.completionDate) {
        this.completionDate = new Date();
      }
    } else {
      this.status = 'in_progress';
      // If previously completed but now new modules added, reset completion date
      if (this.status !== 'completed') {
        this.completionDate = undefined;
      }
    }

    next();
  } catch (error) {
    next(error);
  }});

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);
