import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight, Trophy } from 'lucide-react';
import { courseEnrollmentAPI } from '../services/api';

const MicroAssessment = ({ assessmentData, courseCode, moduleId, dayId, studentId, onComplete, initialResult }) => {
  const [step, setStep] = useState('intro'); // intro, quiz, result, review
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]); // Track user's choices
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (assessmentData && assessmentData.questions) {
      if (initialResult?.responses?.questionIndices) {
        // Restore previous questions
        const restored = initialResult.responses.questionIndices.map(idx => assessmentData.questions[idx]);
        setShuffledQuestions(restored);
        setUserAnswers(initialResult.responses.userAnswers || []);
      } else {
        // Shuffle new questions
        const indices = Array.from({ length: assessmentData.questions.length }, (_, i) => i);
        const shuffledIndices = indices.sort(() => 0.5 - Math.random()).slice(0, 5);
        const shuffled = shuffledIndices.map(idx => assessmentData.questions[idx]);
        // Store indices in the question objects temporarily so we can save them later
        shuffled.forEach((q, i) => q._originalIndex = shuffledIndices[i]);
        setShuffledQuestions(shuffled);
        setUserAnswers(new Array(shuffled.length).fill(null));
      }
    }
  }, [assessmentData, initialResult]);

  // Check for existing result
  useEffect(() => {
      if (initialResult && initialResult.isCompleted) {
          setScore(initialResult.score);
          setStep('result');
      }
  }, [initialResult]);

  useEffect(() => {
    if (step === 'quiz') {
      setTimeLeft(90);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step, currentQuestionIndex]);

  const handleTimeout = () => {
    clearInterval(timerRef.current);
    // Auto-submit as incorrect if not answered
    if (selectedAnswer === null) {
        handleSubmitAnswer(null);
    }
  };

  const handleStart = () => {
    setStep('quiz');
    setCurrentQuestionIndex(0);
    setScore(0);
  };

  const handleSubmitAnswer = (answerIndex) => {
    if (showExplanation || isSubmitting) return; // Prevent double submission and rapid clicks
    
    setIsSubmitting(true); // Lock immediately to prevent race conditions
    clearInterval(timerRef.current);
    
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    let isCorrect = false;

    // Handle timeout (answerIndex is null)
    if (answerIndex !== null) {
        const selectedOption = currentQuestion.options[answerIndex];
        isCorrect = selectedOption === currentQuestion.correctAnswer;
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
    setStep('result');
    setIsSubmitting(true);
    
    // Calculate final score
    // Note: score state might not be immediately updated if called directly after setScore
    // allow a small render cycle or use a calculated value if needed. 
    // Here we use the state 'score' which is updated on each answer.
    
    // However, since handleNextQuestion calls this, we need to be careful. 
    // Actually, 'score' is updated in handleSubmitAnswer, so by the time we click "Next" (which calls handleNextQuestion), score is stable.

    try {
        await courseEnrollmentAPI.updateTaskResult({
            studentId,
            courseCode,
            moduleId,
            dayId,
            stepId: assessmentData.stepId || 2, // Map to correct step
            score: score,
            totalPoints: shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0),
            responses: {
                questionIndices: shuffledQuestions.map(q => q._originalIndex),
                userAnswers: userAnswers
            }
        });
    } catch (error) {
        console.error("Failed to save progress", error);
    } finally {
        setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!shuffledQuestions.length) return <div>Loading Assessment...</div>;

  const currentQuestion = shuffledQuestions[currentQuestionIndex];

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-[#002147] rounded-2xl shadow-sm border border-gray-100 dark:border-white/8 overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-3 md:p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white">
            <Trophy className="text-[#1a3884] drop-shadow-lg" size={28} />
            {assessmentData.title || "Micro-Assessment"}
          </h2>
          <p className="text-white/80 text-[10px] md:text-sm mt-0.5 hidden sm:block">Test your knowledge</p>
        </div>
        
        {step === 'quiz' && (
           <div className={`
             flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-base md:text-lg
             ${timeLeft < 10 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/10 text-white'}
           `}>
             <Clock className="w-4 h-4 md:w-5 md:h-5" />
             {formatTime(timeLeft)}
           </div>
        )}
      </div>

      <div className="p-3 md:p-8 min-h-[300px] md:min-h-[400px]">
        {/* INTRO STEP */}
        {step === 'intro' && (
          <div className="text-center space-y-3 md:space-y-6 py-4 md:py-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#1a3884]/10 rounded-full flex items-center justify-center mx-auto text-[#1a3884] mb-2 md:mb-6">
               <AlertCircle className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Ready for the Assessment?</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto text-base md:text-lg">
              You will have <strong>5 randomized questions</strong> to answer. 
              You have <strong>90 seconds</strong> per question. 
              Applying the CLEAR-5 framework is key.
            </p>
            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-[#1a3884]/30"
            >
              Start Assessment
            </button>
          </div>
        )}

        {/* QUIZ STEP */}
        {step === 'quiz' && (
          <div className="max-w-3xl mx-auto">
             {/* Progress Bar */}
             <div className="mb-4 md:mb-8">
               <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
                 <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
                 <span>Score: {score}</span>
               </div>
               <div className="h-2 bg-gray-100 dark:bg-[#002A5C] rounded-full overflow-hidden">
                 <motion.div 
                   className="h-full bg-[#1a3884]"
                   initial={{ width: 0 }}
                   animate={{ width: `${((currentQuestionIndex + 1) / shuffledQuestions.length) * 100}%` }}
                 />
               </div>
             </div>

             <motion.div
               key={currentQuestionIndex}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
                <h3 className="text-base md:text-xl font-medium text-gray-800 dark:text-slate-200 leading-snug md:leading-relaxed">
                  {currentQuestion.question}
                </h3>

                <div className="space-y-2 md:space-y-3">
                  {currentQuestion.options.map((option, idx) => {
                     const isSelected = selectedAnswer === idx;
                     const isCorrect = option === currentQuestion.correctAnswer;
                     
                     let btnClass = "w-full text-left p-2.5 md:p-4 rounded-xl border-2 transition-all ";
                     if (showExplanation) {
                        if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-400";
                        else if (isSelected) btnClass += "border-red-500 bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-400";
                        else btnClass += "border-gray-200 dark:border-white/8 opacity-50";
                     } else {
                        btnClass += isSelected 
                          ? "border-[#1a3884] bg-[#1a3884]/10 text-[#0e5c65] dark:text-blue-300 dark:bg-[#1a3884]/20" 
                          : "border-gray-200 dark:border-white/10 hover:border-[#1a3884]/50 hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C]";
                     }

                     return (
                       <button
                         key={idx}
                         onClick={() => !showExplanation && !isSubmitting && handleSubmitAnswer(idx)}
                         disabled={showExplanation || isSubmitting}
                         className={btnClass}
                       >
                         <div className="flex items-center gap-3">
                           <div className={`
                             w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                             ${showExplanation && isCorrect ? 'border-green-500 bg-green-500 text-white' : ''}
                             ${showExplanation && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                             ${!showExplanation && isSelected ? 'border-[#1a3884] bg-[#1a3884]' : 'border-gray-300 dark:border-slate-600'}
                           `}>
                              {showExplanation && isCorrect && <CheckCircle2 size={14} />}
                              {showExplanation && isSelected && !isCorrect && <XCircle size={14} />}
                           </div>
                           <span className="text-sm md:text-base dark:text-slate-300">{option}</span>
                         </div>
                       </button>
                     );
                  })}
                </div>

                {/* Explanation & Next Button */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-900 dark:text-blue-300"
                    >
                       <p className="font-semibold mb-1 flex items-center gap-2">
                         <AlertCircle size={16} /> Explanation
                       </p>
                       <p className="text-sm opacity-90">
                         {currentQuestion.explanation || "No explanation provided."}
                       </p>

                       <button
                         onClick={handleNextQuestion}
                         className="mt-4 flex w-full sm:w-auto justify-center items-center gap-2 bg-[#1a3884] text-white px-6 py-2 rounded-lg hover:bg-[#112b6b] transition-colors ml-auto shadow-md"
                       >
                         {currentQuestionIndex < shuffledQuestions.length - 1 ? 'Next Question' : 'Finish Assessment'}
                         <ArrowRight size={16} />
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
             <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={() => setStep('result')}
                    className="text-sm font-bold text-[#1a3884] flex items-center gap-1 hover:underline"
                >
                    Back to Results
                </button>
                <div className="text-sm font-medium text-slate-500">
                    Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
                </div>
             </div>

             <motion.div
               key={currentQuestionIndex}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="space-y-6"
             >
                <h3 className="text-base md:text-xl font-medium text-gray-800 dark:text-slate-200">
                  {shuffledQuestions[currentQuestionIndex].question}
                </h3>

                <div className="space-y-3">
                  {shuffledQuestions[currentQuestionIndex].options.map((option, idx) => {
                     const isUserChoice = userAnswers[currentQuestionIndex] === idx;
                     const isCorrect = option === shuffledQuestions[currentQuestionIndex].correctAnswer;
                     
                     let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ";
                     if (isCorrect) btnClass += "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-800 dark:text-green-400";
                     else if (isUserChoice) btnClass += "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-400";
                     else btnClass += "border-gray-100 dark:border-white/8 opacity-60";

                     return (
                       <div key={idx} className={btnClass}>
                         <div className="flex items-center gap-3">
                           <span className="text-sm md:text-base">{option}</span>
                         </div>
                         {isCorrect && <CheckCircle2 size={18} className="text-green-500" />}
                         {isUserChoice && !isCorrect && <XCircle size={18} className="text-red-500" />}
                         {isUserChoice && <span className="text-[10px] font-bold uppercase ml-2 px-2 py-0.5 bg-slate-200 dark:bg-[#003170] rounded text-slate-600 dark:text-slate-400">Your Answer</span>}
                       </div>
                     );
                  })}
                </div>

                <div className="bg-[#F8FAFC] dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/10">
                   <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Explanation</p>
                   <p className="text-sm text-slate-600 dark:text-slate-400">
                      {shuffledQuestions[currentQuestionIndex].explanation || "No explanation provided for this question."}
                   </p>
                </div>

                <div className="flex justify-between gap-4">
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="flex-1 px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 disabled:opacity-30"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => setCurrentQuestionIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
                        disabled={currentQuestionIndex === shuffledQuestions.length - 1}
                        className="flex-1 px-4 py-2 bg-[#1a3884] text-white rounded-lg text-sm font-bold hover:bg-[#112b6b] disabled:opacity-30 transition-colors"
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
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600"
              >
                <Trophy size={48} />
              </motion.div>
              
               <div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white">Assessment Complete!</h3>
                <p className="text-gray-500 dark:text-slate-400 mt-2">Here is how you performed</p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 py-6">
                 <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">{score}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">Your Score</div>
                 </div>
                 <div className="text-center">
                    <div className="text-4xl font-bold text-gray-300 dark:text-slate-600">/</div>
                 </div>
                 <div className="text-center">
                    <div className="text-4xl font-bold text-slate-900 dark:text-white">{shuffledQuestions.reduce((acc, q) => acc + (q.points || 1), 0)}</div>
                    <div className="text-xs text-gray-500 dark:text-slate-400 uppercase tracking-wider">Total Points</div>
                 </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => {
                        setCurrentQuestionIndex(0);
                        setStep('review');
                    }}
                    className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-[#002A5C] border-2 border-[#1a3884] text-[#1a3884] rounded-xl font-bold shadow-sm transition-all hover:bg-[#1a3884]/5"
                  >
                    Review Responses
                  </button>
                  <button
                    onClick={() => onComplete(score)}
                    className="w-full sm:w-auto px-8 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold shadow-lg shadow-[#1a3884]/30 transition-all"
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

