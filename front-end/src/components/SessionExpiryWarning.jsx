import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { apiCall } from '@/services/api';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';

/**
 * SessionExpiryWarning
 *
 * A premium glassmorphism modal that appears at T-5 minutes before
 * the 3-hour session expires. Shows a live countdown, with options
 * to extend the session or log out immediately.
 */
const SessionExpiryWarning = ({ isVisible, secondsLeft, onDismiss }) => {
  const { logout } = useUser();

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const urgency = secondsLeft <= 60 ? 'critical' : secondsLeft <= 120 ? 'urgent' : 'warning';

  const handleExtend = async () => {
    try {
      const response = await apiCall('/auth/renew-token', { method: 'POST' });
      if (response.token) {
        // Update stored token and sessionExpiresAt
        sessionStorage.setItem('token', response.token);
        if (response.sessionExpiresAt) {
          sessionStorage.setItem('sessionExpiresAt', response.sessionExpiresAt);
        } else {
          // Fallback: add 3h from now
          const newExpiry = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
          sessionStorage.setItem('sessionExpiresAt', newExpiry);
        }
        toast.success('Session extended by 3 hours!');
        onDismiss();
      }
    } catch (err) {
      toast.error('Could not extend session. Please save your work and log in again.');
    }
  };

  const handleLogout = async () => {
    onDismiss();
    await logout();
    window.location.href = '/';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(0, 18, 41, 0.75)' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10"
            style={{
              background: 'linear-gradient(135deg, rgba(17,43,107,0.95) 0%, rgba(0,33,71,0.98) 100%)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08) inset',
            }}
          >
            {/* Animated background glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: urgency === 'critical'
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.15) 0%, transparent 60%)'
                  : urgency === 'urgent'
                  ? 'radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.12) 0%, transparent 60%)'
                  : 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 60%)',
              }}
            />

            <div className="relative p-8 text-center">
              {/* Icon */}
              <motion.div
                animate={{ scale: urgency === 'critical' ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: urgency === 'critical' ? Infinity : 0, duration: 0.8 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{
                  background: urgency === 'critical'
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : urgency === 'urgent'
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  boxShadow: urgency === 'critical'
                    ? '0 12px 32px rgba(239,68,68,0.35)'
                    : urgency === 'urgent'
                    ? '0 12px 32px rgba(245,158,11,0.35)'
                    : '0 12px 32px rgba(99,102,241,0.35)',
                }}
              >
                <ShieldAlert className="w-10 h-10 text-white" />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                Session Expiring Soon
              </h2>
              <p className="text-sm text-white/60 mb-6">
                Your 3-hour session will expire automatically. Save your work or extend your session.
              </p>

              {/* Countdown Timer */}
              <div
                className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl mb-8"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Clock className={`w-5 h-5 ${urgency === 'critical' ? 'text-red-400' : urgency === 'urgent' ? 'text-amber-400' : 'text-indigo-400'}`} />
                <span
                  className="text-4xl font-mono font-bold tracking-tight"
                  style={{
                    color: urgency === 'critical' ? '#f87171'
                      : urgency === 'urgent' ? '#fbbf24'
                      : '#a5b4fc',
                  }}
                >
                  {timeStr}
                </span>
                <span className="text-white/40 text-sm font-medium">remaining</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleExtend}
                  className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    boxShadow: '0 12px 24px rgba(79,70,229,0.3)',
                  }}
                >
                  <RefreshCw className="w-5 h-5" />
                  Extend Session (3 more hours)
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:bg-white/10 active:scale-[0.98]"
                  style={{
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)',
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  Log Out Now
                </button>
              </div>

              <p className="mt-4 text-xs text-white/30">
                You will be automatically logged out when the timer reaches 00:00
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionExpiryWarning;
