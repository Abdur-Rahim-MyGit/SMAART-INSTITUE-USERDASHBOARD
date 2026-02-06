const Profile = require('../models/Profile');
const Role = require('../models/Role');
const aiAgent = require('../services/aiAgent');

/**
 * @desc    Chat with AI career coach
 * @route   POST /api/ai/chat
 * @access  Private
 */
exports.chat = async (req, res, next) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                message: 'Message is required'
            });
        }

        // Get user profile for context
        const profile = await Profile.findOne({ user: req.user.id });
        const user = req.user;

        const context = {
            careerStage: user.careerStage,
            goals: profile?.careerGoals?.shortTerm || 'not specified',
            focus: profile?.interests?.join(', ') || 'general career guidance'
        };

        const response = await aiAgent.coachChat(message, context);

        res.json({
            success: true,
            data: {
                message: response,
                timestamp: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get career path recommendations
 * @route   GET /api/ai/recommendations
 * @access  Private
 */
exports.getRecommendations = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        // Get available roles from database
        const roles = await Role.find({ active: true }).limit(50);

        const recommendations = await aiAgent.recommendCareerPaths(profile, roles);

        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate learning plan
 * @route   POST /api/ai/learning-plan
 * @access  Private
 */
exports.generateLearningPlan = async (req, res, next) => {
    try {
        const { targetRole } = req.body;

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required'
            });
        }

        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        const learningPlan = await aiAgent.generateLearningPlan(profile, targetRole);

        res.json({
            success: true,
            data: learningPlan
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Analyze skill gap
 * @route   POST /api/ai/skill-gap
 * @access  Private
 */
exports.analyzeSkillGap = async (req, res, next) => {
    try {
        const { roleId } = req.body;

        if (!roleId) {
            return res.status(400).json({
                success: false,
                message: 'Role ID is required'
            });
        }

        const profile = await Profile.findOne({ user: req.user.id });
        const role = await Role.findById(roleId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        const gapAnalysis = await aiAgent.analyzeSkillGap(profile.skills, role.requiredSkills);

        res.json({
            success: true,
            data: {
                role: role.title,
                analysis: gapAnalysis
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate resume content
 * @route   POST /api/ai/resume
 * @access  Private
 */
exports.generateResume = async (req, res, next) => {
    try {
        const { targetRole } = req.body;

        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Target role is required'
            });
        }

        const profile = await Profile.findOne({ user: req.user.id }).populate('user');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        const resumeContent = await aiAgent.generateResumeContent(profile, targetRole);

        res.json({
            success: true,
            data: {
                targetRole,
                content: resumeContent,
                generatedAt: new Date()
            }
        });
    } catch (error) {
        next(error);
    }
};
