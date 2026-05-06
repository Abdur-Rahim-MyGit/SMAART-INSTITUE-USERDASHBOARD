import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Brain, CheckCircle2, ChevronRight,
    FileText, ArrowRight, Clock, Play, Eye, Info, Layers, Award, TrendingUp, ShieldCheck
} from "lucide-react";
import { assessmentApi } from "@/services/assessmentApi";
import useUser from "@/hooks/useUser";

/* ─── Stage Definitions ─── */
const STAGES = [
    {
        key: 'T1', code: 'ASM00001',
        title: 'T1 – Baseline', subtitle: 'Foundation',
        description: 'Establish your foundational understanding and baseline competency across all six quotients.',
        totalQuestions: 36, duration: '45 min',
    },
    {
        key: 'T2', code: 'ASM00002',
        title: 'T2 – Capacity', subtitle: 'Growth',
        description: 'Measure your capacity for growth and development across cognitive and emotional domains.',
        totalQuestions: 34, duration: '40 min',
    },
    {
        key: 'T3', code: 'ASM00003',
        title: 'T3 – Capability', subtitle: 'Applied Skills',
        description: 'Evaluate your applied capability and professional readiness with advanced challenges.',
        totalQuestions: 36, duration: '45 min',
    },
    {
        key: 'T4', code: 'ASM00004',
        title: 'T4 – Leadership', subtitle: 'Mastery',
        description: 'Demonstrate your leadership potential and mastery across all competency dimensions.',
        totalQuestions: 34, duration: '40 min',
    }
];

