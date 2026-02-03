const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'in-progress', 'completed', 'dropped', 'suspended'],
    default: 'enrolled'
  },
  progress: {
    completedModules: [{
      module: { type: mongoose.Schema.Types.ObjectId },
      completedAt: Date,
      score: Number
    }],
    completedVideos: [{
      video: { type: mongoose.Schema.Types.ObjectId },
      watchedAt: Date,
      watchDuration: Number, // in seconds
      completed: { type: Boolean, default: false }
    }],
    completedQuizzes: [{
      quiz: { type: mongoose.Schema.Types.ObjectId },
      attemptedAt: Date,
      score: Number,
      totalQuestions: Number,
      correctAnswers: Number,
      passed: Boolean
    }],
    reflectionResponses: [{
      question: { type: mongoose.Schema.Types.ObjectId },
      response: String,
      submittedAt: Date
    }],
    downloadedHandouts: [{
      handout: { type: mongoose.Schema.Types.ObjectId },
      downloadedAt: Date
    }]
  },
  overallProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  startDate: Date,
  completionDate: Date,
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: String,
  preAssessment: {
    completed: { type: Boolean, default: false },
    score: Number,
    completedAt: Date
  },
  postAssessment: {
    completed: { type: Boolean, default: false },
    score: Number,
    completedAt: Date
  },
  lastAccessedAt: Date,
  totalTimeSpent: {
    type: Number,
    default: 0 // in minutes
  }
}, {
  timestamps: true
});

// Indexes for faster queries
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });

// Calculate overall progress
enrollmentSchema.methods.calculateProgress = async function() {
  const Course = mongoose.model('Course');
  const course = await Course.findById(this.course);
  
  if (!course || !course.modules || course.modules.length === 0) {
    this.overallProgress = 0;
    return;
  }

  const totalModules = course.modules.length;
  const completedModules = this.progress.completedModules.length;
  
  this.overallProgress = Math.round((completedModules / totalModules) * 100);
  
  // Update status based on progress
  if (this.overallProgress === 100) {
    this.status = 'completed';
    if (!this.completionDate) {
      this.completionDate = new Date();
    }
  } else if (this.overallProgress > 0) {
    this.status = 'in-progress';
  }
  
  await this.save();
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
