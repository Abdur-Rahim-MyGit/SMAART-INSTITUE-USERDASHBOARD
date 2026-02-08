const AIProfile = require('../models/AIProfile');
const ChatMessage = require('../models/ChatMessage');
const openRouterService = require('../services/openRouterService');
const { v4: uuidv4 } = require('uuid');

/**
 * AI Career Coach Controller
 * Handles all AI career coaching features
 */

// Get or create AI profile (Enhanced with Registration)
exports.getProfile = async (req, res) => {
    try {
        const Registration = require('../models/Registration');
        let profile = await AIProfile.findOne({ userId: req.user.id });
        const registration = await Registration.findOne({ userId: req.user.id });

        if (!profile) {
            profile = new AIProfile({
                userId: req.user.id,
                skills: [],
                interests: [],
                experienceLevel: 'Beginner'
            });
            await profile.save();
        }

        res.json({
            success: true,
            profile,
            registration // Include full registration data for display
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

// Update AI profile
exports.updateProfile = async (req, res) => {
    try {
        const updates = req.body;

        let profile = await AIProfile.findOne({ userId: req.user.id });

        if (!profile) {
            profile = new AIProfile({ userId: req.user.id, ...updates });
        } else {
            Object.assign(profile, updates);
        }

        profile.calculateCompletion();
        await profile.save();

        res.json({
            success: true,
            profile,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// Analyze profile with AI (Enhanced with Registration Data)
exports.analyzeProfile = async (req, res) => {
    try {
        const Registration = require('../models/Registration');

        // Fetch both AIProfile (if exists) and Registration data
        const profile = await AIProfile.findOne({ userId: req.user.id }); // optional
        const registration = await Registration.findOne({ userId: req.user.id });

        if (!registration && !profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your registration or profile first'
            });
        }

        // Construct Rich Profile Object from Registration Data
        const richProfile = {
            fullName: registration?.fullName || 'User',
            education: registration?.higherEducation
                ? `${registration.higherEducation.degree} in ${registration.higherEducation.specialization} (${registration.higherEducation.institutionName})`
                : (profile?.education || 'Not specified'),

            skills: profile?.skills || [], // Registration doesn't have explicit 'skills' array? It has certificates/projects

            experience: registration?.workExperience?.map(exp =>
                `${exp.jobTitle} at ${exp.organizationName} (${exp.industry}) - ${exp.description}`
            ).join('; ') || (profile?.experience || 'None'),

            projects: registration?.projects?.map(proj =>
                `${proj.title}: ${proj.description}`
            ).join('; ') || 'None',

            goals: registration?.careerGoals
                ? `Short-term: ${registration.careerGoals.shortTerm}, Long-term: ${registration.careerGoals.longTerm}`
                : (profile?.goals || 'Not specified'),

            interests: registration?.sectorPreferences?.preferredSectors || (profile?.interests || []),

            certificates: registration?.certificates?.map(cert =>
                `${cert.title} from ${cert.issuingOrg}`
            ).join(', ') || 'None'
        };

        // If no skills in AIProfile, try to infer from previous fields? 
        // Or AI will infer from text.

        const result = await openRouterService.analyzeProfile(richProfile);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Update AIProfile with results if it exists, or create new one
        if (profile) {
            profile.lastAnalysis = {
                // Map AI result to schema fields if possible
                // For now just storing timestamp
                analyzedAt: new Date()
            };
            await profile.save();
        }

        res.json({
            success: true,
            analysis: result.message,
            profile: richProfile
        });
    } catch (error) {
        console.error('Analyze Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze profile'
        });
    }
};

// Get career recommendations
exports.getCareerRecommendations = async (req, res) => {
    try {
        const profile = await AIProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        const preferences = {
            industry: profile.preferredIndustry,
            workStyle: profile.preferredWorkStyle
        };

        const result = await openRouterService.getCareerRecommendations(profile, preferences);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            recommendations: result.message
        });
    } catch (error) {
        console.error('Career Recommendations Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recommendations'
        });
    }
};

// Analyze skill gap
exports.analyzeSkillGap = async (req, res) => {
    try {
        const { targetRole } = req.body;

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required'
            });
        }

        const profile = await AIProfile.findOne({ userId: req.user.id });
        const currentSkills = profile?.skills || [];

        const result = await openRouterService.analyzeSkillGap(currentSkills, targetRole);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Store skill gap analysis
        if (profile) {
            profile.skillGaps.push({
                targetRole,
                matchingSkills: [],
                missingSkills: [],
                learningPriority: [],
                analyzedAt: new Date()
            });
            await profile.save();
        }

        res.json({
            success: true,
            skillGap: result.message
        });
    } catch (error) {
        console.error('Skill Gap Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze skill gap'
        });
    }
};

