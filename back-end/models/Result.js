const mongoose = require('mongoose');

// Response schema for individual question answers
const responseSchema = new mongoose.Schema({
    questionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    selectedValue: {
        type: mongoose.Schema.Types.Mixed, // Can be Number (1-5) or String (A, B, C)
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    isCorrect: {
        type: Boolean
    },
    answeredAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Big Five scores schema
const scoresSchema = new mongoose.Schema({
    openness: {
        type: Number,
        default: 0
    },
    conscientiousness: {
        type: Number,
        default: 0
    },
    extraversion: {
        type: Number,
        default: 0
    },
    agreeableness: {
        type: Number,
        default: 0
    },
    neuroticism: {
        type: Number,
        default: 0
    }
}, { _id: false });

// Main Result schema
const resultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: [true, 'Assessment ID is required']
    },
    assessmentCode: {
        type: String,
        required: true,
        trim: true
    },
    assessmentName: {
        type: String,
        required: true,
        trim: true
    },
    // Question order for this specific user attempt (shuffled)
    questionOrder: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }],
    // User responses - saved directly on each answer
    responses: [responseSchema],
    // Metadata
    startedAt: {
        type: Date,
        default: Date.now
    },
    submittedAt: {
        type: Date,
        required: false
    },
    timeTaken: {
        type: Number, // in seconds
        default: 0
    },
    completionStatus: {
        type: String,
        enum: ['in-progress', 'completed', 'abandoned'],
        default: 'in-progress'
    },
    // Analytics
    totalQuestions: {
        type: Number,
        required: true
    },
    answeredQuestions: {
        type: Number,
        default: 0
    },
    // Big Five Scores (calculated on submission)
    scores: {
        type: scoresSchema,
        default: () => ({})
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    lockedOut: {
        type: Boolean,
        default: false
    },
    lockoutReason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes for performance
resultSchema.index({ userId: 1, assessmentId: 1 });
resultSchema.index({ userId: 1, completionStatus: 1 });
resultSchema.index({ submittedAt: -1 });

// Method to calculate answered questions count
resultSchema.methods.updateAnsweredCount = function () {
    this.answeredQuestions = this.responses.length;
    return this.answeredQuestions;
};


module.exports = mongoose.model('Result', resultSchema);
