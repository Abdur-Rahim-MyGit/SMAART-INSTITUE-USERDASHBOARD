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

            // Education - handle higherEducation as ARRAY
            education: (() => {
                if (registration?.higherEducation && registration.higherEducation.length > 0 && registration.higherEducation[0].degree) {
                    const hEdu = registration.higherEducation[0];
                    return `${hEdu.degree} in ${hEdu.specialization} (${hEdu.institutionName})`;
                } else if (registration?.educationLevel) {
                    return `${registration.educationLevel} at ${registration.institution || 'Unknown'}`;
                } else {
                    return profile?.education || 'Not specified';
                }
            })(),

            skills: profile?.skills || [],

            experience: registration?.workExperience?.map(exp =>
                `${exp.jobTitle} at ${exp.organizationName} (${exp.industry})`
            ).join('; ') || (profile?.experience || 'None'),

            projects: registration?.projects?.map(proj =>
                `${proj.title}: ${proj.description}`
            ).join('; ') || 'None',

            goals: registration?.careerGoals
                ? `Short-term: ${registration.careerGoals.shortTerm || 'Not specified'}, Medium-term: ${registration.careerGoals.mediumTerm || 'Not specified'}, Long-term: ${registration.careerGoals.longTerm || 'Not specified'}`
                : (profile?.goals || 'Not specified'),

            interests: registration?.sectorPreferences?.preferredSectors || (profile?.interests || []),

            certificates: registration?.certificates?.map(cert =>
                `${cert.title} from ${cert.issuingOrg}`
            ).join(', ') || 'None',

            // Add salary expectation and job preferences
            salaryExpectation: (() => {
                if (registration?.jobPreferences && registration.jobPreferences.length > 0) {
                    return registration.jobPreferences[0].expectedSalary || 'Not specified';
                }
                return 'Not specified';
            })(),

            targetRole: (() => {
                if (registration?.jobPreferences && registration.jobPreferences.length > 0) {
                    return registration.jobPreferences[0].preferredRole || 'Not specified';
                }
                return 'Not specified';
            })()
        };

        // If no skills in AIProfile, try to infer from previous fields? 
        // Or AI will infer from text.

        console.log('🧠 Analyzing Profile Payload:', JSON.stringify(richProfile, null, 2));

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
        const Registration = require('../models/Registration');
        const profile = await AIProfile.findOne({ userId: req.user.id });
        const registration = await Registration.findOne({ userId: req.user.id });

        // Build rich context from registration (handling arrays correctly)
        const userContext = {
            name: registration?.fullName || 'User',
            education: (() => {
                if (registration?.higherEducation && registration.higherEducation.length > 0 && registration.higherEducation[0].degree) {
                    const hEdu = registration.higherEducation[0];
                    return `${hEdu.degree} in ${hEdu.specialization}`;
                }
                return registration?.educationLevel || profile?.education || '';
            })(),
            currentRole: (() => {
                if (registration?.workExperience && registration.workExperience.length > 0) {
                    const exp = registration.workExperience[0];
                    if (exp.jobTitle && exp.organizationName) {
                        return `${exp.jobTitle} at ${exp.organizationName}`;
                    }
                }
                return '';
            })(),
            goals: registration?.careerGoals
                ? `Short: ${registration.careerGoals.shortTerm || ''}, Long: ${registration.careerGoals.longTerm || ''}`
                : (profile?.goals || ''),
            skills: profile?.skills || [],
            experienceLevel: profile?.experienceLevel || 'Beginner'
        };

        // Format history for AI service
        const formattedHistory = history.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        console.log('🤖 Calling OpenRouter API with context:', userContext.name);
        const result = await openRouterService.answerCareerQuestion(message, {
            userProfile: userContext
        }, formattedHistory);

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
