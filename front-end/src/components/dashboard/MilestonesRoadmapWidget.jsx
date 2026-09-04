import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardCheck,
  FileText,
  Lock,
} from "@/components/icons";

const MilestonesRoadmapWidget = memo(({ paths = [], assessmentData = null }) => {
  const navigate = useNavigate();

  // ── Derive real completion status from props ─────────────────────────────
  const coursesDone = useMemo(() => {
    if (paths.length === 0) return false;
    return paths.some(p => (p.progress || 0) >= 50);
  }, [paths]);

  const visionBoardDone = useMemo(() => {
    try {
      const stored = localStorage.getItem("smaart_vision_board_items");
      const items = stored ? JSON.parse(stored) : [];
      return Array.isArray(items) && items.length > 0;
    } catch { return false; }
  }, []);

  const assessmentDone = useMemo(() => {
    if (!assessmentData?.data) return false;
    const stages = Object.values(assessmentData.data);
    return stages.length > 0 && stages.some(s => s?.completed);
  }, [assessmentData]);

  const profileDone = useMemo(() => {
    return !!localStorage.getItem("smaart_resume_saved");
  }, []);

  const STEPS = [
    {
      id: "courses",
      icon: BookOpen,
      label: "Course Completion",
      desc: "Reach 50% progress on a learning path",
      done: coursesDone,
      action: () => navigate("/dashboard/courses"),
      actionLabel: "Go to Courses",
    },
    {
      id: "vision",
      icon: ClipboardCheck,
      label: "Vision Board",
      desc: "Set up your career vision and goals",
      done: visionBoardDone,
      action: () => navigate("/dashboard/vision-board"),
      actionLabel: "Open Vision Board",
    },
    {
      id: "assessment",
      icon: CheckCircle2,
      label: "Assessment Clearance",
      desc: "Complete at least one assessment stage",
      done: assessmentDone,
      action: () => navigate("/dashboard/assessments"),
      actionLabel: "Take Assessment",
    },
    {
      id: "resume",
      icon: FileText,
      label: "Resume & AI Profile",
      desc: "Build and save your career resume",
      done: profileDone,
      action: () => navigate("/dashboard/ai-career-coach"),
      actionLabel: "Build Resume",
    },
    {
      id: "placement",
      icon: Briefcase,
      label: "Ready for Placements",
      desc: "Complete all stages to unlock job applications",
      done: coursesDone && visionBoardDone && assessmentDone && profileDone,
      action: () => navigate("/dashboard/career-directions"),
      actionLabel: "View Opportunities",
    },
  ];

  const doneCount = STEPS.filter(s => s.done).length;
  const progress = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="bg-white dark:bg-[#002147] rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/20 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-[#1a3884]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-[#1a3884] dark:bg-blue-400 rounded-full" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-white tracking-tight">Career Roadmap</span>
          </div>
          <span className="text-[11px] font-extrabold text-[#1a3884] dark:text-blue-400">
            {doneCount}/{STEPS.length} done
          </span>
        </div>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #112b6b, #1a3884)" }}
            />
          </div>
          <p className="text-[9px] font-bold text-slate-400 mt-1">{progress}% career readiness</p>
        </div>
      </div>

      {/* Steps */}
      <div className="px-4 py-3 space-y-1.5">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isLocked = idx > 0 && !STEPS[idx - 1].done;
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07, duration: 0.35 }}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 group ${
                step.done
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                  : isLocked
                  ? "bg-slate-50 dark:bg-[#002A5C]/30 border-slate-100 dark:border-[#1a3884]/10 opacity-50"
                  : "bg-white dark:bg-[#002A5C]/40 border-slate-200 dark:border-[#1a3884]/20 hover:border-[#1a3884]/40 hover:bg-[#f0f4ff] dark:hover:bg-[#1a3884]/10 cursor-pointer"
              }`}
              onClick={!isLocked && !step.done ? step.action : undefined}
            >
              {/* Timeline connector left */}
              <div className="flex flex-col items-center shrink-0 mt-0.5">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : isLocked ? (
                  <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                ) : (
                  <Circle className="w-4 h-4 text-[#0E2136] dark:text-blue-400" />
                )}
                {idx < STEPS.length - 1 && (
                  <div className={`w-px h-3 mt-1 ${step.done ? "bg-emerald-200 dark:bg-emerald-500/30" : "bg-slate-200 dark:bg-[#1a3884]/20"}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-extrabold leading-tight ${
                  step.done ? "text-emerald-700 dark:text-emerald-400" : isLocked ? "text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-white"
                }`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              {/* Chevron for interactive steps */}
              {!isLocked && !step.done && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors shrink-0 mt-0.5" />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});

MilestonesRoadmapWidget.displayName = "MilestonesRoadmapWidget";
export default MilestonesRoadmapWidget;
