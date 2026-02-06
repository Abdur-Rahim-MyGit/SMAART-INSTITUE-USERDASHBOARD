const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Education
    education: [{
        degree: String,
        institution: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
        grade: String,
        current: Boolean
    }],

    // Work Experience
    experience: [{
        company: String,
        role: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
        achievements: [String],
        skills: [String]
    }],

    // Skills with proficiency levels
    skills: [{
        name: String,
        level: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        category: {
            type: String,
            enum: ['technical', 'soft', 'language', 'tool', 'domain']
        },
        verified: {
            type: Boolean,
            default: false
        }
    }],

    // Interests & Goals
    interests: [String],
    careerGoals: {
        shortTerm: String,
        longTerm: String,
        targetRoles: [String],
        targetIndustries: [String]
    },

    // Constraints
    constraints: {
        preferredLocations: [String],
        salaryExpectation: {
            min: Number,
            max: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        },
        workType: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite', 'flexible']
        },
        availability: {
            type: String,
            enum: ['immediate', '2-weeks', '1-month', '2-months', 'flexible']
        }
    },

    // Readiness Metrics (SMAART Minds Core)
    readinessMetrics: {
        careerReadinessScore: { type: Number, default: 0 }, // 0-100
        interviewReadiness: { type: Number, default: 0 },
        marketFitScore: { type: Number, default: 0 },
        history: [{
            score: Number,
            date: Date
        }]
    },

    // Detailed Assessments
    assessments: {
        big5: {
            openness: Number,
            conscientiousness: Number,
            extraversion: Number,
            agreeableness: Number,
            neuroticism: Number,
            completedAt: Date
        },
        cognitive: {
            logic: Number,
            verbal: Number,
            spatial: Number,
            memory: Number,
            completedAt: Date
        },
        vak: {
            visual: Number,
            auditory: Number,
            kinesthetic: Number,
            completedAt: Date
        },
        english: {
            grammar: Number,
            vocabulary: Number,
            comprehension: Number,
            completedAt: Date
        }
    },

    // Skills Passport (Verifiable Credentials)
    skillsPassport: {
        status: { type: String, enum: ['active', 'pending', 'revoked'], default: 'pending' },
        issuedAt: Date,
        issuerSignature: String,
        verifiedSkills: [{
            skill: String,
            level: Number,
            evidence: String, // Link to project/cert
            verifiedBy: String,
            verifiedAt: Date
        }],
        badges: [{
            name: String,
            imageUrl: String,
            issuedAt: Date
        }]
    },

    // AI Analysis
    aiAnalysis: {
        strengths: [{
            skill: String,
            evidence: String,
            score: Number
        }],
        weaknesses: [{
            skill: String,
            severity: String,
            recommendation: String
        }],
        recommendedPaths: [{
            role: String,
            matchScore: Number,
            reasoning: String,
            timeline: String,
            salaryRange: String,
            marketDemand: String,
            activeJobsSearchUrl: String
        }],
        readinessBreakdown: {
            technical: { type: Number, default: 0 },
            communication: { type: Number, default: 0 },
            industry: { type: Number, default: 0 }
        },
        scoreExplanation: String,
        resources: {
            mustHave: [String],
            niceToHave: [String]
        },
        lastAnalyzed: Date
    },

    // Progress Tracking
    progress: {
        coursesCompleted: [{
            title: String,
            platform: String,
            completedAt: Date,
            certificate: String
        }],
        projectsCompleted: [{
            title: String,
            description: String,
            skills: [String],
            completedAt: Date,
            url: String
        }],
        microChallenges: [{
            title: String,
            employer: String,
            score: Number,
            completedAt: Date
        }]
    }
}, {
    timestamps: true
});

// Indexes for performance
profileSchema.index({ 'skills.name': 1 });
profileSchema.index({ 'careerGoals.targetRoles': 1 });

module.exports = mongoose.model('Profile', profileSchema);
