import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
// Material Symbols barrel -- the icon set the dashboard, courses list, profile
// and course player all use. This page pulled from @tabler/icons-react, which
// is why its icons sat at a different weight to the rest of the product.
import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    Clock,
    Eye,
    FileText,
    IconArrowLeft as ArrowLeft,
    Play,
    RiAlertLine as AlertTriangle,
    RotateCcw,
    ShieldCheck,
    X as CloseIcon,
} from "@/components/icons";
import { assessmentApi } from "@/services/assessmentApi";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
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
    else if (ass.assessmentCode === "ASM00001") key = "T1";
    else {
        key = ass.assessmentCode || ass._id;
    }

    let subtitle = "Assessment";
    if (key === "T1") subtitle = "Foundation";
    else if (key === "T2") subtitle = "Growth";
    else if (key === "T3") subtitle = "Applied Skills";
    else if (key === "T4") subtitle = "Mastery";

    const targetQuestionsMap = {
        T1: 36,
        T2: 34,
        T3: 34,
        T4: 36,
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

const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
};

const AssessmentsDashboard = () => {
    // The constellation canvas paints from a prop, not CSS, so it has to be
    // told when the dark class flips -- same observer the dashboard uses.
    const [isDarkTheme, setIsDarkTheme] = useState(
        typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

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
                    // Blueprint v1.0 is T1–T4 only; retired stages (ASM00005–07 / AIQ/SQ/PIQ) are excluded.
                    const RETIRED_CODES = ["ASM00005", "ASM00006", "ASM00007"];
                    const mappedStages = assessmentsRes.data
                        .filter((ass) => !RETIRED_CODES.includes(ass.assessmentCode) && !["AIQ", "SQ", "PIQ"].includes(ass.questionCategory))
                        .map(mapAssessmentToStage)
                        .filter((s) => ["T1", "T2", "T3", "T4"].includes(s.key));
                    const order = { T1: 1, T2: 2, T3: 3, T4: 4 };
                    mappedStages.sort((a, b) => (order[a.key] || 99) - (order[b.key] || 99));
                    // An empty array is still a "successful" response, so guard
                    // on the mapped length as well: without this, a tenant whose
                    // admin has published no T1-T4 assessments got a blank page
                    // with no cards and no explanation.
                    setStages(mappedStages.length > 0 ? mappedStages : DEFAULT_STAGES);
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
        <PageTransition>
        <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
            {/* Same ambient layer as the dashboard and courses pages */}
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
                <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
            </div>
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
                <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
            </div>

            <main className="relative z-10">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">

                    {/* Back Button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => navigate("/dashboard")}
                            className="group flex items-center gap-3 w-fit selection:bg-transparent"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-[#d7ebf5] dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:border-[#d7ebf5] dark:group-hover:border-[#045C9A]/40 transition-all duration-300">
                                <ArrowLeft className="h-4 w-4 text-[#034a7d] dark:text-slate-300 group-hover:-translate-x-0.5 transition-transform" />
                            </div>
                            <span className="text-[#034a7d] dark:text-[#A6D7E8] text-xs font-extrabold uppercase tracking-widest transition-colors group-hover:text-[#045C9A] dark:group-hover:text-white">
                                {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                            </span>
                        </button>
                    </div>

                    {/* Page hero -- same structure, padding and type scale as the
                        courses page hero, so the two read as one product. */}
                    <motion.section
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="relative w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
                    >
                        <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

                        <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 max-w-2xl">
                                <h1
                                    className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                                    style={{ letterSpacing: "-0.02em" }}
                                >
                                    {t("assessments_dashboard.title_full", "Assessments Centre")}
                                </h1>
                                <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                                    {t("assessments_dashboard.subtitle", "Track your progress, complete each stage with confidence, and unlock your performance insights.")}
                                </p>
                            </div>

                            {/* Destructive, but secondary: it reads as a quiet
                                control and only turns red on hover, rather than
                                sitting in the header permanently alarmed. */}
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] px-4 text-xs font-bold text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:w-auto dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    {t("assessments_dashboard.reset_assessments", "Reset Assessments")}
                                </button>
                            </div>
                        </div>
                    </motion.section>

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
                            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white shadow-2xl dark:border-white/10 dark:bg-[#072036] flex flex-col max-h-[85vh] mx-auto"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10 flex-shrink-0">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8] mb-0.5">
                                        {t("assessments_dashboard.modal_badge", "Assessment Gate")}
                                    </p>
                                    <h3 className="text-[17px] font-extrabold tracking-tight text-[#072036] dark:text-slate-100">
                                        {t(`assessments_dashboard.stages.${selectedStage.key}.title`, selectedStage.title)}
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedStage(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-[#EAF7FD] hover:text-slate-600 dark:hover:bg-[#0d3a5f] dark:hover:text-slate-200 transition-colors flex-shrink-0"
                                >
                                    <CloseIcon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-4">
                                {/* Stage description & summary */}
                                <div className="rounded-2xl border border-[#d7ebf5] bg-[#F1F5F9] p-5 dark:border-white/10 dark:bg-white/5">
                                    <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                        {t(`assessments_dashboard.stages.${selectedStage.key}.description`, selectedStage.description)}
                                    </p>
                                    <div className="mt-4 flex flex-wrap items-center gap-2">
                                        <InfoChip icon={FileText} label={`${selectedStage.totalQuestions} ${t("assessments_dashboard.questions", "Qs")}`} />
                                        <InfoChip icon={Clock} label={getDurationLabel(selectedStage.duration, t)} />
                                    </div>
                                </div>



                                {/* Integrity & Security Warning */}
                                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/10">
                                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-widest mb-3">
                                        <ShieldCheck className="h-4 w-4 shrink-0" />
                                        {t("assessments_dashboard.integrity_warning_title", "Integrity & Security Warning")}
                                    </div>
                                    <div className="space-y-2.5">
                                        <div className="flex gap-2.5 items-start">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <p className="text-[12px] font-bold leading-relaxed text-amber-900 dark:text-amber-300">
                                                {t("assessments_dashboard.integrity_warning_1", "Tab-switching, copying/pasting, and window minimization are strictly monitored in real-time.")}
                                            </p>
                                        </div>
                                        <div className="flex gap-2.5 items-start">
                                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                            <p className="text-[12px] font-bold leading-relaxed text-amber-900 dark:text-amber-300">
                                                {t("assessments_dashboard.integrity_warning_2", "Repeated warnings raise a risk score. If it crosses the threshold, the attempt is recorded as unverified and you will need to re-sit it \u2014 each retry uses a different question set.")}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Checkbox agreement */}
                                <div className="border-t border-[#d7ebf5] pt-5 dark:border-white/10">
                                    <label className="relative flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d7ebf5] bg-[#F1F5F9] p-4 transition-all hover:bg-[#EAF7FD] dark:border-white/10 dark:bg-[#0d3a5f]/40 dark:hover:bg-[#0d3a5f]/60">
                                        <input
                                            type="checkbox"
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        {/* Custom checkbox box */}
                                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-[#d7ebf5] bg-white text-white transition-all peer-checked:border-[#045C9A] peer-checked:bg-[#045C9A] dark:border-white/10 dark:bg-white/5 dark:peer-checked:border-[#A6D7E8] dark:peer-checked:bg-[#A6D7E8] shadow-sm">
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
                            <div className="flex items-center justify-end gap-3 border-t border-[#d7ebf5] bg-[#F1F5F9] px-6 py-5 dark:border-white/10 dark:bg-[#072036]/60">
                                <button
                                    onClick={() => setSelectedStage(null)}
                                    className="rounded-xl border border-[#d7ebf5] bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#072036] dark:text-slate-300 dark:hover:bg-[#0d3a5f] transition-all"
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
                                            ? "bg-[#045C9A] hover:bg-[#072036] hover:shadow-lg cursor-pointer hover:-translate-y-0.5"
                                            : "bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none"
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
        </PageTransition>
    );
};

// GuidelinesSection component has been removed as it is now integrated into the start assessment modal gate

const StageCard = ({ stage, index, completed, stageData, onAction }) => {
    const { t } = useTranslation();
    const score = stageData?.score;
    const durationLabel = getDurationLabel(stage.duration, t);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
            className="group h-full"
        >
            <div
                onClick={onAction}
                className={`relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-300 ease-out hover:-translate-y-1.5 motion-reduce:hover:translate-y-0 dark:bg-[#0d3a5f] ${
                    completed
                        ? "border-emerald-200 shadow-sm hover:shadow-md dark:border-emerald-800/20"
                        : stageData?.locked
                        ? "border-red-200 shadow-sm hover:shadow-md dark:border-red-900/20"
                        : "border-[#d7ebf5] shadow-[0_2px_16px_rgba(4,92,154,0.05)] hover:shadow-[0_6px_20px_rgba(4,92,154,0.10)] hover:border-[#045C9A]/30 dark:border-white/10"
                }`}
            >
                <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div
                                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold border ${
                                    completed
                                        ? "bg-emerald-500 border-emerald-600 text-white shadow-sm"
                                        : stageData?.locked
                                        ? "bg-red-500 border-red-600 text-white shadow-sm"
                                        : "bg-white border-[#d7ebf5] text-slate-500 shadow-sm dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-400"
                                }`}
                            >
                                {completed ? <CheckCircle2 className="h-5 w-5" /> : `0${index + 1}`}
                            </div>

                            <div className="min-w-0 pt-0.5">
                                <h3 className="text-base font-bold leading-tight tracking-tight text-[#072036] dark:text-white">
                                    {t(`assessments_dashboard.stages.${stage.key}.title`, stage.title)}
                                </h3>
                                <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                    {t(`assessments_dashboard.stages.${stage.key}.subtitle`, stage.subtitle)}
                                </p>
                            </div>
                        </div>

                        {completed ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {t("assessments_dashboard.verified", "Verified")}
                                </span>
                            </div>
                        ) : stageData?.locked ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-rose-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 animate-pulse">
                                    <AlertTriangle className="h-3 w-3" />
                                    {t("assessments_dashboard.locked", "Locked Out")}
                                </span>
                            </div>
                        ) : stageData?.attemptCount > 0 ? (
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                                    <RotateCcw className="h-3 w-3 animate-spin-slow" />
                                    {t("assessments_dashboard.attempt_badge", "Attempt {{current}}/{{max}}", { current: stageData.attemptCount, max: stageData.attemptCount + stageData.remainingAttempts })}
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
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
                        className={`group/btn mt-auto flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-[13px] font-semibold transition-colors ${
                            completed
                                ? "border-[#d7ebf5] bg-white text-slate-700 hover:bg-[#F1F5F9] dark:border-white/10 dark:bg-[#0d3a5f] dark:text-slate-200 dark:hover:bg-[#0d3a5f]/70"
                                : stageData?.locked
                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:border-transparent hover:bg-rose-600 hover:text-white dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                                : stageData?.attemptCount > 0
                                ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-transparent hover:bg-amber-500 hover:text-white dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                                : "border-[#045C9A]/25 bg-[#EAF7FD] text-[#045C9A] hover:border-transparent hover:bg-[#045C9A] hover:text-white dark:border-white/15 dark:bg-white/[0.06] dark:text-[#A6D7E8] dark:hover:border-transparent dark:hover:bg-[#A6D7E8] dark:hover:text-[#072036]"
                        }`}
                    >
                        {completed ? (
                            <>
                                <Eye className="h-4 w-4 shrink-0" />
                                <span>{t("assessments_dashboard.view_report", "View Performance Report")}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                        ) : stageData?.locked ? (
                            <>
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{t("assessments_dashboard.restart_stage_button", "Restart Course Stage")}</span>
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                        ) : stageData?.attemptCount > 0 ? (
                            <>
                                <Play fill={1} className="h-4 w-4 shrink-0" />
                                <span>{t("assessments_dashboard.retry_assessment", "Retry Assessment")}</span>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                            </>
                        ) : (
                            <>
                                <Play fill={1} className="h-4 w-4 shrink-0" />
                                <span>{t("assessments_dashboard.start_stage", "Start Stage Assessment")}</span>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
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
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#d7ebf5] bg-[#F1F5F9] px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:border-white/10 dark:bg-[#072036]/60 dark:text-slate-300"
    >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
    </motion.span>
);

const SkeletonGrid = () => (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
            <div
                key={item}
                className="overflow-hidden rounded-[28px] border border-[#d7ebf5] bg-white animate-pulse dark:border-white/10 dark:bg-[#072036]/60"
            >
                <div className="h-1 bg-[#F1F5F9] dark:bg-[#003170]" />
                <div className="space-y-5 p-6 sm:p-7">
                    <div className="flex items-start gap-5">
                        <div className="h-12 w-12 rounded-2xl bg-[#F1F5F9] dark:bg-[#003170]" />
                        <div className="flex-1 space-y-3 pt-2">
                            <div className="h-5 w-3/5 rounded bg-[#F1F5F9] dark:bg-[#003170]" />
                            <div className="h-3 w-2/5 rounded bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full rounded bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                        <div className="h-4 w-4/5 rounded bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                    </div>
                    <div className="flex gap-3">
                        <div className="h-8 w-20 rounded-xl bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                        <div className="h-8 w-20 rounded-xl bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                        <div className="h-8 w-20 rounded-xl bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                    </div>
                    <div className="h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#0d3a5f]" />
                </div>
            </div>
        ))}
    </div>
);

export default AssessmentsDashboard;
