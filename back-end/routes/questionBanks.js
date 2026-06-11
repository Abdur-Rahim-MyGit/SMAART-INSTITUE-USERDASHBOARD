const express = require('express');
const QuestionBank = require('../models/QuestionBank');

const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
const { protectOrBypass } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleMiddleware');
router.use(generalLimiter);

// SECURITY: question banks contain correct answers. Restrict to staff to
// prevent answer-key disclosure and tampering (was fully open).
router.use(protectOrBypass);
router.use(requireRole('admin', 'teacher', 'moderator'));


// Get all questions with search and filter functionality
router.get('/', async (req, res) => {
    try {
        const { search, category, type, difficulty, tags, limit = 50 } = req.query;
        let query = { isActive: true };

        // Filter by category
        if (category) {
            query.category = category;
        }

        // Filter by type
        if (type) {
            query.type = type;
        }

        // Filter by difficulty
        if (difficulty) {
            query.difficulty = difficulty;
        }

        // Filter by tags
        if (tags) {
            query.tags = { $in: tags.split(',') };
        }

        // Search functionality
        if (search) {
            query.questionText = { $regex: search, $options: 'i' };
        }

        const questions = await QuestionBank.find(query)
            .populate('createdBy', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: questions.length,
            data: questions
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch questions',
            message: err.message
        });
    }
});

// Get question by ID
router.get('/:id', async (req, res) => {
    try {
        const question = await QuestionBank.findById(req.params.id)
            .populate('createdBy', 'fullName email');

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        res.json({
            success: true,
            data: question
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch question',
            message: err.message
        });
    }
});

// Create new question
router.post('/', async (req, res) => {
    try {
        const question = new QuestionBank(req.body);
        await question.save();

        res.status(201).json({
            success: true,
            message: 'Question created successfully',
            data: question
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to create question',
            message: err.message
        });
    }
});

// Update question
router.put('/:id', async (req, res) => {
    try {
        const question = await QuestionBank.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        res.json({
            success: true,
            message: 'Question updated successfully',
            data: question
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to update question',
            message: err.message
        });
    }
});

// Delete question
router.delete('/:id', async (req, res) => {
    try {
        const question = await QuestionBank.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({
                success: false,
                error: 'Question not found'
            });
        }

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Failed to delete question',
            message: err.message
        });
    }
});

module.exports = router;
