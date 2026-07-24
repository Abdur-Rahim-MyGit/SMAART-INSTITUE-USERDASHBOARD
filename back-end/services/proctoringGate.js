/**
 * The submit gate — where the whole session is judged, once.
 *
 * This is the most important check in the proctoring system. Before it
 * existed, resultController.submitAssessment had no proctoring references at
 * all: a candidate could accrue any number of violations, submit, and keep the
 * score.
 *
 * Two rules govern everything here:
 *
 *   1. Answers are ALWAYS saved. Only PUBLICATION is conditional. A candidate
 *      never loses work because of a proctoring decision.
 *
 *   2. We never assert that someone cheated. We cannot prove it, and accusing
 *      an honest candidate is a real harm — and indefensible if challenged.
 *      The language throughout is "this attempt could not be verified".
 *
 * Outcomes:
 *   verified  — publish the score. Most attempts.
 *   retry     — attempt voided, candidate re-sits with a DIFFERENT question
 *               set (see utils/questionShuffler, which excludes prior IDs).
 *   ticket    — retries exhausted; a human takes over.
 */

const ProctoringSession = require('../models/ProctoringSession');
const ProctoringEvent = require('../models/ProctoringEvent');
const { analyseTiming } = require('./answerTimingAnalysis');
const {
  RISK_FLAG_THRESHOLD,
  MAX_RETRY_ATTEMPTS,
  RISK_WEIGHTS,
  FLAG_CATEGORIES
} = require('../config/proctoringPolicy');

/**
 * Roll raw events up into the coarse, student-facing summary.
 *
 * Deliberately vague about mechanism. "You looked away from the screen — 12
 * times" is fair and explains the decision; naming the event type and its
 * threshold would be a tutorial in evading the detector on the next attempt.
 * Categories marked `minor` are never surfaced.
 */
const summariseFlags = (violationsByType) => {
  const counts =
    violationsByType instanceof Map
      ? Object.fromEntries(violationsByType)
      : violationsByType || {};

  return FLAG_CATEGORIES.filter((c) => !c.minor)
    .map((category) => ({
      key: category.key,
      label: category.label,
      count: category.events.reduce((sum, e) => sum + (counts[e] || 0), 0)
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
};

/**
 * Run the server-side timing pass and fold it into the session.
 *
 * Kept here rather than in the live engine because it needs the completed set
 * of responses. It is also the one signal a tampered client cannot suppress.
 */
const applyTimingAnalysis = async (result, session) => {
  const timing = analyseTiming(result);
  if (!timing.suspicious || !session) return timing;

  await new ProctoringEvent({
    sessionId: session._id,
    userId: session.userId,
    eventType: 'timing_anomaly',
    severity: 'high',
    details: timing.anomalies.join(' ')
  }).save();

  session.totalViolations += 1;
  const current = session.violationsByType.get('timing_anomaly') || 0;
  session.violationsByType.set('timing_anomaly', current + 1);

  return timing;
};

const computeRisk = (violationsByType) => {
  const counts =
    violationsByType instanceof Map
      ? Object.fromEntries(violationsByType)
      : violationsByType || {};

  let score = 0;
  Object.keys(counts).forEach((type) => {
    // `??` not `||` — info events are weighted 0 and must stay that way.
    score += (counts[type] || 0) * (RISK_WEIGHTS[type] ?? 10);
  });
  return Math.min(score, 100);
};

/**
 * Decide the outcome of a completed attempt.
 *
 * @param {object} result - the Result document being submitted
 * @returns {Promise<object>} verdict
 */
const evaluateAttempt = async (result) => {
  const verdict = {
    outcome: 'verified',
    hold: false,
    reasons: [],
    flags: [],
    riskScore: 0,
    retriesRemaining: MAX_RETRY_ATTEMPTS,
    session: null
  };

  if (!result) return verdict;

  // Prefer the session bound to this exact attempt; fall back to the newest
  // one for this user+assessment so attempts created before
  // proctoringSessionId existed are still covered.
  let session = await ProctoringSession.findOne({ resultId: result._id }).sort({ createdAt: -1 });
  if (!session) {
    session = await ProctoringSession.findOne({
      userId: result.userId,
      assessmentId: result.assessmentId
    }).sort({ createdAt: -1 });
  }

  // No proctoring session at all. Deliberately NOT treated as a failure:
  // several assessments in this platform run unproctored, and failing them
  // closed would break those flows.
  if (!session) {
    verdict.unproctored = true;
    return verdict;
  }

  verdict.session = session;

  // Timing analysis runs before scoring so its findings count toward risk.
  const timing = await applyTimingAnalysis(result, session);
  verdict.timing = timing;

  // Recompute from the authoritative counters rather than trusting the stored
  // score, which predates the timing pass.
  session.riskScore = computeRisk(session.violationsByType);
  verdict.riskScore = session.riskScore;
  verdict.flags = summariseFlags(session.violationsByType);

  if (session.isLocked) {
    verdict.reasons.push(session.lockReason || 'Session was held during the assessment.');
  }
  if (session.riskScore >= RISK_FLAG_THRESHOLD) {
    verdict.reasons.push(`Risk score ${session.riskScore} reached the verification threshold.`);
  }
  const missed = session.heartbeat?.missedCount || 0;
  if (missed > 0) {
    verdict.reasons.push(`The exam client stopped reporting ${missed} time(s).`);
  }

  if (verdict.reasons.length === 0) return verdict;

  // ── Unverified. Retry, or escalate to a human? ────────────────────────
  // attemptNumber is 1-based, so after the Nth attempt the candidate has
  // N-1 retries behind them.
  const retriesUsed = Math.max(0, (result.attemptNumber || 1) - 1);
  verdict.retriesRemaining = Math.max(0, MAX_RETRY_ATTEMPTS - retriesUsed - 1);
  verdict.hold = true;
  verdict.outcome = verdict.retriesRemaining > 0 ? 'retry' : 'ticket';

  return verdict;
};

/**
 * Stamp the outcome onto the Result. Caller saves.
 */
const applyHold = (result, verdict) => {
  result.completionStatus = 'pending_review';
  result.scoreReleased = false;
  result.review = {
    state: 'pending',
    reasons: verdict.reasons,
    riskScore: verdict.riskScore
  };
  if (verdict.session) result.proctoringSessionId = verdict.session._id;
  return result;
};

/**
 * The candidate-facing payload.
 *
 * Never says "you cheated". States what was observed, what it means, and
 * exactly what happens next — because a candidate who knows the path forward
 * does not open a support ticket.
 */
const buildHeldResponse = (result, verdict = {}) => {
  const canRetry = verdict.outcome === 'retry';

  return {
    success: true,
    held: true,
    verified: false,
    outcome: verdict.outcome || 'ticket',
    status: 'pending_review',
    resultId: result._id,
    reference: `RV-${String(result._id).slice(-8).toUpperCase()}`,
    answersRecorded: result.answeredQuestions,
    totalQuestions: result.totalQuestions,
    retriesRemaining: verdict.retriesRemaining ?? 0,
    flags: verdict.flags || [],
    message: canRetry
      ? "We couldn't fully verify this attempt, so it won't be scored. You can take the assessment again — you'll get a different set of questions."
      : "We couldn't fully verify this attempt and you've used all your retakes. Our team will review your assessment and get back to you."
  };
};

module.exports = {
  evaluateAttempt,
  applyHold,
  buildHeldResponse,
  // Exported for tests
  summariseFlags,
  computeRisk
};
