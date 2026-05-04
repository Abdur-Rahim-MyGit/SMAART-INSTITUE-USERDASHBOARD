import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Save, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Notes = ({ content, placeholder, onComplete, isCompleted, courseId = "general" }) => {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(isCompleted || false);

  // Load saved notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`course-notes-${courseId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [courseId]);

  // Save notes to localStorage
  const handleSave = () => {
    localStorage.setItem(`course-notes-${courseId}`, notes);
    setSaved(true);
    toast.success('Notes saved!');
    setTimeout(() => setSaved(false), 2000);
  };

  const handleComplete = () => {
    setHasMarkedComplete(true);
    if (onComplete) onComplete();
    toast.success('Notes section completed!');
  };

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
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
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
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
          className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Your Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={placeholder || 'Start typing your notes here...'}
              className="w-full h-64 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none resize-none transition-colors"
            />
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              {saved ? 'Saved!' : 'Save Notes'}
            </button>

            {!hasMarkedComplete ? (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-bold transition-all flex items-center gap-2"
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
