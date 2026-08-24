/**
 * useProctoringSession — the integration layer that was missing.
 *
 * `src/api/proctoring.js` and `src/facepipeline/` both existed already, and
 * neither was imported by a single screen. The assessment player started an
 * attempt with no proctoring session at all: it never opened a camera, never
 * logged an event, and only *reacted* to a lock the server had already applied
 * for some other reason. A mobile attempt was, in practice, unproctored.
 *
 * This hook is the wiring. It owns the session lifecycle and every signal a
 * phone can honestly observe:
 *
 *   FR-PROC-06  app background/foreground   → `minimize`
 *   FR-PROC-10  heartbeat / liveness ping   → server detects a session going dark
 *   FR-PROC-11  inactivity detection        → `inactivity`
 *   FR-PROC-12  server-authoritative        → the client only renders `decision`
 *   FR-PROC-15  flag-only mode              → obeyed, never re-implemented
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It does not score anything. Risk, warning budget and tier are computed on the
 * server and returned on every `logEvent`/`heartbeat` call. The client's only
 * job is to report honestly and render the verdict. Duplicating the policy here
 * is how the two copies drift and a student gets a different answer depending
 * on which one they hit.
 *
 * FAILURE POSTURE
 * ---------------
 * Proctoring must never destroy an attempt. If the session cannot start, or an
 * event write fails, the assessment continues and `degraded` is set so the UI
 * can say so. Losing a proctoring signal is bad; losing a student's exam
 * because the proctor failed is worse. `proctoring_offline` is recorded by the
 * server from the heartbeat gap anyway, so a client that goes quiet is already
 * visible to a reviewer without the client having to self-report.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as proctoringApi from '../api/proctoring';
import { ProctoringEvent, Severity, TIER_RANK } from './events';

/** Server policy: HEARTBEAT_INTERVAL_MS. Kept in step with proctoringPolicy.js. */
const HEARTBEAT_MS = 10_000;
/** Server policy: HEARTBEAT_GAP_MS is 30s — ping well inside it. */
const INACTIVITY_MS = 90_000;
/** Don't spam the same event; one per question is plenty of signal. */
const EVENT_DEDUPE_MS = 8_000;

const INITIAL_DECISION = {
  tier: 'ok',
  warnings: 0,
  maxWarnings: null,
  riskScore: 0,
  status: 'active',
  held: false,
  reason: '',
  ticketId: null,
};

/**
 * @param {object}  opts
 * @param {string?} opts.resultId       attempt id — the session keys off this
 * @param {string?} opts.assessmentId
 * @param {boolean} opts.enabled        false until the attempt has actually started
 * @param {boolean} opts.finished       true once submitted, to stop all monitoring
 */
