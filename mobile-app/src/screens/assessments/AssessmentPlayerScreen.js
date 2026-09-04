/**
 * AssessmentPlayerScreen — the T1–T4 test runner.
 *
 * Port of `front-end/src/pages/BaseLineTest.jsx`'s assessment flow, using the
 * same endpoints in the same order via `api/assessments.js`:
 *
 *   getByCode(code)            → the assessment document, for its `_id`
 *   startAssessment(id)        → { resultId, assessmentToken, questions,
 *                                  responses, remainingSeconds, startedAt }
 *   saveAnswer(...)            → fired on every selection, with the session token
 *   submitAssessment(...)      → scores the attempt and returns the report
 *
 * Three behaviours are load-bearing and match the web exactly:
 *
 *  1. **The timer is server-anchored.** Remaining time is derived from the
 *     server's `startedAt`, never from a locally started countdown. Killing and
 *     reopening the app re-derives the same deadline, so backgrounding cannot
 *     buy extra time — the SRS's "survives app kill" requirement.
 *
 *  2. **Answers persist immediately.** Each selection posts before the student
 *     moves on, and `startAssessment` replays `responses` on resume, dropping
 *     them back at the first unanswered question.
 *
 *  3. **Questions advance forward only**, after a minimum dwell time. The web
 *     disables `prevQ` outright and blocks `nextQ` for 5 seconds per question;
 *     both are reproduced here rather than "improved", because they are
 *     assessment-integrity rules, not UI preferences.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { assessmentApi } from '../../api/assessments';
import { getStageConfig, STAGE_ACCENT } from '../../data/assessmentStages';
import { useProctoringSession } from '../../facepipeline/useProctoringSession';
import ProctoringGate from './ProctoringGate';

/** Web blocks Next for this long on each question. Integrity rule, not UI. */
const MIN_QUESTION_DWELL_MS = 5000;
/** Warn once when this little time remains. */
const WARN_AT_SECONDS = 60;

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function AssessmentPlayerScreen({ route, navigation }) {
  const stageKey = route?.params?.stage || 'T1';
  const config = getStageConfig(stageKey);
  const accent = STAGE_ACCENT[stageKey] || '#045C9A';

  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resultId, setResultId] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [assessmentToken, setAssessmentToken] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(false);

  const [remaining, setRemaining] = useState(config.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);
  // A submit can come back { success: true, held: true } without the client
  // ever having seen a live "held" decision (missed heartbeats / risk score
  // evaluated at submit time). It carries no report data, so it needs its own
  // terminal state rather than falling through setReport(undefined).
  const [heldAtSubmit, setHeldAtSubmit] = useState(null);

  // Server's attempt start, in epoch ms. The single source of truth for the
  // countdown — see note 1 in the header.
  const startedAtRef = useRef(null);
  const questionShownAtRef = useRef(Date.now());
  const [dwellElapsed, setDwellElapsed] = useState(0);
  const warnedRef = useRef(false);
  const submitRef = useRef(null);
  const heldSubmitRef = useRef(false);

  // Answers whose saveAnswer() call failed — keyed by questionId so a later
  // successful write for the same question simply clears the earlier one.
  // Retried on an interval and, non-negotiably, drained before every submit —
  // this is what actually makes "one dropped write is not fatal" true; before
  // this it was a comment, not a mechanism (submitAssessment never resends
  // answers, it only scores whatever the server already has on file).
  const pendingRef = useRef(new Map());
  const [pendingCount, setPendingCount] = useState(0);

  // Proctoring: identity gate before the first question, then heartbeat +
  // app-backgrounding detection for the rest of the attempt. See
  // facepipeline/useProctoringSession.js for exactly what this does and does
  // not cover yet.
  const proctoring = useProctoringSession({ resultId, assessmentId });

  const current = questions[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount >= questions.length;

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const assessmentRes = await assessmentApi.getByCode(config.code);
        if (!assessmentRes?.success || !assessmentRes?.data?._id) {
          throw new Error(assessmentRes?.error || `Could not load ${config.title}.`);
        }

        const startRes = await assessmentApi.startAssessment(assessmentRes.data._id);
        if (!startRes?.success) {
          throw new Error(startRes?.error || 'Could not start this assessment.');
        }
        if (cancelled) return;

        const data = startRes.data;
        setResultId(data.resultId);
        setAssessmentId(assessmentRes.data._id);
        setAssessmentToken(data.assessmentToken);

        // Server order wins, then truncate to this stage's question count —
        // same two steps, same order, as the web.
        const sorted = [...(data.questions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
        const limited = sorted.slice(0, config.questionLimit);
        setQuestions(limited);

        // Anchor the countdown. `startedAt` is preferred because it survives an
        // app kill; `remainingSeconds` is the fallback when it is absent.
        if (data.startedAt) {
          startedAtRef.current = new Date(data.startedAt).getTime();
          const elapsed = (Date.now() - startedAtRef.current) / 1000;
          setRemaining(Math.max(0, config.durationMinutes * 60 - elapsed));
        } else if (typeof data.remainingSeconds === 'number') {
          startedAtRef.current = Date.now() - (config.durationMinutes * 60 - data.remainingSeconds) * 1000;
          setRemaining(data.remainingSeconds);
        }

        // Resume: replay saved answers and land on the first unanswered.
        if (data.responses?.length) {
          const map = {};
          data.responses.forEach((r) => {
            map[r.questionId] = r.selectedValue;
          });
          setAnswers(map);
          const firstUnanswered = limited.findIndex((q) => !map[q._id]);
          setIndex(firstUnanswered === -1 ? Math.max(0, limited.length - 1) : firstUnanswered);
        }
      } catch (err) {
        if (cancelled) return;
        // A proctoring lock comes back on the error payload, same as web.
        const payload = err?.data;
        if (payload?.locked) {
          Alert.alert('Assessment locked', payload.error || 'Locked due to a proctoring violation.');
          navigation.goBack();
          return;
        }
        setError(payload?.error || err?.message || 'Failed to load assessment.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [config.code, config.durationMinutes, config.questionLimit, config.title, navigation]);

  // A 4xx (other than timeout/rate-limit) will fail identically on every
  // retry — an expired assessment token, a rejected value, a completed
  // attempt. Queueing it would block submit forever behind a write that can
  // never land.
  const isPermanentSaveFailure = (err) =>
    typeof err?.status === 'number' && err.status >= 400 && err.status < 500 && err.status !== 408 && err.status !== 429;

  // A permanently-rejected answer is dropped from the queue AND from the local
  // answers map, so the question shows as unanswered again instead of counting
  // toward a submit the server would refuse.
  const dropRejectedAnswer = useCallback((qid, err) => {
    pendingRef.current.delete(qid);
    setPendingCount(pendingRef.current.size);
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[qid];
      return next;
    });
    Alert.alert('Answer not accepted', err?.data?.error || err?.message || 'Please select your answer again.');
  }, []);

  // Retries every locally-queued failed write. Returns the number still
  // pending after the attempt (0 means fully caught up).
  const flushPending = useCallback(async () => {
    if (!resultId || pendingRef.current.size === 0) return 0;

    const entries = Array.from(pendingRef.current.entries());
    await Promise.all(
      entries.map(async ([qid, answer]) => {
        try {
          await assessmentApi.saveAnswer(resultId, qid, answer.selectedValue, answer.questionText, assessmentToken);
          pendingRef.current.delete(qid);
        } catch (err) {
          if (isPermanentSaveFailure(err)) {
            dropRejectedAnswer(qid, err);
          }
          // Otherwise still unreachable — stays queued for the next flush.
        }
      })
    );
    setPendingCount(pendingRef.current.size);
    return pendingRef.current.size;
  }, [resultId, assessmentToken, dropRejectedAnswer]);

  // Retry queued writes in the background so a brief network drop resolves
  // itself before the student ever reaches submit.
  useEffect(() => {
    if (loading || report || proctoring.heldInfo || heldAtSubmit) return undefined;
    const id = setInterval(() => {
      if (pendingRef.current.size > 0) flushPending();
    }, 8000);
    return () => clearInterval(id);
  }, [loading, report, proctoring.heldInfo, heldAtSubmit, flushPending]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const submit = useCallback(
    async ({ reason = 'manual' } = {}) => {
      if (!resultId || submitting || report || heldAtSubmit) return;
      if (reason === 'manual' && !allAnswered) {
        Alert.alert('Not finished', 'Answer every question before submitting.');
        return;
      }

      // The server only ever scores what it actually received — drain every
      // queued write first so a dropped answer doesn't silently score as blank.
      if (pendingRef.current.size > 0) {
        const stillPending = await flushPending();
        if (stillPending > 0 && reason === 'manual') {
          Alert.alert(
            'Some answers are unsent',
            `${stillPending} answer${stillPending === 1 ? '' : 's'} couldn't reach the server yet. Check your connection and try again in a moment.`
          );
          return;
        }
        // Timeout/violation submits can't wait on connectivity — proceed and
        // let completeMissingAnswers fill the gaps, same as any other unanswered question.
      }

      setSubmitting(true);
      try {
        const res = await assessmentApi.submitAssessment(resultId, assessmentToken, {
          submissionReason: reason,
          // On timeout the server fills the blanks; on a manual submit
          // everything is already answered.
          completeMissingAnswers: reason === 'timeout' || reason === 'violation',
        });
        if (res?.success && res.held) {
          setHeldAtSubmit(res);
          proctoring.complete();
        } else if (res?.success) {
          setReport(res.data);
          proctoring.complete();
        } else {
          throw new Error(res?.error || 'Submission failed.');
        }
      } catch (err) {
        // A timed-out attempt is finalised server-side even if the response is
        // lost, so fall back to reading the stage result rather than telling
        // the student their work vanished.
        if (reason === 'timeout' && userId) {
          try {
            const existing = await assessmentApi.getStageResult(userId, stageKey);
            if (existing?.success && existing?.data) {
              // Stage results carry the score as `stageScore`, not `percentage`.
              setReport({ ...existing.data, percentage: existing.data.stageScore });
              proctoring.complete();
              return;
            }
          } catch {
            /* fall through to the alert below */
          }
        }
        // A held attempt has nowhere to land a normal "submission failed"
        // alert — the held screen already tells the student what happened.
        if (reason !== 'violation') {
          Alert.alert('Submission failed', err?.data?.error || err?.message || 'Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [resultId, assessmentToken, submitting, report, heldAtSubmit, allAnswered, userId, stageKey, proctoring, flushPending]
  );

  submitRef.current = submit;

  // Held for review — the server has already decided; this only submits what
  // was answered so far (the score itself is withheld pending admin review)
  // and stops the clock. Never derived locally, same rule the web engine
  // documents for its own `enterHeldState`.
  useEffect(() => {
    if (proctoring.heldInfo && !heldSubmitRef.current) {
      heldSubmitRef.current = true;
      submitRef.current?.({ reason: 'violation' });
    }
  }, [proctoring.heldInfo]);

  // ── Countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || report || proctoring.heldInfo || heldAtSubmit || !startedAtRef.current) return;

    const tick = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      const left = Math.max(0, config.durationMinutes * 60 - elapsed);
      setRemaining(left);

      if (left <= WARN_AT_SECONDS && !warnedRef.current) {
        warnedRef.current = true;
        Alert.alert('One minute left', 'Your assessment submits automatically when the time runs out.');
      }
      if (left <= 0) {
        clearInterval(tick);
        submitRef.current?.({ reason: 'timeout' });
      }
    }, 1000);

    return () => clearInterval(tick);
  }, [loading, report, proctoring.heldInfo, heldAtSubmit, config.durationMinutes]);

  // Minimum dwell per question.
  useEffect(() => {
    questionShownAtRef.current = Date.now();
    setDwellElapsed(0);
    const t = setInterval(() => setDwellElapsed(Date.now() - questionShownAtRef.current), 250);
    return () => clearInterval(t);
  }, [index]);

  // Leaving mid-assessment must be deliberate.
  useEffect(() => {
    const onBack = () => {
      if (report) return false;
      Alert.alert('Leave assessment?', 'Your answers are saved, but the timer keeps running.', [
        { text: 'Stay', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [report, navigation]);

  // ── Answering ───────────────────────────────────────────────────────────
  const selectOption = useCallback(
    async (value) => {
      if (!current || submitting || report) return;
      const qid = current._id;

      setAnswers((prev) => ({ ...prev, [qid]: value }));
      const questionText = current.questionText || '';

      try {
        setSavingAnswer(true);
        await assessmentApi.saveAnswer(resultId, qid, value, questionText, assessmentToken);
        // A retry may have queued this question earlier — this write supersedes it.
        if (pendingRef.current.delete(qid)) setPendingCount(pendingRef.current.size);
      } catch (err) {
        if (isPermanentSaveFailure(err)) {
          dropRejectedAnswer(qid, err);
        } else {
          // Queued for the background retry loop and for the mandatory
          // pre-submit flush — see flushPending().
          pendingRef.current.set(qid, { selectedValue: value, questionText });
          setPendingCount(pendingRef.current.size);
        }
      } finally {
        setSavingAnswer(false);
      }
    },
    [current, resultId, assessmentToken, submitting, report, dropRejectedAnswer]
  );

  const canAdvance = !!current && !!answers[current._id] && dwellElapsed >= MIN_QUESTION_DWELL_MS;
  const dwellLeft = Math.ceil((MIN_QUESTION_DWELL_MS - dwellElapsed) / 1000);

  const options = useMemo(() => {
    if (!current) return [];
    if (Array.isArray(current.options) && current.options.length) {
      return current.options.map((o, i) =>
        typeof o === 'string'
          ? { label: o, value: o, key: `${i}` }
          : { label: o.text || o.label || o.optionText || '', value: o.value ?? o.text ?? o.label, key: o._id || `${i}` }
      );
    }
    return [];
  }, [current]);

  // ── Render ──────────────────────────────────────────────────────────────
  const shell = (children) => (
    <SafeAreaView style={[styles.screen, { backgroundColor: themeColors.bg }]} edges={['top', 'bottom']}>
      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />
      {children}
    </SafeAreaView>
  );

  if (loading) {
    return shell(
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={accent} />
        <Text style={[styles.centeredText, { color: themeColors.textMuted }]}>Preparing {config.title}…</Text>
      </View>
    );
  }

  if (error) {
    return shell(
      <View style={styles.centered}>
        <Feather name="alert-triangle" size={30} color={themeColors.danger} />
        <Text style={[styles.centeredTitle, { color: themeColors.text }]}>Could not start</Text>
        <Text style={[styles.centeredText, { color: themeColors.textMuted }]}>{error}</Text>
        <Pressable style={[styles.primaryBtn, { backgroundColor: accent }]} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (proctoring.heldInfo || heldAtSubmit) {
    const info = proctoring.heldInfo || heldAtSubmit;
    return shell(
      <ScrollView contentContainerStyle={styles.reportScroll}>
        <View style={[styles.reportBadge, { backgroundColor: '#F59E0B22' }]}>
          <Feather name="shield-off" size={38} color="#F59E0B" />
        </View>
        <Text style={[styles.reportTitle, { color: themeColors.text }]}>Held for review</Text>
        <Text style={[styles.centeredText, { color: themeColors.textMuted, marginTop: 10 }]}>
          {info.reason || info.message}
        </Text>
        <Text style={[styles.centeredText, { color: themeColors.textMuted, marginTop: 10 }]}>
          Your answers were saved. A support ticket has been raised and your score will be released once
          it's reviewed.
        </Text>
        {!!info.reference && (
          <Text style={[styles.centeredText, { color: themeColors.textMuted, marginTop: 10 }]}>
            Reference: {info.reference}
          </Text>
        )}
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: accent, marginTop: 26 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Back to assessments</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (proctoring.phase !== 'monitoring' && !report) {
    return shell(<ProctoringGate session={proctoring} accent={accent} onCancel={() => navigation.goBack()} />);
  }

  if (report) {
    const pct = Math.round(report.percentage ?? report.stageScore ?? report.score ?? 0);
    const passed = report.passed ?? pct >= config.passingPercentage;
    return shell(
      <ScrollView contentContainerStyle={styles.reportScroll}>
        <View style={[styles.reportBadge, { backgroundColor: passed ? '#10B98122' : '#EF444422' }]}>
          <Feather name={passed ? 'check-circle' : 'alert-circle'} size={38} color={passed ? '#10B981' : '#EF4444'} />
        </View>
        <Text style={[styles.reportTitle, { color: themeColors.text }]}>{config.title} complete</Text>
        <Text style={[styles.reportScore, { color: accent }]}>{pct}%</Text>
        <Text style={[styles.reportMeta, { color: themeColors.textMuted }]}>
          {answeredCount} of {questions.length} answered
          {config.passingPercentage > 0 ? ` · pass mark ${config.passingPercentage}%` : ''}
        </Text>

        {!!(report.stageBand || report.bandLabel) && (
          <View style={[styles.bandPill, { backgroundColor: themeColors.pillBg }]}>
            <Text style={[styles.bandText, { color: accent }]}>{report.stageBand || report.bandLabel}</Text>
          </View>
        )}

        <Pressable
          style={[styles.primaryBtn, { backgroundColor: accent, marginTop: 26 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryBtnText}>Back to assessments</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // Server-decided pause: block answering until a later heartbeat clears the
  // tier. The clock keeps running (server-anchored), same as the web.
  if (proctoring.decision.tier === 'pause') {
    return shell(
      <View style={styles.centered}>
        <Feather name="pause-circle" size={38} color="#F59E0B" />
        <Text style={[styles.centeredTitle, { color: themeColors.text }]}>Assessment paused</Text>
        <Text style={[styles.centeredText, { color: themeColors.textMuted }]}>
          {proctoring.decision.reason || 'Proctoring flagged an issue with this attempt.'}
        </Text>
        <Text style={[styles.centeredText, { color: themeColors.textMuted }]}>
          Stay on this screen — it resumes automatically once the check clears. The timer keeps running.
        </Text>
        <ActivityIndicator size="small" color="#F59E0B" style={{ marginTop: 10 }} />
      </View>
    );
  }

  const progress = questions.length ? (index + 1) / questions.length : 0;
  const low = remaining <= WARN_AT_SECONDS;

  return shell(
    <>
      <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]} numberOfLines={1}>
            {config.title}
          </Text>
          <Text style={[styles.headerMeta, { color: themeColors.textMuted }]}>
            Question {index + 1} of {questions.length}
          </Text>
        </View>

        <View style={[styles.clock, { backgroundColor: low ? '#EF444418' : themeColors.pillBg }]}>
          <Feather name="clock" size={13} color={low ? '#EF4444' : accent} />
          <Text style={[styles.clockText, { color: low ? '#EF4444' : accent }]}>{formatClock(remaining)}</Text>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7' }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]} />
      </View>

      {/* Server-issued proctoring warning — previously received but never shown. */}
      {proctoring.decision.tier === 'warn' && (
        <View style={styles.proctorWarnBanner}>
          <Feather name="alert-triangle" size={14} color="#B45309" />
          <Text style={styles.proctorWarnText} numberOfLines={2}>
            Proctoring warning {proctoring.decision.warnings}/{proctoring.decision.maxWarnings}
            {proctoring.decision.reason ? ` — ${proctoring.decision.reason}` : ''}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.question, { color: themeColors.text }]}>
          {current?.questionText || current?.question || ''}
        </Text>

        <View style={styles.options}>
          {options.map((opt) => {
            const picked = answers[current?._id] === opt.value;
            return (
              <Pressable
                key={opt.key}
                onPress={() => selectOption(opt.value)}
                disabled={submitting}
                style={[
                  styles.option,
                  {
                    borderColor: picked ? accent : themeColors.border,
                    backgroundColor: picked ? `${accent}14` : themeColors.card,
                  },
                ]}
              >
                <Feather
                  name={picked ? 'disc' : 'circle'}
                  size={17}
                  color={picked ? accent : themeColors.iconMuted}
                />
                <Text style={[styles.optionText, { color: themeColors.text }]}>{opt.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {savingAnswer && (
          <Text style={[styles.savingHint, { color: themeColors.textMuted }]}>Saving…</Text>
        )}
        {!savingAnswer && pendingCount > 0 && (
          <Text style={[styles.savingHint, { color: themeColors.warning }]}>
            {pendingCount} answer{pendingCount === 1 ? '' : 's'} unsent — retrying…
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: themeColors.border, backgroundColor: themeColors.bg }]}>
        {index < questions.length - 1 ? (
          <Pressable
            disabled={!canAdvance}
            onPress={() => setIndex((i) => i + 1)}
            style={[styles.primaryBtn, { backgroundColor: accent, opacity: canAdvance ? 1 : 0.45, flex: 1 }]}
          >
            <Text style={styles.primaryBtnText}>
              {!answers[current?._id]
                ? 'Select an answer'
                : dwellElapsed < MIN_QUESTION_DWELL_MS
                  ? `Next in ${dwellLeft}s`
                  : 'Next question'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={!allAnswered || submitting}
            onPress={() => submit({ reason: 'manual' })}
            style={[styles.primaryBtn, { backgroundColor: accent, opacity: allAnswered && !submitting ? 1 : 0.45, flex: 1 }]}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Submitting…' : allAnswered ? 'Submit assessment' : `${questions.length - answeredCount} unanswered`}
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  centeredTitle: { fontSize: 17, fontWeight: '800' },
  centeredText: { fontSize: 13.5, textAlign: 'center', lineHeight: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 16.5, fontWeight: '800', letterSpacing: -0.3 },
  headerMeta: { fontSize: 11.5, fontWeight: '600', marginTop: 1 },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clockText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },

  progressTrack: { height: 3, width: '100%' },
  progressFill: { height: '100%' },

  proctorWarnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  proctorWarnText: { flex: 1, fontSize: 12, fontWeight: '700', color: '#B45309' },

  body: { padding: 20, paddingBottom: 32 },
  question: { fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 22 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  optionText: { flex: 1, fontSize: 14.5, fontWeight: '600', lineHeight: 20 },
  savingHint: { fontSize: 11, fontWeight: '600', marginTop: 12, textAlign: 'right' },

  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderTopWidth: 1,
  },
  primaryBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '800' },

  reportScroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  reportBadge: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  reportTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  reportScore: { fontSize: 46, fontWeight: '900', letterSpacing: -1.5, marginTop: 6, fontVariant: ['tabular-nums'] },
  reportMeta: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  bandPill: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, marginTop: 14 },
  bandText: { fontSize: 12.5, fontWeight: '800' },
});
