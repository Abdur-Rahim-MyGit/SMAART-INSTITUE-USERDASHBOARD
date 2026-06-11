import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import {
  Flame,
  Trophy,
  Gift,
  RefreshCw,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  Coffee,
  Info,
  Zap,
  Star,
  Sparkles,
} from "lucide-react";
import { streaksAPI } from "@/services/streaksApi";

/* ── Animated counter ─────────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 80, damping: 18 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => { motionVal.set(value); }, [value, motionVal]);
  useEffect(() => display.on("change", (v) => setDisplayed(v)), [display]);

  return <span>{displayed}</span>;
};



/* ── Spark particles ──────────────────────────────────────────── */
const Sparks = ({ count = 10 }) =>
  Array.from({ length: count }).map((_, i) => {
    const angle = (360 / count) * i;
    const dist = 42 + Math.random() * 18;
    const x = Math.cos((angle * Math.PI) / 180) * dist;
    const y = Math.sin((angle * Math.PI) / 180) * dist;
    return (
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
        initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        animate={{ opacity: 0, x, y, scale: 0 }}
        transition={{ duration: 0.85, delay: i * 0.04, ease: "easeOut" }}
        style={{ top: "50%", left: "50%", translateX: "-50%", translateY: "-50%" }}
      />
    );
  });

