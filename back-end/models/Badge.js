const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    badgeId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['assessment', 'learning', 'streak', 'community', 'certification', 'milestone', 'special'],
        required: true
    },
    tier: {
        type: String,
        enum: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
        default: 'bronze'
    },
    xp: {
        type: Number,
        default: 0,
        min: 0
    },
    icon: {
        type: String, // Icon name or URL
        default: 'trophy'
    },
    color: {
        type: String, // Hex color code
        default: '#FFD700'
    },
    criteria: {
        type: {
            type: String,
            enum: ['course_completion', 'assessment_score', 'streak', 'module_completion', 'custom'],
            required: true
        },
        // For course_completion
        courseId: mongoose.Schema.Types.ObjectId,
        // For assessment_score
        assessmentCode: String,
        minScore: Number,
        percentile: Number,
        // For streak
        streakDays: Number,
        // For module_completion
        moduleCount: Number,
        // Custom criteria (evaluated programmatically)
        customRule: String
    },
    isActive: {
        type: Boolean,
        default: true
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
badgeSchema.index({ category: 1, tier: 1 });
badgeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Badge', badgeSchema);
