import { memo, useMemo, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

const AnimatedCounter = ({ value }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const controls = animate(count, value, { duration: 1, ease: "easeOut", delay: 0.4 });
    return controls.stop;
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
};
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BookOpen,
  TrendingUp,
} from "@/components/icons";
import { useTranslation } from "react-i18next";
import { ANIMATION_DELAYS, ANIMATION_DURATIONS } from "@/constants/dashboard";
import { resolveStaticCourseTitle, compareCourseIds } from "@/utils/courseUnlock";
import useUser from "@/hooks/useUser";

const HeroSection = memo(({ userName, paths = [], pathsLoading = false, pendingAssessment = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?._id || user?.id || 'anon';

  const averageProgress = useMemo(() =>
    paths.length > 0
      ? Math.round(paths.reduce((acc, p) => acc + (p.progress || 0), 0) / paths.length)
      : 0,
    [paths]
  );

  // Find the first course that isn't fully completed — skip 100%-done courses
  const activePath = paths.length > 0
    ? (paths.find(p => (p.progress || 0) < 100) ?? paths[0])
    : null;
  const lastWatchedCourse = localStorage.getItem(`${userId}_smaart_last_watched_course`) || localStorage.getItem("smaart_last_watched_course");
  const storedProgress = parseInt(localStorage.getItem(`${userId}_smaart_course_progress`) || localStorage.getItem("smaart_course_progress") || "0", 10);

  const rawTitle = activePath ? activePath.title : (localStorage.getItem(`${userId}_smaart_last_watched_title`) || localStorage.getItem("smaart_last_watched_title") || lastWatchedCourse || "Capacity: Foundations");
  const displayTitle = resolveStaticCourseTitle(rawTitle) || resolveStaticCourseTitle(activePath?.id) || resolveStaticCourseTitle(activePath?.courseCode) || rawTitle;

  const isLastWatched = activePath
    ? (compareCourseIds(activePath.id, lastWatchedCourse) || compareCourseIds(activePath.courseCode, lastWatchedCourse))
    : false;

  // Prefer live localStorage progress over stale DB enrollment value when on the active course.
  const enrollmentProgress = activePath?.progress || 0;
  const liveProgress = isLastWatched && storedProgress > 0 ? storedProgress : 0;
  const displayProgress = activePath
    ? Math.max(enrollmentProgress, liveProgress)
    : (storedProgress || averageProgress);

  // Override if there is a pending assessment
  const assessmentDetails = useMemo(() => {
    if (!pendingAssessment) return null;

    let title = `${pendingAssessment} Assessment`;
    let btnLabel = `Start ${pendingAssessment} Assessment`;
    let navPath = `/assessment/${pendingAssessment}`;

    if (pendingAssessment === "T1") {
      title = t("my_courses_page.complete_t1_title", "Complete your T1 Baseline Assessment");
      btnLabel = "Start T1 Assessment";
      navPath = "/dashboard/assessments/baseline";
    } else if (pendingAssessment === "T2") {
      title = "Complete your T2 Intermediate Assessment";
      btnLabel = "Start T2 Assessment";
      navPath = "/assessment/T2";
    } else if (pendingAssessment === "T3") {
      title = "Complete your T3 Advanced Assessment";
      btnLabel = "Start T3 Assessment";
      navPath = "/assessment/T3";
    } else if (pendingAssessment === "T4") {
      title = "Complete your T4 Final Assessment";
      btnLabel = "Start T4 Assessment";
      navPath = "/assessment/T4";
    }

    return { title, btnLabel, navPath };
  }, [pendingAssessment, t]);

  const finalTitle = assessmentDetails ? assessmentDetails.title : displayTitle;
  const finalProgress = pendingAssessment ? 0 : displayProgress;
  const finalBtnLabel = assessmentDetails ? assessmentDetails.btnLabel : t("dashboard.continue_learning", "Continue Learning");

  const handleCTA = () => {
    if (assessmentDetails) {
      navigate(assessmentDetails.navPath);
    } else {
      navigate(activePath?.navigateTo || "/dashboard/courses");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: ANIMATION_DURATIONS.SLOW, ease: "easeOut" }}
      className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-[#0d3a5f] shadow-sm border border-[#d7ebf5]/80 dark:border-[#045C9A]/20"
    >
      {/* Subtle right-side accent glow */}
      <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/60 to-transparent dark:from-[#045C9A]/10 pointer-events-none" />

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
                  <span className="text-[#072036] dark:text-[#A6D7E8]">{userName || "Student"}</span>
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ANIMATION_DELAYS.SUBTITLE, duration: ANIMATION_DURATIONS.NORMAL }}
                  className="text-[#35566b] dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5"
                >
                  {t("dashboard.ready_message", "Ready to take the next step in your career journey?")}
                </motion.p>
              </div>
            </div>
          </div>

          {/* RIGHT: Progress + CTA */}
          <div className="hidden sm:flex items-center gap-4 shrink-0 pl-4">
            {/* Overall Progress */}
            <div className="hidden sm:flex flex-col gap-1.5 min-w-[160px] max-w-[220px]">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[10px] font-bold text-[#072036] dark:text-[#A6D7E8] uppercase tracking-widest truncate" title={finalTitle}>
                  {pendingAssessment ? <Award className="w-3 h-3 shrink-0 text-amber-500 animate-pulse" /> : <TrendingUp className="w-3 h-3 shrink-0" />}
                  <span className="truncate">{finalTitle}</span>
                </span>
                <span className="text-sm font-extrabold text-[#072036] dark:text-[#A6D7E8] shrink-0">
                  {pathsLoading ? "—" : <><AnimatedCounter value={finalProgress} />%</>}
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#A6D7E8]/40 dark:bg-white/10 rounded-full overflow-hidden">
                {pathsLoading ? (
                  <div className="h-full w-1/3 bg-slate-200 dark:bg-[#045C9A]/30 rounded-full animate-pulse" />
                ) : (
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${finalProgress}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                    className="h-full rounded-full shadow-[0_0_8px_rgba(26,56,132,0.3)]"
                    style={{ background: "linear-gradient(90deg, #034a7d 0%, #045C9A 100%)" }}
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
              onClick={handleCTA}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#072036] hover:bg-[#0d3a5f] text-white dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] rounded-xl text-xs font-bold shadow-md shadow-[#072036]/20 dark:shadow-none transition-colors whitespace-nowrap"
            >
              {pendingAssessment ? <Award className="w-3.5 h-3.5 shrink-0 text-amber-300 dark:text-current" /> : <BookOpen className="w-3.5 h-3.5 shrink-0" />}
              {finalBtnLabel}
              <ArrowRight className="w-3 h-3" />
            </motion.button>
          </div>
        </div>

        {/* Mobile: Clean stacked layout */}
        <div className="sm:hidden flex flex-col gap-4 mt-4 pt-4 border-t border-[#d7ebf5] dark:border-white/10">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1.5 gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#072036] dark:text-[#A6D7E8] uppercase tracking-widest truncate" title={finalTitle}>
                {pendingAssessment ? <Award className="w-3 h-3 shrink-0 text-amber-500 animate-pulse" /> : <TrendingUp className="w-3 h-3 shrink-0" />}
                <span className="truncate">{finalTitle}</span>
              </span>
              <span className="text-xs font-extrabold text-[#072036] dark:text-[#A6D7E8] shrink-0">
                {pathsLoading ? "—" : <><AnimatedCounter value={finalProgress} />%</>}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#A6D7E8]/40 dark:bg-white/10 rounded-full overflow-hidden">
              {pathsLoading ? (
                <div className="h-full w-1/3 bg-slate-200 dark:bg-[#045C9A]/30 rounded-full animate-pulse" />
              ) : (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${finalProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                  className="h-full rounded-full shadow-[0_0_8px_rgba(26,56,132,0.3)]"
                  style={{ background: "linear-gradient(90deg, #034a7d 0%, #045C9A 100%)" }}
                />
              )}
            </div>
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCTA}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#072036] hover:bg-[#0d3a5f] text-white dark:bg-[#A6D7E8] dark:hover:bg-white dark:text-[#072036] rounded-xl text-xs font-bold shadow-md shadow-[#072036]/20 dark:shadow-none transition-colors"
          >
            {pendingAssessment ? <Award className="w-3.5 h-3.5 shrink-0 text-amber-300 dark:text-current" /> : <BookOpen className="w-3.5 h-3.5 shrink-0" />}
            {finalBtnLabel}
            <ArrowRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

HeroSection.displayName = "HeroSection";
export default HeroSection;
