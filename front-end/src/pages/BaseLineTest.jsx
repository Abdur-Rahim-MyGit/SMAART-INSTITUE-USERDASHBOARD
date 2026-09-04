import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { assessmentApi } from "@/services/assessmentApi";
import {
  RiCheckboxCircleLine as CheckCircle2,
  RiCloseCircleLine as XCircle,
  RiTargetLine as Target,
  RiAlertLine as AlertTriangle,
  RiLockLine as Lock,
  RiDownloadLine as Download,
  RiLineChartLine as TrendingUp,
  RiAwardLine as Award,
  RiSparklingLine as Sparkles,
  RiBrainLine as Brain,
  RiGroupLine as Users,
  RiBookOpenLine as BookOpen,
  RiHeartLine as Heart,
  RiComputerLine as Monitor,
  RiFlashlightLine as Zap,
  RiShieldCheckLine as ShieldCheck,
  RiTrophyLine as Trophy,
  RiBarChartBoxLine as BarChart3,
  RiPlantLine as Sprout,
  RiBriefcaseLine as Briefcase,
  RiRefreshLine as RefreshCw,
  RiArrowLeftLine as ArrowLeft
} from "@remixicon/react";
import { toast } from "sonner";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import BadgeModal from "@/components/badges/BadgeModal";
import { buildAssessmentTimerStorageKeys, clearAssessmentTimerStorage } from "@/utils/assessmentTimerStorage";
import useProctoringEngine from "@/hooks/useProctoringEngine";
import ProctoringSetup from "@/components/proctoring/ProctoringSetup";
import ProctoringOverlay from "@/components/proctoring/ProctoringOverlay";
import ProctoringWarningModal from "@/components/proctoring/ProctoringWarningModal";
import AttentionCheck from "@/components/proctoring/AttentionCheck";
import NeuralBackground from "@/components/ui/NeuralBackground";

// Stage configuration map
const STAGE_MAP = {
  T1: { code: 'ASM00001', name: 'Baseline', title: 'Base Line Test', questionLimit: 36, durationMinutes: 45, maxAttempts: 1, passingPercentage: 0 },
  T2: { code: 'ASM00002', name: 'Capacity', title: 'Capacity Test', questionLimit: 34, durationMinutes: 40, maxAttempts: 3, passingPercentage: 60 },
  T3: { code: 'ASM00003', name: 'Capability', title: 'Capability Test', questionLimit: 34, durationMinutes: 45, maxAttempts: 3, passingPercentage: 60 },
  T4: { code: 'ASM00004', name: 'Leadership', title: 'Leadership Test', questionLimit: 36, durationMinutes: 40, maxAttempts: 3, passingPercentage: 60 },
};

// Helper function to get band colors - MINIMAL MONOCHROME THEME
const getBandColor = (level) => {
  // Uniform professional styling with Brand Colors
  const style = {
    bg: 'bg-[#045C9A]/5 dark:bg-[#045C9A]/10',
    text: 'text-[#045C9A] dark:text-[#A6D7E8]',
    badge: 'bg-[#045C9A]/10 text-[#045C9A] border-[#045C9A]/20',
    bar: 'bg-[#045C9A]', // Brand Teal
    glow: 'shadow-sm inner-shadow'
  };

  const icons = {
    'Advanced': <Trophy className="w-4 h-4" />,
    'Strong': <ShieldCheck className="w-4 h-4" />,
    'Progressing': <TrendingUp className="w-4 h-4" />,
    'Developing': <Sprout className="w-4 h-4" />,
    'Emerging': <Zap className="w-4 h-4" />
  };

  return { ...style, icon: icons[level] || icons['Emerging'] };
};

// Quotient information with icons
const quotientInfo = {
  CRQ: { name: 'Cognitive Reasoning', fullName: 'Cognitive Reasoning Quotient', icon: <Brain className="w-5 h-5" />, desc: 'Critical thinking & logical reasoning' },
  SRQ: { name: 'Self-regulation & Drive', fullName: 'Self-regulation & Drive Quotient', icon: <Heart className="w-5 h-5" />, desc: 'Motivation, resilience & emotional control' },
  LQ: { name: 'Learning Agility', fullName: 'Learning Agility Quotient', icon: <BookOpen className="w-5 h-5" />, desc: 'Adaptability & continuous learning' },
  SIQ: { name: 'Social Interaction', fullName: 'Social Interaction Quotient', icon: <Users className="w-5 h-5" />, desc: 'Collaboration, empathy & communication' },
  PEQ: { name: 'Professional Execution', fullName: 'Professional Execution Quotient', icon: <Briefcase className="w-5 h-5" />, desc: 'Work ethic, reliability & delivery' },
  DAQ: { name: 'Digital & AI Literacy', fullName: 'Digital & AI Literacy Quotient', icon: <Monitor className="w-5 h-5" />, desc: 'Tech proficiency & AI readiness' },
  SEQ: { name: 'Social & Emotional', fullName: 'Social & Emotional Quotient', icon: <Sparkles className="w-5 h-5" />, desc: 'Emotional intelligence & social awareness' }
};

// Helper: Get feedback based on level (Simulated AI Response)
const getFeedback = (quotient, level) => {
  const feedbacks = {
    CRQ: {
      Advanced: "Demonstrates exceptional critical thinking and logical reasoning capabilities. You can deconstruct complex problems efficiently and identify nuanced patterns that others might miss. Your cognitive processing speed and accuracy are extremely high.",
      Strong: "Shows strong analytical skills and solid reasoning ability. You can handle most complex situations effectively and make sound decisions based on logic. Continue to challenge yourself with multi-faceted problems.",
      Progressing: "Your reasoning skills are developing well. You can handle standard problems but may need more time or structure for highly complex scenarios. Focus on breaking down problems into smaller components.",
      Developing: "You are in the early stages of developing structured reasoning. You may find complex logical puzzles challenging. Practice deliberate problem-solving techniques to build this muscle.",
      Emerging: "Foundational reasoning skills are present but require significant nurturing. You may rely more on intuition than logic. Structured exercises in logic and pattern recognition will be very beneficial."
    },
    SRQ: {
      Advanced: "Exhibits outstanding emotional control and drive. You stay calm under extreme pressure and are self-motivated to a rarely seen degree. You are a natural anchor for others during turbulent times.",
      Strong: "Very good self-regualtion and motivation. You bounce back from setbacks quickly and generally maintain focus on your goals. Occasional high-stress situations may still test you, but you handle them well.",
      Progressing: "You are learning to manage your emotions and drive. While you have good days, stress can sometimes derail your focus. Building consistent daily habits will help stabilize your performance.",
      Developing: "You struggle somewhat with self-motivation or emotional regulation. Setbacks might discourage you easily. Focus on small wins to build confidence and resilience.",
      Emerging: "Significant challenges with motivation or emotional control detected. You may often feel overwhelmed. Priority should be placed on stress-management techniques and setting very achievable micro-goals."
    },
    LQ: {
      Advanced: "A voracious and agile learner. You adapt to new information instantly and seek out knowledge proactively. Your ability to unlearn and relearn is a major competitive advantage.",
      Strong: "Good learning agility. You are open to new ideas and adapt reasonably well to change. You are willing to learn new skills when required by the situation.",
      Progressing: "You can learn new things but prefer structured environments. Rapid change might feel uncomfortable. Try to push your comfort zone by exploring unfamiliar topics proactively.",
      Developing: "Learning new skills takes effort and time for you. You may value tradition over novelty. To grow, try to adopt a 'beginner's mindset' more often.",
      Emerging: "You may be resistant to new learning or change. This rigidity can hinder growth. Focus on curiosity and asking 'why' to spark the learning process."
    },
    SIQ: {
      Advanced: "Masterful social intelligence. You read rooms instantly, empathize deeply, and communicate with high impact. You can build consensus and lead diverse groups effortlessly.",
      Strong: "Strong collaborator and communicator. You work well in team settings and can resolve standard conflicts. You are generally liked and trusted by peers.",
      Progressing: "You are developing your social radar. You communicate clearly but may miss subtle non-verbal cues. Practice active listening to deepen your connections.",
      Developing: "Social situations may drain you or feel confusing. You might prefer solitary work. Developing a few key communication scripts can help you navigate teamwork more comfortably.",
      Emerging: "Social interaction is a significant challenge. You may struggle to understand others' perspectives. tailored coaching in communication and empathy is recommended."
    },
    PEQ: {
      Advanced: "The epitome of reliability and professional excellence. You deliver high-quality work consistently and ethically. Your reputation is likely one of your strongest assets.",
      Strong: "Highly reliable and professional. You meet deadlines and maintain good standards of quality. You are a dependable team member who takes ownership of tasks.",
      Progressing: "You are building your professional identity. You usually deliver, but consistency might vary. Focus on time management and attention to detail to level up.",
      Developing: "You are still learning professional norms. Deadlines or quality standards might occasionally slip. mentorship on workplace expectations would be valuable.",
      Emerging: "Significant gaps in professional execution. Reliability or quality issues needs addressing immediately. Focus on the basics: punctuality, honesty, and finishing what you start."
    },
    DAQ: {
      Advanced: "A digital native with high AI readiness. You leverage technology to multiply your output and are comfortable with cutting-edge tools. You see technology as an extension of your mind.",
      Strong: "Competent with digital tools and modern workflows. You can use AI and tech effectively for work. You adapt to new software with relative ease.",
      Progressing: "You are comfortable with standard tools but may hesitate with advanced tech or AI. Training in specific modern digital tools will boost your confidence.",
      Developing: "You might find new technology intimidating. You stick to what you know. Guided exploration of user-friendly AI tools can help demystify tech for you.",
      Emerging: "Digital literacy is a hurdle. You may avoid technology where possible. Fundamental training in digital basics is the first step."
    },
    SEQ: {
      Advanced: "Exceptional emotional intelligence. You read social situations with depth and respond with empathy and grace. You inspire trust and build lasting connections effortlessly.",
      Strong: "Strong emotional awareness and social skills. You manage interpersonal dynamics well and contribute positively to group cohesion. Others feel comfortable around you.",
      Progressing: "You are developing your emotional intelligence. You understand basic social cues but may miss subtler emotional undertones. Practice mindfulness and active empathy.",
      Developing: "You are beginning to understand your own emotions and their impact on others. Some social situations may feel confusing. Journaling and reflective exercises can help.",
      Emerging: "Emotional awareness is a significant growth area. You may struggle to identify or manage emotions in yourself or others. Foundational SEQ training is recommended."
    }
  };
  return feedbacks[quotient]?.[level] || "Analysis pending further data.";  
};

