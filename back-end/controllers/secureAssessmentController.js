/**
 * Secure assessment (Safe Exam Browser) flow.
 *
 *   1. secureStatus     — does this assessment run in secure mode for me?
 *   2. createLaunch     — mint a launch token, build the .seb settings, return
 *                         the sebs:// link the browser hands to SEB.
 *   3. downloadSebConfig— SEB fetches the .seb file (no cookie: authorised by
 *                         the launch token in the query string).
 *   4. exchangeLaunch   — the app, now running inside SEB, swaps the launch
 *                         token for a signed-in session. Only accepted when the
 *                         request itself proves it came from SEB (sebGuard).
 *   5. pilotAssessment  — the Secure Pilot card for allow-listed students.
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Assessment = require('../models/Assessment');
const SecureLaunchToken = require('../models/SecureLaunchToken');
const { getStageByCode } = require('../config/stageConfigLoader');
const { isSecureFor, verifySebRequest } = require('../middleware/sebGuard');
const seb = require('../services/sebConfig');

const SECURE_PILOT_CODE = 'ASM00009';
const LAUNCH_TTL_MS = 15 * 60 * 1000;
const LAUNCH_PURGE_MS = 8 * 60 * 60 * 1000;
const SESSION_DURATION_MS = 3 * 60 * 60 * 1000;

const hashToken = (raw) => crypto.createHash('sha256').update(String(raw)).digest('hex');
const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ''));

const userIdOf = (user) => String(user?._id || user?.id || '');

const modelForUserType = (userType) => {
  if (userType === 'student' || userType === 'registration') return require('../models/Student');
  if (userType === 'teacher') return require('../models/Teacher');
  return require('../models/User');
};

const publicSecureSummary = (assessment, user) => {
  const secure = assessment.secure || {};
  const active = isSecureFor(assessment, user);
  return {
    assessmentId: assessment._id,
    assessmentCode: assessment.assessmentCode,
    secure: active,
    sebRequired: active && secure.requireSeb !== false,
    screenCaptureRequired: !!(secure.enabled && secure.requireScreenCapture !== false) &&
      (active || (Array.isArray(secure.pilotUserIds) && secure.pilotUserIds.length === 0)),
    screenshotIntervalSec: secure.screenshotIntervalSec || 30,
    retentionDays: secure.retentionDays || 90,
    pilot: Array.isArray(secure.pilotUserIds) && secure.pilotUserIds.length > 0,
    downloads: seb.SEB_DOWNLOADS
  };
};

// GET /api/assessments/code/:code/secure-status
exports.secureStatus = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ assessmentCode: req.params.code })
      .select('assessmentCode assessmentName secure').lean();
    if (!assessment) {
      return res.json({ success: true, data: { assessmentCode: req.params.code, secure: false, sebRequired: false, screenCaptureRequired: false } });
    }
    return res.json({ success: true, data: publicSecureSummary(assessment, req.user) });
  } catch (err) {
    console.error('[secure] status error:', err);
    return res.status(500).json({ success: false, error: 'Could not read secure status.' });
  }
};

// GET /api/assessments/secure/pilot
exports.pilotAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ assessmentCode: SECURE_PILOT_CODE })
      .select('assessmentCode assessmentName description secure status questions duration').lean();
    if (!assessment || !assessment.secure?.enabled || assessment.status !== 'active') {
      return res.json({ success: true, data: { available: false } });
    }
    const allowed = isSecureFor(assessment, req.user) || req.user?.role === 'admin';
    if (!allowed) return res.json({ success: true, data: { available: false } });

    const stageInfo = getStageByCode(assessment.assessmentCode);
    return res.json({
      success: true,
      data: {
        available: true,
        stage: stageInfo?.stage || 'SP',
        assessmentId: assessment._id,
        assessmentCode: assessment.assessmentCode,
        assessmentName: assessment.assessmentName,
        description: assessment.description,
        totalQuestions: stageInfo?.totalQuestions || assessment.questions?.length || 0,
        durationMinutes: 40,
        maxAttempts: stageInfo?.maxAttempts || 3,
        secure: publicSecureSummary(assessment, req.user)
      }
    });
  } catch (err) {
    console.error('[secure] pilot error:', err);
    return res.status(500).json({ success: false, error: 'Could not load the secure pilot.' });
  }
};

/**
 * POST /api/assessments/:id/secure/launch
 * Body: { platform?: string }
 */
exports.createLaunch = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ success: false, error: 'Invalid assessment id.' });

    const assessment = await Assessment.findById(id).select('+secure.quitPassword assessmentCode assessmentName secure');
    if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found.' });
    if (!isSecureFor(assessment, req.user)) {
      return res.status(400).json({ success: false, code: 'NOT_SECURE', error: 'This assessment does not use Safe Exam Browser.' });
    }

    const userId = userIdOf(req.user);
    const stageInfo = getStageByCode(assessment.assessmentCode);
    const stage = stageInfo?.stage || 'T2';
    const rawToken = crypto.randomBytes(32).toString('hex');

    const appOrigin = seb.publicAppOrigin(req);
    const api = seb.apiOrigin(req);
    const configUrl = `${api}/api/assessments/${assessment._id}/seb-config?lt=${rawToken}`;
    const startUrl = `${appOrigin}/secure/enter?lt=${rawToken}&stage=${encodeURIComponent(stage)}`;
    const quitUrl = `${appOrigin}/secure/exit`;

    const allowedHosts = [appOrigin, api, ...(assessment.secure.allowedUrls || [])];
    const settings = seb.buildSebSettings({
      assessment,
      startUrl,
      quitUrl,
      allowedHosts,
      quitPassword: assessment.secure.quitPassword || ''
    });
    const configKey = seb.computeConfigKey(settings);

    const now = Date.now();
    await SecureLaunchToken.create({
      tokenHash: hashToken(rawToken),
      userId,
      userType: req.user.userType || 'student',
      assessmentId: assessment._id,
      stage,
      sessionId: req.user.currentSessionId || '',
      configKey,
      settings,
      expiresAt: new Date(now + LAUNCH_TTL_MS),
      purgeAt: new Date(now + LAUNCH_PURGE_MS)
    });

    return res.status(201).json({
      success: true,
      data: {
        stage,
        assessmentId: assessment._id,
        sebsUrl: seb.toSebsUrl(configUrl),
        configUrl,
        expiresAt: new Date(now + LAUNCH_TTL_MS),
        downloads: seb.SEB_DOWNLOADS,
        // Shown on the launch screen so a pilot tester can compare it with
        // the Config Key the SEB Config Tool displays for the same file.
        configKey
      }
    });
  } catch (err) {
    console.error('[secure] launch error:', err);
    return res.status(500).json({ success: false, error: 'Could not prepare the Safe Exam Browser launch.' });
  }
};

