import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  PlayCircle,
  Rocket,
  Zap,
} from "@/components/icons";

// ── Colour palettes (cycles per card) ────────────────────────────────────────
const PALETTE = [
  {
    fill: "#1a3884",
    bar: "from-[#1a3884] to-blue-400",
    badge: "bg-[#1a3884]/10 text-[#1a3884] dark:bg-[#1a3884]/20 dark:text-blue-300",
    activeBorder: "#1a3884",
    doneBg: "#1a3884",
    stripe: "from-[#1a3884]/5 via-transparent",
  },
  {
    fill: "#7c3aed",
    bar: "from-violet-600 to-purple-400",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    activeBorder: "#7c3aed",
    doneBg: "#7c3aed",
    stripe: "from-violet-500/5 via-transparent",
  },
  {
    fill: "#0284c7",
    bar: "from-sky-600 to-cyan-400",
    badge: "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    activeBorder: "#0284c7",
    doneBg: "#0284c7",
    stripe: "from-sky-500/5 via-transparent",
  },
  {
    fill: "#059669",
    bar: "from-emerald-600 to-teal-400",
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    activeBorder: "#059669",
    doneBg: "#059669",
    stripe: "from-emerald-500/5 via-transparent",
  },
  {
    fill: "#ea580c",
    bar: "from-orange-600 to-amber-400",
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    activeBorder: "#ea580c",
    doneBg: "#ea580c",
    stripe: "from-orange-500/5 via-transparent",
  },
];

