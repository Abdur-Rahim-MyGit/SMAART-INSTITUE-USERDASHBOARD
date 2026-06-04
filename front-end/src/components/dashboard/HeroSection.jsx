import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { BookOpen, ArrowRight, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from "@/constants/dashboard";
import { resolveStaticCourseTitle, compareCourseIds } from "@/utils/courseUnlock";

const HeroSection = memo(({ userName, paths = [], pathsLoading = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const averageProgress = useMemo(() =>
    paths.length > 0
      ? Math.round(paths.reduce((acc, p) => acc + (p.progress || 0), 0) / paths.length)
      : 0,
    [paths]
  );

  // Derive the active path or fallback to last watched course/module from local storage
  const activePath = paths.length > 0 ? paths[0] : null;
  const lastWatchedCourse = localStorage.getItem("smaart_last_watched_course");
  const storedProgress = parseInt(localStorage.getItem("smaart_course_progress") || "0", 10);
  
  const rawTitle = activePath ? activePath.title : (localStorage.getItem("smaart_last_watched_title") || lastWatchedCourse || "Capacity: Foundations");
  const displayTitle = resolveStaticCourseTitle(rawTitle) || resolveStaticCourseTitle(activePath?.id) || resolveStaticCourseTitle(activePath?.courseCode) || rawTitle;

  const isLastWatched = activePath ? (compareCourseIds(activePath.id, lastWatchedCourse) || compareCourseIds(activePath.courseCode, lastWatchedCourse)) : false;
  const displayProgress = activePath 
    ? Math.max(activePath.progress || 0, isLastWatched ? storedProgress : 0)
    : (storedProgress || averageProgress);

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="relative w-full overflow-hidden rounded-[20px] bg-white dark:bg-[#002147] shadow-sm border border-slate-200/80 dark:border-[#1a3884]/20"
    >
      {/* Subtle right-side accent glow */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/60 to-transparent dark:from-[#1a3884]/10 pointer-events-none" />

      <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* LEFT: Heading in dashboard style */}
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: ANIMATION_DELAYS.HERO, duration: ANIMATION_DURATIONS.NORMAL }}
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t("dashboard.welcome")},{" "}
                  <span className="text-[#1a3884] dark:text-blue-400">{userName || "Student"}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
                  className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5"
                >
                  {t("dashboard.ready_message", "Ready to take the next step in your career journey?")}
                </motion.p>
              </div>
            </div>
          </div>

          {/* RIGHT: Progress + CTA */}
          <div className="flex items-center gap-4 shrink-0 pl-4">
            {/* Overall Progress */}
            <div className="hidden sm:flex flex-col gap-1.5 min-w-[160px] max-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate" title={displayTitle}>
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span className="truncate">{displayTitle}</span>
                </span>
                <span className="text-sm font-extrabold text-[#1a3884] dark:text-blue-400 shrink-0">
                  {pathsLoading ? "—" : `${displayProgress}%`}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                {pathsLoading ? (
                  <div className="h-full w-1/3 bg-slate-200 dark:bg-[#1a3884]/30 rounded-full animate-pulse" />
                ) : (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${displayProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="h-full rounded-full shadow-[0_0_8px_rgba(26,56,132,0.3)]"
                    style={{ background: "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)" }}
                  />
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-8 bg-slate-200 dark:bg-white/10 shrink-0" />

            {/* Continue Learning Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(activePath?.navigateTo || "/dashboard/courses")}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a3884] hover:bg-[#132c6b] dark:bg-[#1a3884] dark:hover:bg-[#112558] text-white rounded-xl text-xs font-bold shadow-md shadow-[#1a3884]/20 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              {t("dashboard.continue_learning", "Continue Learning")}
              <ArrowRight className="w-3 h-3" />
            </motion.button>
          </div>
        </div>

        {/* Mobile: progress bar row */}
        <div className="sm:hidden flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1 gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate" title={displayTitle}>
                {displayTitle}
              </span>
              <span className="text-xs font-extrabold text-[#1a3884] dark:text-blue-400 shrink-0">
                {pathsLoading ? "—" : `${displayProgress}%`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden">
              {pathsLoading ? (
                <div className="h-full w-1/3 bg-slate-200 rounded-full animate-pulse" />
              ) : (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)" }}
                />
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(activePath?.navigateTo || "/dashboard/courses")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3884] text-white rounded-lg text-xs font-bold shadow-sm whitespace-nowrap shrink-0"
          >
            <BookOpen className="w-3 h-3" />
            Continue
          </button>
        </div>
      </div>
    </motion.div>
  );
});

HeroSection.displayName = "HeroSection";
export default HeroSection;
