const mongoose = require('mongoose');

// AIQ Result schema
const aiqResultSchema = new mongoose.Schema({
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
    subscores: {
        a1: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        a2: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        a3: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        a4: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        a5: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        }
    },
    meanScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    aiqPercentage: {
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
    }
}, {
    timestamps: true
});

// Index for quick lookups
aiqResultSchema.index({ userId: 1 });
aiqResultSchema.index({ resultId: 1 });

module.exports = mongoose.model('AIQResult', aiqResultSchema);
