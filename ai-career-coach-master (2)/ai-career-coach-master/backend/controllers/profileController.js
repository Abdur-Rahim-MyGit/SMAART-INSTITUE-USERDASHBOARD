const Profile = require('../models/Profile');
const User = require('../models/User');
const aiAgent = require('../services/aiAgent');

/**
 * @desc    Get user profile
 * @route   GET /api/profile
 * @access  Private
 */
exports.getProfile = async (req, res, next) => {
    try {
        let profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email location headline');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create or update profile
 * @route   POST /api/profile
 * @access  Private
 */
exports.createOrUpdateProfile = async (req, res, next) => {
    try {
        const profileData = {
            user: req.user.id,
            ...req.body
        };

        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            // Update existing profile
            profile = await Profile.findOneAndUpdate(
                { user: req.user.id },
                { $set: profileData },
                { new: true, runValidators: true }
            ).populate('user', 'name email location headline');
        } else {
            // Create new profile
            profile = await Profile.create(profileData);
            profile = await profile.populate('user', 'name email location headline');
        }

        // Mark user profile as completed
        await User.findByIdAndUpdate(req.user.id, { profileCompleted: true });

        res.json({
            success: true,
            message: 'Profile saved successfully',
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Analyze profile with AI
 * @route   POST /api/profile/analyze
 * @access  Private
 */
exports.analyzeProfile = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Please complete your profile first'
            });
        }

        // Get AI analysis
        const analysis = await aiAgent.analyzeProfile(profile);

        // Update profile with AI analysis
        profile.aiAnalysis = {
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendedPaths: analysis.topRoleMatches,
            lastAnalyzed: new Date()
        };

        await profile.save();

        // Update user career stage
        await User.findByIdAndUpdate(req.user.id, { careerStage: analysis.careerStage });

        res.json({
            success: true,
            message: 'Profile analyzed successfully',
            data: {
                careerStage: analysis.careerStage,
                analysis: profile.aiAnalysis
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add education
 * @route   POST /api/profile/education
 * @access  Private
 */
exports.addEducation = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        profile.education.unshift(req.body);
        await profile.save();

        res.json({
            success: true,
            message: 'Education added successfully',
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add experience
 * @route   POST /api/profile/experience
 * @access  Private
 */
exports.addExperience = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        profile.experience.unshift(req.body);
        await profile.save();

        res.json({
            success: true,
            message: 'Experience added successfully',
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update skills
 * @route   PUT /api/profile/skills
 * @access  Private
 */
exports.updateSkills = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        profile.skills = req.body.skills;
        await profile.save();

        res.json({
            success: true,
            message: 'Skills updated successfully',
            data: profile
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Generate comprehensive career analysis after profile completion
 * @route   POST /api/profile/generate-career-analysis
 * @access  Private
 */
exports.generateCareerAnalysis = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found. Please complete your profile first.'
            });
        }

        // Get all available roles from database
        const Role = require('../models/Role');
        const availableRoles = await Role.find({ active: true }).limit(20);

        let profileAnalysis, careerRecommendations, readinessAnalysis;
        let usedFallback = false;

        try {
            // 1. Analyze Profile and Get Career Stage
            const aiAgent = require('../services/aiAgent');
            profileAnalysis = await aiAgent.analyzeProfile(profile);

            // 2. Get Career Path Recommendations
            careerRecommendations = await aiAgent.recommendCareerPaths(profile, availableRoles);

            // 3. Calculate Career Readiness Score for top recommended role
            const topRole = careerRecommendations.recommendations[0]?.role || 'Software Developer';
            readinessAnalysis = await aiAgent.calculateReadiness(profile, topRole);

        } catch (aiError) {
            console.error('AI Analysis Error:', aiError);
            usedFallback = true;

            // Fallback to mock data if AI fails
            profileAnalysis = {
                careerStage: 'Explorer',
                strengths: [
                    { skill: 'Quick Learner', evidence: 'Eager to learn new technologies and adapt to changes', score: 85 },
                    { skill: 'Problem Solving', evidence: 'Good analytical thinking and troubleshooting abilities', score: 80 },
                    { skill: 'Communication', evidence: 'Able to express ideas clearly', score: 75 }
                ],
                weaknesses: [
                    { skill: 'Experience', severity: 'moderate', recommendation: 'Gain more hands-on project experience to build confidence' },
                    { skill: 'Networking', severity: 'low', recommendation: 'Build professional connections in your target industry' },
                    { skill: 'Specialization', severity: 'moderate', recommendation: 'Focus on developing expertise in a specific area' }
                ]
            };

            careerRecommendations = {
                recommendations: [
                    {
                        role: 'Junior Developer',
                        matchScore: 75,
                        reasoning: 'Based on your current skills and educational background, this role is a great starting point',
                        timeline: '3-6 months'
                    },
                    {
                        role: 'Technical Support Specialist',
                        matchScore: 70,
                        reasoning: 'Your communication skills and technical knowledge make this a good fit',
                        timeline: '2-4 months'
                    },
                    {
                        role: 'QA Tester',
                        matchScore: 68,
                        reasoning: 'Entry-level role that values attention to detail and problem-solving',
                        timeline: '1-3 months'
                    }
                ]
            };

            readinessAnalysis = {
                score: 65,
                breakdown: {
                    skills: 60,
                    experience: 50,
                    education: 80,
                    goals: 70
                },
                feedback: 'You have a good foundation to start your career. Focus on building practical experience through projects and internships.',
                nextSteps: [
                    { action: 'Build portfolio projects', description: 'Create 2-3 projects showcasing your skills', priority: 'High' },
                    { action: 'Learn in-demand skills', description: 'Focus on technologies relevant to your target role', priority: 'High' },
                    { action: 'Network with professionals', description: 'Join online communities and attend meetups', priority: 'Medium' },
                    { action: 'Practice coding challenges', description: 'Improve problem-solving skills', priority: 'Medium' }
                ]
            };
        }

        // 4. Update Profile with Analysis Results
        profile.aiAnalysis = {
            strengths: profileAnalysis.strengths || [],
            weaknesses: profileAnalysis.weaknesses || [],
            recommendedPaths: careerRecommendations.recommendations.map(rec => ({
                role: rec.role,
                matchScore: rec.matchScore,
                reasoning: rec.reasoning,
                timeline: rec.timeline,
                salaryRange: rec.salaryRange,
                marketDemand: rec.marketDemand,
                activeJobsSearchUrl: rec.activeJobsSearchUrl
            })),
            scoreExplanation: profileAnalysis.scoreExplanation || readinessAnalysis.feedback,
            resources: profileAnalysis.resources || { mustHave: [], niceToHave: [] },
            readinessBreakdown: profileAnalysis.readinessBreakdown || readinessAnalysis.breakdown,
            summary: profileAnalysis.summary,
            lastAnalyzed: new Date()
        };

        // 5. Update Readiness Metrics
        profile.readinessMetrics = {
            careerReadinessScore: readinessAnalysis.score,
            interviewReadiness: Math.min(readinessAnalysis.score + 5, 100),
            marketFitScore: careerRecommendations.recommendations[0]?.matchScore || 0,
            history: [
                ...(profile.readinessMetrics?.history || []),
                {
                    score: readinessAnalysis.score,
                    date: new Date()
                }
            ]
        };

        // 6. Update User's Career Stage
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.user.id, {
            careerStage: profileAnalysis.careerStage
        });

        await profile.save();

        res.json({
            success: true,
            message: usedFallback ? 'Career analysis generated (using fallback data)' : 'Career analysis generated successfully',
            data: {
                careerStage: profileAnalysis.careerStage,
                readinessScore: readinessAnalysis.score,
                breakdown: readinessAnalysis.breakdown,
                feedback: readinessAnalysis.feedback,
                nextSteps: readinessAnalysis.nextSteps,
                strengths: profile.aiAnalysis.strengths,
                weaknesses: profile.aiAnalysis.weaknesses,
                recommendedPaths: profile.aiAnalysis.recommendedPaths,
                topRecommendation: careerRecommendations.recommendations[0]
            }
        });
    } catch (error) {
        console.error('Career Analysis Error:', error);
        next(error);
    }
};

/**
 * @desc    Get personalized learning resources
 * @route   GET /api/profile/resources
 * @access  Private
 */
exports.getPersonalizedResources = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name email');

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'Profile not found'
            });
        }

        const resources = await aiAgent.generatePersonalizedResources(profile);

        res.json({
            success: true,
            data: resources
        });
    } catch (error) {
        next(error);
    }
};
