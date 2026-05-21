import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, BookOpen, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

const CaseStudy = ({ content, mcq, onComplete, isCompleted }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [completed, setCompleted] = useState(isCompleted || false);

  const handleAnswerSelect = (answerIndex) => {
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
  };

  const handleComplete = () => {
    if (selectedAnswer !== null) {
      setCompleted(true);
      if (onComplete) onComplete();
      toast.success('Case study completed!');
    } else {
      toast.error('Please answer the question before completing.');
    }
  };

  const isCorrect = selectedAnswer === mcq?.correctAnswer;


  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <BookOpen size={16} />
            <span>Case Study</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Real-World Problem Analysis
          </h2>
        </div>

        {/* Case Study Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-white/5 shadow-2xl shadow-blue-500/5"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {content}
            </p>
          </div>
        </motion.div>

        {/* MCQ Section */}
        {mcq && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-[#002A5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10"
          >
            <div className="mb-6">
              <span className="text-xs font-black text-[#1a3884] dark:text-blue-400 mb-2 block uppercase tracking-widest">
                Analysis Question
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {mcq.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {mcq.options.map((option, idx) => {
                const isSelected = selectedAnswer === idx;
                const isCorrectAnswer = idx === mcq.correctAnswer;

                return (
                  <button
                    key={idx}
                    onClick={() => !showExplanation && handleAnswerSelect(idx)}
                    disabled={showExplanation}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      showExplanation
                        ? isCorrectAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : isSelected && !isCorrectAnswer
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-slate-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#002A5C] opacity-50'
                        : isSelected
                        ? 'border-[#1a3884] bg-blue-50 dark:bg-[#1a3884]/20'
                        : 'border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:border-[#1a3884]/50 dark:hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        showExplanation
                          ? isCorrectAnswer
                            ? 'border-green-500 bg-green-500'
                            : isSelected && !isCorrectAnswer
                            ? 'border-red-500 bg-red-500'
                            : 'border-slate-300 dark:border-slate-600'
                          : isSelected
                          ? 'border-[#1a3884] bg-[#1a3884]'
                          : 'border-slate-300 dark:border-white/10'
                      }`}>
                        {showExplanation ? (
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
                        showExplanation
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

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && mcq.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-[#1a3884] dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#1a3884] dark:text-blue-200 font-medium leading-relaxed">
                      {mcq.explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Complete Button */}
            <button
              onClick={handleComplete}
              disabled={!showExplanation}
              className="w-full px-6 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {completed ? 'Analysis Completed' : 'Complete Case Study'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CaseStudy;
