import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, BookOpen, Lightbulb, Upload, FileText, X, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

const CaseStudy = ({ title, content, mcq, questions = [], onComplete, isCompleted }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [essayResponses, setEssayResponses] = useState({});
  const [shortTextResponses, setShortTextResponses] = useState({});
  const [fileUploads, setFileUploads] = useState({}); // Stores fake uploaded file details
  const [uploadingState, setUploadingState] = useState({}); // Stores fake uploading progress/states
  const [showExplanation, setShowExplanation] = useState({});
  const [completed, setCompleted] = useState(isCompleted || false);

  const hasQuestionsList = questions && questions.length > 0;
  const showImmediateFeedback = (questions?.length || 0) + (mcq ? 1 : 0) <= 1;

  // Handle option select for MCQ reflection question type
  const handleMCQSelect = (qIdx, optionVal) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: optionVal }));
    if (showImmediateFeedback) {
      setShowExplanation(prev => ({ ...prev, [qIdx]: true }));
    }
  };

  // Legacy MCQ selection (single MCQ prop)
  const [legacySelected, setLegacySelected] = useState(null);
  const [legacyShowExplanation, setLegacyShowExplanation] = useState(false);

  const handleLegacySelect = (idx) => {
    setLegacySelected(idx);
    if (showImmediateFeedback) {
      setLegacyShowExplanation(true);
    }
  };

  // Mock Upload function for File Upload type questions
  const simulateFileUpload = (qIdx, file) => {
    if (!file) return;
    
    // Set uploading state
    setUploadingState(prev => ({ ...prev, [qIdx]: { progress: 10, isUploading: true } }));
    
    // Simulate upload progress
    let currentProgress = 10;
    const interval = setInterval(() => {
      currentProgress += 30;
      if (currentProgress >= 100) {
        clearInterval(interval);
        setUploadingState(prev => ({ ...prev, [qIdx]: { progress: 100, isUploading: false } }));
        setFileUploads(prev => ({ ...prev, [qIdx]: { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' } }));
        toast.success(`"${file.name}" uploaded to Skills Passport!`);
      } else {
        setUploadingState(prev => ({ ...prev, [qIdx]: { progress: currentProgress, isUploading: true } }));
      }
    }, 400);
  };

  const handleFileDrop = (e, qIdx) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateFileUpload(qIdx, e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e, qIdx) => {
    if (e.target.files && e.target.files[0]) {
      simulateFileUpload(qIdx, e.target.files[0]);
    }
  };

  const clearUploadedFile = (qIdx) => {
    setFileUploads(prev => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
    setUploadingState(prev => {
      const copy = { ...prev };
      delete copy[qIdx];
      return copy;
    });
  };

  const handleComplete = () => {
    if (hasQuestionsList) {
      // Validate that all questions are answered
      const unanswered = [];
      questions.forEach((q, idx) => {
        const qNum = idx + 1;
        if (q.type === 'mcq' && selectedAnswers[idx] === undefined) {
          unanswered.push(`Question ${qNum} (MCQ)`);
        } else if (q.type === 'essay' && (!essayResponses[idx] || essayResponses[idx].trim().length < 5)) {
          unanswered.push(`Question ${qNum} (Essay)`);
        } else if (q.type === 'text' && (!shortTextResponses[idx] || shortTextResponses[idx].trim().length < 2)) {
          unanswered.push(`Question ${qNum} (Short Text)`);
        } else if (q.type === 'file-upload' && !fileUploads[idx]) {
          unanswered.push(`Question ${qNum} (File Upload)`);
        }
      });

      if (unanswered.length > 0) {
        toast.error(`Please answer all questions before submitting: ${unanswered.join(', ')}`);
        return;
      }

      setCompleted(true);
      if (onComplete) onComplete();
      toast.success('Case study reflection completed!');
    } else if (mcq) {
      // Legacy MCQ submit
      if (legacySelected !== null) {
        setCompleted(true);
        if (onComplete) onComplete();
        toast.success('Case study completed!');
      } else {
        toast.error('Please answer the question before completing.');
      }
    } else {
      // No questions at all, just complete
      setCompleted(true);
      if (onComplete) onComplete();
      toast.success('Case study completed!');
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-sm text-[#1a3884] dark:text-blue-400 mb-2 font-bold uppercase tracking-wider">
            <BookOpen size={16} />
            <span>7. Case Study & Reflections</span>
          </div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            {title || "Real-World Problem Analysis"}
          </h2>
        </div>

        {/* Case Narrative */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-sm"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">Case Scenario / Narrative</h4>
            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed text-sm md:text-base font-medium">
              {content}
            </p>
          </div>
        </motion.div>

        {/* Reflection Questions List */}
        {hasQuestionsList ? (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-6 bg-[#1a3884] rounded-full inline-block" />
              Case Study Reflection Questions
            </h3>

            {questions.map((q, idx) => {
              const qNum = idx + 1;
              const isMCQ = q.type === 'mcq';
              const isEssay = q.type === 'essay';
              const isShortText = q.type === 'text';
              const isFileUpload = q.type === 'file-upload';
              const showResult = showExplanation[idx] || completed;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-[#002A5C] rounded-2xl p-5 md:p-6 border border-slate-200 dark:border-white/10 shadow-sm space-y-4"
                >
                  {/* Question Title */}
                  <div className="flex gap-3">
                    <span className="w-7 h-7 bg-blue-100 dark:bg-[#1a3884]/30 text-[#1a3884] dark:text-blue-400 rounded-lg text-sm font-extrabold flex items-center justify-center shrink-0">
                      {qNum}
                    </span>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                        {q.question || q.questionText}
                      </h4>
                      {isEssay && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-2">
                          Essay (Max {q.wordLimit || 200} words)
                        </span>
                      )}
                      {isShortText && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-2">
                          Short Answer
                        </span>
                      )}
                      {isFileUpload && (
                        <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-2">
                          File Upload Required
                        </span>
                      )}
                      {isMCQ && (
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-2">
                          Multiple Choice Question
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 1. Essay Type */}
                  {isEssay && (
                    <div className="space-y-2">
                      <textarea
                        disabled={completed}
                        value={essayResponses[idx] || ''}
                        onChange={(e) => setEssayResponses(prev => ({ ...prev, [idx]: e.target.value }))}
                        rows={4}
                        placeholder="Type your detailed essay response here..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#1a3884] focus:border-transparent transition-all resize-none outline-none disabled:opacity-60"
                      />
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Min. 5 characters required</span>
                        <span className={essayResponses[idx]?.split(/\s+/).filter(Boolean).length > (q.wordLimit || 200) ? "text-red-500 font-bold" : ""}>
                          Word count: {essayResponses[idx] ? essayResponses[idx].trim().split(/\s+/).filter(Boolean).length : 0} / {q.wordLimit || 200}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. Short Text Type */}
                  {isShortText && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        disabled={completed}
                        value={shortTextResponses[idx] || ''}
                        onChange={(e) => setShortTextResponses(prev => ({ ...prev, [idx]: e.target.value }))}
                        placeholder="Type your answer..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-[#1a3884] focus:border-transparent transition-all outline-none disabled:opacity-60"
                      />
                    </div>
                  )}

                  {/* 3. File Upload Type */}
                  {isFileUpload && (
                    <div className="space-y-2">
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => !completed && handleFileDrop(e, idx)}
                        onClick={() => !completed && !fileUploads[idx] && document.getElementById(`file-select-${idx}`).click()}
                        className={`border-2 border-dashed rounded-xl p-6 transition-all flex flex-col items-center justify-center min-h-[120px] cursor-pointer ${
                          fileUploads[idx]
                            ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/10'
                            : 'border-slate-350 dark:border-white/10 hover:border-[#1a3884] dark:hover:border-blue-400/50 bg-slate-50 dark:bg-slate-800/30'
                        }`}
                      >
                        <input
                          id={`file-select-${idx}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileSelect(e, idx)}
                          disabled={completed || !!fileUploads[idx]}
                        />

                        <AnimatePresence mode="wait">
                          {uploadingState[idx]?.isUploading ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center"
                            >
                              <Loader2 className="w-8 h-8 text-[#1a3884] animate-spin mb-2" />
                              <p className="text-xs text-[#1a3884] font-semibold">Uploading to Skills Passport...</p>
                            </motion.div>
                          ) : fileUploads[idx] ? (
                            <motion.div
                              key="uploaded"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center gap-3 w-full max-w-md bg-white dark:bg-[#002A5C] p-3 rounded-lg border border-green-200 dark:border-green-800"
                            >
                              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-850 dark:text-white truncate">
                                  {fileUploads[idx].name}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {fileUploads[idx].size} · Ready to submit
                                </p>
                              </div>
                              {!completed && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearUploadedFile(idx);
                                  }}
                                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                >
                                  <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                                </button>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              key="empty"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center text-center"
                            >
                              <Upload className="w-8 h-8 text-slate-450 dark:text-slate-400 mb-2" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Drag & drop file, or <span className="text-[#1a3884] dark:text-blue-400">browse</span>
                              </p>
                              <p className="text-[10px] text-slate-400 mt-1">
                                Supported formats: PDF, Word, JPG, PNG (Max 5MB)
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* 4. MCQ Type */}
                  {isMCQ && q.options && (
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((option, optIdx) => {
                          const isSelected = selectedAnswers[idx] === option;
                          // If q.correctAnswer is saved as option string
                          const isCorrectVal = option === q.correctAnswer;

                          return (
                            <button
                              key={optIdx}
                              disabled={showResult || completed}
                              onClick={() => handleMCQSelect(idx, option)}
                              className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-xs md:text-sm font-semibold flex items-center justify-between ${
                                showResult
                                  ? isCorrectVal
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                                    : isSelected && !isCorrectVal
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                                    : 'border-slate-200 dark:border-white/5 opacity-55 bg-[#F8FAFC]'
                                  : isSelected
                                  ? 'border-[#1a3884] bg-blue-50 dark:bg-[#1a3884]/20'
                                  : 'border-slate-200 dark:border-white/10 hover:border-[#1a3884]/40 dark:hover:border-blue-400/50 bg-slate-50/50 dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-[10px] ${
                                  showResult
                                    ? isCorrectVal
                                      ? 'border-green-500 bg-green-500 text-white'
                                      : isSelected
                                      ? 'border-red-500 bg-red-500 text-white'
                                      : 'border-slate-350 text-slate-400'
                                    : isSelected
                                    ? 'border-[#1a3884] bg-[#1a3884] text-white'
                                    : 'border-slate-300 dark:border-white/10 text-slate-550'
                                }`}>
                                  {showResult ? (
                                    isCorrectVal || isSelected ? (
                                      isCorrectVal ? '✓' : '✗'
                                    ) : String.fromCharCode(65 + optIdx)
                                  ) : String.fromCharCode(65 + optIdx)}
                                </div>
                                <span>{option}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Question Explanation */}
                      <AnimatePresence>
                        {showResult && q.explanation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl p-3.5 mt-2 flex gap-2"
                          >
                            <Lightbulb className="w-4 h-4 text-[#1a3884] dark:text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-[#1a3884] dark:text-blue-200 font-semibold leading-relaxed">
                              {q.explanation}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                </motion.div>
              );
            })}
          </div>
        ) : mcq ? (
          // Legacy Single MCQ display
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#002A5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10 shadow-sm"
          >
            <div className="mb-6">
              <span className="text-xs font-black text-[#1a3884] dark:text-blue-400 mb-2 block uppercase tracking-widest">
                Analysis Question
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {mcq.question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {mcq.options.map((option, idx) => {
                const isSelected = legacySelected === idx;
                const isCorrectAnswer = typeof mcq.correctAnswer === 'number'
                  ? idx === mcq.correctAnswer
                  : option === mcq.correctAnswer;
                const showResult = legacyShowExplanation || completed;

                return (
                  <button
                    key={idx}
                    disabled={showResult || completed}
                    onClick={() => handleLegacySelect(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between text-sm font-semibold ${
                      showResult
                        ? isCorrectAnswer
                          ? 'border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300'
                          : isSelected && !isCorrectAnswer
                          ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
                          : 'border-slate-200 dark:border-white/5 opacity-55'
                        : isSelected
                        ? 'border-[#1a3884] bg-blue-50 dark:bg-[#1a3884]/20'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/40 hover:border-[#1a3884]/40 dark:hover:border-blue-400/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        showResult
                          ? isCorrectAnswer
                            ? 'border-green-500 bg-green-500 text-white font-bold'
                            : isSelected && !isCorrectAnswer
                            ? 'border-red-500 bg-red-500 text-white font-bold'
                            : 'border-slate-350 text-slate-400'
                          : isSelected
                          ? 'border-[#1a3884] bg-[#1a3884] text-white'
                          : 'border-slate-300 dark:border-white/10 text-slate-550'
                      }`}>
                        {showResult ? (
                          isCorrectAnswer || (isSelected && !isCorrectAnswer) ? (
                            isCorrectAnswer ? '✓' : '✗'
                          ) : String.fromCharCode(65 + idx)
                        ) : (
                          <span className="text-xs font-semibold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {(legacyShowExplanation || completed) && mcq.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex gap-2"
                >
                  <Lightbulb className="w-5 h-5 text-[#1a3884] dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-[#1a3884] dark:text-blue-200 font-semibold leading-relaxed">
                    {mcq.explanation}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : null}

        {/* Complete / Submit Button */}
        <div className="pt-4 pb-8">
          <button
            onClick={handleComplete}
            disabled={completed}
            className={`w-full py-4 bg-gradient-to-r from-[#1a3884] to-[#112b6b] hover:from-[#112b6b] hover:to-[#002147] text-white rounded-2xl font-extrabold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Send className="w-4 h-4" />
            {completed ? 'Case Study Analysis Completed' : 'Submit Reflections & Complete Case Study'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CaseStudy;
