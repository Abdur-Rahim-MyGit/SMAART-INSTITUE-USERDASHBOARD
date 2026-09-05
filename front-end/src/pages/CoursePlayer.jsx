import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
// Material Symbols barrel -- the same icon set the dashboard, sidebar, courses
// list and profile use. This page pulled straight from lucide-react, which is
// why its icons read at a different weight and optical size to every other
// screen. Aliases keep the existing JSX call sites unchanged.
import {
  IconArrowLeft as ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  Lock,
  ChevronRight,
  PlayCircle,
  FileText,
  ClipboardList as StickyNote,
  Sparkles,
  Star,
  RiAlertLine as AlertTriangle,
  IconId as Fingerprint,
  ShieldCheck,
  Check,
  ClipboardCheck,
  Play,
  HelpCircle,
  Layers,
  Briefcase,
  FitScreen,
} from "@/components/icons";
import { useTranslation } from "react-i18next";
import NeuralBackground from "@/components/ui/NeuralBackground";
import CustomVideoPlayer from "@/components/CustomVideoPlayer";
import MCQPractice from "@/components/MCQPractice";
import FlashcardTask from "@/components/FlashcardTask";
import AdvancedPractice from "@/components/AdvancedPractice";
import CaseStudy from "@/components/CaseStudy";
import Notes from "@/components/Notes";
import MicroAssessment from "@/components/MicroAssessment";
import ActivityWarningModal from "@/components/ActivityWarningModal";
import FloatingDictionary from "@/components/FloatingDictionary";
import useUser from "@/hooks/useUser";
import useActivityRestrictions from "@/hooks/useActivityRestrictions";
import { InlineNotes } from "@/components/FloatingNotes";
import SyncedTranscript from "@/components/SyncedTranscript";
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK, BC_TRACK } from "@/data/courseStructureData";
import { getLearningFlowData } from "@/data/learningFlowData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { coursesAPI, courseEnrollmentAPI } from "@/services/api";
import { buildFlowFromCourse, buildFlowFromLearningFlow, TEMP_VIDEO_URL } from "@/utils/courseStages";
import { mergeAdminQuizzesIntoFlow } from "@/utils/microAssessmentUtils";
import { markCourseCompleted } from "@/utils/courseProgressStorage";
import Confetti from 'react-confetti';
import { HexBadgeSVG, resolveColors } from "@/components/badges/BadgeCard";
import { compareCourseIds, resolveStaticCourseTitle, canAccessCourse, normalizeCourseId } from "@/utils/courseUnlock";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";

const getCourseCategory = (courseId) => {
  // Normalize CRS-prefixed DB ids (e.g. CRS00026) to their static id (PIQ01)
  // first, so courses opened via their Mongo/CRS id are categorized the same
  // way as courses opened via their static id.
  const cid = String(normalizeCourseId(courseId) || courseId || '').toUpperCase();
  if (cid.startsWith('PIQ')) return 'piq';
  if (cid.startsWith('AIQ')) return 'aiq';
  if (cid.startsWith('SQ')) return 'sq';
  const numPart = parseInt(cid.replace(/\D/g, ''), 10);
  if (!isNaN(numPart)) {
    if (numPart <= 10) return 'capacity';
    if (numPart <= 19) return 'capability';
    return 'leadership';
  }
  return 'capacity';
};

const getStepIcon = (step, stepData, status, isActive) => {
  if (status === 'completed') {
    return <CheckCircle2 className="w-4 h-4" />;
  }
  if (status === 'locked') {
    return <Lock className="w-3.5 h-3.5" />;
  }

  const title = (stepData?.title || "").toLowerCase();
  const contentType = stepData?.contentType || "";

  if (title.includes("flash card") || title.includes("flashcard")) {
    return <Layers className="w-4 h-4" />;
  }
  if (title.includes("practice") || title.includes("quiz") || contentType === 'quiz' || stepData?.assessmentData) {
    return <HelpCircle className="w-4 h-4" />;
  }
  if (title.includes("case study") || title.includes("case-study")) {
    return <Briefcase className="w-4 h-4" />;
  }
  if (title.includes("self-reflection") || title.includes("reflection")) {
    return <Sparkles className="w-4 h-4" />;
  }
  if (contentType === 'notes') {
    return <FileText className="w-4 h-4" />;
  }

  return <Play fill={1} className="w-3.5 h-3.5" />;
};

/* One theme for every stage and track. The player carried a per-stage rainbow
   (indigo / teal / purple / violet / emerald) that matched nothing else in the
   product -- the dashboard, courses list and profile are all one brand blue. */
const COURSE_THEME = {
  badgeBg:
    "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] border border-[#045C9A]/20 dark:border-[#045C9A]/40",
  btnClass:
    "bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none",
};

/* Pre-start acknowledgements. Every item must be ticked before the learning
   journey can begin; the copy lives in translation.json under course_player. */
const COURSE_GUIDELINES = [
  {
    id: "active_engagement",
    titleKey: "course_player.guideline_engagement_title",
    titleDefault: "Active Engagement",
    textKey: "course_player.guideline_engagement_text",
    textDefault: "User inactivity of 5 minutes or more is automatically recorded for security & progress validation.",
  },
  {
    id: "academic_integrity",
    titleKey: "course_player.guideline_integrity_title",
    titleDefault: "Academic Integrity",
    textKey: "course_player.guideline_integrity_text",
    textDefault: "All assessments and reflections must be completed independently by the enrolled student.",
  },
  {
    id: "sequential_order",
    titleKey: "course_player.guideline_sequence_title",
    titleDefault: "Sequential Order",
    textKey: "course_player.guideline_sequence_text",
    textDefault: "Lessons must be completed in order to unlock subsequent modules and assessments.",
  },
  {
    id: "certification_eligibility",
    titleKey: "course_player.guideline_certification_title",
    titleDefault: "Certification Eligibility",
    textKey: "course_player.guideline_certification_text",
    textDefault: "Official course completion is granted upon meeting all required milestone criteria.",
  },
];

/* Theater mode (YouTube style): the video takes the full content width and the
   curriculum drops below it. It is per visit: every course opens in the default
   view. */
/* One easing for every element that moves when theater mode toggles, so the
   video, the lesson card and the curriculum all settle together. */
const LAYOUT_TRANSITION = { layout: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } };
const getCourseById = (courseId) => {
  const allCourses = [
    ...STAGE_1_COURSES,
    ...STAGE_2_COURSES,
    ...STAGE_3_COURSES,
    ...PIQ_TRACK,
    ...AIQ_TRACK,
    ...SQ_TRACK,
    ...BC_TRACK,
  ];
  return allCourses.find(course => course.id === courseId);
};

