import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  CheckCircle2,
  Lightbulb,
  Target,
  Trophy,
  XCircle,
} from "@/components/icons";
import { toast } from 'sonner';

const AdvancedPractice = ({ content, questions, onComplete, isCompleted, storageKey, savedScore, savedTotalPoints }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {};
  });
  const [showExplanation, setShowExplanation] = useState({});
  const [allAnswered, setAllAnswered] = useState(false);
  const [showResults, setShowResults] = useState(isCompleted || false);

  useEffect(() => {
    if (isCompleted) {
      setShowResults(true);
    }
  }, [isCompleted]);

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (questions?.length - 1);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    const updated = { ...selectedAnswers, [questionIndex]: answerIndex };
    setSelectedAnswers(updated);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    }
    setShowExplanation(prev => ({ ...prev, [questionIndex]: true }));
  };

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const answeredCount = Object.keys(selectedAnswers).length;
      if (answeredCount === questions.length) {
        setAllAnswered(true);
        const score = Object.keys(selectedAnswers).reduce((acc, qIndex) => {
          const q = questions[qIndex];
          if (q && q.correctAnswer !== undefined) {
            const selIdx = selectedAnswers[qIndex];
            const selOptionText = q.options?.[selIdx];
            const isCorrect = 
              selIdx === q.correctAnswer || 
              String(selIdx) === String(q.correctAnswer) ||
              (selOptionText !== undefined && String(selOptionText) === String(q.correctAnswer));
            return acc + (isCorrect ? 1 : 0);
          }
          return acc + 1;
        }, 0);
        if (onComplete) onComplete(score, questions.length);
        setShowResults(true);
        toast.success('Advanced practice completed!');
      } else {
        toast.error('Please answer all questions before completing.');
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const getAnsweredCount = () => Object.keys(selectedAnswers).length;
  const progress = (getAnsweredCount() / questions?.length) * 100;


  if (showResults) {
    const totalQuestions = questions.length;
    let score = 0;
    if (typeof savedScore === 'number' && typeof savedTotalPoints === 'number' && Object.keys(selectedAnswers).length === 0) {
      if (savedTotalPoints === totalQuestions) {
        score = savedScore;
      } else {
        score = savedTotalPoints > 0 ? Math.min(totalQuestions, Math.round((savedScore / savedTotalPoints) * totalQuestions)) : 0;
        if (savedScore > 0 && score === 0 && totalQuestions > 0) {
          score = 1;
        }
      }
    } else {
      score = Object.keys(selectedAnswers).reduce((acc, qIndex) => {
        const q = questions[qIndex];
        if (q && q.correctAnswer !== undefined) {
          const selIdx = selectedAnswers[qIndex];
          const selOptionText = q.options?.[selIdx];
          const isCorrect = 
            selIdx === q.correctAnswer || 
            String(selIdx) === String(q.correctAnswer) ||
            (selOptionText !== undefined && String(selOptionText) === String(q.correctAnswer));
          return acc + (isCorrect ? 1 : 0);
        }
        return acc + 1;
      }, 0);
    }

    return (
      <div className="w-full h-full bg-white dark:bg-[#0d3a5f] p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6 text-center py-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-6 animate-bounce">
            <Trophy size={40} />
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-[#072036] dark:text-white">Advanced Practice Complete!</h3>
          <p className="text-slate-500 dark:text-slate-400">Here is your performance summary</p>
          
          <div className="flex justify-center items-center gap-4 py-4 text-2xl font-bold">
            <span className="text-[#072036] dark:text-white">{score}</span>
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 dark:text-slate-400">{totalQuestions}</span>
          </div>

          <div className="text-left space-y-6 pt-6 border-t border-[#d7ebf5] dark:border-white/10">
            <h4 className="text-lg font-bold text-[#072036] dark:text-slate-200">Review Responses</h4>
            {questions.map((q, qIndex) => {
              const selectedIdx = selectedAnswers[qIndex];
              
              if (q.type === 'reflection') {
                return (
                  <div key={qIndex} className="p-4 bg-[#F1F5F9]/60 dark:bg-white/5 rounded-xl border border-[#d7ebf5] dark:border-white/5 space-y-3">
                    <p className="font-semibold text-[#072036] dark:text-white">{qIndex + 1}. {q.scenario || q.question}</p>
                    <div className="p-3 bg-white dark:bg-[#0d3a5f] rounded-lg border border-[#d7ebf5] dark:border-white/5">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Your Reflection</p>
                      <p className="text-sm text-slate-800 dark:text-slate-200 italic">
                        {selectedIdx || "No response provided"}
                      </p>
                    </div>
                    {q.explanation && (
                      <div className="text-xs text-[#045C9A] dark:text-[#A6D7E8] bg-[#EAF7FD]/50 dark:bg-[#045C9A]/15 p-3 rounded-lg">
                        <strong>Explanation/Ideal Response:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              }

              // scenario-mcq
              const correctIdx = q.correctAnswer;
              return (
                <div key={qIndex} className="p-4 bg-[#F1F5F9]/60 dark:bg-white/5 rounded-xl border border-[#d7ebf5] dark:border-white/5 space-y-3">
                  <p className="font-semibold text-[#072036] dark:text-white">{qIndex + 1}. {q.scenario || q.question}</p>
                  <div className="space-y-2">
                    {q.options && q.options.map((option, idx) => {
                      const isUserChoice = selectedIdx === idx;
                      const isCorrect = idx === correctIdx || String(idx) === String(correctIdx) || String(option) === String(correctIdx);
                      
                      let optionClass = "p-3 rounded-lg border text-sm flex items-center justify-between ";
                      if (isCorrect) {
                        optionClass += "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400";
                      } else if (isUserChoice) {
                        optionClass += "border-red-500 bg-red-50/50 dark:bg-red-500/10 text-red-800 dark:text-red-400";
                      } else {
                        optionClass += "border-[#d7ebf5] dark:border-white/5 text-slate-600 dark:text-slate-400";
                      }

                      return (
                        <div key={idx} className={optionClass}>
                          <span>{String.fromCharCode(65 + idx)}. {option}</span>
                          <div className="flex items-center gap-2 text-xs">
                            {isUserChoice && <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-[#d7ebf5]/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">Your answer</span>}
                            {isCorrect && <CheckCircle2 size={16} className="text-emerald-500" />}
                            {isUserChoice && !isCorrect && <XCircle size={16} className="text-red-500" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className="text-xs text-[#045C9A] dark:text-[#A6D7E8] bg-[#EAF7FD]/50 dark:bg-[#045C9A]/15 p-3 rounded-lg">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (onComplete) onComplete(score, totalQuestions);
              toast.success('Advanced Practice completed!');
            }}
            className="mt-6 w-full sm:w-auto rounded-xl px-6 py-3 text-[13px] font-semibold bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
          >
            Continue to Next Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-[#0d3a5f] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#d7ebf5] dark:border-white/10 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <Target size={14} className="text-[#045C9A] dark:text-[#A6D7E8]" />
              <span>Advanced Practice</span>
            </div>
            <span className="text-xs font-extrabold text-[#045C9A] dark:text-[#A6D7E8]">
              {getAnsweredCount()}/{questions?.length} Questions
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#072036] dark:text-white mb-3">
            {content}
          </h2>
          <div className="h-2 bg-[#d7ebf5] dark:bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#045C9A] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-[#F1F5F9] dark:bg-[#0d3a5f] rounded-2xl p-6 md:p-8 border border-[#d7ebf5] dark:border-white/10"
          >
            <div className="mb-6">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-400 mb-1.5 block uppercase tracking-widest">
                {currentQuestion.type === 'scenario-mcq' ? 'Scenario Analysis' : 'Reflection'} - Question {currentQuestionIndex + 1} of {questions?.length}
              </span>
              <h3 className="text-lg md:text-xl font-bold text-[#072036] dark:text-white mb-4 leading-snug md:leading-relaxed">
                {currentQuestion.scenario || currentQuestion.question}
              </h3>
            </div>

            {/* Options for scenario MCQ */}
            {currentQuestion.options && (
              <div className="space-y-3.5 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  const isCorrectAnswer = 
                    idx === currentQuestion.correctAnswer || 
                    String(idx) === String(currentQuestion.correctAnswer) ||
                    String(option) === String(currentQuestion.correctAnswer);
                  const showResult = showExplanation[currentQuestionIndex];

                  return (
                    <button
                      key={idx}
                      onClick={() => !showResult && handleAnswerSelect(currentQuestionIndex, idx)}
                      disabled={showResult}
                      className={`w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all duration-300 font-medium ${
                        showResult
                          ? isCorrectAnswer
                            ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-500/10'
                            : isSelected && !isCorrectAnswer
                            ? 'border-red-500 bg-red-50/10 dark:bg-red-900/20'
                            : 'border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#0d3a5f] opacity-50'
                          : isSelected
                          ? 'border-[#045C9A] bg-[#045C9A]/5'
                          : 'border-[#d7ebf5] dark:border-white/10 bg-white dark:bg-[#0d3a5f] hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          showResult
                            ? isCorrectAnswer
                              ? 'border-emerald-500 bg-emerald-500'
                              : isSelected && !isCorrectAnswer
                              ? 'border-red-500 bg-red-500'
                              : 'border-[#d7ebf5] dark:border-white/10'
                            : isSelected
                            ? 'border-[#045C9A] bg-[#045C9A]'
                            : 'border-[#d7ebf5] dark:border-white/10'
                        }`}>
                          {showResult ? (
                            isCorrectAnswer || (isSelected && !isCorrectAnswer) ? (
                              isCorrectAnswer ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                              ) : (
                                <XCircle className="w-4.5 h-4.5 text-white" />
                              )
                            ) : null
                          ) : (
                            <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm md:text-base font-semibold ${
                          showResult
                            ? isCorrectAnswer
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : isSelected && !isCorrectAnswer
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-slate-600 dark:text-slate-400'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reflection question */}
            {currentQuestion.type === 'reflection' && (
              <div className="mb-6">
                <textarea
                  placeholder="Share your reflection..."
                  className="w-full p-5 rounded-2xl border-2 border-[#d7ebf5] dark:border-white/10 bg-white dark:bg-[#0d3a5f] text-[#072036] dark:text-white focus:border-[#045C9A] focus:outline-none min-h-[140px] transition-all font-medium text-sm md:text-base"
                  onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                  disabled={showExplanation[currentQuestionIndex]}
                />
              </div>
            )}

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation[currentQuestionIndex] && currentQuestion.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#EAF7FD]/80 dark:bg-[#045C9A]/10 border border-[#d7ebf5]/50 dark:border-[#045C9A]/30 rounded-2xl p-5 mb-6"
                >
                  <div className="flex items-start gap-2.5">
                    <Lightbulb className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8] mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-[#045C9A] dark:text-[#A6D7E8] font-medium leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-[#d7ebf5] dark:border-white/10">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-[#EAF7FD] dark:hover:bg-[#0d3a5f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!showExplanation[currentQuestionIndex]}
                className="rounded-xl px-6 py-3 text-[13px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
              >
                {isLastQuestion ? (allAnswered ? 'Completed' : 'Complete') : 'Next'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPractice;
