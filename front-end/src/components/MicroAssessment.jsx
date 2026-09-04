import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Trophy,
  XCircle,
} from "@/components/icons";
import { courseEnrollmentAPI } from '../services/api';
import {
  isAnswerCorrect,
  prepareQuizSession,
  computeQuizScore,
  getOptionLabel,
  getCorrectOptionIndex,
  getMcqOptionClassName,
  normalizeQuizQuestions,
} from '../utils/microAssessmentUtils';

const MicroAssessment = ({ assessmentData, courseCode, moduleId, dayId, studentId, onComplete, initialResult }) => {
  const [step, setStep] = useState('intro'); // intro, quiz, result, review
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]); // Track user's choices
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const showImmediateFeedback = (shuffledQuestions?.length || 0) <= 1;

  const handleNextDelayed = (answerIndex) => {
    if (isSubmitting) return;
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);
    setSelectedAnswer(null);
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuizDelayed(newAnswers);
    }
  };

  const finishQuizDelayed = async (answers) => {
    const finalScore = computeQuizScore(shuffledQuestions, answers);
    const totalPoints = shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0);
    setScore(finalScore);
    setStep('result');
    setIsSubmitting(true);
    try {
        await courseEnrollmentAPI.updateTaskResult({
            studentId,
            courseCode,
            moduleId,
            dayId,
            stepId: assessmentData?.stepId || 2,
            score: finalScore,
            totalPoints,
            responses: {
                questionIndices: shuffledQuestions.map((q) => q._originalIndex),
                userAnswers: answers,
            },
        });
    } catch (error) {
        console.error("Failed to save progress", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (assessmentData?.questions?.length) {
      const allQuestions = normalizeQuizQuestions(assessmentData.questions);
      if (initialResult?.responses?.questionIndices) {
        const restored = initialResult.responses.questionIndices.map((idx) => ({
          ...allQuestions[idx],
          _originalIndex: idx,
        }));
        setShuffledQuestions(restored.filter(Boolean));
        setUserAnswers(initialResult.responses.userAnswers || []);
      } else {
        const shuffle = assessmentData.shuffleQuestions !== false;
        const { picked } = prepareQuizSession(allQuestions, {
          maxCount: allQuestions.length,
          shuffle,
        });
        setShuffledQuestions(picked);
        setUserAnswers(new Array(picked.length).fill(null));
      }
    }
  }, [assessmentData, initialResult]);

  // Check for existing result
  useEffect(() => {
      if (initialResult && (initialResult.completedAt || initialResult.score != null)) {
          setScore(initialResult.score ?? 0);
          setStep('result');
      }
  }, [initialResult]);

  const handleStart = () => {
    setStep('quiz');
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  const handleSubmitAnswer = (answerIndex) => {
    if (showExplanation || isSubmitting) return; // Prevent double submission and rapid clicks
    
    setIsSubmitting(true); // Lock immediately to prevent race conditions

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    let isCorrect = false;

    if (answerIndex !== null) {
        isCorrect = isAnswerCorrect(currentQuestion, answerIndex);
    }

    if (isCorrect) {
      setScore(prev => prev + (currentQuestion.points || 1));
    }

    // Record answer
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setUserAnswers(newAnswers);

    setSelectedAnswer(answerIndex);
    setShowExplanation(true); // Show explanation state
    
    // Reset isSubmitting after state updates
    setTimeout(() => setIsSubmitting(false), 100);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);

    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    const finalScore = computeQuizScore(shuffledQuestions, userAnswers);
    const totalPoints = shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0);

    setScore(finalScore);
    setStep('result');
    setIsSubmitting(true);

    try {
        await courseEnrollmentAPI.updateTaskResult({
            studentId,
            courseCode,
            moduleId,
            dayId,
            stepId: assessmentData?.stepId || 2,
            score: finalScore,
            totalPoints,
            responses: {
                questionIndices: shuffledQuestions.map((q) => q._originalIndex),
                userAnswers,
            },
        });
    } catch (error) {
        console.error("Failed to save progress", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (!shuffledQuestions.length) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500 dark:text-slate-400 text-sm">
        Loading assessment…
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  const headerSubtitle =
    step === 'quiz'
      ? `Question ${currentQuestionIndex + 1} of ${shuffledQuestions.length}`
      : step === 'review'
        ? 'Review your responses'
        : step === 'result'
          ? 'Summary'
          : 'Practice quiz';

  return (
    <div className="w-full bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 overflow-hidden">
      <div className="px-4 py-4 md:px-6 md:py-5 border-b border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9]/80 dark:bg-[#072036]/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#045C9A]/10 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-[#045C9A]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-[#072036] dark:text-white truncate">
                {assessmentData.title || 'Practice'}
              </h2>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{headerSubtitle}</p>
            </div>
          </div>
          {step === 'quiz' && !showExplanation && (
            <span className="text-xs font-semibold text-[#045C9A] bg-[#045C9A]/10 px-3 py-1 rounded-full w-fit">
              Score: {score}
            </span>
          )}
        </div>
        {step === 'quiz' && (
          <div className="mt-3 h-1.5 bg-[#d7ebf5] dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#045C9A] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="p-4 md:p-8 min-h-[280px]">
        {/* INTRO STEP */}
        {step === 'intro' && (
          <div className="text-center space-y-3 md:space-y-6 py-4 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#045C9A]/10 rounded-full flex items-center justify-center mx-auto text-[#045C9A] mb-2 md:mb-6">
               <AlertCircle className="w-10 h-10 md:w-12 md:h-12" />
            </div>            <h3 className="text-2xl md:text-2xl font-extrabold tracking-tight text-[#045C9A] dark:text-white tracking-tight">Ready for the Assessment?</h3>
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto text-sm md:text-base leading-relaxed font-medium">
              You will answer <strong>{normalizeQuizQuestions(assessmentData?.questions || []).length} multiple-choice questions</strong>.
              {assessmentData?.shuffleQuestions !== false
                ? ' Questions appear in random order.'
                : ' Questions appear in the order set by your instructor.'}
              {' '}After each answer, you will see whether you were correct and a short explanation.
            </p>
            <button
              onClick={handleStart}
              className="w-full sm:w-auto rounded-xl px-6 py-3 text-[13px] font-semibold bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
            >
              Start Assessment
            </button>
          </div>
        )}

        {/* QUIZ STEP */}
        {step === 'quiz' && (
          <div className="max-w-3xl mx-auto">
             <motion.div
               key={currentQuestionIndex}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
                <h3 className="text-lg md:text-xl font-bold text-[#072036] dark:text-white leading-snug md:leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-2.5 md:space-y-3.5">
                  {currentQuestion.options.map((option, idx) => {
                     const isSelected = selectedAnswer === idx;
                     const correctIdx = getCorrectOptionIndex(currentQuestion);
                     const isCorrectOption = idx === correctIdx;
                     const showResult = showExplanation;
                     const optionClass = getMcqOptionClassName({
                       showFeedback: showResult,
                       index: idx,
                       selectedIndex: selectedAnswer,
                       question: currentQuestion,
                     });
                     const btnClass = `w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${optionClass}`;

                     return (
                       <button
                         key={idx}
                         onClick={() => !showExplanation && !isSubmitting && setSelectedAnswer(idx)}
                         disabled={showExplanation || isSubmitting}
                         className={btnClass}
                       >
                         <div className="flex items-center gap-3.5">
                           <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300 ${
                             showResult
                               ? isCorrectOption
                                 ? 'border-emerald-500 bg-emerald-500 text-white'
                                 : isSelected && !isCorrectOption
                                 ? 'border-red-500 bg-red-500 text-white'
                                 : 'border-[#d7ebf5] dark:border-white/10 text-slate-500'
                               : isSelected
                               ? 'border-[#045C9A] bg-[#045C9A] text-white'
                               : 'border-[#d7ebf5] dark:border-white/10 text-slate-500'
                           }`}>
                             {showResult ? (
                               isCorrectOption || (isSelected && !isCorrectOption) ? (
                                 isCorrectOption ? (
                                   <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                                 ) : (
                                   <XCircle className="w-4.5 h-4.5 text-white" />
                                 )
                               ) : (
                                 <span>{getOptionLabel(idx)}</span>
                               )
                             ) : (
                               <span>{getOptionLabel(idx)}</span>
                             )}
                           </div>
                           <span className="text-sm md:text-base font-semibold leading-relaxed">
                             {option}
                           </span>
                         </div>
                       </button>
                     );
                  })}
                </div>

                {/* Explanation & Next Button */}
                <AnimatePresence>
                   {!showExplanation && (
                     <div className="mt-6 flex justify-end">
                       {showImmediateFeedback ? (
                         <button
                           onClick={() => handleSubmitAnswer(selectedAnswer)}
                           disabled={selectedAnswer === null || isSubmitting}
                           className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                         >
                           Submit Answer
                           <ArrowRight size={16} />
                         </button>
                       ) : (
                         <button
                           onClick={() => handleNextDelayed(selectedAnswer)}
                           disabled={selectedAnswer === null || isSubmitting}
                           className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                         >
                           {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                           <ArrowRight size={16} />
                         </button>
                       )}
                     </div>
                   )}

                   {showExplanation && (
                     <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-5 bg-[#EAF7FD] dark:bg-[#045C9A]/10 border border-[#d7ebf5]/50 dark:border-[#045C9A]/30 rounded-2xl text-[#072036] dark:text-[#A6D7E8]"
                    >
                       <p className="font-extrabold mb-1.5 flex items-center gap-2 text-sm uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">
                         <AlertCircle size={15} /> Explanation
                       </p>
                       <p className="text-sm font-medium leading-relaxed opacity-95">
                         {currentQuestion.explanation || "No explanation provided."}
                       </p>

                       <button
                         onClick={handleNextQuestion}
                         className="ml-auto mt-4 flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13px] font-semibold bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                       >
                         {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                         <ArrowRight size={15} />
                       </button>
                    </motion.div>
                  )}
                </AnimatePresence>

             </motion.div>
          </div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && (
          <div className="max-w-3xl mx-auto">
             <button
               type="button"
               onClick={() => setStep('result')}
               className="mb-6 text-sm font-semibold text-[#045C9A] hover:text-[#034a7d] transition-colors"
             >
               ← Back to results
             </button>

             <motion.div
               key={currentQuestionIndex}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
                <h3 className="text-base md:text-xl font-medium text-[#072036] dark:text-slate-200">
                  {shuffledQuestions[currentQuestionIndex].question}
                </h3>

                <div className="space-y-3">
                  {shuffledQuestions[currentQuestionIndex].options.map((option, idx) => {
                     const q = shuffledQuestions[currentQuestionIndex];
                     const isUserChoice = userAnswers[currentQuestionIndex] === idx;
                     const isCorrect = idx === getCorrectOptionIndex(q);
                     
                     let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ";
                     if (isCorrect) btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400";
                     else if (isUserChoice) btnClass += "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400";
                     else btnClass += "border-gray-100 dark:border-white/8 opacity-60";

                     return (
                       <div key={idx} className={btnClass}>
                         <div className="flex items-center gap-3 min-w-0 flex-1">
                           <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold flex-shrink-0">
                             {getOptionLabel(idx)}
                           </span>
                           <span className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200">{option}</span>
                         </div>
                         <div className="flex items-center gap-2 flex-shrink-0">
                           {isUserChoice && (
                             <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#d7ebf5]/80 dark:bg-[#0d3a5f] text-slate-600 dark:text-slate-300">
                               Your answer
                             </span>
                           )}
                           {isCorrect && <CheckCircle2 size={18} className="text-emerald-500" />}
                           {isUserChoice && !isCorrect && <XCircle size={18} className="text-red-500" />}
                         </div>
                       </div>
                     );
                  })}
                </div>

                <div className="bg-[#F1F5F9] dark:bg-white/5 p-4 rounded-xl border border-[#d7ebf5] dark:border-white/10">
                   <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Explanation</p>
                   <p className="text-sm text-slate-600 dark:text-slate-400">
                      {shuffledQuestions[currentQuestionIndex].explanation || "No explanation provided for this question."}
                   </p>
                </div>

                <div className="flex justify-between gap-4">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1 px-4 py-2 border border-[#d7ebf5] dark:border-white/10 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === shuffledQuestions.length - 1}
                        className="flex-1 rounded-xl px-4 py-2.5 text-[13px] font-semibold disabled:opacity-30 bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                    >
                        Next
                    </button>
                </div>
             </motion.div>
          </div>
        )}

        {/* RESULT STEP */}
        {step === 'result' && (
           <div className="text-center py-4 md:py-8 space-y-4 md:space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }} 
                className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600"
              >
                <Trophy size={48} />
              </motion.div>
              
               <div>
                <h3 className="text-2xl font-extrabold tracking-tight text-[#072036] dark:text-white">Assessment Complete!</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Here is how you performed</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 py-6">
                 <div className="text-center">
                    <div className="text-3xl font-extrabold tabular-nums text-[#072036] dark:text-white">{score}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Your Score</div>
                 </div>
                 <div className="text-center">
                    <div className="text-3xl font-extrabold tabular-nums text-slate-300 dark:text-slate-600">/</div>
                 </div>
                 <div className="text-center">
                    <div className="text-3xl font-extrabold tabular-nums text-[#072036] dark:text-white">{shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0)}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Points</div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => {
                        setCurrentQuestionIndex(0);
                        setStep('review');
                    }}
                    className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-[#0d3a5f] border-2 border-[#045C9A] text-[#045C9A] rounded-xl font-bold shadow-sm transition-all hover:bg-[#045C9A]/5"
                  >
                    Review Responses
                  </button>
                  <button
                    onClick={() => onComplete(score, shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0))}
                    className="w-full sm:w-auto rounded-xl px-6 py-3 text-[13px] font-semibold bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                  >
                    Continue to Next Step
                  </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default MicroAssessment;

