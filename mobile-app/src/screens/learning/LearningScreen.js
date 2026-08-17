import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Modal,
  RefreshControl,
  StatusBar as RNStatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useDrawer } from '../../context/DrawerContext';
import { useTheme } from '../../context/ThemeContext';
import SkeletonBox from '../../components/SkeletonBox';
import CourseVideoPlayer from '../../components/CourseVideoPlayer';
import {
  getPublishedCourses,
  getEnrollments,
  getCourseByCatalog,
  getCourseById,
  getCourseByCode,
  getCourseStages,
  getUserProgress,
  saveUserProgress,
  saveQuizProgress,
} from '../../api/courses';
import { getCourseNote, saveCourseNote } from '../../api/notes';
import { resolveLearningFlow, indexProgressByStep } from '../../utils/courseFlow';
import { getStageStatus } from '../../api/assessments';
import { STAGES, TRACKS } from '../../data/courseStructureData';
import {
  isStageUnlocked,
  isTrackUnlocked,
  isCourseUnlockedInStage,
  compareCourseIds,
} from '../../utils/courseUnlock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Per-stage visual identity. Each stage gets one accent that carries across its
 * path node, icon badge, progress fill and card edge, so a student can tell
 * Capacity from Capability from Leadership at a glance without reading a word.
 * Tints are picked per theme rather than derived with opacity — translucent
 * accents over the dark surface muddied into near-identical greys.
 */
const STAGE_THEME = {
  1: { accent: '#2563EB', tintLight: '#EFF6FF', tintDark: '#111E2F', icon: 'layers', numeral: 'I' },
  2: { accent: '#3B82F6', tintLight: '#EFF6FF', tintDark: '#13253A', icon: 'zap', numeral: 'II' },
  3: { accent: '#1D4ED8', tintLight: '#EFF6FF', tintDark: '#1E2B3E', icon: 'award', numeral: 'III' },
};

const TRACK_THEME = {
  PIQ: { accent: '#2563EB', tintLight: '#EFF6FF', tintDark: '#111E2F', icon: 'user-check', numeral: '🧍' },
  AIQ: { accent: '#3B82F6', tintLight: '#EFF6FF', tintDark: '#13253A', icon: 'cpu', numeral: '🤖' },
  SQ: { accent: '#1D4ED8', tintLight: '#EFF6FF', tintDark: '#1E2B3E', icon: 'globe', numeral: '🌱' },
};

const stageVisual = (id) => STAGE_THEME[id] || STAGE_THEME[1];
const trackVisual = (id) => TRACK_THEME[id] || TRACK_THEME.PIQ;

function initials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

/**
 * The enrolment to surface in "Continue Learning": the furthest-along course
 * still in progress, else the first unfinished one. Same rule as HomeScreen's
 * `pickActiveEnrollment` so both screens name the same course — a student
 * seeing two different "continue" targets would rightly not trust either.
 */
function pickActiveEnrollment(enrollments) {
  if (!enrollments?.length) return null;
  const inProgress = enrollments.filter((e) => e.status === 'in_progress');
  if (inProgress.length) {
    return inProgress.reduce(
      (best, e) => ((e.progress || 0) > (best.progress || 0) ? e : best),
      inProgress[0]
    );
  }
  return enrollments.find((e) => e.status !== 'completed') || enrollments[0];
}

/** Matches HomeScreen's section entrance so the two tabs feel like one app. */
function AnimatedSection({ children, delay = 0 }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay,
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>{children}</Animated.View>;
}

