import { useState } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  BookOpen, Target, Crown, Lock, CheckCircle2,
  ArrowLeft, Zap, TrendingUp,
  Play, GraduationCap, ArrowRight, ChevronRight,
  Brain, Bot, Leaf
} from "lucide-react";
import { toast } from "sonner";
import { STAGES, TRACKS } from "@/data/courseStructureData";

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
        onClick={onClick}
        disabled={!isUnlocked}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden ${
          isUnlocked
            ? "bg-white dark:bg-[#001835] hover:-translate-y-2"
            : "bg-gray-50 dark:bg-[#001835]/40 cursor-not-allowed opacity-60"
        }`}
        style={{
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: isUnlocked 
            ? "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)" 
            : "none"
        }}
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
          <div className="flex items-start gap-6">
            {/* Icon Box - Matching LoginCard style */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${
              isUnlocked 
                ? "bg-white border-gray-100 group-hover:scale-110 group-hover:shadow-md" 
                : "bg-gray-100 border-gray-200"
            }`}>
              <Icon className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                }`}>
                  {cfg.tag}
                </span>
                {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
              </div>
              
              <h3 className={`text-xl font-extrabold tracking-tight mb-2 ${
                isUnlocked
                  ? "text-[#112b6b]"
                  : "text-gray-400"
              }`} style={{ letterSpacing: "-0.02em" }}>
                {stage.name}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                {stage.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isUnlocked ? "text-gray-700" : "text-gray-400"
                  }`}>
                    Progression
                  </span>
                  <span className={`text-[11px] font-bold ${
                    isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                  }`}>
                    {completedCount}/{total} Courses
                  </span>
                </div>
                
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: delay + 0.3 }}
                    className="h-full rounded-full"
                    style={{
                      background: isUnlocked 
                        ? "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)" 
                        : "#e2e8f0"
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
        onClick={onClick}
        disabled={!isUnlocked}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden ${
          isUnlocked
            ? "bg-white dark:bg-[#001835] hover:-translate-y-2"
            : "bg-gray-50 dark:bg-[#001835]/40 cursor-not-allowed opacity-60"
        }`}
        style={{
          border: "1px solid rgba(0, 0, 0, 0.05)",
          boxShadow: isUnlocked 
            ? "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)" 
            : "none"
        }}
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
          <div className="flex items-start gap-6">
            {/* Icon Box */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${
              isUnlocked 
                ? "bg-white border-gray-100 group-hover:scale-110 group-hover:shadow-md" 
                : "bg-gray-100 border-gray-200"
            }`}>
              {track.id === 'PIQ' && <Brain className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
              {track.id === 'AIQ' && <Bot className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
              {track.id === 'SQ' && <Leaf className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                  isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                }`}>
                  Specialization Track
                </span>
                {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
              </div>
              
              <h3 className={`text-xl font-extrabold tracking-tight mb-2 ${
                isUnlocked
                  ? "text-[#112b6b]"
                  : "text-gray-400"
              }`} style={{ letterSpacing: "-0.02em" }}>
                {track.shortName}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                {track.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isUnlocked ? "text-gray-700" : "text-gray-400"
                  }`}>
                    Progression
                  </span>
                  <span className={`text-[11px] font-bold ${
                    isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                  }`}>
                    {completedCount}/{total} Courses
                  </span>
                </div>
                
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, delay: delay + 0.3 }}
                    className="h-full rounded-full"
                    style={{
                      background: isUnlocked 
                        ? `linear-gradient(90deg, ${track.color} 0%, #1a3884 100%)` 
                        : "#e2e8f0"
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 group overflow-hidden ${
        isCompleted
          ? "bg-green-50/50"
          : isCurrent
          ? "bg-white shadow-lg"
          : isUnlocked
          ? "bg-white hover:shadow-md hover:-translate-y-1"
          : "bg-gray-50/50 cursor-not-allowed opacity-60"
      }`}
      style={{
        border: isCurrent 
          ? "1.5px solid #1a3884" 
          : "1px solid rgba(0, 0, 0, 0.05)",
        boxShadow: isCurrent 
          ? "0 10px 25px rgba(26, 56, 132, 0.1)" 
          : isUnlocked && !isCompleted ? "0 4px 12px rgba(0,0,0,0.03)" : "none"
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border ${
          isCompleted
            ? "bg-green-500 border-green-600 text-white shadow-sm"
            : isCurrent
            ? "bg-[#1a3884] border-[#112b6b] text-white shadow-md"
            : isUnlocked
            ? "bg-white border-gray-100 text-gray-400 group-hover:border-[#1a3884]/30 group-hover:text-[#1a3884]"
            : "bg-gray-100 border-gray-200 text-gray-400"
        }`}>
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : !isUnlocked ? (
            <Lock className="w-5 h-5" />
          ) : isCurrent ? (
            <Play className="w-5 h-5" />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mb-2 uppercase tracking-widest ${
            isCompleted
              ? "bg-green-100 text-green-700"
              : isCurrent
              ? "bg-[#1a3884]/10 text-[#1a3884]"
              : "bg-gray-100 text-gray-500"
          }`}>
            {course.id}
          </span>
          
          <h4 className={`font-bold text-[15px] mb-1 leading-tight ${
            isUnlocked ? "text-[#112b6b]" : "text-gray-400"
          }`}>
            {course.title}
          </h4>
          <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-1 font-medium">
            {course.subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Stage detail view ─── */
const StageDetailView = ({ stage, cfg, userProgress, onBack, onCourseClick }) => {
  const { Icon } = cfg;
  const completedCount = stage.courses.filter(c => userProgress.completedCourses?.includes(c.id)).length;
  const pct = Math.round((completedCount / stage.totalCourses) * 100);

  const isCourseUnlocked = (courseId) => {
    return true; // Unlocked all for testing
  };

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
      {/* Back button - Modernized */}
      <button
        onClick={onBack}
        className="group flex items-center gap-3 text-[#112b6b] text-[11px] font-bold uppercase tracking-[0.2em] mb-10 hover:text-[#1a3884] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Overview
      </button>

      {/* Stage header - Refined and Sized Appropriately */}
      <section className="rounded-[24px] border border-slate-200 bg-white px-6 py-6 mb-8 shadow-sm dark:border-slate-800 dark:bg-[#0b1627] md:px-8 md:py-8 transition-all duration-300 relative overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50/50 to-transparent dark:from-white/5 pointer-events-none" />
        
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 relative z-10">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-[22px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-lg flex items-center justify-center flex-shrink-0 text-[#1a3884] dark:text-blue-400 transform transition-transform duration-500`}>
              <Icon className="w-10 h-10" />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Your Learning Journey <ChevronRight className="w-3 h-3" /> {cfg.tag}
              </div>
              
              <div className="mb-3 inline-flex items-center rounded-full border border-[#1a3884]/15 bg-[#1a3884]/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 shadow-sm">
                {stage.totalCourses} Specialized Modules
              </div>
              
              <h1 className="text-2xl font-extrabold tracking-tight text-[#112b6b] dark:text-white md:text-3xl leading-[1.2]" style={{ letterSpacing: "-0.02em" }}>
                {stage.name}
              </h1>
              
              <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                {stage.description}
              </p>
            </div>
          </div>

          {/* Stats Section - Refined sizes */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1a3884] to-[#4c6ef5] rounded-[24px] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
            <div className="relative flex items-center gap-6 bg-slate-50/50 dark:bg-[#001835] border border-slate-100 dark:border-white/5 rounded-[20px] px-6 py-5 shadow-sm overflow-hidden">
              <div className="text-center">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Stage Progress</div>
                <div className="text-3xl font-black text-[#1a3884] dark:text-blue-400 leading-none tabular-nums">{pct}%</div>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[12px] font-bold text-[#112b6b] dark:text-slate-200">{completedCount} Mastered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[12px] font-bold text-slate-400">{stage.totalCourses - completedCount} Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress bar */}
        <div className="mt-8">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.5, ease: "circOut" }}
              className="h-full rounded-full bg-gradient-to-r from-[#112b6b] via-[#1a3884] to-[#4c6ef5]"
            />
          </div>
        </div>
      </section>

      {/* Assessment gate banner */}
      {stage.assessmentGate && (
        <div className="mb-8 flex items-center gap-5 p-5 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-[#1a3884]" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-[#112b6b] text-[15px]">Assessment Required: {stage.assessmentGate}</h4>
            <p className="text-gray-500 text-[13px] font-medium">Complete all modules and achieve 70%+ to unlock next stage</p>
          </div>
          {userProgress.assessmentsPassed?.includes(stage.assessmentGate) ? (
            <div className="px-4 py-2 rounded-xl text-[11px] font-bold bg-green-50 text-green-700 border border-green-100 uppercase tracking-wider">Passed</div>
          ) : (
            <div className="px-4 py-2 rounded-xl text-[11px] font-bold bg-slate-50 text-gray-500 border border-slate-100 uppercase tracking-wider">Locked</div>
          )}
        </div>
      )}

      {/* Course grid - Strictly sequential visibility */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stage.courses.map((course, idx) => {
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
    </motion.div>
  );
};

/* ─── Main Component ─── */
const CourseStructure = ({ onCourseClick, userProgress = {} }) => {
  const [selectedStageId, setSelectedStageId] = useState(null);

  const isStageUnlocked = (stage) => {
    return true; // Unlocked all for testing
  };

  const selectedStage = STAGES.find(s => s.id === selectedStageId) || TRACKS.find(t => t.id === selectedStageId);
  const selectedCfg = STAGE_CONFIG[selectedStageId] || {
    tag: selectedStage?.id + ' Track',
    Icon: Zap,
    color: selectedStage?.color || '#1a3884'
  };

  const totalCompleted = (userProgress.completedCourses || []).length;
  const totalCourses = STAGES.reduce((a, s) => a + s.totalCourses, 0) + TRACKS.reduce((a, t) => a + t.totalCourses, 0);
  const overallPct = Math.round((totalCompleted / totalCourses) * 100);

  const isTrackUnlocked = (trackId) => {
    return true; // Unlocked all for testing
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] transition-colors duration-500 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-[#C0C0C0]/5 rounded-full blur-[130px]" />
      </div>

      {/* Page header - Vision Board Inspired Style - Hidden when stage selected */}
      {!selectedStageId && (
        <div className="relative z-10 px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto">
            <motion.section
              initial={{ opacity: 0, y: 22, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2 }}
              className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef4ff_100%)] p-5 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(30,41,59,1)_100%)] sm:p-6 md:p-8"
            >
              <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
              <div className="pointer-events-none absolute bottom-0 left-8 h-24 w-24 rounded-full bg-cyan-100/50 blur-3xl dark:bg-cyan-400/10" />

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 relative z-10">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#1a3884] shadow-sm dark:border-blue-400/20 dark:bg-slate-900/65 dark:text-blue-300">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#1a3884] to-[#4f7cf3]" />
                    Learning Journey
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-[1.75rem] font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-[2rem] lg:text-[2.25rem] lg:leading-[1.1]">
                      SMAART <span className="text-[#1a3884] dark:text-blue-300">Programme</span>
                    </h1>
                    <p className="max-w-xl text-[13px] font-medium leading-6 text-slate-600 dark:text-slate-300 sm:text-sm">
                      Experience a structured pathway to mastery. Three transformative stages designed to elevate your professional capability and human intelligence.
                    </p>
                  </div>
                </div>

                {/* Overall progress card - Matching the assessment center metrics style */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#1a3884] to-[#4c6ef5] rounded-[24px] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
                  <div className="relative flex items-center gap-6 bg-white/80 dark:bg-slate-900/60 border border-white/80 dark:border-slate-700/70 rounded-[24px] px-6 py-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] backdrop-blur overflow-hidden">
                    <div className="text-center relative z-10">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.24em] mb-2">Completion</div>
                      <div className="text-4xl font-black text-[#1a3884] dark:text-blue-300 leading-none tabular-nums">{overallPct}%</div>
                    </div>
                    <div className="h-12 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                        <span className="text-[13px] font-black text-slate-900 dark:text-slate-100">{totalCompleted} Mastered</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[13px] font-black text-slate-400 dark:text-slate-500">{totalCourses - totalCompleted} Remaining</span>
                      </div>
                    </div>
                    
                    {/* Subtle background icon */}
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-[0.05] rotate-12">
                      <GraduationCap className="w-24 h-24 text-[#1a3884] dark:text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedStageId ? (
            /* Category cards view */
            <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="space-y-12">
              <div>
                <h2 className="text-xl font-bold text-[#112b6b] mb-6 px-1 flex items-center gap-3">
                    Human Intelligence Courses
                   <div className="h-px flex-1 bg-slate-100" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                <h2 className="text-xl font-bold text-[#112b6b] mb-6 px-1 flex items-center gap-3">
                   Readiness Tracks
                   <div className="h-px flex-1 bg-slate-100" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {TRACKS.map((track, i) => {
                    const unlocked = isTrackUnlocked(track.id);
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseStructure;
