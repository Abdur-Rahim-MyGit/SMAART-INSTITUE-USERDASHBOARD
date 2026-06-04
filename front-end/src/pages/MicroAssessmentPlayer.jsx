import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  RiArrowLeftLine as ArrowLeft,
  RiArrowRightLine as ArrowRight,
  RiTimeLine as Clock,
  RiCheckboxCircleLine as CheckCircle2,
  RiCloseCircleLine as XCircle,
  RiAlertLine as AlertCircle,
  RiTrophyLine as Trophy,
  RiPlayCircleLine as Play,
  RiClipboardLine as ClipboardCheck,
  RiStarLine as Star
} from "@remixicon/react";
import { courseEnrollmentAPI } from "@/services/api";
import useUser from "@/hooks/useUser";
import {
  isAnswerCorrect,
  prepareQuizSession,
  normalizeQuizQuestions,
  getOptionLabel,
  getCorrectOptionIndex,
  getMcqOptionClassName,
} from "@/utils/microAssessmentUtils";

const getScoreGrade = (pct) => {
  if (pct >= 90) return { label: "Excellent", color: "#22c55e", bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400" };
  if (pct >= 75) return { label: "Good", color: "#1a3884", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" };
  if (pct >= 60) return { label: "Satisfactory", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" };
  return { label: "Needs Work", color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" };
};

const ScoreRing = ({ pct = 0, size = 120, stroke = 10 }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const grade = getScoreGrade(pct);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-md">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={grade.color} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-black text-slate-800 dark:text-white">{pct}%</span>
      </div>
    </div>
  );
};

const MicroAssessmentPlayer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { assessment } = location.state || {};

  const [phase, setPhase] = useState("start"); // start, taking, result, review
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({}); // questionIndex -> selectedOptionIndex
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState({});

  const timerRef = useRef(null);

  const normalizedQuestions = useMemo(
    () => normalizeQuizQuestions(assessment?.assessmentData?.questions || []),
    [assessment]
  );

  useEffect(() => {
    if (!assessment) {
      navigate("/dashboard/micro-assessments", { replace: true });
    }
  }, [assessment, navigate]);

  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const activeQuestions = shuffledQuestions.length > 0 ? shuffledQuestions : normalizedQuestions;
  const totalQ = activeQuestions.length;
  const maxTime = Math.max(totalQ, 1) * 90;
  const showFeedback = Boolean(revealed[currentQ]);

  useEffect(() => {
    if (phase === "taking") {
      setTimeLeft(maxTime);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, maxTime]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    handleSubmit();
  };

  const handleStart = () => {
    const shuffle = assessment?.assessmentData?.shuffleQuestions !== false;
    const { picked } = prepareQuizSession(normalizedQuestions, {
      maxCount: normalizedQuestions.length,
      shuffle,
    });
    const mapped = picked.map((q) => ({
      ...q,
      originalIndex: q._originalIndex ?? 0,
    }));
    setShuffledQuestions(mapped);
    setPhase("taking");
    setCurrentQ(0);
    setAnswers({});
    setRevealed({});
  };

  const handleAnswerSelect = (qIdx, optIdx) => {
    if (revealed[qIdx]) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    setRevealed((prev) => ({ ...prev, [qIdx]: true }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearInterval(timerRef.current);

    let score = 0;
    let totalPoints = 0;
    let userAnswers = Array(normalizedQuestions.length).fill(null);

    activeQuestions.forEach((q, i) => {
      const pts = q.points || 1;
      totalPoints += pts;
      const selected = answers[i];
      if (q.originalIndex !== undefined) {
        userAnswers[q.originalIndex] = selected !== undefined ? selected : null;
      } else {
        userAnswers.push(selected !== undefined ? selected : null);
      }
      const isCorrect = selected !== undefined && isAnswerCorrect(q, selected);
      if (isCorrect) {
        score += pts;
      }
    });

    try {
      await courseEnrollmentAPI.updateTaskResult({
        studentId: assessment.studentId,
        courseCode: assessment.courseCode,
        moduleId: assessment.moduleId,
        dayId: assessment.dayId,
        stepId: assessment.assessmentData.stepId || 2,
        score,
        totalPoints,
        responses: {
            questionIndices: activeQuestions.map((q) => q.originalIndex ?? q._originalIndex ?? 0),
            userAnswers: userAnswers
        }
      });
      setResult({ score, totalPoints, pct: Math.round((score / totalPoints) * 100) });
      setPhase("result");
    } catch (err) {
      console.error("Submission failed", err);
      alert("Failed to submit assessment. Please try again.");
      setPhase("taking"); // let them retry submission
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!assessment) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#00152E]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-[#002147]/80 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <button
            onClick={() => {
              if (phase === "taking") {
                if(window.confirm("Are you sure you want to exit? Your progress will be lost.")) navigate("/dashboard/micro-assessments");
              } else {
                navigate("/dashboard/micro-assessments");
              }
            }}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#002A5C]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-sm font-black text-slate-900 dark:text-white sm:text-base">{assessment.title}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{assessment.courseTitle}</p>
          </div>
          
          <div className="w-[80px] text-right">
            {phase === "taking" && (
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-bold ${timeLeft < 60 ? "animate-pulse bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400" : "bg-blue-50 text-[#1a3884] dark:bg-blue-500/20 dark:text-blue-300"}`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <AnimatePresence mode="wait">
          
          {/* ─── START PHASE ─────────────────────────────────────────── */}
          {phase === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#002147] dark:shadow-none"
            >
              <div className="bg-gradient-to-br from-[#00152E] via-[#001A3A] to-[#1a3884] p-10 text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 shadow-inner backdrop-blur-md">
                  <ClipboardCheck className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">{assessment.title}</h2>
                <p className="mt-2 text-sm font-medium text-blue-200">Session {assessment.dayId} · {assessment.moduleTitle}</p>
              </div>
              
              <div className="p-8 sm:p-10">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Assessment Rules</h3>
                <ul className="mb-8 space-y-4">
                  {[
                    { icon: Clock, text: `You have ${formatTime(maxTime)} to complete this assessment.` },
                    { icon: AlertCircle, text: `There are ${totalQ} questions in total.` },
                    { icon: CheckCircle2, text: "You can navigate between questions freely." },
                    { icon: Trophy, text: "Submit before the timer runs out to record your score." }
                  ].map((rule, i) => (
                    <li key={i} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-[#002A5C]/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#1a3884] dark:bg-blue-500/20 dark:text-blue-400">
                        <rule.icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{rule.text}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={handleStart}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a3884] via-[#2b57c4] to-[#3b6de3] py-4 text-lg font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:shadow-2xl hover:shadow-blue-500/30 active:scale-[0.98]"
                >
                  <Play className="h-6 w-6" />
                  Begin Assessment
                </button>
              </div>
            </motion.div>
          )}

          {/* ─── TAKING PHASE ────────────────────────────────────────── */}
          {phase === "taking" && (
            <motion.div key="taking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-24">
              
              {/* Question Navigator */}
              <div className="mb-8 flex flex-wrap justify-center gap-2">
                {activeQuestions.map((_, i) => {
                  const isAnswered = answers[i] !== undefined;
                  const isCurrent = currentQ === i;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold transition-all ${
                        isCurrent 
                          ? "bg-[#1a3884] text-white shadow-lg shadow-[#1a3884]/30 ring-2 ring-[#1a3884] ring-offset-2 dark:ring-offset-[#00152E]" 
                          : isAnswered
                            ? "bg-blue-50 text-[#1a3884] border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                            : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 dark:bg-[#002147] dark:text-slate-400 dark:border-white/10 dark:hover:border-white/20"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Question Card */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQ}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:bg-[#002147] dark:shadow-none sm:p-10"
                >
                  <div className="mb-8">
                    <span className="mb-3 text-xs font-black uppercase tracking-widest text-[#1a3884] dark:text-blue-400">
                      Question {currentQ + 1} of {totalQ}
                    </span>
                    <h3 className="text-xl font-black leading-snug text-slate-900 dark:text-white sm:text-2xl">
                      {activeQuestions[currentQ].question}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {activeQuestions[currentQ].options.map((opt, i) => {
                      const q = activeQuestions[currentQ];
                      const isSelected = answers[currentQ] === i;
                      const correctIdx = getCorrectOptionIndex(q);
                      const isCorrectOption = i === correctIdx;
                      const optionClass = getMcqOptionClassName({
                        showFeedback,
                        index: i,
                        selectedIndex: answers[currentQ],
                        question: q,
                      });

                      return (
                        <button
                          key={i}
                          onClick={() => handleAnswerSelect(currentQ, i)}
                          disabled={showFeedback}
                          className={`w-full flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all ${optionClass}`}
                        >
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                            showFeedback && isCorrectOption
                              ? "border-green-500 bg-green-500 text-white"
                              : showFeedback && isSelected && !isCorrectOption
                                ? "border-red-500 bg-red-500 text-white"
                                : isSelected
                                  ? "border-[#1a3884] bg-[#1a3884] text-white"
                                  : "border-slate-300 dark:border-slate-600 text-slate-500"
                          }`}>
                            {showFeedback && isCorrectOption && <CheckCircle2 className="h-4 w-4" />}
                            {showFeedback && isSelected && !isCorrectOption && <XCircle className="h-4 w-4" />}
                            {!showFeedback && getOptionLabel(i)}
                          </div>
                          <span className="text-sm md:text-base font-semibold text-slate-750 dark:text-slate-250">
                            <span className="hidden">{getOptionLabel(i)}.</span>
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {showFeedback && (
                    <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
                      <p className="text-xs font-black uppercase tracking-widest text-[#1a3884] dark:text-blue-400 mb-2">
                        Explanation
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {activeQuestions[currentQ].explanation || "No explanation provided for this question."}
                      </p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation / Submit Floating Bar */}
              <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/80 p-4 backdrop-blur-md dark:border-white/10 dark:bg-[#002147]/80">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
                  <button
                    onClick={() => setCurrentQ(p => Math.max(0, p - 1))}
                    disabled={currentQ === 0}
                    className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-slate-600 disabled:opacity-30 dark:text-slate-300"
                  >
                    <ArrowLeft className="h-4 w-4" /> Prev
                  </button>
                  
                  {currentQ < totalQ - 1 ? (
                    <button
                      onClick={() => setCurrentQ(p => Math.min(totalQ - 1, p + 1))}
                      disabled={!showFeedback}
                      className="flex items-center gap-2 rounded-xl bg-slate-100 px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-[#003170] dark:text-white dark:hover:bg-[#004080]"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !showFeedback}
                      className="flex items-center gap-2 rounded-xl bg-[#1a3884] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-[#1a3884]/30 transition-all hover:bg-[#112558] disabled:opacity-50"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Assessment"} <CheckCircle2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── RESULT PHASE ────────────────────────────────────────── */}
          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto mb-8 max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white p-10 shadow-xl dark:border-white/10 dark:bg-[#002147]">
                <h2 className="mb-8 text-2xl font-black text-slate-900 dark:text-white">Assessment Complete</h2>
                
                <div className="mb-8 flex justify-center">
                  <ScoreRing pct={result.pct} size={160} stroke={12} />
                </div>
                
                <div className="mb-8 rounded-2xl bg-slate-50 p-4 dark:bg-[#002A5C]/50">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-500 dark:text-slate-400">Score</span>
                    <span className="font-bold text-slate-900 dark:text-white">{result.score} / {result.totalPoints} pts</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => setPhase("review")}
                    className="w-full rounded-xl border-2 border-[#1a3884] bg-white py-3 font-bold text-[#1a3884] transition-colors hover:bg-blue-50 dark:border-blue-500 dark:bg-transparent dark:text-blue-400 dark:hover:bg-blue-900/30"
                  >
                    Review Answers
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/micro-assessments")}
                    className="w-full rounded-xl bg-[#1a3884] py-3 font-bold text-white shadow-lg shadow-[#1a3884]/30 transition-all hover:bg-[#112558]"
                  >
                    Back to Hub
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── REVIEW PHASE ────────────────────────────────────────── */}
          {phase === "review" && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#002147]">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Answer Review</h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Score: {result.pct}%</p>
                </div>
                <button
                  onClick={() => navigate("/dashboard/micro-assessments")}
                  className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 dark:bg-[#003170] dark:text-slate-200 dark:hover:bg-[#004080]"
                >
                  Close Review
                </button>
              </div>

              {activeQuestions.map((q, i) => {
                const userAns = answers[i];
                const isCorrect = userAns !== undefined && isAnswerCorrect(q, userAns);
                
                return (
                  <div key={i} className={`overflow-hidden rounded-[24px] border-2 bg-white shadow-sm dark:bg-[#002147] ${isCorrect ? "border-green-100 dark:border-green-900/30" : "border-red-100 dark:border-red-900/30"}`}>
                    <div className={`flex items-center gap-3 px-6 py-4 ${isCorrect ? "bg-green-50/50 dark:bg-green-900/10" : "bg-red-50/50 dark:bg-red-900/10"}`}>
                      {isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                      <span className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Question {i + 1}</span>
                    </div>
                    
                    <div className="p-6">
                      <p className="mb-6 text-lg font-bold text-slate-900 dark:text-white">{q.question}</p>
                      <div className="space-y-3">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = userAns === optIdx;
                          const isActualCorrect = optIdx === getCorrectOptionIndex(q);
                          
                          let optClass = "border-slate-250 bg-[#F8FAFC]/50 text-slate-500 dark:border-white/5 dark:bg-[#001A3A] dark:text-slate-300 opacity-60";
                          if (isActualCorrect) optClass = "border-green-500 bg-green-55/10 text-green-700 dark:bg-green-900/20 dark:text-green-300";
                          else if (isSelected && !isActualCorrect) optClass = "border-red-500 bg-red-55/10 text-red-750 dark:bg-red-900/20 dark:text-red-300";

                          return (
                            <div key={optIdx} className={`flex items-center gap-4 rounded-2xl border-2 p-4 md:p-5 transition-all duration-300 ${optClass}`}>
                              <div className="flex-1 text-sm md:text-base font-semibold leading-relaxed text-slate-750 dark:text-slate-200">{opt}</div>
                              {isSelected && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 opacity-70">Your Answer</span>}
                              {isActualCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                              {(isSelected && !isActualCorrect) && <XCircle className="h-5 w-5 text-red-500" />}
                            </div>
                          );
                        })}
                      </div>
                      
                      {q.explanation && (
                        <div className="mt-6 rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
                          <p className="text-xs font-bold uppercase tracking-widest text-[#1a3884] dark:text-blue-400 mb-1">Explanation</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
};

export default MicroAssessmentPlayer;
