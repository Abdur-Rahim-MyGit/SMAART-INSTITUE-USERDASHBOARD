const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { protect } = require('../middleware/auth');

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
        res.json({ success: true, data: resumes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }
        res.json({ success: true, data: resume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Create resume
// @route   POST /api/resumes
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const newResume = await Resume.create({
            ...req.body,
            userId: req.user._id
        });
        res.status(201).json({ success: true, data: newResume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.json({ success: true, data: resume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found' });
        }

        await resume.remove();
        res.json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
