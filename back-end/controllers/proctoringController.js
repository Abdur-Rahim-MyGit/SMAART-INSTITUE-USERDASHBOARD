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
    face_mismatch: 30,      // High risk — different person
    face_covered: 10,       // Low risk — obstruction
    attention_check_fail: 35,
    inactivity: 10,
    face_registered: 0,     // Info event — no risk contribution
    identity_verified: 0,   // Info event — no risk contribution
    gaze_away: 10,
    eyes_closed: 15,
    voice_detected: 25,
    prolonged_silence: 10,
    // v2 ONNX events
    spoof_detected: 40,        // Critical — photo/video replay attack
    camera_quality_check: 0,   // Info
    registration_quality: 0,   // Info
    tracker_loss: 5,           // Low — brief tracking loss
    identity_confidence: 0,    // Info
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

    // Check if there is an existing locked session for this assessment and user
    const existingLockedSession = await ProctoringSession.findOne({ userId, assessmentId, isLocked: true });
    if (existingLockedSession) {
      return res.status(403).json({
        success: false,
        error: 'Assessment is locked. A support ticket is pending.',
        isLocked: true,
        activeTicketId: existingLockedSession.activeTicketId
      });
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

    // Info-only events don't count as violations
    const infoOnlyEvents = [
      'face_registered', 'identity_verified',
      // v2 info events
      'camera_quality_check', 'registration_quality', 'identity_confidence',
      // v3 batch verification events
      'verification_batch', 'face_absent_reminder',
    ];
    const metadataPayload = req.body.metadata || {};

    if (infoOnlyEvents.includes(eventType)) {
      // Mark face registration on session
      if (eventType === 'face_registered') {
        session.faceRegistered = true;
        session.faceRegisteredAt = new Date();
      }
      if (eventType === 'identity_verified') {
        session.identityVerified = true;
        session.identityVerifiedAt = new Date();
      }
    } else {
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

// Trigger lock on a session
exports.triggerLock = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { lockReason } = req.body;

    const session = await ProctoringSession.findById(sessionId);
    if (!session) {
      return res.status(444).json({ success: false, error: 'Proctoring session not found.' });
    }

    if (session.isLocked) {
      return res.json({ success: true, isLocked: true, activeTicketId: session.activeTicketId });
    }

    session.isLocked = true;
    session.status = 'locked';
    session.lockReason = lockReason || 'Suspicious activity threshold exceeded';

    // Create a support ticket
    const SupportTicket = require('../models/SupportTicket');
    const { createLog } = require('./logController');
    const { broadcastToAll, sendNotificationToUser } = require('../services/websocketService');
    const wsService = require('../services/websocketService'); // get user details
    const User = require('../models/User');
    const user = await User.findById(session.userId);

    const newTicket = new SupportTicket({
      userId: session.userId,
      userModel: 'Student',
      title: 'Assessment Auto-Locked: Proctoring Violation',
      description: `The assessment session ${session.assessmentId} for student ${user?.fullName || session.userId} has been automatically locked by the AI Proctoring system.\nReason: ${session.lockReason}\nViolations Count: ${session.totalViolations}\nRisk Score: ${session.riskScore}`,
      category: 'course & assessment',
      priority: 'high',
      status: 'open'
    });

    await newTicket.save();

    session.activeTicketId = newTicket._id;
    await session.save();

    res.json({
      success: true,
      data: session,
      ticketId: newTicket.ticketId
    });
  } catch (err) {
    console.error('Error locking proctoring session:', err);
    res.status(500).json({ success: false, error: 'Server error locking session', message: err.message });
  }
};

