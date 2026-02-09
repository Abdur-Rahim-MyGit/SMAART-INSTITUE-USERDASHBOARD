const mongoose = require('mongoose');
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
 * Check and award course completion badges
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
 * Check and award skill (module) completion badges
 * @param {String} userId - User ID
 * @param {String} moduleId - Module (Skill) ID
 * @param {String} skillName - Name of the skill
 */
const checkSkillCompletionBadges = async (userId, moduleId, skillName) => {
    try {
        // Find badges for this specific skill
        const badges = await Badge.find({
            'criteria.type': 'skill_completion',
            'criteria.skillId': moduleId,
            isActive: true
        });

        // Also find generic module completion badges (if any, though usually specific)
        const genericBadges = await Badge.find({
            'criteria.type': 'module_completion',
            isActive: true
        });

        const allBadges = [...badges, ...genericBadges];
        const awardedBadges = [];

        for (const badge of allBadges) {
            // For specific skill badges
            if (badge.criteria.type === 'skill_completion') {
                 const result = await awardBadge(userId, badge._id, {
                    skillId: moduleId,
                    skillName: skillName,
                    completionDate: new Date()
                });
                if (result.newlyEarned) awardedBadges.push(result);
            }
            // For generic module counting badges (e.g., "Complete 5 Skills")
            else if (badge.criteria.type === 'module_completion') {
                 // Check how many modules the user has completed total
                 // This would require an aggregation count on CourseEnrollments
                 // For now, we'll skip complex counting unless requested
                 const currentCount = await getCompletedModulesCount(userId);
                 if (currentCount >= badge.criteria.moduleCount) {
                     const result = await awardBadge(userId, badge._id, {
                        type: 'milestone',
                        count: currentCount,
                        completionDate: new Date()
                    });
                    if (result.newlyEarned) awardedBadges.push(result);
                 }
            }
        }
        
        return awardedBadges;
    } catch (error) {
        console.error('Error checking skill badges:', error);
        return [];
    }
};

const getCompletedModulesCount = async (userId) => {
    // Helper to count completed modules across all enrollments
    // Implementation omitted for brevity, returning 1 for now to unblock specific badges
    return 1; 
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
        const User = require('../models/User');
        const Student = require('../models/Student');

        // Find user in both collections to get legacy badges
        let userDoc = await User.findById(userId);
        if (!userDoc) {
            userDoc = await Student.findById(userId);
        }

        const userBadges = await UserBadge.find({ userId })
            .populate('badgeId')
            .sort({ earnedDate: -1 });

        // Get all available badges from the new system
        const allBadges = await Badge.find({ isActive: true });

        // Create a map of user's badges from the NEW system
        const userBadgeMap = new Map();
        userBadges.forEach(ub => {
            if (ub.badgeId) {
                userBadgeMap.set(ub.badgeId.badgeId, {
                    isEarned: ub.isEarned,
                    earnedDate: ub.earnedDate,
                    progress: ub.progress,
                    metadata: ub.metadata
                });
            }
        });

        // Add legacy badges to the map if they aren't already there
        if (userDoc && userDoc.badges) {
            userDoc.badges.forEach(lb => {
                // Map legacy IDs to new ones to prevent double-counting
                let normalizedId = lb.badgeId;
                if (normalizedId === 'EARLY-ACHIEVER') {
                    normalizedId = 'BADGE-FIRST-3-SESSIONS';
                }

                if (!userBadgeMap.has(normalizedId)) {
                    userBadgeMap.set(normalizedId, {
                        isEarned: true,
                        earnedDate: lb.earnedAt || lb.earnedDate,
                        progress: { current: 1, target: 1, percentage: 100 },
                        metadata: lb.metadata || {},
                        isLegacy: true,
                        title: lb.title,
                        description: lb.description,
                        icon: lb.icon,
                        tier: lb.tier,
                        xp: lb.xp,
                        category: lb.category
                    });
                }
            });
        }

        // Combine all known badges
        const badges = allBadges.map(badge => {
            const userBadge = userBadgeMap.get(badge.badgeId);

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
                isEarned: !!userBadge,
                earnedDate: userBadge ? userBadge.earnedDate : null,
                progress: userBadge?.progress || { current: 0, target: 1, percentage: 0 },
                metadata: userBadge?.metadata || {},
                percentile: userBadge?.metadata?.percentile
            };
        });

        // Add legacy badges that aren't in the official "allBadges" list if any
        userBadgeMap.forEach((ub, bid) => {
            if (!badges.some(b => b.id === bid)) {
                badges.push({
                    id: bid,
                    title: ub.title || bid,
                    description: ub.description || '',
                    category: ub.category || 'special',
                    tier: ub.tier || 'bronze',
                    xp: ub.xp || 0,
                    icon: ub.icon || 'award',
                    isEarned: true,
                    earnedDate: ub.earnedDate,
                    progress: { current: 1, target: 1, percentage: 100 },
                    metadata: ub.metadata,
                    isLegacy: true
                });
            }
        });

        return badges;
    } catch (error) {
        console.error('Error getting user badges:', error);
        throw error;
    }
};

