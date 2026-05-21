import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FlashcardTask = ({ content, cards, onComplete, isCompleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [hasMarkedComplete, setHasMarkedComplete] = useState(isCompleted || false);

  // Sync state with prop
  useEffect(() => {
    setHasMarkedComplete(isCompleted || false);
  }, [isCompleted]);

  const flashcards = cards || [];
  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkComplete = () => {
    setHasMarkedComplete(true);
    toast.success('Flashcards marked as complete!');
    if (onComplete) {
      onComplete();
    }
  };



  return (
    <div className="w-full h-full bg-[#fbfcfd] dark:bg-[#020617] p-4 md:p-6 overflow-y-auto relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/30 dark:bg-blue-900/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/30 dark:bg-indigo-900/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
            <RotateCcw size={16} />
            <span>Flash Cards</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {content?.title || 'Flash Cards'}
          </h2>

        </div>

        {/* Flashcard */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            onClick={handleFlip}
            whileHover={{ scale: 1.02, y: -8 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer perspective-1000 group transition-all duration-500"
          >
            <motion.div
              className="relative w-full h-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-3xl"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 15 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 bg-slate-900 dark:bg-[#00152E] rounded-3xl flex items-center justify-center p-10 border border-white/10 overflow-hidden"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(1px)',
                  zIndex: isFlipped ? 0 : 10
                }}
                animate={{ opacity: isFlipped ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Rich Gradient Overlay - 100% Opaque */}
                <div className="absolute inset-0 bg-[#1e3a8a] opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] via-[#1e3a8a] to-[#172554] opacity-100" />
                
                <div className="text-center space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.25em]">Flashcard Phase</span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black text-white leading-tight px-4 tracking-tight">
                    {currentCard?.front}
                  </h3>
                  <div className="pt-10 flex flex-col items-center gap-4 opacity-60">
                    <div className="h-px w-12 bg-white/40" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                      Tap to Flip
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Back - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 bg-white dark:bg-[#00152E] rounded-3xl flex items-center justify-center p-10 border border-slate-200 dark:border-white/8"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                  zIndex: isFlipped ? 10 : 0
                }}
                animate={{ opacity: isFlipped ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center space-y-6">
                  <span className="text-[10px] font-black text-[#1a3884] dark:text-blue-500 uppercase tracking-[0.4em] mb-4 block">
                    THE SOLUTION
                  </span>
                  <p className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight px-6">
                    {currentCard?.back}
                  </p>
                  <div className="pt-8 opacity-20">
                     <RotateCcw size={16} className="mx-auto text-slate-900 dark:text-white" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-full bg-slate-100 dark:bg-[#002A5C] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#002A5C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {currentIndex + 1} / {flashcards.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 rounded-full bg-slate-100 dark:bg-[#002A5C] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#002A5C] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Complete Button */}
          {!hasMarkedComplete ? (
            <button
              onClick={handleMarkComplete}
              className="w-full max-w-md px-6 py-3 bg-[#1a3884] hover:bg-[#112b6b] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Mark as Complete
            </button>
          ) : (
            <div className="w-full max-w-md px-6 py-3 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Review Mode - You've completed these cards
            </div>
          )}
        </div>

        {/* Interview Tips */}
        {content?.interviewTips && content.interviewTips.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-amber-900 dark:text-amber-100">
                Interview Prep Tips
              </h3>
            </div>
            <ul className="space-y-2">
              {content.interviewTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                  <span className="font-bold">{idx + 1}.</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardTask;

