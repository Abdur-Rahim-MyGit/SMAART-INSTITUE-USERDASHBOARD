import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, CheckCircle2, Sparkles, Layers, HelpCircle } from 'lucide-react';
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
    <div className="w-full h-full bg-transparent p-0 overflow-y-auto relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-400 mb-1.5">
            <RotateCcw size={12} strokeWidth={2.5} />
            <span>Flash Cards Activity</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-[#0d1f4e] dark:text-white">
            {content?.title || 'Flash Cards'}
          </h2>
        </div>
 
        {/* Flashcard */}
        <div className="flex flex-col items-center gap-6">
          <motion.div 
            onClick={handleFlip}
            whileHover={{ scale: 1.01, y: -4 }}
            whileTap={{ scale: 0.99 }}
            className="relative w-full max-w-xl aspect-[16/10] cursor-pointer perspective-1000 group transition-all duration-500"
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
                className="absolute inset-0 rounded-3xl flex items-center justify-center p-6 border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(26,56,132,0.22)] bg-gradient-to-br from-[#1a3884] via-[#122c6e] to-[#0b1b42]"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(1px)',
                  zIndex: isFlipped ? 0 : 10
                }}
                animate={{ opacity: isFlipped ? 0 : 1 }}
                transition={{ duration: 0.2 }}
              >
                {/* Subtle Radial Glow Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_70%)] pointer-events-none" />
                
                <div className="text-center space-y-6 relative z-10 flex flex-col items-center justify-between h-full py-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                    <Sparkles size={11} className="text-blue-300 animate-pulse" />
                    <span className="text-[9px] font-black text-blue-200 uppercase tracking-widest">Flashcard Front</span>
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl font-black text-white leading-snug px-6 tracking-tight max-w-md">
                    {currentCard?.front}
                  </h3>
                  
                  <div className="flex flex-col items-center gap-2 opacity-55 hover:opacity-85 transition-opacity">
                    <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    <span className="text-[9px] font-black text-white/80 uppercase tracking-widest flex items-center gap-1.5">
                      <RotateCcw size={11} strokeWidth={2.5} /> Tap to reveal answer
                    </span>
                  </div>
                </div>
              </motion.div>
 
              {/* Back - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 rounded-3xl flex items-center justify-center p-6 border border-slate-200/80 dark:border-white/[0.04] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-gradient-to-br from-[#ffffff] to-[#f8fafc] dark:from-[#0f172a] dark:to-[#090d16]"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                  zIndex: isFlipped ? 10 : 0
                }}
                animate={{ opacity: isFlipped ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center space-y-6 relative z-10 flex flex-col items-center justify-between h-full py-4 w-full">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
                    <Layers size={11} className="text-[#1a3884] dark:text-cyan-400" />
                    <span className="text-[9px] font-black text-[#1a3884] dark:text-cyan-300 uppercase tracking-widest">The Solution</span>
                  </div>
                  
                  <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-relaxed max-w-md px-6">
                    {currentCard?.back}
                  </p>
                  
                  <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-85 transition-opacity">
                    <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[#1a3884]/30 dark:via-white/30 to-transparent" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <RotateCcw size={11} strokeWidth={2.5} /> Tap to flip back
                    </span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
 
          {/* Visual Dot Progress Bar */}
          <div className="flex items-center gap-2 mt-2">
            {flashcards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsFlipped(false);
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? 'w-8 bg-[#1a3884] dark:bg-blue-500'
                    : viewedCards.has(idx)
                      ? 'w-2 bg-[#1a3884]/40 dark:bg-blue-500/40 hover:bg-[#1a3884]/60'
                      : 'w-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300'
                }`}
                aria-label={`Go to card ${idx + 1}`}
              />
            ))}
          </div>
 
          {/* Navigation Controls */}
          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
 
            <span className="text-xs font-black tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {currentIndex + 1} of {flashcards.length}
            </span>
 
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
 
          {/* Complete Button */}
          {!hasMarkedComplete ? (
            <div className="w-full flex flex-col items-center gap-2">
              <button
                onClick={handleMarkComplete}
                disabled={!allCardsViewed}
                className={`w-full max-w-md px-6 py-4 font-black rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider ${
                  allCardsViewed
                    ? 'bg-gradient-to-r from-[#1a3884] via-[#2563eb] to-[#1a3884] hover:shadow-[0_10px_25px_rgba(37,99,235,0.25)] text-white hover:-translate-y-0.5 cursor-pointer active:scale-98'
                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-white/5'
                }`}
              >
                <CheckCircle2 size={16} className="stroke-[2.2]" />
                Mark as Complete
              </button>
              {!allCardsViewed && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold tracking-wider uppercase animate-pulse">
                  Please view all cards to unlock completion ({viewedCards.size} / {flashcards.length})
                </p>
              )}
            </div>
          ) : (
            <div className="w-full max-w-md px-6 py-4 bg-[#f0fdf4] dark:bg-[#072212]/40 border border-[#dcfce7] dark:border-[#14532d]/25 text-[#15803d] dark:text-[#4ade80] font-black rounded-2xl flex items-center justify-center gap-2.5 text-xs uppercase tracking-wider shadow-xs">
              <CheckCircle2 size={16} className="stroke-[2.2]" />
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

