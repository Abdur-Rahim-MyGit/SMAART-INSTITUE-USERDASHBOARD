import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    IconArrowLeft as ArrowLeft,
    IconArrowRight as ArrowRight,
    IconCertificate as Award,
    IconActivity as Brain,
    IconCircleCheckFilled as CheckCircle2,
    IconChevronRight as ChevronRight,
    IconClock as Clock,
    IconX as CloseIcon,
    IconEye as Eye,
    IconFileText as FileText,
    IconInfoCircle as Info,
    IconAlertTriangle as AlertTriangle,
    IconStack2 as Layers,
    IconPlayerPlayFilled as Play,
    IconRefresh as RotateCcw,
    IconTrendingUp as TrendingUp,
} from "@tabler/icons-react";
import { assessmentApi } from "@/services/assessmentApi";
import PageHero from "@/components/ui/PageHero";
import { toast } from "sonner";

const DEFAULT_STAGES = [
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
        totalQuestions: 34,
        duration: "45 min",
    },
    {
        key: "T4",
        code: "ASM00004",
        title: "T4 - Leadership",
        subtitle: "Mastery",
        description:
            "Demonstrate your leadership potential and mastery across all competency dimensions.",
        totalQuestions: 36,
        duration: "40 min",
    },
    {
        key: "AIQ",
        code: "ASM00005",
        title: "AIQ Assessment",
        subtitle: "AI & Digital Literacy",
        description:
            "Evaluate your artificial intelligence quotient, digital literacy, and technology readiness.",
        totalQuestions: 36,
        duration: "45 min",
    },
];

const getStageFallback = (key) =>
    DEFAULT_STAGES.find((stage) => stage.key === key) || {
        title: key,
        subtitle: "Assessment",
        description: "Take this evaluation to measure your professional quotients.",
    };

const getDurationLabel = (duration, t) => {
    const minutes = String(duration || "").match(/\d+/)?.[0];
    if (!minutes) return duration || "";
    return t("assessments_dashboard.duration_minutes", "{{count}} min", { count: minutes });
};

const mapAssessmentToStage = (ass) => {
    let key = "T1";
    if (ass.assessmentCode === "ASM00002") key = "T2";
    else if (ass.assessmentCode === "ASM00003") key = "T3";
    else if (ass.assessmentCode === "ASM00004") key = "T4";
    else if (ass.assessmentCode === "ASM00005" || ass.questionCategory === "AIQ") key = "AIQ";
    else if (ass.assessmentCode === "ASM00001") key = "T1";
    else {
        key = ass.assessmentCode || ass._id;
    }

    let subtitle = "Assessment";
    if (key === "T1") subtitle = "Foundation";
    else if (key === "T2") subtitle = "Growth";
    else if (key === "T3") subtitle = "Applied Skills";
    else if (key === "T4") subtitle = "Mastery";
    else if (key === "AIQ") subtitle = "AI & Digital Literacy";

    const targetQuestionsMap = {
        T1: 36,
        T2: 34,
        T3: 34,
        T4: 36,
        AIQ: 36,
    };
    const totalQuestions = targetQuestionsMap[key] || ass.totalQuestions || 36;

    let durationStr = "45 min";
    if (ass.duration) {
        if (ass.duration >= 1440) {
            const standardDurations = {
                T1: "45 min",
                T2: "40 min",
                T3: "45 min",
                T4: "40 min",
                AIQ: "45 min",
            };
            durationStr = standardDurations[key] || "45 min";
        } else {
            durationStr = `${ass.duration} min`;
        }
    } else {
        const standardDurations = {
            T1: "45 min",
            T2: "40 min",
            T3: "45 min",
            T4: "40 min",
            AIQ: "45 min",
        };
        durationStr = standardDurations[key] || "45 min";
    }

    // Default descriptions fallback if description is empty
    let description = ass.description || "";
    if (!description) {
        const standardDescriptions = {
            T1: "Establish your foundational understanding and baseline competency across all six quotients.",
            T2: "Measure your capacity for growth and development across cognitive and emotional domains.",
            T3: "Evaluate your applied capability and professional readiness with advanced challenges.",
            T4: "Demonstrate your leadership potential and mastery across all competency dimensions.",
            AIQ: "Evaluate your artificial intelligence quotient, digital literacy, and technology readiness.",
        };
        description = standardDescriptions[key] || "Take this evaluation to measure your professional quotients.";
    }

    const fallbackStage = getStageFallback(key);

    return {
        _id: ass._id,
        key: key,
        code: ass.assessmentCode || "",
        title: fallbackStage.title || ass.assessmentName,
        subtitle: fallbackStage.subtitle || subtitle,
        description: fallbackStage.description || description,
        totalQuestions: totalQuestions,
        duration: durationStr,
    };
};

