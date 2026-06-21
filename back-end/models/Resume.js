const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
    {
        // === Multi-version fields ===
        // No unique constraint on userId — one user can have unlimited resumes
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // Human-readable name for this resume version e.g. "Frontend Developer Resume"
        versionName: {
            type: String,
            default: 'My Resume',
            trim: true,
        },
        // Top-level copy of personalInfo.targetRole for quick querying on list screens
        targetRole: {
            type: String,
            default: '',
            trim: true,
        },
        // ATS compliance score (0–100), recalculated and persisted on every save
        atsScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // === Resume content sections ===
        personalInfo: {
            fullName:     String,
            email:        String,
            mobile:       String,
            location:     String,
            targetRole:   String,
            linkedinUrl:  String,
            githubUrl:    String,
            portfolioUrl: String,
            profileImage: String,
        },
        summary: String,
        experience: [
            {
                company:     String,
                role:        String,
                duration:    String,
                location:    String,
                description: String,
            },
        ],
        education: [
            {
                institution: String,
                degree:      String,
                grade:       String,
                year:        String,
                location:    String,
            },
        ],
        skills: {
            technical: String,
            soft:      String,
            languages: String,
        },
        projects: [
            {
                title:       String,
                description: String,
                link:        String,
            },
        ],
        achievements: [
            {
                title:       String,
                description: String,
                link:        String,
            },
        ],
        personalDetails: {
            fatherName:  String,
            motherName:  String,
            dob:         String,
            nationality: String,
        },

        // === Security & verification ===
        verification: {
            resumePublicId: String,
            fingerprint:    String,
            lastExportedAt: Date,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
