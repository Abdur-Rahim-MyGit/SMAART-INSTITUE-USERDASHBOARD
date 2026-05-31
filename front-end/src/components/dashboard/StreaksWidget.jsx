import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  Trophy,
  Sparkles,
  Gift,
  RefreshCw,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Coffee,
  Info
} from "lucide-react";
import { streaksAPI } from "@/services/streaksApi";

const StreaksWidget = () => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState("");

  const fetchStreakStatus = async () => {
    try {
      const response = await streaksAPI.getStatus();
      if (response.success) {
        setStreakData(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch streak status:", err);
    } finally {
      setLoading(false);
    }
  };

  const autoCheckIn = async () => {
    try {
      // First, record today's activity automatically
      const checkInRes = await streaksAPI.recordActivity();
      if (checkInRes.success && checkInRes.message) {
        // Show active check-in feedback if it was newly recorded or incremented
        if (checkInRes.message.includes("incremented") || checkInRes.message.includes("preserved")) {
          setMessage({
            type: "success",
            text: checkInRes.message
          });
        }
      }
    } catch (err) {
      console.error("Auto check-in failed:", err);
    } finally {
      // Fetch latest state regardless
      fetchStreakStatus();
    }
  };

  useEffect(() => {
    autoCheckIn();
  }, []);

  const handleManualCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await streaksAPI.recordActivity();
      if (response.success) {
        setStreakData(prev => ({
          ...prev,
          currentStreak: response.data.currentStreak,
          longestStreak: response.data.longestStreak,
          lastActivityDate: response.data.lastActivityDate,
          preResetStreak: response.data.preResetStreak,
          canRestore: response.data.preResetStreak > 0
        }));
        setMessage({
          type: "success",
          text: response.message || "Activity recorded successfully!"
        });
        // Refresh full status (for achievements update)
        fetchStreakStatus();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to check in."
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (code) => {
    if (!code) return;
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await streaksAPI.restoreStreak(code);
      if (response.success) {
        setStreakData(prev => ({
          ...prev,
          currentStreak: response.data.currentStreak,
          longestStreak: response.data.longestStreak,
          preResetStreak: 0,
          canRestore: false
        }));
        setMessage({
          type: "success",
          text: response.message || "Streak successfully restored! 🎉"
        });
        setSelectedVoucher("");
        // Refresh full status to show voucher is Redeemed
        fetchStreakStatus();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err.message || "Failed to restore streak."
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to get past 6 calendar days (excluding Sundays) for visualization
  const getRecentTrackDays = () => {
    const days = [];
    const now = new Date();

    // Generate last 6 calendar days
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);

      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const isSunday = d.getDay() === 0;

      // Determine state
      let state = "pending"; // pending, active, sunday

      if (isSunday) {
        state = "sunday";
      } else if (streakData?.lastActivityDate) {
        const dStr = d.toISOString().split("T")[0];
        const lastActStr = new Date(streakData.lastActivityDate).toISOString().split("T")[0];
        if (dStr === lastActStr) {
          state = "active";
        }
      }

      days.push({
        name: dayName,
        date: d.getDate(),
        state,
        isToday: i === 0
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="w-full py-6 px-6 rounded-[24px] bg-white dark:bg-[#002147] border border-gray-100 dark:border-[#1a3884]/20 animate-pulse h-48" />
    );
  }

  const activeVouchers = streakData?.achievements?.filter(
    a => a.achievementType === "STREAK_6_DAYS" && a.voucher?.status === "Active"
  ) || [];

  const trackDays = getRecentTrackDays();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full p-6 sm:p-7 rounded-[24px] overflow-hidden bg-white dark:bg-[#002147] shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100/80 dark:border-[#1a3884]/20 transition-all duration-300"
    >
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-between gap-6">

        {/* Left Side: Flame Icon and Streak Statistics */}
        <div className="flex items-center gap-5">
          <div className="relative">
            {/* Pulsing glow ring for active streaks */}
            {streakData?.currentStreak > 0 && (
              <span className="absolute inset-0 rounded-full bg-orange-500/20 dark:bg-orange-500/10 animate-ping" />
            )}

            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${streakData?.currentStreak > 0
              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/20"
              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}>
              <Flame className={`w-9 h-9 sm:w-11 sm:h-11 ${streakData?.currentStreak > 0 ? "animate-bounce" : ""}`} />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {streakData?.currentStreak || 0}
              </span>
              <span className="text-sm font-extrabold text-amber-500 dark:text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2.5 py-0.5 rounded-full">
                Day Streak
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              Longest Streak: <span className="text-slate-700 dark:text-white font-bold">{streakData?.longestStreak || 0} days</span>
            </p>
          </div>
        </div>

        {/* Middle: Sunday-excluding visual Calendar Tracker */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Daily Activity Tracker (Sundays Rest)
          </span>
          <div className="flex items-center gap-2">
            {trackDays.map((day, idx) => {
              let bgClass = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500";
              let icon = null;

              if (day.state === "active") {
                bgClass = "bg-gradient-to-br from-amber-400 to-orange-500 border-transparent text-white shadow-sm shadow-orange-500/20";
                icon = <CheckCircle2 className="w-3 h-3 text-white absolute -top-1 -right-1 fill-orange-600 border border-white dark:border-[#002147] rounded-full" />;
              } else if (day.state === "sunday") {
                bgClass = "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100/50 dark:border-indigo-900/30 text-indigo-500";
                icon = <Coffee className="w-3 h-3 text-indigo-500 absolute -top-1 -right-1" />;
              }

              return (
                <div key={idx} className="relative flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center border font-bold text-xs sm:text-sm transition-all duration-300 ${bgClass} ${day.isToday ? "ring-2 ring-amber-500/50" : ""}`}>
                    <span className="text-[9px] uppercase font-bold opacity-60">{day.name}</span>
                    <span className="leading-none mt-0.5">{day.date}</span>
                    {icon}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Manual Trigger & Voucher Information */}
        <div className="flex flex-col gap-3 min-w-[200px]">
          <button
            onClick={handleManualCheckIn}
            disabled={actionLoading}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:translate-y-0.5 ${streakData?.currentStreak > 0
              ? "bg-slate-100 hover:bg-slate-200 dark:bg-[#002A5C] dark:hover:bg-[#003575] text-slate-700 dark:text-white"
              : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-orange-500/10"
              }`}
          >
            <Sparkles className="w-4 h-4" />
            {streakData?.currentStreak > 0 ? "Active Today" : "Claim Daily Active Status"}
          </button>

          {activeVouchers.length > 0 && (
            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 border border-emerald-500/20">
              <Gift className="w-3.5 h-3.5 animate-pulse" />
              <span>Available Vouchers: {activeVouchers.length}</span>
            </div>
          )}
        </div>

      </div>

      {/* Action / Feedback Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${message.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
              : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
              }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Broken & Restore Voucher Section */}
      <AnimatePresence>
        {streakData?.canRestore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-900/30 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-red-500/10 dark:bg-red-500/20 text-red-500 rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Your streak has broken!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  You missed the 2-day grace period, but you can use an active 6-day streak voucher to restore your streak back to <span className="text-red-600 dark:text-orange-400 font-extrabold">{streakData.preResetStreak} days</span>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {activeVouchers.length > 0 ? (
                <>
                  <select
                    value={selectedVoucher}
                    onChange={(e) => setSelectedVoucher(e.target.value)}
                    className="flex-1 md:flex-none text-xs font-semibold py-2 px-3 bg-white dark:bg-[#002147] border border-gray-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white focus:outline-none"
                  >
                    <option value="">Select a Voucher</option>
                    {activeVouchers.map((v, i) => (
                      <option key={i} value={v.voucher.code}>
                        {v.voucher.code} (Issued {new Date(v.voucher.issuedAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleRestore(selectedVoucher)}
                    disabled={actionLoading || !selectedVoucher}
                    className="py-2 px-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                    Restore
                  </button>
                </>
              ) : (
                <div className="text-xs font-bold text-red-500 dark:text-red-400 bg-red-500/10 py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  No Active Vouchers Available
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StreaksWidget;
