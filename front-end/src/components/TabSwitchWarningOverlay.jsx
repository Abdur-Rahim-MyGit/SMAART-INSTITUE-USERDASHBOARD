import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XOctagon, Eye } from 'lucide-react';

/**
 * TabSwitchWarningOverlay
 *
 * The full-screen warning overlay shown during assessments when
 * a student switches tabs. Uses a 3-strike escalating system:
 *   Level 1 — Orange warning (1/3)
 *   Level 2 — Red warning (2/3)
 *   Level 3 — Auto-submitted
 */
const TabSwitchWarningOverlay = ({ warningLevel, isVisible, onDismiss, violations, maxWarnings }) => {
  const isAutoSubmitted = warningLevel >= 3;

  const config = {
    1: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: 'linear-gradient(135deg, rgba(120,53,15,0.98) 0%, rgba(78,37,10,0.99) 100%)',
      glow: 'rgba(245,158,11,0.2)',
      title: 'Warning — Tab Switch Detected',
      subtitle: 'Switching tabs during an assessment is not allowed.',
      badge: 'Warning 1 of 3',
      badgeColor: 'rgba(245,158,11,0.2)',
      badgeBorder: 'rgba(245,158,11,0.3)',
      badgeText: '#fbbf24',
      buttonText: 'I Understand — Return to Assessment',
      buttonBg: 'linear-gradient(135deg, #d97706, #b45309)',
    },
    2: {
      icon: AlertTriangle,
      color: '#ef4444',
      bg: 'linear-gradient(135deg, rgba(69,10,10,0.99) 0%, rgba(50,7,7,0.99) 100%)',
      glow: 'rgba(239,68,68,0.2)',
      title: 'Final Warning — Do Not Leave',
      subtitle: 'One more tab switch will automatically submit your assessment.',
      badge: 'Warning 2 of 3 — FINAL',
      badgeColor: 'rgba(239,68,68,0.2)',
      badgeBorder: 'rgba(239,68,68,0.4)',
      badgeText: '#f87171',
      buttonText: 'I Understand — Do Not Switch Again',
      buttonBg: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    },
    3: {
      icon: XOctagon,
      color: '#6b7280',
      bg: 'linear-gradient(135deg, rgba(17,24,39,0.99) 0%, rgba(9,12,20,1) 100%)',
      glow: 'rgba(107,114,128,0.15)',
      title: 'Assessment Auto-Submitted',
      subtitle: 'Your assessment has been automatically submitted due to repeated tab switching violations.',
      badge: 'Auto-Submitted',
      badgeColor: 'rgba(107,114,128,0.15)',
      badgeBorder: 'rgba(107,114,128,0.3)',
      badgeText: '#9ca3af',
      buttonText: null,
      buttonBg: null,
    },
  };

  const level = Math.min(warningLevel, 3);
  const cfg = config[level] || config[1];
  const IconComp = cfg.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: cfg.bg }}
        >
          {/* Glow pulse */}
          <motion.div
            animate={isAutoSubmitted ? {} : { opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${cfg.glow} 0%, transparent 60%)`,
            }}
          />

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="relative w-full max-w-lg text-center"
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: isAutoSubmitted ? 0 : [0, -5, 5, -3, 3, 0] }}
              transition={{
                scale: { type: 'spring', stiffness: 300, delay: 0.2 },
                rotate: { duration: 0.5, delay: 0.3 }
              }}
              className="w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${cfg.color}40, ${cfg.color}20)`,
                border: `2px solid ${cfg.color}40`,
                boxShadow: `0 20px 60px ${cfg.color}30`,
              }}
            >
              <IconComp className="w-12 h-12" style={{ color: cfg.color }} />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 font-bold text-xs uppercase tracking-widest"
              style={{
                background: cfg.badgeColor,
                border: `1px solid ${cfg.badgeBorder}`,
                color: cfg.badgeText,
              }}
            >
              <Eye className="w-3 h-3" />
              {cfg.badge}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              style={{ letterSpacing: '-0.03em' }}
            >
              {cfg.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed"
            >
              {cfg.subtitle}
            </motion.p>

            {/* Violation counter (only for non-auto-submitted) */}
            {!isAutoSubmitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="flex items-center justify-center gap-3 mb-8"
              >
                {Array.from({ length: maxWarnings }, (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: i < violations ? cfg.color : 'rgba(255,255,255,0.08)',
                      border: `2px solid ${i < violations ? cfg.color : 'rgba(255,255,255,0.15)'}`,
                      color: i < violations ? '#fff' : 'rgba(255,255,255,0.3)',
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Action button */}
            {cfg.buttonText && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                onClick={onDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 rounded-2xl text-white font-bold text-base"
                style={{
                  background: cfg.buttonBg,
                  boxShadow: `0 12px 24px ${cfg.color}30`,
                }}
              >
                {cfg.buttonText}
              </motion.button>
            )}

            {/* Auto-submit notice */}
            {isAutoSubmitted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="px-6 py-4 rounded-2xl text-white/40 text-sm"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Your results will be processed and you will be redirected shortly...
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TabSwitchWarningOverlay;
