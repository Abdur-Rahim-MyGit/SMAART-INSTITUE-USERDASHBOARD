import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Target, Crown, Lock, CheckCircle2,
  ArrowLeft, ChevronRight, Zap, TrendingUp,
  Play, GraduationCap, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { STAGES } from "@/data/courseStructureData";

/* ─── Stage visual config ─── */
const STAGE_CONFIG = {
  1: {
    gradient: "from-[#1a3884] via-[#0f2d6b] to-[#0a1f4e]",
    accentGlow: "rgba(26,56,132,0.4)",
    accentLight: "rgba(26,56,132,0.12)",
    accentBorder: "rgba(26,56,132,0.25)",
    badgeBg: "#e8edf8",
    badgeText: "#1a3884",
    iconBg: "linear-gradient(135deg,#1a3884,#2952c3)",
    progressColor: "#1a3884",
    tag: "Stage 1",
    Icon: BookOpen,
    emoji: "📚",
  },
  2: {
    gradient: "from-[#6d28d9] via-[#5b21b6] to-[#3b0f8c]",
    accentGlow: "rgba(109,40,217,0.4)",
    accentLight: "rgba(109,40,217,0.10)",
    accentBorder: "rgba(109,40,217,0.25)",
    badgeBg: "#f0ebff",
    badgeText: "#6d28d9",
    iconBg: "linear-gradient(135deg,#7c3aed,#9f67fa)",
    progressColor: "#7c3aed",
    tag: "Stage 2",
    Icon: Target,
    emoji: "🎯",
  },
  3: {
    gradient: "from-[#b45309] via-[#92400e] to-[#6b2d05]",
    accentGlow: "rgba(180,83,9,0.4)",
    accentLight: "rgba(180,83,9,0.10)",
    accentBorder: "rgba(180,83,9,0.25)",
    badgeBg: "#fef3e2",
    badgeText: "#b45309",
    iconBg: "linear-gradient(135deg,#d97706,#f59e0b)",
    progressColor: "#d97706",
    tag: "Stage 3",
    Icon: Crown,
    emoji: "👑",
  },
};

/* ─── Category card (top-level view) ─── */
const CategoryCard = ({ stage, cfg, isUnlocked, completedCount, onClick, delay }) => {
  const { Icon } = cfg;
  const total = stage.totalCourses;
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      onClick={onClick}
      disabled={!isUnlocked}
      className="relative w-full text-left overflow-hidden rounded-3xl group focus:outline-none"
      style={{
        boxShadow: isUnlocked
          ? `0 24px 64px ${cfg.accentGlow}, 0 4px 16px rgba(0,0,0,0.08)`
          : "0 8px 24px rgba(0,0,0,0.06)",
        cursor: isUnlocked ? "pointer" : "not-allowed",
      }}
      whileHover={isUnlocked ? { y: -6, scale: 1.012 } : {}}
      whileTap={isUnlocked ? { scale: 0.98 } : {}}
    >
      {/* Dark gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} transition-opacity duration-300`} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Glow orb */}
      {isUnlocked && (
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: "white" }} />
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/70" />
          </div>
          <p className="text-white/60 text-sm font-semibold">Complete previous stage to unlock</p>
        </div>
      )}

      <div className="relative z-10 p-7 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
              {cfg.tag}
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white" style={{ letterSpacing: "-0.03em" }}>
              {stage.name}
            </h2>
            <p className="text-white/60 text-sm mt-1 font-medium">{stage.subtitle}</p>
          </div>

          <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl text-2xl"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            {cfg.emoji}
          </div>
        </div>

        {/* Description */}
        <p className="text-white/70 text-sm leading-relaxed mb-6">{stage.description}</p>

        {/* Progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Progress</span>
            <span className="text-white font-bold text-sm">{completedCount}/{total} courses</span>
          </div>
          <div className="h-2 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, delay: delay + 0.3 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full"
                style={{ background: i < completedCount ? "white" : "rgba(255,255,255,0.2)" }} />
            ))}
            {total > 10 && <span className="text-white/50 text-xs ml-1">+{total - 10}</span>}
          </div>

          {isUnlocked && (
            <motion.div
              className="flex items-center gap-2 text-white font-bold text-sm"
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span>Explore</span>
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

/* ─── Single course card inside the stage view ─── */
const CourseCard = ({ course, index, isCompleted, isCurrent, isUnlocked, onClick, accentColor, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35, delay }}
    onClick={onClick}
    className="relative rounded-2xl border cursor-pointer group transition-all duration-300"
    style={{
      background: isCompleted
        ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
        : isCurrent
        ? `linear-gradient(135deg,${accentColor}10,${accentColor}05)`
        : isUnlocked
        ? "white"
        : "#f8fafc",
      border: isCompleted
        ? "1.5px solid #86efac"
        : isCurrent
        ? `1.5px solid ${accentColor}`
        : "1.5px solid rgba(0,0,0,0.06)",
      boxShadow: isCurrent
        ? `0 8px 24px ${accentColor}20`
        : isCompleted
        ? "0 4px 12px rgba(34,197,94,0.12)"
        : "0 2px 8px rgba(0,0,0,0.04)",
      opacity: !isUnlocked ? 0.5 : 1,
    }}
  >
    <div className="p-5">
      {/* ID badge + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg"
          style={{
            background: isCompleted ? "#bbf7d0" : isCurrent ? `${accentColor}18` : "#f1f5f9",
            color: isCompleted ? "#15803d" : isCurrent ? accentColor : "#64748b",
          }}>
          {course.id}
        </span>

        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isCompleted ? "#22c55e" : isCurrent ? accentColor : isUnlocked ? "#f1f5f9" : "#e2e8f0",
          }}>
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-white" />
          ) : !isUnlocked ? (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          ) : isCurrent ? (
            <Play className="w-3.5 h-3.5 text-white" />
          ) : (
            <span className="text-xs font-bold text-slate-500">{index + 1}</span>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-sm text-slate-800 leading-snug mb-1 group-hover:text-slate-900 transition-colors">
        {course.title}
      </h4>
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{course.subtitle}</p>

      {/* CTA */}
      {isUnlocked && !isCompleted && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold"
          style={{ color: isCurrent ? accentColor : "#94a3b8" }}>
          {isCurrent ? (
            <><Play className="w-3 h-3" /> Continue</>
          ) : (
            <><Zap className="w-3 h-3" /> Start</>
          )}
        </div>
      )}
    </div>
  </motion.div>
);

