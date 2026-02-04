import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { assessmentApi } from "@/services/assessmentApi";

const VAKTest = () => {
  const navigate = useNavigate();

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
  const [vakResults, setVakResults] = useState(null);

  // Get current question
  const current = questions[index];
  const currentQuestionId = current?._id;
  const selectedValue = selectedAnswers[currentQuestionId] || null;

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

        const userId = parsedUser.id || parsedUser._id;

        if (!userId) {
          throw new Error("User ID not found. Please log in again.");
        }

        // Fetch VAK assessment by code (more reliable than description)
        const assessmentResponse = await assessmentApi.getByCode("ASM00003");

        if (!assessmentResponse.success) {
          throw new Error("Failed to fetch VAK assessment");
        }

        setAssessment(assessmentResponse.data);

        // Check if user has already completed this assessment
        const userResultsResponse = await assessmentApi.getUserResults(userId, 'completed');
        
        if (userResultsResponse.success && userResultsResponse.data) {
          const hasCompletedVAK = userResultsResponse.data.some(
            result => result.assessmentCode === "ASM00003" && result.completionStatus === "completed"
          );

          if (hasCompletedVAK) {
            setError("You have already completed the VAK Learning Style assessment. You can only take it once.");
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
  const selectOption = async (optionValue) => {
    if (!currentQuestionId || !resultId || savingAnswer) return;

    try {
      setSavingAnswer(true);

      // Save to backend immediately
      const response = await assessmentApi.saveAnswer(
        resultId,
        currentQuestionId,
        optionValue,
        current.questionText
      );

      if (response.success) {
        // Update UI state only after successful save
        setSelectedAnswers(prev => ({
          ...prev,
          [currentQuestionId]: optionValue
        }));

        // Auto-advance to next question after a brief delay
        setTimeout(() => {
          if (index < questions.length - 1) {
            setIndex(i => i + 1);
          }
        }, 400);
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
        sessionStorage.setItem("vakResults", JSON.stringify(response.data));
        
        // Store VAK results in state for display
        if (response.data.learningStyle) {
          setVakResults({
            learningStyle: response.data.learningStyle,
            description: response.data.learningStyleDescription,
            scores: response.data.vakScores
          });
        }
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

    const push = () => window.history.pushState(null, document.title, window.location.href);
    push();
    const onPopState = () => {
      push();
      setShowExitWarning(true);
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
        {submitted && <DashboardHeader />}
        <main className="p-3 sm:p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Main Content Card */}
              <div className="flex-1 bg-white rounded-xl lg:rounded-2xl border border-[#daa520] shadow-lg overflow-hidden">
                {/* Heading */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#002147] text-center leading-tight">
                    Discover Your Learning Style: Visual, Auditory, or Kinesthetic
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
                      className="h-full bg-[#30919D] transition-all duration-300"
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

                      {/* Options A, B, C */}
                      <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                        {current?.options?.map((option, idx) => {
                          const isSelected = selectedValue === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => selectOption(option.value)}
                              disabled={savingAnswer}
                              className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all ${
                                isSelected
                                  ? 'border-[#30919D] bg-[#30919D]/10 shadow-md'
                                  : 'border-gray-200 hover:border-[#30919D]/50 hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold ${
                                  isSelected
                                    ? 'border-[#30919D] bg-[#30919D] text-white'
                                    : 'border-gray-300 text-gray-500'
                                }`}>
                                  {option.value}
                                </div>
                                <p className="flex-1 text-sm sm:text-base text-[#002147] leading-relaxed">
                                  {option.label}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {savingAnswer && (
                        <div className="text-center text-sm text-[#30919D] mt-4">
                          Saving answer...
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-6 sm:mt-8 flex flex-wrap justify-end gap-2 sm:gap-3">
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
                      {vakResults ? (
                        <>
                          <div className="text-center mb-8">
                            <div className="text-6xl mb-4">🎓</div>
                            <h3 className="text-2xl sm:text-3xl font-bold text-[#002147] mb-2">Your Learning Style</h3>
                            <div className="inline-block px-6 py-3 bg-[#30919D]/10 rounded-full border-2 border-[#30919D] mb-4">
                              <p className="text-xl sm:text-2xl font-bold text-[#30919D]">{vakResults.learningStyle}</p>
                            </div>
                          </div>

                          {/* Scores Display */}
                          {vakResults.scores && (
                            <div className="max-w-2xl mx-auto mb-8 space-y-4">
                              <h4 className="text-lg font-semibold text-[#002147] mb-4">Your Scores:</h4>
                              
                              {/* Visual Score */}
                              <div className="bg-white rounded-lg p-4 border border-[#daa520] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-[#002147]">Visual (A)</span>
                                  <span className="text-lg font-bold text-[#30919D]">{vakResults.scores.visual}</span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#30919D] rounded-full transition-all duration-500"
                                    style={{ width: `${(vakResults.scores.visual / 30) * 100}%` }}
                                  />
                                </div>
                              </div>

                              {/* Auditory Score */}
                              <div className="bg-white rounded-lg p-4 border border-[#daa520] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-[#002147]">Auditory (B)</span>
                                  <span className="text-lg font-bold text-[#daa520]">{vakResults.scores.auditory}</span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#daa520] rounded-full transition-all duration-500"
                                    style={{ width: `${(vakResults.scores.auditory / 30) * 100}%` }}
                                  />
                                </div>
                              </div>

                              {/* Kinesthetic Score */}
                              <div className="bg-white rounded-lg p-4 border border-[#daa520] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-semibold text-[#002147]">Kinesthetic (C)</span>
                                  <span className="text-lg font-bold text-[#002147]">{vakResults.scores.kinesthetic}</span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#002147] rounded-full transition-all duration-500"
                                    style={{ width: `${(vakResults.scores.kinesthetic / 30) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Description */}
                          <div className="max-w-3xl mx-auto bg-white rounded-xl p-6 border border-[#daa520] mb-8 shadow-sm">
                            <h4 className="text-lg font-semibold text-[#002147] mb-3">What This Means:</h4>
                            <p className="text-gray-600 leading-relaxed">{vakResults.description}</p>
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
                            Thank you for completing the VAK Learning Style assessment. Your responses have been recorded.
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
                  <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                    {questions.map((q, qIndex) => {
                      const isAnswered = selectedAnswers[q._id];
                      const isCurrent = qIndex === index;

                      return (
                        <button
                          key={q._id}
                          onClick={() => setIndex(qIndex)}
                          className={`
                            aspect-square rounded-md text-xs sm:text-sm font-medium transition-all
                            ${isAnswered
                              ? 'bg-[#30919D] text-white hover:bg-[#277a84]'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }
                            ${isCurrent ? 'ring-2 ring-[#daa520] ring-offset-2 ring-offset-white' : ''}
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

                  {/* Developer Skip Button - Bypasses all assessments */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Set the dev bypass flag and navigate to dashboard
                        sessionStorage.setItem('devSkipAssessments', 'true');
                        console.log('🚀 DEV SKIP: Bypassing all assessments');
                        navigate('/dashboard');
                      }}
                      className="w-full text-[10px] text-white/60 hover:text-white bg-gray-800 hover:bg-gray-700 py-2 px-3 rounded-md uppercase tracking-widest font-bold transition-colors"
                    >
                      ⚡ DEV: Skip to Dashboard
                    </button>
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
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#30919D] flex items-center justify-center">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-[#002147] text-center mb-3">
                Are you sure you want to leave?
              </h3>

              <p className="text-gray-600 text-center mb-2 text-sm sm:text-base">
                Your progress has been saved, but leaving now means you'll need to resume later.
              </p>
              <p className="text-gray-500 text-center mb-6 text-xs sm:text-sm">
                You've answered <span className="font-semibold text-[#30919D]">{answeredCount}</span> out of{" "}
                <span className="font-semibold text-[#002147]">{questions.length}</span> questions.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="flex-1 px-6 py-3 rounded-lg font-semibold bg-[#30919D] text-white hover:bg-[#277a84] transition-all shadow-md"
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

export default VAKTest;
