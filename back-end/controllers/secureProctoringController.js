/**
 * Secure-mode proctoring: screen evidence upload, evidence retrieval for the
 * admin console, and the reviewer's decision on a held attempt.
 */

const ProctoringSession = require('../models/ProctoringSession');
const ProctoringEvent = require('../models/ProctoringEvent');
const Assessment = require('../models/Assessment');
const Result = require('../models/Result');
const mediaStore = require('../services/secureMediaStore');

const FRAME_MAX_BYTES = 2 * 1024 * 1024;
const CLIP_MAX_BYTES = 20 * 1024 * 1024;
const MAX_CLIPS_PER_SESSION = 40;
const MAX_FRAMES_PER_SESSION = 600; // 40 min at 30 s is 80; leaves room for long tests

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ''));

const loadOwnedSession = async (sessionId, user) => {
  if (!isObjectId(sessionId)) return { error: 'Invalid session id.', status: 400 };
  const session = await ProctoringSession.findById(sessionId);
  if (!session) return { error: 'Proctoring session not found.', status: 404 };
  const callerId = String(user?._id || user?.id || '');
  if (user?.role !== 'admin' && callerId !== String(session.userId)) {
    return { error: 'Proctoring session not found.', status: 404 };
  }
  return { session };
};

/**
 * POST /api/proctoring/session/:sessionId/screen
 * multipart: media (image/jpeg|png|webp or video/webm|mp4)
 * fields:    kind = frame | clip, reason = violation type that triggered it
 */
exports.uploadScreen = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { session, error, status } = await loadOwnedSession(sessionId, req.user);
    if (error) return res.status(status).json({ success: false, error });

    if (!req.file) return res.status(400).json({ success: false, error: 'No media uploaded.' });
    const kind = req.body?.kind === 'clip' ? 'clip' : 'frame';
    const reason = String(req.body?.reason || '').slice(0, 64);
    const mime = req.file.mimetype;
    const isImage = /^image\/(jpeg|png|webp)$/.test(mime);
    const isVideo = /^video\/(webm|mp4)$/.test(mime);

    if (kind === 'frame' && !isImage) return res.status(415).json({ success: false, error: 'Frames must be JPEG, PNG or WebP.' });
    if (kind === 'clip' && !isVideo) return res.status(415).json({ success: false, error: 'Clips must be WebM or MP4.' });
    if (kind === 'frame' && req.file.size > FRAME_MAX_BYTES) return res.status(413).json({ success: false, error: 'Frame too large.' });
    if (kind === 'clip' && req.file.size > CLIP_MAX_BYTES) return res.status(413).json({ success: false, error: 'Clip too large.' });

    session.secure = session.secure || {};
    const capture = session.secure.screenCapture || {};

    if (kind === 'clip' && (capture.clips || 0) >= MAX_CLIPS_PER_SESSION) {
      return res.status(429).json({ success: false, error: 'Clip limit reached for this session.' });
    }
    if (kind === 'frame' && (capture.frames || 0) >= MAX_FRAMES_PER_SESSION) {
      return res.status(429).json({ success: false, error: 'Frame limit reached for this session.' });
    }

    // Periodic frames may not arrive faster than the configured interval
    // (minus a little slack for timer drift). Frames tied to a violation are
    // exempt because they are triggered by events, not the clock.
    if (kind === 'frame' && !reason && capture.lastFrameAt) {
      const assessment = await Assessment.findById(session.assessmentId).select('secure').lean();
      const intervalSec = assessment?.secure?.screenshotIntervalSec || 30;
      const minGapMs = Math.max(5, intervalSec - 5) * 1000;
      if (Date.now() - new Date(capture.lastFrameAt).getTime() < minGapMs) {
        return res.status(429).json({ success: false, error: 'Frame arrived too soon.' });
      }
    }

    const stored = await mediaStore.save(session._id, kind, req.file.buffer, mime);

    const event = await new ProctoringEvent({
      sessionId: session._id,
      userId: session.userId,
      eventType: kind === 'clip' ? 'screen_clip' : 'screen_capture',
      severity: 'info',
      details: reason ? `Screen ${kind} captured after ${reason}` : `Periodic screen ${kind}`,
      mediaUrl: stored.url,
      mediaType: mime
    }).save();

    if (kind === 'clip') capture.clips = (capture.clips || 0) + 1;
    else {
      capture.frames = (capture.frames || 0) + 1;
      if (!reason) capture.lastFrameAt = new Date();
    }
    capture.granted = true;
    session.secure.screenCapture = capture;
    session.markModified('secure');
    await session.save();

    return res.status(201).json({ success: true, url: stored.url, eventId: event._id, frames: capture.frames, clips: capture.clips });
  } catch (err) {
    console.error('[secure] screen upload error:', err);
    return res.status(500).json({ success: false, error: 'Could not store the screen capture.' });
  }
};

