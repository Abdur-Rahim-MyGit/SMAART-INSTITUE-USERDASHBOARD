const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        // Removed strict enum to allow for broader categories like 'Engineering', 'Security'
    },
    seniority: {
        type: String,
        // Made optional as some roles are general
        default: 'mid'
    },
    description: {
        type: String,
        required: true
    },

    // Required skills with importance weights
    requiredSkills: [{
        name: String,
        level: Number, // Added level
        importance: {
            type: Number,
            min: 1,
            max: 10
        },
        category: String
    }],

    // Salary information
    salary: {
        min: Number,
        max: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        period: {
            type: String,
            default: 'yearly'
        }
    },

    // Job market data
    marketData: {
        demand: String, // Removed strict enum to allow descriptive text
        growth: String, // Changed to String to allow "22% (Much faster...)"
        openings: Number
    },

    // Learning path
    learningPath: [{
        phase: String,
        duration: String,
        skills: [String],
        resources: [{
            type: String,
            title: String,
            url: String,
            platform: String
        }]
    }],

    // Related roles
    relatedRoles: [String],

    // Career progression
    careerProgression: {
        previous: [String],
        next: [String]
    },

    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
roleSchema.index({ title: 1, seniority: 1 });
roleSchema.index({ category: 1 });
roleSchema.index({ 'requiredSkills.name': 1 });

module.exports = mongoose.model('Role', roleSchema);
