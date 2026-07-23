const ProctoringSession = require('../models/ProctoringSession');
const ProctoringEvent = require('../models/ProctoringEvent');
const path = require('path');
const fs = require('fs');

// Violation budget. The server — not the browser — owns this decision.
// Shared with the submit gate so the two can never disagree.
const {
  MAX_WARNINGS,
  RISK_FLAG_THRESHOLD,
  RISK_LOCK_THRESHOLD,
  HEARTBEAT_GAP_MS,
  FLAG_ONLY_MODE,
  RISK_WEIGHTS
} = require('../config/proctoringPolicy');

// Info-only events that must never count against the student
const INFO_ONLY_EVENTS = ['face_registered', 'identity_verified', 'heartbeat'];

/**
 * Load a proctoring session, enforcing that the caller owns it.
 *
 * Every student-facing session endpoint previously did a bare findById, which
 * let any authenticated user log events against, complete, or lock another
 * student's session. Returns { session } on success or { error, status } so
 * callers can respond consistently.
 */
const loadOwnedSession = async (sessionId, user) => {
  if (!sessionId || !sessionId.match(/^[0-9a-fA-F]{24}$/)) {
    return { error: 'Invalid session id.', status: 400 };
  }

  const session = await ProctoringSession.findById(sessionId);
  if (!session) {
    return { error: 'Proctoring session not found.', status: 404 };
  }

  const callerId = String(user?._id || user?.id || '');
  const ownerId = String(session.userId || '');
  const isAdmin = user?.role === 'admin';

  if (!isAdmin && callerId !== ownerId) {
    // Deliberately identical to the not-found message so a caller cannot probe
    // for the existence of other students' sessions.
    return { error: 'Proctoring session not found.', status: 404 };
  }

  return { session };
};

// Private helper to calculate session risk score based on violations count & severity
const calculateRiskScore = (violationsByType) => {
  let score = 0;
  
  // Convert map or object to iterate
  const violations = violationsByType instanceof Map ? Object.fromEntries(violationsByType) : violationsByType;
  
  if (!violations) return 0;

  // Weights live in config/proctoringPolicy so the gate, the analytics pass
  // and this function can never disagree about what a signal is worth.
  const weights = RISK_WEIGHTS || {
    tab_switch: 15,
    minimize: 15,
    fullscreen_exit: 20,
    face_absent: 15,
    student_absent_extended: 40,  // Away a full minute — flags on its own
    multiple_faces: 25,
    face_mismatch: 30,      // High risk — different person
    face_covered: 10,       // Low risk — obstruction
    attention_check_fail: 35,
    inactivity: 10,
    face_registered: 0,     // Info event — no risk contribution
    identity_verified: 0,   // Info event — no risk contribution
    heartbeat: 0,           // Info event — no risk contribution
    gaze_away: 10,
    eyes_closed: 15,
    voice_detected: 25,
    prolonged_silence: 10,
    proctoring_offline: 30  // High — the client stopped reporting mid-exam
  };
  
  Object.keys(violations).forEach(type => {
    const count = violations[type] || 0;
    // `?? 10`, not `|| 10`: the info-only events are deliberately weighted 0,
    // and `0 || 10` would silently score them at 10 apiece.
    const weight = weights[type] ?? 10;
    score += count * weight;
  });
  
  // Cap risk score at 100
  return Math.min(score, 100);
};

/**
 * Decide what should happen to this session, server-side.
 *
 * This is the heart of the fix: the browser used to compare the violation
 * count against its own MAX_WARNINGS and then call /lock on itself, so a
 * candidate who blocked that single request could never be held. The decision
 * now happens here, where the candidate cannot reach it.
 */