/**
 * GET /api/assessments/:id/seb-config?lt=TOKEN
 * Public: SEB downloads this with no cookie. The token is the credential.
 */
exports.downloadSebConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const raw = String(req.query.lt || '');
    if (!isObjectId(id) || !/^[0-9a-f]{64}$/.test(raw)) {
      return res.status(400).json({ success: false, error: 'Invalid launch link.' });
    }
    const launch = await SecureLaunchToken.findOne({ tokenHash: hashToken(raw), assessmentId: id });
    if (!launch) return res.status(404).json({ success: false, error: 'Launch link not found. Start again from the assessment centre.' });
    if (launch.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, code: 'LAUNCH_EXPIRED', error: 'This launch link has expired. Start again from the assessment centre.' });
    }

    if (!launch.configFetchedAt) {
      launch.configFetchedAt = new Date();
      await launch.save();
    }

    const file = seb.serializeSebFile(launch.settings);
    res.setHeader('Content-Type', 'application/seb');
    res.setHeader('Content-Disposition', `attachment; filename="SMAART-${launch.stage || 'secure'}.seb"`);
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(file);
  } catch (err) {
    console.error('[secure] seb-config error:', err);
    return res.status(500).json({ success: false, error: 'Could not build the Safe Exam Browser file.' });
  }
};

/**
 * POST /api/assessments/secure/exchange   Body: { lt }
 * Public: runs inside SEB before the app has a session. Must carry SEB's
 * Config Key hash (or the JS-API key) for the launch it names.
 */
exports.exchangeLaunch = async (req, res) => {
  try {
    const raw = String(req.body?.lt || '');
    if (!/^[0-9a-f]{64}$/.test(raw)) return res.status(400).json({ success: false, error: 'Invalid launch token.' });

    const launch = await SecureLaunchToken.findOne({ tokenHash: hashToken(raw) });
    if (!launch) return res.status(404).json({ success: false, code: 'LAUNCH_NOT_FOUND', error: 'Launch not found. Start again from the assessment centre.' });
    if (launch.expiresAt.getTime() < Date.now()) {
      return res.status(410).json({ success: false, code: 'LAUNCH_EXPIRED', error: 'This launch has expired. Close Safe Exam Browser and start again from the assessment centre.' });
    }

    // The request must prove it came from SEB running this launch's file.
    const verdict = await verifySebRequest(req, launch.userId, launch.assessmentId);
    const enforcement = (process.env.SEB_KEY_ENFORCEMENT || 'strict').toLowerCase();
    if (!verdict.ok && enforcement !== 'log') {
      return res.status(403).json({
        success: false,
        code: verdict.reason === 'mismatch' ? 'SEB_KEY_MISMATCH' : 'SEB_REQUIRED',
        sebRequired: true,
        error: 'This page only works inside Safe Exam Browser launched from the assessment centre.'
      });
    }
    if (!verdict.ok) console.warn(`[secure] exchange ${verdict.reason} for launch ${launch._id} (logging only)`);

    const UserModel = modelForUserType(launch.userType);
    const user = await UserModel.findById(launch.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'Account not found.' });

    // Keep the student's existing single session where possible so the
    // normal browser is not logged out; otherwise start one.
    let sessionId = user.currentSessionId || launch.sessionId;
    if (!sessionId) sessionId = crypto.randomUUID();
    const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    await UserModel.updateOne({ _id: user._id }, { $set: { currentSessionId: sessionId, sessionExpiresAt } });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.userType || launch.userType,
        role: user.role || user.userType || 'student',
        sessionId
      },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    launch.exchangedAt = new Date();
    await launch.save();

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_DURATION_MS
    });

    const assessment = await Assessment.findById(launch.assessmentId).select('assessmentCode assessmentName secure').lean();
    const plainUser = user.toObject ? user.toObject() : user;
    if (plainUser && plainUser._id && !plainUser.id) plainUser.id = plainUser._id;

    return res.json({
      success: true,
      token,
      user: plainUser,
      sessionId,
      sessionExpiresAt,
      stage: launch.stage,
      assessmentId: launch.assessmentId,
      assessmentCode: assessment?.assessmentCode || '',
      sebVerified: verdict.ok,
      sebVerification: verdict.method,
      secure: assessment ? publicSecureSummary(assessment, plainUser) : null
    });
  } catch (err) {
    console.error('[secure] exchange error:', err);
    return res.status(500).json({ success: false, error: 'Could not sign you in inside Safe Exam Browser.' });
  }
};

exports.SECURE_PILOT_CODE = SECURE_PILOT_CODE;
