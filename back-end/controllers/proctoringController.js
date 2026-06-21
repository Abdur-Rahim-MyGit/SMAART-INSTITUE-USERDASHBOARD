const ProctoringSession = require('../models/ProctoringSession');
const ProctoringEvent = require('../models/ProctoringEvent');
const path = require('path');
const fs = require('fs');

// Private helper to calculate session risk score based on violations count & severity
const calculateRiskScore = (violationsByType) => {
  let score = 0;
  
  // Convert map or object to iterate
  const violations = violationsByType instanceof Map ? Object.fromEntries(violationsByType) : violationsByType;
  
  if (!violations) return 0;
  
  // Weight formula
  const weights = {
    tab_switch: 15,
    minimize: 15,
    fullscreen_exit: 20,
    face_absent: 15,
    multiple_faces: 25,
    attention_check_fail: 35,
    inactivity: 10
  };
  
  Object.keys(violations).forEach(type => {
    const count = violations[type] || 0;
    const weight = weights[type] || 10;
    score += count * weight;
  });
  
  // Cap risk score at 100
  return Math.min(score, 100);
};

// Start a new proctoring session
exports.startSession = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { resultId, assessmentId, environmentCheck } = req.body;

    if (!resultId || !assessmentId) {
      return res.status(400).json({ success: false, error: 'resultId and assessmentId are required.' });
    }

    // Terminate any existing active sessions for this user/assessment just in case
    await ProctoringSession.updateMany(
      { userId, assessmentId, status: 'active' },
      { status: 'completed', completedAt: new Date() }
    );

    const session = new ProctoringSession({
      resultId,
      userId,
      assessmentId,
      environmentCheck: {
        fullScreenGranted: environmentCheck?.fullScreenGranted || false,
        cameraGranted: environmentCheck?.cameraGranted || false,
        browserInfo: environmentCheck?.browserInfo || req.headers['user-agent'] || '',
        screenResolution: environmentCheck?.screenResolution || ''
      },
      status: 'active'
    });

    await session.save();

    res.status(201).json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('Error starting proctoring session:', err);
    res.status(500).json({ success: false, error: 'Server error starting session', message: err.message });
  }
};

// Log a single proctoring event / infraction
exports.logEvent = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;
    const { eventType, severity, details, screenshotUrl } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, error: 'eventType is required.' });
    }

    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(444).json({ success: false, error: 'Proctoring session not found.' });
    }

    // Create the event log
    const event = new ProctoringEvent({
      sessionId,
      userId,
      eventType,
      severity: severity || 'low',
      details: details || '',
      screenshotUrl: screenshotUrl || ''
    });

    await event.save();

    // Increment violation counts on session
    session.totalViolations += 1;
    
    // Update map counters
    const currentCount = session.violationsByType.get(eventType) || 0;
    session.violationsByType.set(eventType, currentCount + 1);

    // Re-calculate risk score
    session.riskScore = calculateRiskScore(session.violationsByType);

    // Auto-flag session if risk score gets high
    if (session.riskScore >= 60 && session.status === 'active') {
      session.status = 'flagged';
    }

    await session.save();

    res.status(201).json({
      success: true,
      data: event,
      sessionStatus: {
        totalViolations: session.totalViolations,
        riskScore: session.riskScore,
        status: session.status
      }
    });
  } catch (err) {
    console.error('Error logging proctoring event:', err);
    res.status(500).json({ success: false, error: 'Server error logging event', message: err.message });
  }
};

// Mark session completed
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(444).json({ success: false, error: 'Proctoring session not found.' });
    }

    session.completedAt = new Date();
    
    // Keep as 'flagged' if already flagged, else 'completed'
    if (session.status === 'active') {
      session.status = session.riskScore >= 60 ? 'flagged' : 'completed';
    }

    await session.save();

    res.json({
      success: true,
      data: session
    });
  } catch (err) {
    console.error('Error completing proctoring session:', err);
    res.status(500).json({ success: false, error: 'Server error completing session', message: err.message });
  }
};

// Handle webcam snapshot upload
exports.uploadSnapshot = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(444).json({ success: false, error: 'Proctoring session not found.' });
    }

    // Get the relative path for saving in DB and accessing statically
    const screenshotUrl = `/uploads/proctoring/${req.file.filename}`;

    res.json({
      success: true,
      screenshotUrl
    });
  } catch (err) {
    console.error('Error uploading proctoring snapshot:', err);
    res.status(500).json({ success: false, error: 'Server error uploading snapshot', message: err.message });
  }
};

// Admin: Get all sessions with user & assessment populated
exports.getSessions = async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skipCount = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await ProctoringSession.find(query)
      .populate('userId', 'fullName email studentId')
      .populate('assessmentId', 'assessmentName assessmentCode')
      .sort({ createdAt: -1 })
      .skip(skipCount)
      .limit(parseInt(limit));

    const total = await ProctoringSession.countDocuments(query);

    res.json({
      success: true,
      total,
      data: sessions
    });
  } catch (err) {
    console.error('Error fetching proctoring sessions for admin:', err);
    res.status(500).json({ success: false, error: 'Server error fetching sessions', message: err.message });
  }
};

// Admin: Get full details (including events list) of a session
exports.getSessionDetails = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ProctoringSession.findById(sessionId)
      .populate('userId', 'fullName email studentId collegeName')
      .populate('assessmentId', 'assessmentName assessmentCode durationMinutes');

    if (!session) {
      return res.status(444).json({ success: false, error: 'Proctoring session not found.' });
    }

    const events = await ProctoringEvent.find({ sessionId }).sort({ timestamp: 1 });

    res.json({
      success: true,
      data: {
        session,
        events
      }
    });
  } catch (err) {
    console.error('Error fetching session details:', err);
    res.status(500).json({ success: false, error: 'Server error fetching session details', message: err.message });
  }
};