const applyServerDecision = (session) => {
  // FLAG-ONLY MODE: never interrupt a live assessment. Flags accumulate and
  // the whole session is judged once, at submit, by the gate. The candidate
  // finishes uninterrupted no matter what is recorded here.
  if (FLAG_ONLY_MODE) {
    if (session.riskScore >= RISK_FLAG_THRESHOLD && session.status === 'active') {
      session.status = 'flagged';
    }
    return;
  }

  const overWarningBudget = session.totalViolations > MAX_WARNINGS;
  const overRiskBudget = session.riskScore >= RISK_LOCK_THRESHOLD;

  if (overWarningBudget || overRiskBudget) {
    session.isLocked = true;
    session.status = 'locked';
    if (!session.lockReason) {
      session.lockReason = overRiskBudget
        ? `Risk score ${session.riskScore} reached the automatic review threshold.`
        : `Exceeded the ${MAX_WARNINGS}-warning limit.`;
    }
    return;
  }

  if (session.riskScore >= RISK_FLAG_THRESHOLD && session.status === 'active') {
    session.status = 'flagged';
  }
};

/**
 * The client-facing contract. The browser renders a tier; it never derives one.
 * Tiers mirror the escalation ladder:
 *   ok    — nothing recorded
 *   warn  — recorded warning, exam stays usable (non-blocking banner)
 *   pause — warning budget reached, blocking card + timer paused
 *   held  — submitted for review, score withheld pending a human decision
 */
const buildDecision = (session) => {
  let tier = 'ok';
  if (session.isLocked) tier = 'held';
  else if (session.totalViolations >= MAX_WARNINGS) tier = 'pause';
  else if (session.totalViolations > 0) tier = 'warn';

  // In flag-only mode the client must never block. The pill and banner still
  // colour-code so a candidate can self-correct — that is coaching, not
  // punishment — but 'pause' and 'held' are downgraded so nothing interrupts.
  if (FLAG_ONLY_MODE && (tier === 'pause' || tier === 'held')) {
    tier = 'warn';
  }

  return {
    tier,
    warnings: session.totalViolations,
    maxWarnings: MAX_WARNINGS,
    riskScore: session.riskScore,
    status: session.status,
    held: !!session.isLocked,
    reason: session.lockReason || '',
    ticketId: session.activeTicketId || null
  };
};

// Snapshot filenames are minted by multer as proctor-<sessionId>-<ts>-<rand>.<ext>
const SNAPSHOT_ID_RE = /^proctor-[0-9a-f]{24}-\d+-\d+\.(jpg|jpeg|png|webp)$/i;

/**
 * Map an uploaded snapshot id to a URL, proving it belongs to this session.
 *
 * SECURITY: screenshotUrl used to be whatever string the client sent, so
 * evidence could be forged or pointed at another candidate's image. The id
 * must match the strict filename pattern (which also rules out traversal)
 * AND carry this session's own id.
 */
const resolveSnapshotUrl = (snapshotId, sessionId) => {
  if (!snapshotId || typeof snapshotId !== 'string') return '';
  if (!SNAPSHOT_ID_RE.test(snapshotId)) return '';
  if (!snapshotId.startsWith(`proctor-${String(sessionId)}-`)) return '';
  // Served through an authenticated route, not the public static mount.
  return `/api/proctoring/snapshot/${snapshotId}`;
};

/**
 * Raise the IT support ticket that accompanies a held session. Shared by the
 * automatic server decision and the explicit /lock route so a session can
 * never end up held without a ticket, or with two.
 */
