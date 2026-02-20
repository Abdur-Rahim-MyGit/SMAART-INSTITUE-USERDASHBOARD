const AIProfile = require('../models/AIProfile');
const ChatMessage = require('../models/ChatMessage');
const Registration = require('../models/Registration');
const User = require('../models/User');
const openRouterService = require('../services/openRouterService');
const { v4: uuidv4 } = require('uuid');

/**
 * AI Career Coach Controller
 * Handles all AI career coaching features
 */

const Student = require('../models/Student');

// Helper: Build Rich Profile from multiple sources
const getRichProfile = async (userId) => {
    // 1. Try to fetch documents by ID
    let user = await User.findById(userId);
    let student = await Student.findById(userId).populate('college');
    let registration = await Registration.findOne({ userId });
    let profile = await AIProfile.findOne({ userId });

    // 2. Cross-link detection: If userId didn't find everything, search by email
    const email = user?.email || student?.email || registration?.email;

    if (email) {
        if (!user) user = await User.findOne({ email });
        if (!student) student = await Student.findOne({ email }).populate('college');
        if (!registration) registration = await Registration.findOne({ email });

        // If we found a user or student by email, try to find the AIProfile using their IDs
        if (!profile && user) profile = await AIProfile.findOne({ userId: user._id });
        if (!profile && student) profile = await AIProfile.findOne({ userId: student._id });

        // If registration was found by email but not linked by userId, link it now for this session context
        if (!registration && (user || student)) {
            registration = await Registration.findOne({ userId: user?._id || student?._id });
        }
    }

    // Comprehensive Student Data Capture
    const richProfile = {
        fullName: student?.fullName || registration?.fullName || user?.fullName || 'User',
        email: email || 'Not specified',
        mobile: student?.mobile || registration?.mobileNumber || user?.mobile || 'Not specified',
        studentId: student?.studentId || registration?.studentId || 'N/A',

        // Education - Prioritizing actual student record and registration
        education: (() => {
            if (registration?.higherEducation && registration.higherEducation.length > 0) {
                const hEdu = registration.higherEducation[0];
                return `${hEdu.degree} in ${hEdu.specialization} at ${hEdu.institutionName}`;
            } else if (student?.college) {
                return `${student.department || 'Student'} at ${student.college.name || 'SMAART Institute'}`;
            } else if (registration?.institution) {
                return `${registration.educationLevel || 'Student'} at ${registration.institution}`;
            } else {
                return profile?.education || 'General Education';
            }
        })(),

        // Skills - Merging from all sources
        skills: (() => {
            const skillSet = new Set(profile?.skills || []);

            // Add from registration projects/certs
            registration?.certificates?.forEach(c => skillSet.add(c.title));
            registration?.projects?.forEach(p => skillSet.add(p.title));

            // Add from user explicit skills
            if (user?.certificates) user.certificates.forEach(c => skillSet.add(c));

            // Add from sector preferences
            registration?.sectorPreferences?.preferredSectors?.forEach(s => skillSet.add(s));

            return Array.from(skillSet);
        })(),

        // Experience History
        experience: registration?.workExperience?.length > 0
            ? registration.workExperience.map(exp => `${exp.jobTitle} at ${exp.organizationName} (${exp.industry})`).join('; ')
            : (student?.batch ? `Academic Batch: ${student.batch}` : (profile?.experience || 'None')),

        projects: registration?.projects?.map(proj =>
            `${proj.title}: ${proj.description}`
        ).join('; ') || 'None',

        goals: registration?.careerGoals
            ? `Short-term: ${registration.careerGoals.shortTerm || 'N/A'}, Medium: ${registration.careerGoals.mediumTerm || 'N/A'}, Long: ${registration.careerGoals.longTerm || 'N/A'}`
            : (profile?.goals || 'Not specified'),

        interests: registration?.sectorPreferences?.preferredSectors || (profile?.interests || []),

        certificates: registration?.certificates?.map(cert =>
            `${cert.title} from ${cert.issuingOrg}`
        ).join(', ') || 'None',

        // Institutional Details for Resume Header
        department: student?.department || registration?.department || '',
        rollNumber: student?.rollNumber || registration?.rollNumber || '',
        college: student?.college?.name || registration?.institution || 'SMAART Institute',
        batch: student?.batch || '',

        // Target Role Mapping
        targetRole: profile?.targetRole || (registration?.jobPreferences?.[0]?.preferredRole) || 'Professional',

        experienceLevel: profile?.experienceLevel || 'Beginner'
    };

    return { richProfile, profileDoc: profile, userDoc: user, studentDoc: student, registrationDoc: registration };
};