export default function LearningScreen({ navigation }) {
  const { user } = useAuth();
  const { openDrawer } = useDrawer();
  const { colors: themeColors, theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState('stages'); // 'stages' or 'tracks'
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [dbCourses, setDbCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stageStatus, setStageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal States
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseModalVisible, setCourseModalVisible] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  // ── Player state ──────────────────────────────────────────────────────────
  // `flow` is the seven-step learning flow from GET /courses/:id/stages;
  // `stepProgress` is the saved UserProgress rows keyed by stepId, used both to
  // resume playback and to tick off completed steps.
  const [flow, setFlow] = useState([]);
  const [flowSource, setFlowSource] = useState(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [flowError, setFlowError] = useState(null);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [stepProgress, setStepProgress] = useState({});
  // Quiz answers for the active step, keyed by question id, plus the graded
  // result once submitted. Cleared whenever the step or course changes.
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [flippedCard, setFlippedCard] = useState(null);

  // A ScrollView keeps its offset when its children change, so moving to the
  // next step (or into a stage) landed the reader wherever they had scrolled to
  // — halfway down a lesson they hadn't started. Both views are reset to the
  // top whenever what they are showing changes.
  const screenScrollRef = useRef(null);
  const playerScrollRef = useRef(null);
  
  const userId = user?._id || user?.id;

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const [coursesData, enrollmentsData, stageData] = await Promise.all([
        getPublishedCourses().catch(() => ({ data: [] })),
        getEnrollments(userId).catch(() => []),
        getStageStatus(userId).catch(() => ({ success: false, data: null })),
      ]);

      const coursesArray = Array.isArray(coursesData?.data) 
        ? coursesData.data 
        : (Array.isArray(coursesData) ? coursesData : []);
      setDbCourses(coursesArray);

      const enrollmentsArray = Array.isArray(enrollmentsData) 
        ? enrollmentsData 
        : (Array.isArray(enrollmentsData?.data) ? enrollmentsData.data : []);
      setEnrollments(enrollmentsArray);
      
      if (stageData?.success && stageData?.data) {
        setStageStatus(stageData.data);
      }
    } catch (err) {
      console.warn('LearningScreen fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const firstName = (user?.fullName || 'Learner').trim().split(/\s+/)[0];

  /** Live enrolment counters for the stats strip. */
  const learningStats = useMemo(() => {
    const list = Array.isArray(enrollments) ? enrollments : [];
    const completed = list.filter((e) => e.status === 'completed' || (e.progress || 0) >= 100).length;
    const active = list.filter((e) => e.status !== 'completed' && (e.progress || 0) < 100).length;
    return { enrolled: list.length, active, completed };
  }, [enrollments]);

  /** Furthest-along in-progress enrolment, for the Continue Learning card. */
  const activeEnrollment = useMemo(() => pickActiveEnrollment(enrollments), [enrollments]);

  // Map progress
  const userProgress = useMemo(() => {
    const passed = [];
    if (stageStatus) {
      Object.entries(stageStatus).forEach(([k, v]) => {
        if (v?.completed) passed.push(k);
      });
    }
    
    const completed = [];
    const enrolls = Array.isArray(enrollments) ? enrollments : [];
    enrolls.forEach((e) => {
      if (e.status === 'completed' || e.progress >= 100) {
        const code = e.course?.courseCode || e.courseCode;
        if (code) completed.push(code);
      }
    });

    return {
      completedCourses: completed,
      assessmentsPassed: passed,
    };
  }, [enrollments, stageStatus]);

  // Categorize db courses
  const categorizedData = useMemo(() => {
    const stage1 = [];
    const stage2 = [];
    const stage3 = [];
    const piq = [];
    const aiq = [];
    const sq = [];

    const courses = Array.isArray(dbCourses) ? dbCourses : [];
    courses.forEach((c) => {
      const code = c.courseCode || '';
      const category = (c.category || '').toLowerCase();

      if (code.startsWith('PIQ')) piq.push(c);
      else if (code.startsWith('AIQ')) aiq.push(c);
      else if (code.startsWith('SQ')) sq.push(c);
      else if (category === 'capacity' || code.match(/S0[1-9]/) || code === 'S10') stage1.push(c);
      else if (category === 'capability' || code.match(/S1[1-9]/)) stage2.push(c);
      else if (category === 'leadership' || code.match(/S2[0-5]/)) stage3.push(c);
      else stage1.push(c);
    });

    const sortFn = (a, b) => (a.courseCode || '').localeCompare(b.courseCode || '', undefined, { numeric: true });
    stage1.sort(sortFn);
    stage2.sort(sortFn);
    stage3.sort(sortFn);
    piq.sort(sortFn);
    aiq.sort(sortFn);
    sq.sort(sortFn);

    /**
     * These arrays replace the static `STAGES[n].courses`, whose entries carry
     * an `id` ('S01'). DB courses carry `courseCode` and a Mongo `_id` instead,
     * and `utils/courseUnlock.js` matches strictly on `c.id` — so every lookup
     * would miss and `strictCourseUnlockedInStage` would report *every* course
     * locked the moment `ENFORCE_PROGRESSION_GATES` is turned on. Aliasing the
     * code onto `id` keeps the unlock rules working against real data without
     * changing the shared util's contract.
     */
    const withStaticId = (list) => list.map((c) => (c.id ? c : { ...c, id: c.courseCode }));

    return {
      stages: [
        { ...STAGES[0], courses: withStaticId(stage1), totalCourses: stage1.length },
        { ...STAGES[1], courses: withStaticId(stage2), totalCourses: stage2.length },
        { ...STAGES[2], courses: withStaticId(stage3), totalCourses: stage3.length },
      ],
      tracks: [
        { ...TRACKS[0], courses: withStaticId(piq), totalCourses: piq.length },
        { ...TRACKS[1], courses: withStaticId(aiq), totalCourses: aiq.length },
        { ...TRACKS[2], courses: withStaticId(sq), totalCourses: sq.length },
      ],
    };
  }, [dbCourses]);

  /**
   * Flat cross-stage search. Typing bypasses the stage/track drill-down
   * entirely — hunting for one course through three stage cards and a
   * prerequisite gate was the slowest path in this screen.
   */
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const groups = [...categorizedData.stages, ...categorizedData.tracks];
    const hits = [];
    groups.forEach((group) => {
      group.courses.forEach((c) => {
        const haystack = `${c.title || ''} ${c.courseCode || ''} ${c.category || ''}`.toLowerCase();
        if (haystack.includes(q)) hits.push({ course: c, group });
      });
    });
    return hits;
  }, [searchQuery, categorizedData]);

  const selectedStage = useMemo(() => {
    if (!selectedStageId) return null;
    return (
      categorizedData.stages.find((s) => s.id === selectedStageId) ||
      categorizedData.tracks.find((t) => t.id === selectedStageId)
    );
  }, [selectedStageId, categorizedData]);

  const stageAccent = useMemo(() => {
    if (!selectedStage) return themeColors.primaryBright;
    return (typeof selectedStage.id === 'string' ? trackVisual(selectedStage.id) : stageVisual(selectedStage.id)).accent;
  }, [selectedStage, themeColors.primaryBright]);

  // Next up active course
  const nextUpCourse = useMemo(() => {
    if (dbCourses.length === 0) return null;
    for (const stage of categorizedData.stages) {
      const match = stage.courses.find((c) => {
        const isCompleted = userProgress.completedCourses.includes(c.courseCode);
        const isUnlocked = isCourseUnlockedInStage(c.courseCode, stage, userProgress);
        return !isCompleted && isUnlocked;
      });
      if (match) return match;
    }
    return null;
  }, [dbCourses, categorizedData, userProgress]);

  // Overall progress percentage
  const overallProgress = useMemo(() => {
    const total = dbCourses.length;
    if (total === 0) return 0;
    const completed = dbCourses.filter((c) =>
      userProgress.completedCourses.some((cc) => cc === c.courseCode)
    ).length;
    return Math.round((completed / total) * 100);
  }, [dbCourses, userProgress]);

  const getCourseCompletedCount = (stageOrTrack) => {
    return stageOrTrack.courses.filter((c) =>
      userProgress.completedCourses.some((cc) => cc === c.courseCode)
    ).length;
  };

  const handleStageSelect = (stageOrTrack) => {
    const unlocked =
      activeTab === 'stages'
        ? isStageUnlocked(stageOrTrack, userProgress)
        : isTrackUnlocked(stageOrTrack, userProgress);

    if (!unlocked) {
      Alert.alert(
        'Prerequisites Required 🔒',
        'Please complete previous stages and pass relevant assessment gates to unlock this section.'
      );
      return;
    }
    setSelectedStageId(stageOrTrack.id);
  };

  /**
   * `group` is passed explicitly by callers that open a course from outside the
   * drill-down (the Continue Learning CTA, search results). Those run before
   * any `setSelectedStageId` has been applied, so reading `selectedStage` there
   * would test the unlock rule against a stale — usually null — stage and
   * wrongly gate a course the student has already unlocked. Falls back to
   * looking the owning group up by course code.
   */
  const findGroupForCourse = (course) =>
    [...categorizedData.stages, ...categorizedData.tracks].find((g) =>
      g.courses.some((c) => c.courseCode === course.courseCode)
    ) || null;

  const handleCoursePress = (course, group) => {
    if (!course) return;
    const owningGroup = group || selectedStage || findGroupForCourse(course);
    const isUnlocked = isCourseUnlockedInStage(course.courseCode, owningGroup, userProgress);
    if (!isUnlocked) {
      Alert.alert('Prerequisites Required 🔒', 'Please complete the previous course first to unlock this module.');
      return;
    }
    setSelectedCourse(course);
    setNotesText(course.notes || '');
    setCourseModalVisible(true);
  };

  const closeCourseModal = () => {
    setCourseModalVisible(false);
    setFlow([]);
    setFlowSource(null);
    setStepProgress({});
    setActiveStepIdx(0);
    setFlowError(null);
    setQuizAnswers({});
    setQuizResult(null);
    setFlippedCard(null);
  };

  // Answers belong to one step — moving between steps must not carry them over.
  // The player is also returned to the top so a new step starts at its video
  // rather than wherever the previous step was scrolled to.
  useEffect(() => {
    setQuizAnswers({});
    setQuizResult(null);
    setFlippedCard(null);
    playerScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [activeStepIdx, selectedCourse]);

  // Same for entering or leaving a stage on the main screen.
  useEffect(() => {
    screenScrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedStageId]);

  /**
   * Load a course's real content when it opens.
   *
   * Fetches the same two sources the web's CoursePlayer does, in parallel, and
   * hands both to `resolveLearningFlow`, which applies the web's priority:
   * authored `learningFlow` first, day-based modules next, the stages
   * projection last. Mobile previously called only the stages endpoint — the
   * fallback — so authored course content never appeared.
   *
   * The catalogue lookup accepts a course code (S01, PIQ01) or a Mongo id and
   * picks the best matching course, mirroring `coursesAPI.getByCatalog`.
   */
  useEffect(() => {
    if (!courseModalVisible || !selectedCourse) return;
    let cancelled = false;

    const courseCode = selectedCourse.courseCode || selectedCourse._id;
    const courseKey = selectedCourse.courseCode || selectedCourse._id;

    (async () => {
      setFlowLoading(true);
      setFlowError(null);
      try {
        // Same fallback ladder as the web: catalogue lookup first, then a
        // direct id/code fetch. (The previous version re-issued the already
        // in-flight stages request here and threw the result away, so the
        // id/code fallback never actually ran.)
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(String(courseKey));
        const [courseRes, stagesRes, progressRes, noteRes] = await Promise.all([
          getCourseByCatalog(courseKey).catch((err) => {
            // A 403 is a subscription/access decision, not a lookup miss —
            // surface it rather than silently falling back to thinner content.
            if (err?.status === 403) throw err;
            return (isObjectId ? getCourseById(courseKey) : getCourseByCode(courseKey)).catch(() => null);
          }),
          getCourseStages(courseKey).catch(() => null),
          getUserProgress(courseCode).catch(() => ({ data: [] })),
          getCourseNote(courseCode).catch(() => null),
        ]);
        if (cancelled) return;

        const resolved = resolveLearningFlow(courseRes, stagesRes);
        const saved = indexProgressByStep(progressRes);

        // Restore a previously written reflection so the box isn't blank over
        // text the student already saved.
        const existingNote = noteRes?.data?.content || noteRes?.content;
        if (existingNote) setNotesText(existingNote);

        if (!resolved.steps.length) {
          setFlowError('This course has no published content yet.');
          setFlow([]);
          return;
        }

        setFlow(resolved.steps);
        setFlowSource(resolved.source);
        setStepProgress(saved);

        // Resume on the first step that is neither watched nor answered.
        const firstUnfinished = resolved.steps.findIndex(
          (s) => !saved[s.stepId]?.videoCompleted && !saved[s.stepId]?.testCompleted
        );
        setActiveStepIdx(firstUnfinished === -1 ? 0 : firstUnfinished);
      } catch (err) {
        if (!cancelled) {
          setFlowError(err?.data?.error || err?.message || 'Could not load this course');
        }
      } finally {
        if (!cancelled) setFlowLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseModalVisible, selectedCourse]);

  /**
   * Checkpoint video position.
   *
   * Sends the web's exact field names to POST /courseEnrollments/user-progress/save.
   * `moduleId: '1'` and `dayId: 1` mirror what `CoursePlayer.jsx` sends — the
   * server upserts on (user, courseCode, moduleId, dayId, stepId), so matching
   * them means mobile updates the same row rather than creating a parallel one.
   *
   * Note the sibling POST /video-progress endpoint expects `maxWatchedTime` /
   * `isCompleted` instead; the web does not use it, so neither do we.
   */
  const handleVideoProgress = useCallback(
    async ({ maxWatchedTime, duration, completed }) => {
      const step = flow[activeStepIdx];
      const courseCode = selectedCourse?.courseCode;
      if (!step || !courseCode) return;

      // Merge, never replace: a step can carry both a video and a quiz, and a
      // wholesale overwrite dropped `testCompleted`/`testScore` the moment the
      // video ticked. Completion is also sticky — it may only ever go true.
      setStepProgress((prev) => ({
        ...prev,
        [step.stepId]: {
          ...(prev[step.stepId] || {}),
          lastTimestamp: maxWatchedTime,
          videoDuration: duration,
          videoCompleted: completed || prev[step.stepId]?.videoCompleted || false,
        },
      }));

      try {
        await saveUserProgress({
          courseCode,
          moduleId: '1',
          dayId: 1,
          stepId: step.stepId,
          last_timestamp: maxWatchedTime,
          videoDuration: duration,
          videoCompleted: completed,
        });
      } catch (err) {
        // A dropped checkpoint must never interrupt playback — the next tick
        // resends the same high-water mark, so nothing is lost.
        console.warn('[Learning] video progress save failed:', err?.message);
      }
    },
    [flow, activeStepIdx, selectedCourse]
  );

  /**
   * Grade and record a quiz step.
   *
   * Scores locally against the `correctIndex` the backend ships with each
   * question, then persists twice, matching what the web does: `quiz-progress`
   * rolls the score into the enrolment's module progress, while
   * `user-progress/save` marks the step complete in the same row the video
   * path writes to, so step ticks stay consistent across content types.
   */
  /**
   * Persist the reflection note for this course.
   *
   * This button previously showed "Your takeaways have been updated
   * successfully" and made no request at all — the text was lost the moment the
   * player closed, while telling the student the opposite. The server upserts
   * on (user, courseId), so repeat saves update one row.
   */
  const handleSaveNotes = useCallback(async () => {
    const courseId = selectedCourse?.courseCode || selectedCourse?._id;
    if (!courseId || !notesText.trim()) return;

    setNotesSaving(true);
    try {
      await saveCourseNote({
        courseId,
        title: selectedCourse?.title || courseId,
        content: notesText.trim(),
      });
      Alert.alert('Notes saved', 'Your takeaways are stored against this course.');
    } catch (err) {
      Alert.alert(
        "Couldn't save notes",
        err?.data?.error || err?.message || 'Check your connection and try again.'
      );
    } finally {
      setNotesSaving(false);
    }
  }, [selectedCourse, notesText]);

  const handleQuizSubmit = useCallback(async () => {
    const step = flow[activeStepIdx];
    const courseCode = selectedCourse?.courseCode;
    if (!step?.questions?.length || !courseCode) return;

    const gradeable = step.questions.filter((q) => q.correctIndex !== null);
    const correct = gradeable.filter((q) => quizAnswers[q.id] === q.correctIndex).length;
    const totalPoints = gradeable.reduce((sum, q) => sum + (q.points || 1), 0);
    const score = gradeable
      .filter((q) => quizAnswers[q.id] === q.correctIndex)
      .reduce((sum, q) => sum + (q.points || 1), 0);

    setQuizResult({ correct, total: gradeable.length, score, totalPoints });
    setStepProgress((prev) => ({
      ...prev,
      [step.stepId]: { ...(prev[step.stepId] || {}), testCompleted: true, testScore: score },
    }));

    try {
      await Promise.all([
        saveQuizProgress({
          courseCode,
          moduleId: '1',
          dayId: 1,
          quizId: String(step.stepId),
          score,
          totalPoints,
        }).catch(() => null),
        saveUserProgress({
          courseCode,
          moduleId: '1',
          dayId: 1,
          stepId: step.stepId,
          testScore: score,
          testTotalPoints: totalPoints,
          testCompleted: true,
        }),
      ]);
    } catch (err) {
      console.warn('[Learning] quiz progress save failed:', err?.message);
    }
  }, [flow, activeStepIdx, selectedCourse, quizAnswers]);


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]} edges={['top']}>
      {/* Decorative Pastel Background Blobs */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.auroraBlob, { backgroundColor: '#DBEAFE', top: -100, left: -60, width: 280, height: 280, borderRadius: 140, opacity: theme === 'dark' ? 0.03 : 0.15 }]} />
        <View style={[styles.auroraBlob, { backgroundColor: '#EFF6FF', top: 320, right: -120, width: 340, height: 340, borderRadius: 170, opacity: theme === 'dark' ? 0.02 : 0.12 }]} />
      </View>

      <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

      <ScrollView
        ref={screenScrollRef}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primaryBright}
            colors={[themeColors.primaryBright]}
          />
        }
      >

        {/* ── Header — same furniture as HomeScreen (drawer, bell, theme
            toggle, avatar) so moving between tabs doesn't change the chrome.
            This screen previously had only a plain text title, leaving no way
            to reach the drawer or flip the theme from here. ── */}
        <View style={styles.headerContainer}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={openDrawer}
                hitSlop={12}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="menu" size={20} color={themeColors.text} />
              </Pressable>

              <View style={styles.headerTitleWrap}>
                <Text style={[styles.headerEyebrow, { color: themeColors.textMuted }]}>
                  Keep going, {firstName} 🎓
                </Text>
                <Text style={[styles.headerHeading, { color: themeColors.text }]}>My Learning</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={() => navigation.navigate('Notifications')}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    marginRight: 8,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name="bell" size={18} color={themeColors.text} />
              </Pressable>

              <Pressable
                onPress={toggleTheme}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  {
                    marginRight: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    borderColor: themeColors.border,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Feather name={isDark ? 'sun' : 'moon'} size={18} color={isDark ? '#FACC15' : themeColors.text} />
              </Pressable>

              <Pressable
                onPress={() => navigation.navigate('Profile')}
                style={({ pressed }) => [
                  styles.avatarRingWrap,
                  { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)', opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <View style={[styles.avatarInnerCircle, { backgroundColor: themeColors.primary }]}>
                  <Text style={styles.avatarText}>{initials(user?.fullName)}</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Cross-stage course search */}
          <View
            style={[
              styles.searchBar,
              { backgroundColor: themeColors.card, borderColor: themeColors.border },
            ]}
          >
            <Feather name="search" size={17} color={themeColors.iconMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search courses, modules and more..."
              placeholderTextColor={themeColors.textMuted}
              style={[styles.searchInput, { color: themeColors.text }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <Feather name="x-circle" size={17} color={themeColors.iconMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {loading ? (
          /* Skeletons mirroring the real layout (hero → stats → three cards)
             rather than a bare centred spinner, so the page doesn't jump. */
          <View style={styles.dashboardContainer}>
            <SkeletonBox width="100%" height={150} borderRadius={20} style={{ marginBottom: 16 }} />
            <SkeletonBox width="100%" height={78} borderRadius={18} style={{ marginBottom: 16 }} />
            <SkeletonBox width="100%" height={44} borderRadius={14} style={{ marginBottom: 16 }} />
            {[0, 1, 2].map((i) => (
              <SkeletonBox key={i} width="100%" height={140} borderRadius={20} style={{ marginBottom: 14 }} />
            ))}
          </View>
        ) : searchResults ? (
          /* ── Search results ── */
          <View style={styles.dashboardContainer}>
            <Text style={[styles.searchResultCount, { color: themeColors.textMuted }]}>
              {searchResults.length === 0
                ? `No courses match “${searchQuery.trim()}”`
                : `${searchResults.length} course${searchResults.length === 1 ? '' : 's'} found`}
            </Text>

            {searchResults.map(({ course, group }) => {
              const unlocked = isCourseUnlockedInStage(course.courseCode, group, userProgress);
              const done = userProgress.completedCourses.includes(course.courseCode);
              return (
                <Pressable
                  key={course._id || course.courseCode}
                  onPress={() => {
                    setSelectedStageId(group.id);
                    setSearchQuery('');
                    handleCoursePress(course, group);
                  }}
                  style={({ pressed }) => [
                    styles.searchResultRow,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.searchResultIcon,
                      { backgroundColor: done ? 'rgba(16,185,129,0.12)' : themeColors.pillBg },
                    ]}
                  >
                    <Feather
                      name={done ? 'check' : unlocked ? 'play' : 'lock'}
                      size={15}
                      color={done ? themeColors.success : unlocked ? themeColors.primaryBright : themeColors.iconMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.searchResultTitle, { color: themeColors.text }]} numberOfLines={1}>
                      {course.title || course.courseCode}
                    </Text>
                    <Text style={[styles.searchResultMeta, { color: themeColors.textMuted }]} numberOfLines={1}>
                      {course.courseCode} • {group.name}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={themeColors.iconMuted} />
                </Pressable>
              );
            })}
          </View>
        ) : !selectedStageId ? (
          /* OVERVIEW DASHBOARD */
          <View style={styles.dashboardContainer}>

            {/* ── Continue Learning — driven by the real furthest-along
                enrolment. The old card showed fixed marketing copy and a
                "Get Started" button regardless of what the student had
                already begun. ── */}
            <AnimatedSection delay={60}>
              <View style={[styles.heroCard, { backgroundColor: isDark ? '#241C42' : '#EDE9FE' }]}>
                <View style={styles.heroTextContent}>
                  <Text style={[styles.heroLabel, { color: isDark ? '#C4B5FD' : '#6D28D9' }]}>
                    {activeEnrollment ? 'CONTINUE LEARNING' : 'START LEARNING TODAY'}
                  </Text>
                  <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]} numberOfLines={2}>
                    {activeEnrollment?.course?.title
                      || activeEnrollment?.courseName
                      || nextUpCourse?.title
                      || 'Ready when you are'}
                  </Text>

                  {activeEnrollment ? (
                    <View style={styles.heroProgressWrap}>
                      <View style={[styles.heroProgressBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(109,40,217,0.15)' }]}>
                        <View
                          style={[
                            styles.heroProgressFill,
                            {
                              width: `${Math.min(100, Math.round(activeEnrollment.progress || 0))}%`,
                              backgroundColor: isDark ? '#A78BFA' : '#6D28D9',
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.heroProgressText, { color: isDark ? '#C4B5FD' : '#6D28D9' }]}>
                        {Math.round(activeEnrollment.progress || 0)}% complete
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.heroDesc, { color: isDark ? '#A5B4FC' : '#475569' }]} numberOfLines={2}>
                      Pick a stage below to begin your first module.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.heroBtn}
                    onPress={() => {
                      const target = nextUpCourse
                        || dbCourses.find((c) => c.courseCode === (activeEnrollment?.course?.courseCode || activeEnrollment?.courseCode));
                      if (target) handleCoursePress(target);
                    }}
                  >
                    <Text style={styles.heroBtnText}>{activeEnrollment ? 'Resume' : 'Get Started'}</Text>
                    <Feather name="arrow-right" size={12} color="#FFFFFF" style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                </View>
                <View style={styles.heroGraphic}>
                  <Text style={{ fontSize: 44 }}>📚</Text>
                </View>
              </View>
            </AnimatedSection>

            {/* ── Journey card — one surface carrying overall progress, the
                enrolment counters and the CGPA entry point. These were three
                separate flat boxes stacked on top of each other, which read as
                unfinished and pushed the actual learning path below the fold. ── */}
            <AnimatedSection delay={110}>
              <View style={[styles.journeyCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                <View style={styles.journeyTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.journeyEyebrow, { color: themeColors.textMuted }]}>OVERALL PROGRESS</Text>
                    <Text style={[styles.journeyTitle, { color: themeColors.text }]}>Your Journey</Text>
                  </View>
                  <View style={styles.journeyPctWrap}>
                    <Text style={[styles.journeyPct, { color: themeColors.primaryBright }]}>{overallProgress}</Text>
                    <Text style={[styles.journeyPctSign, { color: themeColors.primaryBright }]}>%</Text>
                  </View>
                </View>

                <View style={[styles.journeyTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7' }]}>
                  <View
                    style={[
                      styles.journeyFill,
                      { width: `${Math.max(overallProgress, 2)}%`, backgroundColor: themeColors.primaryBright },
                    ]}
                  />
                </View>
                <Text style={[styles.journeyCaption, { color: themeColors.textMuted }]}>
                  {userProgress.completedCourses.length} of {dbCourses.length} modules completed
                </Text>

                <View style={[styles.journeyDivider, { backgroundColor: themeColors.border }]} />

                <View style={styles.journeyStatsRow}>
                  {[
                    { icon: 'book-open', tint: '#3B82F6', value: learningStats.enrolled, label: 'Enrolled' },
                    { icon: 'clock', tint: '#F59E0B', value: learningStats.active, label: 'In Progress' },
                    { icon: 'check-circle', tint: '#10B981', value: learningStats.completed, label: 'Completed' },
                  ].map((s, idx) => (
                    <React.Fragment key={s.label}>
                      <View style={styles.journeyStat}>
                        <View style={[styles.journeyStatIcon, { backgroundColor: `${s.tint}1F` }]}>
                          <Feather name={s.icon} size={14} color={s.tint} />
                        </View>
                        <Text style={[styles.journeyStatValue, { color: themeColors.text }]}>{s.value}</Text>
                        <Text style={[styles.journeyStatLabel, { color: themeColors.textMuted }]}>{s.label}</Text>
                      </View>
                      {idx < 2 && <View style={[styles.journeyStatDivider, { backgroundColor: themeColors.border }]} />}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            </AnimatedSection>

            {/* ── Learning tools ──────────────────────────────────────────
                Certificates, notes and the library exist on web but had no
                entry point at all on mobile, so the screens were unreachable
                even once built. */}
            <AnimatedSection delay={130}>
              <View style={styles.toolsGrid}>
                {[
                  { key: 'certs', icon: 'award', label: 'Certificates', sub: 'What you have earned', screen: 'Certificates' },
                  { key: 'notes', icon: 'edit-3', label: 'My Notes', sub: 'Across all courses', screen: 'Notes' },
                  { key: 'library', icon: 'book-open', label: 'Library', sub: 'Recommended reading', screen: 'Library' },
                ].map((tool) => (
                  <TouchableOpacity
                    key={tool.key}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate(tool.screen)}
                    style={[
                      styles.toolCard,
                      { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    ]}
                  >
                    <View style={[styles.toolIcon, { backgroundColor: themeColors.pillBg }]}>
                      <Feather name={tool.icon} size={15} color={themeColors.primaryBright} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.toolLabel, { color: themeColors.text }]} numberOfLines={1}>
                        {tool.label}
                      </Text>
                      <Text style={[styles.toolSub, { color: themeColors.textMuted }]} numberOfLines={1}>
                        {tool.sub}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={15} color={themeColors.iconMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedSection>

            {/* ── Section header + segmented control ── */}
            <AnimatedSection delay={150}>
              <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {activeTab === 'stages' ? 'Your Learning Path' : 'Quotient Specializations'}
                </Text>
                <Text style={[styles.sectionSub, { color: themeColors.textMuted }]}>
                  {activeTab === 'stages'
                    ? 'Three stages — from foundation to leadership'
                    : 'Focused tracks that run alongside your stages'}
                </Text>
              </View>

              <View style={[styles.segmentBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#EEF2F7' }]}>
                {[
                  { key: 'stages', label: 'Stages', icon: 'trending-up' },
                  { key: 'tracks', label: 'Specializations', icon: 'star' },
                ].map((seg) => {
                  const on = activeTab === seg.key;
                  return (
                    <TouchableOpacity
                      key={seg.key}
                      activeOpacity={0.85}
                      style={[
                        styles.segmentBtn,
                        on && [styles.segmentBtnOn, { backgroundColor: themeColors.card }],
                      ]}
                      onPress={() => setActiveTab(seg.key)}
                    >
                      <Feather
                        name={seg.icon}
                        size={15}
                        color={on ? themeColors.primaryBright : themeColors.textMuted}
                      />
                      <Text
                        style={[
                          styles.segmentText,
                          { 
                            color: on ? themeColors.text : themeColors.textMuted,
                            fontWeight: on ? '800' : '600'
                          },
                        ]}
                      >
                        {seg.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </AnimatedSection>

            {/* ── Learning path — the three stages (or quotient tracks) drawn
                as one connected journey instead of three loose cards, so the
                Capacity → Capability → Leadership progression is legible at a
                glance. Both branches share this single renderer; they used to
                duplicate ~45 lines of near-identical markup. ── */}
            <View style={styles.pathWrap}>
              {(activeTab === 'stages' ? categorizedData.stages : categorizedData.tracks).map((node, idx, arr) => {
                const isTrack = activeTab === 'tracks';
                const vis = isTrack ? trackVisual(node.id) : stageVisual(node.id);
                const completed = getCourseCompletedCount(node);
                const total = node.totalCourses || node.courses.length || 0;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const unlocked = isTrack
                  ? isTrackUnlocked(node, userProgress)
                  : isStageUnlocked(node, userProgress);
                const finished = total > 0 && completed >= total;
                const started = completed > 0;
                const tint = isDark ? vis.tintDark : vis.tintLight;
                const bodyText = isDark ? '#FFFFFF' : '#0F172A';
                const mutedText = isDark ? 'rgba(255,255,255,0.62)' : '#64748B';
                const isLast = idx === arr.length - 1;

                return (
                  <Pressable
                    key={node.id}
                    onPress={() => handleStageSelect(node)}
                    style={({ pressed }) => [
                      styles.stageCard,
                      unlocked 
                        ? {
                            backgroundColor: themeColors.card,
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                            borderLeftColor: vis.accent,
                            borderLeftWidth: 4.5,
                            shadowColor: vis.accent,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: isDark ? 0.26 : 0.07,
                            shadowRadius: 18,
                            elevation: 4,
                          }
                        : {
                            backgroundColor: isDark ? '#121824' : '#F8FAFC',
                            borderColor: themeColors.border,
                            borderLeftColor: themeColors.border,
                            borderLeftWidth: 4.5,
                            opacity: 0.65,
                          },
                      {
                        opacity: pressed ? 0.90 : 1,
                      },
                    ]}
                  >
                    {/* Glowing Accent Blob in Corner */}
                    {unlocked && (
                      <View 
                        style={{
                          position: 'absolute',
                          bottom: -35,
                          right: -35,
                          width: 110,
                          height: 110,
                          borderRadius: 55,
                          backgroundColor: vis.accent,
                          opacity: isDark ? 0.12 : 0.05,
                        }} 
                        pointerEvents="none" 
                      />
                    )}

                    <View style={styles.stageTopRow}>
                      <View style={[styles.stageIconBadge, { backgroundColor: `${vis.accent}1E` }]}>
                        <Feather name={vis.icon} size={17} color={vis.accent} />
                      </View>

                      <View style={styles.stageTagWrap}>
                        <View
                          style={[
                            styles.stageTag,
                            { backgroundColor: isDark ? vis.tintDark : vis.tintLight },
                          ]}
                        >
                          <Text style={[styles.stageTagText, { color: vis.accent }]}>
                            {isTrack ? node.shortName : `STAGE ${node.id}`}
                          </Text>
                        </View>

                        {finished && (
                          <View style={[styles.stageTag, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Feather name="check-circle" size={10} color="#10B981" />
                            <Text style={[styles.stageTagText, { color: '#10B981', marginLeft: 3 }]}>
                              COMPLETED
                            </Text>
                          </View>
                        )}

                        {!unlocked && (
                          <View
                            style={[
                              styles.stageTag,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0' },
                            ]}
                          >
                            <Feather name="lock" size={10} color={mutedText} />
                            <Text style={[styles.stageTagText, { color: mutedText, marginLeft: 3 }]}>
                              LOCKED
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <Text style={[styles.stageName, { color: bodyText }]} numberOfLines={1}>
                      {node.name}
                    </Text>
                    <Text style={[styles.stageSubtitle, { color: vis.accent }]} numberOfLines={1}>
                      {isTrack ? 'Quotient specialization' : node.subtitle}
                    </Text>
                    <Text style={[styles.stageDesc, { color: mutedText }]} numberOfLines={2}>
                      {node.description}
                    </Text>

                    <View style={styles.stageProgressRow}>
                      <View
                        style={[
                          styles.stageTrack,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
                        ]}
                      >
                        <View style={[styles.stageFill, { width: `${pct}%`, backgroundColor: vis.accent }]} />
                      </View>
                      <Text style={[styles.stagePctText, { color: vis.accent }]}>{pct}%</Text>
                    </View>

                    <View style={[styles.cardDivider, { backgroundColor: themeColors.border }]} />

                    <View style={styles.stageFooter}>
                      <View style={styles.stageModuleCount}>
                        <Feather name="book-open" size={12} color={mutedText} />
                        <Text style={[styles.stageModuleText, { color: mutedText }]}>
                          {completed}/{total} modules
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.stageCta,
                          unlocked
                            ? { backgroundColor: vis.accent }
                            : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9' },
                        ]}
                      >
                        <Text style={[styles.stageCtaText, { color: unlocked ? '#FFFFFF' : mutedText }]}>
                          {!unlocked ? 'Locked' : finished ? 'Review' : started ? 'Continue' : 'Start'}
                        </Text>
                        <Feather
                          name={unlocked ? 'arrow-right' : 'lock'}
                          size={12}
                          color={unlocked ? '#FFFFFF' : mutedText}
                          style={{ marginLeft: 5 }}
                        />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          /* STAGE / DETAIL TIMELINE VIEW */
          <View style={styles.detailContainer}>
            {/* Back Button */}
            <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedStageId(null)}>
              <Feather name="arrow-left" size={16} color={themeColors.text} />
              <Text style={[styles.backBtnText, { color: themeColors.text }]}>Back to Learning Path</Text>
            </TouchableOpacity>

            {/* Stage hero — carries the accent of the card the student just
                tapped, so opening a stage reads as continuous rather than
                landing on a generic blue panel. */}
            {(() => {
              const isTrack = typeof selectedStage.id === 'string';
              const vis = isTrack ? trackVisual(selectedStage.id) : stageVisual(selectedStage.id);
              const done = getCourseCompletedCount(selectedStage);
              const total = selectedStage.totalCourses || selectedStage.courses.length || 0;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <View
                  style={[
                    styles.stageHero,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      borderLeftWidth: 4.5,
                      borderLeftColor: vis.accent,
                      shadowColor: vis.accent,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: isDark ? 0.25 : 0.08,
                      shadowRadius: 20,
                      elevation: 4,
                    },
                  ]}
                >
                  {/* Glowing Ambient Blob in Corner */}
                  <View 
                    style={{
                      position: 'absolute',
                      bottom: -40,
                      right: -40,
                      width: 120,
                      height: 120,
                      borderRadius: 60,
                      backgroundColor: vis.accent,
                      opacity: isDark ? 0.12 : 0.05,
                    }} 
                    pointerEvents="none" 
                  />

                  <View style={styles.stageHeroTop}>
                    <View style={[styles.stageIconBadge, { backgroundColor: `${vis.accent}1E` }]}>
                      <Feather name={vis.icon} size={17} color={vis.accent} />
                    </View>
                    <View
                      style={[
                        styles.stageTag,
                        { backgroundColor: isDark ? vis.tintDark : vis.tintLight },
                      ]}
                    >
                      <Text style={[styles.stageTagText, { color: vis.accent }]}>
                        {isTrack ? 'SPECIALIZATION' : `STAGE ${selectedStage.id}`}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.stageHeroName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {selectedStage.name}
                  </Text>
                  <Text
                    style={[
                      styles.stageDesc,
                      { color: isDark ? 'rgba(255,255,255,0.62)' : '#64748B' },
                    ]}
                  >
                    {selectedStage.description}
                  </Text>

                  <View style={styles.stageProgressRow}>
                    <View
                      style={[
                        styles.stageTrack,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' },
                      ]}
                    >
                      <View style={[styles.stageFill, { width: `${pct}%`, backgroundColor: vis.accent }]} />
                    </View>
                    <Text style={[styles.stagePctText, { color: vis.accent }]}>
                      {done}/{total} Modules
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* ── Course list — a continuation of the same rail used on the
                overview, carrying this stage's accent so Capacity, Capability
                and Leadership stay visually distinct all the way down. Each row
                states its status rather than leaving it to a bare chevron. ── */}
            {(() => {
              const isTrack = typeof selectedStage.id === 'string';
              const vis = isTrack ? trackVisual(selectedStage.id) : stageVisual(selectedStage.id);
              const nextUpCode = selectedStage.courses.find(
                (c) =>
                  !userProgress.completedCourses.includes(c.courseCode) &&
                  isCourseUnlockedInStage(c.courseCode, selectedStage, userProgress)
              )?.courseCode;

              return (
                <View style={styles.courseTimeline}>
                  <Text style={[styles.courseListHead, { color: themeColors.textMuted }]}>
                    {selectedStage.courses.length} MODULES IN THIS STAGE
                  </Text>

                  {selectedStage.courses.map((course, idx) => {
                    const isCompleted = userProgress.completedCourses.includes(course.courseCode);
                    const isUnlocked = isCourseUnlockedInStage(course.courseCode, selectedStage, userProgress);
                    const isNext = !isCompleted && course.courseCode === nextUpCode;
                    const isLast = idx === selectedStage.courses.length - 1;

                    const status = isCompleted
                      ? { label: 'Completed', color: '#10B981', icon: 'check-circle' }
                      : !isUnlocked
                        ? { label: 'Locked', color: themeColors.textMuted, icon: 'lock' }
                        : isNext
                          ? { label: 'Next up', color: vis.accent, icon: 'play-circle' }
                          : { label: 'Not started', color: themeColors.textMuted, icon: 'circle' };

                    return (
                      <Pressable
                        key={course._id || course.id || idx}
                        onPress={() => handleCoursePress(course, selectedStage)}
                        style={({ pressed }) => [
                          styles.courseCard,
                          isNext
                            ? {
                                backgroundColor: themeColors.card,
                                borderColor: vis.accent,
                                borderWidth: 1.5,
                                shadowColor: vis.accent,
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: isDark ? 0.2 : 0.06,
                                shadowRadius: 14,
                                elevation: 3,
                              }
                            : isUnlocked
                              ? {
                                  backgroundColor: themeColors.card,
                                  borderColor: themeColors.border,
                                  borderWidth: 1,
                                }
                              : {
                                  backgroundColor: isDark ? '#121824' : '#F8FAFC',
                                  borderColor: themeColors.border,
                                  borderWidth: 1,
                                  opacity: 0.6,
                                },
                          {
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={styles.courseCardTop}>
                          <Text style={[styles.courseCodeBadge, { color: vis.accent }]}>
                            {course.courseCode || `C${idx + 1}`}
                          </Text>
                          <View style={styles.courseStatusWrap}>
                            <Feather name={status.icon} size={11} color={status.color} />
                            <Text style={[styles.courseStatusText, { color: status.color }]}>
                              {status.label}
                            </Text>
                          </View>
                        </View>

                        <Text
                          style={[
                            styles.courseTitle,
                            { color: isUnlocked ? themeColors.text : themeColors.textMuted },
                          ]}
                          numberOfLines={2}
                        >
                          {course.title}
                        </Text>
                        <Text
                          style={[styles.courseSubtitle, { color: themeColors.textMuted }]}
                          numberOfLines={2}
                        >
                          {course.description || course.subtitle}
                        </Text>

                        <View style={[styles.courseCardFoot, { borderTopColor: themeColors.border }]}>
                          <View style={styles.courseMetaItemCapsule}>
                            <Feather name="layers" size={11} color={themeColors.textMuted} />
                            <Text style={[styles.courseMetaText, { color: themeColors.textMuted }]}>
                              7 steps
                            </Text>
                          </View>
                          <View style={styles.courseMetaItemCapsule}>
                            <Feather name="clock" size={11} color={themeColors.textMuted} />
                            <Text style={[styles.courseMetaText, { color: themeColors.textMuted }]}>
                              ~35 min
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.courseCta,
                              isCompleted
                                ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981', borderWidth: 1 }
                                : isUnlocked
                                  ? { backgroundColor: `${vis.accent}12` }
                                  : { backgroundColor: 'transparent' }
                            ]}
                          >
                            <Text
                              style={[
                                styles.courseCtaText,
                                { color: isCompleted ? '#10B981' : isUnlocked ? vis.accent : themeColors.textMuted },
                              ]}
                            >
                              {isCompleted ? 'Review' : isUnlocked ? 'Open' : 'Locked'}
                            </Text>
                            <Feather
                              name={isCompleted ? 'check-circle' : isUnlocked ? 'arrow-right' : 'lock'}
                              size={11}
                              color={isCompleted ? '#10B981' : isUnlocked ? vis.accent : themeColors.textMuted}
                            />
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })()}

            {/* Stage Gate Assessment */}
            {selectedStage.assessmentGate && (
              <View style={[styles.assessmentGateBox, { 
                backgroundColor: themeColors.card, 
                borderColor: themeColors.border,
                borderLeftWidth: 5,
                borderLeftColor: '#6366F1',
                shadowColor: '#6366F1',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDark ? 0.22 : 0.08,
                shadowRadius: 16,
                elevation: 4,
              }]}>
                <View style={[styles.gateIconWrap, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                  <Feather name="award" size={18} color="#6366F1" />
                </View>
                <View style={styles.gateTextWrap}>
                  <Text style={[styles.gateTitle, { color: themeColors.text }]}>
                    Assessment required: {selectedStage.assessmentGate}
                  </Text>
                  <Text style={[styles.gateDesc, { color: themeColors.textMuted }]}>
                    Test your understanding of stage modules to proceed.
                  </Text>
                </View>
                {userProgress.assessmentsPassed.includes(selectedStage.assessmentGate) ? (
                  <View style={styles.gatePassedBadge}>
                    <Text style={styles.gatePassedText}>PASSED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.gateBtn, { backgroundColor: '#6366F1' }]}
                    onPress={() => {
                      if (selectedStage.courses.every(c => userProgress.completedCourses.includes(c.courseCode))) {
                        navigation.navigate('Assessments');
                      } else {
                        Alert.alert('Locked 🔒', 'Please complete all courses in this stage first to unlock the assessment.');
                      }
                    }}
                  >
                    <Text style={styles.gateBtnText}>START</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ── COURSE PLAYER — full screen ──────────────────────────────────────
          A lesson is a focused task carrying a video plus eight steps and quiz
          content; the 90%-height sheet this used to be wasted the top strip,
          cramped the scroll and read as a preview rather than "I am in a
          lesson". `onRequestClose` is required for the Android back button. */}
      <Modal
        visible={courseModalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCourseModal}
      >
        <SafeAreaView
          style={[styles.playerScreen, { backgroundColor: themeColors.bg }]}
          edges={['top', 'bottom']}
        >
          <RNStatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={themeColors.bg} />

          <View style={[styles.playerHeader, { borderBottomColor: themeColors.border }]}>
            <TouchableOpacity
              onPress={closeCourseModal}
              hitSlop={10}
              style={[
                styles.playerBackBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Feather name="arrow-left" size={19} color={themeColors.text} />
            </TouchableOpacity>

            <View style={styles.playerTitleWrap}>
              <Text style={[styles.playerTitle, { color: themeColors.text }]} numberOfLines={1}>
                {selectedCourse?.title}
              </Text>
              <Text style={[styles.playerSubtitle, { color: themeColors.textMuted }]} numberOfLines={1}>
                {selectedCourse?.courseCode}
                {flow.length > 0 ? ` · Step ${activeStepIdx + 1} of ${flow.length}` : ''}
              </Text>
            </View>
          </View>

          {/* Position through the course, always visible above the content */}
          {flow.length > 0 && (
            <View
              style={[
                styles.playerProgressTrack,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#EEF2F7' },
              ]}
            >
              <View
                style={[
                  styles.playerProgressFill,
                  {
                    width: `${((activeStepIdx + 1) / flow.length) * 100}%`,
                    backgroundColor: themeColors.primaryBright,
                  },
                ]}
              />
            </View>
          )}

          <ScrollView
            ref={playerScrollRef}
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
              {(() => {
                const step = flow[activeStepIdx];
                const saved = step ? stepProgress[step.stepId] : null;

                if (flowLoading) {
                  return <SkeletonBox width="100%" height={200} borderRadius={18} style={{ marginBottom: 18 }} />;
                }

                if (flowError) {
                  return (
                    <View style={[styles.flowErrorBox, { borderColor: themeColors.border }]}>
                      <Feather name="alert-triangle" size={20} color={themeColors.danger} />
                      <Text style={[styles.flowErrorText, { color: themeColors.text }]}>{flowError}</Text>
                    </View>
                  );
                }

                if (!step) return null;

                const hasQuestions = step.questions?.length > 0;

                return (
                  <>
                    {/* Video steps play; every other authored type renders its
                        own content rather than falling back to a video frame. */}
                    {step.videoUrl ? (
                      <CourseVideoPlayer
                        // Remount on step change so the player reloads its
                        // source and resumes from that step's own timestamp.
                        key={`${selectedCourse?.courseCode}-${step.stepId}`}
                        source={step.videoUrl}
                        startAt={saved?.lastTimestamp || 0}
                        alreadyCompleted={saved?.videoCompleted || false}
                        accent={stageAccent}
                        onProgress={handleVideoProgress}
                      />
                    ) : (
                      <View style={[styles.notesStepBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Feather
                          name={
                            step.contentType === 'flashcard'
                              ? 'layers'
                              : step.contentType === 'case-study'
                                ? 'briefcase'
                                : hasQuestions
                                  ? 'help-circle'
                                  : 'file-text'
                          }
                          size={22}
                          color={stageAccent}
                        />
                        <Text style={[styles.notesStepTitle, { color: themeColors.text }]}>{step.title}</Text>
                        {!!step.caseTitle && (
                          <Text style={[styles.notesStepDesc, { color: stageAccent }]}>{step.caseTitle}</Text>
                        )}
                      </View>
                    )}

                    <View style={styles.stepMetaRow}>
                      <Text style={[styles.stepMetaTitle, { color: themeColors.text }]} numberOfLines={1}>
                        {step.stepId}. {step.title}
                      </Text>
                      <View style={[styles.stepMetaPill, { backgroundColor: themeColors.pillBg }]}>
                        <Feather name="clock" size={11} color={themeColors.primaryBright} />
                        <Text style={[styles.stepMetaPillText, { color: themeColors.primaryBright }]}>
                          {step.durationMin} min
                        </Text>
                      </View>
                    </View>

                    {!!step.content && (
                      <Text style={[styles.stepMetaDesc, { color: themeColors.textMuted }]}>{step.content}</Text>
                    )}

                    {/* ── Flash cards — tap to reveal the back ── */}
                    {step.contentType === 'flashcard' && step.cards?.length > 0 && (
                      <View style={styles.flashWrap}>
                        {step.cards.map((card, i) => {
                          const open = flippedCard === i;
                          return (
                            <Pressable
                              key={i}
                              onPress={() => setFlippedCard(open ? null : i)}
                              style={[
                                styles.flashCard,
                                {
                                  backgroundColor: open ? `${stageAccent}14` : themeColors.card,
                                  borderColor: open ? stageAccent : themeColors.border,
                                },
                              ]}
                            >
                              <Text style={[styles.flashLabel, { color: stageAccent }]}>
                                {open ? 'ANSWER' : `CARD ${i + 1}`}
                              </Text>
                              <Text style={[styles.flashText, { color: themeColors.text }]}>
                                {open ? card.back || card.answer || '' : card.front || card.question || ''}
                              </Text>
                              <Feather
                                name={open ? 'rotate-ccw' : 'eye'}
                                size={13}
                                color={themeColors.textMuted}
                                style={{ marginTop: 8 }}
                              />
                            </Pressable>
                          );
                        })}
                      </View>
                    )}

                    {/* ── Questions (quiz / advanced practice / case study) ── */}
                    {hasQuestions && (
                      <View style={styles.quizWrap}>
                        {step.questions.map((q, qi) => {
                          const picked = quizAnswers[q.id];
                          const graded = quizResult !== null && q.correctIndex !== null;
                          return (
                            <View
                              key={q.id}
                              style={[styles.quizCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                            >
                              <Text style={[styles.quizQuestion, { color: themeColors.text }]}>
                                {qi + 1}. {q.question}
                              </Text>

                              {q.options.length > 0 ? (
                                q.options.map((opt, oi) => {
                                  const isPicked = picked === oi;
                                  const isRight = graded && oi === q.correctIndex;
                                  const isWrong = graded && isPicked && oi !== q.correctIndex;
                                  return (
                                    <Pressable
                                      key={oi}
                                      disabled={quizResult !== null}
                                      onPress={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                                      style={[
                                        styles.quizOption,
                                        {
                                          borderColor: isRight
                                            ? '#10B981'
                                            : isWrong
                                              ? themeColors.danger
                                              : isPicked
                                                ? stageAccent
                                                : themeColors.border,
                                          backgroundColor: isRight
                                            ? 'rgba(16,185,129,0.10)'
                                            : isWrong
                                              ? 'rgba(239,68,68,0.10)'
                                              : isPicked
                                                ? `${stageAccent}14`
                                                : 'transparent',
                                        },
                                      ]}
                                    >
                                      <Feather
                                        name={
                                          isRight ? 'check-circle' : isWrong ? 'x-circle' : isPicked ? 'disc' : 'circle'
                                        }
                                        size={14}
                                        color={
                                          isRight
                                            ? '#10B981'
                                            : isWrong
                                              ? themeColors.danger
                                              : isPicked
                                                ? stageAccent
                                                : themeColors.textMuted
                                        }
                                      />
                                      <Text style={[styles.quizOptionText, { color: themeColors.text }]}>{opt}</Text>
                                    </Pressable>
                                  );
                                })
                              ) : (
                                <Text style={[styles.quizOpenNote, { color: themeColors.textMuted }]}>
                                  Open response — capture your answer in the reflection box below.
                                </Text>
                              )}
                            </View>
                          );
                        })}

                        {quizResult ? (
                          <View style={[styles.quizResult, { backgroundColor: `${stageAccent}14`, borderColor: stageAccent }]}>
                            <Feather name="award" size={18} color={stageAccent} />
                            <Text style={[styles.quizResultText, { color: themeColors.text }]}>
                              {quizResult.correct} / {quizResult.total} correct · {quizResult.score}/
                              {quizResult.totalPoints} points
                            </Text>
                          </View>
                        ) : (
                          step.questions.some((q) => q.correctIndex !== null) && (
                            <TouchableOpacity
                              style={[styles.quizSubmitBtn, { backgroundColor: stageAccent }]}
                              onPress={handleQuizSubmit}
                            >
                              <Text style={styles.quizSubmitText}>Submit Answers</Text>
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    )}

                    {!!step.transcription && (
                      <View style={[styles.transcriptBox, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Text style={[styles.transcriptLabel, { color: themeColors.textMuted }]}>TRANSCRIPT</Text>
                        <Text style={[styles.transcriptText, { color: themeColors.textMuted }]}>
                          {step.transcription}
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}

              {/* Learning flow — real steps from the course, with saved
                  completion ticked off. Previously a hardcoded five-item list
                  where the first two were always shown as done. */}
              {flow.length > 0 && (
                <View style={styles.learningStepsSection}>
                  <View style={styles.flowHeadRow}>
                    <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Learning Flow</Text>
                    {/* `stages` means the authored learningFlow/module content
                        wasn't available and we fell back to the server's stage
                        projection — the difference that caused mobile to show
                        placeholder content while the web showed the real thing. */}
                    <Text style={[styles.flowSourceTag, { color: themeColors.textMuted }]}>
                      {flow.length} steps{flowSource === 'stages' ? ' · fallback' : ''}
                    </Text>
                  </View>
                  {flow.map((item, idx) => {
                    // A step counts as done when its video is watched OR its
                    // quiz is submitted — non-video steps have no video flag.
                    const saved = stepProgress[item.stepId];
                    const done = saved?.videoCompleted || saved?.testCompleted;
                    const active = idx === activeStepIdx;
                    return (
                      <Pressable
                        key={item.stepId}
                        onPress={() => setActiveStepIdx(idx)}
                        style={({ pressed }) => [
                          styles.stepItem,
                          {
                            borderColor: active ? stageAccent : themeColors.border,
                            backgroundColor: active
                              ? `${stageAccent}0D`
                              : themeColors.card,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.stepCircle,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' },
                            done && { backgroundColor: '#10B981' },
                            active && !done && { backgroundColor: stageAccent },
                          ]}
                        >
                          {done ? (
                            <Feather name="check" size={11} color="#FFFFFF" />
                          ) : (
                            <Text style={[styles.stepNum, { color: active ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B') }]}>
                              {item.stepId}
                            </Text>
                          )}
                        </View>
                        <View style={styles.stepTextWrap}>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.stepTitle,
                              { color: active ? themeColors.text : (isDark ? '#CBD5E1' : '#475569') },
                              active && { fontWeight: '800' },
                            ]}
                          >
                            {item.title}
                          </Text>
                          {/* Authors often set every step's title to the course
                              name, which makes the list read as duplicates. The
                              canonical phase disambiguates without overriding
                              the authored title the web also shows. */}
                          {!!item.phase && item.phase !== item.title && (
                            <Text style={[styles.stepPhase, { color: themeColors.textMuted }]}>
                              {item.phase}
                            </Text>
                          )}
                        </View>
                        <Feather
                          name={active ? 'play-circle' : 'chevron-right'}
                          size={14}
                          color={active ? stageAccent : themeColors.textMuted}
                          style={{ marginLeft: 'auto' }}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {/* Notes Reflection */}
              <View style={styles.notesSection}>
                <Text style={[styles.sectionHeading, { color: themeColors.text }]}>Takeaways & Reflection</Text>
                <TextInput
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: themeColors.card,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  multiline
                  numberOfLines={4}
                  placeholder="Note down concepts learned from this session..."
                  placeholderTextColor={themeColors.textMuted}
                  value={notesText}
                  onChangeText={setNotesText}
                />
                <TouchableOpacity
                  disabled={notesSaving || !notesText.trim()}
                  style={[
                    styles.saveNotesBtn,
                    {
                      backgroundColor: themeColors.primaryBright,
                      opacity: notesSaving || !notesText.trim() ? 0.5 : 1,
                    },
                  ]}
                  onPress={handleSaveNotes}
                >
                  <Text style={styles.saveNotesText}>
                    {notesSaving ? 'Saving…' : 'Save Notes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Step navigation — pinned, so moving through a lesson never
                requires scrolling back up to the flow list. */}
            {flow.length > 0 && (
              <View style={[styles.playerFooter, { borderTopColor: themeColors.border, backgroundColor: themeColors.bg }]}>
                <TouchableOpacity
                  disabled={activeStepIdx === 0}
                  onPress={() => setActiveStepIdx((i) => Math.max(0, i - 1))}
                  style={[
                    styles.playerNavBtn,
                    {
                      borderColor: themeColors.border,
                      backgroundColor: themeColors.card,
                      opacity: activeStepIdx === 0 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Feather name="chevron-left" size={16} color={themeColors.text} />
                  <Text style={[styles.playerNavText, { color: themeColors.text }]}>Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={activeStepIdx >= flow.length - 1}
                  onPress={() => setActiveStepIdx((i) => Math.min(flow.length - 1, i + 1))}
                  style={[
                    styles.playerNavBtn,
                    styles.playerNavBtnPrimary,
                    {
                      backgroundColor: themeColors.primaryBright,
                      opacity: activeStepIdx >= flow.length - 1 ? 0.4 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.playerNavText, { color: '#FFFFFF' }]}>Next Step</Text>
                  <Feather name="chevron-right" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  auroraBlob: {
    position: 'absolute',
  },

  // ── Header (kept dimensionally identical to HomeScreen's) ──
  headerContainer: {
    paddingTop: 4,
    paddingBottom: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerTitleWrap: {
    marginLeft: 12,
    flex: 1,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 1,
  },
  headerHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  avatarRingWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInnerCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // ── Search ──
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  searchResultCount: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  searchResultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  searchResultMeta: {
    fontSize: 11,
    fontWeight: '500',
  },

  // ── Continue Learning progress ──
  heroProgressWrap: {
    marginTop: 10,
    marginBottom: 4,
  },
  heroProgressBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroProgressText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },

  // ── Journey card (overall progress + counters + CGPA entry) ──
  journeyCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 22,
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  journeyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  journeyEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  journeyTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  journeyPctWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  journeyPct: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1,
  },
  journeyPctSign: {
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 1,
  },
  journeyTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  journeyFill: {
    height: '100%',
    borderRadius: 4,
  },
  journeyCaption: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 8,
  },
  journeyDivider: {
    height: 1,
    marginVertical: 16,
  },
  // ── Learning tools ──
  toolsGrid: {
    gap: 10,
    marginBottom: 20,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  toolSub: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 1,
  },

  journeyStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journeyStat: {
    flex: 1,
    alignItems: 'center',
  },
  journeyStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  journeyStatValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  journeyStatLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  journeyStatDivider: {
    width: 1,
    height: 40,
  },
  cgpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 11,
  },
  cgpaIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cgpaTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  cgpaSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  // ── Section header + segmented control ──
  sectionHead: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  sectionSub: {
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 3,
  },
  segmentBar: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 5,
    marginBottom: 20,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 20,
    gap: 8,
  },
  segmentBtnOn: {
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13.5,
  },

  // ── Learning path (rail + stage cards) ──
  pathWrap: {
    marginBottom: 8,
  },
  pathRow: {
    flexDirection: 'row',
  },
  pathRail: {
    width: 36,
    alignItems: 'center',
  },
  pathNodeContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  pathNodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathNodeCircleActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathNodeCircleActiveInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pathNodeActiveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pathNodeCircleLocked: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathConnector: {
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  stageCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    paddingLeft: 20,
    marginBottom: 14,
    position: 'relative',
    overflow: 'visible', // allows shadows to show
  },
  stageWatermark: {
    position: 'absolute',
    right: 12,
    top: -14,
    fontSize: 84,
    fontWeight: '900',
    opacity: 0.07,
    letterSpacing: -4,
  },
  stageTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  stageIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  stageTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stageTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  stageName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  stageSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  stageDesc: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
  },
  stageProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  stageTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  stageFill: {
    height: '100%',
    borderRadius: 4,
  },
  stagePctText: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 34,
    textAlign: 'right',
  },
  cardDivider: {
    height: 1,
    marginVertical: 14,
  },
  stageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stageModuleCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stageModuleText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  stageCta: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  stageCtaText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Course player / learning-flow modal ──
  flowErrorBox: {
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 18,
  },
  flowErrorText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  notesStepBox: {
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notesStepTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  notesStepDesc: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 14,
  },
  stepMetaTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepMetaPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepMetaDesc: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 6,
  },

  stepTextWrap: {
    flex: 1,
  },
  stepPhase: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  flowHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  flowSourceTag: {
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Flash cards ──
  flashWrap: {
    marginTop: 16,
    gap: 10,
  },
  flashCard: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  flashLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  flashText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Quiz / practice questions ──
  quizWrap: {
    marginTop: 16,
    gap: 12,
  },
  quizCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 2,
  },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 10,
  },
  quizOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  quizOpenNote: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  quizSubmitBtn: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  quizSubmitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  quizResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  quizResultText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },

  // ── Transcript ──
  transcriptBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  transcriptLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  transcriptText: {
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 19,
  },

  // ── Stage detail hero ──
  stageHero: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    paddingLeft: 22,
    marginBottom: 20,
    position: 'relative',
    overflow: 'visible', // allows shadows to show
  },
  stageHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  stageHeroName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  dashboardContainer: {
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  heroTextContent: {
    flex: 1,
    paddingRight: 8,
  },
  heroLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E1B4B',
    marginTop: 4,
  },
  heroDesc: {
    fontSize: 11,
    color: '#4338CA',
    lineHeight: 15,
    marginTop: 6,
    marginBottom: 16,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '850',
  },
  heroGraphic: {
    width: 68,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* DETAILS SCREEN */
  detailContainer: {
    marginTop: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    marginLeft: 6,
  },
  courseTimeline: {
    marginTop: 2,
  },
  courseListHead: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  courseRow: {
    flexDirection: 'row',
  },
  courseRail: {
    width: 36,
    alignItems: 'center',
  },
  courseConnector: {
    flex: 1,
    marginVertical: 4,
    borderRadius: 1,
  },
  courseCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    overflow: 'visible', // allows active shadow glow to show
  },
  courseCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  courseCodeBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  courseStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  courseSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
    marginTop: 4,
  },
  courseCardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    marginTop: 12,
    paddingTop: 11,
  },
  courseMetaItemCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.15)',
    backgroundColor: 'rgba(128,128,128,0.05)',
  },
  courseMetaText: {
    fontSize: 11,
    fontWeight: '600',
  },
  courseCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  courseCtaText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  assessmentGateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 14,
    marginTop: 20,
  },
  gateIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateTextWrap: {
    marginLeft: 12,
    flex: 1,
    marginRight: 8,
  },
  gateTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  gateDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  gateBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  gateBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  gatePassedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  gatePassedText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },

  /* MODALS & OVERLAYS */
  // ── Full-screen course player shell ──
  playerScreen: {
    flex: 1,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  playerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTitleWrap: {
    flex: 1,
  },
  playerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  playerSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 1,
  },
  playerProgressTrack: {
    height: 3,
    width: '100%',
  },
  playerProgressFill: {
    height: '100%',
  },
  playerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  playerNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  playerNavBtnPrimary: {
    borderWidth: 0,
  },
  playerNavText: {
    fontSize: 13.5,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1.5,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    padding: 20,
  },
  learningStepsSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNum: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesSection: {
    marginBottom: 10,
  },
  notesInput: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    fontSize: 12.5,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveNotesBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  saveNotesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  /* CGPA CALCULATOR */
  cgpaIntro: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 16,
  },
  semesterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  semesterNum: {
    fontSize: 12.5,
    fontWeight: '850',
    width: 50,
  },
  cgpaInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 12.5,
  },
  addSemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
    marginTop: 8,
  },
  addSemText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  calcBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  calcBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  cgpaResultBox: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  cgpaResultLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  cgpaResultVal: {
    fontSize: 32,
    fontWeight: '900',
    color: '#10B981',
    marginTop: 4,
  },
});
