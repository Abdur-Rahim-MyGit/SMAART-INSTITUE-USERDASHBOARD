const mongoose = require('mongoose');

const CareerGuideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 1. Student Profile & Education
    education: {
        domain: { type: String, required: true }, // Engineering, Business, etc.
        degreeGroup: { type: String, required: true }, // UG, PG, Diploma, etc.
        degree: { type: String, required: true }, // BCA, BTech, etc.
        specialization: { type: String, required: true } // AI, Finance, etc.
    },

    // 2. Job Preferences (3 Levels)
    jobPreferences: {
        primary: {
            sector: { type: String, required: true },
            jobFamily: { type: String, required: true },
            jobRole: { type: String, required: true }
        },
        secondary: {
            sector: { type: String },
            jobFamily: { type: String },
            jobRole: { type: String }
        },
        tertiary: {
            sector: { type: String },
            jobFamily: { type: String },
            jobRole: { type: String }
        }
    },

    // 3. Career Aspirations
    aspirations: {
        jobType: {
            type: String,
            enum: ['Full-Time', 'Part-Time', 'Full-Time Internship', 'Part-Time Internship', 'Freelance or Gig Work', 'Fully Remote']
        },
        expectedSalaryRange: { type: String }, // e.g., "3-5 LPA"
        preferredLocations: [{ type: String }], // up to 3 cities
        organizationType: { type: String } // startup, MNC, government, etc.
    },

    // 4. Work Experience (Conditional list)
    workExperience: [{
        organizationName: String,
        designation: String,
        sector: String,
        experienceType: {
            type: String,
            enum: ['Full-Time', 'Part-Time', 'Full-Time Internship', 'Part-Time Internship', 'Freelance or Gig Work', 'Remote Work', 'Volunteering']
        },
        startDate: Date,
        endDate: Date,
        currentlyWorking: { type: Boolean, default: false }
    }],

    // 5. Skills and Certifications
    skillsAndCertifications: [{
        skillName: String,
        certificateName: String,
        issuingOrganization: String,
        yearOfCompletion: Number,
        verificationMode: {
            type: String,
            enum: ['URL', 'QR Code', 'Not Verified']
        },
        verificationLink: String
    }],

    // AI Generated Output
    output: {
        learningPathOverview: String,
        careerZones: {
            primary: {
                zone: { type: String, enum: ['Green', 'Amber', 'Red'] },
                skillCoverage: Number,
                hiringLikelihood: { type: String, enum: ['Green', 'Amber', 'Red'] },
                marketIntelligence: {
                    demandTrends: String,
                    salaryRange: String
                }
            },
            secondary: {
                zone: { type: String, enum: ['Green', 'Amber', 'Red'] },
                skillCoverage: Number,
                hiringLikelihood: { type: String, enum: ['Green', 'Amber', 'Red'] },
                marketIntelligence: {
                    demandTrends: String,
                    salaryRange: String
                }
            },
            tertiary: {
                zone: { type: String, enum: ['Green', 'Amber', 'Red'] },
                skillCoverage: Number,
                hiringLikelihood: { type: String, enum: ['Green', 'Amber', 'Red'] },
                marketIntelligence: {
                    demandTrends: String,
                    salaryRange: String
                }
            }
        },
        technicalSkills: {
            mustHave: [String], // 5 skills
            niceToHave: [String] // 5 skills
        },
        aiTools: {
            mustHave: [String], // 5 tools
            niceToHave: [String] // 5 tools
        },
        learningPathway: {
            certifications: [String],
            courses: {
                free: [String],
                paid: [String]
            },
            projects: [String]
        }
    },

    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    version: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    generatedDate: Date
});

module.exports = mongoose.model('CareerGuide', CareerGuideSchema);
