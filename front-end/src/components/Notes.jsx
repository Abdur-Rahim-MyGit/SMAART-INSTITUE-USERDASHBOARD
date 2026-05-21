import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { notesAPI } from '@/services/api';

const Notes = ({ content, placeholder, onComplete, isCompleted, courseId = "general" }) => {
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
        toast.success('Notes saved to database!');
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
    toast.success('Notes section completed!');
  };

  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <FileText size={16} />
            <span>Personal Notes</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
            Reflection & Notes
          </h2>
        </div>

        {/* Instructions */}
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

        {/* Notes Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#002A5C] rounded-2xl p-6 border border-slate-200 dark:border-white/10"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Your Notes
            </label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={placeholder || 'Start typing your notes here...'}
                disabled={loadingNotes}
                className="w-full h-64 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#002147] text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none transition-colors disabled:opacity-50"
              />
              {loadingNotes && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-xl">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
 
          {/* Save Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={loadingNotes || saved}
              className="px-6 py-2 bg-slate-100 dark:bg-[#003170] hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saved ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <Save size={16} />
              )}
              {saved ? 'Saved!' : 'Save Notes'}
            </button>

            {!hasMarkedComplete ? (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-lg font-bold transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                Mark as Complete
              </button>
            ) : (
              <div className="px-6 py-2 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 rounded-lg font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                Completed
              </div>
            )}
          </div>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
        >
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2 flex items-center gap-2">
            <FileText size={16} />
            Tips for Effective Note-Taking
          </h4>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Write down key insights that resonate with you</li>
            <li>• Connect concepts to your personal experiences</li>
            <li>• Note areas where you want to develop further</li>
            <li>• Record specific techniques you plan to practice</li>
            <li>• Save your notes regularly to avoid losing them</li>
          </ul>
        </motion.div>

      </div>
    </div>
  );
};

export default Notes;
