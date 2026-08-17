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
  const accent = STAGE_ACCENT[stageKey] || '#2563EB';

  const { user } = useAuth();
  const { colors: themeColors, theme } = useTheme();
  const isDark = theme === 'dark';
  const userId = user?._id || user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [resultId, setResultId] = useState(null);
  const [assessmentToken, setAssessmentToken] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(false);

  const [remaining, setRemaining] = useState(config.durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const [report, setReport] = useState(null);

  // Server's attempt start, in epoch ms. The single source of truth for the
  // countdown — see note 1 in the header.
  const startedAtRef = useRef(null);
  const questionShownAtRef = useRef(Date.now());
  const [dwellElapsed, setDwellElapsed] = useState(0);
  const warnedRef = useRef(false);
  const submitRef = useRef(null);

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

  // ── Submit ──────────────────────────────────────────────────────────────
  const submit = useCallback(
    async ({ reason = 'manual' } = {}) => {
      if (!resultId || submitting || report) return;
      if (reason === 'manual' && !allAnswered) {
        Alert.alert('Not finished', 'Answer every question before submitting.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await assessmentApi.submitAssessment(resultId, assessmentToken, {
          submissionReason: reason,
          // On timeout the server fills the blanks; on a manual submit
          // everything is already answered.
          completeMissingAnswers: reason === 'timeout' || reason === 'violation',
        });
        if (res?.success) {
          setReport(res.data);
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
              setReport(existing.data);
              return;
            }
          } catch {
            /* fall through to the alert below */
          }
        }
        Alert.alert('Submission failed', err?.data?.error || err?.message || 'Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [resultId, assessmentToken, submitting, report, allAnswered, userId, stageKey]
  );

  submitRef.current = submit;

  // ── Countdown ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading || report || !startedAtRef.current) return;

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
  }, [loading, report, config.durationMinutes]);

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

      try {
        setSavingAnswer(true);
        await assessmentApi.saveAnswer(resultId, qid, value, current.questionText || '', assessmentToken);
      } catch {
        // Web logs and continues — the answer stays selected locally and the
        // final submit re-sends the full set, so one dropped write is not fatal.
      } finally {
        setSavingAnswer(false);
      }
    },
    [current, resultId, assessmentToken, submitting, report]
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

  if (report) {
    const pct = Math.round(report.percentage ?? report.score ?? 0);
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

        {!!report.bandLabel && (
          <View style={[styles.bandPill, { backgroundColor: themeColors.pillBg }]}>
            <Text style={[styles.bandText, { color: accent }]}>{report.bandLabel}</Text>
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
