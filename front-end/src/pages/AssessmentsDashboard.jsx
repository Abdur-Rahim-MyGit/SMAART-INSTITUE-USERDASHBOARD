import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    Award,
    Brain,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    Info,
    Layers,
    Play,
    TrendingUp,
} from "lucide-react";
import { assessmentApi } from "@/services/assessmentApi";

const STAGES = [
    {
        key: "T1",
        code: "ASM00001",
        title: "T1 - Baseline",
        subtitle: "Foundation",
        description:
            "Establish your foundational understanding and baseline competency across all six quotients.",
        totalQuestions: 36,
        duration: "45 min",
    },
    {
        key: "T2",
        code: "ASM00002",
        title: "T2 - Capacity",
        subtitle: "Growth",
        description:
            "Measure your capacity for growth and development across cognitive and emotional domains.",
        totalQuestions: 34,
        duration: "40 min",
    },
    {
        key: "T3",
        code: "ASM00003",
        title: "T3 - Capability",
        subtitle: "Applied Skills",
        description:
            "Evaluate your applied capability and professional readiness with advanced challenges.",
        totalQuestions: 36,
        duration: "45 min",
    },
    {
        key: "T4",
        code: "ASM00004",
        title: "T4 - Leadership",
        subtitle: "Mastery",
        description:
            "Demonstrate your leadership potential and mastery across all competency dimensions.",
        totalQuestions: 34,
        duration: "40 min",
    },
];

const METRICS = [
    { label: "Guided Stages", value: "4", icon: Layers },
    { label: "Quotients", value: "6", icon: Brain },
    { label: "Reports", value: "Instant", icon: Award },
];

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

