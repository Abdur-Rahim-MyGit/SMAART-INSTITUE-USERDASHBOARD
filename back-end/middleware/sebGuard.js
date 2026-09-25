/**
 * sebGuard — proves that a request for a secure assessment came from Safe
 * Exam Browser running the .seb file we issued.
 *
 * SEB sends X-SafeExamBrowser-ConfigKeyHash = SHA-256(url + configKey) with
 * every request. We know the Config Key of every recent launch for this
 * student (models/SecureLaunchToken), so we recompute the hash for the URL
 * that was just requested and compare.
 *
 * Fallback: the app running inside SEB may also read the Config Key from
 * SEB's JavaScript API and send it as X-SEB-Config-Key. It is accepted only
 * when it equals a key we issued to this student.
 *
 * SEB_KEY_ENFORCEMENT=log turns a failed check into a logged warning instead
 * of a 403 — useful for the first pilot run when comparing keys.
 *
 * Non-secure assessments pass straight through, so every existing flow is
 * unchanged.
 */

const SecureLaunchToken = require('../models/SecureLaunchToken');
const { expectedRequestHash, absoluteRequestUrl } = require('../services/sebConfig');

const LOOKBACK_MS = 6 * 60 * 60 * 1000;

const userIdOf = (req) => String(req.user?._id || req.user?.id || '');

/** Is this assessment in secure mode for this user? */
const isSecureFor = (assessment, user) => {
  const secure = assessment?.secure;
  if (!secure || !secure.enabled || secure.requireSeb === false) return false;
  const pilot = Array.isArray(secure.pilotUserIds) ? secure.pilotUserIds.map(String) : [];
  if (pilot.length === 0) return true;
  const uid = String(user?._id || user?.id || '');
  return pilot.includes(uid);
};

/**
 * Check the SEB headers on `req` against the launches of `userId` for
 * `assessmentId`. Returns { ok, method, reason }.
 */
const verifySebRequest = async (req, userId, assessmentId) => {
  const headerHash = String(req.headers['x-safeexambrowser-configkeyhash'] || '').trim().toLowerCase();
  const jsApiKey = String(req.headers['x-seb-config-key'] || '').trim().toLowerCase();

  if (!headerHash && !jsApiKey) return { ok: false, method: '', reason: 'missing' };

  const launches = await SecureLaunchToken.find({
    userId,
    assessmentId,
    configFetchedAt: { $ne: null },
    createdAt: { $gte: new Date(Date.now() - LOOKBACK_MS) }
  }).select('configKey').lean();

  if (launches.length === 0) return { ok: false, method: '', reason: 'no_launch' };

  if (headerHash) {
    const url = absoluteRequestUrl(req);
    const hit = launches.find((l) => expectedRequestHash(url, l.configKey) === headerHash);
    if (hit) return { ok: true, method: 'header', reason: '' };
  }
  if (jsApiKey) {
    const hit = launches.find((l) => String(l.configKey).toLowerCase() === jsApiKey);
    if (hit) return { ok: true, method: 'jsapi', reason: '' };
  }
  return { ok: false, method: '', reason: 'mismatch' };
};

const MESSAGES = {
  missing: 'This assessment must be taken inside Safe Exam Browser. Go back to the assessment centre and use "Open in Safe Exam Browser".',
  no_launch: 'No Safe Exam Browser launch was found for this attempt. Start the assessment again from the assessment centre.',
  mismatch: 'Safe Exam Browser is running a different configuration file. Close it and launch the assessment again from the assessment centre.'
};

/**
 * @param {(req) => Promise<object|null>} resolveAssessment
 *        returns the Assessment (needs `secure`) the request is about, or null
 */
const requireSeb = (resolveAssessment) => async (req, res, next) => {
  try {
    const assessment = await resolveAssessment(req);
    if (!assessment || !isSecureFor(assessment, req.user)) return next();

    const userId = userIdOf(req);
    const verdict = await verifySebRequest(req, userId, assessment._id);
    req.seb = { required: true, verified: verdict.ok, method: verdict.method };
    if (verdict.ok) return next();

    const enforcement = (process.env.SEB_KEY_ENFORCEMENT || 'strict').toLowerCase();
    if (enforcement === 'log') {
      console.warn(`[sebGuard] ${verdict.reason} for user ${userId} on ${req.method} ${req.originalUrl} (logging only)`);
      return next();
    }

    return res.status(403).json({
      success: false,
      code: verdict.reason === 'mismatch' ? 'SEB_KEY_MISMATCH' : 'SEB_REQUIRED',
      sebRequired: true,
      error: MESSAGES[verdict.reason] || MESSAGES.missing
    });
  } catch (err) {
    console.error('[sebGuard] error:', err.message);
    return res.status(500).json({ success: false, error: 'Secure browser check failed.' });
  }
};

// ── Resolvers for the routes the guard sits on ─────────────────────────────

const Assessment = () => require('../models/Assessment');
const Result = () => require('../models/Result');
const ProctoringSession = () => require('../models/ProctoringSession');

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(String(v || ''));

const byAssessmentParam = async (req) => {
  const id = req.params.assessmentId || req.params.id;
  if (!isObjectId(id)) return null;
  return Assessment().findById(id).select('secure assessmentCode').lean();
};

const byResultParam = async (req) => {
  const id = req.params.resultId;
  if (!isObjectId(id)) return null;
  const result = await Result().findById(id).select('assessmentId').lean();
  if (!result?.assessmentId) return null;
  return Assessment().findById(result.assessmentId).select('secure assessmentCode').lean();
};

const byBodyAssessment = async (req) => {
  const id = req.body?.assessmentId;
  if (!isObjectId(id)) return null;
  return Assessment().findById(id).select('secure assessmentCode').lean();
};

const bySessionParam = async (req) => {
  const id = req.params.sessionId;
  if (!isObjectId(id)) return null;
  const session = await ProctoringSession().findById(id).select('assessmentId').lean();
  if (!session?.assessmentId) return null;
  return Assessment().findById(session.assessmentId).select('secure assessmentCode').lean();
};

module.exports = {
  requireSeb,
  isSecureFor,
  verifySebRequest,
  resolvers: { byAssessmentParam, byResultParam, byBodyAssessment, bySessionParam }
};