// Download report function (PDF)
const downloadReport = (user, testResults) => {
  generateAssessmentReport(user, testResults);
};


const BaseLineTest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stage: urlStage } = useParams();

  // Determine which stage we're running
  const stageKey = (urlStage || 'T1').toUpperCase();
  const stageConfig = STAGE_MAP[stageKey] || STAGE_MAP.T1;
  const translatedTitle = t(`baseline_test.stage_titles.${stageKey}`, stageConfig.title);
  const translatedName = t(`baseline_test.stage_names.${stageKey}`, stageConfig.name);
  const assessmentCode = stageConfig.code;
  const questionLimit = stageConfig.questionLimit;
  const stageDurationSeconds = stageConfig.durationMinutes * 60;

  // State management
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  useEffect(() => {
    setIsDarkTheme(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // Track which questions are answered
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(stageDurationSeconds);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [assessmentToken, setAssessmentToken] = useState(null); // Dedicated session JWT
  // Attempt tracking for retry system (T2-T4+)
  const [attemptInfo, setAttemptInfo] = useState({ attemptCount: 0, maxAttempts: stageConfig.maxAttempts || 3, hasPassed: false, locked: false, remainingAttempts: stageConfig.maxAttempts || 3, attempts: [] });
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [registeredFaceDescriptor, setRegisteredFaceDescriptor] = useState(null);
  const [registeredAllEmbeddings, setRegisteredAllEmbeddings] = useState(null);
  const [registrationMetadata, setRegistrationMetadata] = useState(null); // quality/model info for backend persistence

  const timerStartRef = useRef(null);
  const timeoutSubmitTriggeredRef = useRef(false);
  const oneMinuteAlertShownRef = useRef(false);
  const initRef = useRef(false);
  const isPausedRef = useRef(false);
  const pauseStartedAtRef = useRef(null);
  // Secret dev cheat code — tracks last 4 letters typed
  const cheatBufferRef = useRef([]);
  // Stable ref to latest submit so the keydown effect doesn't need submit in its dep array
  const submitRef = useRef(null);
  const pausedMsRef = useRef(0);

  // Manual navigation guard for standard BrowserRouter
  useEffect(() => {
    if (submitted || loading || !resultId || timeExpired) return;

    const handleBeforeUnload = (e) => {
      const msg = t("baseline_test.confirm_leave", "Are you sure you want to leave? Your assessment progress will be lost.");
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname);
      setShowExitWarning(true);
      toast.warning(t("baseline_test.back_navigation_disabled", "Back navigation is disabled during the assessment."));
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [submitted, loading, resultId, timeExpired, t]);

  // Badge notification state
  const [earnedBadge, setEarnedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const handleBadgesEarned = useCallback((newBadges) => {
    if (newBadges && newBadges.length > 0) {
      const badgeData = newBadges[0];
      const formattedBadge = {
        id: badgeData.badge._id,
        title: badgeData.badge.title,
        description: badgeData.badge.description,
        tier: badgeData.badge.tier,
        xp: badgeData.badge.xp,
        category: badgeData.badge.category,
        earnedDate: badgeData.earnedDate,
        percentile: 10,
        isEarned: true
      };
      setEarnedBadge(formattedBadge);
      setShowBadgeModal(true);
      toast.success(t("baseline_test.badge_unlocked", "Badge Unlocked: {{title}}!", { title: formattedBadge.title }));
    }
  }, [t]);

  // Get current question
  const current = questions[index];
  const currentQuestionId = current?._id;
  const selectedValue = selectedAnswers[currentQuestionId] || null;
  const activeUserId = user?.id || user?._id || "anonymous";
  const { startTimeKey: timerStartStorageKey, warningShownKey: timerWarningStorageKey } =
    buildAssessmentTimerStorageKeys(stageKey, activeUserId);

  // Calculate progress based on answered questions
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isLastFiveMinutes = remainingSeconds <= 300;
  const allQuestionsAnswered = questions.length > 0 && questions.every(q => selectedAnswers[q._id]);

  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  const clearTimerPersistence = useCallback(() => {
    localStorage.removeItem(timerStartStorageKey);
    localStorage.removeItem(timerWarningStorageKey);
    if (activeUserId === "anonymous") {
      clearAssessmentTimerStorage();
    }
  }, [activeUserId, timerStartStorageKey, timerWarningStorageKey]);

  const leaveAssessmentPage = useCallback(() => {
    setShowExitWarning(false);
    navigate("/dashboard/assessment-centre", { replace: true });
  }, [navigate]);

  const formatCountdown = useCallback((totalSeconds) => {
    const safeSeconds = Math.max(totalSeconds, 0);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, []);

  const finalizeUnansweredQuestions = useCallback(async () => {
    if (!resultId || questions.length === 0) return;

    const currentAnswers = selectedAnswersRef.current;
    const unansweredQuestions = questions.filter((question) => !currentAnswers[question._id]);
    if (unansweredQuestions.length === 0) return;

    const fallbackAnswers = {};
    unansweredQuestions.forEach((question) => {
      fallbackAnswers[question._id] = "UNANSWERED";
    });

    setSelectedAnswers((prev) => ({ ...prev, ...fallbackAnswers }));

    await Promise.all(
      unansweredQuestions.map((question) =>
        assessmentApi.saveAnswer(
          resultId,
          question._id,
          "UNANSWERED",
          question.questionText || ""
        )
      )
    );
  }, [questions, resultId]);

  const handleRestartCourse = async () => {
    try {
      const userId = user?.id || user?._id;
      if (!userId) return;

      setLoading(true);
      const res = await assessmentApi.restartStageCourse(userId, stageKey);
      if (res.success) {
        toast.success(t("baseline_test.course_restarted", "Course progress has been reset. You can now start the course again."));
        navigate("/dashboard/courses");
      } else {
        toast.error(res.error || "Failed to restart course");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error restarting course:", err);
      toast.error("Failed to restart course. Please try again.");
      setLoading(false);
    }
  };

  // Check authentication and fetch assessment on mount
  useEffect(() => {
    const initializeAssessment = async () => {
      if (initRef.current) return;
      initRef.current = true;

      setError(null);
      const isReportMode = window.location.pathname.endsWith('/report');
      console.log(`Initializing ${stageConfig.title} (${stageKey}) - Report Mode: ${isReportMode}...`);

      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          console.warn("⚠ No user data found in session, redirecting to login");
          navigate("/");
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        const userId = parsedUser.id || parsedUser._id;

        if (!userId) {
          throw new Error(t("baseline_test.error_id_not_found", "User ID not found. Please log in again."));
        }

        // CRITICAL - Check attempts and results for multi-attempt stages (T2-T4+)
        const isMultiAttemptStage = stageConfig.maxAttempts > 1;

        if (isMultiAttemptStage) {
          // Fetch attempt history for retry-eligible stages
          console.log(`Fetching attempt history for ${stageKey}...`);
          const attemptsRes = await assessmentApi.getStageAttempts(userId, stageKey).catch(() => ({ success: false }));

          if (attemptsRes.success && attemptsRes.data) {
            const info = attemptsRes.data;
            setAttemptInfo(info);

            // If user already passed, show report or redirect
            if (info.hasPassed) {
              clearTimerPersistence();
              const passedAttempt = info.attempts.find(a => a.passed);
              if (isReportMode) {
                // Fetch full result for report display
                const stageCheck = await assessmentApi.getStageResult(userId, stageKey).catch(() => ({ success: false }));
                if (stageCheck.success && stageCheck.data) {
                  setTestResults(stageCheck.data);
                  setSubmitted(true);
                  setLoading(false);
                  return;
                }
              }
              toast.info(t("baseline_test.already_completed_toast", "You have already completed the {{title}}.", { title: translatedTitle }));
              navigate("/dashboard/assessment-centre", { replace: true });
              return;
            }

            // If locked (exhausted all attempts), show locked screen
            if (info.locked) {
              clearTimerPersistence();
              setError(t("baseline_test.locked_out", "You have used all {{max}} attempts for the {{title}}. Your highest score was {{score}}%. You must restart the course to try again.", {
                max: info.maxAttempts,
                title: translatedTitle,
                score: Math.max(...info.attempts.map(a => a.stageScore || 0))
              }));
              setLoading(false);
              return;
            }
          }
        } else {
          // T1 Baseline — original one-time behavior
          console.log(`Checking for existing ${stageKey} results...`);
          const stageCheck = await assessmentApi.getStageResult(userId, stageKey).catch(() => ({ success: false }));

          if (stageCheck.success && stageCheck.data) {
            clearTimerPersistence();
            if (isReportMode) {
              console.log("✅ Result found in report mode, displaying resultsUI");
              setTestResults(stageCheck.data);
              setSubmitted(true);
              setLoading(false);
              return;
            } else {
              console.warn(`${stageKey} already completed. Redirecting...`);
              toast.info(t("baseline_test.already_completed_toast", "You have already completed the {{title}}.", { title: translatedTitle }));
              navigate("/dashboard/assessment-centre", { replace: true });
              return;
            }
          }
        }

        if (isReportMode) {
          clearTimerPersistence();
          throw new Error(t("baseline_test.report_not_found", "Report not found for {{title}}. Have you completed it yet?", { title: translatedTitle }));
        }

        // Fetch assessment by stage code
        console.log(`Fetching assessment details for ${assessmentCode}...`);
        const assessmentResponse = await assessmentApi.getByCode(assessmentCode);

        if (!assessmentResponse.success) {
          throw new Error(t("baseline_test.failed_fetch_details", "Failed to fetch {{title}} details", { title: translatedTitle }));
        }

        setAssessment(assessmentResponse.data);
        console.log("✅ Assessment details loaded:", assessmentResponse.data.assessmentName);

        // Start the assessment
        if (!assessmentResponse.data._id) {
          throw new Error(t("baseline_test.assessment_id_missing", "Assessment ID is missing from response"));
        }

        const assessmentId = assessmentResponse.data._id;
        console.log(`📡 Starting assessment session for ID: ${assessmentId}`);

        // Set a timeout for the start request to prevent hanging
        const startResponse = await assessmentApi.startAssessment(assessmentId);

        if (!startResponse.success) {
          throw new Error(startResponse.error || t("baseline_test.failed_start_session", "Failed to start assessment session"));
        }

        console.log("✅ Assessment session started, Result ID:", startResponse.data.resultId);
        setResultId(startResponse.data.resultId);
        setAssessmentToken(startResponse.data.assessmentToken); // Save JWT

        // Sync remainingSeconds and startedAt with server response
        if (startResponse.data.remainingSeconds !== undefined) {
          setRemainingSeconds(startResponse.data.remainingSeconds);
          console.log(`⏰ Synced remaining time to server: ${startResponse.data.remainingSeconds} seconds`);
        }
        if (startResponse.data.startedAt) {
          const serverStartTime = new Date(startResponse.data.startedAt).getTime();
          const { startTimeKey } = buildAssessmentTimerStorageKeys(stageKey, userId);
          localStorage.setItem(startTimeKey, String(serverStartTime));
          console.log(`⏰ Synced timer key ${startTimeKey} to server time:`, new Date(serverStartTime).toISOString());
        }

        // Ensure questions are in order (defensive check)
        const fetchedQuestions = startResponse.data.questions || [];
        console.log(`📚 Received ${fetchedQuestions.length} questions`);

        const sortedQuestions = [...fetchedQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
        // Limit to stage-specific question count
        const limitedQuestions = sortedQuestions.slice(0, questionLimit);
        setQuestions(limitedQuestions);

        // PERSISTENCE: Restore previous answers if any
        if (startResponse.data.responses && startResponse.data.responses.length > 0) {
          console.log(`💾 Restoring ${startResponse.data.responses.length} previous responses...`);
          const answersMap = {};
          startResponse.data.responses.forEach(r => {
            answersMap[r.questionId] = r.selectedValue;
          });
          setSelectedAnswers(answersMap);

          // Find the first unanswered question index
          const firstUnansweredIndex = sortedQuestions.findIndex(q => !answersMap[q._id]);
          if (firstUnansweredIndex !== -1) {
            setIndex(firstUnansweredIndex);
          } else if (sortedQuestions.length > 0 && answersMap[sortedQuestions[sortedQuestions.length - 1]._id]) {
            // If all answered, go to last question
            setIndex(sortedQuestions.length - 1);
          }
        }

      } catch (err) {
        console.error("❌ Error initializing assessment:", err);
        
        // --- PROCTORING LOCK CHECK ---
        if (err.data && err.data.locked) {
            clearTimerPersistence();
            navigate('/locked-out', { 
                replace: true, 
                state: { reason: err.data.error || 'Your assessment is locked due to a proctoring violation.' } 
            });
            return;
        }

        setError(err.message || t("baseline_test.error_loading", "Failed to load assessment. Please try refreshing the page."));
      } finally {
        setLoading(false);
        console.log("🏁 Initialization complete, loading set to false.");
      }
    };

    initializeAssessment();
  }, [clearTimerPersistence, navigate, stageKey, t, assessmentCode, questionLimit, stageConfig.maxAttempts, stageConfig.title, translatedTitle]);

  // Timer: Reset when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimeElapsed(0);
  }, [index]);

  // Timer: Update elapsed time until the 5s anti-guessing gate has passed.
  // Ticking forever (for the rest of the question, which can be minutes)
  // was re-rendering the whole page 10x/sec for no visible benefit.
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      setTimeElapsed(elapsed);
      if (elapsed >= 5000) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [questionStartTime]);

  // Save answer to backend (Optimistic UI)
  const selectOption = async (optionValue) => {
    if (!currentQuestionId || !resultId || interactionLocked || submitted) return;

    // 1. Update UI immediately (Optimistic)
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestionId]: optionValue
    }));

    // 2. Fire and forget saving to backend
    try {
      setSavingAnswer(true);
      const response = await assessmentApi.saveAnswer(
        resultId,
        currentQuestionId,
        optionValue,
        current.questionText,
        assessmentToken // Pass JWT
      );

      if (!response.success) {
        console.error("❌ Failed to save answer to backend");
        // Revert UI if needed? Usually for assessments we just keep trying or log it
      }
    } catch (err) {
      console.error("❌ Error saving answer:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  const nextQ = () => {
    if (interactionLocked || submitted) return;
    const timeRequired = 5000; // 5 seconds
    if (timeElapsed < timeRequired) {
      return; // Block navigation if timer hasn't elapsed
    }
    if (selectedValue && index < questions.length - 1) {
      setIndex((i) => i + 1);
    }
  };
  const prevQ = () => { /* Disabled as per user request */ };

  const submit = useCallback(async ({ reason = "manual", redirectAfterSubmit = false, forceTimeoutCompletion = false, forcePassDev = false, forceFailDev = false } = {}) => {
    if (!resultId || submitting || submitted) return;
    if (reason === "manual" && !allQuestionsAnswered && !forcePassDev && !forceFailDev) {
      toast.warning(t("baseline_test.answer_all_toast", "Answer all questions before submitting the test."));
      return;
    }

    let submitSucceeded = false;

    try {
      setSubmitting(true);
      setInteractionLocked(true);

      if (forceTimeoutCompletion) {
        await finalizeUnansweredQuestions();
      }

      const response = await assessmentApi.submitAssessment(resultId, assessmentToken, {
        submissionReason: reason,
        completeMissingAnswers: forceTimeoutCompletion || reason === "violation" || forcePassDev || forceFailDev,
        forcePassDev,
        forceFailDev,
      });

      if (response.success) {
        submitSucceeded = true;
        clearTimerPersistence();
        setSubmitted(true);
        setTestResults(response.data);

        if (response.data.badgesEarned && response.data.badgesEarned.length > 0) {
          handleBadgesEarned(response.data.badgesEarned);
        }

        if (redirectAfterSubmit || reason === "timeout") {
          navigate(`/assessment/${stageKey}/report`, { replace: true });
        }
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
      if (reason === "timeout") {
        const userId = user?.id || user?._id;

        if (userId) {
          try {
            const existingReport = await assessmentApi.getStageResult(userId, stageKey);
            if (existingReport.success && existingReport.data) {
              clearTimerPersistence();
              setSubmitted(true);
              setTestResults(existingReport.data);
              navigate(`/assessment/${stageKey}/report`, { replace: true });
              return;
            }
          } catch (reportLookupError) {
            console.error("Timeout report lookup failed:", reportLookupError);
          }
        }

        alert(t("baseline_test.time_up_ended", "Time is up. Your assessment was ended and we could not confirm the submission result."));
        navigate("/dashboard/assessment-centre", { replace: true });
      } else {
        alert(err.message || t("baseline_test.failed_submit", "Failed to submit assessment."));
      }
    } finally {
      setSubmitting(false);
      if (!submitSucceeded && reason !== "timeout") {
        setInteractionLocked(false);
      }
    }
  }, [allQuestionsAnswered, clearTimerPersistence, finalizeUnansweredQuestions, navigate, resultId, stageKey, submitted, submitting, user, assessmentToken, t, handleBadgesEarned]);

  const handleRestart = async () => {
    if (!resultId) return;
    if (window.confirm(t("baseline_test.confirm_restart", "Are you sure you want to cancel and restart this assessment? Your current progress will be lost."))) {
      try {
        setLoading(true);
        await assessmentApi.resetAssessment(resultId);
        clearTimerPersistence();
        // For development, we reload to start clean
        window.location.reload();
      } catch (err) {
        toast.error(t("baseline_test.failed_reset", "Failed to reset assessment"));
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (loading || submitted || !resultId || !setupCompleted) return;

    oneMinuteAlertShownRef.current = localStorage.getItem(timerWarningStorageKey) === "1";

    if (timerStartRef.current === null) {
      const stored = Number(localStorage.getItem(timerStartStorageKey));
      const now = Date.now();
      const isResumable =
        Number.isFinite(stored) &&
        stored > 0 &&
        stored <= now &&
        (now - stored) < stageDurationSeconds * 1000;

      timerStartRef.current = isResumable ? stored : now;
      localStorage.setItem(timerStartStorageKey, String(timerStartRef.current));

      // Reflect immediately so the display doesn't wait a full second.
      const elapsed = Math.floor((now - timerStartRef.current) / 1000);
      setRemainingSeconds(Math.max(stageDurationSeconds - elapsed, 0));
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (isPausedRef.current) {
          if (pauseStartedAtRef.current === null) pauseStartedAtRef.current = Date.now();
          return prev;
        }
        if (pauseStartedAtRef.current !== null) {
          pausedMsRef.current += Date.now() - pauseStartedAtRef.current;
          pauseStartedAtRef.current = null;
        }

        if (localStorage.getItem(timerStartStorageKey) !== String(timerStartRef.current)) {
          localStorage.setItem(timerStartStorageKey, String(timerStartRef.current));
        }

        const elapsedSeconds = Math.floor(
          (Date.now() - timerStartRef.current - pausedMsRef.current) / 1000
        );
        const next = Math.max(stageDurationSeconds - elapsedSeconds, 0);

        if (next <= 60 && next > 0 && !oneMinuteAlertShownRef.current) {
          oneMinuteAlertShownRef.current = true;
          localStorage.setItem(timerWarningStorageKey, "1");
          alert(t("baseline_test.one_minute_left", "Only 1 minute left!"));
          toast.warning(t("baseline_test.one_minute_left", "Only 1 minute left!"));
        }

        if (next === 0 && !timeoutSubmitTriggeredRef.current) {
          timeoutSubmitTriggeredRef.current = true;
          clearInterval(timer);
          setTimeExpired(true);
          setInteractionLocked(true);
          setShowExitWarning(false);
          toast.error(t("baseline_test.time_up_submitting", "Time is up. Submitting your assessment..."));
          submit({ reason: "timeout", redirectAfterSubmit: true, forceTimeoutCompletion: true });
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    loading,
    resultId,
    setupCompleted,
    submitted,
    submit,
    timerWarningStorageKey,
    timerStartStorageKey,
    stageDurationSeconds,
    t
  ]);

  // Proctoring Logic - Anti-Cheat (using useProctoringEngine)
  const {
    warningsCount,
    maxWarnings,
    isWarningVisible,
    lastViolationType,
    acknowledgeWarning,
    isCameraActive,
    isFaceDetected,
    faceCount,
    cameraError,
    stream,
    isFullScreen,
    fullscreenCountdown,
    requestFullscreen,
    showAttentionCheck,
    passAttentionCheck,
    failAttentionCheck,
    verificationStatus,
    similarityScore,
    diagnostics,
    riskFlagged,
    isCameraWarmingUp,
    gazeDirection,
    // Escalation ladder
    tier,
    nudgeMessage,
    pauseObservations,
    isPaused,
    resumeFromPause,
    // Inactivity presence check
    showInactivityOverlay,
    dismissInactivityOverlay,
    failInactivityCheck
  } = useProctoringEngine({
    resultId: resultId,
    assessmentId: assessment?._id,
    isActive: !loading && !submitted && !error && !!assessment && setupCompleted,
    registeredFaceDescriptor,
    registeredAllEmbeddings,
    registrationMetadata,
  });

  // Keep submitRef always pointing at the latest submit callback
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  // Keep the countdown's view of the pause state current without re-running
  // the timer effect.
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (submitted || loading) return;

    // 1. Prevent Right Click
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warning(t("baseline_test.right_click_disabled", "Right-click is disabled during the assessment."));
    };

    // 2. Prevent Copy/Cut/Paste
    const handleCopyCutPaste = (e) => {
      e.preventDefault();
      toast.warning(t("baseline_test.copy_paste_disabled", "Copying or pasting is not allowed."));
    };

    // 3. Detect PrintScreen / Special Keys
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.metaKey && e.shiftKey && e.key === "3") || (e.metaKey && e.shiftKey && e.key === "4")) {
        e.preventDefault();
        toast.error(t("baseline_test.screenshot_detected", "Screenshot attempt detected!"));
      }

      // Secret pass cheat code — type 'pass' to force 100% submission
      if (!submitted && e.key && e.key.length === 1) {
        const buf = cheatBufferRef.current;
        buf.push(e.key.toLowerCase());
        if (buf.length > 4) buf.shift();
        if (buf.join('') === 'pass') {
          cheatBufferRef.current = [];
          submitRef.current?.({ reason: 'manual', forcePassDev: true });
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCutPaste);
    document.addEventListener("cut", handleCopyCutPaste);
    document.addEventListener("paste", handleCopyCutPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCutPaste);
      document.removeEventListener("cut", handleCopyCutPaste);
      document.removeEventListener("paste", handleCopyCutPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [submitted, loading, t]);


  if (loading) return (
    <div className="min-h-screen bg-[#EAF7FD] dark:bg-[#072036] flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#045C9A] dark:border-[#045C9A] mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">{t("baseline_test.loading_test", "Loading {{title}}...", { title: translatedTitle })}</p>
      </div>
    </div>
  );

  if (attemptInfo.locked) return (
    <div className="min-h-screen bg-[#EAF7FD] dark:bg-[#072036] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center max-w-xl mx-auto p-8 bg-white dark:bg-[#0d3a5f] rounded-2xl shadow-sm border border-red-200 dark:border-red-950/20 relative overflow-hidden text-[#072036] dark:text-white">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-red-500/5 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="text-red-500 text-6xl mb-6 flex justify-center">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-[#034a7d] dark:text-white mb-4">
          Assessment Locked Out
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-base leading-relaxed">
          You have exhausted all <strong>{attemptInfo.maxAttempts} attempts</strong> for the <strong>{translatedTitle} ({stageKey})</strong> assessment. To try again, you must restart the course tracks associated with this stage.
        </p>

        {/* Attempt history list */}
        {attemptInfo.attempts && attemptInfo.attempts.length > 0 && (
          <div className="bg-[#F1F5F9] dark:bg-slate-800/40 rounded-2xl p-5 mb-8 border border-[#d7ebf5] dark:border-white/5 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              Attempt History
            </h4>
            <div className="space-y-3">
              {attemptInfo.attempts.map((attempt) => (
                <div key={attempt.attemptNumber} className="flex justify-between items-center text-sm py-2 border-b border-[#d7ebf5] dark:border-white/5 last:border-0 last:pb-0">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Attempt #{attempt.attemptNumber}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 dark:text-slate-400 text-xs">{new Date(attempt.createdAt).toLocaleDateString()}</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{attempt.stageScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <button
            onClick={handleRestartCourse}
            className="px-8 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0"
          >
            <AlertTriangle className="w-5 h-5" />
            Restart Stage Courses
          </button>
          
          <button
            onClick={() => navigate("/dashboard/assessment-centre")}
            className="px-7 py-3.5 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-[#F1F5F9] dark:hover:bg-[#003170] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
          >
            {t("baseline_test.back_to_assessments", "Back to Assessments")}
          </button>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#EAF7FD] dark:bg-[#072036] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-[#0d3a5f] rounded-2xl shadow-xl border border-red-200 dark:border-red-900/30 text-[#072036] dark:text-white">
        <div className="text-red-500 text-5xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-[#072036] dark:text-white mb-2">{t("baseline_test.error", "Error")}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate("/dashboard/assessment-centre")} className="px-6 py-2 bg-[#045C9A] text-white rounded-lg hover:bg-[#0d3a5f] font-medium transition-colors">
          {t("baseline_test.back_to_assessments", "Back to Assessments")}
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#EAF7FD] dark:bg-[#072036] text-[#072036] dark:text-white transition-colors duration-300 flex flex-col ${submitted ? "" : "justify-center"}`}>
      {!submitted && !loading && !error && !setupCompleted && (
        <ProctoringSetup
          onComplete={({ faceDescriptor, allEmbeddings, alignedCrops, registrationQualityScore, framesCaptured, registrationCropUrl }) => {
            setRegisteredFaceDescriptor(faceDescriptor);
            setRegisteredAllEmbeddings(allEmbeddings || null);
            setRegistrationMetadata({
              model: 'arcface-r50-onnx',
              qualityScore: registrationQualityScore || null,
              framesCaptured: framesCaptured ?? null,
              antispoofPassed: null, // No anti-spoof model is loaded — do not claim one passed.

              registrationCropUrl: registrationCropUrl || null,
              alignedCrops: alignedCrops || null,
            });
            setSetupCompleted(true);
          }}
          assessmentTitle={translatedTitle}
        />
      )}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
      </div>
      <main className={`relative z-10 mx-auto w-full max-w-6xl p-4 md:p-6 lg:p-8 ${submitted ? "" : "min-h-[calc(100vh-4rem)] flex flex-col justify-center"}`}>
        {/* Immersive mesh glow effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div
            animate={{
              x: [0, 40, -30, 0],
              y: [0, -40, 30, 0],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-gradient-to-br from-[#045C9A]/10 via-[#045C9A]/5 to-transparent rounded-full blur-[120px] dark:from-[#045C9A]/25"
          />
          <motion.div
            animate={{
              x: [0, -40, 30, 0],
              y: [0, 40, -35, 0],
              scale: [1, 0.9, 1.1, 1],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#034a7d]/10 via-[#045C9A]/5 to-transparent rounded-full blur-[120px] dark:from-[#034a7d]/25"
          />
        </div>

        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8 relative z-10">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col min-h-[540px] bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-[#045C9A]/25 shadow-sm overflow-hidden relative text-[#072036] dark:text-white">
              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#045C9A]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="p-6 border-b border-[#d7ebf5] dark:border-[#045C9A]/25 bg-[#F1F5F9]/60 dark:bg-[#0d3a5f]/20 relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowExitWarning(true)}
                      disabled={submitting || interactionLocked || timeExpired}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#d7ebf5] dark:border-[#045C9A]/25 bg-white dark:bg-[#0d3a5f] px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 transition-all hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t("baseline_test.back", "Back")}
                    </button>
                    <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[#034a7d] dark:text-white">{translatedTitle} <span className="text-[#045C9A] dark:text-[#A6D7E8]">{stageKey}</span></h2>
                    {stageConfig.maxAttempts > 1 && attemptInfo.attemptCount > 0 && (
                      <span className="ml-2 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-500/20">
                        Attempt {attemptInfo.attemptCount + 1} / {attemptInfo.maxAttempts}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("baseline_test.time_left", "Time Left")}:{" "}
                      <span className={`font-mono font-bold ${isLastFiveMinutes ? "text-red-500 animate-pulse" : "text-[#045C9A] dark:text-[#A6D7E8]"}`}>
                        {formatCountdown(remainingSeconds)}
                      </span>
                    </div>
                    {isLastFiveMinutes && (
                      <p className="mt-1 text-[11px] md:text-xs font-bold uppercase tracking-wider text-red-500">
                        {t("baseline_test.time_almost_up", "Time Almost Up!")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-[#d7ebf5] dark:bg-[#072036] rounded-full overflow-hidden border border-[#d7ebf5] dark:border-[#045C9A]/20 relative">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#034a7d] to-[#045C9A] dark:from-[#045C9A] dark:to-[#A6D7E8] relative"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Bouncy active shimmer glow */}
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0)_100%)] w-[50%] animate-pulse" />
                    </motion.div>
                  </div>
                  <span className="text-xs font-bold text-[#045C9A] dark:text-[#A6D7E8] min-w-[3rem] text-right">{progress}%</span>
                </div>
              </div>

              <div className="p-6 md:p-10 flex-1 relative z-10 flex flex-col justify-center gap-6">
                <div className="mb-4 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#045C9A]/10 dark:bg-[#045C9A]/10 text-[#045C9A] dark:text-[#A6D7E8] text-xs font-extrabold uppercase tracking-widest mb-2.5 border border-[#045C9A]/20 dark:border-[#045C9A]/25 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8] animate-ping" />
                    {t("baseline_test.question_number", "Question {{current}} / {{total}}", { current: index + 1, total: questions.length })}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-[#072036] dark:text-white leading-snug mb-2 tracking-tight">
                    {current?.questionText}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 md:gap-4.5 max-w-3xl mx-auto w-full mt-2">
                  {current?.options?.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => selectOption(option.value)}
                        disabled={interactionLocked || submitting || timeExpired}
                        className={`group relative p-4 md:p-5 min-h-[75px] md:min-h-[85px] rounded-2xl border-2 transition-all duration-350 text-left hover:scale-[1.01] hover:shadow-md active:scale-[0.995] ${isSelected
                          ? 'border-[#045C9A] dark:border-[#045C9A] bg-[#045C9A]/5 dark:bg-[#045C9A]/10 shadow-[0_4px_20px_rgba(26,56,132,0.15)] text-[#045C9A] dark:text-white font-bold'
                          : 'border-[#d7ebf5] dark:border-[#045C9A]/25 bg-white dark:bg-[#0d3a5f] hover:border-[#045C9A]/50 dark:hover:border-[#045C9A]/50 hover:bg-[#EAF7FD]/60 dark:hover:bg-[#0d3a5f] text-slate-700 dark:text-slate-200'
                          }`}
                      >
                        <div className="flex items-center gap-4 md:gap-5">
                          <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full border-2 flex items-center justify-center font-extrabold text-sm md:text-base shrink-0 transition-all duration-300 shadow-sm ${isSelected
                            ? 'bg-gradient-to-br from-[#034a7d] to-[#045C9A] dark:from-[#045C9A] dark:to-[#034a7d] border-transparent text-white shadow-md scale-105'
                            : 'border-slate-300 dark:border-[#045C9A]/30 text-slate-400 dark:text-slate-500 group-hover:border-[#045C9A] dark:group-hover:border-[#045C9A]/50 group-hover:text-[#045C9A] dark:group-hover:text-[#A6D7E8]'
                            }`}>
                            {option.value}
                          </div>
                          <span className={`text-sm md:text-base transition-colors ${isSelected ? 'text-[#045C9A] dark:text-[#A6D7E8] font-bold' : 'text-slate-700 dark:text-slate-200 font-semibold'}`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual "Next" / "Submit" button */}
                <div className="h-16 mt-4 md:mt-6 flex justify-center items-center">
                  <AnimatePresence>
                    {index < questions.length - 1 ? (
                      selectedValue && (
                        <motion.button
                          key="next-btn"
                          initial={{ opacity: 0, y: 10, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={nextQ}
                          disabled={timeElapsed < 5000 || interactionLocked || submitting || timeExpired}
                          className={`px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-xl shadow-[#045C9A]/20 dark:shadow-blue-500/10 transition-all flex items-center gap-2.5 ${timeElapsed < 5000
                            ? 'bg-[#d7ebf5] dark:bg-[#0d3a5f] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-[#045C9A]/25'
                            : 'bg-[#045C9A] dark:bg-[#045C9A] text-white hover:bg-[#0d3a5f] dark:hover:bg-[#034a7d] hover:shadow-sm hover:-translate-y-1'
                            }`}
                        >
                          {timeElapsed < 5000 ? (
                            <>
                              <span>{t("baseline_test.wait_seconds", "Wait {{seconds}}s", { seconds: Math.ceil((5000 - timeElapsed) / 1000) })}</span>
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            </>
                          ) : (
                            <>
                              {t("baseline_test.next_question", "Next Question")} <CheckCircle2 size={20} />
                            </>
                          )}
                        </motion.button>
                      )
                    ) : (
                      <motion.button
                        key="submit-btn"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => submit()}
                        disabled={submitting || interactionLocked || timeExpired || !allQuestionsAnswered || !selectedValue}
                        className={`px-8 md:px-10 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2.5 ${(!allQuestionsAnswered || !selectedValue)
                          ? 'bg-[#d7ebf5] dark:bg-[#0d3a5f] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-transparent dark:border-[#045C9A]/25'
                          : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:shadow-sm hover:-translate-y-1 shadow-md'
                          }`}
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>{t("baseline_test.submitting", "Submitting...")}</span>
                          </>
                        ) : !allQuestionsAnswered || !selectedValue ? (
                          <>
                            <Lock className="w-4 h-4" />
                            <span>{t("baseline_test.answer_all_questions", "Answer All Questions")}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            <span>{t("baseline_test.submit_test", "Submit Test")}</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <div className="lg:w-[320px] bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-[#045C9A]/25 shadow-xl p-6 h-fit shrink-0 lg:sticky lg:top-6 flex flex-col gap-6 text-[#072036] dark:text-white">
              <div>
                <h4 className="text-lg font-bold text-[#072036] dark:text-white mb-4 flex items-center gap-2">
                  <Target className="text-[#045C9A] dark:text-[#A6D7E8]" size={20} /> {t("baseline_test.question_map", "Question Map")}
                </h4>
                <div className="grid grid-cols-6 gap-2 max-h-[300px] md:max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                  {questions.map((q, idx) => (
                    <button
                      key={q._id}
                      onClick={() => { /* Optional: Allow navigating back to answered questions? For now kept disabled/visual only based on original code 'prevQ' disabled */ }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-[10px] md:text-xs font-bold transition-all cursor-default relative group
                        ${index === idx
                          ? 'bg-[#045C9A] dark:bg-[#045C9A] text-white shadow-md scale-105 border-2 border-emerald-400'
                          : selectedAnswers[q._id]
                            ? 'bg-[#045C9A]/10 dark:bg-[#045C9A]/15 text-[#045C9A] dark:text-[#A6D7E8] border border-[#045C9A]/20 dark:border-[#045C9A]/30'
                            : 'bg-[#F1F5F9] dark:bg-[#0d3a5f] text-slate-400 dark:text-slate-500 border border-[#d7ebf5]/5 dark:border-[#045C9A]/25'
                        }`}
                    >
                      {idx + 1}
                      {/* Tooltip on hover */}
                      <span className="hidden md:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-20">
                        Q{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#d7ebf5] dark:border-[#045C9A]/25">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#045C9A] dark:bg-[#045C9A]" /> {t("baseline_test.answered", "Answered")}</span>
                  <span className="font-bold text-[#072036] dark:text-white">{Object.keys(selectedAnswers).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#d7ebf5] dark:bg-[#0d3a5f] border border-transparent dark:border-[#045C9A]/25" /> {t("baseline_test.remaining", "Remaining")}</span>
                  <span className="font-bold text-[#072036] dark:text-white">{questions.length - Object.keys(selectedAnswers).length}</span>
                </div>
              </div>



              {/* DEV: Auto Answer */}
              <div className="pt-4 border-t border-dashed border-[#d7ebf5] dark:border-[#045C9A]/25 opacity-50 hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button
                  disabled={submitting || interactionLocked || timeExpired}
                  onClick={async () => {
                    try {
                      const btn = document.activeElement;
                      btn.innerText = "⚡ Passing...";
                      btn.disabled = true;
                      await submit({ reason: "manual", redirectAfterSubmit: false, forcePassDev: true });
                    } catch (err) {
                      console.error("Pass dev failed:", err);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors border border-emerald-200 dark:border-emerald-800/20"
                >
                  {t("baseline_test.pass_dev", "⚡ Pass 70% (Dev)")}
                </button>
                <button
                  disabled={submitting || interactionLocked || timeExpired}
                  onClick={async () => {
                    try {
                      const btn = document.activeElement;
                      btn.innerText = "⚡ Failing...";
                      btn.disabled = true;
                      await submit({ reason: "manual", redirectAfterSubmit: false, forceFailDev: true });
                    } catch (err) {
                      console.error("Fail dev failed:", err);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="w-full py-2 bg-rose-50 dark:bg-[#ff0000]/10 text-rose-700 dark:text-red-400 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-rose-100 dark:hover:bg-[#ff0000]/20 transition-colors border border-rose-200 dark:border-red-900/25"
                >
                  {t("baseline_test.fail_dev", "⚡ Fail (Dev)")}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto py-8 px-4"
          >
            {/* Main Results Card */}
            {/* Main Results Card - Minimal Configuration */}
            <div className="relative mx-auto max-w-4xl rounded-2xl border border-[#d7ebf5] bg-white p-6 text-[#072036] shadow-sm sm:p-8 dark:border-[#045C9A]/25 dark:bg-[#072036] dark:text-white">

              {/* Header: candidate on the left, result identity on the right.
                  The name block used to be absolutely positioned over a centred
                  title, so the two collided at most widths. */}
              <div className="mb-8 border-b border-[#d7ebf5] pb-6 dark:border-white/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {t("baseline_test.candidate", "Candidate")}
                    </p>
                    <p className="mt-1 truncate text-[15px] font-bold text-[#072036] dark:text-white">{user?.fullName}</p>
                    <p className="mt-0.5 text-[12px] font-medium tabular-nums text-slate-600 dark:text-slate-400">{user?.studentId}</p>
                    <p className="text-[12px] font-medium text-slate-600 dark:text-slate-400">
                      {user?.college?.collegeName || user?.collegeName || t("baseline_test.student", "Student")}
                    </p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <h2 className="text-xl font-extrabold tracking-tight text-[#072036] dark:text-white sm:text-2xl">
                      {stageKey === 'T1' ? t("baseline_test.baseline_established", "Baseline Established") : t("baseline_test.assessment_complete", "{{name}} Assessment Complete", { name: translatedName })}
                    </h2>
                    <p className="mt-1 text-[11px] font-medium tabular-nums text-slate-600 dark:text-slate-400">
                      {t("baseline_test.result_id", "Result ID: {{id}}", { id: `${stageKey}-${user?.studentId || 'REF'}` })}
                      <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                      S_{stageConfig.name.toLowerCase()}
                      {testResults?.attemptNumber ? (
                        <>
                          <span className="mx-1.5 text-slate-300 dark:text-slate-600">|</span>
                          <span className="font-bold">
                            {t("baseline_test.attempt_n", "Attempt #{{n}}", { n: testResults.attemptNumber })}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>

                {/* Pass/Fail Badge for multi-attempt stages */}
                {stageConfig.maxAttempts > 1 && testResults && (
                  <div className="mt-4">
                    {testResults.passed ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t("baseline_test.passed_with_score", "Passed — {{score}}% (required {{required}}%)", { score: testResults.stageScore, required: stageConfig.passingPercentage })}
                      </span>
                    ) : (
                      <div className="space-y-2">
                        {testResults.remainingAttempts !== undefined && testResults.remainingAttempts > 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            You have {testResults.remainingAttempts} attempt{testResults.remainingAttempts !== 1 ? 's' : ''} remaining. Each retry will have different questions.
                          </p>
                        )}
                        {testResults.mustRestartCourse && (
                          <p className="text-xs text-red-600 dark:text-red-400 font-bold">
                            All {testResults.maxAttempts || stageConfig.maxAttempts} attempts used. You must restart the course to try again.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Certificate earned chip (auto-issued on passing a stage gate) */}
                {testResults?.passed && ['T2', 'T3', 'T4'].includes(stageKey) && (
                  <div className="mb-3">
                    <button
                      onClick={() => navigate('/dashboard/skills-vault')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#045C9A]/25 bg-[#EAF7FD] px-2.5 py-1 text-[11px] font-bold text-[#045C9A] transition-colors hover:bg-[#045C9A] hover:text-white dark:border-[#045C9A]/40 dark:bg-[#045C9A]/15 dark:text-[#A6D7E8] dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
                    >
                      <Award className="w-3.5 h-3.5" /> {t("baseline_test.certificate_earned", "Certificate Earned — View in Skills Vault")}
                    </button>
                  </div>
                )}

              </div>

              {/* Headline figures. These were one 48px hero number and a
                  pill the same size as the page title; a report reads better
                  with the two facts given equal, quieter weight. */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] p-5 dark:border-white/10 dark:bg-[#072036]/60">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    {t("baseline_test.overall_score", "Overall Score")}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-1 text-[#072036] dark:text-white">
                    <span className="text-3xl font-extrabold tabular-nums">
                      {testResults?.stageScore || testResults?.baselineScore}
                    </span>
                    <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">/ 100</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] p-5 dark:border-white/10 dark:bg-[#072036]/60">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">
                    {t("baseline_test.proficiency_level", "Proficiency Level")}
                  </div>
                  <div className="mt-1.5">
                    {stageConfig.maxAttempts > 1 && testResults && !testResults.passed ? (
                      <span className="inline-flex items-center rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[13px] font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                        {t("baseline_test.keep_improving", "Keep Improving")}
                      </span>
                    ) : (
                      <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[13px] font-bold ${getBandColor(testResults?.stageBand || 'Emerging').badge}`}>
                        {t(`baseline_test.bands.${testResults?.stageBand || 'Emerging'}`, testResults?.stageBand || 'Emerging')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* T4 Final: Total Growth Δ + Learning Velocity (Blueprint v1.0) */}
              {stageKey === 'T4' && (testResults?.growthDelta != null || testResults?.plviBand) && (
                <div className="flex flex-col sm:flex-row items-stretch justify-center gap-4 mb-12">
                  <div className="flex-1 text-center bg-[#F1F5F9] dark:bg-[#072036]/60 rounded-xl p-5 border border-[#d7ebf5] dark:border-[#045C9A]/25">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("baseline_test.total_growth", "Total Growth (T1 → T4)")}</div>
                    <div className="text-3xl font-bold text-[#045C9A] dark:text-[#A6D7E8]">
                      {testResults.growthDelta == null ? '—' : `${testResults.growthDelta >= 0 ? '+' : ''}${testResults.growthDelta} pts`}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t("baseline_test.since_baseline", "since your baseline")}</div>
                  </div>
                  <div className="flex-1 text-center bg-[#F1F5F9] dark:bg-[#072036]/60 rounded-xl p-5 border border-[#d7ebf5] dark:border-[#045C9A]/25">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("baseline_test.learning_velocity", "Learning Velocity")}</div>
                    <div className="text-3xl font-bold text-[#045C9A] dark:text-[#A6D7E8]">{testResults.plviBand || '—'}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {testResults.tDays ? `over ${testResults.tDays} ${testResults.tDaysBasis === 'active' ? 'active learning days' : 'days'}` : t("baseline_test.rate_of_growth", "rate of growth")}
                    </div>
                  </div>
                </div>
              )}

              {/* Quotient Cards Grid */}
              <div className="mb-12 relative z-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4 flex items-center gap-2.5"
                >
                  <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#045C9A]" />
                  <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#072036] dark:text-slate-300">
                    {t("baseline_test.quotient_breakdown", "Quotient-Wise Breakdown")}
                  </h3>
                  <span className="ml-1 hidden h-px flex-1 bg-[#d7ebf5] dark:bg-white/10 sm:block" />
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(testResults?.quotientProfile || testResults?.t1Profile) ? Object.entries(testResults?.quotientProfile || testResults?.t1Profile).map(([quotient, data], index) => {
                    const info = quotientInfo[quotient];
                    const colors = getBandColor(data.level);
                    const qName = t(`baseline_test.quotients.${quotient}.name`, info.name);
                    const qDesc = t(`baseline_test.quotients.${quotient}.desc`, info.desc);

                    return (
                      <motion.div
                        key={quotient}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.45 + Math.min(index, 6) * 0.06, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                        className="rounded-2xl border border-[#d7ebf5] bg-white p-5 text-[#072036] shadow-sm transition-all duration-300 hover:border-[#045C9A]/40 hover:shadow-md dark:border-[#045C9A]/25 dark:bg-[#072036]/60 dark:text-white dark:hover:border-[#045C9A]/45"
                      >
                        <div className="relative z-10">
                          {/* Header */}
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
                                {info.icon}
                              </span>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{quotient}</span>
                                <h4 className="text-[13px] font-bold leading-snug tracking-tight text-[#072036] dark:text-white">{qName}</h4>
                              </div>
                            </div>
                            <span className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                              {t(`baseline_test.bands.${data.level}`, data.level)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="mb-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{qDesc}</p>

                          {/* Score Display */}
                          <div className="mb-3 flex items-end justify-between gap-3">
                            <div className="flex items-baseline gap-0.5 text-[#072036] dark:text-white">
                              <span className="text-2xl font-extrabold tabular-nums">{data.rawScore}</span>
                              <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">%</span>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t("baseline_test.performance", "Performance")}</div>
                              <div className="text-[12px] font-bold tabular-nums text-slate-700 dark:text-slate-200">
                                {data.earned}/{data.possible} {t("baseline_test.correct", "correct")}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#A6D7E8]/40 dark:bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${data.rawScore}%` }}
                              transition={{ delay: 0.9 + index * 0.1, duration: 1.2, ease: "easeOut" }}
                              className="relative h-full rounded-full"
                              style={{ background: "linear-gradient(90deg, #034a7d 0%, #045C9A 100%)" }}
                            />
                          </div>

                          {/* Band indicator */}
                          <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            <span>0</span>
                            <span>20</span>
                            <span>40</span>
                            <span>60</span>
                            <span>80</span>
                            <span>100</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }) : (
                    <div className="col-span-3 text-center py-12">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#045C9A] border-t-transparent mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t("baseline_test.processing_profile", "Processing your profile...")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Attempt-Aware */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-8 flex flex-col flex-wrap items-center justify-center gap-3 border-t border-[#d7ebf5] pt-6 sm:flex-row dark:border-white/10"
              >
                <button
                  onClick={() => downloadReport(user, testResults)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#F1F5F9] sm:w-auto dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100 dark:hover:bg-[#0d3a5f]/70"
                >
                  <Download className="w-4 h-4" />
                  {t("baseline_test.download_report", "Download Report")}
                </button>

                {/* Show retry or continue based on pass/fail */}
                {stageConfig.maxAttempts > 1 && testResults && !testResults.passed ? (
                  <>
                    {testResults.remainingAttempts > 0 ? (
                      <button
                        onClick={() => {
                          // Clear state and reload to start a new attempt
                          clearTimerPersistence();
                          initRef.current = false;
                          window.location.reload();
                        }}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-amber-500/20 transition-colors hover:bg-amber-600 sm:w-auto"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Retry Assessment (Attempt {(testResults.attemptNumber || 0) + 1}/{testResults.maxAttempts || stageConfig.maxAttempts})
                      </button>
                    ) : (
                      <button
                        onClick={handleRestartCourse}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-rose-600/20 transition-colors hover:bg-rose-700 sm:w-auto"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Restart Course
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => {
                      if (stageKey === 'T1') navigate("/dashboard/courses");
                      else if (stageKey === 'T2') navigate("/dashboard/courses/S11/player");
                      else if (stageKey === 'T3') navigate("/dashboard/courses/S20/player");
                      else navigate("/dashboard/skills-passport");
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#072036] px-6 py-2.5 text-[13px] font-semibold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] sm:w-auto dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {t("baseline_test.continue_journey", "Continue My Journey")}
                  </button>
                )}

                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#F1F5F9] sm:w-auto dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100 dark:hover:bg-[#0d3a5f]/70"
                >
                  {t("baseline_test.go_to_dashboard", "Go to Dashboard")}
                </button>

                <button
                  onClick={() => navigate("/dashboard/assessment-centre")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-colors hover:bg-[#F1F5F9] sm:w-auto dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100 dark:hover:bg-[#0d3a5f]/70"
                >
                  {t("baseline_test.all_assessments", "All Assessments")}
                </button>
              </motion.div>


            </div>
          </motion.div>
        )}
      </main>

      {/* Exit Warning Modal */}
      {
        showExitWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#0d3a5f] p-8 rounded-2xl shadow-sm max-w-md w-full border border-[#d7ebf5] dark:border-[#045C9A]/25 text-[#072036] dark:text-white">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#072036] dark:text-white text-center mb-4">{t("baseline_test.exit_warning_title", "Don't Leave Yet!")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t("baseline_test.exit_warning_desc", "Back navigation is disabled while the assessment is in progress. If you leave now, you will return to the assessment dashboard.")}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={leaveAssessmentPage}
                  className="w-full py-4 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-[#045C9A]/25 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-[#F1F5F9] dark:hover:bg-[#0d3a5f] transition-all shadow-sm"
                >
                  {t("baseline_test.leave_assessment", "Leave Assessment")}
                </button>
                <button onClick={() => {
                  setShowExitWarning(false);
                }} className="w-full py-4 bg-[#045C9A] dark:bg-[#045C9A] text-white rounded-xl font-bold hover:bg-[#0d3a5f] dark:hover:bg-[#034a7d] transition-all shadow-md">{t("baseline_test.continue_assessment", "Continue Assessment")}</button>
              </div>
            </motion.div>
          </div>
        )
      }

      {/* Badge Notification Modal */}
      <BadgeModal
        isOpen={showBadgeModal}
        onClose={() => setShowBadgeModal(false)}
        badge={earnedBadge}
        userName={user?.fullName || t("baseline_test.student", "Student")}
      />

      {/* Activity Restriction Warning Modal */}
      <ProctoringWarningModal
        isOpen={isWarningVisible}
        warningsCount={warningsCount}
        maxWarnings={maxWarnings}
        riskFlagged={riskFlagged}
        violationType={lastViolationType}
        onAcknowledge={acknowledgeWarning}
      />

      {/* Proctoring Overlay (Webcam PiP) */}
      {!submitted && !loading && !error && setupCompleted && (
        <ProctoringOverlay
          stream={stream}
          isCameraActive={isCameraActive}
          isFaceDetected={isFaceDetected}
          faceCount={faceCount}
          warningsCount={warningsCount}
          maxWarnings={maxWarnings}
          isFullScreen={isFullScreen}
          fullscreenCountdown={fullscreenCountdown}
          onRequestFullscreen={requestFullscreen}
          verificationStatus={verificationStatus}
          similarityScore={similarityScore}
          isCameraWarmingUp={isCameraWarmingUp}
          gazeDirection={gazeDirection}
          diagnostics={diagnostics}
          nudgeMessage={nudgeMessage}
          riskFlagged={riskFlagged}
        />
      )}

      {/* Attention Check popup */}
      {showAttentionCheck && (
        <AttentionCheck
          onPass={passAttentionCheck}
          onFail={failAttentionCheck}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div >
  );
};

export default BaseLineTest;