const CoursePlayer = () => {
  const { courseId } = useParams();
  const { user: currentUser } = useUser();
  const { userProgress, loading: globalProgressLoading } = useSmaartCourseProgress(currentUser?._id || currentUser?.id);
  const navigate = useNavigate();
  const [videoProgress, setVideoProgress] = useState(0);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const loading = loadingCourse || loadingProgress;
  const [dynamicFlow, setDynamicFlow] = useState(null);
  const [totalSteps, setTotalSteps] = useState(9);
  const [showIntro, setShowIntro] = useState(true);
  const [acknowledgedGuidelines, setAcknowledgedGuidelines] = useState({});
  const [isTheater, setIsTheater] = useState(false);
  // This page is its own scroll container (h-screen overflow-y-auto), so
  // window.scrollTo has no effect here; scroll the root element instead.
  const pageRef = useRef(null);
  const scrollPageToTop = (behavior = "smooth") => {
    const el = pageRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0, left: 0, behavior });
    } else if (el) {
      el.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior });
  };
  const toggleTheater = () => setIsTheater((prev) => !prev);
  const acknowledgedCount = COURSE_GUIDELINES.filter((g) => acknowledgedGuidelines[g.id]).length;
  const allGuidelinesAcknowledged = acknowledgedCount === COURSE_GUIDELINES.length;
  const toggleGuideline = (id) =>
    setAcknowledgedGuidelines((prev) => ({ ...prev, [id]: !prev[id] }));
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [activeTab, setActiveTab] = useState('preview');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [currentVideoDuration, setCurrentVideoDuration] = useState(0);
  const [showCongratulation, setShowCongratulation] = useState(false);
  const [congratulationAcknowledged, setCongratulationAcknowledged] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  });

  // The constellation canvas paints itself from a theme prop rather than CSS,
  // so it has to be told when the dark class flips -- same observer the
  // dashboard and courses pages use.
  const [isDarkTheme, setIsDarkTheme] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [videoWatched, setVideoWatched] = useState(false);
  const { t } = useTranslation();

  const [courseMeta, setCourseMeta] = useState({ courseCode: null, courseDbId: null });
  const [taskResultsByDay, setTaskResultsByDay] = useState({});
  const [dbCourse, setDbCourse] = useState(null);
  const staticCourse = getCourseById(courseId);

  // Route progression/unlock gating check. Runs once the course-fetch attempt
  // has settled (loading === false covers both success and failure via the
  // loadCourseFromApi `finally` below), not only when dbCourse resolved —
  // otherwise a failed/404 course lookup skipped this check entirely and let
  // a locked course load anyway.
  useEffect(() => {
    if (!loading && !globalProgressLoading && userProgress) {
      const allowed = canAccessCourse(dbCourse?.courseCode || courseId, userProgress, dbCourse);
      if (!allowed) {
        toast.error(t("course_player.locked_toast", "This course is locked. Please complete the prerequisites first."));
        navigate("/dashboard/courses");
      }
    }
  }, [loading, globalProgressLoading, dbCourse, userProgress, courseId, navigate, t]);

  const { stageKey, stageNameKey, typeKey } = useMemo(() => {
    const courseCode = dbCourse?.courseCode || courseId || '';
    const courseNumber = dbCourse?.courseNumber || '';
    const category = dbCourse?.category || '';
    const titleLower = (dbCourse?.title || '').toLowerCase();

    const isPIQ = category.toLowerCase() === 'piq' || 
                  courseCode.startsWith('PIQ') || 
                  courseNumber.startsWith('PIQ') ||
                  titleLower.includes('mindset') ||
                  titleLower.includes('confidence') ||
                  titleLower.includes('motivation') ||
                  titleLower.includes('adaptability') ||
                  titleLower.includes('personal branding') ||
                  titleLower.includes('branding');
                  
    const isAIQ = category.toLowerCase() === 'aiq' || 
                  courseCode.startsWith('AIQ') || 
                  courseNumber.startsWith('AIQ') ||
                  titleLower.includes('ai ') ||
                  titleLower.includes(' ai') ||
                  titleLower.includes('prompt') ||
                  titleLower.includes('artificial intelligence');
                  
    const isSQ = category.toLowerCase() === 'sq' || 
                 courseCode.startsWith('SQ') || 
                 courseNumber.startsWith('SQ') ||
                 titleLower.includes('sustain') ||
                 titleLower.includes('ethical') ||
                 titleLower.includes('citizenship') ||
                 titleLower.includes('responsibility');

    if (isPIQ) {
      return { stageKey: 'course_player.stages.piq_track', stageNameKey: 'course_player.stages.personal_intelligence', typeKey: 'piq' };
    }
    if (isAIQ) {
      return { stageKey: 'course_player.stages.aiq_track', stageNameKey: 'course_player.stages.ai_readiness', typeKey: 'aiq' };
    }
    if (isSQ) {
      return { stageKey: 'course_player.stages.sq_track', stageNameKey: 'course_player.stages.sustainability', typeKey: 'siq' };
    }

    const codeNumStr = (courseNumber || courseCode).replace(/\D/g, '');
    const codeNum = parseInt(codeNumStr, 10);
    const isS = courseCode.startsWith('S') || courseNumber.startsWith('S');

    if (category.toLowerCase() === 'capacity' || (isS && codeNum <= 10) || codeNum <= 10) {
      return { stageKey: 'course_player.stages.stage_1', stageNameKey: 'course_player.stages.capacity', typeKey: 'capacity' };
    }
    if (category.toLowerCase() === 'capability' || (isS && codeNum <= 19) || codeNum <= 19) {
      return { stageKey: 'course_player.stages.stage_2', stageNameKey: 'course_player.stages.capability', typeKey: 'capability' };
    }
    if (category.toLowerCase() === 'leadership' || (isS && codeNum <= 25) || codeNum <= 25) {
      return { stageKey: 'course_player.stages.stage_3', stageNameKey: 'course_player.stages.leadership', typeKey: 'leadership' };
    }

    if (STAGE_1_COURSES.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.stage_1', stageNameKey: 'course_player.stages.capacity', typeKey: 'capacity' };
    }
    if (STAGE_2_COURSES.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.stage_2', stageNameKey: 'course_player.stages.capability', typeKey: 'capability' };
    }
    if (STAGE_3_COURSES.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.stage_3', stageNameKey: 'course_player.stages.leadership', typeKey: 'leadership' };
    }
    if (PIQ_TRACK.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.piq_track', stageNameKey: 'course_player.stages.personal_intelligence', typeKey: 'piq' };
    }
    if (AIQ_TRACK.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.aiq_track', stageNameKey: 'course_player.stages.ai_readiness', typeKey: 'aiq' };
    }
    if (SQ_TRACK.find(c => c.id === courseId)) {
      return { stageKey: 'course_player.stages.sq_track', stageNameKey: 'course_player.stages.sustainability', typeKey: 'siq' };
    }

    return { stageKey: 'course_player.stages.unknown', stageNameKey: 'course_player.stages.unknown', typeKey: 'unknown' };
  }, [dbCourse, courseId]);

  const currentTheme = COURSE_THEME;

  const formattedDisplayType = useMemo(() => {
    if (typeKey === 'aiq' || typeKey === 'piq' || typeKey === 'siq') {
      return typeKey.toUpperCase();
    }
    return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
  }, [typeKey]);

  const staticFlow = getLearningFlowData(courseId);
  const learningFlowData = dynamicFlow || staticFlow;
  // Theater widens every step to a single column with the curriculum below.
  // Only steps with a video also get the YouTube-style black band; quizzes,
  // flash cards and practice keep their card and simply use the full width.
  const activeStepData = activeStep ? learningFlowData?.steps?.[activeStep] : null;
  const activeStepHasVideo =
    activeStepData?.contentType === 'video-text' ||
    (activeStepData?.contentType === 'notes' && !!activeStepData?.videoUrl);
  const theaterLayout = isTheater;
  const theaterBand = isTheater && activeStepHasVideo;

  const isCompleted = useMemo(() => {
    if (!totalSteps) return false;
    const stepsCount = Object.keys(learningFlowData?.steps || {}).length || totalSteps;
    if (stepsCount <= 0) return false;
    const allSteps = Array.from({ length: stepsCount }, (_, i) => String(i + 1));
    return allSteps.every(step => completedSteps[step]);
  }, [completedSteps, totalSteps, learningFlowData]);
  const course =
    staticCourse ||
    (dynamicFlow
      ? {
        id: courseId,
        title: dynamicFlow.overviewTitle || courseId,
        subtitle: dynamicFlow.overview || ''
      }
      : null);
  const stepNumbers = Array.from({ length: totalSteps }, (_, i) => String(i + 1));
  const lastStepKey = String(totalSteps);

  useEffect(() => {
    let cancelled = false;

    const loadCourseFromApi = async () => {
      setLoadingCourse(true);
      setDynamicFlow(null);
      setTotalSteps(9);

      try {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(courseId);
        const [courseRes, stagesRes] = await Promise.all([
          coursesAPI.getByCatalog(courseId).catch(() =>
            isObjectId
              ? coursesAPI.getById(courseId).catch(() => null)
              : coursesAPI.getByCode(courseId).catch(() => null)
          ),
          coursesAPI.getStages(courseId).catch(() => null),
        ]);

        if (cancelled) return;

        const dbCourse = courseRes?.data;
        if (dbCourse) {
          setDbCourse(dbCourse);
        }
        const baseStaticFlow = getLearningFlowData(courseId);

        if (dbCourse) {
          let flow;
          const lf = dbCourse.learningFlow;
          const hasLearningFlow = lf && (
            lf.stepA_Why ||
            lf.stepB_Story ||
            lf.stepC_Framework ||
            lf.stepD_Practice ||
            lf.stepE_FlashCard ||
            lf.stepF_AdvancedPractice
          );

          if (hasLearningFlow) {
            flow = buildFlowFromLearningFlow(dbCourse);
          } else {
            flow = baseStaticFlow
              ? { ...baseStaticFlow, overviewTitle: dbCourse.title || baseStaticFlow.overviewTitle }
              : buildFlowFromCourse(dbCourse);

            if (dbCourse.status === 'active' && dbCourse.modules?.[0]?.days?.length) {
              const dbFlow = buildFlowFromCourse(dbCourse);
              flow = {
                ...flow,
                ...dbFlow,
                overviewTitle: dbCourse.title || flow.overviewTitle,
                steps: { ...(flow.steps || {}), ...dbFlow.steps },
              };
            }
            flow = mergeAdminQuizzesIntoFlow(flow, dbCourse);
          }

          const stepCount = Object.keys(flow.steps || {}).length || 9;
          setDynamicFlow(flow);
          setTotalSteps(stepCount);
          setCourseMeta({
            courseCode: dbCourse.courseCode || courseId,
            courseDbId: dbCourse._id,
          });
        } else if (stagesRes?.data?.length) {
          const steps = {};
          stagesRes.data.forEach((stage, index) => {
            const stepKey = String(index + 1);
            const isNotes = index === 6;
            const videoUrl = isNotes ? null : (stage.videoUrl || null);
            steps[stepKey] = {
              title: stage.title,
              duration: `${stage.duration || 5} min`,
              contentType: isNotes ? 'notes' : 'video-text',
              videoUrl,
              content: stage.description || '',
              transcription: stage.transcription || ''
            };
          });
          setDynamicFlow({
            overview: stagesRes.courseTitle || '',
            overviewTitle: stagesRes.courseTitle,
            steps,
            totalSteps: stagesRes.stageCount || stagesRes.data.length
          });
          setTotalSteps(stagesRes.stageCount || stagesRes.data.length);
        }
      } catch (err) {
        console.warn('Using static course flow:', err.message);
      } finally {
        if (!cancelled) setLoadingCourse(false);
      }
    };

    loadCourseFromApi();
    return () => { cancelled = true; };
  }, [courseId]);

  useEffect(() => {
    const studentId = currentUser?._id || currentUser?.id;
    if (!studentId || !courseMeta.courseDbId) return;

    let cancelled = false;

    const loadEnrollmentResults = async () => {
      try {
        const res = await courseEnrollmentAPI.getByStudentAndCourse(
          studentId,
          courseMeta.courseDbId
        );
        if (cancelled || !res?.success || !res.data?.length) return;

        const enrollment = res.data[0];
        const byDay = {};
        (enrollment.moduleProgress || []).forEach((mp) => {
          (mp.taskResults || []).forEach((tr) => {
            byDay[tr.dayId] = {
              ...tr,
              isCompleted: true,
            };
          });
        });
        setTaskResultsByDay(byDay);
      } catch (err) {
        console.warn('Could not load quiz results:', err.message);
      }
    };

    loadEnrollmentResults();
    return () => { cancelled = true; };
  }, [currentUser, courseMeta.courseDbId]);

  // Activity restrictions monitoring
  const {
    warningsCount,
    maxWarnings,
    isWarningVisible,
    lastViolationType,
    acknowledgeWarning
  } = useActivityRestrictions({
    courseId,
    isActive: !loading && !!course
  });

  const [userProgressData, setUserProgressData] = useState({});

  useEffect(() => {
    setShowIntro(true);
    setActiveStep(null);
    setCompletedSteps({});
    setShowCongratulation(false);
    setCongratulationAcknowledged(false);
    setVideoProgress(0);
    setCurrentVideoTime(0);
    setCurrentVideoDuration(0);
    setVideoWatched(false);
    scrollPageToTop("auto");

    if (courseId) {
      const userId = currentUser?._id || currentUser?.id || 'anon';
      const courseData = staticCourse || { title: learningFlowData?.overviewTitle || courseId };
      localStorage.setItem(`${userId}_smaart_last_watched_course`, courseId);
      localStorage.setItem(`${userId}_smaart_last_watched_title`, courseData.title || courseId);
      localStorage.setItem(`${userId}_smaart_last_watched_lesson`, courseData.title || courseId);
      localStorage.setItem(`${userId}_smaart_course_progress`, "0");
    }

    // ── Fetch detailed user progress from backend ──
    const fetchProgress = async () => {
      if (!courseId) {
        setLoadingProgress(false);
        return;
      }
      setLoadingProgress(true);
      try {
        const response = await courseEnrollmentAPI.getUserProgress(courseId);
        if (response && response.success && response.data) {
          const progressMap = {};
          const completedMap = {};

          response.data.forEach(item => {
            const stepKey = String(item.stepId);

            // Restore step completion if video is completed, assignment is submitted, or test is completed
            if (item.videoCompleted || item.assignmentStatus === 'Submitted' || item.testCompleted) {
              completedMap[stepKey] = true;
            }

            progressMap[stepKey] = {
              last_timestamp: item.last_timestamp || 0,
              videoDuration: item.videoDuration || 0,
              videoCompleted: item.videoCompleted || false,
              assignmentStatus: item.assignmentStatus || 'Not Started',
              assignmentProgress: item.assignmentProgress || 0,
              testScore: item.testScore,
              testTotalPoints: item.testTotalPoints,
              testCompleted: item.testCompleted || false
            };
          });

          setCompletedSteps(completedMap);
          setUserProgressData(progressMap);
        }
      } catch (err) {
        console.error("Failed to load user progress:", err);
      } finally {
        setLoadingProgress(false);
      }
    };
    fetchProgress();
  }, [courseId]);

  // Keep localStorage progress in sync with player state
  useEffect(() => {
    if (!courseId || totalSteps <= 0) return;
    const stepsDone = Object.keys(completedSteps).length;
    const pct = Math.round((stepsDone / totalSteps) * 100);
    const userId = currentUser?._id || currentUser?.id || 'anon';
    localStorage.setItem(`${userId}_smaart_course_progress`, String(pct));
  }, [completedSteps, totalSteps, courseId]);

  const handleStartStep = async (stepNumber) => {
    if (!courseId || !stepNumber) return;
    const stepKey = String(stepNumber);
    const currentStatus = userProgressData[stepKey]?.assignmentStatus;

    // Only update if it is not already 'Submitted' or 'In Progress'
    if (currentStatus !== 'Submitted' && currentStatus !== 'In Progress') {
      try {
        const response = await courseEnrollmentAPI.saveUserProgress({
          courseCode: courseId,
          moduleId: '1',
          dayId: 1,
          stepId: parseInt(stepNumber),
          assignmentStatus: 'In Progress',
          assignmentProgress: 50
        });

        if (response && response.success) {
          setUserProgressData(prev => ({
            ...prev,
            [stepKey]: {
              ...prev[stepKey],
              assignmentStatus: 'In Progress',
              assignmentProgress: 50
            }
          }));
        }
      } catch (err) {
        console.error("Failed to set assignment in progress:", err);
      }
    }
  };

  const handleStartCourse = () => {
    if (!allGuidelinesAcknowledged) {
      toast.warning(t("course_player.acknowledge_all_guidelines", "Please acknowledge all guidelines to continue."));
      return;
    }
    setShowIntro(false);
    const allDone = stepNumbers.every(step => completedSteps[step]);
    const resumeStep = stepNumbers.find(step => !completedSteps[step]) || (allDone ? lastStepKey : '1');
    setActiveStep(resumeStep);
    setVideoWatched(false);
    handleStartStep(resumeStep);
    // Wait one frame so the lesson view has replaced the intro before scrolling.
    requestAnimationFrame(() => scrollPageToTop("auto"));
  };

  const handleStepClick = (stepNumber) => {
    if (!isStepLocked(stepNumber)) {
      const isActivating = activeStep !== stepNumber;
      setActiveStep(activeStep === stepNumber ? null : stepNumber);
      setVideoWatched(false);
      if (isActivating) {
        handleStartStep(stepNumber);
        requestAnimationFrame(() => scrollPageToTop("smooth"));
      }
    } else {
      toast.error(t("course_player.step_locked_warning", { step: parseInt(stepNumber) - 1 }));
    }
  };

  const handleStepComplete = async (stepNumber, score = null, totalPoints = null, autoAdvance = true) => {
    const newCompletedSteps = { ...completedSteps, [stepNumber]: true };
    setCompletedSteps(newCompletedSteps);

    // Save completion state to server!
    if (courseId) {
      try {
        await courseEnrollmentAPI.saveUserProgress({
          courseCode: courseId,
          moduleId: '1',
          dayId: 1,
          stepId: parseInt(stepNumber),
          assignmentStatus: 'Submitted',
          assignmentProgress: 100,
          testScore: score,
          testTotalPoints: totalPoints,
          testCompleted: score !== null
        });

        // Update local progress data
        setUserProgressData(prev => ({
          ...prev,
          [stepNumber]: {
            ...prev[stepNumber],
            assignmentStatus: 'Submitted',
            assignmentProgress: 100,
            testScore: score,
            testTotalPoints: totalPoints,
            testCompleted: score !== null
          }
        }));
      } catch (err) {
        console.error("Failed to save step completion to server:", err);
      }
    }

    // ── Save progress to localStorage for MyCourses continue watching ──
    const stepsDone = Object.keys(newCompletedSteps).length;
    const pct = Math.round((stepsDone / totalSteps) * 100);
    const courseData = staticCourse || { title: courseId };
    const currentStepData = learningFlowData?.steps?.[stepNumber];
    const userId = currentUser?._id || currentUser?.id || 'anon';
    localStorage.setItem(`${userId}_smaart_course_progress`, String(pct));
    localStorage.setItem(`${userId}_smaart_last_watched_lesson`,
      currentStepData?.title || (courseData?.title + ' — Step ' + stepNumber) || courseId
    );

    // Sync to DB
    if (currentUser) {
      try {
        await courseEnrollmentAPI.updateTaskProgress({
          studentId: currentUser._id || currentUser.id,
          courseCode: courseId,
          moduleId: 1,
          dayId: parseInt(stepNumber),
          taskId: 1,
          completed: true
        });
      } catch (err) {
        console.error("Error saving step task progress to DB:", err);
      }
    }

    const allCompleted = stepNumbers.every((step) => newCompletedSteps[step]);
    if (allCompleted) {
      setShowCongratulation(true);
      // Keep activeStep on the just-finished (last) step so the content pane
      // keeps showing it once the congrats modal is dismissed — nulling it
      // out here used to strand users on a blank pane with no way forward.
      const userId = currentUser?._id || currentUser?.id || 'anon';
      localStorage.setItem(`${userId}_smaart_course_progress`, '100');
      markCourseCompleted(courseId);
    } else if (autoAdvance) {
      // Auto-advance to next step
      const nextStep = (parseInt(stepNumber) + 1).toString();
      setActiveStep(nextStep);
      setVideoWatched(false);
      handleStartStep(nextStep);
    }
  };


  const isStepLocked = (stepNumber) => {
    const num = parseInt(stepNumber);
    if (isNaN(num) || num <= 1) return false;
    // Step is locked if the previous step is not completed
    const prevStepKey = String(num - 1);
    return !completedSteps[prevStepKey];
  };

  const getStepStatus = (stepNumber) => {
    if (completedSteps[stepNumber]) return 'completed';
    if (isStepLocked(stepNumber)) return 'locked';
    return 'available';
  };

  const handleBack = () => {
    navigate('/dashboard/courses');
  };

  const handleVideoProgressUpdate = async (maxTime, completed, duration) => {
    setVideoProgress(maxTime);
    if (completed) setVideoWatched(true);

    if (courseId && activeStep) {
      try {
        await courseEnrollmentAPI.saveUserProgress({
          courseCode: courseId,
          moduleId: '1',
          dayId: 1,
          stepId: parseInt(activeStep),
          last_timestamp: maxTime,
          videoDuration: duration,
          videoCompleted: completed
        });

        // Update local progress data
        setUserProgressData(prev => ({
          ...prev,
          [activeStep]: {
            ...prev[activeStep],
            last_timestamp: maxTime,
            videoDuration: duration,
            videoCompleted: completed
          }
        }));
      } catch (err) {
        console.error("Failed to save video progress to server:", err);
      }

      // Also sync into the main CourseEnrollment record so admin reporting
      // (moduleProgress[].videoProgress) reflects real watch engagement —
      // saveUserProgress above only writes the separate UserProgress model
      // that this player uses to resume, it isn't read by that reporting.
      const studentId = currentUser?._id || currentUser?.id;
      if (studentId && courseMeta.courseDbId) {
        try {
          await courseEnrollmentAPI.updateVideoProgress({
            studentId,
            courseCode: courseMeta.courseCode || courseId,
            moduleId: '1',
            dayId: 1,
            stepId: parseInt(activeStep),
            maxWatchedTime: maxTime,
            videoDuration: duration,
            isCompleted: completed
          });
        } catch (err) {
          console.error("Failed to sync video progress to enrollment record:", err);
        }
      }
    }
  };

  const handleNextLesson = () => {
    // Find current course index
    const allCourses = [
      ...STAGE_1_COURSES,
      ...STAGE_2_COURSES,
      ...STAGE_3_COURSES,
      ...PIQ_TRACK,
      ...AIQ_TRACK,
      ...SQ_TRACK,
      ...BC_TRACK,
    ];
    const currentIndex = allCourses.findIndex(c => compareCourseIds(c.id, courseId));

    // Stage Gating Logic - Redirect to assessment at stage boundaries
    if (compareCourseIds(courseId, 'S10')) {
      navigate('/assessment/T2');
      return;
    }
    if (compareCourseIds(courseId, 'S19')) {
      navigate('/assessment/T3');
      return;
    }
    if (compareCourseIds(courseId, 'S25')) {
      navigate('/assessment/T4');
      return;
    }

    if (currentIndex !== -1 && currentIndex < allCourses.length - 1) {
      const nextCourse = allCourses[currentIndex + 1];
      // Reset state for next lesson
      setCompletedSteps({});
      setActiveStep(null);
      setShowCongratulation(false);
      setCongratulationAcknowledged(false);
      // NOTE: `isCompleted` is derived via useMemo from completedSteps (reset above),
      // so it recomputes automatically. There is no setIsCompleted setter — calling
      // one here threw a ReferenceError and crashed "Next Lesson".
      setVideoProgress(0); // Reset video progress for next course

      let nextId = nextCourse.id;
      if (courseId.startsWith("CRS")) {
        // Must require a digit right after "S" — plain `startsWith("S")` also
        // matches "SQ01" (Sustainability Quotient track), which sent users to
        // the wrong course (S01 instead of the correct SQ lesson).
        const isS = /^S\d/.test(nextId);
        const numPart = parseInt(nextId.replace(/\D/g, ''), 10);
        if (isS && !isNaN(numPart)) {
          nextId = `CRS${String(numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("PIQ") && !isNaN(numPart)) {
          nextId = `CRS${String(25 + numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("AIQ") && !isNaN(numPart)) {
          nextId = `CRS${String(30 + numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("SQ") && !isNaN(numPart)) {
          nextId = `CRS${String(35 + numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("BC") && !isNaN(numPart)) {
          nextId = `CRS${String(40 + numPart).padStart(5, '0')}`;
        }
      }

      navigate(`/dashboard/courses/${nextId}/player`);
    } else {
      navigate('/dashboard/courses');
    }
  };

  const handleAcknowledgeCongratulation = () => {
    setShowCongratulation(false);
    setCongratulationAcknowledged(true);
  };

  const renderMicroAssessment = (stepData, stepLetter, isStepCompleted) => {
    const studentId = currentUser?._id || currentUser?.id;
    if (!stepData?.assessmentData || !studentId || !courseMeta.courseCode) {
      return (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("course_player.sign_in_for_quiz", "Sign in to take this micro-assessment. If you're already signed in, this quiz may not be published yet.")}
        </p>
      );
    }

    return (
      <MicroAssessment
        assessmentData={stepData.assessmentData}
        courseCode={courseMeta.courseCode}
        moduleId={stepData.moduleId || stepData.assessmentData.moduleId || 1}
        dayId={stepData.dayId || stepData.assessmentData.dayId}
        studentId={studentId}
        initialResult={taskResultsByDay[stepData.dayId || stepData.assessmentData.dayId]}
        onComplete={(score, totalPoints) => handleStepComplete(stepLetter, score, totalPoints)}
      />
    );
  };

  const renderStepContent = (stepData, stepLetter) => {
    const contentType = stepData.contentType;
    const isStepCompleted = completedSteps[stepLetter];

    switch (contentType) {
      case 'quiz':
        return renderMicroAssessment(stepData, stepLetter, isStepCompleted);
      case 'video-text': {
        const isPlaceholderVideo = !stepData.videoUrl;
        const playbackUrl = stepData.videoUrl || TEMP_VIDEO_URL;
        // In theater mode the lesson card becomes a flex column and this wrapper
        // dissolves (display: contents) so the video can be ordered above the
        // card header as a full-bleed dark band, without remounting the player.
        return (
          <div className={theaterLayout ? "contents" : "space-y-4"}>
            {playbackUrl && (
              <motion.div
                layout
                transition={LAYOUT_TRANSITION}
                className={
                  theaterLayout
                    ? "order-first relative -mx-4 sm:-mx-6 lg:-mx-8 mb-5 bg-black h-[calc(100vh-4.75rem)] min-h-[360px]"
                    : "rounded-2xl overflow-hidden relative"
                }
              >
                {isPlaceholderVideo && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/95 text-white text-xs font-bold shadow-lg backdrop-blur-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t("course_player.placeholder_video_notice", "Course video coming soon — placeholder content")}
                  </div>
                )}
                {/* Theater: the band is as tall as the viewport; the player takes
                    that height and centres itself, leaving black on either side. */}
                <motion.div
                  layout
                  transition={LAYOUT_TRANSITION}
                  className={theaterLayout ? "mx-auto h-full max-w-full aspect-video" : "w-full"}
                >
                  <CustomVideoPlayer
                    videoUrl={playbackUrl}
                    title={stepData.title}
                    initialMaxTime={userProgressData[stepLetter]?.last_timestamp || 0}
                    initialCompleted={userProgressData[stepLetter]?.videoCompleted || false}
                    onProgressUpdate={handleVideoProgressUpdate}
                    onTimeUpdate={(time, dur) => {
                      setCurrentVideoTime(time);
                      if (dur) setCurrentVideoDuration(dur);
                    }}
                    onNext={activeStep !== lastStepKey ? () => {
                      const nextStep = (parseInt(activeStep) + 1).toString();
                      handleStepComplete(activeStep);
                      setActiveStep(nextStep);
                      setVideoWatched(false);
                    } : null}
                    isTheater={theaterLayout}
                    onToggleTheater={toggleTheater}
                  />
                </motion.div>
              </motion.div>
            )}

            {stepData.assessmentData && (videoWatched || isStepCompleted) && (
              <div className="mt-6">
                <h4 className="font-semibold text-[#072036] dark:text-white mb-3">{t("course_player.micro_assessment", "Micro-Assessment")}</h4>
                {renderMicroAssessment(stepData, stepLetter, isStepCompleted)}
              </div>
            )}
          </div>
        );
      }
      case 'mcq':
        return (
          <MCQPractice
            content={stepData.content}
            questions={stepData.questions}
            onComplete={(score, totalPoints) => handleStepComplete(stepLetter, score, totalPoints)}
            isCompleted={isStepCompleted}
            storageKey={`practice_${courseId}_${stepLetter}`}
            savedScore={userProgressData[stepLetter]?.testScore}
            savedTotalPoints={userProgressData[stepLetter]?.testTotalPoints}
          />
        );
      case 'flashcard':
        return (
          <FlashcardTask
            content={stepData.content}
            cards={stepData.cards}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'advanced-mcq':
        return (
          <AdvancedPractice
            content={stepData.content}
            questions={stepData.questions}
            onComplete={(score, totalPoints) => handleStepComplete(stepLetter, score, totalPoints)}
            isCompleted={isStepCompleted}
            storageKey={`adv_practice_${courseId}_${stepLetter}`}
            savedScore={userProgressData[stepLetter]?.testScore}
            savedTotalPoints={userProgressData[stepLetter]?.testTotalPoints}
          />
        );
      case 'case-study':
        return (
          <CaseStudy
            title={stepData.caseTitle || stepData.title}
            content={stepData.content}
            mcq={stepData.mcq}
            questions={stepData.questions}
            onComplete={(score, totalPoints, autoAdvance) => handleStepComplete(stepLetter, score, totalPoints, autoAdvance)}
            isCompleted={isStepCompleted}
            savedScore={userProgressData[stepLetter]?.testScore}
            savedTotalPoints={userProgressData[stepLetter]?.testTotalPoints}
            storageKey={`case_study_${courseId}_${stepLetter}`}
          />
        );
      case 'notes': {
        const playbackUrl = stepData.videoUrl;
        return (
          <div className="space-y-6 h-full overflow-y-auto pb-8">
            {playbackUrl && (
              <div
                className={
                  theaterLayout
                    ? "relative -mx-4 sm:-mx-6 lg:-mx-8 mb-5 bg-black h-[calc(100vh-4.75rem)] min-h-[360px]"
                    : "rounded-2xl overflow-hidden relative mx-auto max-w-4xl"
                }
              >
                <div className={theaterLayout ? "mx-auto h-full max-w-full aspect-video" : "w-full"}>
                  <CustomVideoPlayer
                    isTheater={isTheater}
                    onToggleTheater={toggleTheater}
                    videoUrl={playbackUrl}
                    title={stepData.title || t("course_player.self_reflection_video", "Self-Reflection Video")}
                    initialMaxTime={userProgressData[stepLetter]?.last_timestamp || 0}
                    initialCompleted={userProgressData[stepLetter]?.videoCompleted || false}
                    onProgressUpdate={handleVideoProgressUpdate}
                    onTimeUpdate={(time, dur) => {
                      setCurrentVideoTime(time);
                      if (dur) setCurrentVideoDuration(dur);
                    }}
                    onNext={null}
                  />
                </div>
              </div>
            )}
            <Notes
              content={stepData.content}
              placeholder={stepData.placeholder}
              diagramUrl={stepData.diagramUrl}
              onComplete={() => handleStepComplete(stepLetter)}
              isCompleted={isStepCompleted}
              onNextLesson={handleNextLesson}
              showNextLesson={congratulationAcknowledged && stepLetter === lastStepKey}
              courseId={courseId}
              isVideoCompleted={!playbackUrl || userProgressData[stepLetter]?.videoCompleted || videoWatched}
            />
          </div>
        );
      }
      default:
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
              {stepData.content}
            </p>
          </div>
        );
    }
  };

  const overallContentProgress = useMemo(() => {
    if (!totalSteps) return 0;
    const completedCount = Object.keys(completedSteps).length;
    let progress = (completedCount / totalSteps) * 100;
    
    // Add current video's fractional progress if playing a video. Prefer the
    // player's own live duration (available from the first timeupdate tick)
    // over userProgressData[activeStep].videoDuration, which only gets set
    // once the first background sync lands ~5s into playback — until then
    // this bar sat frozen at 0% even though the video was visibly playing.
    if (activeStep && !completedSteps[activeStep]) {
      const stepData = learningFlowData?.steps?.[activeStep];
      if (stepData && stepData.contentType === 'video-text') {
        const duration = currentVideoDuration || userProgressData[activeStep]?.videoDuration || 0;
        const current = currentVideoTime || userProgressData[activeStep]?.last_timestamp || 0;
        if (duration > 0 && current < duration) {
          const videoPct = (current / duration) * 100;
          progress += (videoPct / totalSteps);
        }
      }
    }
    
    return Math.min(100, Math.round(progress));
  }, [completedSteps, totalSteps, activeStep, userProgressData, currentVideoTime, currentVideoDuration, learningFlowData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAF7FD] dark:bg-[#072036] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#045C9A] dark:border-[#A6D7E8]"></div>
      </div>
    );
  }

  if (!loading && !course && !dynamicFlow) {
    return (
      <div className="min-h-screen bg-[#EAF7FD] dark:bg-[#072036] flex items-center justify-center">
        <div className="text-center p-8">
          <Lock className="w-16 h-16 text-slate-400 dark:text-[#A6D7E8] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#072036] dark:text-white mb-2">{t("course_player.course_not_found")}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t("course_player.course_not_found_desc")}</p>
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-[#072036] hover:bg-[#0d3a5f] text-white dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] rounded-xl text-[13px] font-semibold shadow-md shadow-[#072036]/20 dark:shadow-none transition-colors"
          >
            {t("course_player.back_to_courses")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="flex flex-col bg-[#EAF7FD] dark:bg-[#072036] text-[#072036] dark:text-white h-screen overflow-y-auto transition-colors duration-500 relative pt-4 px-4 sm:px-6 lg:px-8 pb-28">
      {/* Ambient layer, matching the dashboard and courses pages. Fixed rather
          than absolute because this page's own root is the scroll container --
          an absolute layer would scroll away with the lesson content. */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-25">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
        <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-transparent border-b border-[#d7ebf5] dark:border-[#045C9A]/30 mb-2">
          <div className="w-full px-0 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <button
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-[#045C9A] dark:hover:text-[#A6D7E8] transition-all duration-300 font-bold text-sm cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#d7ebf5] dark:border-[#045C9A]/30 bg-white dark:bg-[#0d3a5f] group-hover:border-[#045C9A]/50 group-hover:bg-[#EAF7FD] dark:group-hover:bg-[#045C9A]/20 transition-all shadow-sm">
                    <ArrowLeft className="w-4 h-4 text-[#045C9A] dark:text-[#A6D7E8] group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span>{t("course_player.back_to_overview")}</span>
                </button>
                <div className="hidden sm:block h-5 w-px bg-[#d7ebf5] dark:bg-[#045C9A]/30" />
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`${currentTheme.badgeBg} rounded px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider shadow-none`}>
                    {t(stageKey)}
                  </Badge>
                  <span className="text-base font-bold tracking-tight text-[#072036] dark:text-white">
                    {t(stageNameKey)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!showIntro && (
                  <button
                    type="button"
                    onClick={toggleTheater}
                    aria-pressed={isTheater}
                    title={isTheater ? t("course_player.default_view", "Default view") : t("course_player.theater_mode", "Theater mode")}
                    className={`hidden lg:inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      isTheater
                        ? 'bg-[#045C9A] border-[#045C9A] text-white shadow-md shadow-[#072036]/10'
                        : 'bg-white dark:bg-[#0d3a5f] border-[#d7ebf5] dark:border-[#045C9A]/30 text-slate-700 dark:text-slate-200 hover:border-[#045C9A]/50 hover:bg-[#EAF7FD] dark:hover:bg-[#045C9A]/20 shadow-sm'
                    }`}
                  >
                    <FitScreen weight={500} fill={isTheater ? 1 : 0} className="w-4 h-4" />
                    <span>{isTheater ? t("course_player.default_view", "Default view") : t("course_player.theater_mode", "Theater mode")}</span>
                  </button>
                )}
                <FloatingDictionary variant="docked" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className={theaterBand ? "space-y-6" : "pt-2 sm:pt-4 space-y-6"}>
          {/* Course Info Header */}
          {!showIntro && (
            <AnimatePresence initial={false}>
              {!theaterBand && (
                <motion.div
                  key="course-title-full"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  className="text-left mb-4 mt-1 space-y-1"
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    {dynamicFlow?.courseNumber || course?.courseNumber || course?.id}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#072036] dark:text-white tracking-tight leading-tight">
                    {course.title}
                  </h1>
                  <p className="text-[15px] text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                    {course.subtitle}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <div className={showIntro ? "flex justify-center" : `grid grid-cols-1 gap-6 items-start ${theaterLayout ? "" : "lg:grid-cols-3"}`}>
            {/* Left Column - Video and Content */}
            <motion.div layout transition={LAYOUT_TRANSITION} className={showIntro ? "max-w-5xl w-full mx-auto" : (theaterLayout ? "w-full" : "lg:col-span-2")}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatePresence mode="wait">
                  {showIntro ? (
                    <motion.div
                      key="intro-screen"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="relative w-full max-w-3xl mx-auto overflow-hidden rounded-2xl bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm p-6 sm:p-8 space-y-6 text-left text-[#072036] dark:text-white"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#d7ebf5] dark:border-[#045C9A]/25">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-2.5 py-0.5 ${currentTheme.badgeBg} text-[11px] font-semibold uppercase tracking-wider`}>
                            {t(stageKey)}
                          </span>
                          <span className="rounded border border-[#d7ebf5] bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-300">
                            {t(stageNameKey)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <Fingerprint className="w-3.5 h-3.5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                            {t("course_player.course_id", "Course ID")}
                            <strong className="font-bold tabular-nums text-[#072036] dark:text-white">
                              {dynamicFlow?.courseNumber || course?.courseNumber || course?.id}
                            </strong>
                          </span>
                          <span className="h-3 w-px bg-[#d7ebf5] dark:bg-white/10" />
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0 text-[#045C9A] dark:text-[#A6D7E8]" />
                            <span className="tabular-nums">45 min</span>
                          </span>
                        </div>
                      </div>

                      {/* Header Info */}
                      <div className="space-y-2">
                        <h1
                          className="text-xl sm:text-2xl font-bold text-[#072036] dark:text-white tracking-tight leading-tight"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          {course.title}
                        </h1>
                        <p className="max-w-2xl text-[15px] font-medium leading-relaxed text-[#35566b] dark:text-slate-400">
                          {course.subtitle}
                        </p>
                      </div>

                      {/* Banner Image */}
                      {(dbCourse?.banner || course?.banner) && (
                        <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-[#d7ebf5] dark:border-[#045C9A]/20 sm:h-60">
                          <img
                            src={dbCourse.banner || course.banner}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Important Disclaimers & Guidelines - acknowledgement checklist */}
                      <div className="rounded-2xl border border-[#d7ebf5] bg-[#F1F5F9] p-5 dark:border-[#045C9A]/25 dark:bg-[#072036]/60">
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#d7ebf5] dark:border-white/10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 bg-[#045C9A]/10 dark:bg-[#045C9A]/20 rounded-lg shrink-0">
                              <ClipboardCheck className="w-4 h-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#072036] dark:text-white">
                                {t("course_player.important_guidelines", "Important Disclaimers & Guidelines")}
                              </p>
                              <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                                {t("course_player.guidelines_hint", "Please read and acknowledge each point before you begin.")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-md border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider tabular-nums transition-colors ${
                              allGuidelinesAcknowledged
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400"
                                : "border-[#d7ebf5] bg-white text-slate-600 dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-300"
                            }`}
                          >
                            {t("course_player.guidelines_progress", "{{done}} of {{total}} acknowledged", {
                              done: acknowledgedCount,
                              total: COURSE_GUIDELINES.length,
                            })}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          {COURSE_GUIDELINES.map((guideline) => {
                            const checked = !!acknowledgedGuidelines[guideline.id];
                            return (
                              <label
                                key={guideline.id}
                                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors select-none ${
                                  checked
                                    ? "border-[#045C9A]/40 bg-white dark:border-[#A6D7E8]/40 dark:bg-[#0d3a5f]"
                                    : "border-[#d7ebf5] bg-white hover:border-[#045C9A]/30 dark:border-white/10 dark:bg-[#0d3a5f]/60 dark:hover:border-[#A6D7E8]/30"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="peer sr-only"
                                  checked={checked}
                                  onChange={() => toggleGuideline(guideline.id)}
                                />
                                <span
                                  aria-hidden="true"
                                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#045C9A]/40 ${
                                    checked
                                      ? "border-[#045C9A] bg-[#045C9A] text-white dark:border-[#A6D7E8] dark:bg-[#A6D7E8] dark:text-[#072036]"
                                      : "border-slate-300 bg-white group-hover:border-[#045C9A] dark:border-white/25 dark:bg-transparent dark:group-hover:border-[#A6D7E8]"
                                  }`}
                                >
                                  {checked && <Check className="w-3 h-3" />}
                                </span>
                                <span className="min-w-0 text-sm leading-relaxed">
                                  <span className="block font-bold text-[#072036] dark:text-white">
                                    {t(guideline.titleKey, guideline.titleDefault)}
                                  </span>
                                  <span className="block font-medium text-slate-600 dark:text-slate-400">
                                    {t(guideline.textKey, guideline.textDefault)}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Primary CTA & Footer */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 dark:text-slate-400">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{t("course_player.secure_session", "Secure session protocol initialized")}</span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleStartCourse}
                          disabled={!allGuidelinesAcknowledged}
                          title={allGuidelinesAcknowledged ? undefined : t("course_player.acknowledge_all_guidelines", "Please acknowledge all guidelines to continue.")}
                          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all sm:w-auto ${currentTheme.btnClass} ${
                            allGuidelinesAcknowledged ? "cursor-pointer" : "cursor-not-allowed opacity-50 shadow-none"
                          }`}
                        >
                          <span>
                            {Object.keys(completedSteps).length > 0
                              ? t("course_player.resume_learning_journey", "Resume Learning Journey")
                              : t("course_player.start_learning_journey", "Start Learning Journey")}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : !activeStep ? (
                    <motion.div
                      key="main-overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="p-8 text-center bg-[#F1F5F9] dark:bg-[#072036]/60 rounded-2xl border border-[#d7ebf5] dark:border-[#045C9A]/30"
                    >
                      <Sparkles className="w-12 h-12 text-[#045C9A] dark:text-[#A6D7E8] mx-auto mb-4" />
                      <h4 className="font-bold text-slate-600 dark:text-slate-300">
                        {t("course_player.select_a_lesson", "Select a lesson to continue")}
                      </h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t("course_player.select_a_lesson_hint", "Pick a step from the curriculum on the right to pick up where you left off.")}
                      </p>
                    </motion.div>
                  ) : (
                    /* Active Step Content */
                    <div className="space-y-6">
                      <motion.div
                        key="active-step"
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={LAYOUT_TRANSITION}
                        className={
                          theaterBand
                            ? "flex flex-col mb-6 text-left text-[#072036] dark:text-white"
                            : "p-5 sm:p-7 bg-white dark:bg-[#0d3a5f] text-[#072036] dark:text-white rounded-2xl border border-[#d7ebf5] dark:border-white/[0.04] mb-6 shadow-sm relative overflow-hidden text-left"
                        }
                      >
                        {!theaterBand && (
                          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#045C9A]/20 to-transparent" style={{ filter: 'blur(0.5px)' }} />
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-[#d7ebf5] dark:border-white/10">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-[#045C9A] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#072036]/15 shrink-0 tabular-nums">
                              {activeStep}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {theaterBand && (
                                  <>
                                    <span>{dynamicFlow?.courseNumber || course?.courseNumber || course?.id}</span>
                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                    <span>{course.title}</span>
                                    <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                                  </>
                                )}
                                {t("course_player.step_of", "Step {{step}} of {{total}}", { step: activeStep, total: totalSteps })}
                              </p>
                              <h3 className="mt-0.5 text-lg sm:text-xl font-bold text-[#072036] dark:text-white leading-tight tracking-tight truncate">
                                {activeStep === '1' ? t("course_player.step_why", "Why") : activeStep === '2' ? t("course_player.step_story", "Story") : (learningFlowData?.steps?.[activeStep]?.title || `${t("course_player.curriculum")} ${activeStep}`)}
                              </h3>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#045C9A]/20 bg-[#045C9A]/10 px-2.5 py-1 text-xs font-semibold text-[#045C9A] dark:border-[#A6D7E8]/25 dark:bg-[#045C9A]/25 dark:text-[#A6D7E8]">
                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                              {t("course_player.active_session_label", "Active session")}
                            </span>
                            {learningFlowData?.steps?.[activeStep]?.contentType !== 'quiz' &&
                              !learningFlowData?.steps?.[activeStep]?.assessmentData && (
                                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-[#072036]/60 dark:text-slate-300 tabular-nums">
                                  <Clock className="w-3.5 h-3.5 text-[#045C9A] dark:text-[#A6D7E8]" />
                                  {learningFlowData?.steps?.[activeStep]?.duration || t("course_player.five_ten_min", "5 min")}
                                </span>
                              )}
                          </div>
                        </div>

                        {learningFlowData?.steps?.[activeStep] ? (
                          renderStepContent(learningFlowData.steps[activeStep], activeStep)
                        ) : (
                          <div className="p-8 text-center bg-[#F1F5F9] dark:bg-[#072036]/60 rounded-2xl border border-[#d7ebf5] dark:border-[#045C9A]/30">
                            <Sparkles className="w-12 h-12 text-[#045C9A] dark:text-[#A6D7E8] mx-auto mb-4 animate-pulse" />
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">{t("course_player.content_coming_soon")}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t("course_player.step_preparing", { step: activeStep })}</p>
                            <button
                              onClick={() => handleStepComplete(activeStep)}
                              className={`mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${currentTheme.btnClass}`}
                            >
                              {t("course_player.complete_step")}
                            </button>
                          </div>
                        )}

                        {activeStep === lastStepKey && congratulationAcknowledged &&
                          learningFlowData?.steps?.[activeStep]?.contentType !== 'notes' && (
                          <button
                            onClick={handleNextLesson}
                            className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-colors ${currentTheme.btnClass}`}
                          >
                            {t("course_player.unlock_next_course")}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>


                      {/* Side-by-side Tab switcher buttons & Content below active-step card if contentType is video-text */}
                      {learningFlowData?.steps?.[activeStep]?.contentType === 'video-text' && (
                        <motion.div layout transition={LAYOUT_TRANSITION} className="space-y-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => setActiveTab('preview')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                                activeTab === 'preview'
                                  ? 'bg-[#045C9A] border-[#045C9A] text-white shadow-md shadow-[#072036]/10'
                                  : 'bg-white dark:bg-[#0d3a5f] hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-[#d7ebf5] dark:border-white/10 shadow-sm'
                              }`}
                            >
                              <BookOpen size={14} />
                              <span>{t("course_player.preview")}</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('transcription')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                                activeTab === 'transcription'
                                  ? 'bg-[#045C9A] border-[#045C9A] text-white shadow-md shadow-[#072036]/10'
                                  : 'bg-white dark:bg-[#0d3a5f] hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-[#d7ebf5] dark:border-white/10 shadow-sm'
                              }`}
                            >
                              <FileText size={14} />
                              <span>{t("course_player.transcription")}</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('notes')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer border ${
                                activeTab === 'notes'
                                  ? 'bg-[#045C9A] border-[#045C9A] text-white shadow-md shadow-[#072036]/10'
                                  : 'bg-white dark:bg-[#0d3a5f] hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 border-[#d7ebf5] dark:border-white/10 shadow-sm'
                              }`}
                            >
                              <StickyNote size={14} />
                              <span>{t("course_player.notes", "Notes")}</span>
                            </button>
                          </div>

                          <div className="bg-white dark:bg-[#0d3a5f] rounded-2xl p-5 sm:p-7 border border-[#d7ebf5] dark:border-white/[0.03] shadow-sm text-left">
                            <AnimatePresence mode="wait">
                              {activeTab === 'preview' && (
                                <motion.div
                                  key="preview"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="bg-[#F1F5F9] dark:bg-[#0d3a5f]/90 border border-[#d7ebf5] dark:border-[#045C9A]/30 rounded-2xl p-6 transition-colors duration-300 text-[#072036] dark:text-white">
                                    <h4 className="mb-3 text-base font-bold text-[#072036] dark:text-white">{t("course_player.lesson_preview")}</h4>
                                    {(activeStep === '1' || activeStep === '2' || activeStep === '3') && learningFlowData?.steps?.[activeStep]?.title ? (
                                      <div className="space-y-2 mb-3">
                                        <h5 className="font-bold text-sm sm:text-base text-[#045C9A] dark:text-[#A6D7E8]">
                                          {learningFlowData.steps[activeStep].title}
                                        </h5>
                                        {activeStep === '3' && learningFlowData.steps[activeStep].diagramUrl && (
                                          <div className="my-4 rounded-xl overflow-hidden border border-[#d7ebf5] dark:border-[#045C9A]/30 bg-white dark:bg-[#0d3a5f] p-2 max-w-lg mx-auto">
                                            <img src={learningFlowData.steps[activeStep].diagramUrl} alt={t("course_player.framework_diagram", "Framework Diagram")} className="w-full h-auto object-contain max-h-64" />
                                          </div>
                                        )}
                                        <p className="text-slate-600 dark:text-slate-200 text-[15px] leading-relaxed whitespace-pre-line">
                                          {learningFlowData.steps[activeStep].content || t("course_player.lesson_preview_desc")}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-slate-600 dark:text-slate-200 text-[15px] leading-relaxed mb-3">
                                        {learningFlowData?.steps?.[activeStep]?.content || t("course_player.lesson_preview_desc")}
                                      </p>
                                    )}
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-sm text-slate-500 dark:text-slate-300">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                                        <span>{learningFlowData?.steps?.[activeStep]?.duration || t("course_player.five_ten_min")}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="w-4 h-4 text-[#045C9A] dark:text-[#A6D7E8]" />
                                        <span>{t("course_player.video_lesson")}</span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                              {activeTab === 'transcription' && (
                                <motion.div
                                  key="transcription"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <SyncedTranscript
                                    currentTime={currentVideoTime}
                                    videoUrl={learningFlowData.steps[activeStep].videoUrl}
                                    transcriptUrl={learningFlowData.steps[activeStep].transcriptUrl || learningFlowData.steps[activeStep].transcriptionUrl || "/transcripts/sample-course.vtt"}
                                    transcriptText={learningFlowData.steps[activeStep].transcription || learningFlowData.steps[activeStep].transcriptText || learningFlowData.steps[activeStep].captions}
                                    title={t("course_player.video_transcription")}
                                    courseCode={courseId}
                                  />
                                </motion.div>
                              )}
                              {activeTab === 'notes' && (
                                <motion.div
                                  key="notes"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <InlineNotes courseId={courseId} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {!showIntro && (
              <motion.div layout transition={LAYOUT_TRANSITION} className={theaterLayout ? "w-full" : "lg:col-span-1"}>
                <motion.div
                  initial={{ opacity: 0, x: theaterLayout ? 0 : 20, y: theaterLayout ? 20 : 0 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-left"
                >
                  {/* Progress + Curriculum in one card so the step list stays above the fold */}
                  <div className="relative overflow-hidden bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/[0.03] shadow-sm text-[#072036] dark:text-white">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#045C9A]/20 to-transparent" style={{ filter: 'blur(0.5px)' }} />

                    {/* Progress strip */}
                    <div className="p-5 sm:p-6 border-b border-[#d7ebf5] dark:border-white/10">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:text-[#A6D7E8] flex items-center justify-center border border-[#045C9A]/20 shadow-xs shrink-0">
                            <Target className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-[#072036] dark:text-white leading-tight">
                              {t("course_player.progress", "Progress")}
                            </h3>
                            <p className="text-[13px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                              {t("course_player.steps_completed_of", "{{done}} of {{total}} steps completed", {
                                done: Object.keys(completedSteps).length,
                                total: totalSteps,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <motion.div layout transition={LAYOUT_TRANSITION} className={`grid grid-cols-1 gap-4 ${theaterLayout ? "sm:grid-cols-2" : ""}`}>
                        {/* Content Progress */}
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                            <span>{t("course_player.content_progress", "Content Progress")}</span>
                            <span className="text-[#045C9A] dark:text-[#A6D7E8] tabular-nums">{overallContentProgress}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-[#F1F5F9] dark:bg-white/10 rounded-full overflow-hidden border border-[#d7ebf5] dark:border-white/10 p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${overallContentProgress}%` }}
                              className="h-full bg-gradient-to-r from-[#034a7d] to-[#045C9A] rounded-full"
                              transition={{ type: "spring", bounce: 0, duration: 1 }}
                            />
                          </div>
                        </div>

                        {/* Steps Completed */}
                        <div className="space-y-1.5 text-left">
                          <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                            <span>{t("course_player.steps_completed", "Steps Completed")}</span>
                            <span className="text-[#045C9A] dark:text-[#A6D7E8] tabular-nums">
                              {Object.keys(completedSteps).length}/{totalSteps}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-[#F1F5F9] dark:bg-white/10 rounded-full overflow-hidden border border-[#d7ebf5] dark:border-white/10 p-0.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(Object.keys(completedSteps).length / totalSteps) * 100}%` }}
                              className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                              transition={{ type: "spring", bounce: 0, duration: 1 }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Curriculum */}
                    <div className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <h3 className="text-base font-bold text-[#072036] dark:text-white flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:text-[#A6D7E8] flex items-center justify-center border border-[#045C9A]/20 shadow-xs">
                            <PlayCircle className="w-5 h-5" />
                          </div>
                          {t("course_player.curriculum", "Curriculum")}
                        </h3>
                        <span className="px-3 py-1 bg-[#EAF7FD] dark:bg-[#0d3a5f] text-[#045C9A] dark:text-[#A6D7E8] border border-[#d7ebf5] dark:border-[#045C9A]/25 rounded-full text-sm font-bold tabular-nums">
                          {Object.keys(completedSteps).length}/{totalSteps}
                        </span>
                      </div>

                      <motion.div layout transition={LAYOUT_TRANSITION} className={theaterLayout ? "grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4" : "space-y-2.5"}>
                        {stepNumbers.map((step) => {
                          const status = getStepStatus(step);
                          const stepData = learningFlowData?.steps?.[step];
                          const isActive = activeStep === step;

                          return (
                            <motion.button
                              layout
                              transition={LAYOUT_TRANSITION}
                              whileHover={status === 'locked' ? undefined : { y: -2 }}
                              whileTap={status === 'locked' ? undefined : { scale: 0.99 }}
                              key={step}
                              disabled={status === 'locked'}
                              onClick={() => handleStepClick(step)}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-colors duration-300 border text-left cursor-pointer hover:shadow-md ${isActive
                                ? 'bg-[#045C9A] dark:bg-[#045C9A] border-[#045C9A] dark:border-[#045C9A] text-white shadow-md shadow-[#072036]/15'
                                : status === 'completed'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/70 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 hover:border-emerald-300'
                                  : status === 'locked'
                                    ? 'opacity-40 cursor-not-allowed border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#072036]/60 text-slate-400'
                                    : 'bg-white dark:bg-[#0d3a5f] border-[#d7ebf5] dark:border-white/[0.03] text-slate-800 dark:text-slate-200 hover:border-[#045C9A]/40 dark:hover:border-[#045C9A]/40'
                                }`}
                            >
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-colors ${isActive ? 'bg-white/20 text-white' :
                                status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' :
                                  status === 'locked' ? 'bg-[#F1F5F9] dark:bg-white/5 text-slate-400 border border-[#d7ebf5] dark:border-white/10' : 'bg-[#EAF7FD] dark:bg-[#0d3a5f] text-[#045C9A] dark:text-[#A6D7E8] border border-[#d7ebf5] dark:border-[#045C9A]/30 shadow-xs'
                                }`}>
                                {getStepIcon(step, stepData, status, isActive)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className={`font-bold text-[15px] leading-tight truncate ${isActive ? 'text-white' : 'text-[#072036] dark:text-slate-100'}`}>
                                  {step === '1' ? t("course_player.step_why", "Why") : step === '2' ? t("course_player.step_story", "Story") : (stepData?.title || `${t("course_player.curriculum")} ${step}`)}
                                </h4>
                                <div className={`flex items-center gap-1.5 text-[13px] font-semibold mt-1 ${isActive ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'}`}>
                                  <Clock size={13} className={isActive ? 'text-white/80' : 'text-slate-400'} />
                                  <span>{stepData?.duration || t("course_player.five_ten_min", "5 min")}</span>
                                </div>
                              </div>

                              {status !== 'locked' && !isActive && (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </div>
        </main>

        {/* Congratulation Modal */}
        {typeof document !== "undefined" && createPortal(
          <AnimatePresence>
            {showCongratulation && (
              <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/75 backdrop-blur-md"
                  onClick={handleAcknowledgeCongratulation}
                />

                {/* Confetti (layered in front of card) */}
                <Confetti
                  width={windowSize.width}
                  height={windowSize.height}
                  recycle={false}
                  numberOfPieces={500}
                  colors={['#045C9A', '#034a7d', '#0b7cc4', '#A6D7E8', '#EAF7FD']}
                  style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1001, pointerEvents: 'none' }}
                />

                {/* Card Container */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="bg-white dark:bg-[#0d3a5f] rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(7,32,54,0.28)] border border-[#d7ebf5] dark:border-[#045C9A]/30 relative overflow-hidden flex flex-col items-center z-[1000]"
                >
                  {/* Subtle Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-[#045C9A]/8 to-transparent rounded-full blur-2xl pointer-events-none" />

                  {/* Unlocked Hex Badge */}
                  <div className="flex justify-center mb-6 relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 120 }}
                      className="relative"
                    >
                      <HexBadgeSVG
                        colors={resolveColors(getCourseCategory(courseId))}
                        badgeId={`${courseId}-MASTER`}
                        courseName={resolveStaticCourseTitle(courseId) || dbCourse?.title || courseId}
                        year={new Date().getFullYear()}
                        size={180}
                      />
                    </motion.div>
                  </div>

                  {/* Congratulations Text */}
                  <div className="text-center mb-6 relative z-10 w-full">
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mb-1 text-2xl font-bold tracking-tight text-[#072036] dark:text-white"
                    >
                      {t("course_player.congratulations_exclaim", "Congratulations!")}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-[13px] font-medium text-[#35566b] dark:text-slate-400"
                    >
                      {t("course_player.badge_unlocked", "You have unlocked this badge")}
                    </motion.p>
                  </div>

                  {/* Progress Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="relative z-10 mb-6 w-full rounded-2xl border border-emerald-200/70 bg-emerald-50 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{t("course_player.your_progress")}</span>
                      <span className="text-[11px] font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                        {t("course_player.steps_progress_format", "{{count}}/{{total}} Steps", { count: totalSteps, total: totalSteps })}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: totalSteps }, (_, i) => String(i + 1)).map((step, idx) => (
                        <motion.div
                          key={step}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6 + idx * 0.05 }}
                          className="h-2 flex-1 rounded-full bg-emerald-600 dark:bg-emerald-400"
                        />
                      ))}
                    </div>
                  </motion.div>

                  {/* Stars Animation */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-center gap-2 mb-6 relative z-10"
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.div
                        key={star}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.7 + star * 0.1, type: "spring", stiffness: 200 }}
                      >
                        <Star className="w-5 h-5 text-amber-400" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleNextLesson}
                    className="relative z-10 flex w-full items-center justify-center gap-2 rounded-xl bg-[#072036] px-6 py-3 text-[13px] font-semibold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white"
                  >
                    {t("course_player.continue_to_next_lesson")}
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
      {/* FloatingNotes removed — Notes moved into the tab panel above */}
      <ActivityWarningModal
        isOpen={isWarningVisible}
        warningsCount={warningsCount}
        maxWarnings={maxWarnings}
        lastViolationType={lastViolationType}
        onAcknowledge={acknowledgeWarning}
      />
    </div>
  );
};

export default CoursePlayer;
