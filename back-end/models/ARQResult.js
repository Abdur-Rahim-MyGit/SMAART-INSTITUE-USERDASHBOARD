const mongoose = require('mongoose');

// ARQ Result schema
const arqResultSchema = new mongoose.Schema({
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
    adaptabilityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    resilienceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    compositeScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    percentileRange: {
        type: String,
        enum: ['0-25', '26-50', '51-75', '76-100'],
        required: true
    },
    colorCode: {
        type: String,
        enum: ['red', 'amber', 'green', 'super-green'],
        required: true
    },
    quartile: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: true
    }
}, {
    timestamps: true
});

// Index for quick lookups
arqResultSchema.index({ userId: 1 });
arqResultSchema.index({ resultId: 1 });

module.exports = mongoose.model('ARQResult', arqResultSchema);
