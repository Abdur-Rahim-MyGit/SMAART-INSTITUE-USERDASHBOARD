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

const questionBankSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['likert', 'mcq']
  },
  options: {
    type: [optionSchema],
    required: true
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed, // For MCQ questions
    required: false
  },
  points: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    trim: true,
    required: [true, 'Category is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUsedAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better search performance
questionBankSchema.index({ category: 1, type: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ createdBy: 1 });
questionBankSchema.index({ questionText: 'text' });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
