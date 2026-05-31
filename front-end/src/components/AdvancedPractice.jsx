import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, Target } from 'lucide-react';
import { toast } from 'sonner';

const AdvancedPractice = ({ content, questions, onComplete, isCompleted }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const [allAnswered, setAllAnswered] = useState(false);

  const currentQuestion = questions?.[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === (questions?.length - 1);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({ ...prev, [questionIndex]: answerIndex }));
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
            return acc + (selectedAnswers[qIndex] === q.correctAnswer ? 1 : 0);
          }
          return acc + 1;
        }, 0);
        if (onComplete) onComplete(score, questions.length);
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


  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Target size={16} />
              <span>Advanced Practice</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {getAnsweredCount()}/{questions?.length} Questions
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {content}
          </h2>
          <div className="h-2 bg-slate-200 dark:bg-[#003170] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#1a3884] rounded-full"
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
            className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-2xl shadow-blue-500/5"
          >
            <div className="mb-6">
              <span className="text-xs font-black text-[#1a3884] dark:text-blue-400 mb-2 block uppercase tracking-widest">
                {currentQuestion.type === 'scenario-mcq' ? 'Scenario Analysis' : 'Reflection'} - Question {currentQuestionIndex + 1} of {questions?.length}
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {currentQuestion.scenario || currentQuestion.question}
              </h3>
            </div>

            {/* Options for scenario MCQ */}
            {currentQuestion.options && (
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedAnswers[currentQuestionIndex] === idx;
                  const isCorrectAnswer = idx === currentQuestion.correctAnswer;
                  const showResult = showExplanation[currentQuestionIndex];

                  return (
                    <button
                      key={idx}
                      onClick={() => !showResult && handleAnswerSelect(currentQuestionIndex, idx)}
                      disabled={showResult}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        showResult
                          ? isCorrectAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : isSelected && !isCorrectAnswer
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-slate-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-slate-900/20 opacity-50'
                          : isSelected
                          ? 'border-[#1a3884] bg-blue-50 dark:bg-[#1a3884]/20'
                          : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:border-[#1a3884]/50 dark:hover:border-blue-500/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          showResult
                            ? isCorrectAnswer
                              ? 'border-green-500 bg-green-500'
                              : isSelected && !isCorrectAnswer
                              ? 'border-red-500 bg-red-500'
                              : 'border-slate-300 dark:border-white/10'
                            : isSelected
                            ? 'border-[#1a3884] bg-[#1a3884]'
                            : 'border-slate-300 dark:border-white/10'
                        }`}>
                          {showResult ? (
                            isCorrectAnswer || (isSelected && !isCorrectAnswer) ? (
                              isCorrectAnswer ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                              ) : (
                                <XCircle className="w-4 h-4 text-white" />
                              )
                            ) : null
                          ) : (
                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                              {String.fromCharCode(65 + idx)}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm ${
                          showResult
                            ? isCorrectAnswer
                              ? 'text-green-700 dark:text-green-300 font-semibold'
                              : isSelected && !isCorrectAnswer
                              ? 'text-red-700 dark:text-red-300'
                              : 'text-slate-600 dark:text-slate-400'
                            : 'text-slate-700 dark:text-slate-300'
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
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-[#1a3884] focus:outline-none min-h-[120px] transition-all"
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
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-[#1a3884] dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1a3884] dark:text-blue-200 font-medium leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-white/10">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!showExplanation[currentQuestionIndex]}
                className="px-6 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
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