// Generate learning plan
exports.generateLearningPlan = async (req, res) => {
    try {
        const { targetRole, timeframe } = req.body;

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required'
            });
        }

        const profile = await AIProfile.findOne({ userId: req.user.id });
        const currentLevel = profile?.experienceLevel || 'Beginner';

        const result = await openRouterService.generateLearningPlan(
            targetRole,
            currentLevel,
            timeframe || '6 months'
        );

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Store learning plan
        if (profile) {
            profile.learningPlans.push({
                targetRole,
                timeframe: timeframe || '6 months',
                monthlyBreakdown: {},
                projects: [],
                milestones: [],
                createdAt: new Date()
            });
            await profile.save();
        }

        res.json({
            success: true,
            learningPlan: result.message
        });
    } catch (error) {
        console.error('Learning Plan Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate learning plan'
        });
    }
};

// Generate resume
exports.generateResume = async (req, res) => {
    try {
        const { targetRole } = req.body;

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required'
            });
        }

        const profile = await AIProfile.findOne({ userId: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        const result = await openRouterService.generateResume(profile, targetRole);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Store resume
        profile.resumes.push({
            targetRole,
            summary: '',
            keySkills: [],
            experience: '',
            achievements: [],
            keywords: [],
            generatedAt: new Date()
        });
        await profile.save();

        res.json({
            success: true,
            resume: result.message
        });
    } catch (error) {
        console.error('Resume Generation Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate resume'
        });
    }
};

// Chat with AI
exports.chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        console.log('📨 Chat request received:', { message: message?.substring(0, 50), sessionId });

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        const currentSessionId = sessionId || uuidv4();

        // Get conversation history
        const history = await ChatMessage.find({
            userId: req.user.id,
            sessionId: currentSessionId
        })
            .sort({ createdAt: 1 })
            .limit(10)
            .lean();

        // Save user message
        await ChatMessage.create({
            userId: req.user.id,
            sessionId: currentSessionId,
            role: 'user',
            content: message
        });

        // Get user profile for context
        const profile = await AIProfile.findOne({ userId: req.user.id });

        // Prepare messages for AI
        const messages = [
            ...history.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            {
                role: 'user',
                content: message
            }
        ];

        console.log('🤖 Calling OpenRouter API...');
        const result = await openRouterService.answerCareerQuestion(message, {
            userProfile: profile ? {
                skills: profile.skills,
                experience: profile.experienceLevel,
                goals: profile.goals
            } : null
        });

        console.log('📡 OpenRouter response:', { success: result.success, hasMessage: !!result.message, error: result.error });

        if (!result.success) {
            console.error('❌ OpenRouter API error:', result.error);
            return res.status(500).json({
                success: false,
                message: result.error || 'AI service temporarily unavailable'
            });
        }

        // Save AI response
        await ChatMessage.create({
            userId: req.user.id,
            sessionId: currentSessionId,
            role: 'assistant',
            content: result.message
        });

        console.log('✅ Chat response sent successfully');

        res.json({
            success: true,
            response: result.message,
            sessionId: currentSessionId
        });
    } catch (error) {
        console.error('💥 Chat Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to process chat: ' + error.message
        });
    }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
    try {
        const { sessionId } = req.params;

        const messages = await ChatMessage.find({
            userId: req.user.id,
            sessionId
        })
            .sort({ createdAt: 1 })
            .lean();

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Get Chat History Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history'
        });
    }
};

// Get all chat sessions
exports.getChatSessions = async (req, res) => {
    try {
        const sessions = await ChatMessage.aggregate([
            { $match: { userId: req.user.id } },
            {
                $group: {
                    _id: '$sessionId',
                    lastMessage: { $last: '$content' },
                    lastMessageAt: { $last: '$createdAt' },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { lastMessageAt: -1 } },
            { $limit: 20 }
        ]);

        res.json({
            success: true,
            sessions
        });
    } catch (error) {
        console.error('Get Chat Sessions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat sessions'
        });
    }
};
