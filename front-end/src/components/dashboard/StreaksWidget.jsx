import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import {
  Calendar,
  Check,
  Coffee,
  Flame,
  Gift,
  Info,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trophy,
} from "@/components/icons";
import { streaksAPI } from "@/services/streaksApi";
import { useTranslation } from "react-i18next";

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
const StreaksWidget = ({ isModal = false }) => {
  const { t, i18n } = useTranslation();
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
        name: d.toLocaleDateString(i18n.language || "en-US", { weekday: "short" }),
        date: d.getDate(), state,
        isToday: dateStr === getLocalDateString(now),
      });
    }
    return days;
  };

  if (loading) {
    return (
      <div className={`w-full animate-pulse flex flex-col gap-6 min-w-[320px] ${isModal ? "p-0 bg-transparent" : "p-6 rounded-2xl bg-white dark:bg-[#0d3a5f]"}`}>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-[#045C9A]/10 dark:bg-white/5" />
          <div className="space-y-2.5">
            <div className="h-8 w-20 bg-[#045C9A]/10 dark:bg-white/5 rounded-md" />
            <div className="h-4 w-36 bg-[#045C9A]/5 dark:bg-white/5 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 aspect-square rounded-xl bg-[#045C9A]/10 dark:bg-white/5" />
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
      className={`relative w-full transition-colors duration-300 ${
        isModal
          ? "bg-transparent border-none shadow-none"
          : "max-w-md mx-auto rounded-2xl overflow-hidden bg-[#ffffff] dark:bg-[#072036] border border-slate-100 dark:border-white/10"
      }`}
    >
      <div className={isModal ? "flex flex-col gap-5" : "p-5 flex flex-col gap-5"}>

        {/* Top Section: Flame + Numbers */}
        <div className="flex items-center gap-4">
          {/* Flame block. No blur glow, no hover scale - decoration that cost
              height and made a metric panel read like a game screen. */}
          <div className="relative w-14 h-14 shrink-0 rounded-xl bg-[#072036] dark:bg-[#045C9A] flex items-center justify-center">
            <Flame className="w-7 h-7 text-white stroke-[2]" />
          </div>

          {/* Count and its label share one baseline; longest sits beneath. */}
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[32px] font-bold text-[#072036] dark:text-white leading-none tracking-tight">
                <AnimatedNumber value={streak} />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#045C9A] dark:text-[#A6D7E8]">
                {t('streaks.day_streak', 'Day Streak')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1.5 text-slate-500 dark:text-slate-400">
              <Trophy className="w-3.5 h-3.5 shrink-0 text-[#0E2136] dark:text-[#A6D7E8] stroke-[2]" />
              <span className="text-[12px] font-medium">{t('streaks.longest', 'Longest')}:</span>
              <span className="text-[12px] font-bold text-[#072036] dark:text-white">
                {streakData?.longestStreak || 0} {t('streaks.days', 'days')}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Activity Tracker */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <Calendar className="w-3.5 h-3.5 stroke-[2] shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">
              {t('streaks.activity_tracker', 'Daily Activity Tracker (Sundays Rest)')}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 px-1">
            {trackDays.map((day, idx) => {
              const isActive = day.state === "active";
              const isSunday = day.state === "sunday";

              return (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                  {/* Pill Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className={`w-full py-2 rounded-lg flex flex-col items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#072036] dark:bg-[#045C9A] text-white shadow-[#072036]/30 border-transparent"
                        : "bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className={`text-[9px] font-extrabold uppercase tracking-[0.1em] mb-0.5 ${isActive ? "opacity-80" : "text-slate-400"}`}>
                      {day.name}
                    </span>
                    <span className={`text-[13px] font-bold leading-none ${isActive ? "" : "text-slate-400 dark:text-slate-500"}`}>
                      {day.date}
                    </span>
                  </motion.div>

                  {/* Icon Below */}
                  <div className="h-4 flex items-center justify-center">
                    {isActive && (
                      <div className="w-3.5 h-3.5 rounded-full bg-[#045C9A] dark:bg-[#A6D7E8] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white dark:text-[#072036] stroke-[3]" />
                      </div>
                    )}
                    {isSunday && (
                      <Coffee className="w-3.5 h-3.5 text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Vouchers Banner */}
        <div className="flex items-center gap-2.5 w-full bg-[#EAF7FD] dark:bg-white/[0.04] border border-[#d7ebf5] dark:border-white/10 py-2.5 px-3.5 rounded-lg">
          <Gift className="w-4 h-4 shrink-0 text-[#0E2136] dark:text-[#A6D7E8] stroke-[2]" />
          <span className="text-[12px] font-semibold text-[#045C9A] dark:text-[#A6D7E8]">
            {t('streaks.available_vouchers', 'Available Vouchers')}: {activeVouchers.length}
          </span>
          <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#0E2136]/50 dark:text-[#A6D7E8]/50 ml-auto" />
        </div>
      </div>

      {/* Feedback message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isModal ? "mb-4" : "mx-8 mb-6"} p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
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
            className={`${isModal ? "mb-4" : "mx-6 mb-6"} p-3.5 rounded-xl bg-white dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex flex-col items-start gap-3`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-500/20 text-rose-500 rounded-lg shrink-0 border border-rose-100 dark:border-rose-900/40">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 dark:text-white">{t('streaks.broken_title', 'Streak broken!')}</h4>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {t('streaks.restore_instruction', 'Use a voucher to restore to')}{" "}
                  <span className="text-rose-600 dark:text-rose-400 font-bold">
                    {streakData.preResetStreak} {t('streaks.days', 'days')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full shrink-0">
              {activeVouchers.length > 0 ? (
                <>
                  <select
                    value={selectedVoucher}
                    onChange={(e) => setSelectedVoucher(e.target.value)}
                    className="flex-1 min-w-0 text-[12px] font-semibold py-2 px-2.5 bg-slate-50 dark:bg-white/[0.06] border border-slate-200 dark:border-white/15 rounded-lg text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#045C9A]/30"
                  >
                    <option value="">{t('streaks.select_voucher', 'Select Voucher')}</option>
                    {activeVouchers.map((v, i) => (
                      <option key={i} value={v.voucher.code}>
                        {v.voucher.code}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRestore(selectedVoucher)}
                    disabled={actionLoading || !selectedVoucher}
                    className="py-2 px-3.5 shrink-0 bg-[#072036] dark:bg-[#045C9A] hover:bg-[#0d3a5f] dark:hover:bg-[#0673B8] text-white rounded-lg text-[12px] font-semibold disabled:opacity-50 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
                    {t('streaks.restore_button', 'Restore')}
                  </button>
                </>
              ) : (
                <div className="text-[13px] font-bold text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 py-2.5 px-4 rounded-xl flex items-center gap-2 border border-rose-100 w-full justify-center">
                  <Gift className="w-4 h-4" />
                  {t('streaks.no_active_vouchers', 'No Active Vouchers')}
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
