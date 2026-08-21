import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Target, CheckCircle2, Lock, ChevronRight, PlayCircle, FileText, Sparkles, Trophy, Star, AlertTriangle, ShieldAlert, StickyNote, Fingerprint, GraduationCap, ShieldCheck, Activity, Play, HelpCircle, Layers, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
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

  return <Play className="w-3.5 h-3.5 fill-current" />;
};

const STAGE_THEME = {
  capacity: {
    gradient: "from-blue-50/70 via-[#f0f4ff]/60 to-indigo-50/70 dark:from-[#0f172a] dark:via-[#1e1b4b] dark:to-[#312e81]",
    badgeBg: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    accentGlow: "from-indigo-500 to-cyan-400",
    btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600",
  },
  capability: {
    gradient: "from-teal-50/70 via-[#e6f4f1]/60 to-emerald-50/70 dark:from-[#042f2e] dark:via-[#115e59] dark:to-[#0d9488]",
    badgeBg: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    accentGlow: "from-teal-500 to-emerald-400",
    btnClass: "bg-teal-600 hover:bg-teal-700 text-white dark:bg-teal-500 dark:hover:bg-teal-600",
  },
  leadership: {
    gradient: "from-purple-50/70 via-[#f3e8ff]/60 to-[#faf5ff]/70 dark:from-[#2e1065] dark:via-[#581c87] dark:to-[#7e22ce]",
    badgeBg: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    accentGlow: "from-purple-600 to-violet-400",
    btnClass: "bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600",
  },
  piq: {
    gradient: "from-violet-50/70 via-fuchsia-50/60 to-slate-50/70 dark:from-[#31103f] dark:via-[#581c87] dark:to-[#7c3aed]",
    badgeBg: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    accentGlow: "from-violet-600 to-fuchsia-400",
    btnClass: "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-500 dark:hover:bg-violet-600",
  },
  aiq: {
    gradient: "from-blue-50/70 via-cyan-50/60 to-slate-50/70 dark:from-[#0c2a4a] dark:via-[#1e3a8a] dark:to-[#2563eb]",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-cyan-400",
    accentGlow: "from-blue-600 to-cyan-400",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
  },
  siq: {
    gradient: "from-emerald-50/70 via-green-50/60 to-slate-50/70 dark:from-[#064e3b] dark:via-[#047857] dark:to-[#10b981]",
    badgeBg: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    accentGlow: "from-emerald-600 to-teal-400",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-600",
  },
  unknown: {
    gradient: "from-blue-50/70 via-indigo-50/60 to-slate-50/70 dark:from-[#0d1f4e] dark:via-[#1a3884] dark:to-[#0f2d6b]",
    badgeBg: "bg-blue-500/15 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-blue-500/30",
    activeStep: "bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md",
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-cyan-400",
    accentGlow: "from-blue-600 to-cyan-400",
    btnClass: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
  }
};

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

  const currentTheme = useMemo(() => STAGE_THEME[typeKey] || STAGE_THEME.unknown, [typeKey]);

  const formattedDisplayType = useMemo(() => {
    if (typeKey === 'aiq' || typeKey === 'piq' || typeKey === 'siq') {
      return typeKey.toUpperCase();
    }
    return typeKey.charAt(0).toUpperCase() + typeKey.slice(1);
  }, [typeKey]);

  const staticFlow = getLearningFlowData(courseId);
  const learningFlowData = dynamicFlow || staticFlow;

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
    window.scrollTo(0, 0);

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
    setShowIntro(false);
    const allDone = stepNumbers.every(step => completedSteps[step]);
    const resumeStep = stepNumbers.find(step => !completedSteps[step]) || (allDone ? lastStepKey : '1');
    setActiveStep(resumeStep);
    setVideoWatched(false);
    handleStartStep(resumeStep);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleStepClick = (stepNumber) => {
    if (!isStepLocked(stepNumber)) {
      const isActivating = activeStep !== stepNumber;
      setActiveStep(activeStep === stepNumber ? null : stepNumber);
      setVideoWatched(false);
      if (isActivating) {
        handleStartStep(stepNumber);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
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
        return (
          <div className="space-y-4">
            {playbackUrl && (
              <div className="rounded-3xl overflow-hidden relative">
                {isPlaceholderVideo && (
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/95 text-white text-[11px] font-bold shadow-lg backdrop-blur-sm">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t("course_player.placeholder_video_notice", "Course video coming soon — placeholder content")}
                  </div>
                )}
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
                />
              </div>
            )}

            {stepData.assessmentData && (videoWatched || isStepCompleted) && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t("course_player.micro_assessment", "Micro-Assessment")}</h4>
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
              <div className="rounded-3xl overflow-hidden max-w-4xl mx-auto">
                <CustomVideoPlayer
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
            <p className="text-gray-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
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
      <div className="min-h-screen bg-[#f4f7fc] dark:bg-[#040915] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-cyan-400"></div>
      </div>
    );
  }

  if (!loading && !course && !dynamicFlow) {
    return (
      <div className="min-h-screen bg-[#f4f7fc] dark:bg-[#040915] flex items-center justify-center">
        <div className="text-center p-8">
          <Lock className="w-16 h-16 text-slate-400 dark:text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#0d1f4e] dark:text-white mb-2">{t("course_player.course_not_found")}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t("course_player.course_not_found_desc")}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#1a3884] dark:bg-gradient-to-r dark:from-blue-600 dark:to-indigo-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg"
          >
            {t("course_player.back_to_courses")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#f4f7fc] dark:bg-[#040915] text-slate-900 dark:text-white h-screen overflow-y-auto transition-colors duration-500 relative pt-4 px-4 sm:px-6 lg:px-8 pb-12">


      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-transparent border-b border-slate-200/80 dark:border-blue-500/30 mb-2">
          <div className="w-full px-0 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <button
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-cyan-400 transition-all duration-300 font-bold text-xs cursor-pointer"
                >
                  <div className="w-8.5 h-8.5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-blue-500/30 bg-white dark:bg-blue-950/50 group-hover:border-cyan-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50 transition-all shadow-xs">
                    <ArrowLeft className="w-4 h-4 text-blue-600 dark:text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                  <span>{t("course_player.back_to_overview")}</span>
                </button>
                <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-blue-500/30" />
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`${currentTheme.badgeBg} font-black px-3.5 py-1 text-xs uppercase tracking-wider shadow-sm`}>
                    {t(stageKey)}
                  </Badge>
                  <span className="text-[17px] font-black tracking-tight text-[#0d1f4e] dark:text-white">
                    {t(stageNameKey)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Optional Header Right Content */}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="pt-2 sm:pt-4 space-y-6">
          {/* Course Info Header */}
          {!showIntro && (
            <div className="text-left mb-6 mt-2 space-y-1">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
                {dynamicFlow?.courseNumber || course?.courseNumber || course?.id}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#0d1f4e] dark:text-white tracking-tight leading-tight">
                {course.title}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
                {course.subtitle}
              </p>
            </div>
          )}

          <div className={showIntro ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"}>
            {/* Left Column - Video and Content */}
            <div className={showIntro ? "max-w-5xl w-full mx-auto" : "lg:col-span-2"}>
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
                      className="w-full max-w-3xl mx-auto p-6 sm:p-8 bg-white/95 dark:bg-gradient-to-b dark:from-[#0d1f4e] dark:via-[#0a183d] dark:to-[#07112c] text-slate-900 dark:text-white rounded-3xl border border-slate-200/90 dark:border-blue-500/30 shadow-xl dark:shadow-2xl space-y-6 text-left relative overflow-hidden"
                    >
                      {/* Top Meta Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-blue-500/20">
                        <div className="flex items-center gap-2">
                          <span className={`px-3.5 py-1 rounded-full ${currentTheme.badgeBg} text-xs font-black uppercase tracking-wider`}>
                            {t(stageKey)}
                          </span>
                          <span className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-blue-950/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-blue-500/20 text-xs font-bold">
                            {t(stageNameKey)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Fingerprint className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                            Course ID: <strong className="text-slate-900 dark:text-white">{dynamicFlow?.courseNumber || course?.courseNumber || course?.id}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            45 min
                          </span>
                        </div>
                      </div>

                      {/* Header Info */}
                      <div className="space-y-2">
                        <h1 className="text-2xl sm:text-3xl font-black text-[#0d1f4e] dark:text-white tracking-tight leading-tight">
                          {course.title}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl">
                          {course.subtitle}
                        </p>
                      </div>

                      {/* Banner Image */}
                      {(dbCourse?.banner || course?.banner) && (
                        <div className="rounded-2xl overflow-hidden border border-slate-200/80 dark:border-blue-500/30 shadow-md relative h-52 sm:h-60 w-full">
                          <img
                            src={dbCourse.banner || course.banner}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Important Disclaimers & Guidelines Box */}
                      <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-xs font-black uppercase tracking-wider">Important Disclaimers & Guidelines</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-medium text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 shrink-0">•</span>
                            <span><strong>Active Engagement:</strong> User inactivity of 5 minutes or more is automatically recorded for security & progress validation.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 shrink-0">•</span>
                            <span><strong>Academic Integrity:</strong> All assessments and reflections must be completed independently by the enrolled student.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 shrink-0">•</span>
                            <span><strong>Sequential Order:</strong> Lessons must be completed in order to unlock subsequent modules and assessments.</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-amber-600 dark:text-amber-400 shrink-0">•</span>
                            <span><strong>Certification Eligibility:</strong> Official course completion is granted upon meeting all required milestone criteria.</span>
                          </div>
                        </div>
                      </div>

                      {/* Primary CTA & Footer */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Secure session protocol initialized</span>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleStartCourse}
                          className={`w-full sm:w-auto px-8 py-3.5 ${currentTheme.btnClass} rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer`}
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
                      className="p-8 text-center bg-slate-50 dark:bg-blue-950/40 rounded-2xl border border-slate-200/80 dark:border-blue-500/30"
                    >
                      <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
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
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-5 sm:p-7 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl border border-slate-100 dark:border-white/[0.04] mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden text-left"
                      >
                        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a3884]/20 to-transparent" style={{ filter: 'blur(0.5px)' }} />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#1a3884] text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                              {activeStep}
                            </div>
                            <div>
                              <h3 className="font-black text-xl sm:text-2xl text-[#0d1f4e] dark:text-white leading-tight tracking-tight">
                                {activeStep === '1' ? t("course_player.step_why", "Why") : activeStep === '2' ? t("course_player.step_story", "Story") : (learningFlowData?.steps?.[activeStep]?.title || `${t("course_player.curriculum")} ${activeStep}`)}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-[#1a3884] animate-pulse" />
                                <p className="text-[10px] font-black text-[#1a3884] uppercase tracking-widest">{t("course_player.active_session", "ACTIVE SESSION")}</p>
                              </div>
                            </div>
                          </div>
                          {learningFlowData?.steps?.[activeStep]?.contentType !== 'quiz' &&
                            !learningFlowData?.steps?.[activeStep]?.assessmentData && (
                              <div className="px-4 py-2 bg-slate-50 dark:bg-blue-950/40 rounded-xl text-xs font-black text-slate-600 dark:text-blue-200 border border-slate-200/60 dark:border-white/[0.05] shadow-xs shrink-0 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-[#1a3884]" />
                                <span>{learningFlowData?.steps?.[activeStep]?.duration || t("course_player.five_ten_min", "5 min")}</span>
                              </div>
                            )}
                        </div>

                        {learningFlowData?.steps?.[activeStep] ? (
                          renderStepContent(learningFlowData.steps[activeStep], activeStep)
                        ) : (
                          <div className="p-8 text-center bg-slate-50 dark:bg-blue-950/40 rounded-2xl border border-slate-200/80 dark:border-blue-500/30">
                            <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">{t("course_player.content_coming_soon")}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{t("course_player.step_preparing", { step: activeStep })}</p>
                            <button
                              onClick={() => handleStepComplete(activeStep)}
                              className={`mt-6 px-6 py-2.5 ${currentTheme.btnClass} rounded-xl font-bold text-xs uppercase tracking-wider shadow-md`}
                            >
                              {t("course_player.complete_step")}
                            </button>
                          </div>
                        )}

                        {activeStep === lastStepKey && congratulationAcknowledged &&
                          learningFlowData?.steps?.[activeStep]?.contentType !== 'notes' && (
                          <button
                            onClick={handleNextLesson}
                            className={`w-full px-6 py-4 ${currentTheme.btnClass} rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transform hover:scale-[1.01] mt-6`}
                          >
                            {t("course_player.unlock_next_course")}
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </motion.div>


                      {/* Side-by-side Tab switcher buttons & Content below active-step card if contentType is video-text */}
                      {learningFlowData?.steps?.[activeStep]?.contentType === 'video-text' && (
                        <div className="space-y-6">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => setActiveTab('preview')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold transition-all duration-300 text-xs cursor-pointer shadow-xs border ${
                                activeTab === 'preview'
                                  ? 'bg-[#1a3884] border-[#1a3884] text-white shadow-md shadow-blue-900/10'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.05] shadow-sm'
                              }`}
                            >
                              <BookOpen size={14} className="stroke-[2.2]" />
                              <span>{t("course_player.preview")}</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('transcription')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold transition-all duration-300 text-xs cursor-pointer shadow-xs border ${
                                activeTab === 'transcription'
                                  ? 'bg-[#1a3884] border-[#1a3884] text-white shadow-md shadow-blue-900/10'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.05] shadow-sm'
                              }`}
                            >
                              <FileText size={14} className="stroke-[2.2]" />
                              <span>{t("course_player.transcription")}</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('notes')}
                              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-extrabold transition-all duration-300 text-xs cursor-pointer shadow-xs border ${
                                activeTab === 'notes'
                                  ? 'bg-[#1a3884] border-[#1a3884] text-white shadow-md shadow-blue-900/10'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-slate-500 dark:text-slate-400 border-slate-200/80 dark:border-white/[0.05] shadow-sm'
                              }`}
                            >
                              <StickyNote size={14} className="stroke-[2.2]" />
                              <span>{t("course_player.notes", "Notes")}</span>
                            </button>
                          </div>

                          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-100 dark:border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.02)] text-left">
                            <AnimatePresence mode="wait">
                              {activeTab === 'preview' && (
                                <motion.div
                                  key="preview"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="bg-slate-50 dark:bg-[#071336]/90 border border-slate-200 dark:border-blue-500/30 rounded-2xl p-6 transition-colors duration-300 text-slate-900 dark:text-white">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white mb-3">{t("course_player.lesson_preview")}</h4>
                                    {(activeStep === '1' || activeStep === '2' || activeStep === '3') && learningFlowData?.steps?.[activeStep]?.title ? (
                                      <div className="space-y-2 mb-3">
                                        <h5 className="font-black text-sm sm:text-base text-[#1a3884] dark:text-cyan-300">
                                          {learningFlowData.steps[activeStep].title}
                                        </h5>
                                        {activeStep === '3' && learningFlowData.steps[activeStep].diagramUrl && (
                                          <div className="my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-blue-500/30 bg-white dark:bg-[#050e26] p-2 max-w-lg mx-auto">
                                            <img src={learningFlowData.steps[activeStep].diagramUrl} alt={t("course_player.framework_diagram", "Framework Diagram")} className="w-full h-auto object-contain max-h-64" />
                                          </div>
                                        )}
                                        <p className="text-slate-600 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                                          {learningFlowData.steps[activeStep].content || t("course_player.lesson_preview_desc")}
                                        </p>
                                      </div>
                                    ) : (
                                      <p className="text-slate-600 dark:text-slate-200 leading-relaxed mb-3">
                                        {learningFlowData?.steps?.[activeStep]?.content || t("course_player.lesson_preview_desc")}
                                      </p>
                                    )}
                                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 dark:text-slate-300">
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[#1a3884] dark:text-cyan-400" />
                                        <span>{learningFlowData?.steps?.[activeStep]?.duration || t("course_player.five_ten_min")}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="w-4 h-4 text-[#1a3884] dark:text-cyan-400" />
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
                        </div>
                      )}
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {!showIntro && (
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-6 text-left"
                >
                  {/* Progress Card */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-slate-900 dark:text-white">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a3884]/20 to-transparent" style={{ filter: 'blur(0.5px)' }} />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#1a3884] dark:text-cyan-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                        <Target className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <h3 className="text-base font-black text-[#0d1f4e] dark:text-white">
                        {t("course_player.progress", "Progress")}
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Content Progress */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                          <span>{t("course_player.content_progress", "Content Progress")}</span>
                          <span className="text-[#1a3884] dark:text-cyan-300">{overallContentProgress}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10 p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallContentProgress}%` }}
                            className="h-full bg-gradient-to-r from-[#1a3884] to-[#3b82f6] rounded-full"
                            transition={{ type: "spring", bounce: 0, duration: 1 }}
                          />
                        </div>
                      </div>

                      {/* Steps Completed */}
                      <div className="space-y-1.5 text-left">
                        <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                          <span>{t("course_player.steps_completed", "Steps Completed")}</span>
                          <span className="text-[#1a3884] dark:text-cyan-300">
                            {Object.keys(completedSteps).length}/{totalSteps}
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden border border-slate-200/50 dark:border-white/10 p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(Object.keys(completedSteps).length / totalSteps) * 100}%` }}
                            className="h-full bg-gradient-to-r from-[#16a34a] to-[#4ade80] rounded-full"
                            transition={{ type: "spring", bounce: 0, duration: 1 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Curriculum Flow Card */}
                  <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-white/[0.03] shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-slate-900 dark:text-white">
                    <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#1a3884]/20 to-transparent" style={{ filter: 'blur(0.5px)' }} />
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-base font-black text-[#0d1f4e] dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#1a3884] dark:text-cyan-400 flex items-center justify-center border border-blue-500/20 shadow-xs">
                          <PlayCircle className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        {t("course_player.curriculum", "Curriculum")}
                      </h3>
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-[#1a3884] dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 rounded-full text-xs font-black">
                        {Object.keys(completedSteps).length}/{totalSteps}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {stepNumbers.map((step) => {
                        const status = getStepStatus(step);
                        const stepData = learningFlowData?.steps?.[step];
                        const isActive = activeStep === step;

                        return (
                          <button
                            key={step}
                            disabled={status === 'locked'}
                            onClick={() => handleStepClick(step)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 border text-left cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${isActive
                              ? 'bg-[#1a3884] dark:bg-[#1e40af] border-[#1a3884] dark:border-[#1e40af] text-white shadow-md shadow-blue-900/15'
                              : status === 'completed'
                                ? 'bg-[#f0fdf4] dark:bg-[#072212]/40 border-[#dcfce7] dark:border-[#14532d]/25 text-[#15803d] dark:text-[#4ade80] hover:border-[#bbf7d0]'
                                : status === 'locked'
                                  ? 'opacity-40 cursor-not-allowed border-slate-100/60 dark:border-slate-800 bg-slate-50 dark:bg-[#06112d]/60 text-slate-400'
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/[0.03] text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                          >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs transition-colors ${isActive ? 'bg-white/20 text-white' :
                              status === 'completed' ? 'bg-[#dcfce7] dark:bg-[#14532d]/45 text-[#15803d] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534]/30' :
                                status === 'locked' ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200/50 dark:border-slate-700/50' : 'bg-blue-50 dark:bg-blue-950/60 text-[#1a3884] dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 shadow-xs'
                              }`}>
                              {getStepIcon(step, stepData, status, isActive)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                                {step === '1' ? t("course_player.step_why", "Why") : step === '2' ? t("course_player.step_story", "Story") : (stepData?.title || `${t("course_player.curriculum")} ${step}`)}
                              </h4>
                              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 mt-0.5">
                                <Clock size={11} className={isActive ? 'text-white/80' : 'text-slate-400'} />
                                <span className={isActive ? 'text-white/90' : ''}>
                                  {stepData?.duration || t("course_player.five_ten_min", "5 min")}
                                </span>
                              </div>
                            </div>

                            {status !== 'locked' && !isActive && (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>
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
                  colors={['#1a3884', '#112b6b', '#2b5a9e', '#4c6ef5', '#ffd700']}
                  style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1001, pointerEvents: 'none' }}
                />

                {/* Card Container */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="bg-white dark:bg-[#001a3d] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_20px_50px_rgba(26,56,132,0.3)] border border-[#d8e6f7] dark:border-[#1a3884]/30 relative overflow-hidden flex flex-col items-center z-[1000]"
                >
                  {/* Subtle Glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-[#1a3884]/8 to-transparent rounded-full blur-2xl pointer-events-none" />

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
                      className="text-[28px] font-black text-[#1a3884] dark:text-blue-300 mb-1"
                    >
                      {t("course_player.congratulations_exclaim", "Congratulations!")}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-[15px] font-extrabold text-slate-600 dark:text-slate-400"
                    >
                      {t("course_player.badge_unlocked", "You have unlocked this badge")}
                    </motion.p>
                  </div>

                  {/* Progress Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full bg-gradient-to-r from-green-50/60 to-emerald-50/60 dark:from-green-950/10 dark:to-emerald-950/10 rounded-2xl p-4 mb-6 border border-green-200/60 dark:border-green-800/30 relative z-10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-green-700 dark:text-green-400">{t("course_player.your_progress")}</span>
                      <span className="text-xs font-black text-green-700 dark:text-green-400">
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
                          className="flex-1 h-2 bg-[#15803d] dark:bg-[#4ade80] rounded-full"
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
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Continue Button */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    onClick={handleNextLesson}
                    className="w-full py-3.5 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] relative z-10"
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
      <FloatingDictionary />
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
