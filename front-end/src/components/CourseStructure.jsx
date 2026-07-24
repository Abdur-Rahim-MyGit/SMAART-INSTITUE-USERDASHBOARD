import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  IconStack2 as BookOpen,
  IconActivity as Target,
  IconHierarchy as Crown,
  IconCircleCheckFilled as CheckCircle2,
  IconArrowLeft as ArrowLeft,
  IconBolt as Zap,
  IconTrendingUp as TrendingUp,
  IconPlayerPlayFilled as Play,
  IconFingerprint as Brain,
  IconCpu as Bot,
  IconInfinity as Leaf,
  IconLock as LockIcon
} from "@tabler/icons-react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { STAGES, TRACKS } from "@/data/courseStructureData";
import { coursesAPI } from "@/services/api";
import PageHero from "@/components/ui/PageHero";
import {
  isStageUnlocked as checkStageUnlocked,
  isTrackUnlocked as checkTrackUnlocked,
  isCourseUnlockedInStage,
  isCapacityDevUnlock,
  normalizeCourseId,
} from "@/utils/courseUnlock";

/* ─── Stage visual config ─── */
const STAGE_CONFIG = {
  1: {
    gradient: "from-[#112b6b] to-[#1a3884]",
    gradientText: "from-[#112b6b] via-[#1a3884] to-[#4c6ef5]",
    tag: "Stage 1",
    Icon: BookOpen,
    color: "#112b6b"
  },
  2: {
    gradient: "from-[#1a3884] to-[#2b5a9e]",
    gradientText: "from-[#1a3884] via-[#2b5a9e] to-[#6a93d4]",
    tag: "Stage 2",
    Icon: Target,
    color: "#1a3884"
  },
  3: {
    gradient: "from-[#002147] to-[#112b6b]",
    gradientText: "from-[#002147] via-[#112b6b] to-[#2a4d9e]",
    tag: "Stage 3",
    Icon: Crown,
    color: "#002147"
  },
};

