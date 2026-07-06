import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FlashcardTask = ({ content, cards, onComplete, isCompleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [hasMarkedComplete, setHasMarkedComplete] = useState(isCompleted || false);

  const flashcards = cards || [];
  const currentCard = flashcards[currentIndex];

  const [viewedCards, setViewedCards] = useState(new Set([0]));

  // Sync state with prop and reset viewedCards when cards change
  useEffect(() => {
    setHasMarkedComplete(isCompleted || false);
  }, [isCompleted]);

  useEffect(() => {
    setViewedCards(new Set([0]));
  }, [cards]);

  useEffect(() => {
    if (flashcards.length > 0) {
      setViewedCards(prev => {
        if (prev.has(currentIndex)) return prev;
        const nextSet = new Set(prev);
        nextSet.add(currentIndex);
        return nextSet;
      });
    }
  }, [currentIndex, flashcards.length]);

  const allCardsViewed = flashcards.length === 0 || viewedCards.size === flashcards.length;

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
    if (!allCardsViewed) return;
    setHasMarkedComplete(true);
    toast.success('Flashcards marked as complete!');
    if (onComplete) {
      onComplete();
    }
  };



  return (
    <div className="w-full h-full bg-white dark:bg-[#002147] p-2 sm:p-6 overflow-y-auto relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-50/20 dark:bg-blue-900/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-50/20 dark:bg-indigo-900/5 rounded-full blur-[100px] -ml-48 -mb-48 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-white/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            <RotateCcw size={14} className="text-[#1a3884] dark:text-blue-400" />
            <span>Flash Cards</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2">
            {content?.title || 'Flash Cards'}
          </h2>
        </div>

        {/* Flashcard */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            onClick={handleFlip}
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            className="relative w-full max-w-2xl aspect-[4/3] sm:aspect-[3/2] cursor-pointer perspective-1000 group transition-all duration-500"
          >
            <motion.div
              className="relative w-full h-full shadow-2xl rounded-3xl"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 18 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 bg-[#1a3884] dark:bg-[#002A5C] rounded-3xl flex items-center justify-center p-4 sm:p-8 md:p-10 border border-white/10 overflow-hidden"
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
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a3884] via-[#112b6b] to-[#0d1e4c] opacity-100" />
                
                <div className="text-center space-y-6 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/10 mb-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.25em]">Flashcard Front</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-white leading-tight px-4 tracking-tight">
                    {currentCard?.front}
                  </h3>
                  <div className="pt-4 sm:pt-8 flex flex-col items-center gap-3 opacity-60">
                    <div className="h-px w-10 bg-white/40" />
                    <span className="text-[9px] font-black text-white uppercase tracking-[0.25em]">
                      Tap to Flip
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Back - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 bg-[#F8FAFC] dark:bg-[#002A5C] rounded-3xl flex items-center justify-center p-4 sm:p-8 md:p-10 border border-slate-200 dark:border-white/10"
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
                  <span className="text-[9px] font-black text-[#1a3884] dark:text-blue-450 uppercase tracking-[0.25em] mb-4 block">
                    THE SOLUTION
                  </span>
                  <p className="text-sm sm:text-lg md:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed tracking-tight px-4">
                    {currentCard?.back}
                  </p>
                  <div className="pt-3 sm:pt-6 opacity-30">
                     <RotateCcw size={15} className="mx-auto text-slate-900 dark:text-white" />
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
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#002A5C] dark:hover:bg-[#003170] text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>

            <span className="text-sm font-extrabold text-slate-600 dark:text-slate-400">
              {currentIndex + 1} / {flashcards.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#002A5C] dark:hover:bg-[#003170] text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Complete Button */}
          {!hasMarkedComplete ? (
            <div className="w-full flex flex-col items-center gap-2">
              <button
                onClick={handleMarkComplete}
                disabled={!allCardsViewed}
                className="w-full max-w-md px-6 py-3.5 bg-[#1a3884] hover:bg-[#112b6b] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1a3884]"
              >
                <CheckCircle2 size={18} />
                Mark as Complete
              </button>
              {!allCardsViewed && (
                <p className="text-xs text-slate-550 dark:text-slate-400 font-semibold animate-pulse">
                  Please view all cards to unlock completion ({viewedCards.size} / {flashcards.length})
                </p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md px-6 py-3.5 bg-green-500/10 border-2 border-green-500 text-green-700 dark:text-green-450 font-bold rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
              <CheckCircle2 size={18} />
              Completed
            </div>
          )}
        </div>

        {/* Interview Tips */}
        {content?.interviewTips && content.interviewTips.length > 0 && (
          <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3.5">
              <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-900 dark:text-amber-100">
                Interview Prep Tips
              </h3>
            </div>
            <ul className="space-y-2.5">
              {content.interviewTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2 font-medium leading-relaxed">
                  <span className="font-black text-[#1a3884] dark:text-blue-400">{idx + 1}.</span>
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

