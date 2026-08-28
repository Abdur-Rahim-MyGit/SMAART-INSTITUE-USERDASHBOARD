/**
 * useProctoringSession — the mobile counterpart to
 * front-end/src/hooks/useProctoringEngine.js, scoped to what's actually
 * achievable in this pass. The web engine does continuous face verification,
 * gaze tracking, audio monitoring, fullscreen enforcement, and multi-monitor
 * detection every few hundred milliseconds — most of that either doesn't map
 * to a phone (fullscreen, duplicate browser windows, a second monitor) or
 * needs the camera mounted and capturing for the whole exam, which deserves
 * its own physical-device verification pass before it ships (this repo has
 * never run the face pipeline on real hardware — see IMPLEMENTATION_MAP.md).
 *
 * What this DOES do, all server-verified exactly like the web:
 *   1. Start a real ProctoringSession tied to this attempt (resultId/assessmentId).
 *   2. Gate the attempt on registering your face once, on-device, before any
 *      question is shown — proves a real, consistent face was presented, not
 *      just an asserted identity.
 *   3. Heartbeat every 10s so a client that goes dark (backgrounded app,
 *      killed process, blocked requests) is caught by the server-side gap
 *      detector, same as web.
 *   4. Report a violation when the app is backgrounded mid-exam (the mobile
 *      analogue of the web's tab-switch/blur detection).
 *   5. Obey the server's tier decision — this client never decides "held"
 *      locally, same non-negotiable rule the web engine documents.
 *
 * Deliberately NOT built here (left for a follow-up pass): continuous in-exam
 * face re-verification, gaze/head-pose, audio monitoring, environment checks.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as proctoringApi from '../api/proctoring';
import * as facePipeline from './onnxFacePipeline';

const HEARTBEAT_INTERVAL_MS = 10 * 1000;

export function useProctoringSession({ resultId, assessmentId }) {
  // idle | starting | loading-models | registering | monitoring | held | error
  const [phase, setPhase] = useState('idle');
  const [modelProgress, setModelProgress] = useState(0);
  const [registerStatus, setRegisterStatus] = useState('');
  const [decision, setDecision] = useState({ tier: 'ok', warnings: 0, maxWarnings: 3, reason: '' });
  const [heldInfo, setHeldInfo] = useState(null);
  const [error, setError] = useState(null);

  const sessionIdRef = useRef(null);
  const heldRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const applyDecision = useCallback((d) => {
    if (!d) return;
    setDecision({ tier: d.tier || 'ok', warnings: d.warnings ?? 0, maxWarnings: d.maxWarnings ?? 3, reason: d.reason || '' });
    if ((d.held || d.tier === 'held') && !heldRef.current) {
      heldRef.current = true;
      setHeldInfo({ reason: d.reason || 'Proctoring violation threshold reached.', ticketId: d.ticketId || null });
      setPhase('held');
    }
  }, []);

  const reportEvent = useCallback(async (eventType, details, severity = 'medium') => {
    if (!sessionIdRef.current || heldRef.current) return;
    try {
      const res = await proctoringApi.logEvent(sessionIdRef.current, { eventType, severity, details });
      if (res?.proctoring) applyDecision(res.proctoring);
    } catch (err) {
      if (err?.data?.proctoring) applyDecision(err.data.proctoring);
    }
  }, [applyDecision]);

  const start = useCallback(async (capturePhoto) => {
    setPhase('starting');
    setError(null);
    try {
      const startRes = await proctoringApi.startSession(resultId, assessmentId, { cameraGranted: true });
      if (!startRes?.success || !startRes?.data?._id) {
        throw new Error(startRes?.error || 'Could not start the proctoring session.');
      }
      sessionIdRef.current = startRes.data._id;

      setPhase('loading-models');
      if (!facePipeline.isReady()) {
        await facePipeline.initPipeline((pct) => setModelProgress(pct));
      }

      setPhase('registering');
      const registration = await facePipeline.registerFace(capturePhoto, {
        onFrameCaptured: (count, total) => setRegisterStatus(`Captured frame ${count}/${total}`),
        onQualityIssue: (issues) => setRegisterStatus(issues[0] || 'Adjust position…'),
      });

      await proctoringApi.saveRegistration(sessionIdRef.current, registration);
      await proctoringApi.logEvent(sessionIdRef.current, {
        eventType: 'face_registered',
        severity: 'low',
        details: `Registered — quality ${registration.qualityScore}/100`,
      });

      setPhase('monitoring');
      return true;
    } catch (err) {
      // A pre-existing lock from an earlier attempt comes back as a 403 with
      // isLocked:true (see proctoringController.startSession) — route straight
      // to the held screen instead of surfacing it as a generic setup error.
      if (err?.data?.isLocked) {
        heldRef.current = true;
        setHeldInfo({ reason: err.data.error || 'This assessment is locked pending review.', ticketId: err.data.activeTicketId || null });
        setPhase('held');
        return false;
      }
      setError(err?.data?.error || err?.message || 'Proctoring setup failed.');
      setPhase('error');
      return false;
    }
  }, [resultId, assessmentId]);

  // Monitoring loop — heartbeat + app-backgrounding detection. Only runs once
  // the identity gate has passed.
  useEffect(() => {
    if (phase !== 'monitoring' || !sessionIdRef.current) return undefined;

    const heartbeatId = setInterval(() => {
      proctoringApi
        .heartbeat(sessionIdRef.current)
        .then((res) => { if (res?.proctoring) applyDecision(res.proctoring); })
        .catch((err) => { if (err?.data?.proctoring) applyDecision(err.data.proctoring); });
    }, HEARTBEAT_INTERVAL_MS);

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev === 'active' && (next === 'background' || next === 'inactive')) {
        reportEvent('minimize', 'App was backgrounded during a proctored assessment.', 'medium');
      }
    });

    return () => {
      clearInterval(heartbeatId);
      sub.remove();
    };
  }, [phase, applyDecision, reportEvent]);

  const complete = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await proctoringApi.completeSession(sessionIdRef.current);
    } catch {
      // Best-effort — the session still has a heartbeat trail server-side.
    }
  }, []);

  useEffect(() => {
    return () => {
      complete();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    modelProgress,
    registerStatus,
    decision,
    heldInfo,
    error,
    start,
    complete,
  };
}
