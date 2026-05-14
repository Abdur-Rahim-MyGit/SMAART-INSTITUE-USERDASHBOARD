import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, FileText, Upload, ChevronRight, Download, Award, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const SubmissionTask = ({ content, onComplete, isCompleted, initialResult }) => {
  const [selectedScenario, setSelectedScenario] = useState(content?.scenarios?.[0]?.id || null);
  const [viewMode, setViewMode] = useState('task'); // 'task' or 'review'
  const [answers, setAnswers] = useState(initialResult?.responses?.answers || {});
  const [completedScenarios, setCompletedScenarios] = useState(
    initialResult?.responses?.completedScenarios || 
    (isCompleted ? Object.fromEntries(content?.scenarios?.map(s => [s.id, true]) || []) : {})
  );

  // Sync state with initialResult when it changes (e.g. after fetch)
  useEffect(() => {
    if (initialResult?.responses?.answers) {
      setAnswers(prev => ({ ...prev, ...initialResult.responses.answers }));
    }
    if (initialResult?.responses?.completedScenarios) {
      setCompletedScenarios(prev => ({ ...prev, ...initialResult.responses.completedScenarios }));
    } else if (isCompleted && Object.keys(completedScenarios).length === 0) {
      setCompletedScenarios(Object.fromEntries(content?.scenarios?.map(s => [s.id, true]) || []));
    }
  }, [initialResult, isCompleted, content]);

  const currentScenario = content?.scenarios?.find(s => s.id === selectedScenario);
  const showResults = completedScenarios[selectedScenario];

  // Auto-switch to review mode if scenario is already completed
  useEffect(() => {
    if (showResults) {
      setViewMode('review');
    } else {
      setViewMode('task');
    }
  }, [selectedScenario, showResults]);

  const handleOptionSelect = (sectionId, option) => {
    const section = currentScenario?.sections?.find(s => s.id === sectionId || s.type === sectionId);
    if (!section) return;

    const key = `${selectedScenario}-${sectionId}`;
    
    if (section.selectionType === 'multi') {
      const current = answers[key] || [];
      
      const maxSelectMatch = section.question?.match(/Select (\d+)/i);
      const maxSelections = maxSelectMatch ? parseInt(maxSelectMatch[1]) : Infinity;
      
      if (current.includes(option)) {
        const newAnswers = current.filter(o => o !== option);
        setAnswers({ ...answers, [key]: newAnswers });
      } 
      else if (current.length < maxSelections) {
        const newAnswers = [...current, option];
        setAnswers({ ...answers, [key]: newAnswers });
      }
      else {
        toast.warning(`You can only select ${maxSelections} option${maxSelections > 1 ? 's' : ''} for this question.`);
      }
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

    const updatedCompletedScenarios = { ...completedScenarios, [selectedScenario]: true };
    setCompletedScenarios(updatedCompletedScenarios);
    toast.success(`Scenario completed! NVQ Evidence Record generated.`);
    setViewMode('review');
    
    const allScenariosComplete = content?.scenarios?.every(s => 
      s.id === selectedScenario ? true : updatedCompletedScenarios[s.id]
    );
    
    if (onComplete) {
      onComplete(totalScore, maxScore, {
        completedScenarios: updatedCompletedScenarios,
        answers: answers,
        allScenariosComplete: allScenariosComplete
      });
    }
  };

  const isAnswerCorrect = (sectionId, option) => {
    const section = currentScenario?.sections?.find(s => s.id === sectionId || s.type === sectionId);
    return section?.correctAnswers?.includes(option);
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-950 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#0891b2] dark:text-blue-300 uppercase tracking-wider">
              <Award size={18} />
              <span>Vocational Competence Assessment</span>
            </div>
            {showResults && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('task')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    viewMode === 'task' 
                      ? 'bg-[#0891b2] text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Task View
                </button>
                <button
                  onClick={() => setViewMode('review')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    viewMode === 'review' 
                      ? 'bg-[#0891b2] text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  NVQ Record
                </button>
              </div>
            )}
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
            {content?.title || 'Evidence Submission'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed">
            {content?.instructions}
          </p>
        </div>

        {/* Scenario Selector */}
        <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-xl w-fit">
          {content?.scenarios?.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                selectedScenario === scenario.id
                  ? 'bg-white dark:bg-slate-700 text-[#0891b2] dark:text-blue-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {completedScenarios[scenario.id] && <CheckCircle2 size={14} className="text-green-500" />}
              {scenario.title}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {currentScenario && viewMode === 'task' ? (
            <motion.div
              key={`${selectedScenario}-task`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Scenario Description */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border-l-4 border-l-[#0891b2] dark:border-l-[#1a3884]">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileText className="text-[#0891b2] dark:text-blue-300" size={20} />
                  Operational Scenario
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">
                  "{currentScenario.scenario}"
                </p>
              </div>

              {/* Sections */}
              {currentScenario.sections?.map((section, idx) => {
                const key = `${selectedScenario}-${section.id || section.type}`;
                const userAnswers = answers[key] || [];
                const maxSelectMatch = section.question?.match(/Select (\d+)/i);
                const maxSelections = maxSelectMatch ? parseInt(maxSelectMatch[1]) : null;

                return (
                  <div key={idx} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        {section.question || section.title}
                      </h4>
                      {section.selectionType === 'multi' && maxSelections && (
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                          userAnswers.length === maxSelections 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {userAnswers.length} / {maxSelections} Selected
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {section.options?.map((option, optIdx) => {
                        const isSelected = userAnswers.includes(option);
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleOptionSelect(section.id || section.type, option)}
                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'border-[#0891b2] bg-[#0891b2]/5 text-[#0891b2]'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-medium group-hover:translate-x-1 transition-transform">{option}</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected ? 'bg-[#0891b2] border-[#0891b2]' : 'border-slate-200'
                            }`}>
                              {isSelected && <CheckCircle2 size={12} className="text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-[#0891b2] dark:bg-[#1a3884] hover:bg-[#0a7a8f] dark:hover:bg-[#2a7d88] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0891b2]/20 transition-all flex items-center justify-center gap-2 group"
              >
                Submit Evidence for Scenario
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : viewMode === 'review' ? (
            <motion.div
              key={`${selectedScenario}-review`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border-t-8 border-t-[#0891b2] dark:border-t-[#1a3884] relative overflow-hidden"
            >
              {/* NVQ Watermark/Background Decoration */}
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 bg-[#0891b2] rounded-full translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-12 opacity-[0.03] -rotate-12 bg-[#0891b2] rounded-full -translate-x-1/2 translate-y-1/2 w-64 h-64 pointer-events-none" />

              <div className="relative z-10 space-y-8">
                {/* Record Header */}
                <div className="text-center space-y-2 border-b-2 border-slate-100 dark:border-slate-800 pb-6">
                  <div className="inline-flex items-center gap-2 text-[#0891b2] font-black uppercase tracking-[0.2em] text-sm mb-2">
                    < Award size={24} />
                    Official Evidence Record
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic">
                    {currentScenario.title}
                  </h3>
                  <p className="text-slate-500 font-medium">Record ID: NVQ-{selectedScenario?.toUpperCase()}-{new Date().getFullYear()}</p>
                </div>

                {/* Evidence Content */}
                <div className="space-y-8">
                  {currentScenario.sections?.map((section, idx) => {
                    const key = `${selectedScenario}-${section.id || section.type}`;
                    const userAnswers = answers[key] || [];
                    
                    return (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0891b2] text-white flex items-center justify-center font-bold">
                            {idx + 1}
                          </div>
                          <h4 className="font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                            Evidence Statement: {section.question || section.title}
                          </h4>
                        </div>
                        
                        <div className="ml-11 border-l-2 border-[#0891b2]/30 pl-6 py-2 space-y-4">
                           <p className="text-slate-500 dark:text-slate-400 text-sm italic">
                             "I have demonstrated competence by identifying/implementing the following actions:"
                           </p>
                           <div className="grid grid-cols-1 gap-2">
                             {userAnswers.map((ans, aIdx) => {
                               const isCorrect = isAnswerCorrect(section.id || section.type, ans);
                               return (
                                 <div key={aIdx} className={`p-4 rounded-xl border flex items-center justify-between ${
                                   isCorrect 
                                     ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200' 
                                     : 'bg-red-50/50 dark:bg-red-900/10 border-red-200'
                                 }`}>
                                   <div className="flex items-center gap-3">
                                      {isCorrect ? <UserCheck className="text-green-600" size={18} /> : <span className="text-red-500 font-black">!</span>}
                                      <span className="font-bold text-slate-800 dark:text-slate-200">{ans}</span>
                                   </div>
                                   <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                     isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                   }`}>
                                     {isCorrect ? 'Validated' : 'Requires Review'}
                                   </span>
                                 </div>
                               );
                             })}
                             {userAnswers.length === 0 && (
                               <p className="text-red-500 italic text-sm">No evidence provided for this requirement.</p>
                             )}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Record Footer / Sign-off */}
                <div className="pt-8 border-t-2 border-slate-100 dark:border-slate-800">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-200">
                         <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Learner Confirmation</p>
                         <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                           "I confirm that the evidence presented above is a true and accurate reflection of my actions and decisions in this scenario."
                         </p>
                         <div className="pt-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <div>
                               <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Learner ID Verified</p>
                               <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Digitally Signed: {new Date().toLocaleDateString()}</p>
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex flex-col justify-between py-2">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-slate-500 uppercase">Assessment Status:</span>
                            <span className="px-4 py-1 bg-green-500 text-white rounded-full text-xs font-black uppercase tracking-[0.2em] animate-pulse">
                              Achieved
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SubmissionTask;

