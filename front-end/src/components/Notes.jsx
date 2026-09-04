import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Save,
} from "@/components/icons";
import { toast } from 'sonner';
import { notesAPI } from '@/services/api';

const Notes = ({ content, placeholder, diagramUrl, onComplete, isCompleted, courseId = "general", isVideoCompleted = true, onNextLesson, showNextLesson = false }) => {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(isCompleted || false);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Load saved notes from database
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoadingNotes(true);
        const response = await notesAPI.getByCourse(courseId);
        if (response.success && response.data) {
          setNotes(response.data.content || '');
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        // Fallback to localStorage if database fails (optional)
        const localNotes = localStorage.getItem(`course-notes-${courseId}`);
        if (localNotes) setNotes(localNotes);
      } finally {
        setLoadingNotes(false);
      }
    };

    fetchNotes();
  }, [courseId]);

  // Sync notes across components on same page
  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail && e.detail.courseId === courseId && e.detail.content !== notes) {
        setNotes(e.detail.content);
        // Also keep localStorage in sync
        localStorage.setItem(`course-notes-${courseId}`, e.detail.content);
      }
    };
    window.addEventListener('notes-updated', handleSync);
    return () => window.removeEventListener('notes-updated', handleSync);
  }, [courseId, notes]);

  // Save notes to database
  const handleSave = async () => {
    try {
      setSaved(true); // Show immediate visual feedback
      const response = await notesAPI.upsert(courseId, notes);
      
      if (response.success) {
        toast.success('Self-reflection saved to database!');
        // Sync to localStorage as backup
        localStorage.setItem(`course-notes-${courseId}`, notes);
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('notes-updated', { 
          detail: { courseId, content: notes } 
        }));
      } else {
        throw new Error(response.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save to database. Saved locally instead.');
      localStorage.setItem(`course-notes-${courseId}`, notes);
    } finally {
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleComplete = () => {
    setHasMarkedComplete(true);
    if (onComplete) onComplete();
    toast.success('Self-reflection completed!');
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#0d3a5f] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#d7ebf5] dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <FileText size={16} />
            <span>Self-Reflection</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#072036] dark:text-white">
            Self-Reflection & Insights
          </h2>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 dark:bg-[#0d3a5f]/40 backdrop-blur-xl rounded-2xl p-8 border border-white/20 dark:border-white/5 shadow-sm"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {diagramUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-[#d7ebf5] dark:border-white/5 bg-white p-2 max-w-md mx-auto shadow-sm">
                <img src={diagramUrl} alt="Framework Diagram" className="w-full h-auto object-contain max-h-64" />
              </div>
            )}
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
              {content}
            </p>
          </div>
        </motion.div>

        {/* Notes Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#0d3a5f] rounded-2xl p-6 border border-[#d7ebf5] dark:border-white/10"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Your Reflection
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={placeholder || 'Start typing your self-reflection here...'}
                disabled={loadingNotes}
                className="w-full h-64 p-4 rounded-xl border-2 border-[#d7ebf5] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#072036] text-[#072036] dark:text-white focus:border-[#045C9A] focus:outline-none resize-none transition-colors disabled:opacity-50"
              />
              {loadingNotes && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-white/5 rounded-xl">
                  <Loader2 className="w-8 h-8 text-[#045C9A] animate-spin" />
                </div>
              )}
            </div>
          </div>
  
          {/* Save & Complete Action Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={handleSave}
                disabled={loadingNotes || saved}
                className="px-6 py-2 bg-[#F1F5F9] dark:bg-[#0d3a5f] hover:bg-[#d7ebf5] dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saved ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <Save size={16} />
                )}
                {saved ? 'Saved!' : 'Save Reflection'}
              </button>

              {!hasMarkedComplete && (!isVideoCompleted || notes.trim().length === 0) && (
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold hidden md:inline-block">
                  {!isVideoCompleted && notes.trim().length === 0
                    ? "Complete the video & write reflection to unlock."
                    : !isVideoCompleted
                    ? "Watch the video completely to unlock."
                    : "Write something in the input to unlock."}
                </span>
              )}
            </div>

            {!hasMarkedComplete ? (
              <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto gap-1.5">
                <button
                  onClick={handleComplete}
                  disabled={!isVideoCompleted || notes.trim().length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
                >
                  Mark as Complete
                </button>
                {!hasMarkedComplete && (!isVideoCompleted || notes.trim().length === 0) && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold md:hidden text-center block">
                    {!isVideoCompleted && notes.trim().length === 0
                      ? "Watch video & write reflection to unlock"
                      : !isVideoCompleted
                      ? "Complete the video to unlock"
                      : "Write your reflection to unlock"}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full sm:w-auto px-6 py-2 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                Completed
              </div>
            )}
          </div>
        </motion.div>

        {/* Continue to Next Lesson */}
        {hasMarkedComplete && showNextLesson && onNextLesson && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={onNextLesson}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13px] font-semibold bg-[#072036] hover:bg-[#0d3a5f] text-white shadow-md shadow-[#072036]/20 dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] dark:shadow-none transition-colors"
          >
            Continue to Next Lesson
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Tips for Effective Self-Reflection
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Write down key insights that resonate with you</li>
            <li>• Connect concepts to your personal experiences</li>
            <li>• Note areas where you want to develop further</li>
            <li>• Record specific techniques you plan to practice</li>
            <li>• Save your reflection regularly to avoid losing it</li>
          </ul>
        </motion.div>

      </div>
    </div>
  );
};

export default Notes;
