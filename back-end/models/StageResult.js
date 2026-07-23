const mongoose = require('mongoose');

const quotientScoreSchema = new mongoose.Schema({
    rawScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    level: {
        type: String,
        required: true,
        enum: ['Emerging', 'Developing', 'Progressing', 'Strong', 'Advanced']
    },
    earned: {
        type: Number,
        required: true,
        min: 0
    },
    possible: {
        type: Number,
        required: true,
        min: 0
    }
}, { _id: false });

const stageResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        required: true
    },
    // Stage identifier: T1, T2, T3, T4, AIQ, SQ, PIQ
    stage: {
        type: String,
        required: true,
        enum: ['T1', 'T2', 'T3', 'T4', 'AIQ', 'SQ', 'PIQ'],
        index: true
    },
    // Which attempt this result belongs to (1, 2, or 3)
    attemptNumber: {
        type: Number,
        default: 1,
        min: 1,
        max: 10
    },
    // Overall Stage Score (calculated via weighted formula)
    stageScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    // Overall Stage Band (per-quotient 5-band scale, kept for richness/back-compat)
    stageBand: {
        type: String,
        required: true,
        enum: ['Emerging', 'Developing', 'Progressing', 'Strong', 'Advanced'],
        default: 'Emerging'
    },
    // Blueprint v1.0 overall-stage competence classification
    competenceTier: {
        type: String,
        enum: ['Distinction', 'Pass', 'Not Yet Competent', 'Baseline'],
        required: false
    },
    // Pass status
    passed: {
        type: Boolean,
        default: false
    },
    // Quotient Profile - Individual Quotient Scores
    quotientProfile: {
        CRQ: quotientScoreSchema,
        SRQ: quotientScoreSchema,
        LQ: quotientScoreSchema,
        SIQ: quotientScoreSchema,
        PEQ: quotientScoreSchema,
        DAQ: quotientScoreSchema,
        SEQ: quotientScoreSchema
    },
    // Question IDs used in this assessment
    questionIds: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    // Selected answers map
    selectedAnswers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId },
        selectedValue: { type: mongoose.Schema.Types.Mixed },
        isCorrect: { type: Boolean }
    }],
    // Raw score data
    score: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    // Total questions for this stage
    totalQuestions: { type: Number, required: true },
    // Time taken
    timeTaken: { type: Number, default: 0 },
    // Assessment metadata
    assessmentCode: { type: String },
    assessmentType: {
        type: String,
        default: 'STAGE_ASSESSMENT'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
stageResultSchema.index({ userId: 1, stage: 1 });
stageResultSchema.index({ resultId: 1 });
stageResultSchema.index({ createdAt: -1 });

// Get latest result for a user and stage
stageResultSchema.statics.getLatestForUserStage = function (userId, stage) {
    return this.findOne({ userId, stage }).sort({ createdAt: -1 });
};

// Get all stage results for a user
stageResultSchema.statics.getAllForUser = function (userId) {
    return this.find({ userId }).sort({ stage: 1, createdAt: -1 });
};

// Check if user has completed a specific stage
stageResultSchema.statics.hasCompletedStage = async function (userId, stage) {
    const result = await this.findOne({ userId, stage, passed: true });
    return !!result;
};

// Get all attempts for a user and stage (for retry tracking)
stageResultSchema.statics.getAttemptsForUserStage = function (userId, stage) {
    return this.find({ userId, stage }).sort({ attemptNumber: 1, createdAt: 1 });
};

// Count attempts for a user and stage
stageResultSchema.statics.countAttemptsForUserStage = async function (userId, stage) {
    return this.countDocuments({ userId, stage });
};

module.exports = mongoose.model('StageResult', stageResultSchema);
