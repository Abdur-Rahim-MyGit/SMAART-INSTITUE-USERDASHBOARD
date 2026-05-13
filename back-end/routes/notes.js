const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

// Apply protection to all note routes
router.use(protect);

// @desc    Get all notes for the current user
// @route   GET /api/notes
// @access  Private
router.get('/', async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Get notes for a specific course
// @route   GET /api/notes/:courseId
// @access  Private
router.get('/:courseId', async (req, res) => {
  try {
    const note = await Note.findOne({
      user: req.user._id,
      courseId: req.params.courseId
    });

    if (!note) {
      return res.json({
        success: true,
        data: { content: '' }
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Upsert notes for a specific course
// @route   POST /api/notes
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { courseId, title, content } = req.body;

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide courseId'
      });
    }

    let note = await Note.findOne({
      user: req.user._id,
      courseId
    });

    if (note) {
      // Update existing note
      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      note.lastUpdated = Date.now();
      await note.save();
    } else {
      // Create new note
      note = await Note.create({
        user: req.user._id,
        courseId,
        title: title || '',
        content: content || ''
      });
    }

    res.json({
      success: true,
      data: note
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

// @desc    Delete a note
// @route   DELETE /api/notes/:courseId
// @access  Private
router.delete('/:courseId', async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      user: req.user._id,
      courseId: req.params.courseId
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        error: 'Note not found'
      });
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
});

module.exports = router;
