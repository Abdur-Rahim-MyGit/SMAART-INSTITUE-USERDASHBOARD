const mongoose = require('mongoose');

// EQ Result schema
const eqResultSchema = new mongoose.Schema({
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
    rawScore: {
        type: Number,
        required: true,
        min: 16,
        max: 80
    },
    normalizedScore: {
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
        enum: ['red', 'amber', 'green', 'dark-green'],
        required: true
    }
}, {
    timestamps: true
});

// Index for quick lookups
eqResultSchema.index({ userId: 1 });
eqResultSchema.index({ resultId: 1 });

module.exports = mongoose.model('EQResult', eqResultSchema);
