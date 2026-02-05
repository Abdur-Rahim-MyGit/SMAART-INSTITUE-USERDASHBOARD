const express = require('express');
const CourseEnrollment = require('../models/CourseEnrollment');
const { protect } = require('../middleware/auth');
const { awardEarlyAchieverBadge } = require('../utils/badgeHelper');

const router = express.Router();

// Apply protection to all enrollment routes
router.use(protect);

// Get all course enrollments with filters
router.get('/', async (req, res) => {
    try {
        const { student, course, college, status, limit = 50 } = req.query;
        let query = {};

        if (student) query.student = student;
        if (course) query.course = course;
        if (college) query.college = college;
        if (status) query.status = status;

        const enrollments = await CourseEnrollment.find(query)
            .populate('student', 'fullName email')
            .populate('course', 'title courseCode')
            .populate('college', 'name code')
            .sort({ enrollmentDate: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course enrollments',
            message: err.message
        });
    }
});

// Get enrollment by ID
router.get('/:id', async (req, res) => {
    try {
        const enrollment = await CourseEnrollment.findById(req.params.id)
            .populate('student', 'fullName email studentId')
            .populate('course', 'title courseCode modules')
            .populate('college', 'name code');

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Course enrollment not found'
            });
        }

        res.json({
            success: true,
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course enrollment',
            message: err.message
        });
    }
});

// Create new course enrollment
router.post('/', async (req, res) => {
    try {
        const enrollment = new CourseEnrollment(req.body);
        await enrollment.save();

        res.status(201).json({
            success: true,
            message: 'Course enrollment created successfully',
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create course enrollment',
            message: err.message
        });
    }
});

// Update course enrollment progress
router.put('/:id', async (req, res) => {
    try {
        const enrollment = await CourseEnrollment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Course enrollment not found'
            });
        }

        res.json({
            success: true,
            message: 'Course enrollment updated successfully',
            data: enrollment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update course enrollment',
            message: err.message
        });
    }
});

// Delete course enrollment
router.delete('/:id', async (req, res) => {
    try {
        const enrollment = await CourseEnrollment.findByIdAndDelete(req.params.id);

        if (!enrollment) {
            return res.status(404).json({
                success: false,
                error: 'Course enrollment not found'
            });
        }

        res.json({
            success: true,
            message: 'Course enrollment deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete course enrollment',
            message: err.message
        });
    }
});

// Get student's enrollments
router.get('/student/:studentId', async (req, res) => {
    try {
        const enrollments = await CourseEnrollment.find({ student: req.params.studentId })
            .populate('course', 'title courseCode duration status')
            .populate('college', 'name code')
            .sort({ enrollmentDate: -1 });

        res.json({
            success: true,
            count: enrollments.length,
            data: enrollments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch student enrollments',
            message: err.message
        });
    }
});


// Update task progress
const { checkCourseCompletionBadges } = require('../utils/badgeUtils');

