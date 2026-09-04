import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This file imported from lucide-react, so its icons
// rendered at a different weight and optical size to the rest of the product.
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from "@/components/icons";
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
        <div className="border-b border-[#d7ebf5] dark:border-white/[0.05] pb-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#045C9A] dark:text-[#A6D7E8] mb-1.5">
            <RotateCcw size={12} strokeWidth={2.5} />
            <span>Flash Cards Activity</span>
          </div>
          <h2 className="text-lg md:text-xl font-bold text-[#072036] dark:text-white">
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
              className="relative w-full h-full shadow-2xl rounded-2xl"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 18 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 rounded-2xl flex items-center justify-center p-6 border border-white/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(26,56,132,0.22)] bg-gradient-to-br from-[#045C9A] via-[#034a7d] to-[#072036]"
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
                    <Sparkles size={11} className="text-[#A6D7E8] animate-pulse" />
                    <span className="text-[9px] font-bold text-[#A6D7E8] uppercase tracking-widest">Flashcard Front</span>
                  </div>
                  
                  <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug px-6 tracking-tight max-w-md">
                    {currentCard?.front}
                  </h3>
                  
                  <div className="flex flex-col items-center gap-2 opacity-55 hover:opacity-85 transition-opacity">
                    <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-1.5">
                      <RotateCcw size={11} strokeWidth={2.5} /> Tap to reveal answer
                    </span>
                  </div>
                </div>
              </motion.div>
 
              {/* Back - Force Solid Background and Visibility */}
              <motion.div
                className="absolute inset-0 rounded-2xl flex items-center justify-center p-6 border border-[#d7ebf5] dark:border-white/[0.04] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] bg-gradient-to-br from-[#ffffff] to-[#F1F5F9] dark:from-[#072036] dark:to-[#072036]"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-white/5 border border-[#d7ebf5] dark:border-white/10 shadow-xs">
                    <Layers size={11} className="text-[#045C9A] dark:text-[#A6D7E8]" />
                    <span className="text-[9px] font-bold text-[#045C9A] dark:text-[#A6D7E8] uppercase tracking-widest">The Solution</span>
                  </div>
                  
                  <p className="text-sm sm:text-base font-bold text-[#072036] dark:text-slate-200 leading-relaxed max-w-md px-6">
                    {currentCard?.back}
                  </p>
                  
                  <div className="flex flex-col items-center gap-2 opacity-50 hover:opacity-85 transition-opacity">
                    <div className="h-[2px] w-8 bg-gradient-to-r from-transparent via-[#045C9A]/30 dark:via-white/30 to-transparent" />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
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
                    ? 'w-8 bg-[#045C9A] dark:bg-[#045C9A]'
                    : viewedCards.has(idx)
                      ? 'w-2 bg-[#045C9A]/40 dark:bg-[#045C9A]/40 hover:bg-[#045C9A]/60'
                      : 'w-2 bg-[#d7ebf5] dark:bg-white/5 hover:bg-slate-300'
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
              className="w-10 h-10 rounded-full border border-[#d7ebf5] dark:border-white/10 bg-white dark:bg-[#0d3a5f] text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-center transition-all hover:bg-[#F1F5F9] dark:hover:bg-white/5 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
 
            <span className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              {currentIndex + 1} of {flashcards.length}
            </span>
 
            <button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="w-10 h-10 rounded-full border border-[#d7ebf5] dark:border-white/10 bg-white dark:bg-[#0d3a5f] text-slate-700 dark:text-slate-300 shadow-sm flex items-center justify-center transition-all hover:bg-[#F1F5F9] dark:hover:bg-white/5 active:scale-95 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
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
                className={`flex w-full max-w-md items-center justify-center gap-2 rounded-xl px-6 py-3 text-[13px] font-semibold transition-colors ${
                  allCardsViewed
                    ? 'cursor-pointer bg-[#072036] text-white shadow-md shadow-[#072036]/20 hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white'
                    : 'cursor-not-allowed border border-[#d7ebf5] bg-[#F1F5F9] text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500'
                }`}
              >
                <CheckCircle2 size={16} />
                Mark as Complete
              </button>
              {!allCardsViewed && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Please view all cards to unlock completion ({viewedCards.size} / {flashcards.length})
                </p>
              )}
            </div>
          ) : (
            <div className="flex w-full max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50 px-6 py-3 text-[13px] font-semibold text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={16} />
              Completed
            </div>
          )}
        </div>

        {/* Interview Tips */}
        {content?.interviewTips && content.interviewTips.length > 0 && (
          <div className="bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3.5">
              <Lightbulb size={16} className="text-amber-600 dark:text-amber-400" />
              <h3 className="font-extrabold text-sm uppercase tracking-widest text-amber-900 dark:text-amber-100">
                Interview Prep Tips
              </h3>
            </div>
            <ul className="space-y-2.5">
              {content.interviewTips.map((tip, idx) => (
                <li key={idx} className="text-sm text-amber-800 dark:text-amber-200 flex gap-2 font-medium leading-relaxed">
                  <span className="font-bold text-[#045C9A] dark:text-[#A6D7E8]">{idx + 1}.</span>
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

