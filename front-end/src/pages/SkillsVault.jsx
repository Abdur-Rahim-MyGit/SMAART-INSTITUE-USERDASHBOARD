import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    Award, Trophy, BookOpen, Layers, ChevronRight, ChevronDown, Download,
    Zap, ArrowLeft, Loader2,
} from "@/components/icons";
import useUser from "@/hooks/useUser";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";
import apiCall, { coursesAPI } from "@/services/api";
import { assessmentApi } from "@/services/assessmentApi";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import BadgeGallery from "@/components/badges/BadgeGallery";
import CertificateVerification from "@/components/landing/CertificateVerification";

// Same tokens as CourseStructure / AssessmentsDashboard.
const SURFACE =
    "bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5]/80 dark:border-[#045C9A]/20 shadow-sm";
const PANEL =
    "bg-[#F1F5F9] dark:bg-[#072036]/60 border border-[#d7ebf5] dark:border-white/10";
const CHIP_BRAND =
    "bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]";
const BTN_PRIMARY =
    "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#072036] text-xs font-bold text-white shadow-md shadow-[#072036]/20 transition-colors hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white";
const EASE = [0.25, 0.1, 0.25, 1];

const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "badges", label: "Badges", icon: Trophy },
    { id: "flashcards", label: "Flashcards", icon: Zap },
];

const SectionTitle = ({ title, subtitle }) => (
    <div className="min-w-0">
        <h3 className="text-[16px] font-extrabold tracking-tight text-[#072036] dark:text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[13px] text-[#35566b] dark:text-slate-400">{subtitle}</p>}
    </div>
);

