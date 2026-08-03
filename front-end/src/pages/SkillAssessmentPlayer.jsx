import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { assessmentApi } from "@/services/assessmentApi";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// Lucide Icons
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  ArrowLeft,
  BookOpen,
  Award,
  Clock,
  RotateCcw,
  Sparkles,
  Camera,
  Eye,
  Maximize
} from "lucide-react";

// Proctoring Components
import useProctoringEngine from "@/hooks/useProctoringEngine";
import ProctoringSetup from "@/components/proctoring/ProctoringSetup";
import ProctoringOverlay from "@/components/proctoring/ProctoringOverlay";
import ProctoringPause from "@/components/proctoring/ProctoringPause";
import ProctoringNotice from "@/components/proctoring/ProctoringNotice";
import ProctoringStatusPill from "@/components/proctoring/ProctoringStatusPill";
import InactivityOverlay from "@/components/proctoring/InactivityOverlay";
import AttentionCheck from "@/components/proctoring/AttentionCheck";
import CertificateModal from "@/components/CertificateModal";

const SkillAssessmentPlayer = () => {
  const { skillName } = useParams();
  const decodedSkillName = decodeURIComponent(skillName || "");
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Core States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [registeredFaceDescriptor, setRegisteredFaceDescriptor] = useState(null);
  const [registrationMetadata, setRegistrationMetadata] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [resultId, setResultId] = useState(null);
  const [assessmentToken, setAssessmentToken] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Timer states
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [interactionLocked, setInteractionLocked] = useState(false);
  
  const initRef = useRef(false);
  const timerStartRef = useRef(null);
  const timeoutSubmitTriggeredRef = useRef(false);
  const pausedMsRef = useRef(0);
  const pauseStartedAtRef = useRef(null);
  const isPausedRef = useRef(false);
  const [user, setUser] = useState(null);

  // Synced user details
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const activeUserId = user?.id || user?._id || "anonymous";

  // Prevent browser back / unload warnings
  useEffect(() => {
    if (submitted || loading || !resultId) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to leave? Your progress will be lost.";
    };

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.pathname);
      setShowExitWarning(true);
      toast.warning("Back navigation is disabled during the assessment.");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    window.history.pushState(null, "", window.location.pathname);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [submitted, loading, resultId]);

  // Fetch assessment and start session
  useEffect(() => {
    const initializeAssessment = async () => {
      if (initRef.current) return;
      initRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch the skill assessment by name
        const fetchRes = await fetch(`/api/assessments/skill/${encodeURIComponent(decodedSkillName)}`);
        if (!fetchRes.ok) {
          throw new Error("Failed to load skill assessment details");
        }
        
        const fetchJson = await fetchRes.json();
        if (!fetchJson.success || !fetchJson.data) {
          throw new Error(`No active skill assessment found for "${decodedSkillName}"`);
        }

        const assessmentDoc = fetchJson.data;
        setAssessment(assessmentDoc);

        // 2. Start result session
        const startResponse = await assessmentApi.startAssessment(assessmentDoc._id);
        if (!startResponse.success) {
          throw new Error(startResponse.error || "Failed to start assessment session");
        }

        setResultId(startResponse.data.resultId);
        setAssessmentToken(startResponse.data.assessmentToken);

        // Initialize questions
        const fetchedQuestions = startResponse.data.questions || [];
        const sortedQuestions = [...fetchedQuestions].sort((a, b) => (a.order || 0) - (b.order || 0));
        setQuestions(sortedQuestions);

        // Initialize duration (default to 30 mins if not specified)
        const durationMinutes = assessmentDoc.duration || 30;
        setRemainingSeconds(durationMinutes * 60);

        // Restore previous responses if any
        if (startResponse.data.responses && startResponse.data.responses.length > 0) {
          const answersMap = {};
          startResponse.data.responses.forEach(r => {
            answersMap[r.questionId] = r.selectedValue;
          });
          setSelectedAnswers(answersMap);

          const firstUnanswered = sortedQuestions.findIndex(q => !answersMap[q._id]);
          if (firstUnanswered !== -1) {
            setIndex(firstUnanswered);
          } else if (sortedQuestions.length > 0) {
            setIndex(sortedQuestions.length - 1);
          }
        }
      } catch (err) {
        console.error("Error initializing skill assessment:", err);
        setError(err.message || "Failed to load skill assessment");
      } finally {
        setLoading(false);
      }
    };

    initializeAssessment();
  }, [decodedSkillName]);

  // Timer trackers
  useEffect(() => {
    setQuestionStartTime(Date.now());
    setTimeElapsed(0);
  }, [index]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(Date.now() - questionStartTime);
    }, 100);
    return () => clearInterval(interval);
  }, [questionStartTime]);

  // Countdown timer
  useEffect(() => {
    if (loading || submitted || !resultId || !setupCompleted) return;

    if (!timerStartRef.current) {
      timerStartRef.current = Date.now();
    }

    const durationSeconds = (assessment?.duration || 30) * 60;

    const updateCountdown = () => {
      if (isPausedRef.current) {
        if (pauseStartedAtRef.current === null) {
          pauseStartedAtRef.current = Date.now();
        }
        return;
      }
      if (pauseStartedAtRef.current !== null) {
        pausedMsRef.current += Date.now() - pauseStartedAtRef.current;
        pauseStartedAtRef.current = null;
      }

      const elapsedSeconds = Math.floor((Date.now() - timerStartRef.current - pausedMsRef.current) / 1000);
      const nextRemainingSeconds = Math.max(durationSeconds - elapsedSeconds, 0);
      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0 && !timeoutSubmitTriggeredRef.current) {
        timeoutSubmitTriggeredRef.current = true;
        setTimeExpired(true);
        setInteractionLocked(true);
        setShowExitWarning(false);
        toast.error("Time is up! Submitting your assessment...");
        submit({ reason: "timeout" });
      }
    };

    const timer = setInterval(updateCountdown, 250);
    return () => clearInterval(timer);
  }, [loading, resultId, setupCompleted, submitted, assessment, submit]);

  // Proctoring Hook
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
    registrationMetadata
  });

  // Keep the countdown's view of the pause state current without re-running the timer effect.
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Local anti-cheat keyboard listeners
  useEffect(() => {
    if (submitted || loading) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during the assessment.");
    };

    const handleCopyCutPaste = (e) => {
      e.preventDefault();
      toast.warning("Copying or pasting is not allowed.");
    };

    const handleKeyDown = (e) => {
      if (e.key === "PrintScreen" || (e.ctrlKey && e.key === "p")) {
        e.preventDefault();
        toast.error("Screenshot attempt detected!");
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
  }, [submitted, loading]);

  const selectOption = async (optionValue) => {
    const currentQuestion = questions[index];
    if (!currentQuestion || !resultId || interactionLocked || submitted) return;

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion._id]: optionValue
    }));

    try {
      await assessmentApi.saveAnswer(
        resultId,
        currentQuestion._id,
        optionValue,
        currentQuestion.questionText,
        assessmentToken
      );
    } catch (err) {
      console.error("Error saving answer:", err);
    }
  };

  const nextQuestion = () => {
    if (index < questions.length - 1) {
      setIndex(i => i + 1);
    }
  };

  const submit = useCallback(async ({ reason = "manual", forcePassDev = false, forceFailDev = false } = {}) => {
    if (!resultId || submitting || submitted) return;

    try {
      setSubmitting(true);
      setInteractionLocked(true);

      const response = await assessmentApi.submitAssessment(resultId, assessmentToken, {
        submissionReason: reason,
        completeMissingAnswers: reason === "timeout" || reason === "violation" || forcePassDev || forceFailDev,
        forcePassDev,
        forceFailDev
      });

      if (response.success) {
        setSubmitted(true);
        setTestResults(response.data);
        toast.success("Assessment submitted successfully!");
      } else {
        throw new Error(response.error || "Failed to submit assessment");
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
      toast.error(err.message || "Failed to submit assessment.");
    } finally {
      setSubmitting(false);
      setInteractionLocked(false);
    }
  }, [resultId, assessmentToken, submitted, submitting]);

  const handleRetry = () => {
    // Reset core states and reload
    window.location.reload();
  };

  const handleCertificateModalConfirm = async (skillName, file) => {
    setShowCertModal(false);
    try {
      const userEmail = user?.email || "student@smaart.edu";
      await fetch('/api/career-agent/user-skills/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, skillName: decodedSkillName, status: 'Completed', hasCertificate: !!file })
      });
      toast.success("Skill marked as completed!");
      navigate('/dashboard/career-agent/dashboard');
    } catch (e) {
      console.error("Failed to update status:", e);
      toast.error("Failed to mark skill as completed");
    }
  };

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const allQuestionsAnswered = questions.length > 0 && questions.every(q => selectedAnswers[q._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#00152E] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a3884] dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-650 dark:text-slate-300 font-medium">Loading Skill Assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#00152E] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#002147] p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-100 dark:border-red-950/20 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard/career-agent/dashboard')}
            className="px-6 py-2 bg-[#1a3884] text-white rounded-lg hover:bg-[#277a84] font-medium transition-colors"
          >
            Back to Roadmap
          </button>
        </div>
      </div>
    );
  }

  // Proctoring setup screen
  if (!setupCompleted) {
    return (
      <ProctoringSetup
        onComplete={({ faceDescriptor, alignedCropDataUrl }) => {
          setRegisteredFaceDescriptor(faceDescriptor);
          setRegistrationMetadata({
            model: 'faceapi-128',
            qualityScore: 100,
            framesCaptured: 3,
            antispoofPassed: true,
            registrationCropUrl: alignedCropDataUrl || null,
          });
          setSetupCompleted(true);
        }}
        assessmentTitle={`${decodedSkillName} Assessment`}
      />
    );
  }

  // Submission report card / feedback UI
  if (submitted && testResults) {
    const scorePct = testResults.percentage || 0;
    const passed = scorePct >= 70;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#00152E] flex items-center justify-center p-4 py-12">
        <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 max-w-xl w-full relative overflow-hidden text-center">
          {/* Decorative blurs */}
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#1a3884]/5 rounded-full blur-[40px]" />
          
          <div className="mb-6 flex justify-center">
            {passed ? (
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
            )}
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            {passed ? "Assessment Passed!" : "Assessment Failed"}
          </h2>
          <p className="text-slate-550 dark:text-slate-400 mb-6 text-sm font-medium">
            {decodedSkillName} Assessment
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 mb-8 border border-slate-100 dark:border-white/5 max-w-sm mx-auto">
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Your Score
            </div>
            <div className="text-5xl font-black text-slate-900 dark:text-white">
              {scorePct}%
            </div>
            <div className="text-xs text-slate-450 dark:text-slate-500 mt-2 font-medium">
              Required Pass Mark: 70%
            </div>
          </div>

          {passed ? (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-350 text-sm leading-relaxed max-w-md mx-auto">
                Congratulations! You have successfully passed the assessment. You can now choose to upload an official certificate or mark this skill as completed directly.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  onClick={() => setShowCertModal(true)}
                  className="px-6 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Award className="w-4 h-4" />
                  Upload Certificate (Optional)
                </button>
                <button
                  onClick={() => handleCertificateModalConfirm(decodedSkillName, null)}
                  className="px-6 py-3 bg-slate-100 dark:bg-[#002A5C] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-[#003170] transition-all"
                >
                  Mark Completed Directly
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-650 dark:text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                You didn't reach the required 70% pass threshold. Don't worry! Review the materials and retry the assessment.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-red-500 hover:bg-red-650 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Assessment
                </button>
                <button
                  onClick={() => navigate('/dashboard/career-agent/dashboard')}
                  className="px-6 py-3 bg-white dark:bg-[#002A5C] text-slate-750 dark:text-slate-350 border border-slate-200 dark:border-white/10 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-[#003170] transition-all"
                >
                  Back to Roadmap
                </button>
              </div>
            </div>
          )}

          {/* Certificate Modal popup */}
          {showCertModal && (
            <CertificateModal
              skillName={decodedSkillName}
              onConfirm={handleCertificateModalConfirm}
              onClose={() => setShowCertModal(false)}
              theme={theme}
            />
          )}
        </div>
      </div>
    );
  }

  const currentQuestion = questions[index];
  const progressPercent = questions.length > 0 ? Math.round((Object.keys(selectedAnswers).length / questions.length) * 100) : 0;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#00152E] text-slate-900 dark:text-white transition-colors duration-300">
      <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row gap-8">
          
          {/* Question Area */}
          <div className="flex-1 flex flex-col min-h-[500px] bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#1a3884]/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header info */}
            <div className="p-6 border-b border-slate-150 dark:border-white/10 bg-slate-50/50 dark:bg-[#002a5c]/30 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowExitWarning(true)}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-250 transition-all hover:bg-slate-100 dark:hover:bg-[#003170] shadow-sm disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Exit
                  </button>
                  <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[#112b6b] dark:text-white">
                    {decodedSkillName} <span className="text-[#1a3884] dark:text-blue-400">Skill Test</span>
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {setupCompleted && (
                    <ProctoringStatusPill
                      tier={tier}
                      message={nudgeMessage}
                      warnings={warningsCount}
                      maxWarnings={maxWarnings}
                    />
                  )}
                  <div className="text-right">
                    <div className="text-xs md:text-sm font-semibold text-slate-550 dark:text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Time Left:{" "}
                      <span className={`font-mono font-bold ${remainingSeconds <= 300 ? "text-red-500 animate-pulse" : "text-[#1a3884] dark:text-blue-400"}`}>
                        {timeFormatted}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#112b6b] to-[#1a3884] dark:from-blue-500 dark:to-blue-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#1a3884] dark:text-blue-400 min-w-[2.5rem] text-right">{progressPercent}%</span>
              </div>
            </div>

            {/* Question Display */}
            <div className="p-6 md:p-8 flex-1 relative z-10 flex flex-col justify-center">
              <div className="mb-8 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-[#1a3884]/10 dark:bg-blue-400/10 text-[#1a3884] dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">
                  Question {index + 1} of {questions.length}
                </span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white leading-tight max-w-3xl mx-auto">
                  {currentQuestion?.questionText}
                </h3>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 max-w-3xl mx-auto w-full">
                {currentQuestion?.options?.map((option) => {
                  const isSelected = selectedAnswers[currentQuestion._id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => selectOption(option.value)}
                      disabled={interactionLocked || submitting || timeExpired}
                      className={`group relative p-4 rounded-2xl border-2 transition-all duration-200 text-left hover:scale-[1.01] active:scale-[0.99] ${isSelected
                        ? 'border-[#1a3884] dark:border-blue-450 bg-[#1a3884]/5 dark:bg-blue-400/10 shadow-md'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-[#002A5C] hover:border-[#1a3884]/50 dark:hover:border-blue-450/50 hover:bg-slate-50 dark:hover:bg-[#003170]'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected
                          ? 'bg-[#1a3884] dark:bg-blue-500 border-[#1a3884] dark:border-blue-500 text-white'
                          : 'border-slate-300 dark:border-white/15 text-slate-450 dark:text-slate-500 group-hover:border-[#1a3884] dark:group-hover:border-blue-400 group-hover:text-[#1a3884] dark:group-hover:text-blue-400'
                          }`}>
                          {option.value}
                        </div>
                        <span className={`text-sm md:text-base font-semibold ${isSelected ? 'text-[#1a3884] dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-255'}`}>
                          {option.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {(!currentQuestion?.options || currentQuestion.options.length === 0) && (
                <div className="p-6 bg-amber-500/10 border border-dashed border-amber-500/35 rounded-2xl max-w-3xl mx-auto w-full text-center">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    ⚠️ No multiple choice options are available for this question.
                  </p>
                </div>
              )}

              {/* Navigation button */}
              <div className="h-16 mt-8 flex justify-center items-center">
                {index < questions.length - 1 ? (
                  selectedAnswers[currentQuestion?._id] && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={nextQuestion}
                      disabled={interactionLocked || submitting || timeExpired}
                      className="px-8 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl font-bold shadow-lg transition-all"
                    >
                      Next Question
                    </motion.button>
                  )
                ) : (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => submit()}
                    disabled={submitting || interactionLocked || timeExpired || !allQuestionsAnswered}
                    className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 ${!allQuestionsAnswered
                      ? 'bg-slate-200 dark:bg-[#002A5C] text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700'
                      }`}
                  >
                    {submitting ? "Submitting..." : "Submit Assessment"}
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Question Navigator Side panel */}
          <div className="lg:w-72 bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl p-6 h-fit shrink-0">
            <h4 className="text-base font-bold text-slate-905 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-[#1a3884] dark:text-blue-400" size={18} /> Question Map
            </h4>
            <div className="grid grid-cols-5 gap-2 max-h-[250px] overflow-y-auto p-1 custom-scrollbar">
              {questions.map((q, idx) => (
                <button
                  key={q._id}
                  onClick={() => {
                    // Only allow moving to previously answered questions or current index
                    if (selectedAnswers[q._id] || idx === index || selectedAnswers[questions[idx - 1]?._id]) {
                      setIndex(idx);
                    }
                  }}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative ${index === idx
                    ? 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-md border-2 border-emerald-500'
                    : selectedAnswers[q._id]
                      ? 'bg-[#1a3884]/15 dark:bg-blue-500/15 text-[#1a3884] dark:text-blue-300 border border-[#1a3884]/20'
                      : 'bg-slate-100 dark:bg-[#002A5C] text-slate-400 dark:text-slate-500'
                    }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/10 mt-4 text-xs font-semibold text-slate-550 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Answered:</span>
                <span className="text-slate-800 dark:text-white font-bold">{Object.keys(selectedAnswers).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className="text-slate-800 dark:text-white font-bold">{questions.length - Object.keys(selectedAnswers).length}</span>
              </div>
            </div>

            {isDev && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 space-y-2">
                <div className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider text-center">
                  Dev Actions
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => submit({ forcePassDev: true })}
                    disabled={submitting || interactionLocked}
                    className="w-full py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm transition-all"
                  >
                    Pass Test
                  </button>
                  <button
                    onClick={() => submit({ forceFailDev: true })}
                    disabled={submitting || interactionLocked}
                    className="w-full py-2 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm transition-all"
                  >
                    Fail Test
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Exit Warning Modal */}
      {showExitWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-[#002147] p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-white/10 text-center">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Leave Assessment?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              If you leave now, your progress will not be saved and the attempt will be canceled.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/dashboard/career-agent/dashboard')}
                className="w-full py-3 bg-white dark:bg-[#002A5C] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-[#003170]"
              >
                Leave
              </button>
              <button
                onClick={() => setShowExitWarning(false)}
                className="w-full py-3 bg-[#1a3884] text-white rounded-xl font-bold hover:bg-[#112b6b]"
              >
                Continue Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tier 2 — a recorded warning. Non-blocking on purpose */}
      {!submitted && !loading && setupCompleted && (
        <ProctoringNotice
          isOpen={tier === 'warn' && isWarningVisible}
          violationType={lastViolationType}
          warnings={warningsCount}
          maxWarnings={maxWarnings}
          onFix={!isFullScreen ? requestFullscreen : null}
          fixLabel="Return to fullscreen"
          onDismiss={acknowledgeWarning}
        />
      )}

      {/* Tier 3 — the one blocking moment. Slate, not red, and the timer is frozen */}
      <ProctoringPause
        isOpen={tier === 'pause'}
        observations={pauseObservations}
        warnings={warningsCount}
        maxWarnings={maxWarnings}
        onResume={resumeFromPause}
      />

      {!submitted && !loading && setupCompleted && (
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
          gazeDirection={gazeDirection}
        />
      )}

      {showAttentionCheck && (
        <AttentionCheck
          onPass={passAttentionCheck}
          onFail={failAttentionCheck}
        />
      )}

      {/* Inactivity presence check — blurred overlay */}
      {showInactivityOverlay && (
        <InactivityOverlay
          onDismiss={dismissInactivityOverlay}
          onTimeout={failInactivityCheck}
        />
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div>
  );
};

export default SkillAssessmentPlayer;
