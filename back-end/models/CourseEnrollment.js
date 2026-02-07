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

      let course = null;
      // Handle case where this.course is already populated
      if (this.course && this.course.modules) {
        course = this.course;
      } else {
        course = await Course.findById(this.course);
      }

      if (course && course.modules && course.modules.length > 0) {
        let totalExpectedDays = 0;
        let completedDaysCount = 0;

        course.modules.forEach(mod => {
          // Denominator floor is 6 sessions per module (per UI framework)
          const modExpected = Math.max(6, mod.days ? mod.days.length : 0);
          totalExpectedDays += modExpected;

          // Find matching moduleProgress
          const mProg = this.moduleProgress.find(mp =>
            mp.module.toString() === mod._id.toString()
          );

          if (mProg) {
            // Use a Set to avoid double-counting the same day if both video and tasks are done
            const completedInMod = new Set();

            // From videos
            if (mProg.videoProgress) {
              mProg.videoProgress.forEach(vp => {
                // dayId is 1-indexed from frontend
                if (vp.isCompleted) completedInMod.add(vp.dayId);
              });
            }

            // From tasks (completedTasks entries usually imply completion)
            if (mProg.completedTasks) {
              mProg.completedTasks.forEach(ct => {
                completedInMod.add(ct.dayId);
              });
            }

            // Update module status: If all real days are completed, mark as 'completed'
            const realDaysCount = mod.days ? mod.days.length : 0;
            if (realDaysCount > 0 && completedInMod.size >= realDaysCount) {
              mProg.status = 'completed';
            } else if (completedInMod.size > 0) {
              mProg.status = 'in_progress';
            }

            completedDaysCount += completedInMod.size;
          }
        });

        // Final progress = sum of completed days across all modules / sum of expected days (min 6 per mod)
        this.progress = totalExpectedDays > 0
          ? Math.min(100, Math.round((completedDaysCount / totalExpectedDays) * 100))
          : 0;
      } else {
        // Log warning but don't fallback to flawed moduleProgress.length
        console.warn(`[ProgressFix] Skipping progress update: Course ${this.course} not found or has no modules.`);
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
  }
});

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);
