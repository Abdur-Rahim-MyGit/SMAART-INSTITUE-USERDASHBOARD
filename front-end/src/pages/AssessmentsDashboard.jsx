import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    Brain, CheckCircle2, ChevronRight,
    FileText, ArrowRight, Clock, Play, Eye, Info, Layers, Award, TrendingUp
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
            <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="max-w-6xl mx-auto space-y-8"
                    >
                        {/* Summary Stats */}
                        <div className="flex justify-end items-center gap-2.5">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm text-xs">
                                <Award className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-200">{completedCount}</span>
                                <span className="text-slate-400 dark:text-slate-500">/4 done</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 shadow-sm text-xs">
                                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-200">{pct}%</span>
                            </div>
                        </div>

                        {/* Progress Track */}
                        <div className="relative bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/40 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                {STAGES.map((s, i) => {
                                    const done = isCompleted(s.key);
                                    return (
                                        <div key={s.key} className="flex flex-col items-center gap-1.5 relative flex-1">
                                            {i < STAGES.length - 1 && (
                                                <div className="absolute top-4 left-[60%] right-[-40%] h-[2px]">
                                                    <div className={`h-full rounded-full transition-colors duration-500 ${done ? 'bg-[#1a3884] dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                </div>
                                            )}
                                            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                                                ${done
                                                    ? 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 border-2 border-slate-200 dark:border-slate-600'
                                                }`}>
                                                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                            </div>
                                            <span className={`text-[10px] font-bold tracking-wider ${done ? 'text-[#1a3884] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {s.key}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1a3884] to-[#2d5dc7]"
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Start</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Complete</span>
                            </div>
                        </div>

                        {/* ── Cards ── */}
                        {loading ? <SkeletonGrid /> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

                        {/* ── Guidelines ── */}
                        <GuidelinesCard />
                    </motion.div>
            </main>
        </div>
    );
};

/* ═══════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════ */

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
                    relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                    bg-white dark:bg-slate-800/60 border
                    ${completed
                        ? 'border-[#1a3884]/20 dark:border-blue-600/25 shadow-sm hover:shadow-md'
                        : 'border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                    }
                `}
            >
                {/* Top accent bar – unified brand blue */}
                <div className={`h-0.5 ${completed ? 'bg-[#1a3884] dark:bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                <div className="p-5 sm:p-6">
                    {/* Row 1: Number · Title · Status */}
                    <div className="flex items-start gap-3.5 mb-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold
                            ${completed
                                ? 'bg-[#1a3884] dark:bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600/40'
                            }`}>
                            {completed ? <CheckCircle2 className="w-5 h-5" /> : `0${index + 1}`}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                                {stage.title}
                            </h3>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
                                {stage.subtitle}
                            </p>
                        </div>

                        {completed && (
                            <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 mb-4">
                        {stage.description}
                    </p>

                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <FileText className="w-3 h-3" />
                            {stage.totalQuestions} Qs
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <Clock className="w-3 h-3" />
                            {stage.duration}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-600/30">
                            <Layers className="w-3 h-3" />
                            6 Quotients
                        </span>
                    </div>

                    {/* Score – only if completed */}
                    {completed && score !== undefined && (
                        <div className="mb-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-600/30">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Score</span>
                                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                                    {score}<span className="text-sm font-semibold text-slate-400 dark:text-slate-500 ml-0.5">%</span>
                                </span>
                            </div>
                            <div className="h-1.5 bg-slate-200 dark:bg-slate-600/50 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 + index * 0.1 }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1a3884] to-[#2d5dc7]"
                                />
                            </div>
                        </div>
                    )}

                    {/* CTA Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onAction(); }}
                        className={`
                            w-full py-3.5 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5
                            transition-all duration-300 active:scale-[0.97]
                            ${completed
                                ? 'bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600/40 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                                : 'border-2 border-[#1a3884] dark:border-blue-500 text-[#1a3884] dark:text-blue-400 bg-transparent hover:bg-[#1a3884]/[0.06] dark:hover:bg-blue-500/10 hover:shadow-md hover:shadow-blue-500/10'
                            }
                        `}
                    >
                        {completed ? (
                            <>
                                <Eye className="w-4 h-4" />
                                View Report
                                <ChevronRight className="w-4 h-4 ml-auto opacity-40" />
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-[#1a3884] dark:fill-blue-400" />
                                Start Assessment
                                <ArrowRight className="w-4 h-4 ml-auto opacity-60 group-hover:translate-x-1 transition-transform" />
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/40 overflow-hidden animate-pulse">
                <div className="h-0.5 bg-slate-200 dark:bg-slate-700" />
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700" />
                        <div className="flex-1 space-y-2 pt-1">
                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
                            <div className="h-2.5 bg-slate-100 dark:bg-slate-700/50 rounded w-2/5" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-100 dark:bg-slate-700/40 rounded w-full" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-700/40 rounded w-4/5" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/40 rounded-md" />
                        <div className="h-6 w-16 bg-slate-100 dark:bg-slate-700/40 rounded-md" />
                    </div>
                    <div className="h-11 bg-slate-100 dark:bg-slate-700/40 rounded-xl" />
                </div>
            </div>
        ))}
    </div>
);

/* ── Guidelines ── */
const GuidelinesCard = () => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/40 shadow-sm overflow-hidden"
    >
        <div className="p-5 sm:p-6 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/30 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Assessment Guidelines</h4>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                    {[
                        "Each stage contains unique questions assessing all 6 quotients.",
                        "Answers are saved in real-time — resume anytime if disconnected.",
                        "Retakes are not allowed by default. Contact admin for exceptions.",
                        "Screen recording, copy-paste & tab-switching are monitored."
                    ].map((text, i) => (
                        <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mt-[7px] flex-shrink-0" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

export default AssessmentsDashboard;