const raiseLockTicket = async (session) => {
  const SupportTicket = require('../models/SupportTicket');
  const User = require('../models/User');

  const user = await User.findById(session.userId);

  const newTicket = new SupportTicket({
    userId: session.userId,
    userModel: 'Student',
    title: 'Assessment held for review: proctoring violation',
    description:
      `The assessment session ${session.assessmentId} for ${user?.fullName || session.userId} ` +
      `was held for review by the proctoring system.\n` +
      `Reason: ${session.lockReason}\n` +
      `Violations: ${session.totalViolations}\n` +
      `Risk score: ${session.riskScore}`,
    category: 'course & assessment',
    priority: 'high',
    status: 'open'
  });

  await newTicket.save();
  session.activeTicketId = newTicket._id;
  return newTicket;
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

    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) {
      return res.status(status).json({ success: false, error });
    }

    // A session the server has already held is terminal — stop accepting events
    // for it rather than letting the counters keep climbing.
    if (session.isLocked) {
      return res.status(409).json({
        success: false,
        error: 'This session is already held for review.',
        proctoring: buildDecision(session)
      });
    }

    // SECURITY: the evidence URL is derived from the upload, never taken from
    // the request body. A client could otherwise attach any string — including
    // another candidate's snapshot — as its own evidence.
    const verifiedScreenshotUrl = resolveSnapshotUrl(req.body.snapshotId, sessionId);

    // Create the event log
    const event = new ProctoringEvent({
      sessionId,
      userId,
      eventType,
      severity: severity || 'low',
      details: details || '',
      screenshotUrl: verifiedScreenshotUrl
    });

    await event.save();

    if (INFO_ONLY_EVENTS.includes(eventType)) {
      if (eventType === 'face_registered') {
        session.faceRegistered = true;
        session.faceRegisteredAt = new Date();

        // Persist the reference embedding SERVER-side. It previously lived
        // only in React state, so the backend had no way to know whether the
        // registered candidate actually sat the exam — faceRegistered was set
        // purely from a client-sent event type. Validated strictly: face-api
        // descriptors are exactly 128 finite floats.
        const d = req.body.descriptor;
        if (
          Array.isArray(d) &&
          d.length === 128 &&
          d.every((n) => typeof n === 'number' && Number.isFinite(n))
        ) {
          session.referenceDescriptor = d;
        } else if (d !== undefined) {
          console.warn(`[Proctoring] Rejected malformed descriptor on session ${session._id}`);
        }
      }
      if (eventType === 'identity_verified') {
        session.identityVerified = true;
        session.identityVerifiedAt = new Date();
      }
      if (eventType === 'heartbeat') {
        session.heartbeat = session.heartbeat || {};
        session.heartbeat.lastAt = new Date();
        session.heartbeat.sequence = (session.heartbeat.sequence || 0) + 1;
      }
    } else {
      // Increment violation counts on session
      session.totalViolations += 1;

      // Update map counters
      const currentCount = session.violationsByType.get(eventType) || 0;
      session.violationsByType.set(eventType, currentCount + 1);

      // Re-calculate risk score
      session.riskScore = calculateRiskScore(session.violationsByType);
    }

    // ── The server decides. The browser is only told the outcome. ───────────
    // Previously the client compared the count to its own MAX_WARNINGS and
    // called /lock on itself, so blocking one request made a candidate
    // permanently un-lockable. That decision now lives here.
    applyServerDecision(session);

    if (session.isLocked && !session.activeTicketId) {
      // Hold the attempt for a human and raise the support ticket exactly once.
      await raiseLockTicket(session);
    }

    await session.save();

    res.status(201).json({
      success: true,
      data: event,
      proctoring: buildDecision(session),
      // Retained for older clients still reading sessionStatus.
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

    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) {
      return res.status(status).json({ success: false, error });
    }

    session.completedAt = new Date();

    // A held session stays held — completing the attempt must never clear it.
    if (session.status === 'active') {
      session.status = session.riskScore >= RISK_FLAG_THRESHOLD ? 'flagged' : 'completed';
    }

    await session.save();

    res.json({
      success: true,
      data: session,
      proctoring: buildDecision(session)
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

    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) {
      // Don't leave an orphaned file behind if the caller isn't entitled to it.
      fs.unlink(req.file.path, () => {});
      return res.status(status).json({ success: false, error });
    }

    // Hand back an opaque id, not a public path. The client passes this id to
    // /event and the server resolves it to a URL after verifying it belongs to
    // this session — the client never dictates the stored evidence URL.
    res.json({
      success: true,
      snapshotId: req.file.filename,
      screenshotUrl: resolveSnapshotUrl(req.file.filename, session._id)
    });
  } catch (err) {
    console.error('Error uploading proctoring snapshot:', err);
    res.status(500).json({ success: false, error: 'Server error uploading snapshot', message: err.message });
  }
};

