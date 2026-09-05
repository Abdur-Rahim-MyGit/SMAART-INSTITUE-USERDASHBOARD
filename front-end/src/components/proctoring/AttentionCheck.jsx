import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RiHandCoinLine, RiShieldCheckLine } from '@remixicon/react';

export const AttentionCheck = ({ onPass, onFail }) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [buttonPos, setButtonPos] = useState({ top: '50%', left: '50%' });

  // Randomize button position safely within the designated target area
  useEffect(() => {
    const randomTop = Math.floor(Math.random() * 20) + 40; // 40% to 60% inside action container
    // 30% to 70%: the button is ~40% of the box wide, so this keeps it fully
    // inside at either extreme.
    const randomLeft = Math.floor(Math.random() * 40) + 30;
    setButtonPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
  }, []);

  // Smooth timestamp-based countdown timer
  useEffect(() => {
    const startTime = Date.now();
    const duration = 15;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(duration - elapsed, 0);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onFail(); // Timeout counts as violation
      }
    }, 200);

    return () => clearInterval(timer);
  }, [onFail]);

  const circumference = 2 * Math.PI * 44;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-900/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none transition-colors duration-300">
      <div className="relative w-full max-w-md bg-white dark:bg-[#00152E] border border-slate-200 dark:border-cyan-500/20 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden">
        
        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Top Header */}
        <div className="space-y-2 mb-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-black uppercase tracking-widest">
            <RiShieldCheckLine size={14} /> Liveness Verification Check
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Are you still taking the assessment?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed font-medium">
            To prevent automated macro scripts, click the button below before the timer runs out.
          </p>
        </div>

        {/* Timer Circle */}
        <div className="relative w-32 h-32 my-1 flex items-center justify-center z-10">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="44"
              className="stroke-slate-100 dark:stroke-white/10 fill-none"
              strokeWidth="5"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="44"
              className="stroke-cyan-500 fill-none"
              strokeWidth="5"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: circumference - (circumference * timeLeft) / 15 }}
              transition={{ duration: 0.2, ease: 'linear' }}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{timeLeft}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Seconds</span>
          </div>
        </div>

        {/* Action Area for Verification Button */}
        <div className="relative w-full h-20 my-2 z-20 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
          <motion.button
            onClick={onPass}
            // Centre with framer's own x/y rather than a CSS transform: the
            // hover/tap scale animations replace `transform` wholesale, which
            // dropped the translate and shoved the button off the right edge.
            style={{
              position: 'absolute',
              top: buttonPos.top,
              left: buttonPos.left,
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-2.5 bg-[#045C9A] hover:bg-[#034a7d] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#045C9A]/25 flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap"
          >
            <RiHandCoinLine size={15} /> Confirm Presence
          </motion.button>
        </div>

        {/* Security Notice Footer */}
        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 z-10">
          Failing to verify counts as a security violation.
        </div>
      </div>
    </div>
  );
};

export default AttentionCheck;
