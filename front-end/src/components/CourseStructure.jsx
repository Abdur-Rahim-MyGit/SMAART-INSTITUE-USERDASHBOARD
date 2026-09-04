import { forwardRef, useState, useEffect, useMemo } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
// Material Symbols barrel -- the same icon set the dashboard, sidebar and
// profile use. Importing straight from @tabler/icons-react here was the reason
// this page's icons sat at a different weight and optical size to every other
// screen.
import {
  ArrowRight,
  Brain,
  BritishCouncilIcon,
  CheckCircle2,
  Globe2,
  Hub,
  IconArrowLeft,
  Layers,
  Lock,
  Play,
  Search,
  TrendingUp,
  Trophy,
  Users,
  X,
  Zap,
} from "@/components/icons";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { STAGES, PIQ_TRACK, AIQ_TRACK, SQ_TRACK, BC_TRACK } from "@/data/courseStructureData";
import { coursesAPI } from "@/services/api";
import {
  isStageUnlocked as checkStageUnlocked,
  isTrackUnlocked as checkTrackUnlocked,
  isCourseUnlockedInStage,
  isCapacityDevUnlock,
  compareCourseIds,
} from "@/utils/courseUnlock";

/** True when progress records this course as finished, in any of its id forms. */
const isCompletedCourse = (userProgress, courseId) =>
  (userProgress?.completedCourses || []).some((done) => compareCourseIds(done, courseId));

/* ─── Shared surface tokens ───────────────────────────────────────────────
   One place for the card, chip and progress styles so a stage card, a track
   card and a module card cannot drift apart the way they had. The values are
   the dashboard's: #045C9A brand, #072036 ink, #d7ebf5 hairline, #EAF7FD tint,
   #A6D7E8 dark-mode accent. */
const SURFACE =
  "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const SURFACE_HOVER =
  "hover:shadow-xl hover:shadow-[#045C9A]/10 hover:border-[#045C9A]/40 dark:hover:border-[#045C9A]/50";
const SURFACE_MUTED =
  "bg-[#F1F5F9]/80 dark:bg-[#0d3a5f]/50 border border-[#d7ebf5] dark:border-white/5";
const PANEL = "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const CHIP_BRAND =
  "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]";
const CHIP_LOCKED =
  "border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300";
const CHIP_DONE =
  "border border-emerald-200/70 dark:border-emerald-500/25 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
const LABEL = "text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400";
const PROGRESS_TRACK = "h-1.5 w-full overflow-hidden rounded-full bg-[#A6D7E8]/40 dark:bg-white/10";
const PROGRESS_FILL = "linear-gradient(90deg, #034a7d 0%, #045C9A 100%)";

/* ─── Motion system ───────────────────────────────────────────────────────
   One easing curve and one set of variants for the whole page, so nothing
   arrives on its own timing. EASE is the dashboard's curve; the durations are
   deliberately short -- corporate motion should feel like the interface
   settling, not like an animation playing. Everything here collapses to a
   plain cross-fade when the viewer has asked for reduced motion. */
const EASE = [0.25, 0.1, 0.25, 1];

const SECTION = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE, staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE } },
};

const STATIC = { hidden: {}, show: {}, exit: {} };

/* Counts up to its value instead of snapping -- the same treatment the
   dashboard hero gives its progress figure. */
const AnimatedPercent = ({ value, reduced }) => {
  const count = useMotionValue(reduced ? value : 0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (reduced) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.9, delay: 0.25, ease: EASE });
    return controls.stop;
  }, [value, count, reduced]);

  return <motion.span>{rounded}</motion.span>;
};

/* Stage and track glyphs -- abstract business marks rather than pictograms.
   A rocket and a robot face sat oddly next to a page of progress metrics; a
   layered stack, a trend line and a network node read as the same register as
   the rest of the product. Colour is uniform brand blue: the old per-stage
   palette implied a difference between stages that does not exist. */
const STAGE_ICONS = { 1: Layers, 2: TrendingUp, 3: Users };
const TRACK_ICONS = { PIQ: Brain, AIQ: Hub, SQ: Globe2, BC: BritishCouncilIcon };

/* ─── Section heading (bar + label + rule), exactly as on the dashboard ─── */
const SectionHeading = ({ title }) => (
  <div className="flex min-w-0 flex-1 items-center gap-2.5">
    <span className="h-4 w-[3px] shrink-0 rounded-full bg-[#045C9A]" />
    <h2 className="text-xs font-bold uppercase tracking-wider text-[#072036] dark:text-slate-300">
      {title}
    </h2>
    <span className="ml-1 hidden h-px flex-1 bg-[#d7ebf5] dark:bg-white/10 sm:block" />
  </div>
);

