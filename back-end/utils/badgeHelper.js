const Student = require('../models/Student');
const User = require('../models/User');
const CourseEnrollment = require('../models/CourseEnrollment');

/**
 * Awards a badge to a student if they meet the criteria.
 * Criteria: Completed first 3 sessions (Days 1, 2, 3) of the first course.
 */
const awardEarlyAchieverBadge = async (studentId) => {
    try {
        // 1. Find user (could be Student or User model)
        let user = await Student.findById(studentId);
        if (!user) {
            user = await User.findById(studentId);
        }

        if (!user) {
            console.log(`[Badge] User not found: ${studentId}`);
            return null;
        }

        // 2. Check if badge already awarded
        if (!user.badges) user.badges = [];
        if (user.badges.some(b => b.badgeId === 'EARLY-ACHIEVER')) {
            return null;
        }

        // 3. Find all enrollments
        const enrollments = await CourseEnrollment.find({ student: studentId });

        if (!enrollments || enrollments.length === 0) return null;

        // 4. Check for completion of sessions 1, 2, and 3 across ANY enrollment
        const completedDays = new Set();

        enrollments.forEach(enrollment => {
            if (enrollment.moduleProgress) {
                enrollment.moduleProgress.forEach(mp => {
                    // Check video progress
                    if (mp.videoProgress) {
                        mp.videoProgress.forEach(vp => {
                            if (vp.isCompleted && [1, 2, 3].includes(vp.dayId)) {
                                completedDays.add(vp.dayId);
                            }
                        });
                    }
                    // Check task progress
                    if (mp.completedTasks) {
                        mp.completedTasks.forEach(ct => {
                            if ([1, 2, 3].includes(ct.dayId)) {
                                completedDays.add(ct.dayId);
                            }
                        });
                    }
                });
            }
        });

        // 5. Award badge if Days 1, 2, and 3 are present in the set
        if (completedDays.has(1) && completedDays.has(2) && completedDays.has(3)) {
            const newBadge = {
                badgeId: 'EARLY-ACHIEVER',
                title: 'Early Achiever',
                description: 'Completed the first three sessions of your first course!',
                tier: 'bronze',
                xp: 150,
                category: 'learning',
                earnedAt: new Date()
            };

            user.badges.push(newBadge);
            await user.save();
            console.log(`[Badge] Awarded EARLY-ACHIEVER to ${user.fullName}`);
            return newBadge;
        }

        return null;
    } catch (error) {
        console.error('[Badge] Error awarding badge:', error);
        return null;
    }
};

module.exports = { awardEarlyAchieverBadge };
