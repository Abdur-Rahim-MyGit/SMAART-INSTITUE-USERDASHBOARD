import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    RiArrowLeftLine as ArrowLeft,
    RiArrowRightLine as ArrowRight,
    RiAwardLine as Award,
    RiBrainLine as Brain,
    RiCheckboxCircleLine as CheckCircle2,
    RiArrowRightSLine as ChevronRight,
    RiTimeLine as Clock,
    RiCloseLine as CloseIcon,
    RiEyeLine as Eye,
    RiFileListLine as FileText,
    RiInformationLine as Info,
    RiStackLine as Layers,
    RiPlayFill as Play,
    RiRestartLine as RotateCcw,
    RiLineChartLine as TrendingUp,
} from "@remixicon/react";
import { assessmentApi } from "@/services/assessmentApi";
import PageHero from "@/components/ui/PageHero";
import { toast } from "sonner";

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
    const { t } = useTranslation();
    const [stageStatus, setStageStatus] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedStage, setSelectedStage] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

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

    const handleResetAll = async () => {
        if (!window.confirm(t("assessments_dashboard.reset_confirm", "Are you sure you want to reset all 4 assessments? This will permanently delete your scores and progress, and you will have to restart T1 Baseline."))) {
            return;
        }

        try {
            setLoading(true);
            const userData = sessionStorage.getItem("user");
            if (!userData) {
                toast.error(t("assessments_dashboard.error_user_not_found", "User data not found. Please log in again."));
                return;
            }
            const parsedUser = JSON.parse(userData);
            const userId = parsedUser.id || parsedUser._id;
            if (!userId) {
                toast.error(t("assessments_dashboard.error_id_not_found", "User ID not found. Please log in again."));
                return;
            }

            const res = await assessmentApi.resetAllStages(userId);
            if (res.success) {
                setStageStatus({});
                toast.success(t("assessments_dashboard.success_reset", "Successfully reset all 4 assessments!"));
            } else {
                toast.error(res.error || t("assessments_dashboard.error_reset", "Failed to reset assessments"));
            }
        } catch (err) {
            console.error("Error resetting assessments:", err);
            toast.error(t("assessments_dashboard.error_generic", "An error occurred while resetting assessments."));
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (stage) => {
        if (isCompleted(stage.key)) {
            navigate(`/assessment/${stage.key}/report`);
            return;
        }

        setSelectedStage(stage);
        setAgreedToTerms(false);
    };

    return (
        <div className="bg-transparent transition-colors duration-300 min-h-screen pb-8">
            <main>
                <div className="mx-auto max-w-7xl space-y-6 pt-4">

                    {/* Clean header matching My Courses style */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                        {/* Mobile back button */}
                        <div className="md:hidden mb-2">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
                            >
                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                                    <ArrowLeft className="w-4 h-4" />
                                </div>
                                {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                            </button>
                        </div>

                        <div className="flex-1">
                            <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                {t("assessments_dashboard.title", "Assessments")}{" "}
                                <span className="text-[#1a3884] dark:text-blue-300">Centre</span>
                            </h1>
                            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                                {t("assessments_dashboard.subtitle", "Track your progress, complete each stage with confidence, and unlock your performance insights.")}
                            </p>
                        </div>

                        <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-[#d8e6f7] dark:border-[#1a3884]/20 pt-3 md:pt-0 md:pl-6">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleResetAll}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-[12px] font-bold text-rose-700 shadow-sm transition-all hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                {t("assessments_dashboard.reset_assessments", "Reset Assessments")}
                            </motion.button>
                        </div>
                    </motion.div>

                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="space-y-4"
                    >

                        {loading ? (
                            <SkeletonGrid />
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
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
                    </motion.section>
                </div>
            </main>

            {/* Assessment Guidelines popup modal */}
            <AnimatePresence>
                {selectedStage && (
                    <div className="fixed top-0 left-0 right-0 bottom-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedStage(null)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />

                        {/* Modal container */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-2xl dark:border-slate-800 dark:bg-[#002147] flex flex-col max-h-[85vh] mx-auto"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800/80 flex-shrink-0">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a3884] dark:text-blue-300 mb-0.5">
                                        {t("assessments_dashboard.modal_badge", "Assessment Gate")}
                                    </p>
                                    <h3 className="text-[17px] font-extrabold tracking-tight text-[#0d1f4e] dark:text-slate-100">
                                        {t(`assessments_dashboard.stages.${selectedStage.key}.title`, selectedStage.title)}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedStage(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#002A5C] dark:hover:text-slate-200 transition-colors flex-shrink-0"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                                {/* Stage description & summary */}
                                <div className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-5 dark:border-white/10 dark:bg-slate-800/40">
                                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-350">
                                        {t(`assessments_dashboard.stages.${selectedStage.key}.description`, selectedStage.description)}
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <InfoChip icon={FileText} label={`${selectedStage.totalQuestions} ${t("assessments_dashboard.questions", "Qs")}`} />
                                        <InfoChip icon={Clock} label={selectedStage.duration.replace("min", t("assessments_dashboard.min", "min"))} />
                                    </div>
                                </div>

                                {/* Protocol & Guidelines section inside modal */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#1a3884] dark:text-blue-300">
                                        {t("assessments_dashboard.guidelines_title", "Assessment Protocol & Guidelines")}
                                    </h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {[
                                            {
                                                key: "dynamic_questions",
                                                title: "DYNAMIC QUESTIONS",
                                                desc: "Each stage contains unique questions assessing all 6 quotients.",
                                            },
                                            {
                                                key: "real_time_persistence",
                                                title: "REAL-TIME PERSISTENCE",
                                                desc: "Answers are saved in real-time - resume anytime if disconnected.",
                                            },
                                            {
                                                key: "single_attempt",
                                                title: "SINGLE ATTEMPT",
                                                desc: "Retakes are not allowed by default. Contact admin for exceptions.",
                                            },
                                            {
                                                key: "integrity_monitoring",
                                                title: "INTEGRITY MONITORING",
                                                desc: "Screen recording, copy-paste and tab-switching are monitored.",
                                            },
                                        ].map((item) => (
                                            <div key={item.key} className="flex gap-3 rounded-xl border border-[#d8e6f7] bg-[#F8FAFC] p-3.5 dark:border-white/10 dark:bg-slate-800/30">
                                                <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1a3884] dark:bg-blue-400" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-700 dark:text-slate-300 mb-0.5">
                                                        {t(`assessments_dashboard.${item.key}_title`, item.title)}
                                                    </p>
                                                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                        {t(`assessments_dashboard.${item.key}_desc`, item.desc)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Checkbox agreement */}
                                <div className="border-t border-slate-100 pt-5 dark:border-slate-800">
                                    <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-slate-100/50 dark:border-white/10 dark:bg-[#002A5C]/40 dark:hover:bg-[#002A5C]/60">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        {/* Custom checkbox box */}
                                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-white transition-all peer-checked:border-[#1a3884] peer-checked:bg-[#1a3884] dark:border-slate-600 dark:bg-slate-800 dark:peer-checked:border-blue-500 dark:peer-checked:bg-blue-500 shadow-sm">
                                            <svg
                                                className={`h-3 w-3 stroke-current stroke-[3.5px] transition-opacity duration-200 ${agreedToTerms ? "opacity-100" : "opacity-0"}`}
                                                viewBox="0 0 24 24"
                                                fill="none"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 selection:bg-transparent">
                                            {t("assessments_dashboard.terms_checkbox", "I have read the protocols and guidelines, and I agree to proceed with the assessment and integrity monitoring.")}
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-[#F8FAFC] px-6 py-5 dark:border-slate-800/80 dark:bg-slate-900/60">
                                <button
                                    onClick={() => setSelectedStage(null)}
                                    className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#002147] dark:text-slate-300 dark:hover:bg-[#002A5C] transition-all"
                                >
                                    {t("common.cancel", "Cancel")}
                                </button>
                                <button
                                    disabled={!agreedToTerms}
                                    onClick={() => {
                                        const stageKey = selectedStage.key;
                                        setSelectedStage(null);
                                        navigate(`/assessment/${stageKey}`);
                                    }}
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 ${
                                        agreedToTerms
                                            ? "bg-[#1a3884] hover:bg-[#002147] hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                                            : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none"
                                    }`}
                                >
                                    <Play className="h-4 w-4 fill-white" />
                                    {t("assessments_dashboard.start_stage", "Start Stage Assessment")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// GuidelinesSection component has been removed as it is now integrated into the start assessment modal gate

const StageCard = ({ stage, index, completed, stageData, onAction }) => {
    const { t } = useTranslation();
    const score = stageData?.score;
    const durationLabel = stage.duration.replace("min", t("assessments_dashboard.min", "min"));

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="group"
        >
            <div
                onClick={onAction}
                className={`relative cursor-pointer overflow-hidden rounded-[20px] border bg-white transition-all duration-300 dark:bg-[#002147] hover:-translate-y-0.5 ${
                    completed
                        ? "border-emerald-200 shadow-sm hover:shadow-md dark:border-emerald-800/20"
                        : "border-[#d8e6f7] shadow-[0_2px_16px_rgba(26,56,132,0.05)] hover:shadow-[0_6px_20px_rgba(26,56,132,0.1)] hover:border-[#1a3884]/30 dark:border-white/10"
                }`}
            >
                <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[13px] font-bold border ${
                                    completed
                                        ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                                        : "bg-white border-[#d8e6f7] text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-400"
                                }`}
                            >
                                {completed ? <CheckCircle2 className="h-5 w-5" /> : `0${index + 1}`}
                            </div>

                            <div className="min-w-0 pt-0.5">
                                <h3 className="text-[15px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-slate-100">
                                    {t(`assessments_dashboard.stages.${stage.key}.title`, stage.title)}
                                </h3>
                                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                                    {t(`assessments_dashboard.stages.${stage.key}.subtitle`, stage.subtitle)}
                                </p>
                            </div>
                        </div>

                        {completed && (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t("assessments_dashboard.verified", "Verified")}
                                </span>
                            </div>
                        )}
                    </div>

                    <p className="mb-3 text-[12px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(`assessments_dashboard.stages.${stage.key}.description`, stage.description)}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <InfoChip icon={FileText} label={`${stage.totalQuestions} ${t("assessments_dashboard.questions", "Qs")}`} />
                        <InfoChip icon={Clock} label={durationLabel} />
                    </div>

                    {completed && score !== undefined && (
                        <div className="mb-4 rounded-[14px] border border-[#d8e6f7] bg-[#F8FAFC] p-3.5 dark:border-white/10 dark:bg-slate-800/50">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">
                                    {t("assessments_dashboard.performance", "Your Performance")}
                                </span>
                                <span className="text-lg font-black text-[#1a3884] dark:text-white">
                                    {score}<span className="ml-0.5 text-xs text-slate-500">%</span>
                                </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden dark:bg-[#003170]">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${score}%` }}
                                    transition={{ duration: 1, ease: "easeOut", delay: 0.4 + index * 0.08 }}
                                    className="h-full rounded-full bg-[#1a3884]"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAction();
                        }}
                        className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-bold transition-all duration-300 ${
                            completed
                                ? "border border-[#d8e6f7] bg-white text-slate-700 hover:bg-[#F8FAFC] dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-300"
                                : "bg-[#1a3884] text-white shadow-sm hover:bg-[#112b6b] hover:shadow-md"
                        }`}
                    >
                        {completed ? (
                            <>
                                <Eye className="h-4 w-4" />
                                {t("assessments_dashboard.view_report", "View Performance Report")}
                                <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 fill-white" />
                                {t("assessments_dashboard.start_stage", "Start Stage Assessment")}
                                <ArrowRight className="ml-auto h-4 w-4 opacity-80 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

const InfoChip = ({ icon: Icon, label }) => (
    <motion.span
        whileHover={{ y: -1, scale: 1.02 }}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300"
    >
        <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        {label}
    </motion.span>
);

const SkeletonGrid = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
            <div
                key={item}
                className="overflow-hidden rounded-[28px] border border-slate-100 bg-white animate-pulse dark:border-white/10 dark:bg-slate-900/60"
            >
                <div className="h-1 bg-slate-100 dark:bg-[#003170]" />
                <div className="space-y-5 p-6 sm:p-7">
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-[#003170]" />
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-5 w-3/5 rounded bg-slate-100 dark:bg-[#003170]" />
                            <div className="h-3 w-2/5 rounded bg-[#F8FAFC] dark:bg-[#002A5C]" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full rounded bg-[#F8FAFC] dark:bg-[#002A5C]" />
                        <div className="h-4 w-4/5 rounded bg-[#F8FAFC] dark:bg-[#002A5C]" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-20 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
                        <div className="h-8 w-20 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
                        <div className="h-8 w-20 rounded-xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
                    </div>
                    <div className="h-14 rounded-2xl bg-[#F8FAFC] dark:bg-[#002A5C]" />
                </div>
            </div>
        ))}
    </div>
);

export default AssessmentsDashboard;