/* ─── Component ─── */
const AssessmentsDashboard = () => {
    const navigate = useNavigate();
    const { user: currentUser, loading: userLoading } = useUser();
    const [stageStatus, setStageStatus] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const userData = sessionStorage.getItem("user");
                if (!userData) { setLoading(false); return; }
                const parsedUser = JSON.parse(userData);
                const userId = parsedUser.id || parsedUser._id;
                if (!userId) { setLoading(false); return; }
                const res = await assessmentApi.getStageStatus(userId);
                if (res.success && res.data) setStageStatus(res.data);
            } catch {
                /* silently fail */
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const isCompleted = (key) => stageStatus[key]?.completed === true;
    const completedCount = STAGES.filter(s => isCompleted(s.key)).length;
    const pct = Math.round((completedCount / STAGES.length) * 100);

    const handleAction = (stage) => {
        if (isCompleted(stage.key)) {
            navigate(`/assessment/${stage.key}/report`);
        } else {
            navigate(`/assessment/${stage.key}`);
        }
    };

    return (
        <div className="space-y-6">
            <main className="px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
                <div className="max-w-7xl mx-auto space-y-12">

                    {/* Hero Section – Matching Image 1 */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-[#4f46e5] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                                <div className="w-4 h-4 rounded-full bg-[#4f46e5]/10 flex items-center justify-center border border-[#4f46e5]/20">
                                    <ShieldCheck className="w-2.5 h-2.5" />
                                </div>
                                Certified Assessment Suite
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-5xl md:text-6xl font-black text-[#0f172a] tracking-tight leading-none">
                                    Assessments - <span className="text-[#1a3884]">Centre</span>
                                </h1>
                                <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
                                    Experience a structured pathway to mastery. Track your progress and measure your professional readiness.
                                </p>
                            </div>
                        </div>

                        {/* Overall Progress Card – Matching Image 1 */}
                        <div className="bg-white rounded-[32px] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.06)] border border-slate-50 flex items-center gap-10 min-w-[320px]">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Overall</p>
                                <h3 className="text-5xl font-black text-[#1a3884]">{pct}%</h3>
                            </div>
                            <div className="h-16 w-px bg-slate-100" />
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                                    <span className="text-sm font-bold text-slate-700">{completedCount} Completed</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    <span className="text-sm font-bold text-slate-400">{STAGES.length - completedCount} Remaining</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="space-y-12"
                    >
                        {/* Progress Track */}
                        <div className="relative bg-white dark:bg-slate-800/50 rounded-[32px] p-8 border border-slate-100 dark:border-slate-700/40 shadow-sm">
                            <div className="flex items-center justify-between mb-8">
                                {STAGES.map((s, i) => {
                                    const done = isCompleted(s.key);
                                    return (
                                        <div key={s.key} className="flex flex-col items-center gap-3 relative flex-1">
                                            {i < STAGES.length - 1 && (
                                                <div className="absolute top-5 left-[60%] right-[-40%] h-[2px]">
                                                    <div className={`h-full rounded-full transition-colors duration-500 ${done ? 'bg-[#1a3884] dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`} />
                                                </div>
                                            )}
                                            <div className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500
                                                    ${done
                                                    ? 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                                    : 'bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-100 dark:border-slate-600'
                                                }`}>
                                                {done ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                            </div>
                                            <span className={`text-[10px] font-black tracking-[0.2em] uppercase ${done ? 'text-[#1a3884] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {s.key}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="h-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1a3884] to-[#2d5dc7]"
                                />
                            </div>
                        </div>

                        {/* ── Cards ── */}
                        {loading ? <SkeletonGrid /> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {STAGES.map((stage, i) => (
                                    <StageCard
                                        key={stage.key}
                                        stage={stage}
                                        index={i}
                                        completed={isCompleted(stage.key)}
                                        stageData={stageStatus[stage.key]}
                                        onAction={() => handleAction(stage)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* ── Guidelines Section – Matching Image 2 ── */}
                        <GuidelinesSection />
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

/* ── Guidelines Section – Matching Image 2 ── */
const GuidelinesSection = () => (
    <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-white dark:bg-slate-800/40 rounded-[40px] border border-slate-100 dark:border-slate-700/30 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.05)] overflow-hidden relative group"
    >
        {/* Subtle background watermark */}
        <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
            <div className="w-80 h-80 rounded-full border-[40px] border-[#1a3884] flex items-center justify-center">
                <div className="w-12 h-40 bg-[#1a3884] rounded-full" />
            </div>
        </div>

        <div className="p-10 flex flex-col md:flex-row items-center gap-12 relative z-10">
            {/* Info Icon Box */}
            <div className="w-20 h-20 rounded-[28px] bg-[#eef2ff] border border-blue-100 flex items-center justify-center flex-shrink-0 text-[#4f46e5]">
                <Info className="w-10 h-10" />
            </div>

            <div className="flex-1 space-y-8">
                <h4 className="text-2xl font-black text-[#0f172a] tracking-tight">Assessment Protocol & Guidelines</h4>
                <div className="grid sm:grid-cols-2 gap-x-16 gap-y-8">
                    {[
                        { title: "DYNAMIC QUESTIONS", desc: "Each stage contains unique questions assessing all 6 quotients." },
                        { title: "REAL-TIME PERSISTENCE", desc: "Answers are saved in real-time — resume anytime if disconnected." },
                        { title: "SINGLE ATTEMPT", desc: "Retakes are not allowed by default. Contact admin for exceptions." },
                        { title: "INTEGRITY MONITORING", desc: "Screen recording, copy-paste & tab-switching are monitored." }
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] mt-2 flex-shrink-0" />
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-black text-[#0f172a] uppercase tracking-[0.2em]">{item.title}</p>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

/* ── Stage Card ── */
const StageCard = ({ stage, index, completed, stageData, onAction }) => {
    const score = stageData?.score;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: [.22, 1, .36, 1] }}
            whileHover={{ y: -3 }}
            className="group"
        >
            <div
                onClick={onAction}
                className={`
                    relative rounded-[32px] overflow-hidden cursor-pointer transition-all duration-300
                    bg-white dark:bg-slate-800/60 border
                    ${completed
                        ? 'border-[#1a3884]/20 dark:border-blue-600/25 shadow-sm hover:shadow-md'
                        : 'border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600'
                    }
                `}
            >
                {/* Top accent bar – unified brand blue */}
                <div className={`h-1 ${completed ? 'bg-[#1a3884] dark:bg-blue-500' : 'bg-slate-100 dark:bg-slate-700'}`} />

                <div className="p-8">
                    {/* Row 1: Number · Title · Status */}
                    <div className="flex items-start gap-6 mb-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg font-black
                            ${completed
                                ? 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-slate-50 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-600/40'
                            }`}>
                            {completed ? <CheckCircle2 className="w-7 h-7" /> : `0${index + 1}`}
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                            <h3 className="text-xl font-black text-[#0f172a] dark:text-white leading-tight tracking-tight">
                                {stage.title}
                            </h3>
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mt-1.5">
                                {stage.subtitle}
                            </p>
                        </div>

                        {completed && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 uppercase tracking-widest">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium mb-6">
                        {stage.description}
                    </p>

                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-3 mb-8">
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <FileText className="w-3.5 h-3.5" />
                            {stage.totalQuestions} Qs
                        </span>
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <Clock className="w-3.5 h-3.5" />
                            {stage.duration}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <Layers className="w-3.5 h-3.5" />
                            6 Quotients
                        </span>
                    </div>

                    {/* Score – only if completed */}
                    {completed && score !== undefined && (
                        <div className="mb-8 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600/30">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Your Performance</span>
                                <span className="text-2xl font-black text-[#1a3884] dark:text-white">
                                    {score}<span className="text-sm font-bold text-slate-400 ml-1">%</span>
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-600/50 rounded-full overflow-hidden p-0.5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 + index * 0.1 }}
                                    className="h-full rounded-full bg-[#1a3884]"
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(); }}
                        className={`
                            w-full py-4.5 px-8 rounded-2xl text-sm font-black flex items-center justify-center gap-3
                            transition-all duration-300 active:scale-[0.97]
                            ${completed
                                ? 'p-[1rem] bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 hover:bg-[#1a3884] hover:text-white hover:border-[#1a3884]'
                                : 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:scale-[1.02]'
                            }
                        `}
                    >
                        {completed ? (
                            <>
                                <Eye className="w-5 h-5" />
                                View Performance Report
                                <ChevronRight className="w-5 h-5 ml-auto opacity-30" />
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 fill-white" />
                                Start Stage Assessment
                                <ArrowRight className="w-5 h-5 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

/* ── Skeleton loader ── */
const SkeletonGrid = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-700/40 overflow-hidden animate-pulse">
                <div className="h-1 bg-slate-100 dark:bg-slate-700" />
                <div className="p-8 space-y-6">
                    <div className="flex items-start gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-700" />
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded w-3/5" />
                            <div className="h-3 bg-slate-50 dark:bg-slate-700/50 rounded w-2/5" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-slate-50 dark:bg-slate-700/40 rounded w-full" />
                        <div className="h-4 bg-slate-50 dark:bg-slate-700/40 rounded w-4/5" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-20 bg-slate-50 dark:bg-slate-700/40 rounded-xl" />
                        <div className="h-8 w-20 bg-slate-50 dark:bg-slate-700/40 rounded-xl" />
                    </div>
                    <div className="h-14 bg-slate-50 dark:bg-slate-700/40 rounded-2xl" />
                </div>
            </div>
        ))}
    </div>
);

export default AssessmentsDashboard;
