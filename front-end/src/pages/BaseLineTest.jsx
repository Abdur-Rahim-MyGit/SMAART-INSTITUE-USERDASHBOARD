import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { assessmentApi } from "@/services/assessmentApi";
import { CheckCircle2, XCircle, Target, AlertTriangle, Lock, Download, TrendingUp, Award, Sparkles, Brain, Users, BookOpen, Heart, Monitor, Zap, ShieldCheck, Trophy, BarChart3, Sprout, Briefcase, RefreshCw, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import BadgeModal from "@/components/badges/BadgeModal";
import { buildAssessmentTimerStorageKeys, clearAssessmentTimerStorage } from "@/utils/assessmentTimerStorage";

// Stage configuration map
const STAGE_MAP = {
  T1: { code: 'ASM00001', name: 'Baseline', title: 'Base Line Test', questionLimit: 36, durationMinutes: 45 },
  T2: { code: 'ASM00002', name: 'Capacity', title: 'Capacity Test', questionLimit: 34, durationMinutes: 40 },
  T3: { code: 'ASM00003', name: 'Capability', title: 'Capability Test', questionLimit: 36, durationMinutes: 45 },
  T4: { code: 'ASM00004', name: 'Leadership', title: 'Leadership Test', questionLimit: 34, durationMinutes: 40 },
};

// Helper function to get band colors - MINIMAL MONOCHROME THEME
const getBandColor = (level) => {
  // Uniform professional styling with Brand Colors
  const style = {
    bg: 'bg-[#1a3884]/5 dark:bg-[#1a3884]/10',
    text: 'text-[#1a3884] dark:text-blue-300',
    badge: 'bg-[#1a3884]/10 text-[#1a3884] border-[#1a3884]/20',
    bar: 'bg-[#1a3884]', // Brand Teal
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
  CRQ: { name: 'Cognitive Reasoning', fullName: 'Cognitive Reasoning Quotient', icon: <Brain className="w-8 h-8" />, desc: 'Critical thinking & logical reasoning' },
  SRQ: { name: 'Self-regulation & Drive', fullName: 'Self-regulation & Drive Quotient', icon: <Heart className="w-8 h-8" />, desc: 'Motivation, resilience & emotional control' },
  LQ: { name: 'Learning Agility', fullName: 'Learning Agility Quotient', icon: <BookOpen className="w-8 h-8" />, desc: 'Adaptability & continuous learning' },
  SIQ: { name: 'Social Interaction', fullName: 'Social Interaction Quotient', icon: <Users className="w-8 h-8" />, desc: 'Collaboration, empathy & communication' },
  PEQ: { name: 'Professional Execution', fullName: 'Professional Execution Quotient', icon: <Briefcase className="w-8 h-8" />, desc: 'Work ethic, reliability & delivery' },
  DAQ: { name: 'Digital & AI Literacy', fullName: 'Digital & AI Literacy Quotient', icon: <Monitor className="w-8 h-8" />, desc: 'Tech proficiency & AI readiness' }
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

  const timerStartRef = useRef(null);
  const timeoutSubmitTriggeredRef = useRef(false);
  const oneMinuteAlertShownRef = useRef(false);
  const initRef = useRef(false);

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

  const handleBadgesEarned = (newBadges) => {
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
  };

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
  const allQuestionsAnswered = questions.length > 0 && answeredCount === questions.length;

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

    const unansweredQuestions = questions.filter((question) => !selectedAnswers[question._id]);
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
  }, [questions, resultId, selectedAnswers]);

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

        // CRITICAL - If in report mode or if stage already completed, fetch results
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
        setError(err.message || t("baseline_test.error_loading", "Failed to load assessment. Please try refreshing the page."));
      } finally {
        setLoading(false);
        console.log("🏁 Initialization complete, loading set to false.");
      }
    };

    initializeAssessment();
  }, [clearTimerPersistence, navigate, stageKey, t]);

  // Timer: Reset when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimeElapsed(0);
  }, [index]);

  // Timer: Update elapsed time every 100ms
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - questionStartTime);
    }, 100);
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

  const submit = useCallback(async ({ reason = "manual", redirectAfterSubmit = false, forceTimeoutCompletion = false } = {}) => {
    if (!resultId || submitting || submitted) return;
    if (reason === "manual" && !allQuestionsAnswered) {
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
        completeMissingAnswers: forceTimeoutCompletion || reason === "violation",
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
  }, [allQuestionsAnswered, clearTimerPersistence, finalizeUnansweredQuestions, navigate, resultId, stageKey, submitted, submitting, user, assessmentToken, t]);

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
    if (loading || submitted || !resultId) return;

    let persistedStartTime = Number(localStorage.getItem(timerStartStorageKey));
    if (!Number.isFinite(persistedStartTime) || persistedStartTime <= 0 || persistedStartTime > Date.now()) {
      persistedStartTime = Date.now();
      localStorage.setItem(timerStartStorageKey, String(persistedStartTime));
    }

    timerStartRef.current = persistedStartTime;
    oneMinuteAlertShownRef.current = localStorage.getItem(timerWarningStorageKey) === "1";

    const updateCountdown = () => {
      if (!timerStartRef.current) return;

      if (localStorage.getItem(timerStartStorageKey) !== String(timerStartRef.current)) {
        localStorage.setItem(timerStartStorageKey, String(timerStartRef.current));
      }

      const elapsedSeconds = Math.floor((Date.now() - timerStartRef.current) / 1000);
      const nextRemainingSeconds = Math.max(stageDurationSeconds - elapsedSeconds, 0);
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds <= 60 && nextRemainingSeconds > 0 && !oneMinuteAlertShownRef.current) {
        oneMinuteAlertShownRef.current = true;
        localStorage.setItem(timerWarningStorageKey, "1");
        alert(t("baseline_test.one_minute_left", "Only 1 minute left!"));
        toast.warning(t("baseline_test.one_minute_left", "Only 1 minute left!"));
      }

      if (nextRemainingSeconds === 0 && !timeoutSubmitTriggeredRef.current) {
        timeoutSubmitTriggeredRef.current = true;
        setTimeExpired(true);
        setInteractionLocked(true);
        setShowExitWarning(false);
        toast.error(t("baseline_test.time_up_submitting", "Time is up. Submitting your assessment..."));
        submit({ reason: "timeout", redirectAfterSubmit: true, forceTimeoutCompletion: true });
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [
    loading,
    resultId,
    stageDurationSeconds,
    submitted,
    submit,
    timerStartStorageKey,
    timerWarningStorageKey,
    t
  ]);

  // Proctoring Logic - Anti-Cheat
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;

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
        handleViolation(t("baseline_test.screenshot_detected", "Screenshot attempt detected!"));
      }
    };

    // 4. Detect Focus Loss (Alt-Tab / Switching Windows)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation(t("baseline_test.navigated_away", "You navigated away from the test window."));
      }
    };

    // Violation Handler
    const handleViolation = (message) => {
      setWarnings(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_WARNINGS) {
          // Force Submit
          submit({ reason: "violation", redirectAfterSubmit: true });
          toast.error(t("baseline_test.terminated_violations", "Test terminated due to multiple violations."));
          return newCount;
        }
        toast.error(t("baseline_test.warning_violations", "Warning {{count}}/{{max}}: {{message}}", { count: newCount, max: MAX_WARNINGS, message }));
        return newCount;
      });
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyCutPaste);
    document.addEventListener("cut", handleCopyCutPaste);
    document.addEventListener("paste", handleCopyCutPaste);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    // Blur window detection is too aggressive sometimes, sticking to visibilitychange for now

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCutPaste);
      document.removeEventListener("cut", handleCopyCutPaste);
      document.removeEventListener("paste", handleCopyCutPaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [submitted, loading, submit, t]); // Added submit to dependencies if stable (or remove if causes loop, submit uses refs or is stable)


  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1a3884] mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">{t("baseline_test.loading_test", "Loading {{title}}...", { title: translatedTitle })}</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-[#002147] rounded-2xl shadow-xl border border-red-200 dark:border-red-900/30">
        <div className="text-red-500 text-5xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t("baseline_test.error", "Error")}</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate("/dashboard/assessment-centre")} className="px-6 py-2 bg-[#1a3884] text-white rounded-lg hover:bg-[#277a84] font-medium transition-colors">
          {t("baseline_test.back_to_assessments", "Back to Assessments")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] text-slate-900 dark:text-white transition-colors duration-300">
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative">
              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1a3884]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-dark-elevated/30 relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowExitWarning(true)}
                      disabled={submitting || interactionLocked || timeExpired}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t("baseline_test.back", "Back")}
                    </button>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{translatedTitle} <span className="text-[#1a3884]">{stageKey}</span></h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("baseline_test.time_left", "Time Left")}:{" "}
                      <span className={`font-mono font-bold ${isLastFiveMinutes ? "text-red-500 animate-pulse" : "text-[#1a3884]"}`}>
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
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#1a3884]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#1a3884] min-w-[3rem] text-right">{progress}%</span>
                </div>
              </div>

              <div className="p-6 md:p-8 flex-1 relative z-10 flex flex-col justify-center">
                <div className="mb-8 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#1a3884]/10 text-[#1a3884] text-xs font-bold uppercase tracking-widest mb-3">
                    {t("baseline_test.question_number", "Question {{current}} / {{total}}", { current: index + 1, total: questions.length })}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {current?.questionText}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 max-w-4xl mx-auto w-full">
                  {current?.options?.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() => selectOption(option.value)}
                        disabled={interactionLocked || submitting || timeExpired}
                        className={`group relative p-3 md:p-5 rounded-xl md:rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.01] active:scale-[0.99] ${isSelected
                          ? 'border-[#1a3884] bg-[#1a3884]/10 shadow-[0_0_30px_-10px_rgba(26,56,132,0.3)]'
                          : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/50 hover:border-[#1a3884]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]'
                          }`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm md:text-base shrink-0 transition-colors shadow-sm ${isSelected
                            ? 'bg-[#1a3884] border-[#1a3884] text-white'
                            : 'border-slate-300 dark:border-white/15 text-slate-400 dark:text-slate-500 group-hover:border-[#1a3884] group-hover:text-[#1a3884]'
                            }`}>
                            {option.value}
                          </div>
                          <span className={`text-sm md:text-base font-medium transition-colors ${isSelected ? 'text-[#1a3884]' : 'text-slate-700 dark:text-slate-200'}`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual "Next" button */}
                <div className="h-16 mt-6 md:mt-8 flex justify-center items-center">
                  <AnimatePresence>
                    {selectedValue && index < questions.length - 1 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={nextQ}
                        disabled={timeElapsed < 5000 || interactionLocked || submitting || timeExpired}
                        className={`px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-xl shadow-[#1a3884]/20 transition-all flex items-center gap-2 ${timeElapsed < 5000
                          ? 'bg-slate-200 dark:bg-[#002A5C] text-slate-400 cursor-not-allowed'
                          : 'bg-[#1a3884] text-white hover:bg-[#277a84] hover:shadow-2xl hover:-translate-y-1'
                          }`}
                      >
                        {timeElapsed < 5000 ? (
                          <>
                            <span>{t("baseline_test.wait_seconds", "Wait {{seconds}}s", { seconds: Math.ceil((5000 - timeElapsed) / 1000) })}</span>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </>
                        ) : (
                          <>
                            {t("baseline_test.next_question", "Next Question")} <CheckCircle2 size={18} />
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/80 dark:bg-dark-elevated/20 flex justify-end items-center backdrop-blur-sm">
                <button
                  onClick={() => submit()}
                  disabled={submitting || interactionLocked || timeExpired || !allQuestionsAnswered}
                  className={`px-6 md:px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 text-sm md:text-base ${allQuestionsAnswered
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/20 hover:-translate-y-0.5"
                      : "bg-slate-200 dark:bg-[#002A5C] text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("baseline_test.submitting", "Submitting...")}
                    </>
                  ) : !allQuestionsAnswered ? (
                    <>
                      <Lock className="w-5 h-5" />
                      {t("baseline_test.answer_all_questions", "Answer All Questions")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {t("baseline_test.submit_test", "Submit Test")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Navigation Sidebar */}
            <div className="lg:w-80 bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl p-6 h-fit shrink-0 lg:sticky lg:top-6 flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="text-[#1a3884]" size={20} /> {t("baseline_test.question_map", "Question Map")}
                </h4>
                <div className="grid grid-cols-6 gap-2 max-h-[300px] md:max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                  {questions.map((q, idx) => (
                    <button
                      key={q._id}
                      onClick={() => { /* Optional: Allow navigating back to answered questions? For now kept disabled/visual only based on original code 'prevQ' disabled */ }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-[10px] md:text-xs font-bold transition-all cursor-default relative group
                        ${index === idx
                          ? 'bg-[#1a3884] text-white shadow-md scale-105 border-2 border-[#1a5f66]'
                          : selectedAnswers[q._id]
                            ? 'bg-[#1a3884]/10 text-[#1a3884] border border-[#1a3884]/30'
                            : 'bg-slate-100 dark:bg-[#002A5C] text-slate-400 dark:text-slate-500 border border-transparent'
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

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1a3884]" /> {t("baseline_test.answered", "Answered")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{Object.keys(selectedAnswers).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-[#002A5C]" /> {t("baseline_test.remaining", "Remaining")}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{questions.length - Object.keys(selectedAnswers).length}</span>
                </div>
              </div>



              {/* DEV: Auto Answer */}
              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-white/8 opacity-50 hover:opacity-100 transition-opacity">
                <button
                  disabled={submitting || interactionLocked || timeExpired}
                  onClick={async () => {
                    try {
                      const btn = document.activeElement;
                      btn.innerText = "⚡ Running...";
                      btn.disabled = true;

                      const unanswered = questions.filter(q => !selectedAnswers[q._id]);
                      const batchSize = 10;
                      for (let i = 0; i < unanswered.length; i += batchSize) {
                        const batch = unanswered.slice(i, i + batchSize);
                        await Promise.all(batch.map(q => {
                          const val = ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)];
                          return assessmentApi.saveAnswer(resultId, q._id, val, q.questionText, assessmentToken);
                        }));
                        const newAnswers = {};
                        batch.forEach(q => { newAnswers[q._id] = 'RANDOM'; });
                        setSelectedAnswers(prev => ({ ...prev, ...newAnswers }));
                      }
                      await submit({ reason: "manual", redirectAfterSubmit: false });
                    } catch (err) {
                      console.error("Fast submit failed:", err);
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="w-full py-2 bg-slate-200 dark:bg-[#002A5C] text-slate-600 dark:text-slate-400 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-slate-300 dark:hover:bg-[#002A5C] transition-colors"
                >
                  {t("baseline_test.auto_fill_dev", "⚡ Auto-Fill (Dev)")}
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
            <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/8 rounded-2xl shadow-sm p-8 max-w-4xl mx-auto relative">
              
              {/* Top Left User Info */}
              <div className="absolute top-8 left-8 hidden sm:block text-left">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.studentId}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.college?.collegeName || user?.collegeName || t("baseline_test.student", "Student")}</p>
              </div>

              {/* Header Section */}
              <div className="text-center mb-10 border-b border-slate-100 dark:border-white/8 pb-8 sm:mt-2">

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {stageKey === 'T1' ? t("baseline_test.baseline_established", "Baseline Established") : t("baseline_test.assessment_complete", "{{name}} Assessment Complete", { name: translatedName })}
                </h2>
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <span>{t("baseline_test.result_id", "Result ID: {{id}}", { id: `${stageKey}-${user?.studentId || 'REF'}` })}</span>
                  <span>|</span>
                  <span>S_{stageConfig.name.toLowerCase()}</span>
                </div>
              </div>

              {/* Professional Score Display */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 bg-[#F8FAFC] dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-white/10">
                <div className="text-center md:text-right">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("baseline_test.overall_score", "Overall Score")}</div>
                  <div className="text-5xl font-bold text-slate-900 dark:text-white">
                    {testResults?.stageScore || testResults?.baselineScore}
                    <span className="text-2xl text-slate-400 ml-1">/100</span>
                  </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-slate-200 dark:bg-[#003170]" />

                <div className="text-center md:text-left">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">{t("baseline_test.proficiency_level", "Proficiency Level")}</div>
                  <div className={`text-2xl font-bold px-4 py-1 rounded-full inline-block ${getBandColor(testResults?.stageBand || 'Emerging').badge}`}>
                    {t(`baseline_test.bands.${testResults?.stageBand || 'Emerging'}`, testResults?.stageBand || 'Emerging')}
                  </div>
                </div>
              </div>

              {/* Quotient Cards Grid */}
              <div className="mb-12 relative z-10">
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-3xl font-black text-[#002147] dark:text-white text-center mb-8"
                >
                  {t("baseline_test.quotient_breakdown", "Quotient-Wise Breakdown")}
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(testResults?.quotientProfile || testResults?.t1Profile) ? Object.entries(testResults?.quotientProfile || testResults?.t1Profile).map(([quotient, data], index) => {
                    const info = quotientInfo[quotient];
                    const colors = getBandColor(data.level);
                    const qName = t(`baseline_test.quotients.${quotient}.name`, info.name);
                    const qDesc = t(`baseline_test.quotients.${quotient}.desc`, info.desc);

                    return (
                      <motion.div
                        key={quotient}
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                        className="bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 rounded-lg p-5 hover:border-slate-300 transition-colors"
                      >
                        <div className="relative z-10">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="text-slate-400">
                                {info.icon}
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{quotient}</span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{qName}</h4>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {t(`baseline_test.bands.${data.level}`, data.level)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{qDesc}</p>

                          {/* Score Display */}
                          <div className="flex items-end justify-between mb-4">
                            <div>
                              <div className="text-5xl font-black text-[#002147] dark:text-white">
                                {data.rawScore}
                                <span className="text-2xl text-slate-400 ml-1">%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">{t("baseline_test.performance", "Performance")}</div>
                              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                {data.earned}/{data.possible} {t("baseline_test.correct", "correct")}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="relative h-3 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden">
                            {/* Threshold markers */}
                            <div className="absolute left-[20%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                            <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                            <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                            <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />

                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${data.rawScore}%` }}
                              transition={{ delay: 0.9 + index * 0.1, duration: 1.2, ease: "easeOut" }}
                              className="h-full bg-[#002147] relative"
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
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1a3884] border-t-transparent mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">{t("baseline_test.processing_profile", "Processing your profile...")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Minimal */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12 mb-8"
              >
                <button
                  onClick={() => downloadReport(user, testResults)}
                  className="px-6 py-3 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  {t("baseline_test.download_report", "Download Report")}
                </button>

                <button
                  onClick={() => {
                    if (stageKey === 'T1') navigate("/dashboard/courses");
                    else if (stageKey === 'T2') navigate("/dashboard/courses/S11/player"); // Start Capability
                    else if (stageKey === 'T3') navigate("/dashboard/courses/S20/player"); // Start Leadership
                    else navigate("/dashboard/skills-passport");
                  }}
                  className="px-8 py-3 bg-[#1a3884] text-white rounded-lg font-bold hover:bg-[#277a84] transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#1a3884]/20 hover:-translate-y-1 w-full sm:w-auto"
                >
                  <TrendingUp className="w-4 h-4" />
                  {t("baseline_test.continue_journey", "Continue My Journey")}
                </button>

                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
                >
                  {t("baseline_test.go_to_dashboard", "Go to Dashboard")}
                </button>

                <button
                  onClick={() => navigate("/dashboard/assessment-centre")}
                  className="px-6 py-3 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] transition-colors flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto"
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
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#002147] p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-white/10">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-4">{t("baseline_test.exit_warning_title", "Don't Leave Yet!")}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">{t("baseline_test.exit_warning_desc", "Back navigation is disabled while the assessment is in progress. If you leave now, you will return to the assessment dashboard.")}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={leaveAssessmentPage}
                  className="w-full py-4 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-[#003170] transition-all shadow-sm"
                >
                  {t("baseline_test.leave_assessment", "Leave Assessment")}
                </button>
                <button onClick={() => {
                  setShowExitWarning(false);
                }} className="w-full py-4 bg-[#1a3884] text-white rounded-xl font-bold hover:bg-[#277a84] transition-all shadow-md">{t("baseline_test.continue_assessment", "Continue Assessment")}</button>
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



