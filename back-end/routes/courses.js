const express = require('express');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply protection to all course routes
router.use(protect);

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

        // Filter by category
        if (category) {
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

        console.log(`📚 Fetched ${courses.length} courses with full module data`);
        if (courses.length > 0) {
            console.log(`📊 First course: ${courses[0].title}, Modules: ${courses[0].modules?.length || 0}`);
            if (courses[0].modules && courses[0].modules.length > 0) {
                console.log(`📖 First module: ${courses[0].modules[0].title}, Days: ${courses[0].modules[0].days?.length || 0}`);
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

        res.json({
            success: true,
            data: course
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch course',
            message: err.message
        });
    }
});

// Get course by code
router.get('/code/:code', async (req, res) => {
    try {
        const course = await Course.findOne({
            courseCode: req.params.code.toUpperCase()
        })
            .populate('createdBy', 'fullName email')
            .populate('colleges', 'name code');

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            data: course
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
        const course = new Course(req.body);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
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
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Course not found'
            });
        }

        res.json({
            success: true,
            message: 'Course updated successfully',
            data: course
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