/* ─── Pathway card ────────────────────────────────────────────────────────
   One component for both stages and tracks. They are the same object to a
   student -- a titled collection of modules with a progress figure -- so they
   now render through the same markup instead of two near-copies that had
   already drifted in type scale and hover behaviour. */
const PathwayCard = forwardRef(({
  icon: Icon,
  title,
  description,
  badgeLabel,
  metaLabel,
  ctaLabel,
  lockedMessage,
  isUnlocked,
  completedCount,
  total,
  onClick,
  index = 0,
}, ref) => {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const isComplete = total > 0 && completedCount >= total;

  const activate = () => {
    if (isUnlocked) onClick();
    else toast.error(lockedMessage);
  };

  return (
    <motion.div
      ref={ref}
      layout={!reduced}
      initial={reduced ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{
        duration: 0.45,
        delay: Math.min(index, 8) * 0.06,
        ease: EASE,
        layout: { duration: 0.35, ease: EASE },
        exit: { duration: 0.2, ease: EASE },
      }}
      className="h-full"
    >
      <div
        role="button"
        tabIndex={0}
        aria-disabled={!isUnlocked}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          activate();
        }}
        className={`group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#045C9A]/40 ${
          isUnlocked
            ? `${SURFACE} ${SURFACE_HOVER} hover:-translate-y-1.5 active:translate-y-0 active:transition-none motion-reduce:hover:translate-y-0`
            : `${SURFACE_MUTED} hover:-translate-y-0.5 motion-reduce:hover:translate-y-0`
        }`}
      >
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ease-out ${
                isUnlocked
                  ? "border-[#d7ebf5] bg-[#F1F5F9] group-hover:scale-105 group-hover:border-[#045C9A]/50 group-hover:bg-[#EAF7FD] motion-reduce:group-hover:scale-100 dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:group-hover:bg-[#045C9A]/20"
                  : "border-[#d7ebf5] bg-slate-100 dark:border-white/10 dark:bg-white/5"
              }`}
            >
              {isUnlocked ? (
                <Icon className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${CHIP_BRAND}`}
                >
                  {badgeLabel}
                </span>
                {!isUnlocked && (
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP_LOCKED}`}
                  >
                    <Lock className="w-3 h-3" />
                    {t("my_courses_page.locked", "Locked")}
                  </span>
                )}
                {isUnlocked && isComplete && (
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP_DONE}`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {t("my_courses_page.completed", "Completed")}
                  </span>
                )}
              </div>
              <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-tight text-[#072036] dark:text-white">
                {title}
              </h3>
              <p className="mt-0.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                {metaLabel}
              </p>
            </div>
          </div>

          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className={LABEL}>{t("my_courses_page.progression", "Progression")}</span>
              <span className="text-[13px] font-bold tabular-nums text-[#045C9A] dark:text-[#A6D7E8]">
                {completedCount} / {total} · <AnimatedPercent value={pct} reduced={reduced} />%
              </span>
            </div>
            <div className={PROGRESS_TRACK}>
              <motion.div
                initial={reduced ? false : { width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.9, delay: 0.25, ease: EASE }}
                className="h-full rounded-full"
                style={{ background: PROGRESS_FILL }}
              />
            </div>
          </div>

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              activate();
            }}
            className={`group/btn mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors ${
              isUnlocked
                ? "border-[#045C9A]/25 bg-[#EAF7FD] text-[#045C9A] hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/15 dark:bg-white/[0.06] dark:text-[#A6D7E8] dark:hover:border-transparent dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
                : "border-[#d7ebf5] bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400 dark:hover:bg-white/[0.07]"
            }`}
          >
            {isUnlocked ? (
              <>
                {ctaLabel}
                <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                {t("my_courses_page.locked", "Locked")}
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

PathwayCard.displayName = "PathwayCard";

/* ─── Stage detail view ─── */
const filterPublishedCourses = (courses, publishedCourseCodes) => {
  if (isCapacityDevUnlock()) return courses;
  if (!publishedCourseCodes || publishedCourseCodes.size === 0) {
    return courses;
  }
  const filtered = courses.filter((c) => publishedCourseCodes.has(c.id));
  return filtered.length > 0 ? filtered : courses;
};

const StageDetailView = ({ stage, userProgress, onBack, onCourseClick, publishedCourseCodes }) => {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  // Count the same modules the list below shows (published ones), so this
  // figure always matches the "n / total" on the pathway card.
  const publishedStageCourses = filterPublishedCourses(stage.courses || [], publishedCourseCodes);
  const completedCount = publishedStageCourses.filter(c => isCompletedCourse(userProgress, c.id)).length;
  const totalCoursesCount = publishedStageCourses.length || stage.totalCourses || stage.courses?.length || 1;
  const pct = Math.round((completedCount / totalCoursesCount) * 100);
  const remaining = Math.max(0, totalCoursesCount - completedCount);

  const isAssessmentUnlocked =
    publishedStageCourses.length > 0 &&
    publishedStageCourses.every(c => isCompletedCourse(userProgress, c.id));
  const modulesLeftForAssessment = publishedStageCourses.filter(
    c => !isCompletedCourse(userProgress, c.id)
  ).length;
  const isAssessmentPassed = !!userProgress.assessmentsPassed?.includes(stage.assessmentGate);

  const isStage = typeof stage.id === "number";
  const StageIcon = (isStage ? STAGE_ICONS[stage.id] : TRACK_ICONS[stage.id]) || Zap;
  const isCourseUnlocked = (courseId) => isCourseUnlockedInStage(courseId, stage, userProgress);

  const handleCourseClick = (course, courseUnlocked) => {
    if (!courseUnlocked) {
      toast.error(t("my_courses_page.course_locked_toast", "Please complete the previous course first to unlock this module."));
      return;
    }
    if (onCourseClick) onCourseClick(course.id);
  };

  const handleAssessmentClick = () => {
    if (isAssessmentPassed) {
      toast.success(t("my_courses_page.assessment_passed_toast", "Assessment passed & certified!"));
    } else if (isAssessmentUnlocked) {
      navigate(`/assessment/${stage.assessmentGate}`);
    } else {
      toast.error(
        t("my_courses_page.assessment_locked_toast", "Finish the remaining {{count}} module(s) in this stage to unlock the assessment.", {
          count: modulesLeftForAssessment,
        })
      );
    }
  };

  return (
    <motion.div
      variants={reduced ? STATIC : SECTION}
      initial="hidden"
      animate="show"
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Back */}
      <motion.button
        variants={reduced ? STATIC : ITEM}
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-2 rounded-xl border border-[#d7ebf5] bg-white px-4 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-100 dark:hover:bg-[#0d3a5f]/70"
      >
        <IconArrowLeft className="w-3.5 h-3.5 text-[#045C9A] transition-transform group-hover:-translate-x-0.5 dark:text-[#A6D7E8]" />
        {t("my_courses_page.back_to_overview", "Back to Overview")}
      </motion.button>

      {/* Stage header */}
      <motion.section
        variants={reduced ? STATIC : ITEM}
        className={`relative overflow-hidden rounded-2xl ${SURFACE} p-5 sm:p-6`}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

        <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] dark:border-[#045C9A]/30 dark:bg-[#0d3a5f]">
              <StageIcon className="w-6 h-6 text-[#045C9A] dark:text-[#A6D7E8]" />
            </div>
            <div className="min-w-0 max-w-xl space-y-1.5">
              <span
                className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${CHIP_BRAND}`}
              >
                {isStage
                  ? t("my_courses_page.stage_n", { n: stage.id })
                  : stage.id === "BC"
                    ? t("my_courses_page.certified_programme", "Certified Programme")
                    : t("my_courses_page.specialization_track", "Specialization Track")}
              </span>
              <h1 className="text-xl font-bold tracking-tight text-[#072036] dark:text-white sm:text-2xl">
                {isStage
                  ? t(`my_courses_page.stages.${stage.id}.name`, stage.name)
                  : t(`my_courses_page.tracks.${stage.id}.name`, stage.name)}
              </h1>
              <p className="text-sm font-medium leading-relaxed text-[#35566b] dark:text-slate-400">
                {isStage
                  ? t(`my_courses_page.stages.${stage.id}.description`, stage.description)
                  : t(`my_courses_page.tracks.${stage.id}.description`, stage.description)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            {/* Radial progress */}
            <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${PANEL}`}>
              <div className="relative h-11 w-11 shrink-0">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-[#A6D7E8]/50 dark:stroke-white/10" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    className="stroke-[#045C9A] dark:stroke-[#A6D7E8]"
                    strokeWidth="10" strokeLinecap="round" fill="none"
                    initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * (pct || 0)) / 100 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold tabular-nums text-[#072036] dark:text-white">
                    {pct || 0}%
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#072036] dark:text-[#A6D7E8]">
                  {t("my_courses_page.overall_progress", "Overall Progress")}
                </div>
                <div className="text-[15px] font-bold tabular-nums text-[#072036] dark:text-white">
                  {completedCount} / {totalCoursesCount}{" "}
                  <span className="text-[13px] font-semibold text-slate-500 dark:text-slate-400">
                    {t("my_courses_page.modules", "Modules")}
                  </span>
                </div>
                <div className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                  {t("my_courses_page.modules_remaining", "{{count}} remaining", { count: remaining })}
                </div>
              </div>
            </div>

            {/* Assessment gate */}
            {stage.assessmentGate && (
              <button
                type="button"
                onClick={handleAssessmentClick}
                aria-disabled={!isAssessmentUnlocked && !isAssessmentPassed}
                title={
                  isAssessmentUnlocked || isAssessmentPassed
                    ? undefined
                    : t("my_courses_page.complete_modules_first", "Complete all {{count}} modules first", {
                        count: publishedStageCourses.length || totalCoursesCount,
                      })
                }
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300 ${
                  isAssessmentPassed
                    ? "border-emerald-200/70 bg-emerald-50 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-500/25 dark:bg-emerald-500/10"
                    : isAssessmentUnlocked
                      ? "border-[#045C9A]/25 bg-[#EAF7FD] hover:-translate-y-0.5 hover:shadow-md dark:border-[#045C9A]/40 dark:bg-[#045C9A]/15"
                      : "cursor-not-allowed border-[#d7ebf5] bg-[#F1F5F9] opacity-70 grayscale dark:border-white/10 dark:bg-[#072036]/60"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isAssessmentPassed
                      ? "border-emerald-400 bg-emerald-500 text-white"
                      : isAssessmentUnlocked
                        ? "border-[#045C9A] bg-[#045C9A] text-white"
                        : "border-[#d7ebf5] bg-white text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                  }`}
                >
                  {isAssessmentPassed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isAssessmentUnlocked ? (
                    <Trophy className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className={LABEL}>
                    {t("my_courses_page.assessment", "Assessment")} · {stage.assessmentGate}
                  </div>
                  <div className="text-[15px] font-bold text-[#072036] dark:text-white">
                    {isAssessmentPassed
                      ? t("my_courses_page.passed_certified", "Passed & certified")
                      : isAssessmentUnlocked
                        ? t("my_courses_page.start_assessment", "Start assessment")
                        : t("my_courses_page.locked_assessment", "Locked assessment")}
                  </div>
                  <div className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
                    {isAssessmentPassed
                      ? t("my_courses_page.assessment_complete", "Nothing left to do here")
                      : isAssessmentUnlocked
                        ? t("my_courses_page.click_to_start", "Click to begin")
                        : t("my_courses_page.modules_left_first", "{{count}} more module(s) to unlock", {
                            count: modulesLeftForAssessment,
                          })}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Module directory */}
      <motion.div variants={reduced ? STATIC : ITEM} className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <SectionHeading title={t("my_courses_page.module_directory", "Module Directory")} />
          <span className="hidden shrink-0 text-[13px] font-medium text-slate-500 dark:text-slate-400 sm:inline">
            {t("my_courses_page.click_module_hint", "Select a module to start learning")}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(() => {
            // Only ONE module may be "Current": the tracked one, else the first
            // uncompleted unlocked module. (Previously every open module was
            // badged Current, drowning the completed/green states.)
            const firstOpenId = publishedStageCourses.find(
              (c) => !isCompletedCourse(userProgress, c.id) && isCourseUnlocked(c.id)
            )?.id;
            return publishedStageCourses.map((course, idx) => {
              const isCompleted = isCompletedCourse(userProgress, course.id);
              const isUnlocked = isCourseUnlocked(course.id);
              const isCurrent = !isCompleted && (
                userProgress.currentCourse === course.id ||
                (!userProgress.currentCourse && course.id === firstOpenId));

              return (
                <motion.div
                  key={course.id}
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(idx, 8) * 0.045, ease: EASE }}
                  onClick={() => handleCourseClick(course, isUnlocked)}
                  className={`group flex cursor-pointer flex-col gap-3 rounded-2xl p-5 transition-all duration-300 ease-out ${
                    isUnlocked ? "hover:-translate-y-1 motion-reduce:hover:translate-y-0" : ""
                  } ${
                    isCompleted
                      ? "border border-emerald-200/70 bg-emerald-50/50 shadow-sm hover:shadow-lg dark:border-emerald-500/25 dark:bg-emerald-500/[0.07]"
                      : isCurrent
                        ? "border border-[#045C9A]/35 bg-[#EAF7FD]/70 shadow-sm ring-1 ring-[#045C9A]/15 hover:shadow-xl dark:border-[#045C9A]/45 dark:bg-[#045C9A]/10"
                        : isUnlocked
                          ? `${SURFACE} ${SURFACE_HOVER}`
                          : `${SURFACE_MUTED} cursor-not-allowed`
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[13px] font-bold tabular-nums ${
                          isCompleted
                            ? "border-emerald-400 bg-emerald-500 text-white"
                            : isCurrent
                              ? "border-[#045C9A] bg-[#045C9A] text-white"
                              : isUnlocked
                                ? "border-[#d7ebf5] bg-[#F1F5F9] text-[#072036] dark:border-[#045C9A]/30 dark:bg-[#0d3a5f] dark:text-slate-200"
                                : "border-[#d7ebf5] bg-slate-100 text-slate-400 dark:border-white/10 dark:bg-white/5"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isCurrent ? (
                          <Play className="w-5 h-5" />
                        ) : (
                          course.courseNumber || course.id
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={LABEL}>
                            {t("my_courses_page.module_n", "Module {{n}}", { n: idx + 1 })}
                          </span>
                          {isCurrent && (
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP_BRAND}`}
                            >
                              {t("my_courses_page.current", "Current")}
                            </span>
                          )}
                        </div>
                        <h4 className="line-clamp-1 text-[15px] font-bold leading-snug tracking-tight text-[#072036] transition-colors group-hover:text-[#045C9A] dark:text-white dark:group-hover:text-[#A6D7E8]">
                          {course.title || t(`my_courses_page.courses.${course.id}.title`)}
                        </h4>
                      </div>
                    </div>

                    {isCompleted ? (
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CHIP_DONE}`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {t("my_courses_page.passed", "Passed")}
                      </span>
                    ) : !isUnlocked ? (
                      <Lock className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
                    ) : null}
                  </div>

                  {course.subtitle && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {course.subtitle}
                    </p>
                  )}
                </motion.div>
              );
            });
          })()}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const CourseStructure = ({ onCourseClick, userProgress = {}, publishedCourseCodes = null, continueWatching = null, user }) => {
  const { t } = useTranslation();
  const reduced = useReducedMotion();
  const isCourseComplete = (courseId) => isCompletedCourse(userProgress, courseId);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [dbCourses, setDbCourses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterTab, setActiveFilterTab] = useState("all");

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
        if (active) {
          toast.error(t("my_courses_page.courses_load_failed", "Couldn't load the latest courses. Showing a cached view — please refresh to try again."));
        }
      }
    };
    loadCourses();
    return () => { active = false; };
  }, [t]);

  const { activeStages = [], activeTracks = [] } = useMemo(() => {
    const student = user;
    const isStudent = student?.role === 'student' || (!student?.role && student?.college);

    const studentSubscriptionPlan = isStudent
      ? (student?.department?.batch?.subscriptionPlan || user?.department?.batch?.subscriptionPlan || (!student?.department ? user?.college?.subscriptionPlan : null))
      : null;

    const plan = studentSubscriptionPlan?.plan || 'Smaart Core';
    const addons = studentSubscriptionPlan?.addons || {};

    const hasPIQ = !isStudent ? true : (plan === 'Smaart Complete' || !!addons?.piq);
    const hasAIQ = !isStudent ? true : (addons?.aiq !== undefined ? !!addons?.aiq : true);
    const hasSQ = !isStudent ? true : (plan === 'Smaart Standard' || plan === 'Smaart Complete' || !!addons?.sq);
    const hasBC = true; // Always show British Council card

    const filterTrackList = (tracks) => {
      const filtered = [];
      if (hasPIQ && tracks[0]) filtered.push(tracks[0]);
      if (hasAIQ && tracks[1]) filtered.push(tracks[1]);
      if (hasSQ && tracks[2]) filtered.push(tracks[2]);
      if (hasBC && tracks[3]) filtered.push(tracks[3]);
      return filtered;
    };

    const templateStages = [
      {
        id: 1,
        name: 'Capacity',
        subtitle: t("my_courses_page.stage_1_subtitle", 'Stage 1: Foundations'),
        description: t("my_courses_page.stage_1_desc", 'Build foundational skills and resources to perform at your best in any environment.'),
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
        courses: PIQ_TRACK,
        totalCourses: PIQ_TRACK.length,
        unlockAfter: 'S05',
        icon: '🧍',
      },
      {
        id: 'AIQ',
        name: t("my_courses_page.aiq_title", 'AI Readiness Quotient'),
        shortName: 'AIQ',
        description: t("my_courses_page.aiq_desc", 'Master AI tools and work effectively with artificial intelligence'),
        color: '#3B82F6',
        courses: AIQ_TRACK,
        totalCourses: AIQ_TRACK.length,
        unlockAfter: 'S15',
        icon: '🤖',
      },
      {
        id: 'SQ',
        name: t("my_courses_page.sq_title", 'Sustainability Quotient'),
        shortName: 'SQ',
        description: t("my_courses_page.sq_desc", 'Build ethical thinking and sustainability awareness'),
        color: '#10B981',
        courses: SQ_TRACK,
        totalCourses: SQ_TRACK.length,
        unlockAfter: 'S21',
        icon: '🌱',
      },
      {
        id: 'BC',
        name: t("my_courses_page.english_for_work", 'English for Work'),
        shortName: t("my_courses_page.english_for_work", 'English for Work'),
        description: t("my_courses_page.english_course_desc", 'Build the workplace English you need for interviews, meetings and written communication.'),
        color: '#0284c7',
        courses: BC_TRACK,
        totalCourses: BC_TRACK.length,
        unlockAfter: 'S01',
        icon: '💼',
      },
    ];

    if (!dbCourses || dbCourses.length === 0) {
      const allFiltered = filterTrackList(templateTracks);
      return {
        activeStages: STAGES,
        activeTracks: allFiltered,
      };
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
          const titleLower = (dbCourse.title || '').toLowerCase();
          if (
            titleLower.includes('mindset') ||
            titleLower.includes('confidence') ||
            titleLower.includes('motivation') ||
            titleLower.includes('adaptability') ||
            titleLower.includes('personal branding') ||
            titleLower.includes('branding')
          ) {
            templateTracks[0].courses.push(mapped);
          } else if (
            titleLower.includes('ai ') ||
            titleLower.includes(' ai') ||
            titleLower.includes('prompt') ||
            titleLower.includes('artificial intelligence')
          ) {
            templateTracks[1].courses.push(mapped);
          } else if (
            titleLower.includes('sustain') ||
            titleLower.includes('ethical') ||
            titleLower.includes('citizenship') ||
            titleLower.includes('responsibility')
          ) {
            templateTracks[2].courses.push(mapped);
          } else if (
            titleLower.includes('british') ||
            titleLower.includes('council') ||
            titleLower.includes('english')
          ) {
            templateTracks[3].courses.push(mapped);
          } else {
            templateStages[0].courses.push(mapped);
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

    templateTracks.forEach(tr => {
      tr.courses.sort(sortCourses);
      tr.totalCourses = tr.courses.length;
    });

    const allFilteredTracks = filterTrackList(templateTracks);

    return {
      activeStages: templateStages.filter(s => s.courses.length > 0),
      activeTracks: allFilteredTracks.filter(tr => tr.courses.length > 0),
    };
  }, [dbCourses, t, user]);

  const selectedStage =
    (activeStages || []).find(s => s.id === selectedStageId) ||
    (activeTracks || []).find(tr => tr.id === selectedStageId);

  const { filteredStages, filteredTracks, filteredEnglish } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matchesTrack = (tr) =>
      tr.name.toLowerCase().includes(query) ||
      (tr.shortName || "").toLowerCase().includes(query) ||
      tr.description.toLowerCase().includes(query) ||
      tr.courses.some(c => (c.title || "").toLowerCase().includes(query));

    const stages = activeFilterTab !== "all" && activeFilterTab !== "stages"
      ? []
      : !query
        ? activeStages
        : activeStages.filter(st =>
          st.name.toLowerCase().includes(query) ||
          st.description.toLowerCase().includes(query) ||
          st.courses.some(c => (c.title || "").toLowerCase().includes(query))
        );

    const readinessBase = activeFilterTab !== "all" && activeFilterTab !== "tracks"
      ? []
      : activeTracks.filter(tr => tr.id !== "BC");
    const englishBase = activeFilterTab !== "all" && activeFilterTab !== "english"
      ? []
      : activeTracks.filter(tr => tr.id === "BC");

    return {
      filteredStages: stages,
      filteredTracks: query ? readinessBase.filter(matchesTrack) : readinessBase,
      filteredEnglish: query ? englishBase.filter(matchesTrack) : englishBase,
    };
  }, [activeStages, activeTracks, searchQuery, activeFilterTab]);

  const hasResults =
    filteredStages.length > 0 || filteredTracks.length > 0 || filteredEnglish.length > 0;

  const FILTER_TABS = [
    { id: "all", label: t("my_courses_page.all_pathways", "All Pathways") },
    { id: "stages", label: t("my_courses_page.human_intelligence_stages", "Human Intelligence Stages") },
    { id: "tracks", label: t("my_courses_page.readiness_tracks", "Readiness Tracks") },
    { id: "english", label: t("my_courses_page.english_for_work", "English for Work") },
  ];

  return (
    <div className="relative w-full">
      <div className="relative z-10 flex flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
        {!selectedStageId && (
          <>
            {/* ── Page hero ── */}
            <motion.section
              variants={reduced ? STATIC : SECTION}
              initial="hidden"
              animate="show"
              className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
            >
              <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

              <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 max-w-2xl">
                  <motion.h1
                    variants={reduced ? STATIC : ITEM}
                    className="text-xl font-bold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {t("my_courses_page.page_title", "Human Intelligence & Readiness Pathways")}
                  </motion.h1>
                  <motion.p
                    variants={reduced ? STATIC : ITEM}
                    className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm"
                  >
                    {t("my_courses_page.page_subtitle", "A structured, multi-tier curriculum designed to build core capability, technical readiness, and vision.")}
                  </motion.p>
                </div>

                {continueWatching && (
                  <motion.div
                    variants={reduced ? STATIC : ITEM}
                    className="w-full shrink-0 sm:max-w-sm lg:w-auto lg:min-w-[320px]"
                  >
                    {continueWatching}
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* ── Filters & search ── */}
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.12, ease: EASE }}
              className={`flex flex-col items-stretch justify-between gap-4 rounded-2xl p-4 sm:flex-row sm:items-center ${SURFACE}`}
            >
              <div className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {FILTER_TABS.map((tab) => {
                  const isActive = activeFilterTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilterTab(tab.id)}
                      aria-pressed={isActive}
                      className={`relative inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-xl border px-4 text-xs font-bold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#045C9A]/40 ${
                        isActive
                          ? "border-transparent text-white dark:text-[#072036]"
                          : "border-[#d7ebf5] bg-[#F1F5F9] text-slate-600 hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:bg-white/10"
                      }`}
                    >
                      {/* The selected state is one element that travels between
                          tabs, so switching filters reads as a single movement. */}
                      {isActive && (
                        <motion.span
                          layoutId="pathway-filter-pill"
                          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-xl bg-[#045C9A] shadow-sm dark:bg-[#A6D7E8]"
                        />
                      )}
                      <span className="relative">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="group relative w-full shrink-0 sm:w-64 lg:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#045C9A] dark:group-focus-within:text-[#A6D7E8]" />
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  aria-label={t("my_courses_page.search_placeholder", "Search modules, topics...")}
                  placeholder={t("my_courses_page.search_placeholder", "Search modules, topics...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] pl-9 pr-9 text-sm font-medium text-[#072036] placeholder-slate-400 transition-colors focus:border-[#045C9A]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-[#072036]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("my_courses_page.clear_search", "Clear search")}
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-[#EAF7FD] hover:text-[#045C9A] dark:hover:bg-white/10 dark:hover:text-[#A6D7E8]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}

        <div className="relative w-full">
          <AnimatePresence mode="wait">
            {!selectedStageId ? (
              <motion.div
                key="cards"
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="space-y-6 sm:space-y-8"
              >
                {filteredStages.length > 0 && (
                  <motion.section
                    variants={reduced ? STATIC : SECTION}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                  >
                    <motion.div variants={reduced ? STATIC : ITEM}>
                      <SectionHeading
                        title={t("my_courses_page.human_intelligence_stages", "Human Intelligence Stages")}
                      />
                    </motion.div>

                    <motion.div layout={!reduced} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                      {filteredStages.map((stage, i) => {
                        const unlocked = checkStageUnlocked(stage, userProgress);
                        const visibleCourses = filterPublishedCourses(stage.courses || [], publishedCourseCodes);
                        const completed = visibleCourses.filter(c => isCourseComplete(c.id)).length;
                        const total = visibleCourses.length || stage.totalCourses || stage.courses.length;

                        return (
                          <PathwayCard
                            key={stage.id}
                            icon={STAGE_ICONS[stage.id] || Target}
                            title={t(`my_courses_page.stages.${stage.id}.name`, stage.name)}
                            description={t(`my_courses_page.stages.${stage.id}.description`, stage.description)}
                            badgeLabel={t("my_courses_page.stage_n", { n: stage.id })}
                            metaLabel={t("my_courses_page.n_modules", "{{count}} modules", { count: total })}
                            ctaLabel={t("my_courses_page.explore_stage", "Explore Stage")}
                            lockedMessage={t("my_courses_page.locked_toast", "Please complete previous stages to unlock this stage.")}
                            isUnlocked={unlocked}
                            completedCount={completed}
                            total={total}
                            index={i}
                            onClick={() => setSelectedStageId(stage.id)}
                          />
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  </motion.section>
                )}

                {filteredTracks.length > 0 && (
                  <motion.section
                    variants={reduced ? STATIC : SECTION}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="space-y-4"
                  >
                    <motion.div variants={reduced ? STATIC : ITEM}>
                      <SectionHeading
                        title={t("my_courses_page.readiness_tracks", "Readiness Tracks")}
                      />
                    </motion.div>

                    <motion.div layout={!reduced} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                      {filteredTracks.map((track, i) => {
                        const unlocked = checkTrackUnlocked(track, userProgress);
                        const visibleCourses = filterPublishedCourses(track.courses || [], publishedCourseCodes);
                        const completed = visibleCourses.filter(c => isCourseComplete(c.id)).length;
                        const total = visibleCourses.length || track.totalCourses || track.courses.length;

                        return (
                          <PathwayCard
                            key={track.id}
                            icon={TRACK_ICONS[track.id] || Zap}
                            title={t(`my_courses_page.tracks.${track.id}.shortName`, track.shortName || track.name)}
                            description={t(`my_courses_page.tracks.${track.id}.description`, track.description)}
                            badgeLabel={t("my_courses_page.specialization_track", "Specialization Track")}
                            metaLabel={t("my_courses_page.n_courses", "{{count}} courses", { count: total })}
                            ctaLabel={t("my_courses_page.start_track", "Start Track")}
                            lockedMessage={t("my_courses_page.locked_toast", "Please complete required stages first.")}
                            isUnlocked={unlocked}
                            completedCount={completed}
                            total={total}
                            index={i}
                            onClick={() => setSelectedStageId(track.id)}
                          />
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  </motion.section>
                )}

                {/* English for Work — its own pathway. It was previously tacked
                    onto the Readiness Tracks heading, which read as a footnote
                    rather than a programme in its own right. */}
                {filteredEnglish.length > 0 && (
                  <motion.section
                    variants={reduced ? STATIC : SECTION}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, amount: 0.15 }}
                    className="space-y-4"
                  >
                    <motion.div variants={reduced ? STATIC : ITEM}>
                      <SectionHeading title={t("my_courses_page.english_for_work", "English for Work")} />
                    </motion.div>

                    <motion.div layout={!reduced} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <AnimatePresence mode="popLayout">
                      {filteredEnglish.map((track, i) => {
                        const unlocked = checkTrackUnlocked(track, userProgress);
                        const visibleCourses = filterPublishedCourses(track.courses || [], publishedCourseCodes);
                        const completed = visibleCourses.filter(c => isCourseComplete(c.id)).length;
                        const total = visibleCourses.length || track.totalCourses || track.courses.length;

                        return (
                          <PathwayCard
                            key={track.id}
                            icon={TRACK_ICONS[track.id] || BritishCouncilIcon}
                            title={t("my_courses_page.english_for_work", "English for Work")}
                            description={t(`my_courses_page.tracks.${track.id}.description`, track.description)}
                            badgeLabel={t("my_courses_page.certified_programme", "Certified Programme")}
                            metaLabel={t("my_courses_page.n_courses", "{{count}} courses", { count: total })}
                            ctaLabel={t("my_courses_page.start_course", "Start Course")}
                            lockedMessage={t("my_courses_page.locked_toast", "Please complete required stages first.")}
                            isUnlocked={unlocked}
                            completedCount={completed}
                            total={total}
                            index={i}
                            onClick={() => setSelectedStageId(track.id)}
                          />
                        );
                      })}
                      </AnimatePresence>
                    </motion.div>
                  </motion.section>
                )}

                {/* Empty state — a search or filter that matched nothing */}
                {!hasResults && (
                  <motion.div
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className="rounded-2xl border border-dashed border-[#d7ebf5] bg-[#F1F5F9]/60 px-5 py-12 text-center dark:border-white/10 dark:bg-[#072036]/40"
                  >
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white dark:border-white/10 dark:bg-[#0d3a5f]">
                      <Search className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                    </div>
                    <p className="text-[15px] font-bold text-[#072036] dark:text-white">
                      {t("my_courses_page.no_results", "No pathways match your search")}
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {t("my_courses_page.no_results_hint", "Try a different keyword, or switch back to All Pathways.")}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              selectedStage && (
                <motion.div key={`stage-${selectedStageId}`}>
                  <StageDetailView
                    stage={selectedStage}
                    userProgress={userProgress}
                    onBack={() => setSelectedStageId(null)}
                    onCourseClick={onCourseClick}
                    publishedCourseCodes={publishedCourseCodes}
                  />
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CourseStructure;
