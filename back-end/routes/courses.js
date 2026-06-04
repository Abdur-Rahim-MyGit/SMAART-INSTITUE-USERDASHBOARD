const express = require('express');
const Course = require('../models/Course');
const College = require('../models/College');
const { protect } = require('../middleware/auth');
const {
    COURSE_STAGE_TITLES,
    CURRENT_COURSE_CATALOG,
    buildCatalogCoursePayload,
    normalizeCourseStages
} = require('../utils/courseStageDefaults');
const {
    enrichCourseForPlayer,
    pickBestCatalogCourse,
    courseHasQuizContent,
} = require('../utils/courseQuizSync');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Apply protection to all course routes
router.use(protect);

const getAllowedCategories = async (user) => {
    let allowed = ['Capacity', 'Capability', 'Leadership'];
    if (!user || user.role === 'admin' || user.role === 'moderator') {
        return null; 
    }
    if (user.college) {
        const collegeDoc = await College.findById(user.college);
        if (collegeDoc && collegeDoc.subscriptionPlan) {
            const { plan, addons } = collegeDoc.subscriptionPlan;
            const hasAIQ = !!addons?.aiq;
            if (hasAIQ) allowed.push('AIQ');

            const hasSQ = plan === 'Smaart Standard' || plan === 'Smaart Complete' || !!addons?.sq;
            if (hasSQ) allowed.push('SQ');

            const hasPIQ = plan === 'Smaart Complete' || !!addons?.piq;
            if (hasPIQ) allowed.push('PIQ');

            const hasBC = !!addons?.britishCouncil;
            if (hasBC) allowed.push('British Council');
        } else {
            allowed.push('AIQ');
        }
    } else {
        allowed.push('AIQ');
    }
    return allowed;
};

const checkCourseAccess = (course, allowedCategories) => {
    if (!allowedCategories) return true;
    const catLower = (course.category || '').toLowerCase();
    const code = (course.courseCode || '').toUpperCase();
    const num = (course.courseNumber || '').toUpperCase();
    
    if (catLower === 'piq' || code.startsWith('PIQ') || num.startsWith('PIQ')) {
        return allowedCategories.includes('PIQ');
    }
    if (catLower === 'aiq' || code.startsWith('AIQ') || num.startsWith('AIQ')) {
        return allowedCategories.includes('AIQ');
    }
    if (catLower === 'sq' || code.startsWith('SQ') || num.startsWith('SQ')) {
        return allowedCategories.includes('SQ');
    }
    if (catLower === 'british council' || code.startsWith('BC') || num.startsWith('BC')) {
        return allowedCategories.includes('British Council');
    }
    return true; 
};

// Get all courses with search and filter functionality
// NOW INCLUDES FULL MODULES AND DAYS DATA
router.get('/', async (req, res) => {
    try {
        const { search, status, college, category, limit = 50 } = req.query;
        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by college
        if (college) {
            query.colleges = college;
        }

        const allowedCategories = await getAllowedCategories(req.user);
        if (allowedCategories) {
            if (category) {
                const isAllowed = allowedCategories.some(c => c.toLowerCase() === category.toLowerCase());
                if (!isAllowed) {
                    query.category = '__none__';
                } else {
                    query.category = category;
                }
            } else {
                query.category = { $in: allowedCategories };
            }
        } else if (category) {
            query.category = category;
        }

        // Search functionality
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Fetch courses with FULL modules and days data
        const courses = await Course.find(query)
            .populate('createdBy', 'fullName email')
            .populate('colleges', 'name code')
            .sort({ courseCode: 1 })  // Sort by courseCode ascending (CRS00001, CRS00002, etc.)
            .limit(parseInt(limit));

        if (courses.length > 0) {
            if (courses[0].modules && courses[0].modules.length > 0) {
            }
        }

        res.json({
            success: true,
            count: courses.length,
            data: courses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch courses',
            message: err.message
        });
    }
});

// Upsert the current dashboard course catalog as published DB courses
router.post('/sync-defaults', async (req, res) => {
    try {
        const createdBy = req.user?._id || req.body.createdBy;
        const synced = [];

        for (const catalogCourse of CURRENT_COURSE_CATALOG) {
            const payload = buildCatalogCoursePayload(catalogCourse, createdBy);
            const course = await Course.findOneAndUpdate(
                { courseCode: catalogCourse.id },
                payload,
                { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );
            synced.push(course);
        }

        res.json({
            success: true,
            message: 'Default dashboard courses synced and published',
            count: synced.length,
            stageCount: COURSE_STAGE_TITLES.length,
            data: synced
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to sync default courses',
            message: err.message
        });
    }
});

// Publish course and enforce the seven-stage learning flow
router.patch('/:id/publish', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        course.set(
            normalizeCourseStages(
                {
                    ...course.toObject(),
                    ...req.body,
                    status: 'active',
                },
                course.toObject()
            )
        );
        await course.save();

        res.json({
            success: true,
            message: 'Course published with seven dynamic stages',
            stageCount: COURSE_STAGE_TITLES.length,
            data: course
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to publish course',
            message: err.message
        });
    }
});

