
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  IconCompass as CapacityIcon,
  IconRocket as CapabilityIcon,
  IconUsers as LeadershipIcon,
  IconCircleCheckFilled as CheckCircle2,
  IconArrowLeft as ArrowLeft,
  IconBolt as Zap,
  IconTrendingUp as TrendingUp,
  IconPlayerPlayFilled as Play,
  IconFingerprint as PIQIcon,
  IconCpu as AIQIcon,
  IconLeaf as SQIcon,
  IconLanguage as BCIcon,
  IconLock as LockIcon,
  IconSearch as SearchIcon,
  IconX as XIcon,
  IconFilter as FilterIcon,
  IconSparkles as SparklesIcon,
  IconTrophy as TrophyIcon,
  IconFlame as FlameIcon,
  IconChevronRight as ChevronRightIcon,
  IconArrowUpRight as ArrowUpRightIcon,
  IconWorld as GlobeIcon,
  IconAward as AwardIcon,
  IconCheck as CheckIcon,
  IconBrain as BrainIcon,
  IconClock as ClockIcon,
  IconCertificate as CertificateIcon,
  IconBook as BookOpen,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { STAGES, TRACKS, PIQ_TRACK, AIQ_TRACK, SQ_TRACK, BC_TRACK } from "@/data/courseStructureData";
import { coursesAPI } from "@/services/api";
import {
  isStageUnlocked as checkStageUnlocked,
  isTrackUnlocked as checkTrackUnlocked,
  isCourseUnlockedInStage,
  isCapacityDevUnlock,
  normalizeCourseId,
  ENFORCE_PROGRESSION_GATES,
} from "@/utils/courseUnlock";

/* ─── Stage visual config ─── */
const STAGE_CONFIG = {
  1: {
    gradient: "from-[#0f172a] via-[#1e1b4b] to-[#312e81]",
    cardBg: "bg-gradient-to-b from-indigo-50/80 via-white to-white dark:from-[#0d1633] dark:via-[#081329] dark:to-[#081329]",
    cardBorder: "border-indigo-200 dark:border-indigo-500/20 hover:border-indigo-400 dark:hover:border-indigo-500/40",
    badgeBg: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30",
    accentColor: "#6366f1",
    lightAccent: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50",
    tag: "Stage 1 • Foundations",
    estimatedTime: "~8.5 Hours",
    Icon: CapacityIcon,
    color: "#6366f1",
    accentGlow: "rgba(99, 102, 241, 0.15)",
  },
  2: {
    gradient: "from-[#042f2e] via-[#115e59] to-[#0d9488]",
    cardBg: "bg-gradient-to-b from-teal-50/80 via-white to-white dark:from-[#072422] dark:via-[#081329] dark:to-[#081329]",
    cardBorder: "border-teal-200 dark:border-teal-500/20 hover:border-teal-400 dark:hover:border-teal-500/40",
    badgeBg: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30",
    accentColor: "#14b8a6",
    lightAccent: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700/50",
    tag: "Stage 2 • Intermediate",
    estimatedTime: "~7.0 Hours",
    Icon: CapabilityIcon,
    color: "#14b8a6",
    accentGlow: "rgba(20, 184, 166, 0.15)",
  },
  3: {
    gradient: "from-[#2e1065] via-[#581c87] to-[#7e22ce]",
    cardBg: "bg-gradient-to-b from-purple-50/80 via-white to-white dark:from-[#1b0d33] dark:via-[#081329] dark:to-[#081329]",
    cardBorder: "border-purple-200 dark:border-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/40",
    badgeBg: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30",
    accentColor: "#a855f7",
    lightAccent: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50",
    tag: "Stage 3 • Advanced",
    estimatedTime: "~5.5 Hours",
    Icon: LeadershipIcon,
    color: "#a855f7",
    accentGlow: "rgba(168, 85, 247, 0.15)",
  },
};

