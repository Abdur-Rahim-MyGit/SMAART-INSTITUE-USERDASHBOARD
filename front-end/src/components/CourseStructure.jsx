import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from "framer-motion";
import {
  BookOpen, Target, Crown, CheckCircle2,
  ArrowLeft, Zap, TrendingUp,
  Play, GraduationCap, ArrowRight, ChevronRight,
  Brain, Bot, Leaf
} from "lucide-react";
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
        onClick={onClick}
        disabled={!isUnlocked}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-5 sm:p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden border border-black/5 dark:border-white/5 ${isUnlocked
          ? "bg-white dark:bg-[#002147] hover:-translate-y-2"
          : "bg-[#F8FAFC] dark:bg-dark-bg/50 cursor-not-allowed opacity-60"
          }`}
        style={{
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
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Icon Box - Matching LoginCard style */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
              ? "bg-white border-gray-100 group-hover:scale-110 group-hover:shadow-md"
              : "bg-gray-100 border-gray-200"
              }`}>
              <Icon className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                  }`}>
                  {t("my_courses_page.stage_n", { n: stage.id })}
                </span>
              </div>

              <h3 className={`text-xl font-extrabold tracking-tight mb-2 ${isUnlocked
                ? "text-[#112b6b] dark:text-white"
                : "text-gray-400 dark:text-slate-400"
                }`} style={{ letterSpacing: "-0.02em" }}>
                {t(`my_courses_page.stages.${stage.id}.name`, stage.name)}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                {t(`my_courses_page.stages.${stage.id}.description`, stage.description)}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isUnlocked ? "text-gray-700" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.progression")}
                  </span>
                  <span className={`text-[11px] font-bold ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.courses_count", { completed: completedCount, total })}
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
        onClick={onClick}
        disabled={!isUnlocked}
        onMouseMove={handleMouseMove}
        className={`w-full text-left p-5 sm:p-6 rounded-[24px] transition-all duration-500 group relative overflow-hidden border border-black/5 dark:border-white/5 ${isUnlocked
          ? "bg-white dark:bg-[#002147] hover:-translate-y-2"
          : "bg-[#F8FAFC] dark:bg-dark-bg/50 cursor-not-allowed opacity-60"
          }`}
        style={{
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
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
            {/* Icon Box */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border transition-all duration-300 ${isUnlocked
              ? "bg-white border-gray-100 group-hover:scale-110 group-hover:shadow-md"
              : "bg-gray-100 border-gray-200"
              }`}>
              {track.id === 'PIQ' && <Brain className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
              {track.id === 'AIQ' && <Bot className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
              {track.id === 'SQ' && <Leaf className={`w-7 h-7 ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"}`} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                  }`}>
                  {t("my_courses_page.specialization_track")}
                </span>
              </div>

              <h3 className={`text-xl font-extrabold tracking-tight mb-2 ${isUnlocked
                ? "text-[#112b6b] dark:text-white"
                : "text-gray-400 dark:text-slate-400"
                }`} style={{ letterSpacing: "-0.02em" }}>
                {t(`my_courses_page.tracks.${track.id}.shortName`, track.shortName)}
              </h3>
              <p className="text-[13px] text-gray-500 mb-4 line-clamp-2 leading-relaxed font-medium">
                {t(`my_courses_page.tracks.${track.id}.description`, track.description)}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${isUnlocked ? "text-gray-700" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.progression")}
                  </span>
                  <span className={`text-[11px] font-bold ${isUnlocked ? "text-[#1a3884]" : "text-gray-400"
                    }`}>
                    {t("my_courses_page.courses_count", { completed: completedCount, total })}
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
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      onClick={onClick}
      className={`relative rounded-2xl p-4 cursor-pointer transition-all duration-300 group overflow-hidden border ${isCompleted
        ? "bg-green-50/50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30"
        : isCurrent
          ? "bg-white dark:bg-[#002147] shadow-lg border-[#1a3884] dark:border-[#4c6ef5]"
          : isUnlocked
            ? "bg-white dark:bg-[#002147] hover:shadow-md hover:-translate-y-1 border-black/5 dark:border-white/5"
            : "bg-gray-50/50 dark:bg-dark-bg/50 cursor-not-allowed opacity-60 border-black/5 dark:border-white/5"
        }`}
      style={{
        borderWidth: isCurrent ? "1.5px" : "1px",
        boxShadow: isCurrent
          ? "0 10px 25px rgba(26, 56, 132, 0.1)"
          : isUnlocked && !isCompleted ? "0 4px 12px rgba(0,0,0,0.03)" : "none"
      }}
    >
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border ${isCompleted
          ? "bg-green-500 border-green-600 text-white shadow-sm"
          : isCurrent
            ? "bg-[#1a3884] border-[#112b6b] text-white shadow-md"
            : isUnlocked
              ? "bg-white border-gray-100 text-gray-400 group-hover:border-[#1a3884]/30 group-hover:text-[#1a3884]"
              : "bg-gray-100 border-gray-200 text-gray-400"
          }`}>
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isCurrent ? (
            <Play className="w-5 h-5" />
          ) : (
            <span className="text-sm font-bold">{index + 1}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mb-2 uppercase tracking-widest ${isCompleted
            ? "bg-green-100 text-green-700"
            : isCurrent
              ? "bg-[#1a3884]/10 text-[#1a3884]"
              : "bg-gray-100 text-gray-500"
            }`}>
            {course.courseNumber || course.id}
          </span>

          <h4 className={`font-bold text-[15px] mb-1 leading-tight ${isUnlocked ? "text-[#112b6b] dark:text-white" : "text-gray-400 dark:text-slate-400"
            }`}>
            {course.title || t(`my_courses_page.courses.${course.id}.title`)}
          </h4>
          <p className="text-[12px] text-gray-500 leading-relaxed line-clamp-1 font-medium font-bold">
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
  const pct = Math.round((completedCount / stage.totalCourses) * 100);

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
      <button
        onClick={onBack}
        className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-10 hover:text-[#1a3884] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
          <ArrowLeft className="w-4 h-4" />
        </div>
        {t("my_courses_page.back_to_overview")}
      </button>

      {/* Stage header - Refined and Sized Appropriately */}
      <section className="rounded-[24px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6 mb-8 shadow-sm dark:border-white/8 dark:bg-[#0b1627] md:px-8 md:py-8 transition-all duration-300 relative overflow-hidden">
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50/50 to-transparent dark:from-white/5 pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 relative z-10">
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 rounded-[22px] bg-white dark:bg-[#002A5C] border border-slate-100 dark:border-white/10 shadow-lg flex items-center justify-center flex-shrink-0 text-[#1a3884] dark:text-blue-400 transform transition-transform duration-500`}>
              <Icon className="w-10 h-10" />
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                {t("my_courses_page.your_learning_journey")} <ChevronRight className="w-3 h-3" /> {typeof stage.id === 'number' ? t("my_courses_page.stage_n", { n: stage.id }) : t(`my_courses_page.tracks.${stage.id}.name`, stage.name)}
              </div>

              <div className="mb-3 inline-flex items-center rounded-full border border-[#1a3884]/15 bg-[#1a3884]/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a3884] dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300 shadow-sm">
                {t("my_courses_page.specialized_courses_count", { count: stage.totalCourses })}
              </div>

              <h1 className="text-2xl font-extrabold tracking-tight text-[#112b6b] dark:text-white md:text-3xl leading-[1.2]" style={{ letterSpacing: "-0.02em" }}>
                {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.name`, stage.name) : t(`my_courses_page.tracks.${stage.id}.name`, stage.name)}
              </h1>

              <p className="mt-2 text-[14px] text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                {typeof stage.id === 'number' ? t(`my_courses_page.stages.${stage.id}.description`, stage.description) : t(`my_courses_page.tracks.${stage.id}.description`, stage.description)}
              </p>
            </div>
          </div>

          {/* Stats Section - Refined sizes */}
          <div className="relative group w-full xl:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#1a3884] to-[#4c6ef5] rounded-[24px] blur opacity-5 group-hover:opacity-10 transition duration-1000"></div>
            <div className="relative flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6 bg-slate-50/50 dark:bg-[#001835] border border-slate-100 dark:border-white/5 rounded-[20px] p-5 sm:px-6 sm:py-5 shadow-sm overflow-hidden w-full">
              <div className="text-center flex-shrink-0">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">{t("my_courses_page.stage_progress")}</div>
                <div className="text-3xl font-black text-[#1a3884] dark:text-blue-400 leading-none tabular-nums">{pct}%</div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-slate-200 dark:bg-white/10" />
              <div className="space-y-1 text-center sm:text-left flex flex-col justify-center w-full sm:w-auto">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[12px] font-bold text-[#112b6b] dark:text-slate-200">{t("my_courses_page.mastered_count", { count: completedCount })}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  <span className="text-[12px] font-bold text-slate-400">{t("my_courses_page.remaining_count", { count: stage.totalCourses - completedCount })}</span>
                </div>
              </div>
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
            <TrendingUp className="w-6 h-6 text-[#1a3884] dark:text-blue-400" />
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
const CourseStructure = ({ onCourseClick, userProgress = {}, publishedCourseCodes = null, continueWatching = null }) => {
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
    ];

    if (!dbCourses || dbCourses.length === 0) {
      return { activeStages: STAGES, activeTracks: TRACKS };
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

      if (isPIQ) {
        templateTracks[0].courses.push(mapped);
      } else if (isAIQ) {
        templateTracks[1].courses.push(mapped);
      } else if (isSQ) {
        templateTracks[2].courses.push(mapped);
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

    return { activeStages: templateStages, activeTracks: templateTracks };
  }, [dbCourses, t]);

  const isStageUnlocked = (stage) => checkStageUnlocked(stage, userProgress);

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

  const isTrackUnlocked = (trackId) => {
    const track = activeTracks.find((t) => t.id === trackId);
    return track ? checkTrackUnlocked(track, userProgress) : false;
  };

  return (
    <div className="w-full relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-[#C0C0C0]/5 rounded-full blur-[130px]" />
      </div>

      {/* Page header — standardized PageHero */}
      {!selectedStageId && (
        <div className="relative z-10 py-4 px-4 sm:px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="group flex items-center gap-3 text-[#112b6b] dark:text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em] hover:text-[#1a3884] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
              </button>
            </div>
            <PageHero
              badge={t("my_courses_page.learning_journey")}
              title={t("my_courses_page.programme")}
              titleAccent="SMAART"
              accentFirst={true}
              subtitle={t("my_courses_page.programme_desc")}
            >
              {/* Progress stat card */}
              <div className="flex items-center gap-5 bg-white dark:bg-[#002147] border border-gray-100 dark:border-white/10 rounded-2xl px-6 py-4 shadow-sm">
                <div className="text-center">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{t("my_courses_page.completion")}</div>
                  <div className="text-3xl font-black text-[#1a3884] dark:text-blue-300 leading-none tabular-nums">{overallPct}%</div>
                </div>
                <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">{t("my_courses_page.mastered_count", { count: totalCompleted })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="text-[12px] font-bold text-slate-400 dark:text-slate-500">{t("my_courses_page.remaining_count", { count: totalCourses - totalCompleted })}</span>
                  </div>
                </div>
              </div>
            </PageHero>
          </div>
        </div>
      )}

      {/* Continue Watching Section below SMAART programme section */}
      {!selectedStageId && continueWatching && (
        <div className="relative z-10 px-4 sm:px-6 md:px-12 py-2">
          <div className="max-w-7xl mx-auto">
            {continueWatching}
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 relative z-10">
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
                <h2 className="text-xl font-bold text-[#112b6b] dark:text-white mb-6 px-1 flex items-center gap-3">
                  {t("my_courses_page.readiness_tracks")}
                  <div className="h-px flex-1 bg-slate-100 dark:bg-white/10" />
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {activeTracks.map((track, i) => {
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
                publishedCourseCodes={publishedCourseCodes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CourseStructure;