// Get seven learning stages for a course (by Mongo ID or course code)
router.get('/:id/stages', async (req, res) => {
    try {
        const { id } = req.params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
        const course = isObjectId
            ? await Course.findById(id)
            : await Course.findOne({ courseCode: id.toUpperCase() });

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        const allowedCategories = await getAllowedCategories(req.user);
        if (!checkCourseAccess(course, allowedCategories)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied',
                message: 'Your institution subscription does not include access to this course.'
            });
        }

        const days = course.modules?.[0]?.days || [];
        const stages = days.map((day, index) => ({
            stageNumber: day.dayNumber || index + 1,
            title: day.moduleDetails?.title || COURSE_STAGE_TITLES[index] || `Stage ${index + 1}`,
            description: day.moduleDetails?.description || day.videoContent?.description || '',
            videoUrl:
                day.videoContent?.videoUrl ||
                day.video_url ||
                day.videoUrl ||
                day.VideoContent?.[0]?.videoUrl ||
                null,
            duration: day.videoContent?.duration || 5,
            transcription: day.videoContent?.transcription || '',
            type: day.steps?.[0]?.type || (index === 6 ? 'text' : 'video'),
            status: day.status || 'active'
        }));

        res.json({
            success: true,
            courseCode: course.courseCode,
            courseTitle: course.title,
            stageCount: stages.length,
            stageTitles: COURSE_STAGE_TITLES,
            data: stages
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course stages',
            message: err.message
        });
    }
});

// Resolve catalogue id (S01, PIQ01) or MongoDB id — prefers admin-edited course with quiz
router.get('/catalog/:catalogId', async (req, res) => {
    try {
        const raw = req.params.catalogId.trim();
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(raw);
        let course;

        if (isObjectId) {
            course = await Course.findById(raw);
        } else {
            const code = raw.toUpperCase();
            const candidates = await Course.find({
                $or: [
                    { courseCode: code },
                    { courseNumber: code },
                    { tags: code },
                ],
            })
                .sort({ updatedAt: -1 })
                .limit(20);

            course = pickBestCatalogCourse(candidates);

            if (!course) {
                course = await Course.findOne({ courseCode: code });
            }
        }

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found',
            });
        }

        const allowedCategories = await getAllowedCategories(req.user);
        if (!checkCourseAccess(course, allowedCategories)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied',
                message: 'Your institution subscription does not include access to this course.'
            });
        }

        res.json({
            success: true,
            data: enrichCourseForPlayer(course),
            hasQuizContent: courseHasQuizContent(enrichCourseForPlayer(course)),
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course',
            message: err.message,
        });
    }
});

// Get course by code
router.get('/code/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase();
        const candidates = await Course.find({
            $or: [{ courseCode: code }, { courseNumber: code }, { tags: code }],
        }).sort({ updatedAt: -1 });

        const course = pickBestCatalogCourse(candidates);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found',
            });
        }

        const allowedCategories = await getAllowedCategories(req.user);
        if (!checkCourseAccess(course, allowedCategories)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied',
                message: 'Your institution subscription does not include access to this course.'
            });
        }

        res.json({
            success: true,
            data: enrichCourseForPlayer(course),
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course',
            message: err.message
        });
    }
});

// Get course by ID with populated modules
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'fullName email')
            .populate('colleges', 'name code location');

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        const allowedCategories = await getAllowedCategories(req.user);
        if (!checkCourseAccess(course, allowedCategories)) {
            return res.status(403).json({
                success: false,
                error: 'Access Denied',
                message: 'Your institution subscription does not include access to this course.'
            });
        }

        res.json({
            success: true,
            data: enrichCourseForPlayer(course)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course',
            message: err.message
        });
    }
});

// Create new course
router.post('/', async (req, res) => {
    try {
        const shouldPublish = req.body.publish === true || req.body.status === 'active';
        const payload = shouldPublish
            ? normalizeCourseStages({ ...req.body, status: 'active' })
            : req.body;

        const course = new Course({
            ...payload,
            createdBy: payload.createdBy || req.user?._id
        });
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            stageCount: shouldPublish ? COURSE_STAGE_TITLES.length : undefined,
            data: course
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create course',
            message: err.message
        });
    }
});

// Update course
router.put('/:id', async (req, res) => {
    try {
        const existing = await Course.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        const shouldNormalizeStages = req.body.publish === true || req.body.status === 'active';
        const payload = shouldNormalizeStages
            ? normalizeCourseStages(
                { ...req.body, status: req.body.status || 'active' },
                existing.toObject()
            )
            : req.body;

        existing.set(payload);
        await existing.save();

        res.json({
            success: true,
            message: 'Course updated successfully',
            stageCount: shouldNormalizeStages ? COURSE_STAGE_TITLES.length : undefined,
            data: existing
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update course',
            message: err.message
        });
    }
});

// Delete course
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete course',
            message: err.message
        });
    }
});

// Get all modules for a course
router.get('/:id/modules', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id).select('modules title courseCode');

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            count: course.modules.length,
            data: course.modules
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch modules',
            message: err.message
        });
    }
});

// Add module to course
router.post('/:id/modules', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        course.modules.push(req.body);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Module added successfully',
            data: course
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to add module',
            message: err.message
        });
    }
});

module.exports = router;