const AssessmentsDashboard = () => {
    const navigate = useNavigate();
    const [stageStatus, setStageStatus] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const userData = sessionStorage.getItem("user");
                if (!userData) {
                    setLoading(false);
                    return;
                }

                const parsedUser = JSON.parse(userData);
                const userId = parsedUser.id || parsedUser._id;
                if (!userId) {
                    setLoading(false);
                    return;
                }

                const res = await assessmentApi.getStageStatus(userId);
                if (res.success && res.data) {
                    setStageStatus(res.data);
                }
            } catch {
                // Keep dashboard usable if the status lookup fails.
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    const isCompleted = (key) => stageStatus[key]?.completed === true;
    const completedCount = STAGES.filter((stage) => isCompleted(stage.key)).length;
    const pct = Math.round((completedCount / STAGES.length) * 100);

    const handleAction = (stage) => {
        if (isCompleted(stage.key)) {
            navigate(`/assessment/${stage.key}/report`);
            return;
        }

        navigate(`/assessment/${stage.key}`);
    };

    return (
        <div className="space-y-6">
            <main className="px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
                <div className="mx-auto max-w-7xl space-y-8 lg:space-y-10">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_315px] xl:items-start">
                        <motion.section
                            initial={{ opacity: 0, y: 22, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -2 }}
                            className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef4ff_100%)] p-6 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(30,41,59,1)_100%)] sm:p-7"
                        >
                            <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
                            <div className="pointer-events-none absolute bottom-0 left-8 h-24 w-24 rounded-full bg-cyan-100/50 blur-3xl dark:bg-cyan-400/10" />

                            <div className="relative">
                                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-[#1a3884] shadow-sm dark:border-blue-400/20 dark:bg-slate-900/65 dark:text-blue-300">
                                    <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#1a3884] to-[#4f7cf3]" />
                                    Assessment Journey
                                </div>

                                <div className="mt-5 max-w-2xl space-y-3">
                                    <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl lg:text-[2.8rem] lg:leading-[1.02]">
                                        Assessments - <span className="text-[#1a3884] dark:text-blue-300">Centre</span>
                                    </h1>
                                    <p className="max-w-2xl text-sm font-medium leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                                        Experience a structured pathway to mastery. Track your progress, complete each
                                        stage with confidence, and unlock your performance insights.
                                    </p>
                                </div>

                                <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:max-w-2xl">
                                    {METRICS.map((metric, index) => {
                                        const Icon = metric.icon;

                                        return (
                                            <motion.div
                                                key={metric.label}
                                                initial={{ opacity: 0, y: 14 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.14 + index * 0.07, duration: 0.4 }}
                                                whileHover={{ y: -3, scale: 1.01 }}
                                                className="rounded-[22px] border border-white/80 bg-white/80 px-4 py-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.24)] backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/60"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="rounded-2xl bg-blue-50 p-2.5 text-[#1a3884] dark:bg-blue-500/10 dark:text-blue-300">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                                                        {metric.value}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                                    {metric.label}
                                                </p>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.section>

                        <motion.aside
                            initial={{ opacity: 0, y: 22, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -2 }}
                            className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95)_0%,_rgba(248,251,255,0.98)_100%)] p-5 shadow-[0_22px_54px_-36px_rgba(15,23,42,0.22)] dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.92)_0%,_rgba(30,41,59,0.96)_100%)]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                                        Overall Progress
                                    </p>
                                    <div className="flex items-end gap-2">
                                        <h2 className="text-3xl font-black leading-none text-[#1a3884] dark:text-blue-300">
                                            {pct}
                                        </h2>
                                        <span className="pb-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                            Score
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3 text-[#1a3884] shadow-inner dark:from-blue-500/10 dark:to-indigo-500/10 dark:text-blue-300">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>

                            <div className="mt-4 rounded-[24px] border border-slate-200/80 bg-white/85 p-4 dark:border-slate-700/70 dark:bg-slate-900/70">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-300">
                                        Stage completion progress
                                    </p>
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                        {pct} / 100
                                    </p>
                                </div>
                                <div className="mt-3 h-2 rounded-full bg-slate-100 p-0.5 dark:bg-slate-700/80">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#1a3884] via-[#3564d6] to-[#5d8dff]"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,_rgba(236,253,245,1)_0%,_rgba(220,252,231,0.72)_100%)] px-4 py-3 dark:border-emerald-500/20 dark:bg-[linear-gradient(180deg,_rgba(6,95,70,0.28)_0%,_rgba(6,78,59,0.18)_100%)]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600/80 dark:text-emerald-300">
                                        Completed
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
                                        {completedCount}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.85)_100%)] px-4 py-3 dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,_rgba(30,41,59,0.9)_0%,_rgba(15,23,42,0.85)_100%)]">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                        Remaining
                                    </p>
                                    <p className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
                                        {STAGES.length - completedCount}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 dark:border-slate-700/70 dark:bg-slate-900/70">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                                    Current Status
                                </p>
                                <p className="mt-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                    {completedCount === STAGES.length
                                        ? "All stages completed. Reports are ready to review."
                                        : completedCount === 0
                                            ? "You are ready to begin the first assessment stage."
                                            : "Continue from your next unlocked stage to complete the journey."}
                                </p>
                            </div>
                        </motion.aside>
                    </div>

                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="space-y-8 lg:space-y-10"
                    >
                        <motion.div
                            {...fadeUp}
                            whileHover={{ y: -2 }}
                            className="rounded-[30px] border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-5 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.16)] dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_100%)] sm:p-6"
                        >
                            <div className="mb-5 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
                                        Progress Map
                                    </p>
                                    <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100 sm:text-xl">
                                        Move through each stage with a clear sequence
                                    </h3>
                                </div>

                                <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 sm:flex">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    {completedCount} of {STAGES.length} complete
                                </div>
                            </div>

                            <div className="mb-6 flex items-center justify-between gap-2 sm:gap-3">
                                {STAGES.map((stage, index) => {
                                    const done = isCompleted(stage.key);

                                    return (
                                        <div key={stage.key} className="relative flex min-w-0 flex-1 flex-col items-center gap-2">
                                            {index < STAGES.length - 1 && (
                                                <div className="absolute left-[58%] right-[-42%] top-4 h-[2px]">
                                                    <div
                                                        className={`h-full rounded-full transition-colors duration-500 ${
                                                            done
                                                                ? "bg-gradient-to-r from-[#1a3884] to-[#5d8dff]"
                                                                : "bg-slate-100 dark:bg-slate-700"
                                                        }`}
                                                    />
                                                </div>
                                            )}

                                            <div
                                                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black transition-all duration-500 sm:h-10 sm:w-10 sm:rounded-2xl sm:text-sm ${
                                                    done
                                                        ? "bg-gradient-to-br from-[#1a3884] to-[#3b6de3] text-white shadow-lg shadow-blue-500/20"
                                                        : "border-2 border-slate-100 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                                                }`}
                                            >
                                                {done ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : index + 1}
                                            </div>

                                            <span
                                                className={`text-[9px] font-black uppercase tracking-[0.16em] sm:text-[10px] ${
                                                    done ? "text-[#1a3884] dark:text-blue-300" : "text-slate-400 dark:text-slate-500"
                                                }`}
                                            >
                                                {stage.key}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="h-2 rounded-full bg-slate-100 p-0.5 dark:bg-slate-700/80">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1a3884] via-[#3564d6] to-[#5d8dff]"
                                />
                            </div>
                        </motion.div>

                        {loading ? (
                            <SkeletonGrid />
                        ) : (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                {STAGES.map((stage, index) => (
                                    <StageCard
                                        key={stage.key}
                                        stage={stage}
                                        index={index}
                                        completed={isCompleted(stage.key)}
                                        stageData={stageStatus[stage.key]}
                                        onAction={() => handleAction(stage)}
                                    />
                                ))}
                            </div>
                        )}

                        <GuidelinesSection />
                    </motion.section>
                </div>
            </main>
        </div>
    );
};

const GuidelinesSection = () => (
    <motion.div
        {...fadeUp}
        whileHover={{ y: -2 }}
        className="group relative overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,_#ffffff_0%,_#f9fbff_100%)] shadow-[0_15px_40px_-24px_rgba(15,23,42,0.12)] dark:border-slate-700/70 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_100%)]"
    >
        <div className="absolute -bottom-10 -right-10 opacity-[0.03] transition-transform duration-1000 group-hover:scale-110">
            <div className="flex h-80 w-80 items-center justify-center rounded-full border-[40px] border-[#1a3884]">
                <div className="h-40 w-12 rounded-full bg-[#1a3884]" />
            </div>
        </div>

        <div className="relative z-10 flex flex-col items-start gap-8 p-6 sm:p-8 lg:flex-row lg:gap-10 lg:p-9">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[22px] border border-blue-100 bg-[linear-gradient(180deg,_#eef2ff_0%,_#f8fbff_100%)] text-[#4f46e5] shadow-sm dark:border-blue-400/20 dark:bg-[linear-gradient(180deg,_rgba(59,130,246,0.12)_0%,_rgba(30,41,59,0.8)_100%)] dark:text-blue-300">
                <Info className="h-8 w-8" />
            </div>

            <div className="flex-1 space-y-6">
                <h4 className="text-xl font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-2xl">
                    Assessment Protocol & Guidelines
                </h4>

                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                    {[
                        {
                            title: "DYNAMIC QUESTIONS",
                            desc: "Each stage contains unique questions assessing all 6 quotients.",
                        },
                        {
                            title: "REAL-TIME PERSISTENCE",
                            desc: "Answers are saved in real-time - resume anytime if disconnected.",
                        },
                        {
                            title: "SINGLE ATTEMPT",
                            desc: "Retakes are not allowed by default. Contact admin for exceptions.",
                        },
                        {
                            title: "INTEGRITY MONITORING",
                            desc: "Screen recording, copy-paste and tab-switching are monitored.",
                        },
                    ].map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.4 }}
                            transition={{ delay: index * 0.06, duration: 0.35 }}
                            whileHover={{ x: 2 }}
                            className="flex gap-4"
                        >
                            <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#4f46e5]" />
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-950 dark:text-slate-100">
                                    {item.title}
                                </p>
                                <p className="text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </motion.div>
);

const StageCard = ({ stage, index, completed, stageData, onAction }) => {
    const score = stageData?.score;

    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -5, scale: 1.01 }}
            className="group"
        >
            <div
                onClick={onAction}
                className={`relative cursor-pointer overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] transition-all duration-300 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1)_0%,_rgba(30,41,59,1)_100%)] ${
                    completed
                        ? "border-[#1a3884]/20 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.14)] hover:shadow-[0_24px_48px_-28px_rgba(26,56,132,0.22)] dark:border-blue-500/25"
                        : "border-slate-200/80 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.12)] hover:border-slate-300/70 hover:shadow-[0_22px_44px_-30px_rgba(15,23,42,0.16)] dark:border-slate-700/70 dark:hover:border-slate-600"
                }`}
            >
                <div className={`h-1 ${completed ? "bg-gradient-to-r from-[#1a3884] to-[#5d8dff]" : "bg-slate-100 dark:bg-slate-700"}`} />

                <div className="p-6 sm:p-7">
                    <div className="mb-5 flex items-start gap-4 sm:gap-5">
                        <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-base font-black ${
                                completed
                                    ? "bg-gradient-to-br from-[#1a3884] to-[#3b6de3] text-white shadow-lg shadow-blue-500/20"
                                    : "border border-slate-100 bg-white text-slate-400 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-500"
                            }`}
                        >
                            {completed ? <CheckCircle2 className="h-6 w-6" /> : `0${index + 1}`}
                        </div>

                        <div className="min-w-0 flex-1 pt-0.5">
                            <h3 className="text-lg font-black leading-tight tracking-tight text-slate-950 dark:text-slate-100 sm:text-xl">
                                {stage.title}
                            </h3>
                            <p className="mt-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                {stage.subtitle}
                            </p>
                        </div>

                        {completed && (
                            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-[linear-gradient(180deg,_#ecfdf5_0%,_#dcfce7_100%)] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Verified
                            </span>
                        )}
                    </div>

                    <p className="mb-5 text-sm font-medium leading-6 text-slate-500 dark:text-slate-300">{stage.description}</p>

                    <div className="mb-6 flex flex-wrap items-center gap-2.5">
                        <InfoChip icon={FileText} label={`${stage.totalQuestions} Qs`} />
                        <InfoChip icon={Clock} label={stage.duration} />
                        <InfoChip icon={Layers} label="6 Quotients" />
                    </div>

                    {completed && score !== undefined && (
                        <div className="mb-6 rounded-2xl border border-slate-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-4 shadow-sm dark:border-slate-700 dark:bg-[linear-gradient(180deg,_rgba(15,23,42,0.9)_0%,_rgba(30,41,59,0.9)_100%)]">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                    Your Performance
                                </span>
                                <span className="text-xl font-black text-[#1a3884] dark:text-blue-300 sm:text-2xl">
                                    {score}
                                    <span className="ml-1 text-sm font-bold text-slate-400 dark:text-slate-500">%</span>
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 p-0.5 dark:bg-slate-700/80">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 + index * 0.08 }}
                                    className="h-full rounded-full bg-gradient-to-r from-[#1a3884] to-[#5d8dff]"
                                />
                            </div>
                        </div>
                    )}

                    <motion.button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAction();
                        }}
                        whileHover={completed ? { y: -1, scale: 1.01 } : { y: -2, scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        className={`flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-black transition-all duration-300 ${
                            completed
                                ? "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-[#1a3884] hover:bg-[#1a3884] hover:text-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-blue-600"
                                : "bg-gradient-to-r from-[#1a3884] via-[#2b57c4] to-[#3b6de3] text-white shadow-xl shadow-blue-500/15 hover:shadow-2xl"
                        }`}
                    >
                        {completed ? (
                            <>
                                <Eye className="h-5 w-5" />
                                View Performance Report
                                <ChevronRight className="ml-auto h-5 w-5 opacity-30" />
                            </>
                        ) : (
                            <>
                                <Play className="h-5 w-5 fill-white" />
                                Start Stage Assessment
                                <ArrowRight className="ml-auto h-5 w-5 opacity-60 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};

const InfoChip = ({ icon: Icon, label }) => (
    <motion.span
        whileHover={{ y: -1, scale: 1.02 }}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300"
    >
        <Icon className="h-3.5 w-3.5" />
        {label}
    </motion.span>
);

const SkeletonGrid = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
            <div
                key={item}
                className="overflow-hidden rounded-[28px] border border-slate-100 bg-white animate-pulse dark:border-slate-700 dark:bg-slate-900/60"
            >
                <div className="h-1 bg-slate-100 dark:bg-slate-700" />
                <div className="space-y-5 p-6 sm:p-7">
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-700" />
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-5 w-3/5 rounded bg-slate-100 dark:bg-slate-700" />
                            <div className="h-3 w-2/5 rounded bg-slate-50 dark:bg-slate-800" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full rounded bg-slate-50 dark:bg-slate-800" />
                        <div className="h-4 w-4/5 rounded bg-slate-50 dark:bg-slate-800" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-20 rounded-xl bg-slate-50 dark:bg-slate-800" />
                        <div className="h-8 w-20 rounded-xl bg-slate-50 dark:bg-slate-800" />
                        <div className="h-8 w-20 rounded-xl bg-slate-50 dark:bg-slate-800" />
                    </div>
                    <div className="h-14 rounded-2xl bg-slate-50 dark:bg-slate-800" />
                </div>
            </div>
        ))}
    </div>
);

export default AssessmentsDashboard;
