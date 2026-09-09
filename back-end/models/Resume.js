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
        // Which ATS template the resume renders with. The builder always sent this,
        // but the field was undeclared here so Mongoose stripped it on save — every
        // stored resume then re-rendered with the default style, which is why the
        // recruiter's Application Pack showed a different template than the student
        // picked. Value matches the ATS_TEMPLATES keys in ResumeBuilder.
        template: {
            type: String,
            default: 'classicBW',
            trim: true,
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
                // internship | full-time | part-time | freelance | volunteer.
                // Legacy rows have no type and render under "Experience".
                type:        { type: String, default: '' },
                company:     String,
                role:        String,
                duration:    String,
                location:    String,
                description: String,
            },
        ],
        education: [
            {
                // degree | diploma | 12th | 10th | other — drives ordering and labels.
                level:          { type: String, default: '' },
                institution:    String,
                degree:         String,
                specialisation: String,
                board:          String,       // board / university
                startYear:      String,
                year:           String,       // year of passing (or expected)
                pursuing:       { type: Boolean, default: false },
                grade:          String,
                location:       String,
            },
        ],
        skills: {
            technical: String,
            soft:      String,
            domain:    String,
            ai:        String,
            languages: String,
            // Proficiency per skill name, keyed off the comma lists above.
            levels: [
                {
                    name:  String,
                    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
                    _id:   false,
                },
            ],
        },
        projects: [
            {
                title:       String,
                techStack:   String,
                role:        String,
                duration:    String,
                outcome:     String,
                description: String,
                link:        String,
            },
        ],
        certifications: [
            {
                name:         String,
                issuer:       String,
                year:         String,
                credentialId: String,
                link:         String,
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