// Webhook to receive unlock signal from Admin and emit socket event
exports.webhookUnlock = async (req, res) => {
  try {
    const { ticketId, userId } = req.body;
    if (userId) {
      const Notification = require('../models/Notification');
      await Notification.createNotification({
        userId,
        title: 'Assessment Unlocked',
        message: 'Your assessment has been unlocked by IT support. You may now resume.',
        type: 'system',
        metadata: { ticketId, action: 'assessment_unlocked' }
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Webhook unlock error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── Save face registration embedding to session ───────────────────────────
/**
 * POST /api/proctoring/sessions/:sessionId/registration
 * Body: {
 *   embedding: number[],        // Float32Array serialised to plain array
 *   model: string,              // 'arcface-r50-onnx'
 *   qualityScore: number,       // 0-100
 *   framesCaptured: number,     // 5
 *   antispoofPassed: boolean,   // true
 *   alignedCropUrl?: string,    // optional preview URL
 * }
 *
 * The embedding is serialised as JSON to fit in a String field.
 * It is scoped to this proctoring session only and auto-deleted after 30 days
 * via the TTL index on completedAt (DPDPA 2023 compliance).
 */
exports.saveRegistration = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;
    const { embedding, allEmbeddings, registrationImages, model, qualityScore, framesCaptured, antispoofPassed, alignedCropUrl } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ success: false, error: 'embedding (array) is required.' });
    }
    if (embedding.length !== 512) {
      return res.status(400).json({ success: false, error: `Expected 512-d embedding, got ${embedding.length}.` });
    }

    const session = await ProctoringSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Proctoring session not found.' });
    }

    // Single merged embedding (backward compat)
    session.faceEmbedding = JSON.stringify(embedding);
    session.faceEmbeddingModel = model || 'arcface-r50-onnx';
    session.faceEmbeddingDims = 512;
    session.faceRegistrationQuality = qualityScore ?? null;
    session.faceRegistrationFrames = framesCaptured ?? null;
    session.antispoofPassed = antispoofPassed ?? null;
    session.faceAlignedCropUrl = alignedCropUrl || null;
    session.faceRegistered = true;
    session.faceRegisteredAt = new Date();

    // v3: Store all 5 individual embeddings for multi-reference verification
    if (allEmbeddings && Array.isArray(allEmbeddings) && allEmbeddings.length > 0) {
      session.allFaceEmbeddings = JSON.stringify(allEmbeddings);
    }

    // v3: Store 5 registration crop images as base64
    if (registrationImages && Array.isArray(registrationImages)) {
      session.registrationImages = registrationImages.filter(Boolean).slice(0, 5);
    }

    await session.save();

    res.status(200).json({ success: true, message: 'Face registration saved to session.' });
  } catch (err) {
    console.error('[ProctoringController] saveRegistration error:', err);
    res.status(500).json({ success: false, error: 'Server error saving registration.', message: err.message });
  }
};

// ─── Retrieve embedding for session resume ─────────────────────────────────
/**
 * GET /api/proctoring/sessions/:sessionId/embedding
 * Returns the stored ArcFace embedding for this session so the client can
 * resume verification after a page refresh without re-registering.
 */
exports.getEmbedding = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;

    const session = await ProctoringSession.findOne(
      { _id: sessionId, userId },
      'faceEmbedding allFaceEmbeddings faceEmbeddingModel faceEmbeddingDims faceRegistered faceRegistrationQuality'
    );

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }
    if (!session.faceRegistered || !session.faceEmbedding) {
      return res.status(404).json({ success: false, error: 'No face registration found for this session.' });
    }

    const embedding = JSON.parse(session.faceEmbedding);
    // v3: Return all 5 individual embeddings if available
    let allEmbeddings = null;
    if (session.allFaceEmbeddings) {
      try {
        allEmbeddings = JSON.parse(session.allFaceEmbeddings);
      } catch (e) {
        console.warn('[ProctoringController] Failed to parse allFaceEmbeddings:', e);
      }
    }

    res.json({
      success: true,
      embedding,
      allEmbeddings,
      model: session.faceEmbeddingModel,
      dimensions: session.faceEmbeddingDims,
      qualityScore: session.faceRegistrationQuality,
    });
  } catch (err) {
    console.error('[ProctoringController] getEmbedding error:', err);
    res.status(500).json({ success: false, error: 'Server error retrieving embedding.', message: err.message });
  }
};

// ─── Log batch verification result to session history ──────────────────────
/**
 * POST /api/proctoring/sessions/:sessionId/verification
 * Body: {
 *   similarity: number,      // best-match cosine similarity (0–1)
 *   status: string,          // 'verified' | 'mismatch' | 'no_face' | 'multiple_faces'
 *   framesCaptured: number,  // usable frames in this batch
 *   warningIssued: boolean,  // whether a warning was shown to the user
 * }
 */
exports.logVerification = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;
    const { similarity, status, framesCaptured, warningIssued } = req.body;

    const session = await ProctoringSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found.' });
    }

    // Append to verification history (cap at 50 entries)
    if (!session.verificationHistory) session.verificationHistory = [];
    session.verificationHistory.push({
      timestamp: new Date(),
      similarity: similarity ?? 0,
      status: status || 'error',
      framesCaptured: framesCaptured ?? 0,
    });
    if (session.verificationHistory.length > 50) {
      session.verificationHistory = session.verificationHistory.slice(-50);
    }

    // Update face check stats
    session.totalFaceChecks = (session.totalFaceChecks || 0) + 1;
    if (status === 'verified') {
      session.faceChecksPassed = (session.faceChecksPassed || 0) + 1;
    }
    session.faceVerificationPassRate = session.totalFaceChecks > 0
      ? session.faceChecksPassed / session.totalFaceChecks
      : 0;

    // Increment warning count if a warning was shown
    if (warningIssued) {
      session.warningCount = (session.warningCount || 0) + 1;
    }

    await session.save();

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[ProctoringController] logVerification error:', err);
    res.status(500).json({ success: false, error: 'Server error logging verification.', message: err.message });
  }
};