const SkillsVault = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();
    const userId = user?.id || user?._id;
    const { userProgress } = useSmaartCourseProgress(userId);
    const completedCourses = userProgress?.completedCourses || [];
    const [activeTab, setActiveTab] = useState("overview");
    const [courses, setCourses] = useState([]);
    const [stageStatus, setStageStatus] = useState({});
    const [earnedBadgesCount, setEarnedBadgesCount] = useState(0);
    const [earnedCerts, setEarnedCerts] = useState([]);
    const [activeFlashcardCategory, setActiveFlashcardCategory] = useState("all");

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

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const courseRes = await coursesAPI.getAll();
                if (courseRes?.data) setCourses(courseRes.data);
                else if (courseRes?.courses) setCourses(courseRes.courses);

                const userData = sessionStorage.getItem("user");
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    const currentUserId = parsedUser.id || parsedUser._id;
                    if (currentUserId) {
                        const res = await assessmentApi.getStageStatus(currentUserId);
                        if (res.success && res.data) setStageStatus(res.data);

                        try {
                            const badgeRes = await apiCall(`/badges/user/${currentUserId}/earned`);
                            if (badgeRes?.data) setEarnedBadgesCount(badgeRes.data.length);
                        } catch (e) {
                            console.error("Failed to fetch badges count", e);
                        }

                        try {
                            const certRes = await apiCall("/certificates/my-certificates");
                            if (certRes?.certificates) setEarnedCerts(certRes.certificates);
                        } catch (e) {
                            console.error("Failed to fetch certificates", e);
                        }
                    }
                }
            } catch {
                // the vault still renders with whatever loaded
            }
        };
        fetchAll();
    }, []);

    const badges = user?.badges || [];
    const badgeCount = earnedBadgesCount > 0 ? earnedBadgesCount : badges.length;
    const completedAssessments = Object.values(stageStatus).filter((s) => s?.completed).length;

    const certificateTypes = [
        { id: "capacity", title: t("skills_vault.certificates.names.capacity", "Certificate in Capacity & Work Readiness"), code: "CAP", level: t("skills_vault.certificates.levels.capacity", "Level 1") },
        { id: "capability", title: t("skills_vault.certificates.names.capability", "Advanced Certificate in Applied Capability"), code: "APC", level: t("skills_vault.certificates.levels.capability", "Level 2") },
        { id: "leadership", title: t("skills_vault.certificates.names.leadership", "Diploma in Employability & Leadership"), code: "ELR", level: t("skills_vault.certificates.levels.leadership", "Level 3") },
        { id: "combined", title: t("skills_vault.certificates.names.combined", "Master Diploma in Comprehensive Readiness"), code: "MPD", level: t("skills_vault.certificates.levels.combined", "Master") },
    ];

    // Only certificates the student has actually EARNED (auto-issued on assessment pass),
    // enriched with catalog meta (code/level) by certificateType.
    const earnedCertificates = earnedCerts.map((ec) => {
        const meta = certificateTypes.find((c) => c.id === ec.certificateType) || {};
        return {
            id: ec.certificateType,
            title: ec.certificateTitle || meta.title,
            code: meta.code,
            level: meta.level,
            certificateId: ec.certificateId,
            issueDate: ec.issueDate,
            readinessBand: ec.readinessBand,
        };
    });

    const defaultFlashcards = [
        { term: t("skills_vault.flashcards.cards.crq.term", "Cognitive Reasoning (CRQ)"), definition: t("skills_vault.flashcards.cards.crq.definition", "The ability to analyze, synthesize, and evaluate information to derive meaningful conclusions and solve complex problems."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
        { term: t("skills_vault.flashcards.cards.srq.term", "Self-Regulation (SRQ)"), definition: t("skills_vault.flashcards.cards.srq.definition", "The capacity to manage emotions, thoughts, and behaviors effectively across different situations and towards goals."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
        { term: t("skills_vault.flashcards.cards.lq.term", "Learning Agility (LQ)"), definition: t("skills_vault.flashcards.cards.lq.definition", "The willingness and ability to learn from experience and then apply those lessons in new and first-time situations."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
        { term: t("skills_vault.flashcards.cards.siq.term", "Social Interaction (SIQ)"), definition: t("skills_vault.flashcards.cards.siq.definition", "The skill of navigating social environments with emotional intelligence, empathy, and effective communication."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
        { term: t("skills_vault.flashcards.cards.peq.term", "Professional Execution (PEQ)"), definition: t("skills_vault.flashcards.cards.peq.definition", "The competence to deliver professional outcomes with accountability, precision, and stakeholder orientation."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
        { term: t("skills_vault.flashcards.cards.daq.term", "Digital & AI Literacy (DAQ)"), definition: t("skills_vault.flashcards.cards.daq.definition", "The ability to leverage digital tools and artificial intelligence to enhance productivity and innovation."), category: t("skills_vault.flashcards.category.Quotient", "Quotient") },
    ];

    const courseFlashcards = [];
    const enrollmentProgress = userProgress?.enrollmentProgress || [];

    courses.forEach((course) => {
        const courseIdStr = String(course._id || "");
        const enrollment = enrollmentProgress.find(
            (e) => (e.courseCode && e.courseCode === course.courseCode) || String(e.courseId) === courseIdStr
        );
        const isCompleted =
            completedCourses.includes(course.courseCode) ||
            completedCourses.includes(course.courseNumber) ||
            completedCourses.includes(courseIdStr);
        if (!isCompleted && !enrollment) return;

        const addCard = (card) => {
            if (!card) return;
            const termText = card.front || card.term || card.question;
            const defText = card.back || card.definition || card.answer;
            if (!termText || !defText) return;
            if (courseFlashcards.some((c) => c.term?.toLowerCase() === termText.toLowerCase())) return;
            courseFlashcards.push({
                term: termText,
                definition: defText,
                category: card.category || course.title || course.courseCode || "Course Concept",
            });
        };
        const addStep = (step) => {
            if (!step) return;
            if (step.type === "flashcard" || step.type === "flashcards" || step.contentType === "flashcard") {
                const cards = step.cards || step.content?.cards || [];
                if (Array.isArray(cards)) cards.forEach(addCard);
                else if (step.content && typeof step.content === "object") addCard(step.content);
            }
        };

        if (course.learningFlow) {
            const lf = course.learningFlow;
            if (Array.isArray(lf.stepE_FlashCard?.cards)) lf.stepE_FlashCard.cards.forEach(addCard);
            Object.values(lf).forEach((step) => {
                if (step && typeof step === "object") {
                    if (Array.isArray(step.cards)) step.cards.forEach(addCard);
                    else if (Array.isArray(step.content?.cards)) step.content.cards.forEach(addCard);
                }
            });
        }
        if (Array.isArray(course.steps)) course.steps.forEach(addStep);
        if (Array.isArray(course.modules)) {
            course.modules.forEach((module) => {
                if (Array.isArray(module.steps)) module.steps.forEach(addStep);
                if (Array.isArray(module.days)) module.days.forEach((day) => Array.isArray(day.steps) && day.steps.forEach(addStep));
            });
        }
    });

    const allFlashcards = [...defaultFlashcards, ...courseFlashcards];
    const uniqueFlashcardCategories = ["all", ...new Set(allFlashcards.map((c) => c.category || "Course Concept"))];
    const flashcardFilterOptions = uniqueFlashcardCategories.map((cat) => ({
        id: cat,
        label: cat === "all"
            ? t("skills_vault.flashcards.all_categories", "All Categories")
            : cat.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" "),
    }));
    const filteredFlashcards = allFlashcards.filter(
        (card) => activeFlashcardCategory === "all" || (card.category || "Course Concept") === activeFlashcardCategory
    );

    const overviewItems = [
        { key: "certificates", icon: Award, count: earnedCertificates.length, title: t("skills_vault.overview.items.certificates.title", "Certificates"), desc: t("skills_vault.overview.items.certificates.desc", "Verified credentials issued upon completing programme milestones."), stat: t("skills_vault.overview.stats.certificates", "Certificates"), go: () => setActiveTab("certificates") },
        { key: "badges", icon: Trophy, count: badgeCount, title: t("skills_vault.overview.items.badges.title", "Badges & Achievements"), desc: t("skills_vault.overview.items.badges.desc", "Micro-credentials earned through course activities and engagement."), stat: t("skills_vault.overview.stats.badges", "Badges Earned"), go: () => setActiveTab("badges") },
        { key: "courses", icon: BookOpen, count: completedCourses.length, title: t("skills_vault.overview.items.courses.title", "Course Overview"), desc: t("skills_vault.overview.items.courses.desc", "A dashboard view of your enrolled courses and overall progress."), stat: t("skills_vault.overview.stats.courses", "Courses"), go: () => navigate("/dashboard/courses") },
        { key: "flashcards", icon: Zap, count: allFlashcards.length, title: t("skills_vault.overview.items.flashcards.title", "Flashcards & Key Terms"), desc: t("skills_vault.overview.items.flashcards.desc", "Quick-reference cards for quotients and essential terminology."), stat: t("skills_vault.flashcards.title", "Key Flashcards"), go: () => setActiveTab("flashcards") },
    ];

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
                {/* Same ambient layer as the dashboard, courses and assessments pages */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
                    <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
                </div>
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
                    <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
                </div>

                <main className="relative z-10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
                        {/* Back button -- mobile only */}
                        <div className="flex items-center sm:hidden">
                            <button type="button" onClick={() => navigate("/dashboard")} className="group flex w-fit items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:group-hover:border-[#045C9A]/40">
                                    <ArrowLeft className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                                </div>
                                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                                    {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                                </span>
                            </button>
                        </div>

                        {/* Page hero -- same structure and type scale as Courses / Assessments */}
                        <motion.section
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: EASE }}
                            className={`relative w-full overflow-hidden rounded-2xl ${SURFACE}`}
                        >
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
                            <div className="relative z-10 px-6 py-5 sm:px-8 sm:py-6">
                                <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                                    {t("skills_vault.hero_title", "Skills Vault")}
                                </h1>
                                <p className="mt-0.5 max-w-2xl text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                                    {t("skills_vault.hero_subtitle", "Manage your certificates, badges, course progress, and key learning flashcards in a single, high-security professional vault.")}
                                </p>
                            </div>
                        </motion.section>

                        {/* Tabs */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
                            id="vault-tabs"
                            role="tablist"
                            className={`flex h-11 w-full max-w-full items-center gap-1 overflow-x-auto rounded-xl p-1 sm:w-fit ${PANEL}`}
                        >
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        role="tab"
                                        aria-selected={isActive}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-xs font-bold transition-colors ${
                                            isActive
                                                ? "bg-white text-[#045C9A] shadow-sm dark:bg-[#045C9A]/40 dark:text-white"
                                                : "text-[#35566b] hover:text-[#045C9A] dark:text-slate-400 dark:hover:text-white"
                                        }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {t(`skills_vault.tabs.${tab.id}`, tab.label)}
                                    </button>
                                );
                            })}
                        </motion.div>

                        {userLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <Loader2 className="h-9 w-9 animate-spin text-[#045C9A] dark:text-[#A6D7E8]" />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.25, ease: EASE }}
                                    role="tabpanel"
                                >
                                    {/* ════════ OVERVIEW ════════ */}
                                    {activeTab === "overview" && (
                                        <section className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                                            <SectionTitle
                                                title={t("skills_vault.overview.title", "What's in your Skills Vault?")}
                                                subtitle={t("skills_vault.overview.subtitle", "Your centralized hub that securely stores and showcases all your professional achievements.")}
                                            />
                                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                {overviewItems.map((item) => (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={item.go}
                                                        className={`group flex items-start gap-4 rounded-xl p-4 text-left transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06] ${PANEL}`}
                                                    >
                                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#045C9A] shadow-sm dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
                                                            <item.icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <h4 className="text-[14px] font-extrabold tracking-tight text-[#072036] dark:text-white">{item.title}</h4>
                                                                <span className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider tabular-nums ${CHIP_BRAND}`}>
                                                                    {item.count} {item.stat}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-[12.5px] leading-relaxed text-[#35566b] dark:text-slate-400">{item.desc}</p>
                                                        </div>
                                                        <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#045C9A] dark:text-slate-600 dark:group-hover:text-[#A6D7E8]" />
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* ════════ CERTIFICATES ════════ */}
                                    {activeTab === "certificates" && (
                                        <div className="flex flex-col gap-4 sm:gap-6">
                                            <section className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <SectionTitle
                                                        title={t("skills_vault.certificates.title", "Professional Credentials")}
                                                        subtitle={t("skills_vault.certificates.desc", "Your verified SMAART Institute certifications")}
                                                    />
                                                    <button type="button" onClick={() => navigate("/dashboard/certificate")} className={`${BTN_PRIMARY} h-9 shrink-0 px-4`}>
                                                        <Download className="h-4 w-4" />
                                                        {t("skills_vault.certificates.download_centre", "Download Certificates")}
                                                    </button>
                                                </div>

                                                {earnedCertificates.length > 0 ? (
                                                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                                        {earnedCertificates.map((cert) => (
                                                            <button
                                                                key={cert.certificateId}
                                                                type="button"
                                                                onClick={() => navigate("/dashboard/certificate", { state: { selectedCertId: cert.id } })}
                                                                className={`group flex items-start gap-4 rounded-xl p-4 text-left transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:hover:bg-white/[0.06] ${PANEL}`}
                                                            >
                                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#045C9A] shadow-sm dark:bg-[#0d3a5f] dark:text-[#A6D7E8]">
                                                                    <Award className="h-5 w-5" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="text-[14px] font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white">{cert.title}</h4>
                                                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                                        {cert.code && (
                                                                            <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-[#35566b] dark:bg-white/[0.06] dark:text-slate-300">
                                                                                {cert.code}
                                                                            </span>
                                                                        )}
                                                                        {cert.level && (
                                                                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${CHIP_BRAND}`}>
                                                                                {cert.level}
                                                                            </span>
                                                                        )}
                                                                        <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                                                            {t("skills_vault.certificates.earned", "Earned")}
                                                                        </span>
                                                                        {cert.issueDate && (
                                                                            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                                                                {new Date(cert.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-[#045C9A] dark:text-slate-600 dark:group-hover:text-[#A6D7E8]" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d7ebf5] px-6 py-12 text-center dark:border-white/10">
                                                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#045C9A]/10 dark:bg-[#045C9A]/25">
                                                            <Award className="h-6 w-6 text-[#045C9A] dark:text-[#A6D7E8]" />
                                                        </div>
                                                        <h4 className="text-[15px] font-extrabold tracking-tight text-[#072036] dark:text-white">
                                                            {t("skills_vault.certificates.none_title", "No certificates earned yet")}
                                                        </h4>
                                                        <p className="mt-1.5 max-w-sm text-[12.5px] text-[#35566b] dark:text-slate-400">
                                                            {t("skills_vault.certificates.none_desc", "Pass your stage assessments (T2–T4) to earn professional certificates. They'll appear here automatically.")}
                                                        </p>
                                                    </div>
                                                )}
                                            </section>

                                            <section className={`overflow-hidden rounded-2xl p-2 sm:p-4 ${SURFACE}`}>
                                                <CertificateVerification isDashboard={true} />
                                            </section>
                                        </div>
                                    )}

                                    {/* ════════ BADGES ════════ */}
                                    {activeTab === "badges" && (
                                        <section className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                                            <BadgeGallery badges={badges} completedCourses={completedCourses} userName={user?.fullName || "Student"} />
                                        </section>
                                    )}

                                    {/* ════════ FLASHCARDS ════════ */}
                                    {activeTab === "flashcards" && (
                                        <section className={`rounded-2xl p-5 sm:p-6 ${SURFACE}`}>
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                <SectionTitle
                                                    title={t("skills_vault.flashcards.title", "Key Flashcards")}
                                                    subtitle={t("skills_vault.overview.items.flashcards.desc", "Quick-reference cards for quotients and essential terminology.")}
                                                />
                                                <div className="relative w-full sm:w-64">
                                                    <select
                                                        id="flashcard-category"
                                                        value={activeFlashcardCategory}
                                                        onChange={(e) => setActiveFlashcardCategory(e.target.value)}
                                                        aria-label={t("skills_vault.flashcards.all_categories", "All Categories")}
                                                        className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] pl-3 pr-9 text-xs font-bold text-[#35566b] outline-none transition-colors focus:border-[#045C9A] focus:ring-2 focus:ring-[#045C9A]/20 dark:border-white/10 dark:bg-[#072036]/60 dark:text-slate-300"
                                                    >
                                                        {flashcardFilterOptions.map((cat) => (
                                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                </div>
                                            </div>

                                            {filteredFlashcards.length > 0 ? (
                                                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                                    {filteredFlashcards.map((card, i) => (
                                                        <FlashcardItem key={`${card.term}-${i}`} card={card} index={i} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#d7ebf5] px-6 py-12 text-center dark:border-white/10">
                                                    <Zap className="mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
                                                    <p className="text-[13px] font-semibold text-[#35566b] dark:text-slate-400">
                                                        {t("skills_vault.flashcards.no_cards_found", "No flashcards found for this category.")}
                                                    </p>
                                                </div>
                                            )}
                                        </section>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </main>
            </div>
        </PageTransition>
    );
};

/* ── Flashcard ── */
const FlashcardItem = ({ card, index }) => {
    const { t } = useTranslation();
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.3, ease: EASE }}
            className="[perspective:1200px]"
        >
            <button
                type="button"
                onClick={() => setFlipped((v) => !v)}
                aria-pressed={flipped}
                className="group relative block h-[176px] w-full text-left"
            >
                <motion.div
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="relative h-full w-full"
                >
                    {/* Front */}
                    <div
                        style={{ backfaceVisibility: "hidden" }}
                        className={`absolute inset-0 flex flex-col justify-between rounded-xl p-4 transition-colors group-hover:border-[#045C9A]/40 ${PANEL}`}
                    >
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${CHIP_BRAND}`}>
                                {card.category}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                {t("skills_vault.flashcards.tap_reveal", "Tap to reveal")}
                            </span>
                        </div>
                        <h4 className="text-[16px] font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white">{card.term}</h4>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#045C9A] dark:text-[#A6D7E8]">
                            <Zap className="h-3.5 w-3.5" />
                            {t("skills_vault.flashcards.key_term", "Key term")}
                        </span>
                    </div>

                    {/* Back */}
                    <div
                        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                        className="absolute inset-0 flex flex-col justify-between rounded-xl border border-[#045C9A]/30 bg-[#072036] p-4 text-white dark:bg-[#045C9A]/25"
                    >
                        <p className="text-[12.5px] leading-relaxed text-white/90">{card.definition}</p>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#A6D7E8]">
                            {t("skills_vault.flashcards.flip_back", "Flip Back")}
                        </span>
                    </div>
                </motion.div>
            </button>
        </motion.div>
    );
};

export default SkillsVault;