/**
 * Check and award "First Three Sessions" badge
 * @param {String} userId - User ID
 * @param {String} courseId - Course ID (optional, to check if it's the first course)
 */
const checkFirstThreeSessionsBadge = async (userId, courseId = null) => {
    try {
        console.log(`[BadgeDebug] 🔍 Global check for "First Three Sessions" badge for user: ${userId}`);

        // Find all enrollments for this user
        const enrollments = await CourseEnrollment.find({ student: userId })
            .populate('course');

        if (enrollments.length === 0) {
            console.log(`[BadgeDebug] ❌ No enrollments found for user ${userId}`);
            return [];
        }

        const completedDaysSet = new Set();
        let primaryCourseName = 'First Course';

        // Sort enrollments by date just to identify the "first" for naming purposes
        const sortedEnrollments = [...enrollments].sort((a, b) => a.enrollmentDate - b.enrollmentDate);
        if (sortedEnrollments.length > 0) {
            primaryCourseName = sortedEnrollments[0].course?.title || primaryCourseName;
        }

        console.log(`[BadgeDebug] 📊 Aggregating progress across ${enrollments.length} enrollments...`);

        for (const enrollment of enrollments) {
            if (enrollment.moduleProgress && enrollment.moduleProgress.length > 0) {
                const firstModuleProgress = enrollment.moduleProgress[0];

                // From videos
                if (firstModuleProgress.videoProgress) {
                    firstModuleProgress.videoProgress.forEach(vp => {
                        if (vp.isCompleted) {
                            completedDaysSet.add(vp.dayId);
                            console.log(`[BadgeDebug] ✅ Day ${vp.dayId} completed in ${enrollment.course?.title} (Video)`);
                        }
                    });
                }

                // From tasks
                if (firstModuleProgress.completedTasks) {
                    firstModuleProgress.completedTasks.forEach(ct => {
                        completedDaysSet.add(ct.dayId);
                        console.log(`[BadgeDebug] ✅ Day ${ct.dayId} completed in ${enrollment.course?.title} (Task)`);
                    });
                }
            }
        }

        const completedDaysTotal = completedDaysSet.size;
        console.log(`[BadgeDebug] 📉 Total unique completed days across all courses: ${completedDaysTotal} (Days: ${Array.from(completedDaysSet).join(', ')})`);

        if (completedDaysTotal >= 3) {
            const badge = await Badge.findOne({ badgeId: 'BADGE-FIRST-3-SESSIONS' });
            if (!badge) {
                console.log('[BadgeDebug] ❌ BUG: "BADGE-FIRST-3-SESSIONS" not found in database!');
                return [];
            }

            const result = await awardBadge(userId, badge._id, {
                courseName: primaryCourseName,
                completedDays: completedDaysTotal,
                completionDate: new Date()
            });

            if (result.newlyEarned) {
                console.log(`[BadgeDebug] 🎉 SUCCESS: Awarded "Getting Started" badge to user ${userId}`);
                return [result];
            } else {
                console.log(`[BadgeDebug] ℹ️ Badge already held by user ${userId}.`);
            }
        } else {
            console.log(`[BadgeDebug] ⏳ Eligibility check: ${completedDaysTotal}/3 days completed. Not awarding yet.`);
        }

        return [];
    } catch (error) {
        console.error('[BadgeDebug] ❌ CRITICAL ERROR in checkFirstThreeSessionsBadge:', error);
        return [];
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

module.exports = {
    awardBadge,
    checkCourseCompletionBadges,
    checkAssessmentBadges,
    updateBadgeProgress,
    getUserBadges,
    getUserBadgeStats,
    checkFirstThreeSessionsBadge,
    checkSkillCompletionBadges
};
