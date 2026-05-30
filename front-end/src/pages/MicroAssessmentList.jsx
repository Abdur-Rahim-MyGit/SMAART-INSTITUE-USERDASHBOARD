import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  RiClipboardLine as ClipboardCheck,
  RiSearchLine as Search,
  RiFilterLine as Filter,
  RiPlayCircleLine as Play,
  RiCheckboxCircleLine as CheckCircle2,
  RiTimeLine as Clock,
  RiQuestionLine as HelpCircle,
  RiTrophyLine as Trophy,
  RiFlashlightLine as Zap,
  RiBookOpenLine as BookOpen,
  RiArrowRightLine as ArrowRight,
  RiStarLine as Star,
  RiFireLine as Flame,
  RiLockLine as Lock,
} from "@remixicon/react";
import { courseEnrollmentAPI, coursesAPI } from "@/services/api";
import useUser from "@/hooks/useUser";

/* ─── helpers ─────────────────────────────────────────────── */
const getScoreGrade = (pct) => {
  if (pct >= 90) return { label: "Excellent", color: "#22c55e", bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400" };
  if (pct >= 75) return { label: "Good", color: "#1a3884", bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" };
  if (pct >= 60) return { label: "Satisfactory", color: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" };
  return { label: "Needs Work", color: "#ef4444", bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" };
};

/* SVG Score Ring */
const ScoreRing = ({ pct = 0, size = 64, stroke = 5 }) => {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const grade = getScoreGrade(pct);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke}
          stroke={grade.color} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <span className="absolute text-[11px] font-black text-slate-800 dark:text-white">{pct}%</span>
    </div>
  );
};

/* Status Badge */
const StatusBadge = ({ status }) => {
  const map = {
    completed: { label: "Completed", cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" },
    pending: { label: "Pending", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    locked: { label: "Locked", cls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-white/10" },
  };
  const cfg = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
      {status === "completed" && <CheckCircle2 className="h-3 w-3" />}
      {status === "locked" && <Lock className="h-3 w-3" />}
      {cfg.label}
    </span>
  );
};

/* Stat Card */
const StatCard = ({ icon: Icon, label, value, accent, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className="relative overflow-hidden rounded-2xl bg-white/10 border border-white/20 p-4 backdrop-blur-sm"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{label}</p>
        <p className="mt-1 text-2xl font-black text-white">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${accent}30` }}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full opacity-10" style={{ background: accent }} />
  </motion.div>
);

/* ─── Main Component ─────────────────────────────────────── */
const MicroAssessmentList = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [assessments, setAssessments] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | completed | pending

  /* fetch enrolled courses with micro-assessments */
  useEffect(() => {
    const load = async () => {
      try {
        const userData = sessionStorage.getItem("user");
        if (!userData) { setLoading(false); return; }
        const parsedUser = JSON.parse(userData);
        const studentId = parsedUser.id || parsedUser._id;
        if (!studentId) { setLoading(false); return; }

        // Get student's enrollments
        const enrollmentRes = await courseEnrollmentAPI.getByStudent(studentId);
        if (!enrollmentRes.success) { setLoading(false); return; }

        const enrollments = enrollmentRes.data || [];
        const allAssessments = [];
        const completionMap = {};

        for (const enroll of enrollments) {
          const course = enroll.course;
          if (!course || !course.modules) continue;

          // Build results map: key by courseCode + moduleObjectId + dayId
          // mp.module is the ObjectId of the module doc
          (enroll.moduleProgress || []).forEach((mp) => {
            (mp.taskResults || []).forEach((tr) => {
              // Use the raw ObjectId string so it matches mod._id.toString()
              const modObjId = mp.module?._id?.toString?.() || mp.module?.toString?.() || String(mp.module);
              const key = `${course.courseCode}-${modObjId}-${tr.dayId}`;
              completionMap[key] = {
                score: tr.score,
                totalPoints: tr.totalPoints,
                completedAt: tr.completedAt,
              };
            });
          });

          course.modules.forEach((mod, modIdx) => {
            const modObjId = mod._id?.toString?.() || String(mod._id);
            (mod.microAssessments || []).forEach((ma) => {
              allAssessments.push({
                // Stable UI id uses index-based string (for URL etc.)
                id: `${course.courseCode}-${modIdx + 1}-${ma.dayId}`,
                // Lookup key uses ObjectId so it matches completionMap
                resultKey: `${course.courseCode}-${modObjId}-${ma.dayId}`,
                courseCode: course.courseCode,
                courseTitle: course.title,
                moduleId: modIdx + 1,
                moduleObjectId: modObjId,
                moduleTitle: mod.title,
                dayId: ma.dayId,
                title: ma.title || `Session ${ma.dayId} Assessment`,
                questionCount: (ma.questions || []).length,
                assessmentData: ma,
                studentId,
                enrollmentId: enroll._id,
              });
            });
          });
        }

        setAssessments(allAssessments);
        setResults(completionMap);
      } catch (err) {
        console.error("Error loading micro-assessments:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* derived stats */
  const totalCount = assessments.length;
  const completedItems = assessments.filter(a => !!results[a.resultKey]);
  const completedCount = completedItems.length;
  const avgScore = completedCount > 0
    ? Math.round(completedItems.reduce((sum, a) => {
        const r = results[a.resultKey];
        const pct = r?.totalPoints > 0 ? Math.round((r.score / r.totalPoints) * 100) : 0;
        return sum + pct;
      }, 0) / completedCount)
    : 0;

  /* filtered list */
  const filtered = useMemo(() => {
    return assessments.filter(a => {
      const isCompleted = !!results[a.resultKey];

      const matchesFilter =
        filter === "all" ||
        (filter === "completed" && isCompleted) ||
        (filter === "pending" && !isCompleted);

      const matchesSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
        a.moduleTitle.toLowerCase().includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [assessments, results, filter, search]);

  /* ── render ── */
  return (
    <div className="min-h-screen">
      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00152E] via-[#001A3A] to-[#1a3884]">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#1a3884]/40 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-blue-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          {/* Badge + title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Micro Assessments
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your Assessment<br className="sm:hidden" />{" "}
              <span className="bg-gradient-to-r from-blue-300 to-sky-200 bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="mt-2 max-w-lg text-sm font-medium text-white/60">
              Bite-sized knowledge checks embedded in your learning sessions. Track your progress across all courses.
            </p>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={ClipboardCheck} label="Total" value={loading ? "—" : totalCount} accent="#60a5fa" delay={0.1} />
            <StatCard icon={CheckCircle2} label="Completed" value={loading ? "—" : completedCount} accent="#22c55e" delay={0.15} />
            <StatCard icon={Trophy} label="Avg. Score" value={loading ? "—" : `${avgScore}%`} accent="#f59e0b" delay={0.2} />
            <StatCard icon={Flame} label="Streak" value={loading ? "—" : `${completedCount > 0 ? "🔥" : "—"}`} accent="#f97316" delay={0.25} />
          </div>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Search + Filter bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="ma-search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, course or module…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 shadow-sm placeholder:text-slate-400 focus:border-[#1a3884] focus:outline-none focus:ring-2 focus:ring-[#1a3884]/20 dark:border-white/10 dark:bg-[#002147] dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Filter pills */}
          <div className="flex gap-2">
            {[
              { key: "all", label: "All" },
              { key: "completed", label: "Completed" },
              { key: "pending", label: "Pending" },
            ].map(opt => (
              <button
                key={opt.key}
                id={`filter-${opt.key}`}
                onClick={() => setFilter(opt.key)}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  filter === opt.key
                    ? "bg-[#1a3884] text-white shadow-md shadow-[#1a3884]/20"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[#1a3884]/30 hover:bg-[#F8FAFC] dark:border-white/10 dark:bg-[#002147] dark:text-slate-300 dark:hover:bg-[#002A5C]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Assessment grid */}
        {loading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <EmptyState search={search} filter={filter} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((assessment, index) => {
                const result = results[assessment.resultKey];
                const isCompleted = !!result;
                const pct = isCompleted && result.totalPoints > 0
                  ? Math.round((result.score / result.totalPoints) * 100)
                  : 0;
                const grade = isCompleted ? getScoreGrade(pct) : null;

                return (
                  <motion.div
                    key={assessment.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ delay: index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <AssessmentCard
                      assessment={assessment}
                      isCompleted={isCompleted}
                      result={result}
                      pct={pct}
                      grade={grade}
                      onStart={() => navigate(`/dashboard/micro-assessments/${encodeURIComponent(assessment.id)}`, {
                        state: { assessment }
                      })}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

/* ─── AssessmentCard ──────────────────────────────────────── */
const AssessmentCard = ({ assessment, isCompleted, result, pct, grade, onStart }) => (
  <div className={`group relative flex flex-col overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-[#002147] ${
    isCompleted
      ? "border-blue-200 dark:border-blue-500/20"
      : "border-slate-200 hover:border-[#1a3884]/30 dark:border-white/10 dark:hover:border-[#1a3884]/40"
  }`}>
    {/* top bar */}
    <div className={`h-1 transition-all duration-500 ${isCompleted ? "bg-gradient-to-r from-[#1a3884] to-blue-400" : "bg-slate-100 dark:bg-[#002A5C] group-hover:bg-gradient-to-r group-hover:from-[#1a3884] group-hover:to-blue-400"}`} />

    <div className="flex flex-1 flex-col p-5 sm:p-6">
      {/* header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* course chip */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1a3884] dark:bg-[#003170] dark:text-blue-300">
            <BookOpen className="h-3 w-3" />
            {assessment.courseTitle}
          </span>
          <h3 className="mt-2 truncate text-base font-bold text-slate-900 dark:text-slate-100">
            {assessment.title}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {assessment.moduleTitle} · Session {assessment.dayId}
          </p>
        </div>

        {/* score ring or status icon */}
        {isCompleted ? (
          <ScoreRing pct={pct} size={56} stroke={5} />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#1a3884]/5 dark:bg-[#003170]">
            <ClipboardCheck className="h-5 w-5 text-[#1a3884] dark:text-blue-400" />
          </div>
        )}
      </div>

      {/* meta chips */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
          <HelpCircle className="h-3 w-3" />
          {assessment.questionCount || 5} Questions
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-400">
          <Clock className="h-3 w-3" />
          ~{Math.ceil((assessment.questionCount || 5) * 1.5)} min
        </span>
        {isCompleted && grade && (
          <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-sm ${grade.bg} ${grade.text} border-current/20`}>
            <Star className="h-3 w-3" />
            {grade.label}
          </span>
        )}
      </div>

      {/* status */}
      <div className="mb-4 flex items-center justify-between">
        <StatusBadge status={isCompleted ? "completed" : "pending"} />
        {isCompleted && result?.completedAt && (
          <span className="text-[10px] font-medium text-slate-400">
            {new Date(result.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto">
        <motion.button
          id={`ma-cta-${assessment.id}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className={`group/btn relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-bold shadow-sm transition-all duration-300 ${
            isCompleted
              ? "border border-slate-200 bg-white text-slate-700 hover:border-[#1a3884] hover:bg-[#1a3884] hover:text-white dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-300 dark:hover:bg-[#1a3884]"
              : "bg-gradient-to-r from-[#1a3884] via-[#2b57c4] to-[#3b6de3] text-white shadow-md shadow-[#1a3884]/15 hover:shadow-lg hover:-translate-y-0.5"
          }`}
        >
          {isCompleted ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Review Results
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" />
              Start Assessment
              <ArrowRight className="ml-auto h-4 w-4 opacity-70 transition-transform group-hover/btn:translate-x-1" />
            </>
          )}
        </motion.button>
      </div>
    </div>
  </div>
);

/* ─── Empty State ────────────────────────────────────────── */
const EmptyState = ({ search, filter }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center rounded-[28px] border border-slate-100 bg-white py-20 text-center dark:border-white/10 dark:bg-[#002147]"
  >
    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#F8FAFC] dark:bg-[#002A5C]">
      <ClipboardCheck className="h-9 w-9 text-slate-400 dark:text-slate-500" />
    </div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
      {search ? "No assessments found" : filter === "completed" ? "No completed assessments yet" : "No pending assessments"}
    </h3>
    <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
      {search
        ? `No results for "${search}". Try a different search term.`
        : filter === "completed"
        ? "Complete some micro-assessments in your courses to see them here."
        : "All your assessments are complete! Great work."}
    </p>
  </motion.div>
);

/* ─── Skeleton ───────────────────────────────────────────── */
const SkeletonGrid = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="animate-pulse overflow-hidden rounded-[24px] border border-slate-100 bg-white dark:border-white/10 dark:bg-[#002147]">
        <div className="h-1 bg-slate-100 dark:bg-[#002A5C]" />
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="h-5 w-2/5 rounded-lg bg-slate-100 dark:bg-[#002A5C]" />
              <div className="h-5 w-4/5 rounded bg-slate-100 dark:bg-[#003170]" />
              <div className="h-4 w-3/5 rounded bg-[#F8FAFC] dark:bg-[#002A5C]" />
            </div>
            <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-[#002A5C]" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-28 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
            <div className="h-8 w-20 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
          </div>
          <div className="h-12 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
        </div>
      </div>
    ))}
  </div>
);

export default MicroAssessmentList;
