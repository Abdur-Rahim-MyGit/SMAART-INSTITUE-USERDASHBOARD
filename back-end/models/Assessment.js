const mongoose = require('mongoose');

// Generic option schema for both Likert and MCQ
const optionSchema = new mongoose.Schema({
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be Number (Likert) or String (MCQ: A, B, C)
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });

// Question schema
const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    default: 'likert',
    enum: ['likert', 'likert_negative', 'likert_7', 'mcq']
  },
  options: {
    type: [optionSchema],
    required: true
  },
  order: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  quotient: {
    type: String,
    trim: true
  },
  difficultyLevel: {
    type: String,
    trim: true
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // For MCQ questions
    required: false
  },
  points: {
    type: Number,
    default: 0
  }
}, { _id: true });

const assessmentSchema = new mongoose.Schema({
  assessmentCode: {
    type: String,
    unique: true
  },
  assessmentName: {
    type: String,
    required: [true, 'Please provide assessment name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide description'],
    trim: true
  },
  questionCategory: {
    type: String,
    required: [true, 'Please provide question category or test name'],
    trim: true
  },
  questions: {
    type: [questionSchema],
    validate: {
      validator: function (questions) {
        return questions && questions.length > 0;
      },
      message: 'At least one question is required'
    }
  },
  duration: {
    type: Number,
    default: 1440, // 24 hours in minutes (constant)
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'completed', 'scheduled'],
    default: 'draft'
  },
  // Scheduling fields
  availableFrom: {
    type: Date,
    required: false
  },
  availableTo: {
    type: Date,
    required: false
  },
  publishedAt: {
    type: Date,
    required: false
  },
  // Assessment settings
  randomizeQuestions: {
    type: Boolean,
    default: false
  },
  showResults: {
    type: Boolean,
    default: true
  },
  allowRetake: {
    type: Boolean,
    default: false
  },
  maxAttempts: {
    type: Number,
    default: 1
  },
  passingScore: {
    type: Number,
    default: 0
  },
  // Tags and categories
  tags: [{
    type: String,
    trim: true
  }],
  // Analytics
  totalAttempts: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  completionRate: {
    type: Number,
    default: 0
  },
  // Responses
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      selectedValue: mongoose.Schema.Types.Mixed, // Can be Number or String
      isCorrect: {
        type: Boolean,
        required: false
      }
    }],
    score: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    timeTaken: {
      type: Number, // in seconds
      default: 0
    },
    submittedAt: {
      type: Date,
      default: Date.now
    },
    attemptNumber: {
      type: Number,
      default: 1
    }
  }],
  // Last modified tracking
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate assessment code before saving (atomic — avoids duplicate-key races)
const { nextSequentialCode } = require('../utils/idGenerator');
assessmentSchema.pre('save', async function (next) {
  try {
    if (!this.assessmentCode) {
      this.assessmentCode = await nextSequentialCode('assessmentCode', 'ASM', 'Assessment', 'assessmentCode');
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
