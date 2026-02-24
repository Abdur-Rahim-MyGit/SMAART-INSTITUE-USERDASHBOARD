/**
 * ContinueLearning - Sunday-based Streak Tracker
 * 
 * Displays the user's streak progress through a weekly cycle:
 * - Days 1-6: Required activity days (Mon-Sat)
 * - Sunday: Mandatory holiday / rest day
 * - Missing any day resets streak to zero
 * - Completing a week awards bonus XP
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Calendar,
  Coffee,
  CheckCircle2,
  Circle,
  Zap,
  Star,
  AlertTriangle,
  PartyPopper
} from "lucide-react";
import "./ContinueLearning.css";
import apiCall from "@/services/api";

// Get day labels based on current locale
const getDayLabels = () => {
  const monday = new Date(2025, 0, 6); // A Monday
  const labels = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
  }
  labels.push('Sun'); // Sunday
  return labels;
};

const DAY_LABELS = getDayLabels();

const ContinueLearning = () => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const fetchStreakStatus = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const data = await apiCall('/avatar/streak-status');

      if (data.success) {
        setStreakData(data.data);
      }
    } catch (err) {
      console.error('Error fetching streak:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const recordActivity = useCallback(async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const data = await apiCall('/avatar/update-streak', {
        method: 'POST'
      });

      if (data.success) {
        const prevCycles = streakData?.cyclesCompleted || 0;
        setStreakData(data.data);

        // Celebration on cycle completion
        if (data.data.cyclesCompleted > prevCycles) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      }
    } catch (err) {
      console.error('Error recording activity:', err);
    }
  }, [streakData]);

  useEffect(() => {
    fetchStreakStatus();
  }, [fetchStreakStatus]);

  // Auto-record activity on first load (if user hasn't been counted today)
  useEffect(() => {
    if (streakData && !loading) {
      const today = new Date();
      const todayStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');

      if (streakData.lastStreakDate !== todayStr) {
        recordActivity();
      }
    }
  }, [streakData?.lastStreakDate, loading]);

  if (loading) {
    return (
      <div className="streak-tracker streak-tracker--loading">
        <div className="streak-tracker__skeleton">
          <div className="streak-skeleton-circle" />
          <div className="streak-skeleton-bars">
            <div className="streak-skeleton-bar" style={{ width: '70%' }} />
            <div className="streak-skeleton-bar" style={{ width: '50%' }} />
          </div>
        </div>
      </div>
    );
  }

  const {
    cycleDay = 0,
    isHoliday = false,
    isActive = false,
    cyclesCompleted = 0,
    totalStreakDays = 0,
    daysUntilHoliday = 0,
    cycleProgress = ['pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'holiday-pending']
  } = streakData || {};

  const progressPercent = cycleDay > 0 ? Math.round((cycleDay / 6) * 100) : 0;

  return (
    <>
      {/* Celebration Overlay */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="streak-celebration-overlay"
          >
            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: 30 }}
              className="streak-celebration-card"
            >
              <PartyPopper className="streak-celebration-icon" />
              <h3>Cycle Complete!</h3>
              <p>You've completed {cyclesCompleted} full cycle{cyclesCompleted !== 1 ? 's' : ''}! Enjoy your Sunday rest.</p>
              <div className="streak-celebration-xp">+50 XP Bonus</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="streak-tracker">
        {/* Header */}
        <div className="streak-tracker__header">
          <div className="streak-tracker__title-group">
            <div className="streak-tracker__icon-wrap">
              <Flame className="streak-tracker__flame-icon" />
            </div>
            <div>
              <h3 className="streak-tracker__title" data-testid="streak-title">Learning Streak</h3>
              <p className="streak-tracker__subtitle" data-testid="streak-subtitle">
                {isHoliday
                  ? "🎉 It's Sunday! Enjoy your rest day."
                  : isActive
                    ? `Day ${cycleDay} of 6 • ${daysUntilHoliday} day${daysUntilHoliday !== 1 ? 's' : ''} until Sunday`
                    : "Start your streak today!"
                }
              </p>
            </div>
          </div>

          <div className="streak-tracker__stats-badges">
            {cyclesCompleted > 0 && (
              <div className="streak-badge streak-badge--cycles" data-testid="streak-cycles">
                <Trophy className="streak-badge__icon" />
                <span>{cyclesCompleted}</span>
              </div>
            )}
            <div className={`streak-badge ${isActive ? 'streak-badge--active' : 'streak-badge--inactive'}`} data-testid="streak-days">
              <Zap className="streak-badge__icon" />
              <span>{totalStreakDays}d</span>
            </div>
          </div>
        </div>

        {/* 7-Day Progress Circles */}
        <div className="streak-tracker__days">
          {cycleProgress.map((status, index) => {
            const isCurrentDay = index + 1 === cycleDay;
            const isHolidayDay = index === 6; // Sunday is the 7th element (index 6)
            
            // Re-evaluate visual logic based on the status explicitly provided by backend
            const isCompleted = status === 'completed' || status === 'holiday';
            const isMissed = status === 'missed';
            const isPending = status === 'pending' || status === 'holiday-pending';

            return (
              <div
                key={index}
                className={`streak-day ${
                  isCompleted ? 'streak-day--completed' : ''
                } ${isCurrentDay ? 'streak-day--current' : ''} ${
                  isMissed ? 'streak-day--missed opacity-50' : ''
                } ${
                  isHolidayDay ? 'streak-day--holiday' : ''
                } ${status === 'holiday' ? 'streak-day--holiday-done' : ''}`}
                data-testid={`streak-day-${index}`}
                data-status={status}
              >
                <div className="streak-day__circle">
                  {isCompleted ? (
                    isHolidayDay ? (
                      <Coffee className="streak-day__icon streak-day__icon--holiday" />
                    ) : (
                      <CheckCircle2 className="streak-day__icon streak-day__icon--check" />
                    )
                  ) : isMissed ? (
                    <div className="streak-day__icon-wrap flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                    </div>
                  ) : isHolidayDay ? (
                    <Coffee className="streak-day__icon streak-day__icon--holiday-pending opacity-50" />
                  ) : isCurrentDay ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Star className="streak-day__icon streak-day__icon--current" />
                    </motion.div>
                  ) : (
                    <Circle className="streak-day__icon streak-day__icon--pending opacity-30" />
                  )}
                </div>
                <span className="streak-day__label">{DAY_LABELS[index]}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="streak-tracker__progress">
          <div className="streak-progress-bar">
            <motion.div
              className="streak-progress-bar__fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              data-testid="streak-progress-fill"
            />
          </div>
          <div className="streak-progress-labels">
            <span className="streak-progress-labels__left" data-testid="streak-progress-left">
              {isActive ? `${progressPercent}% to Sunday` : 'Not started'}
            </span>
            <span className="streak-progress-labels__right" data-testid="streak-progress-right">
              {isHoliday ? '🏖️ Sunday Rest!' : `${6 - cycleDay} days left`}
            </span>
          </div>
        </div>

        {/* Status Message */}
        <div className={`streak-tracker__status ${
          !isActive && cycleDay === 0 ? 'streak-tracker__status--warning' : 'streak-tracker__status--info'
        }`} data-testid="streak-status-container">
          {!isActive && cycleDay === 0 ? (
            <>
              <AlertTriangle className="streak-status__icon" />
              <span data-testid="streak-status-message">No active streak. Log in daily to build your streak!</span>
            </>
          ) : isHoliday ? (
            <>
              <Coffee className="streak-status__icon" />
              <span data-testid="streak-status-message">Enjoy your Sunday rest day. Your streak is safe!</span>
            </>
          ) : (
            <>
              <Calendar className="streak-status__icon" />
              <span data-testid="streak-status-message">
                {cyclesCompleted > 0
                  ? `${cyclesCompleted} cycle${cyclesCompleted > 1 ? 's' : ''} completed • ${totalStreakDays} total streak days`
                  : `Keep coming back daily! ${6 - cycleDay} more days to earn your Sunday rest.`
                }
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ContinueLearning;