/**
 * Serve a proctoring snapshot to its owner or an admin.
 *
 * PRIVACY: these are webcam stills of identifiable candidates. They used to sit
 * under a public express.static mount (and again at the site root), so anyone
 * who guessed a filename could read them. Access is now proven per request.
 */
exports.serveSnapshot = async (req, res) => {
  try {
    const { filename } = req.params;

    // The pattern also rules out traversal — no slashes or dots can survive it.
    if (!SNAPSHOT_ID_RE.test(filename || '')) {
      return res.status(400).json({ success: false, error: 'Invalid snapshot id.' });
    }

    const ownerSessionId = filename.split('-')[1];
    const { error, status } = await loadOwnedSession(ownerSessionId, req.user);
    if (error) {
      return res.status(status).json({ success: false, error });
    }

    const filePath = path.join(__dirname, '../uploads/proctoring', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Snapshot not found.' });
    }

    res.setHeader('Cache-Control', 'private, no-store');
    return res.sendFile(filePath);
  } catch (err) {
    console.error('Error serving proctoring snapshot:', err);
    res.status(500).json({ success: false, error: 'Server error serving snapshot' });
  }
};

/**
 * Liveness ping from the exam client.
 *
 * This is what closes the "go offline and the record stays clean" hole. The
 * client pings every HEARTBEAT_INTERVAL; the server measures the gap since the
 * last ping and records a violation when contact lapses. A candidate cannot
 * suppress it by blocking requests, because the signal IS the missing request.
 *
 * Deliberately not routed through logEvent: at one ping per 10s that would
 * write hundreds of event documents per attempt.
 */
exports.heartbeat = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) {
      return res.status(status).json({ success: false, error });
    }

    if (session.isLocked) {
      return res.status(409).json({
        success: false,
        error: 'This session is already held for review.',
        proctoring: buildDecision(session)
      });
    }

    const now = new Date();
    const previous = session.heartbeat?.lastAt;
    const gapMs = previous ? now - new Date(previous) : 0;

    session.heartbeat = session.heartbeat || {};
    session.heartbeat.lastAt = now;
    session.heartbeat.sequence = (session.heartbeat.sequence || 0) + 1;

    // A lapse in contact is itself a recorded violation.
    if (gapMs > HEARTBEAT_GAP_MS) {
      const gapSeconds = Math.round(gapMs / 1000);
      session.heartbeat.missedCount = (session.heartbeat.missedCount || 0) + 1;

      await new ProctoringEvent({
        sessionId: session._id,
        userId: session.userId,
        eventType: 'proctoring_offline',
        severity: 'high',
        details: `No contact from the exam client for ${gapSeconds}s.`
      }).save();

      session.totalViolations += 1;
      const current = session.violationsByType.get('proctoring_offline') || 0;
      session.violationsByType.set('proctoring_offline', current + 1);
      session.riskScore = calculateRiskScore(session.violationsByType);

      applyServerDecision(session);
      if (session.isLocked && !session.activeTicketId) {
        await raiseLockTicket(session);
      }
    }

    await session.save();

    res.json({
      success: true,
      serverTime: now.toISOString(),
      proctoring: buildDecision(session)
    });
  } catch (err) {
    console.error('Error recording proctoring heartbeat:', err);
    res.status(500).json({ success: false, error: 'Server error recording heartbeat' });
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
      return res.status(404).json({ success: false, error: 'Proctoring session not found.' });
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
    
    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) {
      return res.status(status).json({ success: false, error });
    }

    if (session.isLocked) {
      return res.json({
        success: true,
        isLocked: true,
        activeTicketId: session.activeTicketId,
        proctoring: buildDecision(session)
      });
    }

    // NOTE: since logEvent now applies the server decision, this route is a
    // fallback (and an admin tool) rather than the primary path. The reason is
    // still re-derived server-side for students so a candidate cannot write
    // arbitrary text into their own audit trail.
    const isAdmin = req.user && req.user.role === 'admin';
    session.isLocked = true;
    session.status = 'locked';
    session.lockReason = (isAdmin && lockReason)
      ? lockReason
      : `Held after ${session.totalViolations} recorded warnings (risk ${session.riskScore}).`;

    const ticket = await raiseLockTicket(session);
    await session.save();

    res.json({
      success: true,
      data: session,
      ticketId: ticket.ticketId,
      proctoring: buildDecision(session)
    });
  } catch (err) {
    console.error('Error locking proctoring session:', err);
    res.status(500).json({ success: false, error: 'Server error locking session', message: err.message });
  }
};

