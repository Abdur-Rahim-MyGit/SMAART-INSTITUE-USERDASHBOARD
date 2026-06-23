import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Target, CheckCircle2, Lock, ChevronRight, ChevronDown, PlayCircle, FileText, Volume2, Sparkles, Trophy, Star, AlertTriangle, ShieldAlert, StickyNote, Fingerprint, GraduationCap, ShieldCheck, Activity } from "lucide-react";
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
import { STAGE_1_COURSES, STAGE_2_COURSES, STAGE_3_COURSES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK } from "@/data/courseStructureData";
import { getLearningFlowData } from "@/data/learningFlowData";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { coursesAPI, courseEnrollmentAPI } from "@/services/api";
import { buildFlowFromCourse, buildFlowFromLearningFlow, TEMP_VIDEO_URL } from "@/utils/courseStages";
import { mergeAdminQuizzesIntoFlow } from "@/utils/microAssessmentUtils";
import { markCourseCompleted } from "@/utils/courseProgressStorage";
import Confetti from 'react-confetti';
import { HexBadgeSVG, resolveColors } from "@/components/badges/BadgeCard";
import { compareCourseIds, resolveStaticCourseTitle } from "@/utils/courseUnlock";

const getCourseCategory = (courseId) => {
  const cid = String(courseId || '').toUpperCase();
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

// Sample video URLs - replace with actual video URLs from your backend
const COURSE_VIDEOS = {
  'S01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S06': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S07': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S08': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S09': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S10': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S11': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S12': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S13': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S14': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S15': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S16': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S17': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S18': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S19': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S20': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S21': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S22': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S23': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S24': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'S25': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'PIQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'AIQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ01': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ02': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ03': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ04': 'https://www.w3schools.com/html/mov_bbb.mp4',
  'SQ05': 'https://www.w3schools.com/html/mov_bbb.mp4',
};

const getCourseById = (courseId) => {
  const allCourses = [
    ...STAGE_1_COURSES,
    ...STAGE_2_COURSES,
    ...STAGE_3_COURSES,
    ...PIQ_TRACK,
    ...AIQ_TRACK,
    ...SQ_TRACK,
  ];
  return allCourses.find(course => course.id === courseId);
};

const getStageAndTrackInfo = (courseId) => {
  if (STAGE_1_COURSES.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.stage_1', stageNameKey: 'course_player.stages.capacity', typeKey: 'course_player.stages.type_s1' };
  }
  if (STAGE_2_COURSES.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.stage_2', stageNameKey: 'course_player.stages.capability', typeKey: 'course_player.stages.type_s2' };
  }
  if (STAGE_3_COURSES.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.stage_3', stageNameKey: 'course_player.stages.leadership', typeKey: 'course_player.stages.type_s3' };
  }
  if (PIQ_TRACK.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.piq_track', stageNameKey: 'course_player.stages.personal_intelligence', typeKey: 'course_player.stages.type_piq' };
  }
  if (AIQ_TRACK.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.aiq_track', stageNameKey: 'course_player.stages.ai_readiness', typeKey: 'course_player.stages.type_aiq' };
  }
  if (SQ_TRACK.find(c => c.id === courseId)) {
    return { stageKey: 'course_player.stages.sq_track', stageNameKey: 'course_player.stages.sustainability', typeKey: 'course_player.stages.type_sq' };
  }
  return { stageKey: 'course_player.stages.unknown', stageNameKey: 'course_player.stages.unknown', typeKey: 'course_player.stages.unknown' };
};

const CoursePlayer = () => {
  const { courseId } = useParams();
  const { user: currentUser } = useUser();
  const navigate = useNavigate();
  const playerRef = useRef(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dynamicFlow, setDynamicFlow] = useState(null);
  const [totalSteps, setTotalSteps] = useState(9);
  const [showIntro, setShowIntro] = useState(true);
  const [activeStep, setActiveStep] = useState(null);
  const [completedSteps, setCompletedSteps] = useState({});
  const [showOverview, setShowOverview] = useState(true);
  const [showTranscription, setShowTranscription] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
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
      setLoading(true);
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
            const videoUrl = stage.videoUrl || (isNotes ? null : TEMP_VIDEO_URL);
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
        if (!cancelled) setLoading(false);
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
        setLoading(false);
        return;
      }
      setLoading(true);
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
        setLoading(false);
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
    setActiveStep('1');
    setVideoWatched(false);
    handleStartStep('1');
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

  const handleStepComplete = async (stepNumber, score = null, totalPoints = null) => {
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
      setActiveStep(null);
      const userId = currentUser?._id || currentUser?.id || 'anon';
      localStorage.setItem(`${userId}_smaart_course_progress`, '100');
      markCourseCompleted(courseId);
    } else {
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
        const isS = nextId.startsWith("S");
        const numPart = parseInt(nextId.replace(/\D/g, ''), 10);
        if (isS && !isNaN(numPart)) {
          nextId = `CRS${String(numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("PIQ") && !isNaN(numPart)) {
          nextId = `CRS${String(25 + numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("AIQ") && !isNaN(numPart)) {
          nextId = `CRS${String(30 + numPart).padStart(5, '0')}`;
        } else if (nextId.startsWith("SQ") && !isNaN(numPart)) {
          nextId = `CRS${String(35 + numPart).padStart(5, '0')}`;
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
          Sign in to take this micro-assessment, or ensure the course is published with quiz questions.
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
        onComplete={() => handleStepComplete(stepLetter)}
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
        const playbackUrl = stepData.videoUrl || TEMP_VIDEO_URL;
        return (
          <div className="space-y-4">
            {playbackUrl && (
              <div className="rounded-xl overflow-hidden">
                <CustomVideoPlayer
                  videoUrl={playbackUrl}
                  title={stepData.title}
                  initialMaxTime={userProgressData[stepLetter]?.last_timestamp || 0}
                  initialCompleted={userProgressData[stepLetter]?.videoCompleted || false}
                  onProgressUpdate={handleVideoProgressUpdate}
                  onTimeUpdate={(time) => setCurrentVideoTime(time)}
                  onNext={activeStep !== lastStepKey ? () => {
                    const nextStep = (parseInt(activeStep) + 1).toString();
                    handleStepComplete(activeStep);
                    setActiveStep(nextStep);
                    setVideoWatched(false);
                  } : null}
                />
              </div>
            )}

            {/* Tab Switcher Section */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm overflow-hidden">
              {/* Tab Navigation — Preview | Transcription | Notes */}
              <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 m-2 sm:m-4 rounded-xl border border-slate-200/30 dark:border-white/5">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm relative ${activeTab === 'preview'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {activeTab === 'preview' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#1a3884] rounded-lg shadow-lg shadow-[#1a3884]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <BookOpen size={14} className={activeTab === 'preview' ? 'text-white' : 'text-slate-400'} />
                    {t("course_player.preview")}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('transcription')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm relative ${activeTab === 'transcription'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {activeTab === 'transcription' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#1a3884] rounded-lg shadow-lg shadow-[#1a3884]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <FileText size={14} className={activeTab === 'transcription' ? 'text-white' : 'text-slate-400'} />
                    {t("course_player.transcription")}
                  </span>
                </button>
                {/* Notes tab — replaces the floating Quick Notes button */}
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition-all duration-300 text-xs sm:text-sm relative ${activeTab === 'notes'
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                >
                  {activeTab === 'notes' && (
                    <motion.div
                      layoutId="activeTabBackground"
                      className="absolute inset-0 bg-[#1a3884] rounded-lg shadow-lg shadow-[#1a3884]/20"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                    <StickyNote size={14} className={activeTab === 'notes' ? 'text-white' : 'text-slate-400'} />
                    Notes
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'preview' && (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-6"
                  >
                    <div className="bg-[#F8FAFC] dark:bg-[#002A5C] border border-transparent dark:border-white/5 rounded-xl p-6 transition-colors duration-300">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{t("course_player.lesson_preview")}</h4>
                      {(stepLetter === '1' || stepLetter === '2' || stepLetter === '3') && stepData.title ? (
                        <div className="space-y-2 mb-3">
                          <h5 className="font-extrabold text-sm sm:text-base text-[#1a3884] dark:text-blue-400">
                            {stepData.title}
                          </h5>
                          {stepLetter === '3' && stepData.diagramUrl && (
                            <div className="my-4 rounded-xl overflow-hidden border border-slate-250 dark:border-white/5 bg-white p-2 max-w-lg mx-auto">
                              <img src={stepData.diagramUrl} alt="Framework Diagram" className="w-full h-auto object-contain max-h-64" />
                            </div>
                          )}
                          <p className="text-gray-650 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                            {stepData.content || t("course_player.lesson_preview_desc")}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-slate-200 leading-relaxed mb-3">
                          {stepData.content || t("course_player.lesson_preview_desc")}
                        </p>
                      )}
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                          <span>{stepData.duration || t("course_player.five_ten_min")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
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
                    className="p-3 sm:p-6"
                  >
                    <SyncedTranscript
                      currentTime={currentVideoTime}
                      videoUrl={stepData.videoUrl}
                      transcriptUrl={stepData.transcriptUrl || stepData.transcriptionUrl || "/transcripts/sample-course.vtt"}
                      transcriptText={stepData.transcription || stepData.transcriptText || stepData.captions}
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
                    className="p-3 sm:p-4"
                  >
                    <InlineNotes courseId={courseId} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {stepData.assessmentData && (videoWatched || isStepCompleted) && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Micro-Assessment</h4>
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
          />
        );
      case 'case-study':
        return (
          <CaseStudy
            title={stepData.caseTitle || stepData.title}
            content={stepData.content}
            mcq={stepData.mcq}
            questions={stepData.questions}
            onComplete={() => handleStepComplete(stepLetter)}
            isCompleted={isStepCompleted}
          />
        );
      case 'notes': {
        const playbackUrl = stepData.videoUrl;
        return (
          <div className="space-y-6 h-full overflow-y-auto pb-8">
            {playbackUrl && (
              <div className="rounded-xl overflow-hidden max-w-4xl mx-auto shadow-md border border-slate-200/50 dark:border-white/5">
                <CustomVideoPlayer
                  videoUrl={playbackUrl}
                  title={stepData.title || "Self-Reflection Video"}
                  initialMaxTime={userProgressData[stepLetter]?.last_timestamp || 0}
                  initialCompleted={userProgressData[stepLetter]?.videoCompleted || false}
                  onProgressUpdate={handleVideoProgressUpdate}
                  onTimeUpdate={(time) => setCurrentVideoTime(time)}
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
    
    // Add current video's fractional progress if playing a video
    if (activeStep && !completedSteps[activeStep] && userProgressData[activeStep]) {
      const stepData = learningFlowData?.steps?.[activeStep];
      if (stepData && stepData.contentType === 'video-text') {
        const duration = userProgressData[activeStep].videoDuration || 0;
        const current = currentVideoTime || userProgressData[activeStep].last_timestamp || 0;
        if (duration > 0 && current < duration) {
          const videoPct = (current / duration) * 100;
          progress += (videoPct / totalSteps);
        }
      }
    }
    
    return Math.min(100, Math.round(progress));
  }, [completedSteps, totalSteps, activeStep, userProgressData, currentVideoTime, learningFlowData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#00152E] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3884]"></div>
      </div>
    );
  }

  if (!loading && !course && !dynamicFlow) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#00152E] flex items-center justify-center">
        <div className="text-center p-8">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#112b6b] dark:text-white mb-2">{t("course_player.course_not_found")}</h2>
          <p className="text-gray-500 mb-6">{t("course_player.course_not_found_desc")}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-[#1a3884] hover:bg-[#002147] text-white rounded-xl font-bold transition-all"
          >
            {t("course_player.back_to_courses")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-transparent overflow-hidden transition-colors duration-500 relative min-h-[calc(100vh-130px)] pt-4 px-4 sm:px-6 lg:px-8 pb-8">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 dark:bg-blue-900/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-900/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-transparent border-b border-[#d8e6f7] dark:border-[#1a3884]/20 mb-2">
          <div className="w-full px-0 py-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                <button
                  onClick={handleBack}
                  className="group flex items-center gap-2 text-slate-500 hover:text-[#1a3884] transition-all duration-300 font-bold text-xs"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 group-hover:border-[#1a3884]/30 group-hover:bg-[#1a3884]/5 transition-all">
                    <ArrowLeft className="w-4 h-4" />
                  </div>
                  <span>{t("course_player.back_to_overview")}</span>
                </button>
                <div className="h-5 w-px bg-slate-200 dark:bg-[#003170]" />
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-[#1a3884]/10 dark:bg-blue-900/30 text-[#1a3884] dark:text-blue-300 border-transparent font-black px-3.5 py-1 text-xs uppercase tracking-wider">
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
        <main className="pt-2 sm:pt-4">
          <div className={showIntro ? "flex justify-center" : "grid grid-cols-1 lg:grid-cols-3 gap-6"}>
            {/* Left Column - Video and Content */}
            <div className={showIntro ? "max-w-3xl w-full" : "lg:col-span-2"}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Course Info Header - Only show if not in intro or show centered in intro */}
                {!showIntro && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-slate-400">{dynamicFlow?.courseNumber || course?.courseNumber || course?.id}</span>
                      {isCompleted && (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600">
                          <CheckCircle2 className="w-3 h-3" />
                          {t("course_player.completed")}
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                      {course.title}
                    </h1>
                    <p className="text-sm text-slate-500">{course.subtitle}</p>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {showIntro ? (
                    <motion.div
                      key="intro-screen"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="p-8 sm:p-10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_rgba(13,31,78,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden relative transition-all duration-500"
                    >
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-gradient-to-br from-[#1a3884]/10 to-[#4c6ef5]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
                      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

                      <div className="text-center mb-8 relative z-10">
                        {/* Premium Category Tag */}
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1a3884]/5 dark:bg-blue-950/40 text-[#1a3884] dark:text-blue-400 text-[10px] font-black uppercase tracking-wider mb-4 border border-[#1a3884]/10 dark:border-blue-900/30">
                          <Sparkles className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400 animate-pulse" />
                          {t(stageKey)}
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-3.5xl font-black text-[#002147] dark:text-white tracking-tight mb-3 leading-tight">
                          {course.title}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-slate-350 font-semibold max-w-xl mx-auto leading-relaxed">
                          {course.subtitle}
                        </p>
                      </div>

                      {/* Course Banner Image */}
                      {(dbCourse?.banner || course?.banner) && (
                        <motion.div
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15, duration: 0.5 }}
                          className="mb-8 rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 shadow-lg relative group"
                        >
                          <img
                            src={dbCourse.banner || course.banner}
                            alt={course.title}
                            className="w-full h-48 sm:h-64 object-cover transform group-hover:scale-[1.02] transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                        </motion.div>
                      )}

                      <div className="space-y-6 relative z-10">
                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Card 1: ID */}
                          <div className="p-4 bg-slate-50/50 dark:bg-[#002A5C]/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-[#1a3884] dark:text-blue-400 shrink-0">
                              <Fingerprint className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("course_player.course_id")}</p>
                              <p className="text-[14px] font-black text-[#002147] dark:text-white">{dynamicFlow?.courseNumber || course?.courseNumber || course?.id}</p>
                            </div>
                          </div>

                          {/* Card 2: Type */}
                          <div className="p-4 bg-slate-50/50 dark:bg-[#002A5C]/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/10 dark:bg-violet-400/10 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                              <GraduationCap className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("course_player.type")}</p>
                              <p className="text-[14px] font-black text-[#002147] dark:text-white">{formattedDisplayType}</p>
                            </div>
                          </div>

                          {/* Card 3: Duration */}
                          <div className="p-4 bg-slate-50/50 dark:bg-[#002A5C]/40 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-white/5 flex items-center gap-3.5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm transition-all duration-300">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t("course_player.duration")}</p>
                              <p className="text-[14px] font-black text-[#002147] dark:text-white">{t("course_player.forty_five_min")}</p>
                            </div>
                          </div>
                        </div>

                        {/* Guidelines Section */}
                        <div className="space-y-4 text-left border-t border-slate-100 dark:border-white/5 pt-6">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[#1a3884] dark:text-blue-400 flex items-center gap-2 mb-4">
                            <BookOpen className="w-4 h-4" />
                            {t("course_player.learning_guidelines", "Learning Protocol & Guidelines")}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/10 border border-slate-100 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-[#1a3884] dark:text-blue-400 shrink-0">
                                <Target className="w-4.5 h-4.5" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Step-by-step progress</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                                  {t("course_player.guideline_step", "Complete each step sequentially to validate your progress and unlock the next lesson.")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/10 border border-slate-100 dark:border-white/5 hover:bg-slate-100/50 dark:hover:bg-slate-800/20 transition-all duration-300">
                              <div className="w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center text-[#1a3884] dark:text-blue-400 shrink-0">
                                <Activity className="w-4.5 h-4.5" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Engagement monitor</p>
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                                  {t("course_player.guideline_active", "Remain actively engaged. User inactivity of 5 minutes or more is automatically recorded.")}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Warning Alert Panel */}
                        <div className="rounded-2xl border border-amber-500/20 dark:border-amber-500/30 bg-amber-500/[0.02] dark:bg-amber-950/10 p-5 relative overflow-hidden text-left">
                          <div className="flex items-center justify-between mb-4 border-b border-amber-500/10 pb-3">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                {t("course_player.integrity_warning_title", "Integrity & Security Warning")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">Live Monitor</span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-xs font-semibold text-amber-800/95 dark:text-amber-300/90 leading-relaxed">
                                {t("course_player.warning_monitored", "Tab-switching, copying/pasting, and window minimization are strictly monitored in real-time.")}
                              </p>
                            </div>
                            <div className="flex gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-650 dark:text-amber-400 shrink-0 mt-0.5" />
                              <p className="text-xs font-semibold text-amber-800/95 dark:text-amber-300/90 leading-relaxed">
                                {t("course_player.warning_limit", "A maximum of 3 warnings are allowed. A 4th security breach will result in immediate disqualification and account lockout.")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Call to Action Button */}
                      <div className="flex flex-col items-center gap-3 mt-10 relative z-10">
                        <motion.button
                          whileHover={{ scale: 1.02, translateY: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleStartCourse}
                          className="group relative flex items-center justify-center gap-3 px-12 py-4 bg-gradient-to-r from-[#1a3884] via-[#2a50b3] to-[#4c6ef5] hover:from-[#112b6b] hover:via-[#1a3884] hover:to-[#2b5a9e] text-white rounded-2xl font-black text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(26,56,132,0.25)] hover:shadow-[0_15px_35px_rgba(26,56,132,0.35)] overflow-hidden"
                        >
                          <span>{t("course_player.start_learning_journey")}</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                        </motion.button>
                        
                        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          Secure session protocol initialized.
                        </p>
                      </div>
                    </motion.div>
                  ) : !activeStep ? (
                    <motion.div
                      key="main-overview"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center p-12">
                        <p className="text-gray-500">{t("course_player.select_step_prompt")}</p>
                      </div>
                    </motion.div>
                  ) : (
                    /* Active Step Content */
                    <motion.div
                      key="active-step"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-6 bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/8 mb-6 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#1a3884] flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md flex-shrink-0">
                            {activeStep}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg sm:text-2xl text-slate-900 dark:text-white leading-tight">
                              {activeStep === '1' ? 'Why' : activeStep === '2' ? 'Story' : (learningFlowData?.steps[activeStep]?.title || `${t("course_player.curriculum")} ${activeStep}`)}
                            </h3>
                            <p className="text-[10px] sm:text-xs text-blue-600 font-bold uppercase tracking-wider">{t("course_player.active_session")}</p>
                          </div>
                        </div>
                        {learningFlowData?.steps[activeStep]?.contentType !== 'quiz' &&
                          !learningFlowData?.steps[activeStep]?.assessmentData && (
                            <div className="px-4 py-2 bg-[#F8FAFC] dark:bg-[#002A5C] rounded-xl text-xs font-bold text-slate-500 border border-slate-100 dark:border-white/10">
                              {learningFlowData?.steps[activeStep]?.duration || t("course_player.five_ten_min")}
                            </div>
                          )}
                      </div>

                      {learningFlowData?.steps[activeStep] ? (
                        renderStepContent(learningFlowData.steps[activeStep], activeStep)
                      ) : (
                        <div className="p-8 text-center bg-[#F8FAFC] rounded-xl">
                          <Sparkles className="w-12 h-12 text-[#1a3884]/20 mx-auto mb-4" />
                          <h4 className="font-bold text-gray-400">{t("course_player.content_coming_soon")}</h4>
                          <p className="text-sm text-gray-400">{t("course_player.step_preparing", { step: activeStep })}</p>
                          <button
                            onClick={() => handleStepComplete(activeStep)}
                            className="mt-6 px-6 py-2 bg-[#1a3884] text-white rounded-lg font-bold"
                          >
                            {t("course_player.complete_step")}
                          </button>
                        </div>
                      )}


                      {activeStep === lastStepKey && congratulationAcknowledged && (
                        <button
                          onClick={handleNextLesson}
                          className="w-full px-6 py-5 bg-[#1a3884] hover:bg-[#002147] text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02] mt-4"
                        >
                          {t("course_player.unlock_next_course")}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
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
                  className="space-y-6"
                >
                  {/* Progress Card */}
                  <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 border border-slate-200 dark:border-white/8 shadow-sm"
                  >
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] flex items-center justify-center border border-slate-200 dark:border-white/10">
                        <Target className="w-5 h-5 text-[#1a3884]" />
                      </div>
                      {t("course_player.progress")}
                    </h3>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>{t("course_player.content_progress")}</span>
                          <span className="text-[#1a3884]">
                            {overallContentProgress}%
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${overallContentProgress}%` }}
                            className="h-full bg-[#1a3884] rounded-full"
                            transition={{ type: "spring", bounce: 0, duration: 1 }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>{t("course_player.steps_completed")}</span>
                          <span className="text-[#0D7377]">
                            {Object.keys(completedSteps).length}/{totalSteps}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden border border-slate-200 dark:border-white/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(Object.keys(completedSteps).length / totalSteps) * 100}%` }}
                            className="h-full bg-[#0D7377] rounded-full"
                            transition={{ type: "spring", bounce: 0, duration: 1 }}
                          />
                        </div>
                      </div>

                      {isCompleted && (
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800/50 mt-4"
                        >
                          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shadow-md">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-green-900 dark:text-green-400">{t("course_player.course_completed")}</p>
                            <p className="text-[10px] text-green-700 dark:text-green-500 font-medium">{t("course_player.all_steps_validated")}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Curriculum Flow Card */}
                  <div className="bg-white dark:bg-[#002147] rounded-3xl p-6 border border-slate-200 dark:border-white/8 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C] flex items-center justify-center border border-slate-200 dark:border-white/10">
                          <PlayCircle className="w-5 h-5 text-[#1a3884]" />
                        </div>
                        {t("course_player.curriculum")}
                      </h3>
                      <div className="px-3 py-1 bg-slate-100 dark:bg-[#002A5C] rounded-lg text-xs font-bold text-slate-500">
                        {Object.keys(completedSteps).length}/{totalSteps}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {stepNumbers.map((step) => {
                        const status = getStepStatus(step);
                        const stepData = learningFlowData?.steps[step];
                        const isActive = activeStep === step;

                        return (
                          <button
                            key={step}
                            disabled={status === 'locked'}
                            onClick={() => handleStepClick(step)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all border ${isActive
                              ? 'bg-[#1a3884] border-[#1a3884] text-white shadow-md'
                              : status === 'completed'
                                ? 'bg-[#F8FAFC] dark:bg-slate-800/50 border-slate-100 dark:border-white/8'
                                : status === 'locked'
                                  ? 'opacity-40 cursor-not-allowed border-transparent'
                                  : 'bg-white dark:bg-[#002147] border-slate-200 dark:border-white/8 hover:border-[#1a3884]/30'
                              }`}
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20 text-white' :
                              status === 'completed' ? 'bg-green-100 text-green-600' :
                                status === 'locked' ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {status === 'completed' ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : status === 'locked' ? (
                                <Lock className="w-4 h-4" />
                              ) : (
                                <span className="font-bold text-sm">{step}</span>
                              )}
                            </div>

                            <div className="flex-1 text-left min-w-0">
                              <h4 className={`font-bold text-sm truncate ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                {step === '1' ? 'Why' : step === '2' ? 'Story' : (stepData?.title || `${t("course_player.curriculum")} ${step}`)}
                              </h4>
                              <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400">
                                <Clock size={12} className={isActive ? 'text-white/60' : 'text-slate-400'} />
                                <span className={isActive ? 'text-white/70' : ''}>
                                  {stepData?.duration || t("course_player.five_ten_min")}
                                </span>
                              </div>
                            </div>

                            {status !== 'locked' && !isActive && (
                              <ChevronRight className="w-4 h-4 text-slate-300" />
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
                      Congratulations!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-[15px] font-extrabold text-slate-600 dark:text-slate-400"
                    >
                      You have unlocked this badge
                    </motion.p>
                  </div>

                  {/* Progress Summary */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-2xl p-4 mb-6 border border-green-200 dark:border-green-800/40 relative z-10"
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
                          className="flex-1 h-2 bg-green-500 rounded-full"
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
