import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiHandCoinLine, RiTimeLine } from '@remixicon/react';

export const AttentionCheck = ({ onPass, onFail }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [buttonPos, setButtonPos] = useState({ top: '50%', left: '50%' });

  // Randomize button position to defeat clicker scripts
  useEffect(() => {
    const randomTop = Math.floor(Math.random() * 40) + 30; // 30% to 70%
    const randomLeft = Math.floor(Math.random() * 60) + 20; // 20% to 80%
    setButtonPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onFail(); // Timeout counts as violation
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFail]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/50 dark:bg-[#00152E]/95 backdrop-blur-lg flex items-center justify-center p-4 select-none transition-colors duration-300">
      <div className="relative w-full max-w-lg h-[400px] bg-white dark:bg-[#002147] border border-slate-200 dark:border-[#1a3884]/30 rounded-3xl p-8 overflow-hidden flex flex-col justify-between items-center text-center text-slate-800 dark:text-white shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-2xl">
        
        {/* Glow Effects */}
        <div className="absolute top-12 left-12 w-32 h-32 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-12 right-12 w-32 h-32 bg-[#1a3884]/5 dark:bg-[#1a3884]/30 rounded-full blur-3xl pointer-events-none" />

        {/* Info Header */}
        <div className="space-y-2 mt-4 z-10">
          <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-cyan-400 flex items-center justify-center gap-1.5">
            <RiTimeLine size={14} className="animate-spin" /> Liveness Verification Check
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Are you still taking the assessment?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-350 max-w-sm font-medium">
            To prevent automatic macro scripts, click the button that appears below before the timer runs out.
          </p>
        </div>

        {/* Circular Countdown Progress */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg className="w-56 h-56 transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="90"
              className="stroke-slate-100 dark:stroke-white/5 fill-none"
              strokeWidth="4"
            />
            <motion.circle
              cx="112"
              cy="112"
              r="90"
              className="stroke-[#1a3884] dark:stroke-cyan-500 fill-none"
              strokeWidth="4"
              strokeDasharray="565.48"
              animate={{ strokeDashoffset: 565.48 - (565.48 * timeLeft) / 15 }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </svg>
          <div className="flex flex-col items-center">
            <span className="text-5xl font-black text-slate-800 dark:text-white">{timeLeft}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-450 font-bold uppercase tracking-widest mt-1">Seconds</span>
          </div>
        </div>

        {/* Randomized Click Target Button */}
        <motion.button
          onClick={onPass}
          style={{
            position: 'absolute',
            top: buttonPos.top,
            left: buttonPos.left,
            transform: 'translate(-50%, -50%)',
            zIndex: 20
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-3 bg-gradient-to-r from-[#1a3884] to-[#12275c] hover:from-[#152e6d] hover:to-[#0c1b3f] text-white dark:from-cyan-400 dark:to-blue-500 dark:text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#1a3884]/15 dark:shadow-cyan-400/20 flex items-center gap-1.5 cursor-pointer pointer-events-auto transition-all"
        >
          <RiHandCoinLine size={16} /> Confirm Presence
        </motion.button>

        {/* Security Warning Footer */}
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide mb-2 z-10">
          Failing to verify counts as a security violation.
        </div>
      </div>
    </div>
  );
};

export default AttentionCheck;
