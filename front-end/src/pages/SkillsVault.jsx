import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award, Trophy, BookOpen, Layers, ChevronRight, Download,
    Shield, Zap, Brain, Play, ArrowLeft, ChevronDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import useSmaartCourseProgress from "@/hooks/useSmaartCourseProgress";
import apiCall, { coursesAPI } from "@/services/api";
import { assessmentApi } from "@/services/assessmentApi";
import BadgeGallery from "@/components/badges/BadgeGallery";
import CertificateVerification from "@/components/landing/CertificateVerification";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const TABS = [
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "badges", label: "Badges", icon: Trophy },
    { id: "flashcards", label: "Flashcards", icon: Zap },
];

const SkillsVault = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();
    const userId = user?.id || user?._id;
    const { userProgress } = useSmaartCourseProgress(userId);
    const completedCourses = userProgress?.completedCourses || [];
    const [activeTab, setActiveTab] = useState("certificates");
    const [courses, setCourses] = useState([]);
    const [stageStatus, setStageStatus] = useState({});
    const [earnedBadgesCount, setEarnedBadgesCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeFlashcardCategory, setActiveFlashcardCategory] = useState("all");

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
                    }
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const badges = user?.badges || [];
    const completedAssessments = Object.values(stageStatus).filter(s => s?.completed).length;

    const certificateTypes = [
        { id: "capacity", title: t("skills_vault.certificates.names.capacity", "Certificate in Capacity & Work Readiness"), code: "CAP", level: t("skills_vault.certificates.levels.capacity", "Level 1") },
        { id: "capability", title: t("skills_vault.certificates.names.capability", "Advanced Certificate in Applied Capability"), code: "APC", level: t("skills_vault.certificates.levels.capability", "Level 2") },
        { id: "leadership", title: t("skills_vault.certificates.names.leadership", "Diploma in Employability & Leadership"), code: "ELR", level: t("skills_vault.certificates.levels.leadership", "Level 3") },
        { id: "combined", title: t("skills_vault.certificates.names.combined", "Master Diploma in Comprehensive Readiness"), code: "MPD", level: t("skills_vault.certificates.levels.combined", "Master") },
    ];

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

    courses.forEach(course => {
        const courseIdStr = String(course._id || '');
        const enrollment = enrollmentProgress.find(e =>
            (e.courseCode && e.courseCode === course.courseCode) ||
            String(e.courseId) === courseIdStr
        );

        const isCompleted = completedCourses.includes(course.courseCode) ||
            completedCourses.includes(course.courseNumber) ||
            completedCourses.includes(courseIdStr);

        // Show flashcards if the user is enrolled in the course or has completed it.
        const isEnrolled = !!enrollment;

        if (!isCompleted && !isEnrolled) return;

        const addCard = (card) => {
            if (!card) return;
            const termText = card.front || card.term || card.question;
            const defText = card.back || card.definition || card.answer;
            if (termText && defText) {
                // Prevent duplicate terms from being added
                const isDuplicate = courseFlashcards.some(c => c.term?.toLowerCase() === termText.toLowerCase());
                if (!isDuplicate) {
                    courseFlashcards.push({
                        term: termText,
                        definition: defText,
                        category: card.category || course.title || course.courseCode || 'Course Concept'
                    });
                }
            }
        };

        // 1. Direct stepE_FlashCard inside learningFlow (standard 8-step format)
        if (course.learningFlow) {
            const lf = course.learningFlow;
            if (lf.stepE_FlashCard && Array.isArray(lf.stepE_FlashCard.cards)) {
                lf.stepE_FlashCard.cards.forEach(addCard);
            }

            // Fallback for general values inside learningFlow
            Object.values(lf).forEach(step => {
                if (step && typeof step === 'object') {
                    if (Array.isArray(step.cards)) {
                        step.cards.forEach(addCard);
                    } else if (step.content && Array.isArray(step.content.cards)) {
                        step.content.cards.forEach(addCard);
                    }
                }
            });
        }

        // 2. steps directly on course
        if (Array.isArray(course.steps)) {
            course.steps.forEach(step => {
                if (step.type === 'flashcard' || step.type === 'flashcards' || step.contentType === 'flashcard') {
                    const cards = step.cards || step.content?.cards || [];
                    if (Array.isArray(cards)) {
                        cards.forEach(addCard);
                    } else if (step.content && typeof step.content === 'object') {
                        addCard(step.content);
                    }
                }
            });
        }

        // 3. modules -> days -> steps OR modules -> steps directly
        if (course.modules && Array.isArray(course.modules)) {
            course.modules.forEach(module => {
                // Some builders put steps directly in modules
                if (Array.isArray(module.steps)) {
                    module.steps.forEach(step => {
                        if (step.type === 'flashcard' || step.type === 'flashcards' || step.contentType === 'flashcard') {
                            const cards = step.cards || step.content?.cards || [];
                            if (Array.isArray(cards)) {
                                cards.forEach(addCard);
                            } else if (step.content && typeof step.content === 'object') {
                                addCard(step.content);
                            }
                        }
                    });
                }

                // standard days structure
                if (module.days && Array.isArray(module.days)) {
                    module.days.forEach(day => {
                        if (day.steps && Array.isArray(day.steps)) {
                            day.steps.forEach(step => {
                                if (step.type === 'flashcard' || step.type === 'flashcards' || step.contentType === 'flashcard') {
                                    const cards = step.cards || step.content?.cards || [];
                                    if (Array.isArray(cards)) {
                                        cards.forEach(addCard);
                                    } else if (step.content && typeof step.content === 'object') {
                                        addCard(step.content);
                                    }
                                }
                            });
                        }
                    });
                }
            });
        }
    });

    const allFlashcards = [...defaultFlashcards, ...courseFlashcards];

    // Filter by category
    const uniqueFlashcardCategories = ['all', ...new Set(allFlashcards.map(c => c.category || 'Course Concept'))];
    const flashcardFilterOptions = uniqueFlashcardCategories.map(cat => ({
        id: cat,
        label: cat === 'all' ? t("skills_vault.flashcards.all_categories", "All Categories") : cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    }));

    const filteredFlashcards = allFlashcards.filter(card => {
        return activeFlashcardCategory === 'all' || (card.category || 'Course Concept') === activeFlashcardCategory;
    });

    if (userLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F5F8FF] dark:bg-[#00152E]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d8e6f7] border-t-[#1a3884] shadow-lg dark:border-[#1a3884]/20 dark:border-t-blue-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-12 transition-colors duration-300">
            <div className="mx-auto max-w-7xl p-8">

                {/* Back Button - Mobile Only */}
                <div className="mb-4 md:hidden">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="group flex items-center gap-2 text-[#112b6b] dark:text-slate-300 text-[10px] font-bold uppercase tracking-[0.1em] hover:text-[#1a3884] transition-all"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        {t("my_courses_page.back_to_dashboard", "Back to Dashboard")}
                    </button>
                </div>

                {/* Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                              {(() => {
                                const title = t("skills_vault.hero_title", "Skills Vault");
                                const lastSpaceIndex = title.lastIndexOf(" ");
                                if (lastSpaceIndex !== -1) {
                                  return (
                                    <>
                                      {title.substring(0, lastSpaceIndex)}{" "}
                                      <span className="text-[#1a3884] dark:text-blue-300">
                                        {title.substring(lastSpaceIndex + 1)}
                                      </span>
                                    </>
                                  );
                                }
                                return title;
                              })()}
                            </h1>
                            <p className="mt-1 max-w-xl text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                {t("skills_vault.hero_subtitle", "Manage your certificates, badges, course progress, and key learning flashcards in a single, high-security professional vault.")}
                            </p>
                        </div>

                        {/* Moved Stats */}
                        <div className="flex shrink-0 items-center gap-3">
                            {/* Certificates Stat */}
                            <div className="flex items-center gap-3 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] px-4 py-2.5 dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] border border-blue-200/60 dark:bg-[#1a3884]/20 dark:border-blue-500/20">
                                    <Award className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-[14px] font-extrabold leading-none text-[#0d1f4e] dark:text-white">{certificateTypes.length}</p>
                                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">{t("skills_vault.overview.stats.certificates", "Certificates")}</p>
                                </div>
                            </div>
                            {/* Badges Stat */}
                            <div className="flex items-center gap-3 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] px-4 py-2.5 dark:border-[#1a3884]/20 dark:bg-[#001a3d]">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/20">
                                    <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-[14px] font-extrabold leading-none text-[#0d1f4e] dark:text-white">
                                        {earnedBadgesCount > 0 ? earnedBadgesCount : badges.length}
                                    </p>
                                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">{t("skills_vault.overview.stats.badges", "Badges Earned")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="mb-6 flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-bold whitespace-nowrap transition-all ${isActive
                                    ? "bg-[#1a3884] text-white shadow-sm"
                                    : "border border-[#d8e6f7] bg-white text-slate-500 hover:border-[#1a3884]/30 hover:text-[#1a3884] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-slate-400 dark:hover:text-blue-300"
                                    }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {t(`skills_vault.tabs.${tab.id}`, tab.label)}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >

                        {/* ════════ OVERVIEW TAB ════════ */}
                        {activeTab === "overview" && (
                            <div className="rounded-2xl border border-[#d8e6f7] bg-white p-6 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                <div className="mb-6">
                                    <h3 className="text-[16px] font-extrabold text-[#0d1f4e] dark:text-white">
                                        {t("skills_vault.overview.title", "What's in your Skills Vault?")}
                                    </h3>
                                    <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                        {t("skills_vault.overview.subtitle", "Your centralized hub that securely stores and showcases all your professional achievements.")}
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {[
                                        { key: "certificates", icon: Award, title: t("skills_vault.overview.items.certificates.title", "Certificates"), desc: t("skills_vault.overview.items.certificates.desc", "Verified credentials issued upon completing programme milestones.") },
                                        { key: "badges", icon: Trophy, title: t("skills_vault.overview.items.badges.title", "Badges & Achievements"), desc: t("skills_vault.overview.items.badges.desc", "Micro-credentials earned through course activities and engagement.") },
                                        { key: "courses", icon: BookOpen, title: t("skills_vault.overview.items.courses.title", "Course Overview"), desc: t("skills_vault.overview.items.courses.desc", "A dashboard view of your enrolled courses and overall progress.") },
                                        { key: "flashcards", icon: Zap, title: t("skills_vault.overview.items.flashcards.title", "Flashcards & Key Terms"), desc: t("skills_vault.overview.items.flashcards.desc", "Quick-reference cards for quotients and essential terminology.") },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-4 transition-colors hover:border-[#1a3884]/30 dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-[#1a3884]/50">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                                <item.icon className="h-5 w-5 text-[#1a3884] dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-[13.5px] font-bold text-[#0d1f4e] dark:text-white">{item.title}</h4>
                                                <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ════════ CERTIFICATES TAB ════════ */}
                        {activeTab === "certificates" && (
                            <div className="space-y-6">
                                <div className="rounded-2xl border border-[#d8e6f7] bg-white p-6 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <Award className="h-5 w-5 text-[#eab308]" />
                                                <h3 className="text-[16px] font-extrabold text-[#0d1f4e] dark:text-white">
                                                    {t("skills_vault.certificates.title", "Professional Credentials")}
                                                </h3>
                                            </div>
                                            <p className="mt-1 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                                {t("skills_vault.certificates.desc", "Your verified SMAART Institute certifications")}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate("/dashboard/certificate")}
                                            className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1a3884] px-5 py-2.5 text-[12px] font-bold text-white shadow-md transition-all hover:bg-[#132c6b] active:scale-95"
                                        >
                                            <Download className="h-4 w-4" /> {t("skills_vault.certificates.download_centre", "Download Certificates")}
                                        </button>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {certificateTypes.map((cert) => (
                                            <div
                                                key={cert.id}
                                                onClick={() => navigate("/dashboard/certificate", { state: { selectedCertId: cert.id } })}
                                                className="group flex cursor-pointer items-start gap-4 rounded-xl border border-[#d8e6f7] bg-[#f5f8ff] p-4 transition-all hover:border-[#1a3884]/50 hover:bg-white hover:shadow-[0_4px_20px_rgba(26,56,132,0.08)] dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:hover:border-[#1a3884]/50 dark:hover:bg-[#001630]"
                                            >
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] border border-blue-200/60 dark:bg-[#1a3884]/15 dark:border-blue-500/20 transition-transform group-hover:scale-105">
                                                    <Award className="h-6 w-6 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="mb-1.5 text-[13.5px] font-bold leading-tight text-[#0d1f4e] transition-colors group-hover:text-[#1a3884] dark:text-white dark:group-hover:text-blue-400">
                                                        {cert.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded-md border border-[#d8e6f7] bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:border-[#1a3884]/20 dark:bg-[#001630] dark:text-slate-400">
                                                            {cert.code}
                                                        </span>
                                                        <span className="rounded-md border border-blue-200 bg-[#eef4ff] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1a3884] dark:border-blue-500/20 dark:bg-[#1a3884]/20 dark:text-blue-400">
                                                            {cert.level}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="hidden h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                                    <ChevronRight className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                    <div className="border-b border-[#d8e6f7] p-5 dark:border-[#1a3884]/20">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-emerald-500" />
                                            <h3 className="text-[15px] font-extrabold text-[#0d1f4e] dark:text-white">
                                                {t("skills_vault.certificates.verification_title", "Credential Verification")}
                                            </h3>
                                        </div>
                                        <p className="mt-1 text-[12.5px] font-medium text-slate-500 dark:text-slate-400">
                                            {t("skills_vault.certificates.verification_desc", "Verify any SMAART certificate using its unique ID or QR code.")}
                                        </p>
                                    </div>
                                    <div className="p-3">
                                        <CertificateVerification isDashboard={true} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ════════ BADGES TAB ════════ */}
                        {activeTab === "badges" && (
                            <div className="rounded-2xl border border-[#d8e6f7] bg-white p-6 shadow-[0_2px_8px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 dark:bg-[#001630]">
                                <BadgeGallery badges={badges} completedCourses={completedCourses} userName={user?.fullName || "Student"} />
                            </div>
                        )}


                        {/* ════════ FLASHCARDS TAB ════════ */}
                        {activeTab === "flashcards" && (
                            <div className="space-y-6">
                                {/* Header with Filters */}
                                <div className="flex items-center justify-between flex-wrap gap-4 px-1">
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 w-full sm:w-auto">
                                        <h3 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#002147] dark:text-white">
                                            {t("skills_vault.flashcards.title", "Key Flashcards")}
                                        </h3>
                                    </div>
                                    <div className="flex w-full items-center gap-3 sm:w-auto">
                                        <div className="relative w-full sm:w-auto">
                                            <select
                                                value={activeFlashcardCategory}
                                                onChange={(e) => setActiveFlashcardCategory(e.target.value)}
                                                className="w-full appearance-none rounded-xl border border-[#d8e6f7] bg-white px-4 py-2.5 pr-10 text-[12.5px] font-bold text-[#0d1f4e] shadow-sm outline-none transition-all hover:border-[#1a3884]/30 focus:border-[#1a3884] focus:ring-2 focus:ring-[#1a3884]/20 sm:w-auto dark:border-[#1a3884]/20 dark:bg-[#001a3d] dark:text-white"
                                            >
                                                {flashcardFilterOptions.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                {filteredFlashcards.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {filteredFlashcards.map((card, i) => (
                                            <FlashcardItem key={i} card={card} index={i} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                                        <Zap className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                        <h3 className="text-[14px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                            {t("skills_vault.flashcards.no_cards_found", "No flashcards found for this category.")}
                                        </h3>
                                    </div>
                                )}
                            </div>
                        )}

                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

/* ── Flashcard Card Component ── */
const FlashcardItem = ({ card, index }) => {
    const { t } = useTranslation();
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setFlipped(!flipped)}
            className="group relative h-[180px] cursor-pointer perspective"
            style={{ perspective: "1000px" }}
        >
            <div
                className={`relative h-full w-full transition-transform duration-500 preserve-3d ${flipped ? "rotate-y-180" : ""}`}
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
            >
                {/* Front */}
                <motion.div
                    className="absolute inset-0 flex flex-col justify-between rounded-2xl border border-[#d8e6f7] bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-[#1a3884]/20 dark:bg-[#001630]"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                    animate={{ opacity: flipped ? 0 : 1 }}
                >
                    <div className="flex justify-center">
                        <span className="rounded-md border border-blue-200 bg-[#eef4ff] px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#1a3884] dark:border-blue-500/20 dark:bg-[#1a3884]/20 dark:text-blue-400">
                            {card.category}
                        </span>
                    </div>
                    <div className="flex items-center justify-center">
                        <h4 className="text-center text-[15px] font-extrabold leading-tight text-[#0d1f4e] dark:text-white">
                            {card.term}
                        </h4>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 transition-colors group-hover:text-[#1a3884] dark:group-hover:text-blue-400">
                        <Zap className="h-3 w-3" /> {t("skills_vault.flashcards.tap_reveal", "Tap to reveal")}
                    </div>
                </motion.div>

                {/* Back */}
                <motion.div
                    className="absolute inset-0 flex flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3884] to-[#001630] p-5 shadow-lg"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    animate={{ opacity: flipped ? 1 : 0 }}
                >
                    <p className="text-center text-[13px] font-medium leading-relaxed text-blue-50">
                        {card.definition}
                    </p>
                    <div className="mt-4 border-t border-white/10 pt-3 text-center text-[9px] font-bold uppercase tracking-wider text-blue-300/50">
                        {t("skills_vault.flashcards.flip_back", "Flip Back")}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SkillsVault;
