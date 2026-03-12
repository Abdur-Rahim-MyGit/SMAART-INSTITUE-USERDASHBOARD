const mongoose = require('mongoose');

/**
 * Career Intelligence Model
 * Stores user career input + AI-generated career intelligence report
 * Part of the SMAART Toolkit - Career Data Fetcher module
 */

const careerInputSchema = new mongoose.Schema({
    // Career Goals
    shortTermGoal: { type: String, required: true },
    longTermGoal: { type: String, required: true },

    // Education Background
    degree: { type: String, required: true },
    specialization: { type: String, required: true },
    collegeType: { type: String, enum: ['Government', 'Private', 'Deemed', 'Autonomous', 'IIT/NIT', 'Other'], default: 'Private' },
    yearOfGraduation: { type: Number },
    academicPerformance: { type: String }, // Optional: CGPA or percentage

    // Area of Interest
    areaOfInterest: {
        type: String,
        enum: ['Technology', 'Business', 'Healthcare', 'Finance', 'Creative', 'Core Engineering', 'Education', 'Government', 'Others'],
        required: true,
    },
    areaOfInterestOther: { type: String }, // If "Others" is selected

    // Job Preference
    interestedJobRole: { type: String, required: true },
    jobSector: {
        type: String,
        enum: ['IT', 'Core Engineering', 'Startup', 'MNC', 'Government', 'Freelance', 'Research', 'Others'],
        required: true,
    },
    preferredLocation: { type: String },
    expectedSalaryRange: {
        type: String,
        enum: ['0-3 LPA', '3-6 LPA', '6-10 LPA', '10-15 LPA', '15-25 LPA', '25+ LPA'],
    },
    // Domain-Controlled Generation
    domain: { type: String, required: true }, // Mandatory: IT Security, Data Science, Web Development, etc.
});

const careerOutputSchema = new mongoose.Schema({
    // 1. Technical Skills Required
    technicalSkills: {
        coreSkills: [String],
        toolsAndTechnologies: [String],
        certifications: [mongoose.Schema.Types.Mixed], // Supports {name, provider, cost} or Strings
    },

    // 2. AI Skills
    aiSkills: {
        skills: [String],
        tools: [mongoose.Schema.Types.Mixed], // Supports {name, description, costType}
        description: String,
    },

    // 3. Human Intelligence Skills (15+)
    humanIntelligenceSkills: [mongoose.Schema.Types.Mixed], // Supports {name, code, taskApplication, priority}

    // 4. Jobs They Can Apply For
    suggestedJobs: {
        entryLevel: [mongoose.Schema.Types.Mixed], // Supports {title, description, salaryRange}
        midLevel: [mongoose.Schema.Types.Mixed],
        seniorLevel: [mongoose.Schema.Types.Mixed],
        lateralOpportunities: [mongoose.Schema.Types.Mixed],
    },

    // 5. Emerging Jobs
    emergingJobs: [mongoose.Schema.Types.Mixed],

    // 6. Career Path Roadmap
    careerPathRoadmap: [mongoose.Schema.Types.Mixed],

    // 7. Future Scope With AI
    futureScope: {
        aiImpact: String,
        aiEnhancement: String,
        automationRisk: String,
        stayRelevantTips: String,
        automatedTasks: [String],
        humanTasksThatRemain: [String],
        jobChangeSummary: String,
    },

    // 8. Job Market Demand
    marketDemand: {
        demandLevel: { type: String }, // Removed strict enum to allow Excel-specific demand strings
        salaryRange: String,
        salaryGrowthPrediction: String,
        geographicDemand: String,
        industryTrends: String,
    },

    // 9. Resource Map
    resourceMap: {
        freeCourses: [String],
        paidCourses: [String],
        tools: [String],
        learningRoadmap: String,
        smaartModules: [String],
    },

    // 10. Qualifications Needed
    qualificationsNeeded: [mongoose.Schema.Types.Mixed],

    // Skill Gap & Match Metrics
    skillGapPercentage: { type: Number, min: 0, max: 100 },
    careerMatchPercentage: { type: Number, min: 0, max: 100 },
    aiConfidenceScore: { type: Number, min: 0, max: 100 },

    // Metadata & Tracking
    dataSource: mongoose.Schema.Types.Mixed,
    rawAIResponse: { type: String },
}, { _id: false });

const careerIntelligenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
    },

    // Input
    careerInput: careerInputSchema,

    // Output
    careerOutput: careerOutputSchema,

    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    },
    errorMessage: { type: String },

    // Version tracking
    version: { type: Number, default: 1 },
    generatedDate: { type: Date },

    // ── Simulation Engine Fields ──
    isSimulated: { type: Boolean, default: false, index: true },
    simulationBatchId: { type: String, index: true }, // e.g. SIM_2026_03_02_1709389500000
    domain: { type: String }, // e.g. "Web Development", "Data Science & AI"

}, {
    timestamps: true,
});

// Index for efficient querying
careerIntelligenceSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('CareerIntelligence', careerIntelligenceSchema);
