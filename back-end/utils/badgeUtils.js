const mongoose = require('mongoose');
const Badge = require('../models/Badge');
const UserBadge = require('../models/UserBadge');
const CourseEnrollment = require('../models/CourseEnrollment');

/**
 * Award a badge to a user
 * @param {String} userId - User ID
 * @param {String} badgeId - Badge ID (badgeId string e.g. 'MOD-COMPLETE')
 * @param {Object} metadata - Additional metadata about the achievement
 * @returns {Promise<Object>} - Awarded badge details
 */
const awardBadge = async (userId, badgeId, metadata = {}) => {
    try {
        const badge = await Badge.findOne({ badgeId: badgeId.toUpperCase() });

        if (!badge) {
            console.error(`Badge template not found: ${badgeId}`);
            return { success: false, error: 'Badge template not found' };
        }

        // Check if user already has this badge for this specific item (e.g. this specific module)
        // We use metadata to differentiate between different modules for the same 'MOD_COMPLETE' badge type
        const query = { userId, badgeId: badge._id };
        if (metadata.moduleId) query['metadata.moduleId'] = metadata.moduleId;
        if (metadata.courseId) query['metadata.courseId'] = metadata.courseId;

        let userBadge = await UserBadge.findOne(query);

        if (userBadge && userBadge.isEarned) {
            return { alreadyEarned: true, badge: userBadge };
        }

        // Create user badge
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

        await userBadge.save();
        console.log(`✅ Badge awarded: ${badge.title} to user ${userId} (${metadata.moduleName || metadata.courseName || ''})`);

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
 * Check and award course completion badges
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID
 * @param {Object} courseData - Course details
 */
const checkCourseCompletionBadges = async (userId, courseId, courseData = {}) => {
    try {
        return await awardBadge(userId, 'CRS-COMPLETE', {
            courseId,
            courseName: courseData.title || 'Course',
            completionDate: new Date()
        });
    } catch (error) {
        console.error('Error checking course completion badges:', error);
        return null;
    }
};

/**
 * Award a specific course master badge (e.g., S01-MASTER)
 * Dynamically creates the badge template if it doesn't exist.
 */
const awardCourseMasterBadge = async (userId, courseId, courseCode, courseTitle) => {
    try {
        if (!courseCode) return null;
        const badgeId = `${courseCode.toUpperCase()}-MASTER`;
        
        let badge = await Badge.findOne({ badgeId });
        
        if (!badge) {
            // Dynamically create the course badge template using global theme #1a3884
            badge = new Badge({
                badgeId,
                title: `${courseTitle || courseCode} Master`,
                description: `Awarded for successfully completing the ${courseTitle || courseCode} course.`,
                category: 'learning',
                tier: 'standard',
                xp: 200,
                icon: 'Award',
                color: '#1a3884',
                criteria: {
                    type: 'course_completion',
                    courseId
                },
                rarity: 'rare',
                isActive: true
            });
            await badge.save();
            console.log(`Created new dynamic course badge template: ${badgeId}`);
        }
        
        return await awardBadge(userId, badgeId, {
            courseId,
            courseName: courseTitle,
            courseCode,
            completionDate: new Date()
        });
    } catch (error) {
        console.error('Error awarding course master badge:', error);
        return null;
    }
};

/**
 * Check and award skill (module) completion badges
 * @param {String} userId - User ID
 * @param {String} moduleId - Module (Skill) ID
 * @param {String} skillName - Name of the skill
 */
const checkSkillCompletionBadges = async (userId, moduleId, skillName) => {
    try {
        return await awardBadge(userId, 'MOD-COMPLETE', {
            moduleId,
            moduleName: skillName,
            completionDate: new Date()
        });
    } catch (error) {
        console.error('Error checking skill badges:', error);
        return null;
    }
};

/**
 * Get all badges for a user
 * @param {String} userId - User ID
 */
const getUserBadges = async (userId) => {
    try {
        const userBadges = await UserBadge.find({ userId })
            .populate('badgeId')
            .sort({ earnedDate: -1 });

        return userBadges.map(ub => ({
            id: ub.badgeId?.badgeId,
            _id: ub._id,
            title: ub.badgeId?.title,
            description: ub.badgeId?.description,
            category: ub.badgeId?.category,
            tier: ub.badgeId?.tier,
            xp: ub.badgeId?.xp,
            icon: ub.badgeId?.icon,
            color: ub.badgeId?.color,
            isEarned: true,
            earnedDate: ub.earnedDate,
            metadata: ub.metadata,
            progress: ub.progress
        }));
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
            recentBadges: []
        };

        userBadges.forEach(ub => {
            if (ub.badgeId) {
                stats.totalXP += ub.badgeId.xp || 0;
            }
        });

        stats.recentBadges = userBadges
            .sort((a, b) => b.earnedDate - a.earnedDate)
            .slice(0, 5)
            .map(ub => ({
                id: ub.badgeId?.badgeId,
                title: ub.badgeId?.title,
                earnedDate: ub.earnedDate
            }));

        return stats;
    } catch (error) {
        console.error('Error getting badge stats:', error);
        throw error;
    }
};

module.exports = {
    awardBadge,
    checkCourseCompletionBadges,
    getUserBadges,
    getUserBadgeStats,
    checkSkillCompletionBadges,
    awardCourseMasterBadge
};