// Get or create AI profile (Enhanced with Registration)
exports.getProfile = async (req, res) => {
    try {
        const { richProfile, profileDoc, studentDoc, registrationDoc } = await getRichProfile(req.user.id);

        let profile = profileDoc;

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
            profile: profile || profileDoc,
            richProfile,
            student: studentDoc,
            registration: registrationDoc
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
        const { richProfile, profileDoc } = await getRichProfile(req.user.id);
        let profile = profileDoc;

        console.log('🧠 Analyzing Profile Payload:', JSON.stringify(richProfile, null, 2));

        const result = await openRouterService.analyzeProfile(richProfile);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Update AIProfile with results if it exists, or create new one
        if (!profile) {
            profile = new AIProfile({
                userId: req.user.id,
                skills: [], // Will require proper population later
                interests: [],
                experienceLevel: 'Beginner'
            });
        }

        profile.lastAnalysis = {
            analyzedAt: new Date()
        };
        await profile.save();

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
        const { richProfile, profileDoc } = await getRichProfile(req.user.id);

        if (!profileDoc) {
            // Fallback if AIProfile doesn't exist yet, create minimalistic one logic or error
            // Ideally we should allow recommendations based on registration data too
            // For now, let's proceed with richProfile mapping if possible, but the service expects AIProfile structure
            // We can map richProfile back to a pseudo-profile object
        }

        // Use richProfile preferences if AIProfile is missing them
        const preferences = {
            industry: profileDoc?.preferredIndustry || richProfile.interests[0] || 'Technology',
            workStyle: profileDoc?.preferredWorkStyle || 'Collaborative'
        };

        // We might need to pass richProfile instead of profileDoc if profileDoc is empty
        // adapting openRouterService.getCareerRecommendations signature might be needed or we mock profile object
        const mockProfile = profileDoc || { skills: richProfile.skills, interests: richProfile.interests };

        const result = await openRouterService.getCareerRecommendations(mockProfile, preferences);

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

        const { richProfile, profileDoc } = await getRichProfile(req.user.id);
        const currentSkills = richProfile.skills.length > 0 ? richProfile.skills : (profileDoc?.skills || []);

        // If still no skills, maybe infer from text? handled by service or result will be "No skills found"

        const result = await openRouterService.analyzeSkillGap(currentSkills, targetRole);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Store skill gap analysis
        if (profileDoc) {
            profileDoc.skillGaps.push({
                targetRole,
                matchingSkills: [],
                missingSkills: [],
                learningPriority: [],
                analyzedAt: new Date()
            });
            await profileDoc.save();
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

        const { richProfile, profileDoc } = await getRichProfile(req.user.id);

        const currentLevel = richProfile.experienceLevel || 'Beginner';

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
        if (profileDoc) {
            profileDoc.learningPlans.push({
                targetRole,
                timeframe: timeframe || '6 months',
                monthlyBreakdown: {},
                projects: [],
                milestones: [],
                createdAt: new Date()
            });
            await profileDoc.save();
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

        // Use getRichProfile to ensure we have Name, Education, etc. from Registration
        const { richProfile, profileDoc } = await getRichProfile(req.user.id);

        // We pass richProfile to the service, as it contains the aggregated data
        // Check if service supports richProfile structure or expects AIProfile schema
        // Assuming we update or verify openRouterService.generateResume to handle this object

        const result = await openRouterService.generateResume(richProfile, targetRole);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }

        // Store resume in AIProfile history if exists
        if (profileDoc) {
            profileDoc.resumes.push({
                targetRole,
                summary: '',
                keySkills: [],
                experience: '',
                achievements: [],
                keywords: [],
                generatedAt: new Date()
            });
            await profileDoc.save();
        } else {
            // If no AIProfile, maybe create one? Or just return the resume.
            // For now, just return.
        }

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

        // Get user profile for context using helper
        const { richProfile } = await getRichProfile(req.user.id);

        const userContext = {
            name: richProfile.fullName,
            education: richProfile.education,
            currentRole: richProfile.experience.split(';')[0] || '', // approximating
            goals: richProfile.goals,
            skills: richProfile.skills,
            experienceLevel: richProfile.experienceLevel
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
