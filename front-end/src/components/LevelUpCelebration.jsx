/**
 * Level Up Celebration Component
 * Displays a beautiful celebration UI when user levels up or unlocks items
 * 
 * Features:
 * - Animated modal overlay
 * - Confetti effect
 * - Unlock item showcase
 * - Sound effects (optional)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Sparkles, 
  X,
  Footprints,
  Shirt,
  Glasses,
  PartyPopper
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useState, useEffect } from 'react';

// Unlock item configurations
const UNLOCK_CONFIG = {
  shoes: {
    icon: Footprints,
    name: 'Stylish Shoes',
    description: 'Your avatar now has cool new kicks!',
    color: '#30919D',
    level: 2
  },
  jacket: {
    icon: Shirt,
    name: 'Cool Jacket',
    description: 'Looking sharp with this trendy jacket!',
    color: '#daa520',
    level: 3
  },
  glasses: {
    icon: Glasses,
    name: 'Smart Glasses',
    description: 'See the world with style!',
    color: '#ff6b6b',
    level: 4
  },
  celebrate: {
    icon: PartyPopper,
    name: 'Celebration Dance',
    description: 'Your avatar can now dance to celebrate!',
    color: '#4ecdc4',
    level: 5
  }
};

const LevelUpCelebration = ({ 
  isOpen, 
  onClose, 
  level, 
  unlock = null,
  xpGained = 0 
}) => {
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
      setShowConfetti(true);
      
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const unlockInfo = unlock ? UNLOCK_CONFIG[unlock.item] : null;
  const UnlockIcon = unlockInfo?.icon || Star;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Confetti */}
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              recycle={false}
              numberOfPieces={300}
              gravity={0.2}
              colors={['#30919D', '#daa520', '#ff6b6b', '#4ecdc4', '#fff']}
            />
          )}

          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{ type: 'spring', damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-b from-[#002147] to-[#001229] rounded-3xl border border-[#30919D]/30 p-8 max-w-md w-full overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {/* Decorative background elements */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#30919D]/10 blur-3xl"
                />
                <motion.div
                  animate={{ 
                    rotate: -360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 3, repeat: Infinity }
                  }}
                  className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#daa520]/10 blur-3xl"
                />
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                {/* Level badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-[#daa520] to-[#b8860b] shadow-lg shadow-[#daa520]/30 mb-6"
                >
                  <div className="flex flex-col items-center">
                    <Trophy className="w-8 h-8 text-white mb-1" />
                    <span className="text-white font-bold text-2xl">{level}</span>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-white mb-2"
                >
                  Level Up! 🎉
                </motion.h2>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-400 mb-6"
                >
                  Congratulations! You've reached level {level}!
                </motion.p>

                {/* XP gained */}
                {xpGained > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#30919D]/20 rounded-full mb-6"
                  >
                    <Sparkles className="w-4 h-4 text-[#daa520]" />
                    <span className="text-[#daa520] font-bold">+{xpGained} XP</span>
                  </motion.div>
                )}

                {/* Unlock showcase */}
                {unlockInfo && (
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white/5 rounded-2xl p-6 border border-white/10"
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                      style={{ backgroundColor: `${unlockInfo.color}20` }}
                    >
                      <UnlockIcon 
                        className="w-8 h-8" 
                        style={{ color: unlockInfo.color }}
                      />
                    </motion.div>

                    <h3 className="text-xl font-bold text-white mb-2">
                      {unlock.type === 'accessory' ? 'New Accessory Unlocked!' : 'New Animation Unlocked!'}
                    </h3>
                    
                    <p className="text-[#30919D] font-semibold text-lg mb-2">
                      {unlockInfo.name}
                    </p>
                    
                    <p className="text-gray-400 text-sm">
                      {unlockInfo.description}
                    </p>
                  </motion.div>
                )}

                {/* Continue button */}
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-[#30919D] to-[#267a84] text-white font-bold rounded-xl shadow-lg shadow-[#30919D]/30 hover:shadow-[#30919D]/50 transition-shadow"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LevelUpCelebration;
