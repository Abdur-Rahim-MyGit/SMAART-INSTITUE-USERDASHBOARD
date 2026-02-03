const mongoose = require('mongoose');

// VAK Result schema
const vakResultSchema = new mongoose.Schema({
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
    scores: {
        visual: {
            type: Number,
            required: true,
            default: 0
        },
        auditory: {
            type: Number,
            required: true,
            default: 0
        },
        kinesthetic: {
            type: Number,
            required: true,
            default: 0
        }
    },
    learningStyle: {
        type: String,
        enum: ['Visual', 'Auditory', 'Kinesthetic', 'Bimodal (VA)', 'Bimodal (AK)', 'Bimodal (VK)', 'Trimodal (VAK)', 'Mixed'],
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
vakResultSchema.index({ userId: 1 });
vakResultSchema.index({ resultId: 1 });

module.exports = mongoose.model('VAKResult', vakResultSchema);