/* ── Main Widget ──────────────────────────────────────────────── */
const StreaksWidget = () => {
  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedVoucher, setSelectedVoucher] = useState("");
  const [showSparks, setShowSparks] = useState(false);
  const prevStreakRef = useRef(null);

  const fetchStreakStatus = async () => {
    try {
      const response = await streaksAPI.getStatus();
      if (response.success) setStreakData(response.data);
    } catch (err) {
      console.error("Failed to fetch streak status:", err);
    } finally {
      setLoading(false);
    }
  };

  const autoCheckIn = async () => {
    try {
      const res = await streaksAPI.recordActivity();
      if (res.success && res.message &&
        (res.message.includes("incremented") || res.message.includes("preserved"))) {
        setMessage({ type: "success", text: res.message });
      }
    } catch (err) {
      console.error("Auto check-in failed:", err);
    } finally {
      fetchStreakStatus();
    }
  };

  useEffect(() => { autoCheckIn(); }, []);

  useEffect(() => {
    if (streakData?.currentStreak && prevStreakRef.current !== null &&
      streakData.currentStreak > prevStreakRef.current) {
      setShowSparks(true);
      setTimeout(() => setShowSparks(false), 1000);
    }
    prevStreakRef.current = streakData?.currentStreak ?? null;
  }, [streakData?.currentStreak]);

  const handleManualCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    try {
      const response = await streaksAPI.recordActivity();
      if (response.success) {
        setStreakData((prev) => ({
          ...prev,
          currentStreak: response.data.currentStreak,
          longestStreak: response.data.longestStreak,
          lastActivityDate: response.data.lastActivityDate,
          preResetStreak: response.data.preResetStreak,
          canRestore: response.data.preResetStreak > 0,
        }));
        setMessage({ type: "success", text: response.message || "Activity recorded!" });
        fetchStreakStatus();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to check in." });
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
        setStreakData((prev) => ({
          ...prev,
          currentStreak: response.data.currentStreak,
          longestStreak: response.data.longestStreak,
          preResetStreak: 0,
          canRestore: false,
        }));
        setMessage({ type: "success", text: response.message || "Streak restored! 🎉" });
        setSelectedVoucher("");
        fetchStreakStatus();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Failed to restore streak." });
    } finally {
      setActionLoading(false);
    }
  };

  const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getRecentTrackDays = () => {
    const days = [];
    const now = new Date();
    const dow = now.getDay();
    const daysToMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday);

    const activeDates = new Set();
    if (streakData?.currentStreak > 0 && streakData?.lastActivityDate) {
      let S = streakData.currentStreak;
      let iter = new Date(streakData.lastActivityDate);
      let iter_count = 0;
      while (S > 0 && iter_count < 30) {
        iter_count++;
        if (iter.getDay() !== 0) { activeDates.add(getLocalDateString(iter)); S--; }
        iter.setDate(iter.getDate() - 1);
      }
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = getLocalDateString(d);
      const isSunday = d.getDay() === 0;
      let state = "pending";
      if (isSunday) state = "sunday";
      else if (activeDates.has(dateStr)) state = "active";
      days.push({
        name: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(), state,
        isToday: dateStr === getLocalDateString(now),
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className="w-full p-6 rounded-[24px] bg-white dark:bg-[#001a40] animate-pulse flex flex-col gap-6 min-w-[320px]">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#1a3884]/10 dark:bg-white/5" />
          <div className="space-y-2.5">
            <div className="h-8 w-20 bg-[#1a3884]/10 dark:bg-white/5 rounded-md" />
            <div className="h-4 w-36 bg-[#1a3884]/5 dark:bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 aspect-square rounded-xl bg-[#1a3884]/10 dark:bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  const activeVouchers = streakData?.achievements?.filter(
    (a) => a.achievementType === "STREAK_6_DAYS" && a.voucher?.status === "Active"
  ) || [];

  const trackDays = getRecentTrackDays();
  const activeDaysCount = trackDays.filter((d) => d.state === "active").length;
  const streak = streakData?.currentStreak || 0;
  const isMilestone = streak > 0 && streak % 7 === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative w-full rounded-[24px] overflow-hidden bg-white dark:bg-[#001a40] border border-[#1a3884]/15 dark:border-[#1a3884]/30 transition-colors duration-300"
    >
      {/* Background ambience */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a3884]/5 dark:bg-[#4c6ef5]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100/40 dark:bg-[#1a3884]/10 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      {/* Milestone banner */}
      <AnimatePresence>
        {isMilestone && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-gradient-to-r from-[#1a3884] to-[#4c6ef5]"
          >
            <div className="flex items-center justify-center gap-2 py-2 text-white text-xs font-bold tracking-wide">
              <Star className="w-3.5 h-3.5 fill-white" />
              🎉 {streak}-Day Milestone Achieved! Keep going!
              <Star className="w-3.5 h-3.5 fill-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6 flex flex-col gap-6">

        {/* Top row: Icon + Stats + Ring */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">

            {/* Flame icon – navy themed */}
            <div className="relative">
              {streak > 0 && (
                <motion.span
                  className="absolute inset-0 rounded-2xl bg-[#1a3884]/20 dark:bg-[#4c6ef5]/15"
                  animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <AnimatePresence>
                {showSparks && <Sparks count={10} />}
              </AnimatePresence>

              <motion.div
                animate={streak > 0 ? { rotate: [-3, 3, -3] } : {}}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                  streak > 0
                    ? "bg-gradient-to-br from-[#1a3884] to-[#4c6ef5] shadow-[#1a3884]/30"
                    : "bg-slate-100 dark:bg-white/5"
                }`}
              >
                {/* Inner glimmer */}
                {streak > 0 && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                <Flame
                  className={`w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md ${
                    streak > 0 ? "text-white" : "text-slate-400"
                  }`}
                />
              </motion.div>
            </div>

            {/* Streak stats */}
            <div>
              <div className="flex items-end gap-2.5">
                <span className="text-4xl sm:text-5xl font-black text-[#0d1f4e] dark:text-white leading-none tabular-nums">
                  <AnimatedNumber value={streak} />
                </span>
                <span className="mb-1 text-[10px] font-extrabold text-[#1a3884] dark:text-blue-300 uppercase tracking-wider bg-[#1a3884]/8 dark:bg-[#1a3884]/20 px-2.5 py-0.5 rounded-full border border-[#1a3884]/15 dark:border-[#1a3884]/30">
                  Day Streak
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                Longest:{" "}
                <span className="text-[#0d1f4e] dark:text-white font-bold ml-0.5">
                  {streakData?.longestStreak || 0} days
                </span>
              </p>
            </div>
          </div>


        </div>

        {/* Day tracker */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Daily Activity Tracker (Sundays Rest)
          </span>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {trackDays.map((day, idx) => {
              const isActive = day.state === "active";
              const isSunday = day.state === "sunday";
              const isToday = day.isToday;

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.1 + idx * 0.07, duration: 0.35, ease: "easeOut" }}
                  className="relative flex flex-col items-center gap-1 flex-1"
                >
                  <div
                    className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center border font-bold text-xs transition-all duration-300 relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-br from-[#1a3884] to-[#4c6ef5] border-transparent text-white shadow-md shadow-[#1a3884]/25"
                        : isSunday
                        ? "bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/8 text-slate-400"
                        : isToday
                        ? "bg-[#1a3884]/5 dark:bg-[#1a3884]/15 border-[#1a3884] border-2 text-[#1a3884] dark:text-blue-300"
                        : "bg-slate-100 dark:bg-white/[0.04] border-slate-200 dark:border-white/8 text-slate-400 dark:text-slate-600"
                    }`}
                  >
                    {/* Shimmer on active */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          duration: 1.6, delay: 0.6 + idx * 0.1,
                          ease: "easeInOut", repeat: Infinity, repeatDelay: 3.5
                        }}
                      />
                    )}
                    <span className="text-[8px] uppercase font-bold opacity-70 relative z-10">{day.name}</span>
                    <span className="leading-none mt-0.5 text-sm relative z-10">{day.date}</span>
                  </div>

                  {/* Icon below tile */}
                  <div className="h-3 flex items-center justify-center">
                    {isActive && (
                      <CheckCircle2 className="w-3 h-3 text-[#1a3884] dark:text-blue-400 fill-[#1a3884]/10 dark:fill-blue-400/10" />
                    )}
                    {isSunday && <Coffee className="w-3 h-3 text-slate-400" />}
                    {isToday && !isActive && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-[#1a3884] dark:bg-blue-400"
                      />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Voucher banner */}
        {activeVouchers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[11px] font-bold text-[#1a3884] dark:text-blue-300 bg-[#1a3884]/5 dark:bg-[#1a3884]/15 py-2 px-3.5 rounded-xl border border-[#1a3884]/15 dark:border-[#1a3884]/30"
          >
            <Gift className="w-3.5 h-3.5 animate-pulse" />
            <span>Available Vouchers: {activeVouchers.length}</span>
            <Sparkles className="w-3 h-3 ml-auto opacity-60" />
          </motion.div>
        )}
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mx-6 mb-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                : "bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400 border-rose-100 dark:border-rose-900/30"
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Broken & Restore Section */}
      <AnimatePresence>
        {streakData?.canRestore && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mx-6 mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 text-rose-500 rounded-xl shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-white">Streak broken!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Use a voucher to restore to{" "}
                  <span className="text-rose-600 dark:text-rose-400 font-extrabold">
                    {streakData.preResetStreak} days
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              {activeVouchers.length > 0 ? (
                <>
                  <select
                    value={selectedVoucher}
                    onChange={(e) => setSelectedVoucher(e.target.value)}
                    className="flex-1 md:flex-none text-xs font-semibold py-2 px-3 bg-white dark:bg-[#001a40] border border-gray-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1a3884]/30"
                  >
                    <option value="">Select Voucher</option>
                    {activeVouchers.map((v, i) => (
                      <option key={i} value={v.voucher.code}>
                        {v.voucher.code}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRestore(selectedVoucher)}
                    disabled={actionLoading || !selectedVoucher}
                    className="py-2 px-4 bg-[#1a3884] hover:bg-[#112b6b] text-white rounded-xl text-xs font-extrabold shadow-md active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? "animate-spin" : ""}`} />
                    Restore
                  </button>
                </>
              ) : (
                <div className="text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/10 py-1.5 px-3 rounded-lg flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  No Active Vouchers
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
