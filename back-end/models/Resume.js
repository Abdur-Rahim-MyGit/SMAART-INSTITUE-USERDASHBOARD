const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalInfo: {
        fullName: String,
        email: String,
        mobile: String,
        location: String,
        targetRole: String,
        linkedinUrl: String,
        githubUrl: String,
        portfolioUrl: String
    },
    summary: String,
    experience: [{
        company: String,
        role: String,
        duration: String,
        location: String,
        description: String
    }],
    education: [{
        institution: String,
        degree: String,
        grade: String,
        year: String,
        location: String
    }],
    skills: {
        technical: String,
        soft: String,
        languages: String
    },
    projects: [{
        title: String,
        description: String,
        link: String
    }],
    achievements: [{
        title: String,
        description: String,
        link: String
    }],
    personalDetails: {
        fatherName: String,
        motherName: String,
        dob: String,
        nationality: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Resume', resumeSchema);
