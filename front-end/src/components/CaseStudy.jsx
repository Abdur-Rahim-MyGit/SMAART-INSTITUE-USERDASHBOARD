import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, BookOpen, Lightbulb, Upload, FileText, X, Loader2, Send, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const CaseStudy = ({ title, content, mcq, questions = [], onComplete, isCompleted, savedScore, savedTotalPoints, storageKey }) => {
  const [selectedAnswers, setSelectedAnswers] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_selected`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  });
  const [essayResponses, setEssayResponses] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_essay`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  });
  const [shortTextResponses, setShortTextResponses] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_short`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  });
  const [fileUploads, setFileUploads] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_file`);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  }); // Stores fake uploaded file details
  const [uploadingState, setUploadingState] = useState({}); // Stores fake uploading progress/states
  const [showExplanation, setShowExplanation] = useState({});
  const [completed, setCompleted] = useState(isCompleted || false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    setCompleted(isCompleted || false);
  }, [isCompleted]);

  const handleEssayChange = (idx, value) => {
    setEssayResponses(prev => {
      const updated = { ...prev, [idx]: value };
      if (storageKey) {
        localStorage.setItem(`${storageKey}_essay`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const handleShortTextChange = (idx, value) => {
    setShortTextResponses(prev => {
      const updated = { ...prev, [idx]: value };
      if (storageKey) {
        localStorage.setItem(`${storageKey}_short`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const getIsCorrectOption = (q, optIdx, optionText) => {
    if (!q || q.correctAnswer === undefined || q.correctAnswer === null) return false;
    if (typeof q.correctAnswer === 'number' && q.correctAnswer === optIdx) {
      return true;
    }
    const correctStr = String(q.correctAnswer).trim().toLowerCase();
    if (correctStr === String(optIdx)) return true;
    if (correctStr === String(optionText).trim().toLowerCase()) return true;
    
    if (/^[a-f]$/.test(correctStr)) {
      const idx = correctStr.charCodeAt(0) - 97;
      if (idx === optIdx) return true;
    }
    return false;
  };

  const hasQuestionsList = questions && questions.length > 0;
  const showImmediateFeedback = (questions?.length || 0) + (mcq ? 1 : 0) <= 1;

  const calculateScore = () => {
    const actualTotalPoints = hasQuestionsList ? questions.length : (mcq ? 1 : 0);
    const hasLocalAnswers = hasQuestionsList 
      ? (Object.keys(selectedAnswers).length > 0 || Object.keys(essayResponses).length > 0 || Object.keys(shortTextResponses).length > 0 || Object.keys(fileUploads).length > 0)
      : legacySelected !== null;

    if (completed && typeof savedScore === 'number' && typeof savedTotalPoints === 'number' && !hasLocalAnswers) {
      if (savedTotalPoints === actualTotalPoints) {
        return { score: savedScore, totalPoints: savedTotalPoints };
      }
      let scaledScore = 0;
      if (savedTotalPoints > 0) {
        scaledScore = Math.round((savedScore / savedTotalPoints) * actualTotalPoints);
        if (savedScore > 0 && scaledScore === 0 && actualTotalPoints > 0) {
          scaledScore = 1;
        }
      }
      return { score: scaledScore, totalPoints: actualTotalPoints };
    }

    let score = 0;
    let totalPoints = 0;

    if (hasQuestionsList) {
      questions.forEach((q, idx) => {
        totalPoints += 1;
        if (q.type === 'mcq') {
          const selected = selectedAnswers[idx];
          if (selected !== undefined && selected !== null) {
            const optIdx = q.options.findIndex(opt => 
              String(opt).trim().toLowerCase() === String(selected).trim().toLowerCase()
            );
            const selectedIdx = optIdx !== -1 ? optIdx : parseInt(selected);
            const isCorrectVal = getIsCorrectOption(q, selectedIdx, selected);
            if (isCorrectVal) {
              score += 1;
            }
          }
        } else if (q.type === 'essay') {
          if (essayResponses[idx] && essayResponses[idx].trim().length >= 5) {
            score += 1;
          }
        } else if (q.type === 'text') {
          if (shortTextResponses[idx] && shortTextResponses[idx].trim().length >= 2) {
            score += 1;
          }
        } else if (q.type === 'file-upload') {
          if (fileUploads[idx]) {
            score += 1;
          }
        }
      });

      const answeredCount = Object.keys(selectedAnswers).length + Object.keys(essayResponses).length + Object.keys(shortTextResponses).length + Object.keys(fileUploads).length;
      if (completed && answeredCount === 0 && typeof savedScore !== 'number') {
        score = totalPoints;
      }
    } else if (mcq) {
      totalPoints = 1;
      const isCorrectAnswer = typeof mcq.correctAnswer === 'number'
        ? legacySelected === mcq.correctAnswer
        : legacySelected !== null && mcq.options[legacySelected] !== undefined && mcq.correctAnswer !== undefined && String(mcq.options[legacySelected]).trim().toLowerCase() === String(mcq.correctAnswer).trim().toLowerCase();
      if (isCorrectAnswer) {
        score = 1;
      }
      
      if (completed && legacySelected === null && typeof savedScore !== 'number') {
        score = totalPoints;
      }
    }

    return { score, totalPoints };
  };

  // Handle option select for MCQ reflection question type
  const handleMCQSelect = (qIdx, optionVal) => {
    setSelectedAnswers(prev => {
      const updated = { ...prev, [qIdx]: optionVal };
      if (storageKey) {
        localStorage.setItem(`${storageKey}_selected`, JSON.stringify(updated));
      }
      return updated;
    });
    if (showImmediateFeedback) {
      setShowExplanation(prev => ({ ...prev, [qIdx]: true }));
    }
  };

  // Legacy MCQ selection (single MCQ prop)
  const [legacySelected, setLegacySelected] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`${storageKey}_legacy`);
      if (saved !== null) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });
  const [legacyShowExplanation, setLegacyShowExplanation] = useState(false);

  const handleLegacySelect = (idx) => {
    setLegacySelected(idx);
    if (storageKey) {
      localStorage.setItem(`${storageKey}_legacy`, JSON.stringify(idx));
    }
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
        setFileUploads(prev => {
          const updated = { ...prev, [qIdx]: { name: file.name, size: (file.size / 1024).toFixed(1) + ' KB' } };
          if (storageKey) {
            localStorage.setItem(`${storageKey}_file`, JSON.stringify(updated));
          }
          return updated;
        });
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
      if (storageKey) {
        localStorage.setItem(`${storageKey}_file`, JSON.stringify(copy));
      }
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

      const { score: calculatedScoreVal, totalPoints: calculatedTotalPoints } = calculateScore();
      setCompleted(true);
      if (onComplete) onComplete(calculatedScoreVal, calculatedTotalPoints, false);
      toast.success('Case study reflection completed!');
    } else if (mcq) {
      // Legacy MCQ submit
      if (legacySelected !== null) {
        const { score: calculatedScoreVal, totalPoints: calculatedTotalPoints } = calculateScore();
        setCompleted(true);
        if (onComplete) onComplete(calculatedScoreVal, calculatedTotalPoints, false);
        toast.success('Case study completed!');
      } else {
        toast.error('Please answer the question before completing.');
      }
    } else {
      // No questions at all, just complete
      setCompleted(true);
      if (onComplete) onComplete(0, 0, false);
    }
  };

  const { score, totalPoints } = calculateScore();

  if (completed && !showReview) {
    return (
      <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto text-center py-8 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-6"
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
              <div className="text-xs text-gray-550 dark:text-slate-400 uppercase tracking-wider">Your Score</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-305 dark:text-slate-600">/</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 dark:text-white">{totalPoints}</div>
              <div className="text-xs text-gray-550 dark:text-slate-400 uppercase tracking-wider">Total Points</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowReview(true)}
              className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-[#002A5C] border-2 border-[#1a3884] text-[#1a3884] rounded-xl font-bold shadow-sm transition-all hover:bg-[#1a3884]/5"
            >
              Review Responses
            </button>
            <button
              onClick={() => {
                if (onComplete) onComplete(score, totalPoints);
              }}
              className="w-full sm:w-auto px-8 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold shadow-lg shadow-[#1a3884]/30 transition-all"
            >
              Continue to Next Step
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        {completed && showReview && (
          <button
            type="button"
            onClick={() => setShowReview(false)}
            className="mb-4 text-sm font-semibold text-[#1a3884] hover:text-[#112b6b] transition-colors flex items-center gap-1.5"
          >
            ← Back to results
          </button>
        )}
        
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
                        onChange={(e) => handleEssayChange(idx, e.target.value)}
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
                        onChange={(e) => handleShortTextChange(idx, e.target.value)}
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
                          const isSelected = selectedAnswers[idx] !== undefined && (
                            String(selectedAnswers[idx]).trim().toLowerCase() === String(option).trim().toLowerCase() ||
                            String(selectedAnswers[idx]).trim().toLowerCase() === String(optIdx)
                          );
                          const isCorrectVal = getIsCorrectOption(q, optIdx, option);

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
                                    ? 'border-red-500 bg-red-55/50 dark:bg-red-950/20 text-red-700 dark:text-red-300'
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

                              {showResult && (
                                <div className="flex items-center gap-2 text-[10px] md:text-xs">
                                  {isSelected && (
                                    <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-350">
                                      Your answer
                                    </span>
                                  )}
                                  {isCorrectVal && (
                                    <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-green-200/50 dark:bg-green-700/50 text-green-600 dark:text-green-300">
                                      Correct
                                    </span>
                                  )}
                                </div>
                              )}
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
                const isCorrectAnswer = getIsCorrectOption(mcq, idx, option);
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

                    {showResult && (
                      <div className="flex items-center gap-2 text-[10px] md:text-xs">
                        {isSelected && (
                          <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-350">
                            Your answer
                          </span>
                        )}
                        {isCorrectAnswer && (
                          <span className="font-bold uppercase px-1.5 py-0.5 rounded bg-green-200/50 dark:bg-green-700/50 text-green-600 dark:text-green-300">
                            Correct
                          </span>
                        )}
                      </div>
                    )}
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
        {!showReview && (
          <div className="pt-4 pb-8">
            <button
              onClick={handleComplete}
              disabled={completed}
              className={`w-full py-4 bg-gradient-to-r from-[#1a3884] to-[#112b6b] hover:from-[#112b6b] hover:to-[#002147] text-white rounded-2xl font-extrabold text-sm transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Send className="w-4 h-4" />
              {completed ? 'Case Study Analysis Completed' : 'Submit'}
            </button>
          </div>
        )}

        {completed && showReview && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 pb-8">
            <button
              onClick={() => setShowReview(false)}
              className="w-full sm:w-auto px-8 py-3 bg-white dark:bg-[#002A5C] border-2 border-[#1a3884] text-[#1a3884] dark:text-blue-400 rounded-xl font-bold transition-all hover:bg-[#1a3884]/5"
            >
              Back to Summary
            </button>
            <button
              onClick={() => {
                if (onComplete) onComplete(score, totalPoints);
              }}
              className="w-full sm:w-auto px-8 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl font-bold shadow-lg shadow-[#1a3884]/30 transition-all"
            >
              Continue to Next Step
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default CaseStudy;
