const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const CourseEnrollment = require('../models/CourseEnrollment');

/**
 * Award a badge to a user
 * @param {String} userId - User ID
 * @param {String} badgeId - Badge ID (ObjectId or badgeId string)
 * @param {Object} metadata - Additional metadata about the achievement
 * @returns {Promise<Object>} - Awarded badge details
 */
const awardBadge = async (userId, badgeId, metadata = {}) => {
    try {
        // Find the badge (support both ObjectId and badgeId string)
        let badge;
        if (mongoose.Types.ObjectId.isValid(badgeId)) {
            badge = await Badge.findById(badgeId);
        } else {
            badge = await Badge.findOne({ badgeId: badgeId.toUpperCase() });
        }

        if (!badge) {
            throw new Error(`Badge not found: ${badgeId}`);
        }

        // Check if user already has this badge
        let userBadge = await UserBadge.findOne({ userId, badgeId: badge._id });

        if (userBadge && userBadge.isEarned) {
            console.log(`User ${userId} already has badge ${badge.badgeId}`);
            return { alreadyEarned: true, badge: userBadge };
        }

        // Create or update user badge
        if (!userBadge) {
            userBadge = new UserBadge({
                userId,
                badgeId: badge._id,
                metadata,
                isEarned: true,
                earnedDate: new Date(),
                progress: {
                    current: 1,
                    target: 1,
                    percentage: 100
                }
            });
        } else {
            userBadge.isEarned = true;
            userBadge.earnedDate = new Date();
            userBadge.metadata = { ...userBadge.metadata, ...metadata };
            userBadge.progress.current = userBadge.progress.target;
        }

        await userBadge.save();

        console.log(`✅ Badge awarded: ${badge.title} to user ${userId}`);

        return {
            success: true,
            badge: userBadge,
            badgeDetails: badge,
            newlyEarned: true
        };
    } catch (error) {
        console.error('Error awarding badge:', error);
        throw error;
    }
};

/**
 * Check and award course completion badge
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {Object} courseData - Course details
 */
const checkCourseCompletionBadges = async (userId, courseId, courseData = {}) => {
    try {
        // Find all course completion badges for this course
        const badges = await Badge.find({
            'criteria.type': 'course_completion',
            'criteria.courseId': courseId,
            isActive: true
        });

        const awardedBadges = [];

        for (const badge of badges) {
            const result = await awardBadge(userId, badge._id, {
                courseId,
                courseName: courseData.courseName || courseData.title,
                completionDate: new Date()
            });

            if (result.newlyEarned) {
                awardedBadges.push(result);
            }
        }

        return awardedBadges;
    } catch (error) {
        console.error('Error checking course completion badges:', error);
        return [];
    }
};

/**
 * Check and award assessment score badges
 * @param {String} userId - User ID
 * @param {String} assessmentCode - Assessment code
 * @param {Number} score - User's score
 * @param {Number} percentile - User's percentile (optional)
 */
const checkAssessmentBadges = async (userId, assessmentCode, score, percentile = null) => {
    try {
        const badges = await Badge.find({
            'criteria.type': 'assessment_score',
            'criteria.assessmentCode': assessmentCode,
            isActive: true
        });

        const awardedBadges = [];

        for (const badge of badges) {
            let qualifies = false;

            // Check score criteria
            if (badge.criteria.minScore && score >= badge.criteria.minScore) {
                qualifies = true;
            }

            // Check percentile criteria (if provided)
            if (badge.criteria.percentile && percentile !== null) {
                qualifies = percentile <= badge.criteria.percentile;
            }

            if (qualifies) {
                const result = await awardBadge(userId, badge._id, {
                    assessmentCode,
                    score,
                    percentile
                });

                if (result.newlyEarned) {
                    awardedBadges.push(result);
                }
            }
        }

        return awardedBadges;
    } catch (error) {
        console.error('Error checking assessment badges:', error);
        return [];
    }
};

/**
 * Update badge progress (for progressive badges)
 * @param {String} userId - User ID
 * @param {String} badgeId - Badge ID
 * @param {Number} currentProgress - Current progress value
 */
