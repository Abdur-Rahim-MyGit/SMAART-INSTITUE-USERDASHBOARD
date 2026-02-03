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

const baseLineResultSchema = new mongoose.Schema({
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
    // Overall Baseline Score (Average of all quotients)
    baselineScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0
    },
    // Overall Stage Band
    stageBand: {
        type: String,
        required: true,
        enum: ['Emerging', 'Developing', 'Progressing', 'Strong', 'Advanced'],
        default: 'Emerging'
    },
    // T1 Profile - Individual Quotient Scores
    t1Profile: {
        CRQ: quotientScoreSchema,  // Cognitive Readiness Quotient
        SRQ: quotientScoreSchema,  // Social Readiness Quotient
        LQ: quotientScoreSchema,   // Learning Quotient
        SIQ: quotientScoreSchema,  // Self-Identity Quotient
        PEQ: quotientScoreSchema,  // Physical & Emotional Quotient
        DAQ: quotientScoreSchema   // Digital Age Quotient
    },
    // Legacy fields (kept for backward compatibility)
    score: {
        type: Number,
        default: 0
    },
    totalScore: {
        type: Number,
        default: 36
    },
    percentage: {
        type: Number,
        default: 0
    },
    // Assessment metadata
    assessmentType: {
        type: String,
        default: 'T1_BASELINE'
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
baseLineResultSchema.index({ userId: 1 });
baseLineResultSchema.index({ resultId: 1 });
baseLineResultSchema.index({ createdAt: -1 });

// Virtual for getting the most recent result
baseLineResultSchema.statics.getLatestForUser = function (userId) {
    return this.findOne({ userId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('BaseLineResult', baseLineResultSchema);
