const express = require('express');
const Assessment = require('../models/Assessment');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);


// Apply protection to all assessment routes
router.use(protect);

// SECURITY: only staff may see the answer key. For everyone else (e.g. students
// loading an assessment to take it) strip questions[].correctAnswer so the
// answers cannot be read straight from the API response.
const STAFF_ROLES = ['admin', 'teacher', 'moderator'];
const isStaffUser = (user) => {
    if (!user) return false;
    if (user.role && STAFF_ROLES.includes(user.role)) return true;
    if (Array.isArray(user.roles) && user.roles.some((r) => STAFF_ROLES.includes(r))) return true;
    return false;
};
const sanitizeAssessment = (assessmentDoc, user) => {
    const obj = typeof assessmentDoc.toObject === 'function' ? assessmentDoc.toObject() : assessmentDoc;
    if (!isStaffUser(user) && Array.isArray(obj.questions)) {
        obj.questions = obj.questions.map((q) => {
            const { correctAnswer, ...rest } = q;
            return rest;
        });
    }
    return obj;
};

// Get all assessments with search and filter functionality
router.get('/', async (req, res) => {
    try {
        const { search, status, category, createdBy, limit = 50 } = req.query;
        let query = {};

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by category
        if (category) {
            query.questionCategory = category;
        }

        // Filter by creator
        if (createdBy) {
            query.createdBy = createdBy;
        }

        // Search functionality
        if (search) {
            const safe = require('../utils/escapeRegex')(search); // SECURITY: ReDoS-safe
            query.$or = [
                { assessmentName: { $regex: safe, $options: 'i' } },
                { assessmentCode: { $regex: safe, $options: 'i' } },
                { description: { $regex: safe, $options: 'i' } }
            ];
        }

        const assessments = await Assessment.find(query)
            .select('assessmentCode assessmentName description questionCategory status duration totalAttempts averageScore createdAt')
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();  // PERF: skip document hydration; identical JSON (no virtuals).

        res.json({
            success: true,
            count: assessments.length,
            data: assessments
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessments',
            message: err.message
        });
    }
});


// Get assessment by code
router.get('/code/:code', async (req, res) => {
    try {
        const assessment = await Assessment.findOne({
            assessmentCode: req.params.code.toUpperCase()
        })
            .populate('createdBy', 'fullName email');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            data: sanitizeAssessment(assessment, req.user)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessment',
            message: err.message
        });
    }
});

// Check if user has completed an assessment
router.get('/code/:code/status', async (req, res) => {
    try {
        const { code } = req.params;
        const userId = req.user.id;

        // Find the assessment
        const assessment = await Assessment.findOne({
            assessmentCode: code.toUpperCase()
        });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Check if user has completed this assessment
        const Result = require('../models/Result');
        const completedResult = await Result.findOne({
            userId,
            assessmentId: assessment._id,
            completionStatus: 'completed'
        }).sort({ submittedAt: -1 });

        res.json({
            success: true,
            data: {
                assessmentCode: assessment.assessmentCode,
                assessmentName: assessment.assessmentName,
                completed: !!completedResult,
                completedAt: completedResult?.submittedAt || null,
                resultId: completedResult?._id || null
            }
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to check assessment status',
            message: err.message
        });
    }
});

// Get assessment by description
router.get('/by-description/:description', async (req, res) => {
    try {
        const description = require('../utils/escapeRegex')(req.params.description); // SECURITY: ReDoS-safe

        const assessment = await Assessment.findOne({
            description: { $regex: description, $options: 'i' },
            status: 'active'
        })
            .select('_id assessmentCode assessmentName description questionCategory totalQuestions status')
            .populate('createdBy', 'fullName email');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            data: assessment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessment',
            message: err.message
        });
    }
});

// Get skill assessment by skill name
router.get('/skill/:skillName', async (req, res) => {
    try {
        const { skillName } = req.params;
        const db = require('mongoose').connection.db;

        const escapedSkillName = require('../utils/escapeRegex')(skillName);
        const skillAssessment = await db.collection('skillassessments').findOne({
            status: 'active',
            $or: [
                { instructions: { $regex: new RegExp('^' + escapedSkillName + '$', 'i') } },
                { questionCategory: { $regex: new RegExp('^' + escapedSkillName + '$', 'i') } }
            ]
        });

        if (!skillAssessment) {
            return res.json({
                success: false,
                message: 'No skill assessment found'
            });
        }

        res.json({
            success: true,
            data: sanitizeAssessment(skillAssessment, req.user)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch skill assessment',
            message: err.message
        });
    }
});

// Get assessment by ID
router.get('/:id', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .populate('createdBy', 'fullName email')
            .populate('lastModifiedBy', 'fullName email');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            data: sanitizeAssessment(assessment, req.user)
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessment',
            message: err.message
        });
    }
});


// Create new assessment (staff only)
router.post('/', authorize('admin', 'teacher'), async (req, res) => {
    try {
        const assessment = new Assessment(req.body);
        await assessment.save();

        res.status(201).json({
            success: true,
            message: 'Assessment created successfully',
            data: assessment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create assessment',
            message: err.message
        });
    }
});

// Update assessment (staff only)
router.put('/:id', authorize('admin', 'teacher'), async (req, res) => {
    try {
        const assessment = await Assessment.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            message: 'Assessment updated successfully',
            data: assessment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update assessment',
            message: err.message
        });
    }
});

// Delete assessment (admin only)
router.delete('/:id', authorize('admin'), async (req, res) => {
    try {
        const assessment = await Assessment.findByIdAndDelete(req.params.id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            message: 'Assessment deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete assessment',
            message: err.message
        });
    }
});

// Submit assessment response
router.post('/:id/submit', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        // Add response to assessment
        assessment.responses.push(req.body);
        assessment.totalAttempts += 1;

        // Recalculate average score
        const totalScore = assessment.responses.reduce((sum, r) => sum + r.percentage, 0);
        assessment.averageScore = totalScore / assessment.responses.length;

        await assessment.save();

        res.json({
            success: true,
            message: 'Assessment response submitted successfully',
            data: assessment
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to submit assessment response',
            message: err.message
        });
    }
});

// Get all responses for an assessment
router.get('/:id/responses', async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id)
            .select('responses assessmentName assessmentCode')
            .populate('responses.user', 'fullName email');

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found'
            });
        }

        res.json({
            success: true,
            count: assessment.responses.length,
            data: assessment.responses
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch responses',
            message: err.message
        });
    }
});

module.exports = router;
