import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Lightbulb, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const FlashcardTask = ({ content, onComplete, isCompleted }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [hasMarkedComplete, setHasMarkedComplete] = useState(isCompleted || false);

  // Sync state with prop
  useEffect(() => {
    setHasMarkedComplete(isCompleted || false);
  }, [isCompleted]);

  const cards = content?.cards || [];
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
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
    <div className="w-full h-full bg-white dark:bg-slate-900 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
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
          <div 
            onClick={handleFlip}
            className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer perspective-1000"
          >
            <motion.div
              className="relative w-full h-full"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring' }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#0891b2] to-[#0a7a8f] dark:from-[#30919D] dark:to-[#2a7d88] rounded-2xl shadow-2xl flex items-center justify-center p-8"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center space-y-4">
                  <p className="text-sm font-bold text-white/70 uppercase tracking-wider">
                    Question
                  </p>
                  <p className="text-lg md:text-2xl font-bold text-white leading-relaxed px-4">
                    {currentCard?.front}
                  </p>
                  <p className="text-[10px] md:text-xs text-white/60 mt-4">
                    Click to reveal answer
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 rounded-2xl shadow-2xl flex items-center justify-center p-8"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="text-center space-y-4">
                  <p className="text-sm font-bold text-white/70 uppercase tracking-wider">
                    Answer
                  </p>
                  <p className="text-xl text-white leading-relaxed">
                    {currentCard?.back}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
              {currentIndex + 1} / {cards.length}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === cards.length - 1}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Complete Button */}
          {!hasMarkedComplete ? (
            <button
              onClick={handleMarkComplete}
              className="w-full max-w-md px-6 py-3 bg-[#0891b2] dark:bg-[#30919D] hover:bg-[#0a7a8f] dark:hover:bg-[#2a7d88] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={20} />
              Mark as Complete
            </button>
          ) : (
            <div className="w-full max-w-md px-6 py-3 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-600 text-green-700 dark:text-green-400 font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Completed - You can still review these cards
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
