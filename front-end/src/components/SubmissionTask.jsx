import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

const SubmissionTask = ({ content, onComplete, isCompleted }) => {
  const [selectedScenario, setSelectedScenario] = useState(content?.scenarios?.[0]?.id || null);
  const [answers, setAnswers] = useState({});
  const [completedScenarios, setCompletedScenarios] = useState(isCompleted ? 
    Object.fromEntries(content?.scenarios?.map(s => [s.id, true]) || []) : {}
  );

  const currentScenario = content?.scenarios?.find(s => s.id === selectedScenario);
  const showResults = completedScenarios[selectedScenario];

  const handleOptionSelect = (sectionId, option) => {
    const section = currentScenario?.sections?.find(s => s.id === sectionId || s.type === sectionId);
    if (!section) return;

    const key = `${selectedScenario}-${sectionId}`;
    
    if (section.selectionType === 'multi') {
      const current = answers[key] || [];
      const newAnswers = current.includes(option)
        ? current.filter(o => o !== option)
        : [...current, option];
      setAnswers({ ...answers, [key]: newAnswers });
    } else {
      setAnswers({ ...answers, [key]: [option] });
    }
  };

  const handleSubmit = () => {
    let totalScore = 0;
    let maxScore = 0;

    currentScenario?.sections?.forEach(section => {
      const key = `${selectedScenario}-${section.id || section.type}`;
      const userAnswers = answers[key] || [];
      const correctAnswers = section.correctAnswers || [];
      
      maxScore += section.points || 0;
      
      if (section.selectionType === 'multi') {
        const correctCount = userAnswers.filter(a => correctAnswers.includes(a)).length;
        const incorrectCount = userAnswers.filter(a => !correctAnswers.includes(a)).length;
        const score = Math.max(0, correctCount - incorrectCount);
        totalScore += (score / correctAnswers.length) * (section.points || 0);
      } else {
        if (correctAnswers.includes(userAnswers[0])) {
          totalScore += section.points || 0;
        }
      }
    });

    setCompletedScenarios(prev => ({ ...prev, [selectedScenario]: true }));
    toast.success(`Scenario completed! Score: ${Math.round(totalScore)}/${maxScore}`);
    
    // Mark the whole task as complete if all scenarios are done
    const allDone = content?.scenarios?.every(s => 
      s.id === selectedScenario ? true : completedScenarios[s.id]
    );

    if (allDone && onComplete) {
      onComplete(totalScore, maxScore);
    }
  };

  const isAnswerCorrect = (sectionId, option) => {
    const section = currentScenario?.sections?.find(s => s.id === sectionId || s.type === sectionId);
    return section?.correctAnswers?.includes(option);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <FileText size={16} />
            <span>Evidence Task</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            CLEAR-5 Framework Application
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {content?.instructions}
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {content?.scenarios?.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedScenario === scenario.id
                  ? 'bg-[#0891b2] dark:bg-[#30919D] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {scenario.title}
            </button>
          ))}
        </div>

        {/* Scenario Content */}
        {currentScenario && (
          <div className="space-y-6">
            {/* Scenario Description */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Scenario:</h3>
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-300">{currentScenario.scenario}</p>
            </div>

            {/* Sections */}
            {currentScenario.sections?.map((section, idx) => {
              const key = `${selectedScenario}-${section.id || section.type}`;
              const userAnswers = answers[key] || [];

              return (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {section.question || section.title}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {section.points} points
                    </span>
                  </div>

                  <div className="space-y-2">
                    {section.options?.map((option, optIdx) => {
                      const isSelected = userAnswers.includes(option);
                      const isCorrect = isAnswerCorrect(section.id || section.type, option);
                      
                      return (
                        <div key={optIdx} className="relative">
                          <button
                            onClick={() => !showResults && handleOptionSelect(section.id || section.type, option)}
                            disabled={showResults}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              showResults
                                ? isSelected && isCorrect
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20' // Selected & Correct
                                  : isSelected && !isCorrect
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20' // Selected & Incorrect
                                  : isCorrect
                                  ? 'border-green-500/30 border-dashed bg-transparent' // Missed correct answer
                                  : 'border-slate-200 dark:border-slate-700'
                                : isSelected
                                ? 'border-[#0891b2] dark:border-[#30919D] bg-[#0891b2]/10 dark:bg-[#30919D]/10'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-slate-700 dark:text-slate-300 ${showResults && isCorrect && !isSelected ? 'opacity-50' : ''}`}>
                                {option}
                              </span>
                              {showResults && isCorrect && isSelected && (
                                <CheckCircle2 size={18} className="text-green-600" />
                              )}
                              {showResults && !isCorrect && isSelected && (
                                <span className="text-red-500 font-bold text-lg">×</span>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Submit Button */}
            {!showResults && (
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-[#0891b2] dark:bg-[#30919D] hover:bg-[#0a7a8f] dark:hover:bg-[#2a7d88] text-white font-bold rounded-lg transition-all"
              >
                Submit Scenario
              </button>
            )}

            {showResults && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <CheckCircle2 size={32} className="text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-900 dark:text-green-100">
                  Scenario Completed!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Review your answers above
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionTask;
