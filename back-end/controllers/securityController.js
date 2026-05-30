const UserActivityLog = require('../models/UserActivityLog');
const Result = require('../models/Result');
const CourseEnrollment = require('../models/CourseEnrollment');

// Log a security violation/warning
exports.logViolation = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const { assessmentId, courseId, eventType } = req.body;

        if (!eventType || !['tab_switch', 'minimize', 'inactivity'].includes(eventType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or missing eventType. Must be tab_switch, minimize, or inactivity.'
            });
        }

        // Count previous violations for this user and this assessment/course to calculate warning count
        const query = { userId };
        if (assessmentId) query.assessmentId = assessmentId;
        if (courseId) query.courseId = courseId;

        const count = await UserActivityLog.countDocuments(query);
        const warningsCount = count + 1;

        const activityLog = new UserActivityLog({
            userId,
            assessmentId: assessmentId || undefined,
            courseId: courseId || undefined,
            eventType,
            warningsCount
        });

        await activityLog.save();

        res.status(201).json({
            success: true,
            warningsCount,
            message: `Violation logged. Warning ${warningsCount} of 3.`
        });
    } catch (err) {
        console.error('Error logging activity violation:', err);
        res.status(500).json({
            success: false,
            error: 'Server error logging activity violation',
            message: err.message
        });
    }
};

// Force submit assessment and lock out user on 4th breach
exports.lockoutSubmit = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const { assessmentId, courseId } = req.body;

        let resultUpdated = false;
        let enrollmentUpdated = false;

        // 1. Handle Assessment Lockout
        if (assessmentId) {
            const result = await Result.findOne({
                userId,
                assessmentId,
                completionStatus: 'in-progress'
            });

            if (result) {
                result.completionStatus = 'completed';
                result.lockedOut = true;
                result.lockoutReason = 'Disqualified due to tab switching';
                result.submittedAt = new Date();
                
                // Calculate time taken
                result.timeTaken = Math.floor((Date.now() - result.startedAt.getTime()) / 1000);

                await result.save();
                resultUpdated = true;
                console.log(`🔒 Result ${result._id} locked out and auto-submitted.`);
            }
        }

        // 2. Handle Course Lockout
        if (courseId) {
            const enrollment = await CourseEnrollment.findOne({
                student: userId,
                course: courseId
            });

            if (enrollment) {
                enrollment.status = 'suspended';
                await enrollment.save();
                enrollmentUpdated = true;
                console.log(`🔒 CourseEnrollment suspended for course ${courseId} and user ${userId}.`);
            }
        }

        // 3. Log the 4th lockout violation
        const query = { userId };
        if (assessmentId) query.assessmentId = assessmentId;
        if (courseId) query.courseId = courseId;
        
        const count = await UserActivityLog.countDocuments(query);
        const warningsCount = count + 1; // This should be 4

        const lockoutLog = new UserActivityLog({
            userId,
            assessmentId: assessmentId || undefined,
            courseId: courseId || undefined,
            eventType: 'tab_switch',
            warningsCount
        });

        await lockoutLog.save();

        res.json({
            success: true,
            message: 'Disqualified and locked out due to tab switching.',
            data: {
                resultUpdated,
                enrollmentUpdated,
                warningsCount
            }
        });
    } catch (err) {
        console.error('Error handling lockout submission:', err);
        res.status(500).json({
            success: false,
            error: 'Server error processing lockout',
            message: err.message
        });
    }
};

// Get current warning status/count for user
exports.getWarningStatus = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const { assessmentId, courseId } = req.query;

        const query = { userId };
        if (assessmentId) query.assessmentId = assessmentId;
        if (courseId) query.courseId = courseId;

        const count = await UserActivityLog.countDocuments(query);

        res.json({
            success: true,
            warningsCount: count
        });
    } catch (err) {
        console.error('Error fetching warning status:', err);
        res.status(500).json({
            success: false,
            error: 'Server error fetching warning status',
            message: err.message
        });
    }
};
