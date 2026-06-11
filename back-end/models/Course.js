const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['mcq', 'true-false', 'short-answer', 'matching'],
    required: true
  },
  options: [String],
  correctAnswer: String,
  explanation: String, // Explanation for the correct answer
  points: { type: Number, default: 1 },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  sequence: Number
}, { _id: true });

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  url: String, // Direct video URL (MP4, etc.)
  embedCode: String, // YouTube/Vimeo embed code
  videoType: {
    type: String,
    enum: ['upload', 'youtube', 'vimeo', 'external'],
    default: 'upload'
  },
  duration: Number, // in seconds
  thumbnail: String,
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  sequence: { type: Number, required: true },
  isRequired: { type: Boolean, default: true }
}, { _id: true });

const reflectionQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'essay', 'file-upload', 'mcq'],
    default: 'text'
  },
  wordLimit: Number,
  isRequired: { type: Boolean, default: true },
  sequence: Number,
  // MCQ fields support
  options: [String],
  correctAnswer: String,
  explanation: String,
  points: { type: Number, default: 1 }
}, { _id: true });

const handoutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  fileUrl: { type: String, required: true },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'other'],
    required: true
  },
  fileSize: Number, // in bytes
  sequence: Number,
  isDownloadable: { type: Boolean, default: true }
}, { _id: true });

// Day schema for module days (6 course completion days + 2 catch-up days)
const daySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true }, // 1-6 for course days, 7-8 for catch-up days
  dayType: {
    type: String,
    enum: ['course', 'catchup'],
    default: 'course'
  },
  moduleDetails: {
    title: String,
    description: String
  },
  textReading: {
    title: String,
    content: String,
    estimatedTime: { type: Number, default: 10 } // in minutes
  },
  videoContent: {
    title: String,
    description: String,
    videoUrl: String,
    duration: Number, // in minutes
    transcription: String,
    embeddedQuestions: [{
      timestamp: Number, // seconds
      question: String,
      options: [String],
      correctAnswer: Number
    }]
  },
  tasks: [{
    type: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer']
    },
    question: String,
    options: [String],
    correctAnswer: Number,
    points: { type: Number, default: 10 }
  }],
  summaryVideo: {
    title: String,
    description: String,
    videoUrl: String,
    duration: Number, // in minutes
    transcription: String
  },
  VideoContent: [{
    videoUrl: String,
    title: String,
    description: String,
    duration: Number,
    transcription: String
  }],
  steps: [{
    stepNumber: Number,
    title: String,
    type: {
      type: String,
      enum: ['video', 'quiz', 'text', 'assignment', 'reflection', 'flashcards', 'assessment', 'submission', 'flashcard']
    },
    content: mongoose.Schema.Types.Mixed,
    introText: [String],
    isRequired: { type: Boolean, default: true }
  }],
  keyTakeaways: [String],
  status: {
    type: String,
    enum: ['draft', 'active', 'completed'],
    default: 'draft'
  }
}, { _id: true });

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  duration: { type: Number, default: 3 }, // in days (completion period)
  totalBatches: { type: Number, default: 25 }, // number of batches per skill
  timeAllocation: Number, // in minutes
  sequence: { type: Number, required: true },
  // Days structure: 6 course days + 2 catch-up days
  days: [daySchema],
  // Legacy support - keep for backward compatibility
  textReading: {
    title: String,
    content: String,
    estimatedTime: { type: Number, default: 10 } // in minutes
  },
  videos: [videoSchema],
  quizzes: [quizSchema],
  reflectionQuestions: [reflectionQuestionSchema],
  handouts: [handoutSchema],
  handouts: [handoutSchema],
  microAssessments: [{
    moduleId: Number,
    dayId: Number,
    stepId: { type: Number, default: 2 }, // Default to step 2 (after video)
    title: String,
    shuffleQuestions: { type: Boolean, default: true },
    questions: [quizSchema]
  }],
  passingCriteria: {
    quizScore: { type: Number, default: 60 }, // percentage
    requiredVideos: { type: Boolean, default: true },
    requiredReflections: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive'],
    default: 'draft'
  }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  courseCode: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Please provide course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide course description']
  },
  duration: {
    type: Number,
    required: [true, 'Please provide course duration in hours']
  },
  banner: String,
  modules: [moduleSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0
  },
  category: String,
  tags: [String],
  /** Admin builder catalogue id e.g. S01, PIQ01 (SMAART-INSTITUTE-ADMIN) */
  courseNumber: {
    type: String,
    trim: true,
    sparse: true,
    index: true,
  },
  /** 8-step learning flow from admin course builder */
  learningFlow: {
    type: mongoose.Schema.Types.Mixed,
    default: undefined,
  },
  preAssessment: {
    isEnabled: { type: Boolean, default: false },
    title: String,
    description: String,
    fileUrl: String,
    questions: [quizSchema],
    passingScore: { type: Number, default: 60 },
    maxAttempts: { type: Number, default: 1 }
  },
  postAssessment: {
    isEnabled: { type: Boolean, default: false },
    title: String,
    description: String,
    fileUrl: String,
    questions: [quizSchema],
    passingScore: { type: Number, default: 60 },
    maxAttempts: { type: Number, default: 3 }
  },
  certificateSettings: {
    isEnabled: { type: Boolean, default: false },
    template: String,
    passingCriteria: {
      overallScore: { type: Number, default: 70 },
      moduleCompletion: { type: Number, default: 100 }
    }
  },
  colleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