// ── Step node ─────────────────────────────────────────────────────────────────
const StepNode = ({ step, isLast, palette }) => {
  const isDone = step.status === "completed";
  const isActive = step.status === "in_progress";

  return (
    <div className="flex items-center">
      {/* Node column */}
      <div className="flex flex-col items-center">
        {/* Circle */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
            ${isDone ? "shadow-sm" : isActive ? "shadow-lg" : "border-2 border-slate-200 dark:border-slate-600"}`}
          style={
            isDone
              ? { backgroundColor: palette.doneBg }
              : isActive
              ? { border: `2px solid ${palette.activeBorder}`, backgroundColor: `${palette.activeBorder}15` }
              : {}
          }
        >
          {isDone ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : isActive ? (
            <PlayCircle className="w-4 h-4" style={{ color: palette.fill }} />
          ) : (
            <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
          )}
        </div>
        {/* Session label */}
        <span
          className={`mt-1 text-[9px] font-semibold text-center leading-tight max-w-[52px] truncate
            ${isDone ? "text-slate-500 dark:text-slate-400" : isActive ? "font-bold" : "text-slate-300 dark:text-slate-600"}`}
          style={isActive ? { color: palette.fill } : {}}
          title={step.label}
        >
          {step.label}
        </span>
      </div>

      {/* Connector */}
      {!isLast && (
        <div className="relative h-[2px] w-6 sm:w-8 mx-0.5 shrink-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-700" />
          {isDone && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.35 }}
              className={`absolute inset-0 bg-gradient-to-r ${palette.bar} origin-left`}
            />
          )}
        </div>
      )}
    </div>
  );
};

// ── Per-course card ───────────────────────────────────────────────────────────
const CourseRoadmapCard = ({ course, index, palette }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const totalStages = course.stages.length;
  const completedStages = course.stages.filter((s) => s.status === "completed").length;
  const activeStage = course.stages.find((s) => s.status === "in_progress");
  const isNotStarted = course.progress === 0;

  const MAX_VISIBLE = 7;
  const visibleStages = expanded ? course.stages : course.stages.slice(0, MAX_VISIBLE);
  const hasMore = course.stages.length > MAX_VISIBLE;

  // SVG circle maths (r=15.9, circumference≈100 for convenience)
  const circumference = 97.4; // 2π × 15.5 ≈ 97.4
  const strokeDash = (course.progress / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.38, ease: "easeOut" }}
      className="relative group bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80
                 dark:border-[#1a3884]/20 shadow-sm hover:shadow-md hover:border-slate-300
                 dark:hover:border-[#1a3884]/40 transition-all duration-300 overflow-hidden"
    >
      {/* Gradient top stripe */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${palette.bar}`} />

      {/* Subtle background tint */}
      <div className={`absolute inset-0 bg-gradient-to-br ${palette.stripe} to-transparent pointer-events-none`} />

      <div className="relative p-4 sm:p-5">
        {/* ── Top row: title + ring + button ── */}
        <div className="flex items-start gap-3 mb-3">
          {/* Left: badge + title + subtitle */}
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest mb-1.5 ${palette.badge}`}
            >
              {isNotStarted ? <Rocket className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
              {isNotStarted ? "Enrolled" : "In Progress"}
            </span>
            <h3 className="text-[13px] font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight line-clamp-2">
              {course.title}
            </h3>
            {course.courseCode && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 block">
                {course.courseCode}
              </span>
            )}
            {activeStage && !isNotStarted && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Current:{" "}
                <span className="font-bold" style={{ color: palette.fill }}>
                  {activeStage.label}
                </span>
              </p>
            )}
          </div>

          {/* Right: circular ring + CTA */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Circular progress */}
            <div className="relative w-11 h-11">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Track */}
                <circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-slate-100 dark:text-slate-700/60"
                />
                {/* Fill */}
                <motion.circle
                  cx="18" cy="18" r="15.5"
                  fill="none"
                  stroke={palette.fill}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                  strokeDashoffset="0"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${strokeDash} ${circumference - strokeDash}` }}
                  transition={{ duration: 1, ease: "easeOut", delay: index * 0.12 + 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-extrabold" style={{ color: palette.fill }}>
                  {course.progress}%
                </span>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={() => navigate(course.navigateTo || "/dashboard/courses")}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap
                         border transition-all duration-200
                         bg-[#f0f4ff] dark:bg-[#1a3884]/20 text-[#1a3884] dark:text-blue-300
                         border-[#1a3884]/20 dark:border-[#1a3884]/40
                         hover:bg-[#1a3884] hover:text-white hover:border-[#1a3884]
                         dark:hover:bg-[#1a3884] dark:hover:text-white"
            >
              {isNotStarted ? "Start" : "Continue"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              {totalStages > 0
                ? `${completedStages} / ${totalStages} sessions completed`
                : "Course roadmap loading..."}
            </span>
            <span className="text-[10px] font-bold" style={{ color: palette.fill }}>
              {course.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 + 0.25 }}
              className={`h-full rounded-full bg-gradient-to-r ${palette.bar}`}
            />
          </div>
        </div>

        {/* ── Roadmap Steps ── */}
        {course.stages.length > 0 ? (
          <>
            <div className="overflow-x-auto -mx-1 px-1 pb-2">
              <div className="flex items-start">
                {visibleStages.map((step, sIdx) => (
                  <StepNode
                    key={step.id || sIdx}
                    step={step}
                    isLast={sIdx === visibleStages.length - 1 && (!hasMore || expanded)}
                    palette={palette}
                  />
                ))}
                {!expanded && hasMore && (
                  <div className="flex items-center self-start mt-1 ml-2 shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      +{course.stages.length - MAX_VISIBLE} more
                    </span>
                  </div>
                )}
              </div>
            </div>

            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-slate-400
                           hover:text-[#1a3884] dark:hover:text-blue-400 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show all {course.stages.length} sessions</>
                )}
              </button>
            )}
          </>
        ) : (
          /* No module/stage data — show a simple "Start Learning" nudge */
          <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#002A5C]/60 border border-dashed border-slate-200 dark:border-slate-600/50">
            <BookOpen className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your course roadmap sessions will appear here once the curriculum is loaded.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ── Main exported widget ──────────────────────────────────────────────────────
const InProgressRoadmap = memo(({ courses = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-44 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          <div className="h-3 w-14 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-36 rounded-2xl bg-slate-100 dark:bg-[#002147] animate-pulse border border-slate-200 dark:border-[#1a3884]/20"
          />
        ))}
      </div>
    );
  }

  if (!courses || courses.length === 0) return null;

  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-extrabold text-slate-800 dark:text-white tracking-tight">
            My Course Roadmap
          </h2>
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
                           bg-[#1a3884]/10 dark:bg-[#1a3884]/30 text-[10px] font-extrabold
                           text-[#0E2136] dark:text-blue-400">
            {courses.length}
          </span>
        </div>
        <button
          onClick={() => navigate("/dashboard/courses")}
          className="flex items-center gap-1 text-[11px] font-bold text-[#1a3884] dark:text-blue-400
                     hover:underline transition-all"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {courses.map((course, idx) => (
            <CourseRoadmapCard
              key={course.enrollmentId || course.courseId || idx}
              course={course}
              index={idx}
              palette={PALETTE[idx % PALETTE.length]}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

InProgressRoadmap.displayName = "InProgressRoadmap";
export default InProgressRoadmap;
