import { useState } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  BookOpen, Target, Crown, Lock, CheckCircle2,
  ArrowLeft, Zap, TrendingUp,
  Play, GraduationCap, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { STAGES } from "@/data/courseStructureData";

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
        className={`w-full text-left p-8 rounded-[24px] transition-all duration-500 group relative overflow-hidden ${
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
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${
              isUnlocked 
                ? "bg-white border-gray-100 group-hover:scale-110 group-hover:shadow-md" 
                : "bg-gray-100 border-gray-200"
            }`}>
              <Icon className={`w-8 h-8 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />
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
              
              <h3 className={`text-2xl font-extrabold tracking-tight mb-2 ${
                isUnlocked
                  ? "text-[#112b6b]"
                  : "text-gray-400"
              }`} style={{ letterSpacing: "-0.02em" }}>
                {stage.name}
              </h3>
              <p className="text-[13px] text-gray-500 mb-6 line-clamp-2 leading-relaxed font-medium">
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

/* ─── Single course card inside the stage view ─── */
const CourseCard = ({ course, index, isCompleted, isCurrent, isUnlocked, onClick, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-300 group overflow-hidden ${
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
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border ${
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
    return true; // Unlocked all
  };

  const handleCourseClick = (course, courseUnlocked) => {
    // Logic bypass: all courses are unlocked
    if (onCourseClick) onCourseClick(course.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-[#112b6b] text-sm font-bold uppercase tracking-widest mb-8 hover:text-[#1a3884] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:shadow-md transition-all">
          <ArrowLeft className="w-4 h-4" />
        </div>
        Back to Dashboard
      </button>

      {/* Stage header - Premium Style */}
      <div className="bg-white rounded-[24px] p-8 mb-8 relative overflow-hidden"
           style={{
             border: "1px solid rgba(0, 0, 0, 0.05)",
             boxShadow: "0 20px 40px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.03)"
           }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 relative z-10">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-[22px] bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 text-[#1a3884]`}>
              <Icon className="w-10 h-10" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884]`}>
                {cfg.tag} · {stage.totalCourses} Modules
              </span>
              <h1 className="text-3xl font-extrabold text-[#112b6b] mt-1" style={{ letterSpacing: "-0.02em" }}>
                {stage.name}
              </h1>
              <p className="text-[14px] text-gray-500 mt-2 font-medium max-w-lg">
                {stage.description}
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-4">
            <div className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-[#112b6b] leading-tight">{pct}%</div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Progress</div>
            </div>
            <div className="px-5 py-3 bg-gray-50 rounded-2xl border border-gray-100 text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-[#112b6b] leading-tight">{completedCount}</div>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Completed</div>
            </div>
          </div>
        </div>

        {/* Enhanced Progress bar */}
        <div className="mt-8">
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #112b6b 0%, #1a3884 100%)"
              }}
            />
          </div>
        </div>
      </div>

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

      {/* Course grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              accentColor="#1a3884"
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
    return true; // Unlocked all
  };

  const selectedStage = STAGES.find(s => s.id === selectedStageId);
  const selectedCfg = selectedStageId ? STAGE_CONFIG[selectedStageId] : null;

  const totalCompleted = (userProgress.completedCourses || []).length;
  const totalCourses = STAGES.reduce((a, s) => a + s.totalCourses, 0);
  const overallPct = Math.round((totalCompleted / totalCourses) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] transition-colors duration-500 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-[#C0C0C0]/5 rounded-full blur-[130px]" />
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 relative z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md border border-gray-100">
                  <GraduationCap className="w-7 h-7 text-[#1a3884]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#1a3884]">
                    Core Programme
                  </span>
                  <h1 className="text-4xl font-extrabold text-[#112b6b] tracking-tight" style={{ letterSpacing: "-0.03em" }}>
                    My Learning Journey
                  </h1>
                </div>
              </div>
              <p className="text-[15px] text-gray-500 font-medium max-w-lg leading-relaxed">
                Experience a structured pathway to mastery. Three transformative stages designed to elevate your professional capability.
              </p>
            </div>

            {/* Overall progress card */}
            <div className="flex items-center gap-8 bg-white border border-gray-100 rounded-3xl px-8 py-6 shadow-xl shadow-gray-200/40">
              <div className="text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Overall</div>
                <div className="text-3xl font-extrabold text-[#1a3884] leading-tight">{overallPct}%</div>
              </div>
              <div className="h-12 w-px bg-gray-100" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[13px] font-bold text-[#112b6b]">{totalCompleted} Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  <span className="text-[13px] font-bold text-gray-400">{totalCourses - totalCompleted} Remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10">
        <AnimatePresence mode="wait">
          {!selectedStageId ? (
            /* Category cards view */
            <motion.div key="cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }}>
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