courseSchema.index({ status: 1, createdAt: -1 });
courseSchema.index({ courseCode: 1 });
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ colleges: 1 });
courseSchema.index({ createdBy: 1 });

// Generate course code and sync micro-assessments before saving
const { nextSequentialCode } = require('../utils/idGenerator');
courseSchema.pre('save', async function (next) {
  if (!this.courseCode) {
    // Atomic sequential code — avoids the duplicate-key race of countDocuments()+1
    this.courseCode = await nextSequentialCode('courseCode', 'CRS', 'Course', 'courseCode');
  }

  // Sync microAssessments from day quiz steps; keep manually set assessments when no quiz steps exist
  if (this.modules && Array.isArray(this.modules)) {
    this.modules.forEach((module, modIdx) => {
      const fromDays = [];
      if (module.days && Array.isArray(module.days)) {
        module.days.forEach((day) => {
          if (day.steps && Array.isArray(day.steps)) {
            day.steps.forEach((step) => {
              if (
                step.type === 'quiz' &&
                step.content &&
                step.content.questions &&
                step.content.questions.length > 0
              ) {
                fromDays.push({
                  moduleId: module.sequence || modIdx + 1,
                  dayId: day.dayNumber,
                  stepId: step.stepNumber || 4,
                  title: step.title || step.content?.title || 'Micro-Assessment',
                  shuffleQuestions:
                    step.content?.shuffleQuestions !== false &&
                    step.content?.shuffle !== false,
                  questions: step.content.questions,
                });
              }
            });
          }
        });
      }
      const practiceFromFlow =
        this.learningFlow?.stepD_Practice?.activityType === 'quiz' &&
        (this.learningFlow.stepD_Practice.questions || []).length > 0
          ? {
              moduleId: module.sequence || modIdx + 1,
              dayId: 4,
              stepId: 4,
              title: 'Practice',
              shuffleQuestions:
                this.learningFlow.stepD_Practice.randomizeQuestions !== false,
              questions: this.learningFlow.stepD_Practice.questions,
            }
          : null;

      if (fromDays.length > 0) {
        module.microAssessments = fromDays;
      } else if (practiceFromFlow) {
        const kept = (module.microAssessments || []).filter(
          (ma) => Number(ma.dayId) !== 4
        );
        module.microAssessments = [...kept, practiceFromFlow];
      }
    });
  }

  next();
});

module.exports = mongoose.model('Course', courseSchema);
