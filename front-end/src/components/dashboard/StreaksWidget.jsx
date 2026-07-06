import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";
import {
  Flame,
  Trophy,
  Gift,
  RefreshCw,
  ShieldAlert,
  Calendar,
  Check,
  Coffee,
  Info,
  Sparkles,
} from "lucide-react";
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
      <div className={`w-full animate-pulse flex flex-col gap-6 min-w-[320px] ${isModal ? "p-0 bg-transparent" : "p-6 rounded-[24px] bg-white dark:bg-[#001a40]"}`}>
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
      className={`relative w-full transition-colors duration-300 ${
        isModal
          ? "bg-transparent border-none shadow-none"
          : "max-w-md mx-auto rounded-[32px] overflow-hidden bg-[#fafbfe] dark:bg-[#001a40] border border-slate-100 dark:border-white/10"
      }`}
    >
      <div className={isModal ? "flex flex-col gap-6" : "p-8 flex flex-col gap-10"}>

        {/* Top Section: Flame + Numbers */}
        <div className="flex items-center gap-6">
          {/* Blue Flame Box */}
          <div className="relative shrink-0">
            {/* Soft shadow behind the box */}
            <div className="absolute inset-1 bg-[#405cd2] blur-xl opacity-30 dark:opacity-50 rounded-3xl" />
            
            <motion.div
              className="relative w-28 h-28 rounded-[1.75rem] bg-[#405cd2] flex items-center justify-center shadow-lg shadow-[#405cd2]/20 border border-white/10"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Flame className="w-14 h-14 text-white stroke-[2]" />
            </motion.div>
          </div>

          {/* Stats Box */}
          <div className="flex flex-col justify-center pt-2">
            <div className="flex items-center gap-4">
              <span className="text-[5rem] font-black text-[#0f172a] dark:text-white leading-[0.8] tracking-tighter">
                <AnimatedNumber value={streak} />
              </span>
              <div className="border border-slate-200/80 dark:border-slate-700 rounded-full px-3 py-1 bg-white dark:bg-[#002147] shadow-sm mt-2">
                <span className="text-[11px] font-black text-[#1e3a8a] dark:text-blue-400 tracking-widest uppercase">
                  {t('streaks.day_streak', 'Day Streak')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4 text-slate-500 dark:text-slate-400 ml-1">
              <Trophy className="w-4 h-4 text-[#1e3a8a] dark:text-blue-400 stroke-[2]" />
              <span className="text-[15px] font-semibold">{t('streaks.longest', 'Longest')}:</span>
              <span className="text-[15px] font-black text-[#0f172a] dark:text-white">
                {streakData?.longestStreak || 0} {t('streaks.days', 'days')}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Activity Tracker */}
        <div className="flex flex-col gap-5 mt-2">
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 ml-1">
            <Calendar className="w-4 h-4 stroke-[2]" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest">
              {t('streaks.activity_tracker', 'Daily Activity Tracker (Sundays Rest)')}
            </span>
          </div>

          <div className="flex items-end justify-between gap-2 px-1">
            {trackDays.map((day, idx) => {
              const isActive = day.state === "active";
              const isSunday = day.state === "sunday";
              
              return (
                <div key={idx} className="flex flex-col items-center gap-3 w-[46px]">
                  {/* Pill Box */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    className={`w-full pt-3 pb-4 rounded-[1.5rem] flex flex-col items-center justify-center transition-all shadow-sm ${
                      isActive 
                        ? "bg-[#405cd2] text-white shadow-[#405cd2]/30 border-transparent" 
                        : "bg-white dark:bg-transparent border border-slate-200 dark:border-slate-700 text-slate-400"
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isActive ? "opacity-90" : "text-slate-400"}`}>
                      {day.name}
                    </span>
                    <span className={`text-[17px] font-black leading-none ${isActive ? "" : "text-slate-300 dark:text-slate-500"}`}>
                      {day.date}
                    </span>
                  </motion.div>

                  {/* Icon Below */}
                  <div className="h-5 flex items-center justify-center">
                    {isActive && (
                      <div className="w-4 h-4 rounded-full bg-[#1e3a8a] dark:bg-blue-400 flex items-center justify-center border-2 border-[#fafbfe] dark:border-[#001a40] shadow-sm transform -translate-y-1">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                      </div>
                    )}
                    {isSunday && (
                      <Coffee className="w-4 h-4 text-slate-400 stroke-[2]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Vouchers Banner */}
        <div className="mt-1 flex items-center gap-3 w-full bg-[#f4f6fb] dark:bg-slate-800/50 border border-[#e2e8f0] dark:border-slate-700/50 py-3.5 px-5 rounded-xl shadow-sm">
          <Gift className="w-5 h-5 text-[#1e3a8a] dark:text-blue-400 stroke-[2]" />
          <span className="text-[13px] font-black text-[#1e3a8a] dark:text-blue-400 ml-1 tracking-wide">
            {t('streaks.available_vouchers', 'Available Vouchers')}: {activeVouchers.length}
          </span>
          <Sparkles className="w-4 h-4 text-[#1e3a8a]/60 dark:text-blue-400/60 ml-auto" />
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
            className={`${isModal ? "mb-4" : "mx-8 mb-8"} p-5 rounded-2xl bg-white dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 shadow-sm flex flex-col items-start gap-4`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/20 text-rose-500 rounded-xl shrink-0 mt-0.5 border border-rose-100">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-[15px] font-black text-slate-800 dark:text-white">{t('streaks.broken_title', 'Streak broken!')}</h4>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {t('streaks.restore_instruction', 'Use a voucher to restore to')}{" "}
                  <span className="text-rose-600 dark:text-rose-400 font-black">
                    {streakData.preResetStreak} {t('streaks.days', 'days')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full shrink-0 mt-2">
              {activeVouchers.length > 0 ? (
                <>
                  <select
                    value={selectedVoucher}
                    onChange={(e) => setSelectedVoucher(e.target.value)}
                    className="flex-1 text-[13px] font-bold py-2.5 px-3 bg-slate-50 dark:bg-[#001a40] border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#405cd2]/30"
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
                    className="py-2.5 px-5 bg-[#405cd2] hover:bg-[#304bc2] text-white rounded-xl text-[13px] font-black shadow-md active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-1.5 min-w-[100px]"
                  >
                    <RefreshCw className={`w-4 h-4 ${actionLoading ? "animate-spin" : ""}`} />
                    {t('streaks.restore_button', 'Restore')}
                  </button>
                </>
              ) : (
                <div className="text-[13px] font-black text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 py-2.5 px-4 rounded-xl flex items-center gap-2 border border-rose-100 w-full justify-center">
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