/* ─── Category card (top-level view) ─── */
const CategoryCard = ({ stage, cfg, isUnlocked, completedCount, onClick, delay }) => {
  const { t } = useTranslation();
  const { Icon } = cfg;
  const total = stage.totalCourses;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(26, 56, 132, 0.05),
      transparent 80%
    )
  `;

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <button
        onClick={isUnlocked ? onClick : () => toast.error(t("my_courses_page.locked_toast", "Please complete previous stages to unlock this course."))}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-4 sm:p-5 rounded-[20px] transition-all duration-500 group relative overflow-hidden border border-[#d8e6f7] dark:border-[#1a3884]/20 bg-white dark:bg-[#001630] ${isUnlocked
          ? "hover:-translate-y-1.5 shadow-[0_2px_16px_rgba(26,56,132,0.05)] hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)] cursor-pointer"
          : "cursor-pointer"
          }`}
      >
        {/* Spotlight Effect */}
        {isUnlocked && (
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
            style={{
              background: spotlightBackground,
            }}
          />
        )}

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Icon Box */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
              ? "bg-white border-[#d8e6f7] group-hover:scale-110 group-hover:shadow-md dark:bg-white/5 dark:border-white/10"
              : "bg-white border-[#e2e8f0] opacity-70"
              }`}>
              <Icon stroke={1.5} className={`w-6 h-6 ${isUnlocked ? "text-[#1a3884] dark:text-blue-400" : "text-gray-400"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isUnlocked ? "text-[#1a3884] dark:text-blue-300" : "text-gray-400"
                  }`}>
                  {t("my_courses_page.stage_n", { n: stage.id })}
                </span>
              </div>

              <h3 className={`text-[15px] font-extrabold tracking-tight mb-1.5 ${isUnlocked
                ? "text-[#112b6b] dark:text-white"
                : "text-gray-500 dark:text-slate-400"
                }`} style={{ letterSpacing: "-0.01em" }}>
                {t(`my_courses_page.stages.${stage.id}.name`, stage.name)}
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed font-medium">
                {t(`my_courses_page.stages.${stage.id}.description`, stage.description)}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? "text-gray-700 dark:text-slate-300" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.progression")}
                  </span>
                  <span className={`text-[10px] font-bold ${isUnlocked ? "text-[#1a3884] dark:text-blue-300" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.courses_count", { completed: completedCount, total })}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: delay + 0.3 }}
                    className="h-full rounded-full"
                    style={{
                      background: isUnlocked
                        ? "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)"
                        : "#cbd5e1"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

/* ─── Track card (Parallel tracks) ─── */
const TrackCard = ({ track, isUnlocked, completedCount, onClick, delay }) => {
  const { t } = useTranslation();
  const total = track.totalCourses;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(26, 56, 132, 0.05),
      transparent 80%
    )
  `;

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <button
        onClick={isUnlocked ? onClick : () => toast.error(t("my_courses_page.locked_toast", "Please complete previous stages to unlock this course."))}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-4 sm:p-5 rounded-[20px] transition-all duration-500 group relative overflow-hidden border border-[#d8e6f7] dark:border-[#1a3884]/20 bg-white dark:bg-[#001630] ${isUnlocked
          ? "hover:-translate-y-1.5 shadow-[0_2px_16px_rgba(26,56,132,0.05)] hover:shadow-[0_8px_24px_rgba(26,56,132,0.12)] cursor-pointer"
          : "cursor-pointer"
          }`}
      >
        {/* Spotlight Effect */}
        {isUnlocked && (
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100"
            style={{
              background: spotlightBackground,
            }}
          />
        )}

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {/* Icon Box */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
              ? "bg-white border-[#d8e6f7] group-hover:scale-110 group-hover:shadow-md dark:bg-white/5 dark:border-white/10"
              : "bg-white border-[#e2e8f0] opacity-70"
              }`}>
              {track.id === 'PIQ' && <Brain stroke={1.5} className={`w-6 h-6 ${isUnlocked ? "text-[#1a3884] dark:text-blue-400" : "text-gray-400"}`} />}
              {track.id === 'AIQ' && <Bot stroke={1.5} className={`w-6 h-6 ${isUnlocked ? "text-[#1a3884] dark:text-blue-400" : "text-gray-400"}`} />}
              {track.id === 'SQ' && <Leaf stroke={1.5} className={`w-6 h-6 ${isUnlocked ? "text-[#1a3884] dark:text-blue-400" : "text-gray-400"}`} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isUnlocked ? "text-[#1a3884] dark:text-blue-300" : "text-gray-400"
                  }`}>
                  {t("my_courses_page.specialization_track")}
                </span>
              </div>

              <h3 className={`text-[15px] font-extrabold tracking-tight mb-1.5 ${isUnlocked
                ? "text-[#112b6b] dark:text-white"
                : "text-gray-500 dark:text-slate-400"
                }`} style={{ letterSpacing: "-0.01em" }}>
                {t(`my_courses_page.tracks.${track.id}.shortName`, track.shortName)}
              </h3>
              <p className="text-[12px] text-gray-500 dark:text-slate-400 mb-3 line-clamp-2 leading-relaxed font-medium">
                {t(`my_courses_page.tracks.${track.id}.description`, track.description)}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isUnlocked ? "text-gray-700 dark:text-slate-300" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.progression")}
                  </span>
                  <span className={`text-[10px] font-bold ${isUnlocked ? "text-[#1a3884] dark:text-blue-300" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.courses_count", { completed: completedCount, total })}
                  </span>
                </div>

                <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: delay + 0.3 }}
                    className="h-full rounded-full"
                    style={{
                      background: isUnlocked
                        ? `linear-gradient(90deg, ${track.color} 0%, #1a3884 100%)`
                        : "#cbd5e1"
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

/* ─── Single course card inside the stage view ─── */
const CourseCard = ({ course, index, isCompleted, isCurrent, isUnlocked, onClick, delay }) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`relative rounded-[16px] p-3 sm:p-4 transition-all duration-300 group overflow-hidden border ${isCompleted
        ? "bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 shadow-sm cursor-pointer"
        : isCurrent
          ? "bg-white dark:bg-[#002147] shadow-md border-[#1a3884] dark:border-[#4c6ef5] cursor-pointer"
          : isUnlocked
            ? "bg-white dark:bg-[#002147] hover:shadow-md hover:-translate-y-0.5 border-[#d8e6f7] dark:border-white/10 cursor-pointer"
            : "bg-gray-50/50 dark:bg-slate-900/20 border-dashed border-gray-200 dark:border-slate-800 opacity-60 cursor-not-allowed grayscale-[40%]"
        }`}
      style={{
        borderWidth: isCurrent ? "1.5px" : "1px",
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border ${isCompleted
          ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
          : isCurrent
            ? "bg-[#1a3884] border-[#112b6b] text-white shadow-md"
            : isUnlocked
              ? "bg-slate-50 border-slate-200 text-slate-400 group-hover:border-[#1a3884]/30 group-hover:text-[#1a3884]"
              : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
          }`}>
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : isCurrent ? (
            <Play className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : isUnlocked ? (
            <span className="text-[12px] sm:text-sm font-bold">{index + 1}</span>
          ) : (
            <LockIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" stroke={2} />
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <span className={`inline-block text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded border mb-1.5 uppercase tracking-widest ${isCompleted
            ? "bg-emerald-100/50 border-emerald-200 text-emerald-700"
            : isCurrent
              ? "bg-[#1a3884]/5 border-[#1a3884]/20 text-[#1a3884]"
              : isUnlocked
                ? "bg-slate-50 border-slate-200 text-slate-500"
                : "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-850 text-slate-400 dark:text-slate-500"
            }`}>
            {course.courseNumber || course.id}
          </span>

          <h4 className={`font-bold text-[13px] sm:text-[14px] mb-1 leading-snug tracking-tight ${isUnlocked ? "text-[#112b6b] dark:text-white" : "text-gray-400 dark:text-slate-500"
            }`}>
            {course.title || t(`my_courses_page.courses.${course.id}.title`)}
          </h4>
          <p className="text-[11px] sm:text-[12px] text-gray-500 dark:text-slate-500 leading-relaxed line-clamp-1 font-medium">
            {course.subtitle || course.description || t(`my_courses_page.courses.${course.id}.subtitle`)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Stage detail view ─── */
const filterPublishedCourses = (courses, publishedCourseCodes) => {
  if (isCapacityDevUnlock()) return courses;
  if (!publishedCourseCodes || publishedCourseCodes.size === 0) {
    return courses;
  }
  const filtered = courses.filter((c) => publishedCourseCodes.has(c.id));
  return filtered.length > 0 ? filtered : courses;
};

const StageDetailView = ({ stage, cfg, userProgress, onBack, onCourseClick, publishedCourseCodes }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { Icon } = cfg;
  const completedCount = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;
  const totalCoursesCount = stage.totalCourses || stage.courses?.length || 1;
  const pct = Math.round((completedCount / totalCoursesCount) * 100);

  const publishedStageCourses = filterPublishedCourses(stage.courses, publishedCourseCodes);
  const isAssessmentUnlocked = publishedStageCourses.length > 0 &&
    publishedStageCourses.every(c => userProgress.completedCourses?.includes(c.id));

  const isCourseUnlocked = (courseId) => isCourseUnlockedInStage(courseId, stage, userProgress);

  const handleCourseClick = (course, courseUnlocked) => {
    if (!courseUnlocked) {
      toast.error("Please complete the previous course first to unlock this module.");
      return;
    }
    if (onCourseClick) onCourseClick(course.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
            <ArrowLeft stroke={1.5} className="w-4 h-4" />
          </div>
          {t("my_courses_page.back_to_overview")}
        </button>
      </div>

      {/* Stage header - Refined and Sized Appropriately */}
      <section className="relative mb-8 mt-0 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 flex-1">
          <h1 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
            {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.name`, stage.name) : t(`my_courses_page.tracks.${stage.id}.name`, stage.name)}
          </h1>
          <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
            {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.description`, stage.description) : t(`my_courses_page.tracks.${stage.id}.description`, stage.description)}
          </p>
        </div>

        {/* Stats Section with Visual Progression */}
        <div className="relative z-10 flex-shrink-0 border-t md:border-t-0 md:border-l border-[#d8e6f7] dark:border-[#1a3884]/20 pt-4 md:pt-0 md:pl-6 w-full md:w-auto flex flex-col md:flex-row md:items-center justify-start md:justify-end gap-5">

          <div className="flex items-center gap-5">
            {/* Desktop Progress Ring */}
            <div className="hidden md:block relative w-14 h-14 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-700/50" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="50" cy="50" r="40"
                  className="stroke-[#1a3884] dark:stroke-blue-400"
                  strokeWidth="8" strokeLinecap="round" fill="none"
                  initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                  animate={{ strokeDashoffset: 251.2 - (251.2 * (pct || 0)) / 100 }}
                  transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-black text-[#1a3884] dark:text-blue-300 tabular-nums">{pct || 0}%</span>
              </div>
            </div>

            {/* Mobile Text Percent */}
            <div className="text-center md:hidden">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t("my_courses_page.stage_progress", "Progress")}</div>
              <div className="text-3xl font-black text-[#1a3884] dark:text-blue-300 leading-none tabular-nums">{pct || 0}%</div>
            </div>

            <div className="h-10 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{t("my_courses_page.mastered_count", { count: completedCount })}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">{t("my_courses_page.remaining_count", { count: (stage.totalCourses || stage.courses?.length || 0) - completedCount })}</span>
              </div>
            </div>
          </div>

          {/* Mobile Progress Bar */}
          <div className="md:hidden w-full mt-2">
            <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct || 0}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-[#1a3884] dark:bg-blue-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Course grid - Strictly sequential visibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filterPublishedCourses(stage.courses, publishedCourseCodes).map((course, idx) => {
          const isCompleted = userProgress.completedCourses?.includes(course.id);
          const isUnlocked = isCourseUnlocked(course.id);
          const isCurrent = userProgress.currentCourse === course.id || (!isCompleted && isUnlocked && !userProgress.currentCourse);

          // Always show the course (Unlock All mode)
          // if (!isUnlocked) return null;

          return (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isUnlocked={isUnlocked}
              onClick={() => handleCourseClick(course, isUnlocked)}
              accentColor="#1a3884"
              delay={idx * 0.05}
            />
          );
        })}
      </div>

      {/* Assessment gate banner */}
      {stage.assessmentGate && (
        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 bg-white dark:bg-[#002147] border border-slate-150 dark:border-white/10 rounded-3xl shadow-sm transition-colors duration-300">
          <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-100 dark:border-white/10 flex items-center justify-center flex-shrink-0 shadow-sm">
            <TrendingUp stroke={1.5} className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-[#112b6b] dark:text-white text-[15px]">{t("my_courses_page.assessment_required", { gate: stage.assessmentGate })}</h4>
            <p className="text-gray-500 dark:text-slate-350 text-[13px] font-medium mt-0.5">{t("my_courses_page.assessment_required_desc")}</p>
          </div>
          {userProgress.assessmentsPassed?.includes(stage.assessmentGate) ? (
            <div className="px-4 py-2 rounded-xl text-[11px] font-bold bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-500/20 uppercase tracking-wider shadow-sm shrink-0 mt-3 sm:mt-0">{t("my_courses_page.status_passed")}</div>
          ) : isAssessmentUnlocked ? (
            <button
              onClick={() => navigate(`/assessment/${stage.assessmentGate}`)}
              className="px-5 py-2.5 rounded-xl text-[11px] font-bold bg-gradient-to-r from-[#1a3884] to-[#4c6ef5] hover:from-[#152e6d] hover:to-[#3b5bdb] text-white border border-[#1a3884]/20 hover:border-transparent uppercase tracking-wider shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 shrink-0 mt-3 sm:mt-0 active:translate-y-0"
            >
              {t("my_courses_page.start_assessment", "Start Assessment")}
            </button>
          ) : (
            <div className="px-4 py-2 rounded-xl text-[11px] font-bold bg-[#F8FAFC] dark:bg-[#002A5C] text-gray-500 dark:text-slate-400 border border-slate-100 dark:border-white/10 uppercase tracking-wider shadow-sm shrink-0 mt-3 sm:mt-0">{t("my_courses_page.status_locked")}</div>
          )}
        </div>
      )}
    </motion.div>
  );
};

/* ─── Main Component ─── */
const CourseStructure = ({ onCourseClick, userProgress = {}, publishedCourseCodes = null, continueWatching = null, user }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [dbCourses, setDbCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  useEffect(() => {
    let active = true;
    const loadCourses = async () => {
      try {
        const res = await coursesAPI.getPublished();
        if (active && res?.data) {
          setDbCourses(res.data);
        }
      } catch (err) {
        console.error("Error loading published courses:", err);
      } finally {
        if (active) setLoadingCourses(false);
      }
    };
    loadCourses();
    return () => { active = false; };
  }, []);

  const { activeStages, activeTracks } = useMemo(() => {
    const templateStages = [
      {
        id: 1,
        name: 'Capacity',
        subtitle: t("my_courses_page.stage_1_subtitle", 'Stage 1: Foundations'),
        description: t("my_courses_page.stage_1_desc", 'Build the foundational skills and resources to perform at your best in any environment.'),
        courses: [],
        totalCourses: 0,
        unlockAfter: null,
        assessmentGate: 'T2',
      },
      {
        id: 2,
        name: 'Capability',
        subtitle: t("my_courses_page.stage_2_subtitle", 'Stage 2: Intermediate'),
        description: t("my_courses_page.stage_2_desc", 'Develop core competencies and technical expertise to excel in your chosen field.'),
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S10',
        assessmentGate: 'T3',
      },
      {
        id: 3,
        name: 'Leadership',
        subtitle: t("my_courses_page.stage_3_subtitle", 'Stage 3: Advanced'),
        description: t("my_courses_page.stage_3_desc", 'Cultivate the mindset and vision to lead teams and drive meaningful change.'),
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S19',
        assessmentGate: 'T4',
      },
    ];

    const templateTracks = [
      {
        id: 'PIQ',
        name: t("my_courses_page.piq_title", 'Personal Intelligence Quotient'),
        shortName: 'PIQ',
        description: t("my_courses_page.piq_desc", 'Develop mindset, confidence, and personal effectiveness'),
        color: '#8B5CF6',
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S05',
        icon: '🧍',
      },
      {
        id: 'AIQ',
        name: t("my_courses_page.aiq_title", 'AI Readiness Quotient'),
        shortName: 'AIQ',
        description: t("my_courses_page.aiq_desc", 'Master AI tools and work effectively with artificial intelligence'),
        color: '#3B82F6',
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S15',
        icon: '🤖',
      },
      {
        id: 'SQ',
        name: t("my_courses_page.sq_title", 'Sustainability Quotient'),
        shortName: 'SQ',
        description: t("my_courses_page.sq_desc", 'Build ethical thinking and sustainability awareness'),
        color: '#10B981',
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S21',
        icon: '🌱',
      },
      {
        id: 'British Council',
        name: t("my_courses_page.british_council_title", 'British Council English'),
        shortName: 'BC',
        description: t("my_courses_page.british_council_desc", 'Develop English communication skills with British Council certified courses'),
        color: '#EC4899',
        courses: [],
        totalCourses: 0,
        unlockAfter: 'S01',
        icon: '🇬🇧',
      },
    ];

    if (!dbCourses || dbCourses.length === 0) {
      return { activeStages: STAGES, activeTracks: templateTracks };
    }

    dbCourses.forEach((dbCourse) => {
      const courseCode = dbCourse.courseCode || '';
      const courseNumber = dbCourse.courseNumber || '';
      const category = dbCourse.category || '';
      const mapped = {
        ...dbCourse,
        id: courseCode || dbCourse._id,
        title: dbCourse.title,
        subtitle: dbCourse.description || dbCourse.subtitle || '',
      };

      const isPIQ = category.toLowerCase() === 'piq' ||
        courseCode.startsWith('PIQ') ||
        courseNumber.startsWith('PIQ');

      const isAIQ = category.toLowerCase() === 'aiq' ||
        courseCode.startsWith('AIQ') ||
        courseNumber.startsWith('AIQ');

      const isSQ = category.toLowerCase() === 'sq' ||
        courseCode.startsWith('SQ') ||
        courseNumber.startsWith('SQ');

      const isBC = category.toLowerCase() === 'british council' ||
        courseCode.startsWith('BC') ||
        courseNumber.startsWith('BC');

      if (isPIQ) {
        templateTracks[0].courses.push(mapped);
      } else if (isAIQ) {
        templateTracks[1].courses.push(mapped);
      } else if (isSQ) {
        templateTracks[2].courses.push(mapped);
      } else if (isBC) {
        templateTracks[3].courses.push(mapped);
      } else {
        const codeNumStr = (courseNumber || courseCode).replace(/\D/g, '');
        const codeNum = parseInt(codeNumStr, 10);
        const isS = courseCode.startsWith('S') || courseNumber.startsWith('S');

        if (category.toLowerCase() === 'capacity' || (isS && codeNum <= 10)) {
          templateStages[0].courses.push(mapped);
        } else if (category.toLowerCase() === 'capability' || (isS && codeNum <= 19)) {
          templateStages[1].courses.push(mapped);
        } else if (category.toLowerCase() === 'leadership' || (isS && codeNum <= 25)) {
          templateStages[2].courses.push(mapped);
        } else {
          // Robust semantic fallbacks based on course title
          const titleLower = (dbCourse.title || '').toLowerCase();
          if (
            titleLower.includes('mindset') ||
            titleLower.includes('confidence') ||
            titleLower.includes('motivation') ||
            titleLower.includes('adaptability') ||
            titleLower.includes('personal branding') ||
            titleLower.includes('branding')
          ) {
            templateTracks[0].courses.push(mapped); // PIQ
          } else if (
            titleLower.includes('ai ') ||
            titleLower.includes(' ai') ||
            titleLower.includes('prompt') ||
            titleLower.includes('artificial intelligence')
          ) {
            templateTracks[1].courses.push(mapped); // AIQ
          } else if (
            titleLower.includes('sustain') ||
            titleLower.includes('ethical') ||
            titleLower.includes('citizenship') ||
            titleLower.includes('responsibility')
          ) {
            templateTracks[2].courses.push(mapped); // SQ
          } else if (
            titleLower.includes('british') ||
            titleLower.includes('council') ||
            titleLower.includes('english')
          ) {
            templateTracks[3].courses.push(mapped); // British Council
          } else {
            templateStages[0].courses.push(mapped); // Fallback to Stage 1 Capacity
          }
        }
      }
    });

    const sortCourses = (a, b) => {
      const codeA = a.courseCode || '';
      const codeB = b.courseCode || '';
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    };

    templateStages.forEach(s => {
      s.courses.sort(sortCourses);
      s.totalCourses = s.courses.length;
    });

    templateTracks.forEach(t => {
      t.courses.sort(sortCourses);
      t.totalCourses = t.courses.length;
    });

    // Check active subscription plans and addons from student's department batch or college
    const student = user;
    const isStudent = student?.role === 'student' || (!student?.role && student?.college);

    const studentSubscriptionPlan = isStudent
      ? (student?.department?.batch?.subscriptionPlan || user?.department?.batch?.subscriptionPlan || user?.college?.subscriptionPlan)
      : null;

    const plan = studentSubscriptionPlan?.plan || 'Smaart Core';
    const addons = studentSubscriptionPlan?.addons || {};

    // Determine visibility flags
    const hasPIQ = isStudent && studentSubscriptionPlan ? (plan === 'Smaart Complete' || !!addons?.piq) : true;
    const hasAIQ = isStudent && studentSubscriptionPlan ? !!addons?.aiq : true;
    const hasSQ = isStudent && studentSubscriptionPlan ? (plan === 'Smaart Standard' || plan === 'Smaart Complete' || !!addons?.sq) : true;
    const hasBC = isStudent && studentSubscriptionPlan ? !!addons?.britishCouncil : true;

    const filteredTracks = [];
    if (hasPIQ) filteredTracks.push(templateTracks[0]);
    if (hasAIQ) filteredTracks.push(templateTracks[1]);
    if (hasSQ) filteredTracks.push(templateTracks[2]);
    if (hasBC) filteredTracks.push(templateTracks[3]);

    return {
      activeStages: templateStages.filter(s => s.courses.length > 0),
      activeTracks: filteredTracks.filter(t => t.courses.length > 0)
    };
  }, [dbCourses, t, user]);

  // checkStageUnlocked and checkTrackUnlocked used directly in render (imported aliases)

  const selectedStage = activeStages.find(s => s.id === selectedStageId) || activeTracks.find(t => t.id === selectedStageId);
  const selectedCfg = STAGE_CONFIG[selectedStageId] || {
    tag: selectedStage?.id + ' Track',
    Icon: Zap,
    color: selectedStage?.color || '#1a3884'
  };

  const uniqueCompleted = [...new Set((userProgress.completedCourses || []).map(id => normalizeCourseId(id)))];
  const totalCompleted = uniqueCompleted.length;
  const totalCourses = activeStages.reduce((a, s) => a + s.totalCourses, 0) + activeTracks.reduce((a, t) => a + t.totalCourses, 0);
  const overallPct = totalCourses > 0 ? Math.round((totalCompleted / totalCourses) * 100) : 0;

  const getTrackUnlocked = (track) => checkTrackUnlocked(track, userProgress);

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-[#C0C0C0]/5 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 p-8">
        {/* Page header — standardized PageHero with restored old design */}
        {!selectedStageId && (
          <>
            {/* Back Button - Mobile Only */}
            <div className="mb-4 md:hidden">
              <button
                onClick={() => navigate("/dashboard")}
                className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                  <ArrowLeft stroke={1.5} className="h-4 w-4" />
                </div>
                {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
              </button>
            </div>

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
            >
              <div className="flex-1">
                <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                  {t("my_courses_page.programme", "Smaart Programme")}
                </h1>
                <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                  {t("my_courses_page.programme_desc", "Three stages. Your path to leadership.")}
                </p>
              </div>

              {continueWatching && (
                <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-[#d8e6f7] dark:border-[#1a3884]/20 pt-4 md:pt-0 md:pl-6 w-full md:w-auto flex justify-start md:justify-end">
                  {continueWatching}
                </div>
              )}
            </motion.div>
          </>
        )}

        {/* Main content */}
        <div className="w-full relative z-10">
          <AnimatePresence mode="wait">
            {!selectedStageId ? (
              /* Category cards view */
              <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="space-y-12">
                <div>
                  <h2 className="text-xl font-bold text-[#112b6b] dark:text-white mb-6 px-1 flex items-center gap-3">
                    {t("my_courses_page.human_intelligence_courses")}
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {activeStages.map((stage, i) => {
                      const cfg = STAGE_CONFIG[stage.id] || { tag: `Stage ${stage.id}`, Icon: BookOpen, color: "#112b6b" };
                      const unlocked = checkStageUnlocked(stage, userProgress);
                      const completed = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;

                      return (
                        <CategoryCard
                          key={stage.id}
                          stage={stage}
                          cfg={cfg}
                          isUnlocked={unlocked}
                          completedCount={completed}
                          delay={i * 0.15}
                          onClick={() => {
                            setSelectedStageId(stage.id);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-[#112b6b] dark:text-white mb-6 px-1 flex items-center gap-3">
                    {t("my_courses_page.readiness_tracks")}
                    <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {activeTracks.map((track, i) => {
                      const unlocked = checkTrackUnlocked(track, userProgress);
                      const completed = track.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;

                      return (
                        <TrackCard
                          key={track.id}
                          track={track}
                          isUnlocked={unlocked}
                          completedCount={completed}
                          delay={0.45 + (i * 0.1)}
                          onClick={() => {
                            setSelectedStageId(track.id);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Stage/Track detail view */
              <motion.div key={`stage-${selectedStageId}`}>
                <StageDetailView
                  stage={selectedStage}
                  cfg={selectedCfg}
                  userProgress={userProgress}
                  onBack={() => setSelectedStageId(null)}
                  onCourseClick={onCourseClick}
                  publishedCourseCodes={publishedCourseCodes}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CourseStructure;
