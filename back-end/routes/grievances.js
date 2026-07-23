const express = require('express');
const mongoose = require('mongoose');
const Grievance = require('../models/Grievance');
const { protect } = require('../middleware/auth');
const { uploadSupportAttachments } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/grievances
// @desc    Submit a new grievance
// @access  Private (Student only)
router.post('/', protect, uploadSupportAttachments.array('attachments', 5), async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can submit grievances',
      });
    }

    const { title, description, category, isAnonymous } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and category are required',
      });
    }

    // Process files if uploaded
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.filename,
          originalName: file.originalname,
          url: file.path || file.secure_url || file.url || `/uploads/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size
        });
      });
    }

    const grievance = new Grievance({
      student: req.user._id,
      college: req.user.college?._id || req.user.college,
      title: title.trim(),
      description: description.trim(),
      category,
      isAnonymous: isAnonymous === 'true' || isAnonymous === true,
      attachments
    });

    await grievance.save();

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      data: grievance
    });
  } catch (err) {
    console.error('[Grievances] Create error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit grievance' });
  }
});

// @route   GET /api/grievances
// @desc    Get all grievances for current student
// @access  Private (Student only)
router.get('/', protect, async (req, res) => {
  try {
    if (req.user?.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can view their grievances',
      });
    }

    const grievances = await Grievance.find({ student: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: grievances.length,
      data: grievances
    });
  } catch (err) {
    console.error('[Grievances] Fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to load grievances' });
  }
});

// @route   GET /api/grievances/:id
// @desc    Get details of a grievance
// @access  Private (Student or Admin)
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid grievance ID' });
    }

    const grievance = await Grievance.findById(id)
      .populate('student', 'fullName email rollNo mobile')
      .populate('responses.respondedBy', 'fullName role');

    if (!grievance) {
      return res.status(404).json({ success: false, error: 'Grievance not found' });
    }

    // Authorization: Only the student who submitted or an Admin can view
    if (req.user?.role !== 'admin' && grievance.student?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this grievance' });
    }

    // Anonymity sanitization: If anonymous and request is from admin, do not leak student details
    const grievanceObj = grievance.toObject();
    if (grievance.isAnonymous && req.user?.role === 'admin') {
      delete grievanceObj.student; // Hide student profile
    }

    res.json({
      success: true,
      data: grievanceObj
    });
  } catch (err) {
    console.error('[Grievances] Fetch details error:', err);
    res.status(500).json({ success: false, error: 'Failed to load grievance details' });
  }
});

// @route   POST /api/grievances/:id/respond
// @desc    Send a reply/response message to a grievance
// @access  Private (Student or Admin)
router.post('/:id/respond', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid grievance ID' });
    }

    const grievance = await Grievance.findById(id);
    if (!grievance) {
      return res.status(404).json({ success: false, error: 'Grievance not found' });
    }

    // Authorization: Only the student who submitted or an Admin can respond
    if (req.user?.role !== 'admin' && grievance.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized to reply to this grievance' });
    }

    const response = {
      message: message.trim(),
      respondedBy: req.user._id,
      respondedAt: new Date()
    };

    grievance.responses.push(response);
    
    // Automatically transition status to 'in-progress' if Admin responds
    if (req.user?.role === 'admin' && grievance.status === 'pending') {
      grievance.status = 'in-progress';
    }

    await grievance.save();

    // Re-fetch populated grievance to return to client
    const populated = await Grievance.findById(id)
      .populate('student', 'fullName email rollNo mobile')
      .populate('responses.respondedBy', 'fullName role');

    const resultObj = populated.toObject();
    if (populated.isAnonymous && req.user?.role === 'admin') {
      delete resultObj.student;
    }

    res.json({
      success: true,
      message: 'Reply sent successfully',
      data: resultObj
    });
  } catch (err) {
    console.error('[Grievances] Response error:', err);
    res.status(500).json({ success: false, error: 'Failed to send response' });
  }
});

module.exports = router;
