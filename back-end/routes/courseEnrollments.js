const express = require('express');
const mongoose = require('mongoose');
const CourseEnrollment = require('../models/CourseEnrollment');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');
const { notifyCourseEnrollment, notifyCourseCompleted, notifySessionCompleted } = require('../services/notificationService');
const { isSessionCompleted, isModuleCompleted } = require('../utils/progressUtils');
const { checkCourseCompletionBadges, checkSkillCompletionBadges } = require('../utils/badgeUtils');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


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

        // Send notification for course enrollment
        try {
            // Try to get course title for better notification
            const course = await Course.findById(enrollment.course);
            const courseName = course?.title || 'a new course';
            await notifyCourseEnrollment(enrollment.student, courseName);
            console.log(`🔔 Notification sent for course enrollment: ${courseName}`);
        } catch (notifyError) {
            console.error("⚠️ Error sending enrollment notification:", notifyError);
        }

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
            .populate('course', 'title courseCode duration status modules')
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



router.post('/task-progress', async (req, res) => {
    try {
        console.log('Received task-progress request:', req.body);
        const { studentId, courseCode, moduleId, dayId, taskId, completed } = req.body;


        // Find course by code
        const course = await Course.findOne({
            $or: [
                { courseCode: courseCode },
                { courseNumber: courseCode }
            ]
        });
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

        const wasDoneBefore = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

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

        const isDoneNow = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        if (!wasDoneBefore && isDoneNow) {
            try {
                await notifySessionCompleted(studentId, { title: course.title, _id: course._id }, dayId);
                console.log(`🔔 Session Completed Notification sent for Day ${dayId}`);
            } catch (notifyError) {
                console.error("⚠️ Error sending session notification:", notifyError);
            }
        }

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            // Check if entire module (Skill) is completed
            const isModuleComplete = await isModuleCompleted(enrollment, course, moduleDoc);

            if (isModuleComplete) {
                const skillBadgeResult = await checkSkillCompletionBadges(studentId, moduleDoc._id, moduleDoc.title);
                if (skillBadgeResult && skillBadgeResult.newlyEarned) {
                    badgesEarned.push(skillBadgeResult.badgeDetails);
                }
            }

            // Check if entire course is completed
            if (enrollment.status === 'completed') {
                const courseBadgeResult = await checkCourseCompletionBadges(studentId, course._id, course);
                if (courseBadgeResult && courseBadgeResult.newlyEarned) {
                    badgesEarned.push(courseBadgeResult.badgeDetails);
                }
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

        // Find course
        const course = await Course.findOne({
            $or: [
                { courseCode: courseCode },
                { courseNumber: courseCode }
            ]
        });
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

        const wasDoneBefore = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

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

        const isDoneNow = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        if (!wasDoneBefore && isDoneNow) {
            try {
                await notifySessionCompleted(studentId, { title: course.title, _id: course._id }, dayId);
                console.log(`🔔 Session Completed Notification sent for Day ${dayId}`);
            } catch (notifyError) {
                console.error("⚠️ Error sending session notification:", notifyError);
            }
        }

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            // Check if entire module (Skill) is completed
            const isModuleComplete = await isModuleCompleted(enrollment, course, moduleDoc);

            if (isModuleComplete) {
                const skillBadgeResult = await checkSkillCompletionBadges(studentId, moduleDoc._id, moduleDoc.title);
                if (skillBadgeResult && skillBadgeResult.newlyEarned) {
                    badgesEarned.push(skillBadgeResult.badgeDetails);
                }
            }

            // Check if entire course is completed
            if (enrollment.status === 'completed') {
                const courseBadgeResult = await checkCourseCompletionBadges(studentId, course._id, course);
                if (courseBadgeResult && courseBadgeResult.newlyEarned) {
                    badgesEarned.push(courseBadgeResult.badgeDetails);
                }
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


// Update quiz/assessment progress
router.post('/quiz-progress', async (req, res) => {
    try {
        const { studentId, courseCode, moduleId, dayId, quizId, score, totalPoints } = req.body;

        // Find course
        const course = await Course.findOne({
            $or: [
                { courseCode: courseCode },
                { courseNumber: courseCode }
            ]
        });
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
                quizzesTaken: []
            });
            modProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
        }

        if (!modProgress.quizzesTaken) modProgress.quizzesTaken = [];

        // Add or update quiz record
        // Note: For micro-assessments stored in Course model, we might not have a separate Quiz ID,
        // so we can generate a consistent pseudo-ID or use the one provided by frontend.
        const existingQuiz = modProgress.quizzesTaken.find(q => q.quizId && q.quizId.toString() === quizId);

        const wasDoneBefore = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        if (existingQuiz) {
            // Update existing attempt (keep highest score or just last attempt? Usually highest)
            if (score > existingQuiz.score) {
                existingQuiz.score = score;
            }
            // Always update these
            existingQuiz.totalPoints = totalPoints;
            existingQuiz.attempts = (existingQuiz.attempts || 0) + 1;
            existingQuiz.completedAt = new Date();
        } else {
            // New attempt
            modProgress.quizzesTaken.push({
                quizId: quizId || new mongoose.Types.ObjectId(), // If no ID, generate one (though frontend should provide stable ID)
                score: score,
                totalPoints: totalPoints,
                attempts: 1,
                completedAt: new Date()
            });
        }

        enrollment.lastAccessedAt = new Date();
        await enrollment.save();

        const isDoneNow = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        if (!wasDoneBefore && isDoneNow) {
            try {
                await notifySessionCompleted(studentId, { title: course.title, _id: course._id }, dayId);
                console.log(`🔔 Session Completed Notification sent for Day ${dayId}`);
            } catch (notifyError) {
                console.error("⚠️ Error sending session notification:", notifyError);
            }
        }

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            // Check if entire module (Skill) is completed
            const isModuleComplete = await isModuleCompleted(enrollment, course, moduleDoc);

            if (isModuleComplete) {
                const skillBadgeResult = await checkSkillCompletionBadges(studentId, moduleDoc._id, moduleDoc.title);
                if (skillBadgeResult && skillBadgeResult.newlyEarned) {
                    badgesEarned.push(skillBadgeResult.badgeDetails);
                }
            }

            // Check if entire course is completed
            if (enrollment.status === 'completed') {
                const courseBadgeResult = await checkCourseCompletionBadges(studentId, course._id, course);
                if (courseBadgeResult && courseBadgeResult.newlyEarned) {
                    badgesEarned.push(courseBadgeResult.badgeDetails);
                }
            }
        } catch (badgeErr) {
            console.error('Error in badge awarding (quiz):', badgeErr);
        }

        res.json({ success: true, data: enrollment, badgesEarned });

    } catch (err) {
        console.error('Error updating quiz progress:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update task result (with score)
router.post('/task-result', async (req, res) => {
    try {
        const { studentId, courseCode, moduleId, dayId, stepId, score, totalPoints, responses } = req.body;

        // Find course
        const course = await Course.findOne({
            $or: [
                { courseCode: courseCode },
                { courseNumber: courseCode }
            ]
        });
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
                taskResults: [],
                completedTasks: []
            });
            modProgress = enrollment.moduleProgress[enrollment.moduleProgress.length - 1];
        }

        if (!modProgress.taskResults) modProgress.taskResults = [];
        if (!modProgress.completedTasks) modProgress.completedTasks = [];

        // Update or add task result
        const existingResult = modProgress.taskResults.find(r => r.dayId === parseInt(dayId) && r.stepId === parseInt(stepId));
        if (existingResult) {
            if (score > (existingResult.score || 0)) {
                existingResult.score = score;
                existingResult.totalPoints = totalPoints;
                existingResult.responses = responses;
                existingResult.completedAt = new Date();
            } else if (responses) {
                // Even if score isn't higher, we might want to update responses if they've changed
                existingResult.responses = responses;
                existingResult.completedAt = new Date();
            }
        } else {
            modProgress.taskResults.push({
                dayId: parseInt(dayId),
                stepId: parseInt(stepId),
                score: score,
                totalPoints: totalPoints,
                responses: responses,
                completedAt: new Date()
            });
        }

        // Also update completedTasks for compatibility with progress logic
        const existingCompletion = modProgress.completedTasks.find(t => t.dayId === parseInt(dayId) && t.taskId === parseInt(stepId));
        if (!existingCompletion) {
            modProgress.completedTasks.push({
                dayId: parseInt(dayId),
                taskId: parseInt(stepId),
                completedAt: new Date()
            });
        }

        const wasDoneBefore = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        enrollment.lastAccessedAt = new Date();
        await enrollment.save();

        const isDoneNow = await isSessionCompleted(enrollment, course, moduleDoc, dayId);

        if (!wasDoneBefore && isDoneNow) {
            try {
                await notifySessionCompleted(studentId, { title: course.title, _id: course._id }, dayId);
            } catch (notifyError) {
                console.error("⚠️ Error sending session notification:", notifyError);
            }
        }

        // Check for badge eligibility
        const badgesEarned = [];
        try {
            // Check if entire module (Skill) is completed
            const isModuleComplete = await isModuleCompleted(enrollment, course, moduleDoc);

            if (isModuleComplete) {
                const skillBadgeResult = await checkSkillCompletionBadges(studentId, moduleDoc._id, moduleDoc.title);
                if (skillBadgeResult && skillBadgeResult.newlyEarned) {
                    badgesEarned.push(skillBadgeResult.badgeDetails);
                }
            }

            // Check if entire course is completed
            if (enrollment.status === 'completed') {
                const courseBadgeResult = await checkCourseCompletionBadges(studentId, course._id, course);
                if (courseBadgeResult && courseBadgeResult.newlyEarned) {
                    badgesEarned.push(courseBadgeResult.badgeDetails);
                }
            }
        } catch (badgeErr) {
            console.error('Error in badge awarding:', badgeErr);
        }

        res.json({ success: true, data: enrollment, badgesEarned });
    } catch (err) {
        console.error('Error updating task result:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Track active time spent (increments totalTimeSpent)
router.post('/active-time', async (req, res) => {
    try {
        const studentId = req.user._id;
        const { courseCode, incrementMinutes = 1 } = req.body;

        let enrollment = null;

        if (courseCode) {
            // Find course
            const course = await Course.findOne({
                $or: [
                    { courseCode: courseCode },
                    { courseNumber: courseCode }
                ]
            });
            if (course) {
                enrollment = await CourseEnrollment.findOne({
                    student: studentId,
                    course: course._id
                });
            }
        }

        // Fallback: If no course specified or enrollment not found, find the most recently updated enrollment
        if (!enrollment) {
            enrollment = await CourseEnrollment.findOne({ student: studentId })
                .sort({ updatedAt: -1 });
        }

        // If still no enrollment, create a default one for the first course
        if (!enrollment) {
            const firstCourse = await Course.findOne();
            if (firstCourse) {
                enrollment = new CourseEnrollment({
                    student: studentId,
                    course: firstCourse._id,
                    status: 'in_progress',
                    enrollmentDate: new Date(),
                    progress: 0,
                    moduleProgress: []
                });
            }
        }

        if (!enrollment) {
            return res.status(404).json({ success: false, error: 'No active courses or enrollments found to track time.' });
        }

        // Increment totalTimeSpent in minutes
        enrollment.totalTimeSpent = (enrollment.totalTimeSpent || 0) + incrementMinutes;
        enrollment.lastAccessedAt = new Date();

        await enrollment.save();

        res.json({
            success: true,
            message: 'Active learning time updated successfully',
            totalTimeSpent: enrollment.totalTimeSpent
        });
    } catch (err) {
        console.error('Error tracking active time:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
