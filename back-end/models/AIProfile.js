const mongoose = require('mongoose');

const aiProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Professional Information
    skills: [{
        type: String,
        trim: true
    }],
    experience: {
        type: String,
        trim: true
    },
    education: {
        type: String,
        trim: true
    },
    interests: [{
        type: String,
        trim: true
    }],
    goals: {
        type: String,
        trim: true
    },
    experienceLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
    },

    // Career Preferences
    preferredIndustry: String,
    preferredWorkStyle: {
        type: String,
        enum: ['Remote', 'Hybrid', 'On-site', 'Flexible']
    },
    targetRole: String,

    // AI Analysis Results
    lastAnalysis: {
        strengths: [String],
        improvements: [String],
        recommendations: [String],
        nextSteps: [String],
        analyzedAt: Date
    },

    // Career Recommendations
    careerPaths: [{
        title: String,
        fitReason: String,
        requiredSkills: [String],
        salaryRange: String,
        growthPotential: String,
        generatedAt: Date
    }],

    // Skill Gap Analysis
    skillGaps: [{
        targetRole: String,
        matchingSkills: [String],
        missingSkills: [String],
        learningPriority: [String],
        analyzedAt: Date
    }],

    // Learning Plans
    learningPlans: [{
        targetRole: String,
        timeframe: String,
        monthlyBreakdown: mongoose.Schema.Types.Mixed,
        projects: [String],
        milestones: [String],
        createdAt: Date
    }],

    // Resume Versions
    resumes: [{
        targetRole: String,
        summary: String,
        keySkills: [String],
        experience: String,
        achievements: [String],
        keywords: [String],
        generatedAt: Date
    }],

    // Metadata
    completionPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Update lastUpdated on save
aiProfileSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

// Calculate completion percentage
aiProfileSchema.methods.calculateCompletion = function () {
    let completed = 0;
    const total = 7;

    if (this.skills && this.skills.length > 0) completed++;
    if (this.experience) completed++;
    if (this.education) completed++;
    if (this.interests && this.interests.length > 0) completed++;
    if (this.goals) completed++;
    if (this.targetRole) completed++;
    if (this.preferredIndustry) completed++;

    this.completionPercentage = Math.round((completed / total) * 100);
    return this.completionPercentage;
};

module.exports = mongoose.model('AIProfile', aiProfileSchema);
