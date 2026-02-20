import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

const ReflectionTask = ({ content, onComplete, isCompleted, initialResult }) => {
  const [answers, setAnswers] = useState(initialResult?.responses || {});
  const [submitted, setSubmitted] = useState(isCompleted || false);

  // Sync with initialResult if it loads late
  useEffect(() => {
    if (initialResult?.responses && Object.keys(answers).length === 0) {
      setAnswers(initialResult.responses);
    }
  }, [initialResult]);

  const handleSubmit = () => {
    if (Object.keys(answers).length < (content?.questions?.length || 0)) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    // Calculate score for NVQ tracking
    let calculatedScore = 0;
    let totalPossible = 0;

    content.questions.forEach(q => {
      if (q.type === 'choice') {
        totalPossible += 10;
        const selectedOption = q.options.find(opt => opt.text === answers[q.id]);
        if (selectedOption?.correct) {
          calculatedScore += 10;
        }
      } else if (q.type === 'scale') {
        totalPossible += 5;
        if (answers[q.id]) {
          calculatedScore += 5; // Completing a scale is 5 points
        }
      } else if (q.type === 'text') {
        totalPossible += 5;
        if (answers[q.id] && answers[q.id].trim().length > 10) {
          calculatedScore += 5; // Meaningful text is 5 points
        }
      }
    });

    setSubmitted(true);
    onComplete({
      answers,
      score: calculatedScore,
      totalPoints: totalPossible
    });
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <MessageSquare size={16} />
            <span>Reflection Task</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {content?.title || 'Reflection'}
          </h2>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
            {content?.instructions}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-12 pb-12">
          {content?.questions?.map((question, idx) => (
            <div key={question.id} className="space-y-4">
              <label className="block">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {idx + 1}. {question.question}
                  </span>
                  {question.required && (
                    <span className="text-red-500 text-sm">*</span>
                  )}
                </div>

                {question.type === 'scale' ? (
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = answers[question.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => !submitted && setAnswers({ ...answers, [question.id]: val })}
                          className={`flex-1 h-12 rounded-lg border-2 transition-all font-bold flex items-center justify-center ${
                            isSelected
                              ? 'border-[#0891b2] dark:border-[#1a3884] bg-[#0891b2] text-white shadow-lg scale-105'
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                          } ${submitted ? 'cursor-default' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                ) : question.type === 'choice' ? (
                  <div className="space-y-2">
                    {question.options?.map((option, optIdx) => {
                      const isSelected = answers[question.id] === option.text;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => !submitted && setAnswers({ ...answers, [question.id]: option.text })}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                            isSelected
                              ? 'border-[#0891b2] dark:border-[#1a3884] bg-[#0891b2]/10 dark:bg-[#1a3884]/10'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                          } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span className={`${isSelected ? 'font-medium' : ''} text-slate-700 dark:text-slate-300`}>
                            {option.text}
                          </span>
                          {isSelected && (
                            <div className="w-4 h-4 rounded-full border-4 border-[#0891b2] dark:border-[#1a3884]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })}
                    disabled={submitted}
                    placeholder="Type your reflection here..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0891b2] dark:focus:border-[#1a3884] focus:outline-none transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                )}
              </label>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        {!submitted && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-[#0891b2] dark:bg-[#1a3884] hover:bg-[#0a7a8f] dark:hover:bg-[#2a7d88] text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Submit Reflection
          </button>
        )}

        {submitted && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <p className="font-bold text-green-900 dark:text-green-100">
              Reflection Submitted!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {content?.trigger?.message || 'Thank you for your thoughtful reflection.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReflectionTask;

