const mongoose = require('mongoose');

const userBadgeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badgeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    earnedDate: {
        type: Date,
        default: Date.now
    },
    progress: {
        current: {
            type: Number,
            default: 0
        },
        target: {
            type: Number,
            default: 1
        },
        percentage: {
            type: Number,
            default: 0
        }
    },
    isEarned: {
        type: Boolean,
        default: false
    },
    metadata: {
        // Store additional context about how the badge was earned
        courseId: mongoose.Schema.Types.ObjectId,
        courseName: String,
        moduleId: mongoose.Schema.Types.ObjectId,
        moduleName: String,
        assessmentCode: String,
        score: Number,
        percentile: Number,
        streakCount: Number,
        customData: mongoose.Schema.Types.Mixed
    },
    notificationSent: {
        type: Boolean,
        default: false
    },
    viewed: {
        type: Boolean,
        default: false
    },
    viewedAt: Date
}, {
    timestamps: true
});

// Index to speed up lookups for a user's badges
userBadgeSchema.index({ userId: 1, badgeId: 1 });
userBadgeSchema.index({ userId: 1, isEarned: 1 });
userBadgeSchema.index({ userId: 1, earnedDate: -1 });

// Calculate progress percentage before saving
userBadgeSchema.pre('save', function (next) {
    if (this.progress.target > 0) {
        this.progress.percentage = Math.round((this.progress.current / this.progress.target) * 100);

        // Auto-mark as earned if progress reaches 100%
        if (this.progress.percentage >= 100 && !this.isEarned) {
            this.isEarned = true;
            this.earnedDate = new Date();
        }
    }
    next();
});

module.exports = mongoose.model('UserBadge', userBadgeSchema);
