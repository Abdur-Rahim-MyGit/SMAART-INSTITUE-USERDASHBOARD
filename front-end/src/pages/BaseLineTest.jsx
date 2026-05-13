import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { assessmentApi } from "@/services/assessmentApi";
import { CheckCircle2, XCircle, Target, AlertTriangle, Lock, Download, TrendingUp, Award, Sparkles, Brain, Users, BookOpen, Heart, Monitor, Zap, ShieldCheck, Trophy, BarChart3, Sprout, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import BadgeModal from "@/components/badges/BadgeModal";

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
    text: 'text-[#1a3884] dark:text-[#1a3884]',
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
  const navigate = useNavigate();
  const { stage: urlStage } = useParams();

  // Determine which stage we're running
  const stageKey = (urlStage || 'T1').toUpperCase();
  const stageConfig = STAGE_MAP[stageKey] || STAGE_MAP.T1;
  const assessmentCode = stageConfig.code;
  const questionLimit = stageConfig.questionLimit;
  const stageDurationSeconds = stageConfig.durationMinutes * 60;
  const timerStartStorageKey = `${stageKey}_startTime`;
  const timerWarningStorageKey = `${stageKey}_oneMinuteWarningShown`;

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

  const timerStartRef = useRef(null);
  const timeoutSubmitTriggeredRef = useRef(false);
  const oneMinuteAlertShownRef = useRef(false);

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
      toast.success(`Badge Unlocked: ${formattedBadge.title}!`);
    }
  };

  // Get current question
  const current = questions[index];
  const currentQuestionId = current?._id;
  const selectedValue = selectedAnswers[currentQuestionId] || null;

  // Calculate progress based on answered questions
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const isLastFiveMinutes = remainingSeconds <= 300;
  const allQuestionsAnswered = questions.length > 0 && answeredCount === questions.length;

  const clearTimerPersistence = useCallback(() => {
    localStorage.removeItem(timerStartStorageKey);
    localStorage.removeItem(timerWarningStorageKey);
  }, [timerStartStorageKey, timerWarningStorageKey]);

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
          throw new Error("User ID not found. Please log in again.");
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
            toast.info(`You have already completed the ${stageConfig.title}.`);
            navigate("/dashboard/assessment-centre", { replace: true });
            return;
          }
        }

        if (isReportMode) {
          clearTimerPersistence();
          throw new Error(`Report not found for ${stageConfig.title}. Have you completed it yet?`);
        }

        // Fetch assessment by stage code
        console.log(`Fetching assessment details for ${assessmentCode}...`);
        const assessmentResponse = await assessmentApi.getByCode(assessmentCode);

        if (!assessmentResponse.success) {
          throw new Error(`Failed to fetch ${stageConfig.title} details`);
        }

        setAssessment(assessmentResponse.data);
        console.log("✅ Assessment details loaded:", assessmentResponse.data.assessmentName);

        // Start the assessment
        if (!assessmentResponse.data._id) {
          throw new Error("Assessment ID is missing from response");
        }

        const assessmentId = assessmentResponse.data._id;
        console.log(`📡 Starting assessment session for ID: ${assessmentId}`);

        // Set a timeout for the start request to prevent hanging
        const startPromise = assessmentApi.startAssessment(assessmentId, userId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out starting assessment")), 30000)
        );

        const startResponse = await Promise.race([startPromise, timeoutPromise]);

        if (!startResponse.success) {
          throw new Error(startResponse.error || "Failed to start assessment session");
        }

        console.log("✅ Assessment session started, Result ID:", startResponse.data.resultId);
        setResultId(startResponse.data.resultId);

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
        setError(err.message || "Failed to load assessment. Please try refreshing the page.");
      } finally {
        setLoading(false);
        console.log("🏁 Initialization complete, loading set to false.");
      }
    };

    initializeAssessment();
  }, [clearTimerPersistence, navigate, stageKey]);

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
        current.questionText
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
      toast.warning("Answer all questions before submitting the test.");
      return;
    }

    let submitSucceeded = false;

    try {
      setSubmitting(true);
      setInteractionLocked(true);

      if (forceTimeoutCompletion) {
        await finalizeUnansweredQuestions();
      }

      const response = await assessmentApi.submitAssessment(resultId);

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

        alert("Time is up. Your assessment was ended and we could not confirm the submission result.");
        navigate("/dashboard/assessment-centre", { replace: true });
      } else {
        alert(err.message || "Failed to submit assessment.");
      }
    } finally {
      setSubmitting(false);
      if (!submitSucceeded && reason !== "timeout") {
        setInteractionLocked(false);
      }
    }
  }, [allQuestionsAnswered, clearTimerPersistence, finalizeUnansweredQuestions, navigate, resultId, stageKey, submitted, submitting, user]);

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
        alert("Only 1 minute left!");
        toast.warning("Only 1 minute left!");
      }

      if (nextRemainingSeconds === 0 && !timeoutSubmitTriggeredRef.current) {
        timeoutSubmitTriggeredRef.current = true;
        setTimeExpired(true);
        setInteractionLocked(true);
        setShowExitWarning(false);
        toast.error("Time is up. Submitting your assessment...");
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
  ]);

  // Proctoring Logic - Anti-Cheat
  const [warnings, setWarnings] = useState(0);
  const MAX_WARNINGS = 3;

  useEffect(() => {
    if (submitted || loading) return;

    // 1. Prevent Right Click
    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during the assessment.");
    };

    // 2. Prevent Copy/Cut/Paste
    const handleCopyCutPaste = (e) => {
      e.preventDefault();
      toast.warning("Copying or pasting is not allowed.");
    };

    // 3. Detect PrintScreen / Special Keys
    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p") || (e.metaKey && e.shiftKey && e.key === "3") || (e.metaKey && e.shiftKey && e.key === "4")) {
        e.preventDefault();
        handleViolation("Screenshot attempt detected!");
      }
    };

    // 4. Detect Focus Loss (Alt-Tab / Switching Windows)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("You navigated away from the test window.");
      }
    };

    // Violation Handler
    const handleViolation = (message) => {
      setWarnings(prev => {
        const newCount = prev + 1;
        if (newCount >= MAX_WARNINGS) {
          // Force Submit
          submit({ reason: "violation", redirectAfterSubmit: true });
          toast.error("Test terminated due to multiple violations.");
          return newCount;
        }
        toast.error(`Warning ${newCount}/${MAX_WARNINGS}: ${message}`);
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

    // Block Exit
    const beforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", beforeUnload);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitWarning(true);
      toast.warning("Back navigation is disabled during the assessment.");
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyCutPaste);
      document.removeEventListener("cut", handleCopyCutPaste);
      document.removeEventListener("paste", handleCopyCutPaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [submitted, loading, submit]); // Added submit to dependencies if stable (or remove if causes loop, submit uses refs or is stable)


  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#001229] flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#1a3884] mx-auto mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">Loading {stageConfig.title}...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#001229] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-[#0B1120] rounded-2xl shadow-xl border border-red-200 dark:border-red-900/30">
        <div className="text-red-500 text-5xl mb-4">⚠</div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <button onClick={() => navigate("/dashboard/assessment-centre")} className="px-6 py-2 bg-[#1a3884] text-white rounded-lg hover:bg-[#002147] font-medium transition-colors">
          Back to Assessments
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#001229] text-slate-900 dark:text-white transition-colors duration-300 flex flex-col">
      {/* Top Bar with Cancel Button */}
      {!submitted && (
        <div className="w-full p-4 flex justify-end max-w-[1440px] mx-auto">
          <button
            onClick={() => setShowExitWarning(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-200 dark:hover:border-red-900/50 transition-colors shadow-sm"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-bold">Cancel Assessment</span>
          </button>
        </div>
      )}
      <main className="p-4 md:p-6 lg:p-8 w-full max-w-[1440px] mx-auto flex-1 flex flex-col justify-center">
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-stretch">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col min-h-[500px] bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden relative">
              {/* Background gradient effect */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#1a3884]/5 rounded-full blur-[100px] pointer-events-none" />

              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B1120] relative z-10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{stageConfig.title} <span className="text-[#1a3884]">{stageKey}</span></h2>
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
                      Time Left:{" "}
                      <span className={`font-mono font-bold ${isLastFiveMinutes ? "text-red-500 animate-pulse" : "text-[#1a3884]"}`}>
                        {formatCountdown(remainingSeconds)}
                      </span>
                    </div>
                    {isLastFiveMinutes && (
                      <p className="mt-1 text-[11px] md:text-xs font-bold uppercase tracking-wider text-red-500">
                        Time Almost Up!
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                    Question {index + 1} / {questions.length}
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
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:border-[#1a3884] hover:bg-[#1a3884] dark:hover:bg-[#1a3884]'
                          }`}
                      >
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm md:text-base shrink-0 transition-colors shadow-sm ${isSelected
                            ? 'bg-[#1a3884] border-[#1a3884] text-white'
                            : 'border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 group-hover:border-white group-hover:text-white'
                            }`}>
                            {option.value}
                          </div>
                          <span className={`text-sm md:text-base font-medium transition-colors ${isSelected ? 'text-[#1a3884]' : 'text-slate-700 dark:text-slate-200 group-hover:text-white'}`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Manual "Next" button */}
                <div className="h-16 mt-6 md:mt-8 flex justify-center items-center">
                  <AnimatePresence mode="wait">
                    {selectedValue && index < questions.length - 1 && (
                      <motion.button
                        key="next"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={nextQ}
                        disabled={timeElapsed < 5000 || interactionLocked || submitting || timeExpired}
                        className={`px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold text-sm md:text-base shadow-xl shadow-[#1a3884]/20 transition-all flex items-center gap-2 ${timeElapsed < 5000
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-[#1a3884] text-white hover:bg-[#002147] hover:shadow-2xl hover:-translate-y-1'
                          }`}
                      >
                        {timeElapsed < 5000 ? (
                          <>
                            <span>Wait {Math.ceil((5000 - timeElapsed) / 1000)}s</span>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </>
                        ) : (
                          <>
                            Next Question <CheckCircle2 size={18} />
                          </>
                        )}
                      </motion.button>
                    )}

                    {selectedValue && index === questions.length - 1 && (
                      <motion.button
                        key="submit"
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => submit()}
                        disabled={timeElapsed < 5000 || interactionLocked || submitting || timeExpired || !allQuestionsAnswered}
                        className={`px-8 py-3 rounded-xl font-bold text-sm md:text-base transition-all flex items-center gap-2 ${
                          timeElapsed < 5000 || !allQuestionsAnswered
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-xl shadow-amber-500/20 hover:-translate-y-1'
                        }`}
                      >
                        {submitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : timeElapsed < 5000 ? (
                          <>
                            <span>Wait {Math.ceil((5000 - timeElapsed) / 1000)}s</span>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          </>
                        ) : !allQuestionsAnswered ? (
                          <>
                            <Lock className="w-5 h-5" />
                            Answer All Questions to Submit
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Submit Test
                          </>
                        )}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer Controls removed per design update */}
            </div>

            {/* Navigation Sidebar */}
            <div className="lg:w-80 bg-white dark:bg-[#0B1120] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 h-fit shrink-0 lg:sticky lg:top-6 flex flex-col gap-6">
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="text-[#1a3884]" size={20} /> Question Map
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
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-transparent'
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

              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1a3884]" /> Answered</span>
                  <span className="font-bold text-slate-900 dark:text-white">{Object.keys(selectedAnswers).length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" /> Remaining</span>
                  <span className="font-bold text-slate-900 dark:text-white">{questions.length - Object.keys(selectedAnswers).length}</span>
                </div>
              </div>

              {/* DEV: Auto Answer */}
              <div className="pt-4 border-t border-dashed border-slate-200 dark:border-slate-800 opacity-50 hover:opacity-100 transition-opacity">
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
                          return assessmentApi.saveAnswer(resultId, q._id, val, q.questionText);
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
                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                >
                  ⚡ Auto-Fill (Dev)
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[1440px] mx-auto py-8 px-4 flex-1 flex flex-col justify-center"
          >
            {/* Main Results Card */}
            {/* Main Results Card - Minimal Configuration */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 lg:p-12 w-full max-w-6xl mx-auto relative overflow-hidden">
              {/* Header Section */}
              <div className="text-center mb-10 border-b border-slate-100 dark:border-slate-800 pb-8">

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {stageKey === 'T1' ? 'Baseline Established' : `${stageConfig.name} Assessment Complete`}
                </h2>
                <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                  <span>Result ID: {stageKey}-{user?.studentId || 'REF'}</span>
                  <span>|</span>
                  <span>S_{stageConfig.name.toLowerCase()}</span>
                </div>
              </div>

              {/* Professional Score Display */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                <div className="text-center md:text-right">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Overall Score</div>
                  <div className="text-5xl font-bold text-slate-900 dark:text-white">
                    {testResults?.stageScore || testResults?.baselineScore}
                    <span className="text-2xl text-slate-400 ml-1">/100</span>
                  </div>
                </div>

                <div className="hidden md:block w-px h-16 bg-slate-200 dark:bg-slate-700" />

                <div className="text-center md:text-left">
                  <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Proficiency Level</div>
                  <div className={`text-2xl font-bold px-4 py-1 rounded-full inline-block ${getBandColor(testResults?.stageBand || 'Emerging').badge}`}>
                    {testResults?.stageBand || 'Emerging'}
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
                  Quotient-Wise Breakdown
                </motion.h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(testResults?.quotientProfile || testResults?.t1Profile) ? Object.entries(testResults?.quotientProfile || testResults?.t1Profile).map(([quotient, data], index) => {
                    const info = quotientInfo[quotient];
                    const colors = getBandColor(data.level);

                    return (
                      <motion.div
                        key={quotient}
                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:border-slate-300 transition-colors"
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
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{info.name}</h4>
                              </div>
                            </div>
                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {data.level}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{info.desc}</p>

                          {/* Score Display */}
                          <div className="flex items-end justify-between mb-4">
                            <div>
                              <div className="text-5xl font-black text-[#002147] dark:text-white">
                                {data.rawScore}
                                <span className="text-2xl text-slate-400 ml-1">%</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Performance</div>
                              <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                {data.earned}/{data.possible} correct
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                      <p className="text-slate-400 text-lg">Processing your profile...</p>
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
                  className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Report
                </button>

                <button
                  onClick={() => {
                    if (stageKey === 'T1') navigate("/dashboard/courses");
                    else if (stageKey === 'T2') navigate("/dashboard/courses/S11/player"); // Start Capability
                    else if (stageKey === 'T3') navigate("/dashboard/courses/S20/player"); // Start Leadership
                    else navigate("/dashboard/skills-passport");
                  }}
                  className="px-8 py-3 bg-[#1a3884] text-white rounded-lg font-bold hover:bg-[#002147] transition-all flex items-center gap-2 shadow-xl shadow-[#1a3884]/20 hover:-translate-y-1"
                >
                  <TrendingUp className="w-4 h-4" />
                  Continue My Journey
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-4 sm:ml-4">
                  <button
                    onClick={() => navigate("/dashboard/assessment-centre")}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    All Assessments
                  </button>
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    Go To Dashboard
                  </button>
                </div>
              </motion.div>


            </div>
          </motion.div>
        )}
      </main>

      {/* Exit Warning Modal */}
      {
        showExitWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#0B1120] p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
              <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-4">Exit Assessment?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center mb-8">Are you sure you want to exit? Your progress will be saved, but time will continue to run if you leave.</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => setShowExitWarning(false)} className="w-full py-4 bg-[#1a3884] text-white rounded-xl font-bold hover:bg-[#002147] transition-all shadow-md">Continue Assessment</button>
                <button onClick={() => navigate("/dashboard/assessment-centre")} className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all">Yes, Exit Assessment</button>
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
        userName={user?.fullName || 'Student'}
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