export function useProctoringSession({ resultId, assessmentId, enabled, finished }) {
  const [sessionId, setSessionId] = useState(null);
  const [decision, setDecision] = useState(INITIAL_DECISION);
  const [degraded, setDegraded] = useState(false);
  const [starting, setStarting] = useState(false);

  const sessionIdRef = useRef(null);
  const finishedRef = useRef(false);
  const lastEventAtRef = useRef({});
  const lastActivityRef = useRef(Date.now());
  const inactivityFiredRef = useRef(false);

  finishedRef.current = finished;

  /** The server's verdict replaces ours wholesale — never merged, never softened. */
  const applyDecision = useCallback((payload) => {
    if (payload && typeof payload.tier === 'string') setDecision(payload);
  }, []);

  // ── Session start ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !resultId || !assessmentId || sessionIdRef.current || finished) return;
    let cancelled = false;

    (async () => {
      setStarting(true);
      try {
        const res = await proctoringApi.startSession(resultId, assessmentId, {
          platform: 'mobile',
        });
        if (cancelled) return;
        const id = res?.data?._id || res?.data?.sessionId;
        if (id) {
          sessionIdRef.current = id;
          setSessionId(id);
          setDegraded(false);
        } else {
          setDegraded(true);
        }
      } catch {
        // See "failure posture" above — the exam goes on.
        if (!cancelled) setDegraded(true);
      } finally {
        if (!cancelled) setStarting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, resultId, assessmentId, finished]);

  // ── Event reporting ─────────────────────────────────────────────────────
  const logEvent = useCallback(
    async (eventType, metadata = {}) => {
      const id = sessionIdRef.current;
      if (!id || finishedRef.current) return null;

      const now = Date.now();
      const last = lastEventAtRef.current[eventType] || 0;
      if (now - last < EVENT_DEDUPE_MS) return null;
      lastEventAtRef.current[eventType] = now;

      try {
        const res = await proctoringApi.logEvent(id, {
          eventType,
          severity: Severity[eventType] || 'low',
          metadata: { ...metadata, platform: 'mobile' },
        });
        applyDecision(res?.proctoring);
        setDegraded(false);
        return res?.proctoring || null;
      } catch (err) {
        // A 409 still carries the decision — a held session must be rendered,
        // not swallowed as a network error.
        const payload = err?.response?.data;
        if (payload?.proctoring) {
          applyDecision(payload.proctoring);
          return payload.proctoring;
        }
        setDegraded(true);
        return null;
      }
    },
    [applyDecision]
  );

  // ── FR-PROC-06 · app went to the background ─────────────────────────────
  useEffect(() => {
    if (!sessionId || finished) return;

    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        logEvent(ProctoringEvent.MINIMIZE, { at: new Date().toISOString() });
      } else if (next === 'active') {
        // Returning counts as activity, so the idle timer doesn't fire on top
        // of the minimize event and double-charge the same lapse.
        lastActivityRef.current = Date.now();
        inactivityFiredRef.current = false;
      }
    });

    return () => sub.remove();
  }, [sessionId, finished, logEvent]);

  // ── FR-PROC-10 · heartbeat ──────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || finished) return;

    let stopped = false;
    const ping = async () => {
      if (stopped || finishedRef.current) return;
      // Only ping while foregrounded. A backgrounded app going quiet is exactly
      // the gap the server is meant to notice.
      if (AppState.currentState !== 'active') return;
      try {
        const res = await proctoringApi.heartbeat(sessionId);
        applyDecision(res?.proctoring);
        setDegraded(false);
      } catch (err) {
        const payload = err?.response?.data;
        if (payload?.proctoring) applyDecision(payload.proctoring);
        else setDegraded(true);
      }
    };

    ping();
    const t = setInterval(ping, HEARTBEAT_MS);
    return () => {
      stopped = true;
      clearInterval(t);
    };
  }, [sessionId, finished, applyDecision]);

  // ── FR-PROC-11 · inactivity ─────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || finished) return;

    const t = setInterval(() => {
      if (AppState.currentState !== 'active') return;
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= INACTIVITY_MS && !inactivityFiredRef.current) {
        inactivityFiredRef.current = true;
        logEvent(ProctoringEvent.INACTIVITY, { idleSeconds: Math.round(idleFor / 1000) });
      }
    }, 5000);

    return () => clearInterval(t);
  }, [sessionId, finished, logEvent]);

  /** Call on any real interaction — answering, scrolling, advancing. */
  const noteActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    inactivityFiredRef.current = false;
  }, []);

  // ── Close the session when the attempt ends ─────────────────────────────
  const complete = useCallback(async () => {
    const id = sessionIdRef.current;
    if (!id) return;
    try {
      await proctoringApi.completeSession(id);
    } catch {
      // The submit gate re-reads the session server-side; a failed close does
      // not change the outcome of the attempt.
    }
  }, []);

  useEffect(() => {
    if (finished) complete();
  }, [finished, complete]);

  // Best-effort close if the screen unmounts mid-attempt (student left).
  useEffect(
    () => () => {
      if (!finishedRef.current && sessionIdRef.current) complete();
    },
    [complete]
  );

  return {
    sessionId,
    decision,
    degraded,
    starting,
    logEvent,
    noteActivity,
    complete,
    /** True once the server says this attempt may not continue. */
    isBlocking: TIER_RANK[decision.tier] >= TIER_RANK.pause,
    isHeld: decision.tier === 'held' || decision.held,
  };
}
