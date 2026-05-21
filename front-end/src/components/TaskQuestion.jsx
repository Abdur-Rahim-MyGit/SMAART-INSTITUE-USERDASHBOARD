import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, AlertCircle, ChevronDown } from 'lucide-react';

const TaskQuestion = ({ task, onComplete, isCompleted }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(isCompleted ? task.correctAnswer : null);
  const [showResult, setShowResult] = useState(isCompleted);
  const [isCorrect, setIsCorrect] = useState(isCompleted);
  const [isExpanded, setIsExpanded] = useState(false);

  // Update state if isCompleted prop changes
  useEffect(() => {
    if (isCompleted) {
      setSelectedAnswer(task.correctAnswer);
      setShowResult(true);
      setIsCorrect(true);
    }
  }, [isCompleted, task.correctAnswer]);

  const handleAnswerSelect = (index) => {
    if (showResult) return; // Don't allow changing answer after submission
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === task.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    // Call onComplete callback after a short delay
    setTimeout(() => {
      if (correct) {
        onComplete();
      }
    }, 1500);
  };

  const handleRetry = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  // Render different question types
  const renderQuestion = () => {
    switch (task.type) {
      case 'mcq':
      case 'true_false':
        return (
          <div className="space-y-4">
            <div className="space-y-3">
              {task.options && task.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === task.correctAnswer;
                const showCorrect = showResult && isCorrectAnswer;
                const showIncorrect = showResult && isSelected && !isCorrectAnswer;

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    whileHover={!showResult ? { scale: 1.02, x: 4 } : {}}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    className={`
                      w-full p-3 sm:p-4 rounded-xl border-2 transition-all text-left
                      ${isSelected && !showResult ? 'border-orange-400 bg-orange-50' : 'border-gray-200'}
                      ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${showIncorrect ? 'border-red-500 bg-red-50' : ''}
                      ${!showResult && !isSelected ? 'hover:border-orange-300 hover:bg-orange-50/50' : ''}
                      ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Radio/Checkbox indicator */}
                      <div className={`
                        w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                        ${isSelected && !showResult ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}
                        ${showCorrect ? 'border-green-500 bg-green-500' : ''}
                        ${showIncorrect ? 'border-red-500 bg-red-500' : ''}
                      `}>
                        {(isSelected || showCorrect || showIncorrect) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 rounded-full bg-white"
                          />
                        )}
                      </div>

                      {/* Option text */}
                      <span className={`
                        font-medium flex-1 text-xs sm:text-sm md:text-base
                        ${isSelected && !showResult ? 'text-orange-700' : 'text-gray-700'}
                        ${showCorrect ? 'text-green-700' : ''}
                        ${showIncorrect ? 'text-red-700' : ''}
                      `}>
                        {option}
                      </span>

                      {/* Result Icon */}
                      {showCorrect && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                      {showIncorrect && <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      
      case 'short_answer':
        return (
          <div className="space-y-4">
            <textarea
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-0 resize-none h-32"
              placeholder="Type your answer here..."
              disabled={showResult}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Header - Click to Expand */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2 sm:py-3 px-2 sm:px-4 bg-white rounded-lg hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3 text-left flex-1 min-w-0">
          <div className={`
            w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}
          `}>
            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <AlertCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
            <h3 className="font-semibold text-[11px] sm:text-sm md:text-base text-gray-800 line-clamp-1">{task.question}</h3>
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[9px] sm:text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-1.5 py-0.5 rounded">
                {task.points} Pts
              </span>
              <span className="text-[9px] sm:text-xs text-gray-400 whitespace-nowrap uppercase tracking-wider">
                {task.type === 'mcq' ? 'MCQ' : task.type === 'true_false' ? 'T/F' : 'Short'}
              </span>
            </div>
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-1 sm:ml-2 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-1 sm:p-4 pt-0">
              <div className="p-2 sm:p-6 bg-white rounded-xl border border-gray-100 shadow-sm space-y-3 sm:space-y-6">
                {renderQuestion()}

                {/* Actions */}
                {!showResult && (
                  <div className="flex justify-end">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={selectedAnswer === null}
                      className={`
                        px-6 py-2 rounded-lg font-semibold transition-colors
                        ${selectedAnswer !== null 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20' 
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
                      `}
                    >
                      Submit Answer
                    </motion.button>
                  </div>
                )}

                {/* Result Feedback */}
                <AnimatePresence>
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`
                        p-4 rounded-lg flex items-center gap-3
                        ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
                      `}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                          <div>
                            <p className="font-bold">Correct Answer!</p>
                            <p className="text-sm opacity-90">Well done, you've earned {task.points} points.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-6 h-6 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold">Incorrect</p>
                            <p className="text-sm opacity-90">Don't worry, try again to master this topic.</p>
                          </div>
                          <button
                            onClick={handleRetry}
                            className="px-4 py-1.5 bg-white rounded-md text-sm font-semibold shadow-sm hover:bg-[#F8FAFC] transition-colors"
                          >
                            Try Again
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskQuestion;