/* ─── Stage detail view ─── */
const StageDetailView = ({ stage, cfg, userProgress, onBack, onCourseClick }) => {
  const { Icon } = cfg;
  const completedCount = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;
  const pct = Math.round((completedCount / stage.totalCourses) * 100);

  const isCourseUnlocked = (courseId) => {
    const idx = stage.courses.findIndex(c => c.id === courseId);
    if (idx === 0) return true;
    return userProgress.completedCourses?.includes(stage.courses[idx - 1].id);
  };

  const handleCourseClick = (course, courseUnlocked) => {
    if (!courseUnlocked) {
      const idx = stage.courses.findIndex(c => c.id === course.id);
      const prev = stage.courses[idx - 1];
      toast.error(`Complete "${prev.title}" first!`, {
        description: "This is a sequential learning journey.",
      });
      return;
    }
    if (onCourseClick) onCourseClick(course.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Stage hero header */}
      <div className={`relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-br ${cfg.gradient} p-8 md:p-10`}
        style={{ boxShadow: `0 32px 80px ${cfg.accentGlow}` }}>
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-bold mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          All Programmes
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase mb-3"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
              {cfg.tag} · {stage.totalCourses} Courses
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2" style={{ letterSpacing: "-0.04em" }}>
              {stage.name}
            </h1>
            <p className="text-white/65 text-base max-w-xl">{stage.description}</p>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="text-3xl font-extrabold text-white">{pct}%</div>
              <div className="text-white/60 text-xs font-semibold mt-0.5">Complete</div>
            </div>
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="text-3xl font-extrabold text-white">{completedCount}</div>
              <div className="text-white/60 text-xs font-semibold mt-0.5">Done</div>
            </div>
            <div className="rounded-2xl px-5 py-4 text-center" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <div className="text-3xl font-extrabold text-white">{stage.totalCourses - completedCount}</div>
              <div className="text-white/60 text-xs font-semibold mt-0.5">Left</div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.2 }}
              className="h-full bg-white rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Assessment gate banner */}
      {stage.assessmentGate && (
        <div className="mb-6 flex items-center gap-4 p-4 rounded-2xl border"
          style={{ background: cfg.accentLight, borderColor: cfg.accentBorder }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.iconBg }}>
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm">Assessment Gate: {stage.assessmentGate}</h4>
            <p className="text-slate-500 text-xs">Pass this assessment (70%+) after completing all courses to unlock the next stage</p>
          </div>
          {userProgress.assessmentsPassed?.includes(stage.assessmentGate) ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Passed</span>
          ) : (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: cfg.accentLight, color: cfg.progressColor }}>Pending</span>
          )}
        </div>
      )}

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stage.courses.map((course, idx) => {
          const isCompleted = userProgress.completedCourses?.includes(course.id);
          const isCurrent = userProgress.currentCourse === course.id;
          const courseUnlocked = isCourseUnlocked(course.id);

          return (
            <CourseCard
              key={course.id}
              course={course}
              index={idx}
              isCompleted={isCompleted}
              isCurrent={isCurrent}
              isUnlocked={courseUnlocked}
              onClick={() => handleCourseClick(course, courseUnlocked)}
              accentColor={cfg.progressColor}
              delay={idx * 0.04}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

/* ─── Main Component ─── */
const CourseStructure = ({ onCourseClick, userProgress = {} }) => {
  const [selectedStageId, setSelectedStageId] = useState(null);

  const isStageUnlocked = (stage) => {
    if (stage.id === 1) return true;
    const prevStage = STAGES[stage.id - 2];
    return (
      userProgress.completedStages?.includes(prevStage.id) &&
      userProgress.assessmentsPassed?.includes(prevStage.assessmentGate)
    );
  };

  const selectedStage = STAGES.find(s => s.id === selectedStageId);
  const selectedCfg = selectedStageId ? STAGE_CONFIG[selectedStageId] : null;

  const totalCompleted = (userProgress.completedCourses || []).length;
  const totalCourses = STAGES.reduce((a, s) => a + s.totalCourses, 0);
  const overallPct = Math.round((totalCompleted / totalCourses) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090f1e] transition-colors duration-300">
      {/* ── Page header ── */}
      <div className="relative bg-white dark:bg-[#0d1526] border-b border-slate-100 dark:border-white/5 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(26,56,132,0.07) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-[#1a3884]" />
                <span className="text-xs font-bold uppercase tracking-widest text-[#1a3884]">
                  Human Intelligence Programme
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white"
                style={{ letterSpacing: "-0.03em" }}>
                My Learning Journey
              </h1>
              <p className="text-slate-500 mt-1">Three stages. {totalCourses} courses. Your path to leadership.</p>
            </div>

            {/* Overall progress pill */}
            <div className="flex items-center gap-5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-6 py-4 shadow-sm">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">Overall</div>
                <div className="text-3xl font-extrabold text-[#1a3884] dark:text-blue-400">{overallPct}%</div>
              </div>
              <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-sm text-slate-500 space-y-0.5">
                <div className="font-semibold text-slate-700 dark:text-slate-300">{totalCompleted} completed</div>
                <div>{totalCourses - totalCompleted} remaining</div>
              </div>
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="5" />
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#1a3884" strokeWidth="5"
                    strokeDasharray={`${2 * Math.PI * 24}`}
                    strokeDashoffset={`${2 * Math.PI * 24 * (1 - overallPct / 100)}`}
                    strokeLinecap="round" />
                </svg>
                <Sparkles className="absolute inset-0 m-auto w-4 h-4 text-[#1a3884]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <AnimatePresence mode="wait">
          {!selectedStageId ? (
            /* Category cards view */
            <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>

              {/* 3 big cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {STAGES.map((stage, i) => {
                  const cfg = STAGE_CONFIG[stage.id];
                  const unlocked = isStageUnlocked(stage);
                  const completed = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;

                  return (
                    <CategoryCard
                      key={stage.id}
                      stage={stage}
                      cfg={cfg}
                      isUnlocked={unlocked}
                      completedCount={completed}
                      delay={i * 0.12}
                      onClick={() => {
                        if (!unlocked) {
                          toast.error(`${stage.name} is locked!`, {
                            description: "Complete the previous stage and pass its assessment to unlock this.",
                          });
                          return;
                        }
                        setSelectedStageId(stage.id);
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
          ) : (
            /* Stage detail view */
            <motion.div key={`stage-${selectedStageId}`}>
              <StageDetailView
                stage={selectedStage}
                cfg={selectedCfg}
                userProgress={userProgress}
                onBack={() => setSelectedStageId(null)}
                onCourseClick={onCourseClick}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseStructure;
