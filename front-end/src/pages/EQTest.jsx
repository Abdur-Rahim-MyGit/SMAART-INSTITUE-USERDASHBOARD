import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { assessmentApi } from "@/services/assessmentApi";

const labels = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree",
];

// Circle sizes using Tailwind responsive classes
const circleSizeClasses = [
  "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px]", // Strongly Disagree (1)
  "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-14 lg:h-14", // Disagree (2)
  "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10", // Neutral (3)
  "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-14 lg:h-14", // Agree (4)
  "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px]", // Strongly Agree (5)
];

const Circle = ({ rating, filled, onClick, onMouseEnter, onMouseLeave }) => {
  // Teal for disagree (1-2), gray for neutral (3), navy for agree (4-5)
  const getBorderColor = () => {
    if (rating <= 2) return "border-[#30919D]";
    if (rating === 3) return "border-gray-400";
    return "border-[#002147]";
  };

  const getBackgroundColor = () => {
    if (!filled) return "bg-transparent";
    if (rating <= 2) return "bg-[#30919D]";
    if (rating === 3) return "bg-gray-400";
    return "bg-[#002147]";
  };

  return (
    <button
      type="button"
      aria-label={`rate-${rating}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="transition-all hover:scale-110 focus:outline-none flex items-center justify-center touch-manipulation"
    >
      <div
        className={`rounded-full border-2 sm:border-3 md:border-4 transition-all ${getBorderColor()} ${getBackgroundColor()} ${circleSizeClasses[rating - 1]} flex items-center justify-center`}
      >
        {filled && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-1/2 h-1/2"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </button>
  );
};

const EQTest = () => {
  const navigate = useNavigate();

  // State management
  const [user, setUser] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // Track which questions are answered (UI only)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eqResults, setEqResults] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);

  // Get current question
  const current = questions[index];
  const currentQuestionId = current?._id;
  const value = selectedAnswers[currentQuestionId] || 0;

  // Calculate progress based on answered questions
  const answeredCount = Object.keys(selectedAnswers).length;
  const progress = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Check authentication and fetch assessment on mount
  useEffect(() => {
    const initializeAssessment = async () => {
      try {
        // Check if user is logged in
        const userData = sessionStorage.getItem("user");
        if (!userData) {
          navigate("/");
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Get userId - backend returns 'id' not '_id'
        const userId = parsedUser.id || parsedUser._id;

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        console.log("User ID:", userId);

        // Fetch EQ assessment by code (more reliable than description)
        const assessmentResponse = await assessmentApi.getByCode("ASM00002");

        if (!assessmentResponse.success) {
          throw new Error("Failed to fetch assessment");
        }

        setAssessment(assessmentResponse.data);

        // Check if user has already completed this assessment
        const userResultsResponse = await assessmentApi.getUserResults(userId, 'completed');
        
        if (userResultsResponse.success && userResultsResponse.data) {
          // Check if any completed result has assessmentCode "ASM00002"
          const hasCompletedEQ = userResultsResponse.data.some(
            result => result.assessmentCode === "ASM00002" && result.completionStatus === "completed"
          );

          if (hasCompletedEQ) {
            // User has already completed the EQ assessment
            setError("You have already completed the Emotional Quotient assessment. You can only take it once.");
            setLoading(false);
            return;
          }
        }

        // Start the assessment
        const startResponse = await assessmentApi.startAssessment(
          assessmentResponse.data._id,
          userId
        );

        if (!startResponse.success) {
          throw new Error("Failed to start assessment");
        }

        setResultId(startResponse.data.resultId);
        setQuestions(startResponse.data.questions);

        // If resuming, mark already answered questions
        if (startResponse.data.answeredCount > 0) {
          // You could fetch the result to get existing answers if needed
          console.log(`Resuming assessment with ${startResponse.data.answeredCount} answers`);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing assessment:", err);
        setError(err.message || "Failed to load assessment");
        setLoading(false);
      }
    };

    initializeAssessment();
  }, [navigate]);

  // Save answer to backend
  const setRating = async (v) => {
    if (!currentQuestionId || !resultId || savingAnswer) return;

    try {
      setSavingAnswer(true);

      // Save to backend immediately
      const response = await assessmentApi.saveAnswer(
        resultId,
        currentQuestionId,
        v,
        current.questionText
      );

      if (response.success) {
        // Update UI state only after successful save
        setSelectedAnswers(prev => ({
          ...prev,
          [currentQuestionId]: v
        }));

        // Auto-advance to next question after a brief delay for visual feedback
        setTimeout(() => {
          if (index < questions.length - 1) {
            setIndex(i => i + 1);
          }
        }, 400); // 400ms delay for smooth transition
      }
    } catch (err) {
      console.error("Error saving answer:", err);
      alert("Failed to save answer. Please try again.");
    } finally {
      setSavingAnswer(false);
    }
  };

  const nextQ = () => setIndex((i) => Math.min(i + 1, questions.length - 1));
  const prevQ = () => setIndex((i) => Math.max(i - 1, 0));

  const submit = async () => {
    if (!resultId || submitting) return;

    // Check if all questions are answered
    if (answeredCount < questions.length) {
      alert(`Please answer all questions. ${answeredCount}/${questions.length} answered.`);
      return;
    }

    try {
      setSubmitting(true);

      const response = await assessmentApi.submitAssessment(resultId);

      if (response.success) {
        setSubmitted(true);
        // Store EQ results in state and sessionStorage
        if (response.data.normalizedScore !== undefined) {
          setEqResults({
            normalizedScore: response.data.normalizedScore,
            percentileRange: response.data.percentileRange,
            colorCode: response.data.colorCode,
            description: response.data.description
          });
        }
        sessionStorage.setItem("eqResults", JSON.stringify(response.data));
      }
    } catch (err) {
      console.error("Error submitting assessment:", err);
      alert(err.message || "Failed to submit assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Block leaving the page until submitted
  useEffect(() => {
    if (submitted || loading) return;

    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);

    // Back button guard - show custom modal
    const push = () => window.history.pushState(null, document.title, window.location.href);
    push();
    const onPopState = () => {
      push();
      setShowExitWarning(true); // Show custom modal instead of browser dialog
    };
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [submitted, loading]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#30919D] mx-auto mb-4"></div>
          <p className="text-[#002147] text-lg">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F0F2] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg border border-[#daa520]">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-[#002147] mb-2">Error Loading Assessment</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/dashboard/assessments")}
            className="px-6 py-2 bg-[#30919D] text-white rounded-lg hover:bg-[#277a84] transition-colors"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F2]">
      <div className="min-h-screen">
        {/* Only show header after test is submitted */}
        {submitted && <DashboardHeader />}
        <main className="p-3 sm:p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Two-column layout: Main content + Quiz Navigation */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Main Content Card */}
              <div className="flex-1 bg-white rounded-xl lg:rounded-2xl border border-[#daa520] shadow-lg overflow-hidden">
                {/* Heading */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#002147] text-center leading-tight">
                    Cheating trades short-term wins for long-term loss. Choose honesty, and you choose lasting success
                  </h2>
                </div>

                {/* Progress */}
                <div className="px-4 sm:px-6 pb-3 sm:pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-600">Progress</span>
                    <span className="text-xs sm:text-sm font-semibold text-[#30919D]">{progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300 bg-[#30919D]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  {!submitted ? (
                    <>
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mb-4 sm:mb-6"
                      >
                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-1 sm:mb-2 text-[#30919D]">
                          Q{index + 1} of {questions.length}
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-[#002147]">
                          {`Q${index + 1}. ${current?.questionText || ''}`}
                        </h3>
                      </motion.div>

                      {/* Circles with labels under each */}
                      <div className="w-full max-w-4xl mx-auto flex items-center justify-center gap-3 sm:gap-6 md:gap-8 lg:gap-12 select-none py-4 sm:py-6 md:py-8">
                        {[1, 2, 3, 4, 5].map((n, i) => (
                          <div key={n} className="flex flex-col items-center gap-1.5 sm:gap-2 md:gap-3">
                            <Circle
                              rating={n}
                              filled={n === value}
                              onClick={() => setRating(n)}
                              onMouseEnter={() => { }}
                              onMouseLeave={() => { }}
                            />
                            <div className={`text-[9px] sm:text-[10px] md:text-xs font-medium text-center max-w-[60px] sm:max-w-[70px] md:max-w-[80px] leading-tight ${n === value ? "font-bold text-[#30919D]" : "text-gray-500"}`}>
                              {labels[i]}
                            </div>
                          </div>
                        ))}
                      </div>

                      {savingAnswer && (
                        <div className="text-center text-sm text-[#30919D] mb-2">
                          Saving answer...
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-4 sm:mt-6 md:mt-8 flex flex-wrap justify-end gap-2 sm:gap-3">
                        <button
                          className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md border border-[#daa520] text-[#002147] hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          onClick={prevQ}
                          disabled={index === 0}
                        >
                          Previous
                        </button>
                        <button
                          className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md bg-[#002147] text-white hover:bg-[#003366] disabled:opacity-50 transition-colors"
                          onClick={nextQ}
                          disabled={index === questions.length - 1}
                        >
                          Next
                        </button>
                        <button
                          className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-md font-semibold bg-[#30919D] text-white hover:bg-[#277a84] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                          onClick={submit}
                          disabled={answeredCount < questions.length || submitting}
                        >
                          {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 sm:py-8">
                      {eqResults ? (
                        <>
                          <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🧠</div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#002147] mb-2">Your Emotional Intelligence Result</h3>
                            <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-2xl mx-auto">
                              Your emotional intelligence has been assessed based on 16 key indicators.
                            </p>
                          </div>

                          {/* Color-coded Bar */}
                          <div className="max-w-3xl mx-auto mb-8">
                            <div className="bg-white rounded-xl p-6 border border-[#daa520] shadow-sm">
                              <h4 className="text-lg font-semibold text-[#002147] mb-4 text-center">Emotional Intelligence Level</h4>
                              
                              {/* Progress Bar */}
                              <div className="relative h-12 bg-gray-200 rounded-full overflow-hidden mb-4">
                                <div 
                                  className="h-full transition-all duration-1000 ease-out"
                                  style={{ 
                                    width: `${eqResults.normalizedScore}%`,
                                    backgroundColor: eqResults.colorCode === 'red' ? '#EF4444' :
                                                   eqResults.colorCode === 'amber' ? '#daa520' :
                                                   eqResults.colorCode === 'green' ? '#30919D' : '#30919D'
                                  }}
                                />
                              </div>

                              {/* Percentile Range */}
                              <div className="text-center mb-4">
                                <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold bg-[#30919D]/20 text-[#30919D]">
                                  {eqResults.percentileRange}th Percentile
                                </span>
                              </div>

                              {/* Description */}
                              <div className="bg-[#F0F0F2] rounded-lg p-4 border border-[#daa520]/30">
                                <p className="text-gray-600 leading-relaxed text-center">{eqResults.description}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-3 px-4">
                            <a href="/dashboard/assessments" className="px-6 py-3 text-sm sm:text-base rounded-lg bg-[#30919D] text-white font-semibold hover:bg-[#277a84] transition-all shadow-md">
                              Back to Assessments
                            </a>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-6xl mb-4 text-center">✅</div>
                          <h3 className="text-2xl sm:text-3xl font-bold text-[#002147] mb-4 text-center">Assessment Complete!</h3>
                          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-2xl mx-auto text-center">
                            Thank you for completing the Emotional Quotient assessment. Your responses have been recorded.
                          </p>
                          
                          <div className="mt-8 flex items-center justify-center gap-3 px-4">
                            <a href="/dashboard/assessments" className="px-6 py-3 text-sm sm:text-base rounded-lg bg-[#30919D] text-white font-semibold hover:bg-[#277a84] transition-all shadow-md">
                              Back to Assessments
                            </a>
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Quiz Navigation Panel */}
              {!submitted && (
                <div className="lg:w-80 bg-white rounded-xl lg:rounded-2xl border border-[#daa520] shadow-lg p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-[#002147] mb-3 sm:mb-4">Quiz Navigation</h3>

                  {/* Question Grid */}
                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {questions.map((q, qIndex) => {
                      const isAnswered = selectedAnswers[q._id] > 0;
                      const isCurrent = qIndex === index;

                      return (
                        <button
                          key={q._id}
                          onClick={() => setIndex(qIndex)}
                          className={`
                            aspect-square rounded-md text-xs sm:text-sm font-medium transition-all touch-manipulation
                            ${isAnswered
                              ? 'bg-[#30919D] text-white hover:bg-[#277a84]'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }
                            ${isCurrent ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-[#daa520] ring-offset-white' : ''}
                          `}
                        >
                          {qIndex + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="mt-4 sm:mt-6 space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-[#30919D]"></div>
                      <span className="text-gray-600">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-100"></div>
                      <span className="text-gray-600">Unanswered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-gray-100 ring-2 ring-[#daa520]"></div>
                      <span className="text-gray-600">Current question</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* Custom Exit Warning Modal */}
        {showExitWarning && !submitted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-[#daa520]"
            >
              {/* Warning Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#30919D] flex items-center justify-center">
                  <svg
                    className="w-10 h-10 sm:w-12 sm:h-12 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-[#002147] text-center mb-3">
                Are you sure you want to leave?
              </h3>

              {/* Message */}
              <p className="text-gray-600 text-center mb-2 text-sm sm:text-base">
                Your progress has been saved, but leaving now means you'll need to resume later.
              </p>
              <p className="text-gray-500 text-center mb-6 text-xs sm:text-sm">
                You've answered <span className="font-semibold text-[#30919D]">{answeredCount}</span> out of{" "}
                <span className="font-semibold text-[#002147]">{questions.length}</span> questions.
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all shadow-md bg-[#30919D] text-white hover:bg-[#277a84]"
                >
                  Continue Test
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    navigate("/dashboard/assessments");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-[#002147] rounded-lg font-semibold hover:bg-gray-200 transition-all border border-[#daa520]"
                >
                  Leave Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EQTest;
