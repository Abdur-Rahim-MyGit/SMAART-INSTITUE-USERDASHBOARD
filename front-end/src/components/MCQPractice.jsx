import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const MCQPractice = ({ content, questions, onComplete, isCompleted }) => {
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
      // Check if all questions are answered
      const answeredCount = Object.keys(selectedAnswers).length;
      if (answeredCount === questions.length) {
        setAllAnswered(true);
        if (onComplete) onComplete();
        toast.success('Practice completed!');
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

  const isCorrect = (questionIndex) => {
    const selected = selectedAnswers[questionIndex];
    return selected === currentQuestion?.correctAnswer;
  };

  const getAnsweredCount = () => Object.keys(selectedAnswers).length;
  const progress = (getAnsweredCount() / questions?.length) * 100;


  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Lightbulb size={16} />
              <span>Practice Exercise</span>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {getAnsweredCount()}/{questions?.length} Questions
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {content}
          </h2>
          {/* Progress Bar */}
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
            className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
          >
            <div className="mb-6">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 block">
                Question {currentQuestionIndex + 1} of {questions?.length}
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentQuestion.question || currentQuestion.scenario}
              </h3>
            </div>

            {/* Options */}
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
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 opacity-50'
                          : isSelected
                          ? 'border-[#1a3884] bg-[#1a3884]/5'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          showResult
                            ? isCorrectAnswer
                              ? 'border-green-500 bg-green-500'
                              : isSelected && !isCorrectAnswer
                              ? 'border-red-500 bg-red-500'
                              : 'border-slate-300 dark:border-slate-600'
                            : isSelected
                            ? 'border-[#1a3884] bg-[#1a3884]'
                            : 'border-slate-300 dark:border-slate-600'
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

            {/* Fill in blank */}
            {currentQuestion.type === 'fill-blank' && (
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  className="w-full p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-[#1a3884] focus:outline-none"
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
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={!showExplanation[currentQuestionIndex]}
                className="px-6 py-2 bg-[#1a3884] hover:bg-[#002147] text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default MCQPractice;