const METRICS = [
    { label: "Guided Stages", value: "5", icon: Layers },
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
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStage, setSelectedStage] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
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

                const [statusRes, assessmentsRes] = await Promise.all([
                    assessmentApi.getStageStatus(userId).catch(() => null),
                    assessmentApi.getAll().catch(() => null)
                ]);

                if (statusRes && statusRes.success && statusRes.data) {
                    setStageStatus(statusRes.data);
                }

                if (assessmentsRes && assessmentsRes.success && assessmentsRes.data) {
                    const mappedStages = assessmentsRes.data.map(mapAssessmentToStage);
                    const order = { T1: 1, T2: 2, T3: 3, T4: 4, AIQ: 5 };
                    mappedStages.sort((a, b) => (order[a.key] || 99) - (order[b.key] || 99));
                    setStages(mappedStages);
                } else {
                    setStages(DEFAULT_STAGES);
                }
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                setStages(DEFAULT_STAGES);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const isCompleted = (key) => stageStatus[key]?.completed === true;
    const completedCount = stages.filter((stage) => isCompleted(stage.key)).length;
    const pct = Math.round((completedCount / (stages.length || 1)) * 100);

    const handleResetAll = async () => {
        if (!window.confirm(t("assessments_dashboard.reset_confirm", `Are you sure you want to reset all ${stages.length} assessments? This will permanently delete your scores and progress, and you will have to restart T1 Baseline.`))) {
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
                toast.success(t("assessments_dashboard.success_reset", `Successfully reset all ${stages.length} assessments!`));
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
                <div className="mx-auto max-w-7xl space-y-6 p-8">

                    {/* Back Button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="group flex items-center gap-3 w-fit selection:bg-transparent"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:shadow-md group-hover:border-slate-350 dark:group-hover:border-slate-600 transition-all duration-300">
                                <ArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                            <span className="text-[#112b6b] dark:text-blue-400 text-xs font-extrabold uppercase tracking-[0.15em] transition-colors group-hover:text-[#1a3884] dark:group-hover:text-blue-300">
                                {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                            </span>
                        </button>
                    </div>

                    {/* Consolidated Premium Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white p-6 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col xl:flex-row gap-6 justify-between"
                    >
                        <div className="flex-1">
                            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                {t("assessments_dashboard.title_main", "Assessments")}{" "}
                                <span className="text-[#1a3884] dark:text-blue-300">{t("assessments_dashboard.title_sub", "Centre")}</span>
                            </h1>
                            <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                                {t("assessments_dashboard.subtitle", "Track your progress, complete each stage with confidence, and unlock your performance insights.")}
                            </p>
                        </div>

                        <div className="flex items-center shrink-0">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleResetAll}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-xs font-bold text-rose-700 shadow-sm transition-all hover:bg-rose-100 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400 w-full sm:w-auto"
                            >
                                <RotateCcw stroke={1.5} className="h-3.5 w-3.5" />
                                {t("assessments_dashboard.reset_assessments", "Reset")}
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
                                {stages.map((stage, index) => (
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
                                    <CloseIcon stroke={1.5} className="h-4 w-4" />
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
                                        <InfoChip icon={Clock} label={getDurationLabel(selectedStage.duration, t)} />
                                    </div>
                                </div>



                                {/* Integrity & Security Warning */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
                                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-[0.2em] mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        {t("assessments_dashboard.integrity_warning_title", "Integrity & Security Warning")}
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex gap-2.5 items-start">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-550 shrink-0 mt-0.5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <p className="text-[12px] font-bold leading-relaxed text-amber-900 dark:text-amber-300">
                                                {t("assessments_dashboard.integrity_warning_1", "Tab-switching, copying/pasting, and window minimization are strictly monitored in real-time.")}
                                            </p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-550 shrink-0 mt-0.5 fill-none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <p className="text-[12px] font-bold leading-relaxed text-amber-900 dark:text-amber-300">
                                                {t("assessments_dashboard.integrity_warning_2", "A maximum of 3 warnings are allowed. A 4th security breach will result in immediate disqualification and account lockout.")}
                                            </p>
                                        </div>
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
                                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition-all duration-300 ${agreedToTerms
                                            ? "bg-[#1a3884] hover:bg-[#002147] hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                                            : "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none"
                                        }`}
                                >
                                    <Play size={16} className="h-4 w-4 fill-white" />
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
    const durationLabel = getDurationLabel(stage.duration, t);

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
                        : stageData?.locked
                        ? "border-red-200 shadow-sm hover:shadow-md dark:border-red-900/20"
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
                                        : stageData?.locked
                                        ? "bg-red-500 border-red-650 text-white shadow-sm"
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

                        {completed ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t("assessments_dashboard.verified", "Verified")}
                                </span>
                            </div>
                        ) : stageData?.locked ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-widest text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 animate-pulse">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t("assessments_dashboard.locked", "Locked Out")}
                                </span>
                            </div>
                        ) : stageData?.attemptCount > 0 ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-250 bg-amber-50 px-2.5 py-1 text-[9.5px] font-black uppercase tracking-widest text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                    <RotateCcw className="h-3 w-3 animate-spin-slow" />
                                    {t("assessments_dashboard.attempt_badge", "Attempt {{current}}/{{max}}", { current: stageData.attemptCount, max: stageData.attemptCount + stageData.remainingAttempts })}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <p className="mb-3 text-[12px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(`assessments_dashboard.stages.${stage.key}.description`, stage.description)}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <InfoChip icon={FileText} label={`${stage.totalQuestions} ${t("assessments_dashboard.questions", "Qs")}`} />
                        <InfoChip icon={Clock} label={durationLabel} />
                    </div>



                    <button
                        onClick={(event) => {
                            event.stopPropagation();
                            onAction();
                        }}
                        className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-bold transition-all duration-300 ${
                            completed
                                ? "border border-[#d8e6f7] bg-white text-slate-700 hover:bg-[#F8FAFC] dark:border-white/10 dark:bg-[#002A5C] dark:text-slate-300"
                                : stageData?.locked
                                ? "bg-red-650 text-white shadow-sm hover:bg-red-700 hover:shadow-md"
                                : stageData?.attemptCount > 0
                                ? "bg-amber-600 hover:bg-amber-650 text-white shadow-sm hover:shadow-md"
                                : "bg-[#1a3884] text-white shadow-sm hover:bg-[#112b6b] hover:shadow-md"
                        }`}
                    >
                        {completed ? (
                            <>
                                <Eye stroke={1.5} className="h-4 w-4" />
                                {t("assessments_dashboard.view_report", "View Performance Report")}
                                <ChevronRight stroke={1.5} className="ml-auto h-4 w-4 opacity-40" />
                            </>
                        ) : stageData?.locked ? (
                            <>
                                <AlertTriangle className="h-4 w-4" />
                                {t("assessments_dashboard.restart_stage_button", "Locked - Restart Course Stage")}
                                <ChevronRight className="ml-auto h-4 w-4 opacity-80" />
                            </>
                        ) : stageData?.attemptCount > 0 ? (
                            <>
                                <Play className="h-4 w-4 fill-white" />
                                {t("assessments_dashboard.retry_assessment", "Retry Assessment")}
                                <ArrowRight className="ml-auto h-4 w-4 opacity-85 transition-transform group-hover:translate-x-1" />
                            </>
                        ) : (
                            <>
                                <Play size={16} className="h-4 w-4 fill-white" />
                                {t("assessments_dashboard.start_stage", "Start Stage Assessment")}
                                <ArrowRight stroke={1.5} className="ml-auto h-4 w-4 opacity-80 transition-transform group-hover:translate-x-1" />
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
        <Icon stroke={1.5} className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
