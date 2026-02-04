const mongoose = require('mongoose');

// SQ Result schema
const sqResultSchema = new mongoose.Schema({
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
        min: 20,
        max: 100
    },
    sqPercentage: {
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
    raggCategory: {
        type: String,
        enum: ['red', 'amber', 'green', 'super-green'],
        required: true
    },
    colorCode: {
        type: String,
        required: true
    },
    quartile: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: true
    },
    description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index for quick lookups
sqResultSchema.index({ userId: 1 });
sqResultSchema.index({ resultId: 1 });

module.exports = mongoose.model('SQResult', sqResultSchema);
