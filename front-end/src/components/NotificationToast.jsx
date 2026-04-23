/**
 * NotificationToast.jsx
 * ---------------------
 * Listens for newly-pushed WS notifications and renders a brief
 * animated toast in the top-right corner of the screen.
 *
 * Mount this once inside DashboardLayout (or any persistent layout).
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

const TOAST_DURATION = 5000; // ms

export default function NotificationToast() {
  const { notifications } = useNotifications();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const prevCountRef = useRef(0);
  const seenIdsRef = useRef(new Set());

  // Detect new notifications arriving (count increase)
  useEffect(() => {
    if (!notifications.length) return;

    const newOnes = notifications.filter(
      (n) => !n.isRead && !seenIdsRef.current.has(n._id)
    );

    if (newOnes.length === 0) return;

    // Mark as seen
    newOnes.forEach((n) => seenIdsRef.current.add(n._id));

    // Only show the most recent one (avoid flooding)
    const latest = newOnes[0];
    const toastId = `toast-${latest._id || Date.now()}`;

    setToasts((prev) => [
      { ...latest, toastId },
      ...prev.slice(0, 2), // keep max 3 toasts
    ]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
    }, TOAST_DURATION);
  }, [notifications]);

  const dismiss = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  };

  return (
    <div
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.toastId}
            layout
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-[320px] rounded-xl shadow-2xl border border-white/10 overflow-hidden cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            }}
            onClick={() => {
              if (toast.link) navigate(toast.link);
              dismiss(toast.toastId);
            }}
          >
            {/* Accent bar */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: toast.color || '#30919D' }}
            />

            <div className="flex items-start gap-3 p-3">
              {/* Icon */}
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${toast.color || '#30919D'}25` }}
              >
                <Bell className="w-4 h-4" style={{ color: toast.color || '#30919D' }} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-white truncate">{toast.title}</p>
                <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{toast.message}</p>
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(toast.toastId); }}
                className="text-slate-500 hover:text-white transition-colors flex-shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress bar */}
            <motion.div
              className="h-0.5"
              style={{ backgroundColor: toast.color || '#30919D', originX: 0 }}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: TOAST_DURATION / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
