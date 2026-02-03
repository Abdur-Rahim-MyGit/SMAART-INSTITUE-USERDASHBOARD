const mongoose = require('mongoose');

// Schema for individual trait scores
const traitScoreSchema = new mongoose.Schema({
    raw: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    level: {
        type: String,
        required: true,
        enum: ['Low', 'Moderate', 'High']
    }
}, { _id: false });

// Main Big5Result schema
const big5ResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    resultId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Result',
        required: [true, 'Result ID is required']
    },
    scores: {
        extraversion: {
            type: traitScoreSchema,
            required: true
        },
        agreeableness: {
            type: traitScoreSchema,
            required: true
        },
        conscientiousness: {
            type: traitScoreSchema,
            required: true
        },
        neuroticism: {
            type: traitScoreSchema,
            required: true
        },
        openness: {
            type: traitScoreSchema,
            required: true
        },
        emotionalStability: {
            type: traitScoreSchema,
            required: false
        }
    },
    calculatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for performance
big5ResultSchema.index({ userId: 1 });
big5ResultSchema.index({ resultId: 1 }, { unique: true });
big5ResultSchema.index({ calculatedAt: -1 });

// Static method to determine level based on raw score
big5ResultSchema.statics.determineLevel = function (score) {
    if (score >= 0 && score <= 55) return 'Low';
    if (score >= 56 && score <= 70) return 'Moderate';
    if (score >= 71 && score <= 100) return 'High';
    return 'Moderate'; // Default fallback
};

module.exports = mongoose.model('Big5Result', big5ResultSchema);