/** GET /api/proctoring/screen/:sessionId/:filename  (admin) */
exports.serveScreenMedia = async (req, res) => {
  const abs = mediaStore.resolve(req.params.sessionId, req.params.filename);
  if (!abs) return res.status(404).json({ success: false, error: 'Capture not found.' });
  res.setHeader('Cache-Control', 'private, no-store');
  return res.sendFile(abs);
};

/** GET /api/proctoring/admin/session/:sessionId/evidence  (admin) */
exports.listEvidence = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!isObjectId(sessionId)) return res.status(400).json({ success: false, error: 'Invalid session id.' });
    const session = await ProctoringSession.findById(sessionId).select('secure userId assessmentId status decision riskScore totalViolations startedAt completedAt').lean();
    if (!session) return res.status(404).json({ success: false, error: 'Proctoring session not found.' });

    const events = await ProctoringEvent.find({ sessionId, mediaUrl: { $exists: true, $ne: '' } })
      .sort({ timestamp: 1 })
      .select('eventType severity timestamp details mediaUrl mediaType')
      .lean();
    const storage = await mediaStore.stats(sessionId);

    return res.json({ success: true, data: { session, evidence: events, storage } });
  } catch (err) {
    console.error('[secure] evidence error:', err);
    return res.status(500).json({ success: false, error: 'Could not load evidence.' });
  }
};

/**
 * POST /api/proctoring/admin/session/:sessionId/decision   (admin)
 * Body: { decision: 'clear' | 'uphold', note?: string }
 *
 * clear  — the reviewer is satisfied. The session is released and a held
 *          attempt is graded through the normal submit path (the gate treats
 *          a released session as verified), so stage results, badges and
 *          certificates are issued exactly as for a clean attempt.
 * uphold — the flags stand. The attempt stays unscored and is marked
 *          invalidated; the student keeps their remaining retries.
 */
exports.reviewDecision = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const decision = String(req.body?.decision || '').toLowerCase();
    const note = String(req.body?.note || '').slice(0, 2000);
    if (!isObjectId(sessionId)) return res.status(400).json({ success: false, error: 'Invalid session id.' });
    if (!['clear', 'uphold'].includes(decision)) return res.status(400).json({ success: false, error: "decision must be 'clear' or 'uphold'." });

    const session = await ProctoringSession.findById(sessionId);
    if (!session) return res.status(404).json({ success: false, error: 'Proctoring session not found.' });

    const reviewerId = req.user?._id || req.user?.id;
    const decidedAt = new Date();
    const result = session.resultId ? await Result.findById(session.resultId) : null;

    if (decision === 'uphold') {
      session.decision = { state: 'invalidated', decidedBy: reviewerId, decidedAt, note };
      session.isLocked = false;
      session.status = 'flagged';
      await session.save();
      if (result) {
        result.review = { ...(result.review?.toObject?.() || result.review || {}), state: 'invalidated', decidedBy: reviewerId, decidedAt, note };
        result.scoreReleased = false;
        await result.save();
      }
      return res.json({ success: true, data: { decision: 'invalidated', sessionId: session._id, resultId: result?._id || null } });
    }

    // clear
    session.decision = { state: 'released', decidedBy: reviewerId, decidedAt, note };
    session.isLocked = false;
    session.status = 'completed';
    await session.save();

    let graded = false;
    let gradeResponse = null;
    if (result && result.completionStatus === 'pending_review') {
      result.review = { ...(result.review?.toObject?.() || result.review || {}), state: 'released', decidedBy: reviewerId, decidedAt, note };
      result.completionStatus = 'in-progress';
      await result.save();

      const StudentModel = require('../models/Student');
      const student = await StudentModel.findById(result.userId).select('-password');
      const resultController = require('./resultController');

      const fakeRes = {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.body = payload; return this; }
      };
      await resultController.submitAssessment({
        params: { resultId: String(result._id) },
        body: { submissionReason: result.submissionReason || 'manual', completeMissingAnswers: true },
        user: student || { _id: result.userId, id: String(result.userId) },
        headers: {},
        reviewRelease: true
      }, fakeRes);
      graded = fakeRes.statusCode < 400 && !!fakeRes.body?.success;
      gradeResponse = fakeRes.body;
      if (!graded) {
        // Put the attempt back the way it was so nothing is half-done.
        await Result.findByIdAndUpdate(result._id, { completionStatus: 'pending_review' });
      }
    } else if (result) {
      result.review = { ...(result.review?.toObject?.() || result.review || {}), state: 'released', decidedBy: reviewerId, decidedAt, note };
      result.scoreReleased = true;
      await result.save();
    }

    return res.json({
      success: true,
      data: { decision: 'released', sessionId: session._id, resultId: result?._id || null, graded, grade: gradeResponse }
    });
  } catch (err) {
    console.error('[secure] decision error:', err);
    return res.status(500).json({ success: false, error: 'Could not record the decision.' });
  }
};

exports.limits = { FRAME_MAX_BYTES, CLIP_MAX_BYTES, MAX_CLIPS_PER_SESSION, MAX_FRAMES_PER_SESSION };
