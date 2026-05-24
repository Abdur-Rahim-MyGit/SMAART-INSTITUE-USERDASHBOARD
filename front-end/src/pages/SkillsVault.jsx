import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award, Trophy, BookOpen, Layers, ChevronRight, Download,
    Shield, Star, CheckCircle2, Clock, FileText, Zap, Brain,
    Upload, Link as LinkIcon, QrCode, Calendar, X, Play, Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import apiCall, { coursesAPI } from "@/services/api";
import { assessmentApi } from "@/services/assessmentApi";
import BadgeGallery from "@/components/badges/BadgeGallery";
import CertificateVerification from "@/components/landing/CertificateVerification";
import { toast } from "sonner";
import PageHero from "@/components/ui/PageHero";
import { useTranslation } from "react-i18next";

/* ══════════════════════════════════════
   Skills Vault – Your Professional Vault
   ══════════════════════════════════════ */

const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "badges", label: "Badges", icon: Trophy },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "flashcards", label: "Flashcards", icon: Zap },
];

const SkillsVault = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [courses, setCourses] = useState([]);
    const [stageStatus, setStageStatus] = useState({});
    const [loading, setLoading] = useState(true);

    /* ── Data fetch ── */
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const courseRes = await coursesAPI.getAll();
                if (courseRes?.courses) {
                    setCourses(courseRes.courses);
                }

                // Assessment status
                const userData = sessionStorage.getItem("user");
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    const userId = parsedUser.id || parsedUser._id;
                    if (userId) {
                        const res = await assessmentApi.getStageStatus(userId);
                        if (res.success && res.data) setStageStatus(res.data);
                    }
                }
            } catch {
                /* silently fail */
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    /* ── Derived stats ── */
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

    if (userLoading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1a3884] rounded-full animate-spin shadow-lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#00152E] transition-colors duration-500 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[5%] w-[40%] h-[40%] bg-[#1a3884]/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] -right-[5%] w-[30%] h-[50%] bg-blue-500/5 rounded-full blur-[130px]" />
            </div>

            <main className="w-full relative z-10 py-6 px-4 sm:px-6 lg:px-8 lg:py-8">
                <div className="max-w-7xl mx-auto space-y-5 lg:space-y-6">

                    {/* ── Standardized PageHero ── */}
                    <PageHero
                        badge={t("skills_vault.hero_badge", "Secure Professional Vault")}
                        title={t("skills_vault.hero_title", "Skills Vault")}
                        subtitle={t("skills_vault.hero_subtitle", "Manage your certificates, badges, course progress, and key learning flashcards in a single, high-security professional vault.")}
                    />

                    {/* ── Glassmorphic Tab Navigation ── */}
                    <div className="flex justify-center sticky top-4 z-50 px-2 sm:px-0">
                        <div className="inline-flex bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[24px] p-1.5 sm:p-2 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border border-slate-200/50 dark:border-slate-700/50 overflow-x-auto max-w-full no-scrollbar">
                            {TABS.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                const tabLabel = t(`skills_vault.tabs.${tab.id}`, tab.label);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-1.5 sm:gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${isActive
                                            ? "bg-[#1a3884] text-white shadow-lg shadow-blue-900/20 scale-105"
                                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/50"
                                            }`}
                                    >
                                        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'scale-110' : ''}`} />
                                        {tabLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Content ── */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        >

                            {/* ════════ OVERVIEW TAB ════════ */}
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { key: "certificates", label: "Certificates", value: certificateTypes.length, icon: Award, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                                            { key: "badges", label: "Badges Earned", value: badges.length, icon: Trophy, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                                            { key: "courses", label: "Courses", value: courses.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                                            { key: "assessments", label: "Assessments", value: `${completedAssessments}/4`, icon: Brain, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
                                        ].map((stat, i) => {
                                            const label = t(`skills_vault.overview.stats.${stat.key}`, stat.label);
                                            return (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className="bg-white dark:bg-slate-900/40 rounded-[24px] p-4 sm:p-6 border border-slate-100 dark:border-white/8 shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] hover:shadow-xl transition-all group"
                                                >
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 sm:mb-4 shadow-sm group-hover:scale-110 transition-transform`}>
                                                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-none">{stat.value}</h3>
                                                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{label}</p>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* What's in your wallet */}
                                    <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-5 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                        <div className="mb-6 sm:mb-8">
                                            <h3 className="text-xl font-black text-slate-950 dark:text-white mb-2">
                                                {t("skills_vault.overview.title", "What's in your Skills Vault?")}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                                                {t("skills_vault.overview.subtitle", "Your Skills Vault is a centralized hub that securely stores and showcases all your professional achievements, learning progress, and key resources.")}
                                            </p>
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                            {[
                                                { key: "certificates", icon: Award, title: "Certificates", desc: "Verified professional credentials issued upon completing programme milestones — Capacity, Capability, Leadership, and the Master Diploma." },
                                                { key: "badges", icon: Trophy, title: "Badges & Achievements", desc: "Micro-credentials earned through course activities, assessments, and engagement — each one verifiable and shareable." },
                                                { key: "courses", icon: BookOpen, title: "Course Overview", desc: "A dashboard view of all your enrolled courses, modules completed, and overall progress across the SMAART curriculum." },
                                                { key: "flashcards", icon: Zap, title: "Flashcards & Key Terms", desc: "Quick-reference cards for the six core quotients and other essential professional terminology from your learning journey." },
                                            ].map((item, i) => {
                                                const title = t(`skills_vault.overview.items.${item.key}.title`, item.title);
                                                const desc = t(`skills_vault.overview.items.${item.key}.desc`, item.desc);
                                                return (
                                                    <div key={i} className="flex gap-4 sm:gap-5 p-4 sm:p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 hover:border-[#1a3884]/20 transition-all group">
                                                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white dark:bg-[#002A5C] shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                                                            <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#1a3884] dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[14px] sm:text-[15px] font-black text-slate-900 dark:text-white mb-1">{title}</h4>
                                                            <p className="text-[12px] sm:text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ════════ CERTIFICATES TAB ════════ */}
                            {activeTab === "certificates" && (
                                <div className="space-y-6 sm:space-y-8">
                                    <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-5 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-6 sm:mb-8">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                                                    <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">
                                                        {t("skills_vault.certificates.title", "Professional Credentials")}
                                                    </h3>
                                                </div>
                                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                                                    {t("skills_vault.certificates.desc", "Your verified SMAART Institute certifications")}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => navigate("/dashboard/certificate")}
                                                className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-gradient-to-r from-[#1a3884] to-[#002147] text-white text-xs font-black uppercase tracking-widest hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all"
                                            >
                                                <Download className="w-4 h-4" /> {t("skills_vault.certificates.download_centre", "Download Centre")}
                                            </button>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                            {certificateTypes.map((cert, i) => (
                                                <motion.div
                                                    key={cert.id}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    onClick={() => navigate("/dashboard/certificate")}
                                                    className="bg-slate-50/50 dark:bg-slate-800/20 rounded-[28px] border border-slate-100 dark:border-slate-800/80 p-4 sm:p-6 cursor-pointer hover:border-[#1a3884]/40 dark:hover:border-blue-500/30 hover:shadow-xl hover:bg-white dark:hover:bg-slate-900 transition-all group"
                                                >
                                                    <div className="flex items-start gap-4 sm:gap-5">
                                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                                                            <Award className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-[14px] sm:text-[15px] font-black text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                                                                {cert.title}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white dark:bg-[#002A5C] text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/10">
                                                                    {cert.code}
                                                                </span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                                                                    {cert.level}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white dark:bg-[#002A5C] shadow-sm border border-slate-100 dark:border-white/10 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ChevronRight className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>



                                    {/* Verification Section */}
                                    <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 overflow-hidden shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                        <div className="p-5 sm:p-8 border-b border-slate-50 dark:border-white/8">
                                            <h3 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-3">
                                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                                                {t("skills_vault.certificates.verification_title", "Credential Verification")}
                                            </h3>
                                            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                {t("skills_vault.certificates.verification_desc", "Verify any SMAART certificate using its unique ID or QR code.")}
                                            </p>
                                        </div>
                                        <div className="p-2">
                                            <CertificateVerification />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ════════ BADGES TAB ════════ */}
                            {activeTab === "badges" && (
                                <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-4 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                    <BadgeGallery badges={badges} userName={user?.fullName || t("skills_vault.student", "Student")} />
                                </div>
                            )}

                            {/* ════════ COURSES TAB ════════ */}
                            {activeTab === "courses" && (
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {t("skills_vault.courses.overview", "Course Overview")}
                                        </h3>
                                        <button
                                            onClick={() => navigate("/dashboard/courses")}
                                            className="text-sm font-semibold text-[#1a3884] dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            {t("skills_vault.courses.go_to_courses", "Go to Courses")} <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {courses.length > 0 ? (
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            {courses.map((course, i) => (
                                                <motion.div
                                                    key={course._id || i}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    onClick={() => navigate(`/dashboard/courses/${course._id}/modules`)}
                                                    className="bg-white dark:bg-slate-900/40 rounded-[30px] border border-slate-100 dark:border-white/8 overflow-hidden cursor-pointer hover:shadow-2xl hover:border-[#1a3884]/30 dark:hover:border-blue-500/30 transition-all group"
                                                >
                                                    {/* Thumbnail */}
                                                    <div className="h-36 sm:h-40 bg-gradient-to-br from-[#1a3884] to-[#2d5dc7] relative overflow-hidden">
                                                        {course.thumbnail && (
                                                            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        )}
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                                                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/10">
                                                                {course.courseCode || "Course"}
                                                            </span>
                                                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Play className="w-3 h-3 text-white fill-white" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="p-4 sm:p-6">
                                                        <h4 className="text-[16px] sm:text-[17px] font-black text-slate-950 dark:text-white mb-2 line-clamp-1 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                                                            {course.title}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 sm:mb-5 leading-relaxed">
                                                            {course.description || "Professional development course"}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                            <span className="flex items-center gap-1.5">
                                                                <BookOpen className="w-3.5 h-3.5" />
                                                                {course.modules?.length || 0} {t("skills_vault.courses.modules", "Modules")}
                                                            </span>
                                                            <span className="flex items-center gap-1.5">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {course.duration ? t("skills_vault.courses.duration", { duration: course.duration }) : t("skills_vault.courses.self_paced", "Self-paced")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-6 sm:p-12 text-center shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                            <div className="w-20 h-20 mx-auto mb-6 rounded-[24px] bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-100 dark:border-white/10 flex items-center justify-center shadow-sm">
                                                <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                            </div>
                                            <h4 className="text-xl font-black text-slate-950 dark:text-white mb-2">
                                                {t("skills_vault.courses.no_courses_title", "No Enrolled Courses")}
                                            </h4>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                                                {t("skills_vault.courses.no_courses_desc", "You haven't enrolled in any courses. Visit the core programme to get started on your journey.")}
                                            </p>
                                            <button
                                                onClick={() => navigate("/dashboard/courses")}
                                                className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#1a3884] to-[#002147] text-white text-xs font-black uppercase tracking-widest hover:shadow-xl transform hover:scale-[1.02] transition-all"
                                            >
                                                {t("skills_vault.courses.browse_btn", "Browse Core Programme")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ════════ FLASHCARDS TAB ════════ */}
                            {activeTab === "flashcards" && (
                                <div className="space-y-5">
                                    <div className="mb-2">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                            {t("skills_vault.flashcards.title", "Key Flashcards")}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {t("skills_vault.flashcards.desc", "Quick-reference cards covering the six core SMAART quotients and essential professional terminology.")}
                                        </p>
                                    </div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {defaultFlashcards.map((card, i) => (
                                            <FlashcardItem key={i} card={card} index={i} />
                                        ))}
                                    </div>

                                    <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-white/8 p-8 text-center">
                                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">
                                            {t("skills_vault.flashcards.more_desc", "More flashcards are available within each course module to help you master professional terminology.")}
                                        </p>
                                        <button
                                            onClick={() => navigate("/dashboard/courses")}
                                            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border-2 border-[#1a3884] dark:border-blue-500 text-[#1a3884] dark:text-blue-400 text-xs font-black uppercase tracking-widest hover:bg-[#1a3884] hover:text-white dark:hover:bg-blue-500 dark:hover:text-white transition-all transform hover:scale-[1.02]"
                                        >
                                            <BookOpen className="w-4 h-4" /> {t("skills_vault.flashcards.explore_btn", "Explore Course Flashcards")}
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </AnimatePresence>

                </div>
            </main>

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
            transition={{ delay: index * 0.08 }}
            onClick={() => setFlipped(!flipped)}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer group perspective"
            style={{ perspective: "1000px" }}
        >
            <div
                className={`relative h-48 transition-transform duration-700 preserve-3d ${flipped ? "rotate-y-180" : ""}`}
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
            >
                {/* Front - Solid Background with Opacity Control */}
                <motion.div
                    className="absolute inset-0 bg-white dark:bg-[#002147] rounded-[28px] border border-slate-100 dark:border-white/8 p-6 flex flex-col justify-between shadow-[0_15px_35px_-15px_rgba(0,0,0,0.05)] group-hover:shadow-2xl group-hover:border-[#1a3884]/30 transition-all duration-500"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "translateZ(1px)",
                        zIndex: flipped ? 0 : 10
                    }}
                    animate={{ opacity: flipped ? 0 : 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="flex justify-center">
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                            {card.category}
                        </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center px-2">
                        <h4 className="text-xl font-black text-[#002147] dark:text-white text-center leading-tight tracking-tight">
                            {card.term}
                        </h4>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-[#1a3884] transition-colors">
                        <Zap className="w-3 h-3 group-hover:animate-pulse" />
                        {t("skills_vault.flashcards.tap_reveal", "Tap to reveal")}
                    </div>
                </motion.div>

                {/* Back - Solid Background with Opacity Control */}
                <motion.div
                    className="absolute inset-0 bg-slate-900 rounded-[28px] p-6 sm:p-8 flex flex-col justify-center text-white shadow-2xl overflow-hidden"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg) translateZ(1px)",
                        zIndex: flipped ? 10 : 0
                    }}
                    animate={{ opacity: flipped ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Solid Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1a3884] via-[#112b6b] to-[#002147] opacity-100" />

                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute top-4 left-4 opacity-20">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-[15px] font-bold leading-relaxed text-center text-blue-50 relative z-10">
                        {card.definition}
                    </p>
                    <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-blue-200/50 relative z-10">
                        {t("skills_vault.flashcards.flip_back", "Flip Back")}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default SkillsVault;