const updateBadgeProgress = async (userId, badgeId, currentProgress) => {
    try {
        let badge;
        if (mongoose.Types.ObjectId.isValid(badgeId)) {
            badge = await Badge.findById(badgeId);
        } else {
            badge = await Badge.findOne({ badgeId: badgeId.toUpperCase() });
        }

        if (!badge) {
            throw new Error(`Badge not found: ${badgeId}`);
        }

        let userBadge = await UserBadge.findOne({ userId, badgeId: badge._id });

        if (!userBadge) {
            userBadge = new UserBadge({
                userId,
                badgeId: badge._id,
                progress: {
                    current: currentProgress,
                    target: badge.criteria.streakDays || badge.criteria.moduleCount || 1
                }
            });
        } else {
            userBadge.progress.current = currentProgress;
        }

        await userBadge.save();

        return userBadge;
    } catch (error) {
        console.error('Error updating badge progress:', error);
        throw error;
    }
};

/**
 * Get all badges for a user (earned and available)
 * @param {String} userId - User ID
 */
const getUserBadges = async (userId) => {
    try {
        const userBadges = await UserBadge.find({ userId })
            .populate('badgeId')
            .sort({ earnedDate: -1 });

        // Get all available badges
        const allBadges = await Badge.find({ isActive: true });

        // Create a map of user's badges
        const userBadgeMap = new Map();
        userBadges.forEach(ub => {
            if (ub.badgeId) {
                userBadgeMap.set(ub.badgeId._id.toString(), ub);
            }
        });

        // Combine all badges with user's progress
        const badges = allBadges.map(badge => {
            const userBadge = userBadgeMap.get(badge._id.toString());

            return {
                id: badge.badgeId,
                _id: badge._id,
                title: badge.title,
                description: badge.description,
                category: badge.category,
                tier: badge.tier,
                xp: badge.xp,
                icon: badge.icon,
                color: badge.color,
                rarity: badge.rarity,
                isEarned: userBadge ? userBadge.isEarned : false,
                earnedDate: userBadge ? userBadge.earnedDate : null,
                progress: userBadge ? userBadge.progress : { current: 0, target: 1, percentage: 0 },
                metadata: userBadge ? userBadge.metadata : {},
                percentile: userBadge?.metadata?.percentile
            };
        });

        return badges;
    } catch (error) {
        console.error('Error getting user badges:', error);
        throw error;
    }
};

/**
 * Get user's badge statistics
 * @param {String} userId - User ID
 */
const getUserBadgeStats = async (userId) => {
    try {
        const userBadges = await UserBadge.find({ userId, isEarned: true })
            .populate('badgeId');

        const stats = {
            totalEarned: userBadges.length,
            totalXP: 0,
            byTier: {
                bronze: 0,
                silver: 0,
                gold: 0,
                platinum: 0,
                diamond: 0
            },
            byCategory: {
                assessment: 0,
                learning: 0,
                streak: 0,
                community: 0,
                certification: 0,
                milestone: 0,
                special: 0
            },
            recentBadges: []
        };

        userBadges.forEach(ub => {
            if (ub.badgeId) {
                stats.totalXP += ub.badgeId.xp || 0;
                stats.byTier[ub.badgeId.tier]++;
                stats.byCategory[ub.badgeId.category]++;
            }
        });

        // Get 5 most recent badges
        stats.recentBadges = userBadges
            .sort((a, b) => b.earnedDate - a.earnedDate)
            .slice(0, 5)
            .map(ub => ({
                id: ub.badgeId.badgeId,
                title: ub.badgeId.title,
                tier: ub.badgeId.tier,
                earnedDate: ub.earnedDate
            }));

        return stats;
    } catch (error) {
        console.error('Error getting badge stats:', error);
        throw error;
    }
};

const mongoose = require('mongoose');

module.exports = {
    awardBadge,
    checkCourseCompletionBadges,
    checkAssessmentBadges,
    updateBadgeProgress,
    getUserBadges,
    getUserBadgeStats
};