// Webhook to receive unlock signal from Admin and emit socket event
exports.webhookUnlock = async (req, res) => {
  try {
    const { ticketId, userId, sessionId, decision = 'released', note, decidedBy } = req.body;

    if (!['released', 'invalidated', 'retake'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: "decision must be 'released', 'invalidated' or 'retake'."
      });
    }

    // Clear the hold. This previously only sent a notification, so a student
    // told "you may now resume" still hit the lock on the next start.
    let session = null;
    if (sessionId) {
      session = await ProctoringSession.findById(sessionId);
    } else if (ticketId) {
      session = await ProctoringSession.findOne({ activeTicketId: ticketId });
    }

    if (!session) {
      return res.status(404).json({ success: false, error: 'No matching proctoring session.' });
    }

    session.isLocked = false;
    session.status = decision === 'released' ? 'completed' : 'flagged';
    session.lockReason = undefined;
    session.activeTicketId = undefined;
    session.decision = {
      state: decision,
      decidedBy: decidedBy || undefined,
      decidedAt: new Date(),
      note: note || ''
    };
    await session.save();

    // ── Release the SCORE, not just the session ────────────────────────────
    // The submit gate parks a held attempt at pending_review with
    // scoreReleased false. Without this the student stays held forever even
    // after the ticket is closed — the hold had no exit.
    const Result = require('../models/Result');
    const result = await Result.findOne({
      $or: [
        { proctoringSessionId: session._id },
        { _id: session.resultId }
      ],
      completionStatus: 'pending_review'
    });

    if (result) {
      if (decision === 'released') {
        result.completionStatus = 'completed';
        result.scoreReleased = true;
      } else {
        // Invalidated or retake: the attempt does not count. 'abandoned' frees
        // the student to start a fresh attempt under the existing start flow.
        result.completionStatus = 'abandoned';
        result.scoreReleased = false;
      }
      result.review = {
        ...(result.review || {}),
        state: decision,
        decidedBy: decidedBy || undefined,
        decidedAt: new Date(),
        note: note || ''
      };
      await result.save();
      console.log(`✅ Result ${result._id} ${decision} by review (session ${session._id})`);
    }

    const COPY = {
      released: {
        title: 'Your assessment result is ready',
        message: 'Your assessment has been reviewed and your score has been released. You can view it in your dashboard.'
      },
      invalidated: {
        title: 'Assessment review complete',
        message: 'Your assessment has been reviewed. Please contact support if you have any questions.'
      },
      retake: {
        title: 'You can retake your assessment',
        message: 'Your assessment has been reviewed and you may now take it again.'
      }
    };

    const notifyUserId = userId || session.userId;
    if (notifyUserId) {
      const Notification = require('../models/Notification');
      await Notification.createNotification({
        userId: notifyUserId,
        title: COPY[decision].title,
        message: COPY[decision].message,
        type: 'system',
        metadata: { ticketId, decision, action: 'assessment_reviewed' }
      });
    }

    res.status(200).json({
      success: true,
      decision,
      sessionUnlocked: true,
      resultUpdated: !!result
    });
  } catch (err) {
    console.error('Webhook unlock error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Exposed for unit tests. These are pure decision helpers with no I/O, and
// they encode the rules that matter most, so they are worth asserting on.
exports._internals = {
  calculateRiskScore,
  applyServerDecision,
  buildDecision,
  resolveSnapshotUrl
};