/* ─── Track visual config ─── */
const TRACK_CONFIG = {
  PIQ: {
    gradient: "from-[#31103f] via-[#581c87] to-[#7c3aed]",
    cardBorder: "border-violet-500/20 hover:border-violet-500/50",
    badgeBg: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    accentColor: "#8b5cf6",
    Icon: PIQIcon,
  },
  AIQ: {
    gradient: "from-[#0c2a4a] via-[#1e3a8a] to-[#2563eb]",
    cardBorder: "border-blue-500/20 hover:border-blue-500/50",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    accentColor: "#3b82f6",
    Icon: AIQIcon,
  },
  SQ: {
    gradient: "from-[#064e3b] via-[#047857] to-[#10b981]",
    cardBorder: "border-emerald-500/20 hover:border-emerald-500/50",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accentColor: "#10b981",
    Icon: SQIcon,
  },
  BC: {
    gradient: "from-[#0284c7] via-[#2563eb] to-[#1d4ed8]",
    cardBorder: "border-sky-200 dark:border-sky-500/20 hover:border-sky-400 dark:hover:border-sky-500/40",
    badgeBg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800/40",
    accentColor: "#0284c7",
    Icon: BCIcon,
  },
};



/* ─── Category card (top-level view) ─── */
const CategoryCard = ({ stage, cfg, isUnlocked, completedCount, userProgress, onClick, delay }) => {
  const { t } = useTranslation();
  const [showAllModal, setShowAllModal] = useState(false);
  const { Icon } = cfg;
  const total = stage.totalCourses;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      ${cfg.accentGlow || "rgba(59, 130, 246, 0.15)"},
      transparent 80%
    )
  `;

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const allCourses = stage.courses || [];
  const previewCourses = allCourses.slice(0, 3);
  const remainingCount = Math.max(0, allCourses.length - previewCourses.length);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="h-full relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={isUnlocked ? onClick : () => toast.error(t("my_courses_page.locked_toast", "Please complete previous stages to unlock this stage."))}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          if (isUnlocked) onClick();
          else toast.error(t("my_courses_page.locked_toast", "Please complete previous stages to unlock this stage."));
        }}
        onMouseMove={handleMouseMove}
        className={`w-full h-full text-left p-6 rounded-3xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-between border ${isUnlocked
          ? `${cfg.cardBg || "bg-white dark:bg-[#081329]"} ${cfg.cardBorder || "border-slate-200 dark:border-white/10"} shadow-lg hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer`
          : "bg-slate-50/70 dark:bg-[#050b18]/60 border-slate-200/60 dark:border-white/5 opacity-75 cursor-pointer"
          }`}
      >
        {/* Spotlight Glow Effect */}
        {isUnlocked && (
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 rounded-3xl z-0"
            style={{ background: spotlightBackground }}
          />
        )}

        {/* Dynamic Decorative Accent Gradient Pill */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none transition-transform duration-700 group-hover:scale-125" />

        <div className="relative z-10 space-y-4">
          {/* Top Row: Icon & Tag */}
          <div className="flex items-center justify-between gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-100/80 dark:border-blue-900/30 text-[#1a3884] dark:text-blue-400 group-hover:scale-110"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                }`}
            >
              <Icon stroke={1.8} className="w-7 h-7" />
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${isUnlocked
                  ? cfg.lightAccent || "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                  : "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500"
                  }`}
              >
                {t(`my_courses_page.stage_n`, { n: stage.id })}
              </span>
              <div className="flex items-center gap-2 text-[10px] font-extrabold text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3 h-3 text-slate-400" />
                  {cfg.estimatedTime || "~6 Hrs"}
                </span>
                <span>•</span>
                <span>{total} Modules</span>
              </div>
            </div>
          </div>

          {/* Title & Description */}
          <div>
            <h3
              className={`text-lg font-black tracking-tight mb-1.5 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400 ${isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                }`}
            >
              {t(`my_courses_page.stages.${stage.id}.name`, stage.name)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium">
              {t(`my_courses_page.stages.${stage.id}.description`, stage.description)}
            </p>
          </div>

          {/* Course Preview Tags */}
          {false && allCourses.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Key Topics Preview:
                </span>
                {allCourses.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAllModal((prev) => !prev);
                    }}
                    className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800/40 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewCourses.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {c.title || c.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar & CTA */}
        <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              {t("my_courses_page.progression", "Progression")}
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">
              {completedCount} / {total} Completed ({pct}%)
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1">
              Explore Stage
              <ArrowUpRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
            {!isUnlocked && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                <LockIcon className="w-3 h-3" /> Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Popover Modal - Shows ALL Stage Modules */}
      <AnimatePresence>
        {showAllModal && allCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={() => setShowAllModal(false)}
            className="absolute left-0 right-0 bottom-14 z-50 p-4 bg-white/95 dark:bg-[#071330]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.28)] border border-blue-500/25 dark:border-white/20 space-y-3"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Full Stage Curriculum ({allCourses.length} Modules)
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllModal(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {allCourses.map((c, idx) => (
                <div
                  key={c.id || idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl text-xs font-extrabold bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 shrink-0">
                    {c.id || `M${idx + 1}`}
                  </span>
                  <span className="truncate font-bold">{c.title || c.id}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Track card (Parallel tracks) ─── */
const TrackCard = ({ track, isUnlocked, completedCount, onClick, delay }) => {
  const { t } = useTranslation();
  const total = track.totalCourses;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const cfg = TRACK_CONFIG[track.id] || TRACK_CONFIG.AIQ;
  const Icon = cfg.Icon;
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBackground = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(59, 130, 246, 0.15),
      transparent 80%
    )
  `;

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const previewCourses = (track.courses || []).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="h-full"
    >
      <button
        type="button"
        onClick={isUnlocked ? onClick : () => toast.error(t("my_courses_page.locked_toast", "Please complete required stages first."))}
        onMouseMove={handleMouseMove}
        className={`w-full h-full text-left p-6 rounded-3xl transition-all duration-500 group relative overflow-hidden flex flex-col justify-between border ${isUnlocked
          ? "bg-white dark:bg-[#081329] border-slate-200 dark:border-white/10 hover:border-indigo-500/40 dark:hover:border-indigo-400/40 shadow-lg hover:shadow-2xl hover:-translate-y-1.5 cursor-pointer"
          : "bg-slate-50/70 dark:bg-[#050b18]/60 border-slate-200/60 dark:border-white/5 opacity-75 cursor-pointer"
          }`}
      >
        {/* Spotlight Glow Effect */}
        {isUnlocked && (
          <motion.div
            className="pointer-events-none absolute -inset-px opacity-0 transition duration-500 group-hover:opacity-100 rounded-3xl z-0"
            style={{ background: spotlightBackground }}
          />
        )}

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-100/80 dark:border-blue-900/30 text-[#1a3884] dark:text-blue-400 group-hover:scale-110"
                : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                }`}
            >
              <Icon stroke={1.8} className="w-7 h-7" />
            </div>

            <div className="flex flex-col items-end">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${cfg.badgeBg}`}
              >
                Specialization Track

              </span>
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                {total} {total === 1 ? "Course" : "Courses"}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-1.5 transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
              {track.id === 'BC' ? 'British Council' : t(`my_courses_page.tracks.${track.id}.shortName`, track.shortName || track.name)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 font-medium">
              {t(`my_courses_page.tracks.${track.id}.description`, track.description)}
            </p>
          </div>

          {previewCourses.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Featured Modules:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {previewCourses.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 truncate max-w-[200px]"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: cfg.accentColor }}
                    />
                    {c.title || c.id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 pt-5 mt-4 border-t border-slate-100 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              {t("my_courses_page.progression", "Progression")}
            </span>
            <span className="font-extrabold" style={{ color: cfg.accentColor }}>
              {completedCount} / {total} Completed ({pct}%)
            </span>
          </div>

          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: delay + 0.2, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-1">
              Start Learning Track
              <ArrowUpRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

/* ─── Single course node for horizontal timeline ─── */
const CourseTimelineNode = ({ course, index, isCompleted, isCurrent, isUnlocked, onClick, delay, isLast }) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-start flex-1 min-w-[100px] max-w-[150px] relative group"
    >
      {/* Node column */}
      <div className="flex flex-col items-center w-full">
        {/* Circle button */}
        <motion.button
          type="button"
          onClick={onClick}
          whileHover={isUnlocked || isCompleted || isCurrent ? { scale: 1.12, y: -2 } : {}}
          whileTap={isUnlocked || isCompleted || isCurrent ? { scale: 0.92 } : {}}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 border-2 transition-all duration-300 shadow-lg ${isCompleted
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-300 text-white shadow-emerald-500/25 ring-4 ring-emerald-500/10"
            : isCurrent
              ? "bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 border-blue-300 text-white shadow-blue-500/35 ring-4 ring-blue-500/25 animate-pulse"
              : isUnlocked
                ? "bg-white dark:bg-[#0d1b3e] border-slate-300 dark:border-white/20 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 cursor-pointer shadow-md"
                : "bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-400 cursor-not-allowed"
            }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          ) : isCurrent ? (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          ) : isUnlocked ? (
            <span className="text-sm font-black tracking-tight">{index + 1}</span>
          ) : (
            <LockIcon className="w-4 h-4" />
          )}
        </motion.button>

        {/* Label below circle */}
        <div className="mt-3 flex flex-col items-center text-center px-1 w-full">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border mb-1.5 transition-colors ${isCompleted
              ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60"
              : isCurrent
                ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-black"
                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/10"
              }`}
          >
            {course.courseNumber || course.id}
          </span>
          <p
            className={`text-[11px] font-bold leading-snug line-clamp-2 transition-colors ${isCompleted
              ? "text-emerald-800 dark:text-emerald-300"
              : isCurrent
                ? "text-blue-600 dark:text-blue-400 font-extrabold"
                : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
              }`}
          >
            {course.title || t(`my_courses_page.courses.${course.id}.title`)}
          </p>
        </div>
      </div>

      {/* Horizontal connector line */}
      {!isLast && (
        <div className="absolute top-7 left-[calc(50%+28px)] right-[calc(-50%+28px)] h-1 bg-slate-200 dark:bg-slate-700/60 rounded-full z-0 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: isCompleted
                ? "linear-gradient(to right, #10b981, #14b8a6)"
                : isCurrent
                  ? "linear-gradient(to right, #2563eb, #6366f1)"
                  : "transparent",
            }}
            initial={{ width: "0%" }}
            animate={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
            transition={{ duration: 0.7, delay: delay + 0.15, ease: "easeOut" }}
          />
        </div>
      )}
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
  const completedCount = (stage.courses || []).filter(c => userProgress.completedCourses?.includes(c.id)).length;
  const totalCoursesCount = stage.totalCourses || stage.courses?.length || 1;
  const pct = Math.round((completedCount / totalCoursesCount) * 100);

  const publishedStageCourses = filterPublishedCourses(stage.courses || [], publishedCourseCodes);
  const isAssessmentUnlocked = !ENFORCE_PROGRESSION_GATES || (publishedStageCourses.length > 0 &&
    publishedStageCourses.every(c => userProgress.completedCourses?.includes(c.id)));

  const isCourseUnlocked = (courseId) => isCourseUnlockedInStage(courseId, stage, userProgress);

  const handleCourseClick = (course, courseUnlocked) => {
    if (!courseUnlocked) {
      toast.error(t("my_courses_page.course_locked_toast", "Please complete the previous course first to unlock this module."));
      return;
    }
    if (onCourseClick) onCourseClick(course.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      {/* Back Button */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-[#081329] border border-slate-200/90 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-extrabold hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <ArrowLeft stroke={2.5} className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-blue-600 dark:text-blue-400" />
          {t("my_courses_page.back_to_overview", "Back to Overview")}
        </button>
      </div>

      {/* ── Pristine White Stage Header Banner ── */}
      <section className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#081329] p-6 sm:p-8 text-slate-900 dark:text-white shadow-xl border border-slate-200/90 dark:border-white/10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Left Side: Title & Info */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 shadow-sm">
                <SparklesIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> STAGE DETAIL VIEW
              </span>
              {typeof stage.id === 'number' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/10">
                  Stage {stage.id}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.name`, stage.name) : t(`my_courses_page.tracks.${stage.id}.name`, stage.name)}
            </h1>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.description`, stage.description) : t(`my_courses_page.tracks.${stage.id}.description`, stage.description)}
            </p>
          </div>

          {/* Right Side: Overall Progress Card + Assessment Card Side-by-Side */}
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            {/* Radial Progress Card */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 px-5 py-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm shrink-0 w-full sm:w-auto">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="10" fill="none" />
                  <motion.circle
                    cx="50" cy="50" r="40"
                    className="stroke-blue-600 dark:stroke-blue-400"
                    strokeWidth="10" strokeLinecap="round" fill="none"
                    initial={{ strokeDasharray: "251.2", strokeDashoffset: "251.2" }}
                    animate={{ strokeDashoffset: 251.2 - (251.2 * (pct || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-900 dark:text-white">{pct || 0}%</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Overall Progress</div>
                <div className="text-base font-black text-slate-900 dark:text-white">{completedCount} / {totalCoursesCount} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Modules</span></div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">{totalCoursesCount - completedCount} modules remaining</div>
              </div>
            </div>

            {/* Assessment Gate Card - Placed next to Overall Progress */}
            {stage.assessmentGate && (
              <div
                onClick={() => {
                  if (userProgress.assessmentsPassed?.includes(stage.assessmentGate)) {
                    toast.success("Assessment passed & certified!");
                  } else if (isAssessmentUnlocked) {
                    navigate(`/assessment/${stage.assessmentGate}`);
                  } else {
                    toast.error(`You have to complete all ${publishedStageCourses.length || 10} modules below first!`);
                  }
                }}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 cursor-pointer shadow-sm shrink-0 w-full sm:w-auto ${
                  userProgress.assessmentsPassed?.includes(stage.assessmentGate)
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 hover:shadow-md"
                    : isAssessmentUnlocked
                      ? "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-amber-400 dark:hover:border-amber-700/50"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                  userProgress.assessmentsPassed?.includes(stage.assessmentGate)
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : isAssessmentUnlocked
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                }`}>
                  <TrophyIcon className="w-6 h-6" />
                </div>

                <div className="space-y-0.5 text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Assessment: {stage.assessmentGate}
                  </div>
                  <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    {userProgress.assessmentsPassed?.includes(stage.assessmentGate) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">✓ Passed & Certified</span>
                    ) : isAssessmentUnlocked ? (
                      <span className="text-blue-600 dark:text-blue-400 font-extrabold flex items-center gap-1">Start Assessment →</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">🔒 Locked Assessment</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    {isAssessmentUnlocked
                      ? "Click to start assessment"
                      : `Complete all ${publishedStageCourses.length || 10} modules first`}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Modules List Directory Grid ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Module Directory ({publishedStageCourses.length})
          </h3>
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 hidden sm:inline">
            Click any module card to start learning
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedStageCourses.map((course, idx) => {
            const isCompleted = userProgress.completedCourses?.includes(course.id);
            const isUnlocked = isCourseUnlocked(course.id);
            const isCurrent =
              userProgress.currentCourse === course.id ||
              (!isCompleted && isUnlocked && !userProgress.currentCourse);

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.04 }}
                onClick={() => handleCourseClick(course, isUnlocked)}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer group ${isCompleted
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/30 hover:shadow-lg hover:-translate-y-0.5"
                  : isCurrent
                    ? "bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700/50 shadow-md ring-1 ring-blue-500/20 hover:shadow-xl hover:-translate-y-0.5"
                    : isUnlocked
                      ? "bg-white dark:bg-[#081329] border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/40 shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                      : "bg-slate-50/70 dark:bg-[#050b18]/60 border-slate-200/60 dark:border-white/5 opacity-75 cursor-not-allowed"
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${isCompleted
                        ? "bg-emerald-500 text-white border-emerald-400 shadow-md"
                        : isCurrent
                          ? "bg-blue-600 text-white border-blue-400 shadow-md"
                          : isUnlocked
                            ? "bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-white/10"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        course.courseNumber || course.id
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Module {idx + 1}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            Current
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {course.title || t(`my_courses_page.courses.${course.id}.title`)}
                      </h4>
                    </div>
                  </div>

                  {isCompleted ? (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 shrink-0">
                      ✓ Passed
                    </span>
                  ) : !isUnlocked ? (
                    <LockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : null}
                </div>

                {course.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                    {course.subtitle}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
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
      } finally {
        if (active) setLoadingCourses(false);
      }
    };
    loadCourses();
    return () => { active = false; };
  }, [t]);

  const { activeStages = [], activeTracks = [], activeBcTracks = [] } = useMemo(() => {
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
        name: t("my_courses_page.english_course_title", 'English Course'),
        shortName: 'English Course',
        description: t("my_courses_page.english_course_desc", 'Develop English communication skills with certified interactive modules'),
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
        activeTracks: allFiltered.filter(t => t.id !== 'BC'),
        activeBcTracks: allFiltered.filter(t => t.id === 'BC')
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

    templateTracks.forEach(t => {
      t.courses.sort(sortCourses);
      t.totalCourses = t.courses.length;
    });

    const allFilteredTracks = filterTrackList(templateTracks);

    return {
      activeStages: templateStages.filter(s => s.courses.length > 0),
      activeTracks: allFilteredTracks.filter(t => t.courses.length > 0),
    };
  }, [dbCourses, t, user]);

  const uniqueCompleted = [...new Set((userProgress.completedCourses || []).map(id => normalizeCourseId(id)))];
  const totalCompleted = uniqueCompleted.length;
  const totalCoursesCount =
    (activeStages || []).reduce((a, s) => a + (s.totalCourses || 0), 0) +
    (activeTracks || []).reduce((a, t) => a + (t.totalCourses || 0), 0);
  const overallPct = totalCoursesCount > 0 ? Math.round((totalCompleted / totalCoursesCount) * 100) : 0;

  const selectedStage =
    (activeStages || []).find(s => s.id === selectedStageId) ||
    (activeTracks || []).find(t => t.id === selectedStageId);

  const selectedCfg = STAGE_CONFIG[selectedStageId] || {
    tag: selectedStage?.id + ' Track',
    Icon: Zap,
    color: selectedStage?.color || '#1a3884'
  };

  const { filteredStages, filteredTracks } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const stages = (activeFilterTab === "tracks" || activeFilterTab === "bc")
      ? []
      : !query
        ? activeStages
        : activeStages.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.courses.some(c => (c.title || "").toLowerCase().includes(query))
        );

    let tracksBase = activeTracks;
    if (activeFilterTab === "stages") {
      tracksBase = [];
    } else if (activeFilterTab === "bc") {
      tracksBase = activeTracks.filter(t => t.id === 'BC');
    } else if (activeFilterTab === "tracks") {
      tracksBase = activeTracks.filter(t => t.id !== 'BC');
    }

    const tracks = !query
      ? tracksBase
      : tracksBase.filter(t =>
        t.name.toLowerCase().includes(query) ||
        t.shortName.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.courses.some(c => (c.title || "").toLowerCase().includes(query))
      );

    return {
      filteredStages: stages,
      filteredTracks: tracks,
    };
  }, [activeStages, activeTracks, searchQuery, activeFilterTab]);

  return (
    <div className="w-full relative min-h-screen bg-transparent transition-colors duration-500 overflow-hidden">
      {/* Dynamic Moving Animated Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -50, 40, 0],
            scale: [1, 1.25, 0.9, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-32 -left-32 w-[550px] h-[550px] bg-gradient-to-br from-blue-500/20 via-indigo-500/15 to-purple-500/10 rounded-full blur-[130px]"
        />
        <motion.div
          animate={{
            x: [0, -60, 50, 0],
            y: [0, 50, -60, 0],
            scale: [1, 0.9, 1.2, 1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 via-blue-600/15 to-cyan-400/10 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{
            x: [0, 40, -50, 0],
            y: [0, 60, -30, 0],
            scale: [1, 1.15, 0.85, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] bg-gradient-to-tr from-cyan-500/15 via-blue-500/15 to-purple-600/15 rounded-full blur-[150px]"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        {!selectedStageId && (
          <>
            {/* World-Class Premium White Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#071330] p-5 sm:p-6 lg:p-7 shadow-[0_8px_30px_rgba(26,56,132,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] border border-slate-200/80 dark:border-white/10"
            >
              {/* Soft Ambient Radial Wash Backgrounds */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                {/* Left Side: Title & Subtitle */}
                <div className="space-y-2 max-w-2xl">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#0d1f4e] dark:text-white leading-tight">
                    Human Intelligence & Readiness Pathways
                  </h1>

                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 leading-relaxed font-medium">
                    Experience a structured, multi-tier curriculum designed to build core capability, technical readiness, and vision.
                  </p>

                  {/* Stat Badges Row */}
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-extrabold text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-white/5 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <TrophyIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>{totalCompleted} / {totalCoursesCount} Modules Completed</span>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100/90 dark:bg-white/5 px-3 py-1 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-sm">
                      <FlameIcon className="w-3.5 h-3.5 text-rose-500" />
                      <span>{overallPct}% Overall Completion</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Hero Action (Continue Learning Element) */}
                {continueWatching && (
                  <div className="flex-shrink-0 lg:max-w-md w-full">
                    {continueWatching}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-[#081329] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveFilterTab("all")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${activeFilterTab === "all"
                    ? "bg-[#1a3884] dark:bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                >
                  All Pathways
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab("stages")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${activeFilterTab === "stages"
                    ? "bg-[#1a3884] dark:bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                >
                  Human Intelligence Stages ({activeStages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab("tracks")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${activeFilterTab === "tracks"
                    ? "bg-[#1a3884] dark:bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                >
                  Readiness Tracks ({activeTracks.filter(t => t.id !== 'BC').length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilterTab("bc")}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${activeFilterTab === "bc"
                    ? "bg-[#1a3884] dark:bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10"
                    }`}
                >
                  English Course ({activeTracks.filter(t => t.id === 'BC').length})
                </button>
              </div>

              <div className="relative sm:w-72 flex-shrink-0">
                <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search modules, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        <div className="w-full relative">
          <AnimatePresence mode="wait">
            {!selectedStageId ? (
              <motion.div
                key="cards"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                {filteredStages.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <BrainIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Human Intelligence Stages
                      </h2>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4 hidden sm:block" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {filteredStages.map((stage, i) => {
                        const cfg = STAGE_CONFIG[stage.id] || { tag: `Stage ${stage.id}`, Icon: CapacityIcon, color: "#112b6b" };
                        const unlocked = checkStageUnlocked(stage, userProgress);
                        const completed = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;

                        return (
                          <CategoryCard
                            key={stage.id}
                            stage={stage}
                            cfg={cfg}
                            isUnlocked={unlocked}
                            completedCount={completed}
                            userProgress={userProgress}
                            delay={i * 0.1}
                            onClick={() => setSelectedStageId(stage.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredTracks.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                        <GlobeIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Readiness Tracks & English Course
                      </h2>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-white/10 ml-4 hidden sm:block" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {filteredTracks.map((track, i) => {
                        const unlocked = checkTrackUnlocked(track, userProgress);
                        const completed = track.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;

                        return (
                          <TrackCard
                            key={track.id}
                            track={track}
                            isUnlocked={unlocked}
                            completedCount={completed}
                            delay={0.2 + (i * 0.1)}
                            onClick={() => setSelectedStageId(track.id)}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
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