router.post('/task-progress', async (req, res) => {
    try {
        console.log('Received task-progress request:', req.body);
        const { studentId, courseCode, moduleId, dayId, taskId, completed } = req.body;

        // We need the Course model to find the module ObjectId
        const Course = require('../models/Course');

        // Find course by code
        const course = await Course.findOne({ courseCode });
        if (!course) {
            console.error('Course not found for code:', courseCode);
            return res.status(404).json({ success: false, error: 'Course not found' });
        }
        console.log('Found course:', course._id);

        // Find enrollment
        let enrollment = await CourseEnrollment.findOne({
            student: studentId,
            course: course._id
        });

        if (!enrollment) {
            console.log('Enrollment not found. Creating new enrollment for student:', studentId);
            // Create new enrollment
            enrollment = new CourseEnrollment({
                student: studentId,
                course: course._id,
                status: 'in_progress',
                enrollmentDate: new Date(),
                progress: 0,
                moduleProgress: []
            });
        }
        console.log('Using enrollment:', enrollment._id);

        // Find the module ObjectId from the Course document using the numeric moduleId (index)
        // moduleId from frontend is 1-based index
        const moduleIndex = parseInt(moduleId) - 1;
        const moduleDoc = course.modules[moduleIndex];

        if (!moduleDoc) {
            console.error('Module not found at index:', moduleIndex);
            return res.status(404).json({ success: false, error: 'Module not found' });
        }
        console.log('Found module doc:', moduleDoc._id);

        // Find or create module progress entry
        let modProgress = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());

        if (!modProgress) {
            console.log('Creating new module progress entry');
            enrollment.moduleProgress.push({
                module: moduleDoc._id,
                completedTasks: []
            });
            // Get the newly added item
            modProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
        }

        // Ensure completedTasks exists
        if (!modProgress.completedTasks) {
            modProgress.completedTasks = [];
        }

        // Update completedTasks
        const taskIndex = modProgress.completedTasks.findIndex(
            t => t.dayId === parseInt(dayId) && t.taskId === parseInt(taskId)
        );

        if (completed) {
            if (taskIndex === -1) {
                console.log('Adding completed task:', { dayId, taskId });
                modProgress.completedTasks.push({
                    dayId: parseInt(dayId),
                    taskId: parseInt(taskId),
                    completedAt: new Date()
                });
            } else {
                console.log('Task already completed');
            }
        } else {
            if (taskIndex > -1) {
                console.log('Removing completed task');
                modProgress.completedTasks.splice(taskIndex, 1);
            }
        }

        enrollment.lastAccessedAt = new Date();
        await enrollment.save();
        console.log('Enrollment saved successfully');

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            const earlyBadge = await awardEarlyAchieverBadge(studentId);
            if (earlyBadge) badgesEarned.push(earlyBadge);

            const completionBadges = await checkCourseCompletionBadges(studentId, course._id.toString(), course);
            if (completionBadges && completionBadges.length > 0) {
                badgesEarned.push(...completionBadges.map(b => b.badgeDetails));
            }
        } catch (badgeErr) {
            console.error('Error in badge awarding:', badgeErr);
        }

        res.json({ success: true, data: enrollment, badgesEarned });

    } catch (err) {
        console.error('Error updating task progress:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update video progress (sync maxWatchedTime)
router.post('/video-progress', async (req, res) => {
    try {
        const { studentId, courseCode, moduleId, dayId, stepId, maxWatchedTime, videoDuration, isCompleted } = req.body;
        const Course = require('../models/Course');
        const { checkCourseCompletionBadges } = require('../utils/badgeUtils'); // Ensure util is available or rely on top-level import

        // Find course
        const course = await Course.findOne({ courseCode });
        if (!course) return res.status(404).json({ success: false, error: 'Course not found' });

        // Find or create enrollment
        let enrollment = await CourseEnrollment.findOne({
            student: studentId,
            course: course._id
        });

        if (!enrollment) {
            enrollment = new CourseEnrollment({
                student: studentId,
                course: course._id,
                status: 'in_progress',
                moduleProgress: []
            });
        }

        // Get module doc
        const moduleIndex = parseInt(moduleId) - 1;
        const moduleDoc = course.modules[moduleIndex];
        if (!moduleDoc) return res.status(404).json({ success: false, error: 'Module not found' });

        // Find or create module progress
        let modProgress = enrollment.moduleProgress.find(mp => mp.module.toString() === moduleDoc._id.toString());
        if (!modProgress) {
            enrollment.moduleProgress.push({
                module: moduleDoc._id,
                videoProgress: []
            });
            modProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
        }
        // Find or create video progress for this specific day AND step
        if (!modProgress.videoProgress) modProgress.videoProgress = [];

        // Find existing record by both dayId and stepId
        let vidProgress = modProgress.videoProgress.find(vp =>
            vp.dayId === parseInt(dayId) &&
            (vp.stepId === parseInt(stepId) || (!vp.stepId && parseInt(stepId) === 1))
        );

        if (!vidProgress) {
            console.log(`Adding new video progress for S${dayId} Step ${stepId}`);
            modProgress.videoProgress.push({
                dayId: parseInt(dayId),
                stepId: parseInt(stepId || 1),
                maxWatchedTime: parseFloat(maxWatchedTime || 0),
                videoDuration: parseFloat(videoDuration || 0),
                isCompleted: !!isCompleted,
                lastUpdated: new Date()
            });
        } else {
            console.log(`Updating existing video progress for S${dayId} Step ${stepId}`);
            // Update stepId if it was missing (legacy migration)
            if (!vidProgress.stepId) vidProgress.stepId = parseInt(stepId || 1);

            // Only update if the new time is greater
            if (parseFloat(maxWatchedTime) > vidProgress.maxWatchedTime) {
                vidProgress.maxWatchedTime = parseFloat(maxWatchedTime);
                vidProgress.lastUpdated = new Date();
            }
            // Update completion status if provided
            if (isCompleted !== undefined) {
                vidProgress.isCompleted = !!isCompleted;
                vidProgress.lastUpdated = new Date();
            }
            // Update video duration if provided
            if (videoDuration !== undefined) {
                vidProgress.videoDuration = parseFloat(videoDuration);
                vidProgress.lastUpdated = new Date();
            }
        }

        enrollment.lastAccessedAt = new Date();
        await enrollment.save();

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            const earlyBadge = await awardEarlyAchieverBadge(studentId);
            if (earlyBadge) badgesEarned.push(earlyBadge);

            const completionBadges = await checkCourseCompletionBadges(studentId, course._id.toString(), course);
            if (completionBadges && completionBadges.length > 0) {
                badgesEarned.push(...completionBadges.map(b => b.badgeDetails));
            }
        } catch (badgeErr) {
            console.error('Error in badge awarding:', badgeErr);
        }

        res.json({ success: true, data: enrollment, badgesEarned });

    } catch (err) {
        console.error('Error updating video progress:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});


module.exports = router;
