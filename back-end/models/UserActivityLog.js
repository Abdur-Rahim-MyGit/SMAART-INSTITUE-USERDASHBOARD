const mongoose = require('mongoose');

const userActivityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        required: false
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: false
    },
    eventType: {
        type: String,
        enum: ['tab_switch', 'minimize', 'inactivity'],
        required: [true, 'Event type is required']
    },
    warningsCount: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for query performance
userActivityLogSchema.index({ userId: 1, assessmentId: 1 });
userActivityLogSchema.index({ userId: 1, courseId: 1 });
userActivityLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('UserActivityLog', userActivityLogSchema);
