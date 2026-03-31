import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award, Trophy, BookOpen, Layers, ChevronRight, Download,
    Shield, Star, CheckCircle2, Clock, FileText, Zap, Brain,
    Upload, Link as LinkIcon, QrCode, Calendar, X
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { useNavigate } from "react-router-dom";
import useUser from "@/hooks/useUser";
import apiCall, { coursesAPI } from "@/services/api";
import { assessmentApi } from "@/services/assessmentApi";
import BadgeGallery from "@/components/badges/BadgeGallery";
import CertificateVerification from "@/components/landing/CertificateVerification";
import UserCertificateUploadModal from "@/components/wallet/UserCertificateUploadModal";
import { userCertificateApi } from "@/services/userCertificateApi";
import { toast } from "sonner";

/* ══════════════════════════════════════
   SMAART Wallet – Your Professional Vault
   ══════════════════════════════════════ */

const TABS = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "badges", label: "Badges", icon: Trophy },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "flashcards", label: "Flashcards", icon: Zap },
];

const SMAARTWallet = () => {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();
    const [activeTab, setActiveTab] = useState("overview");
    const [courses, setCourses] = useState([]);
    const [stageStatus, setStageStatus] = useState({});
    const [userCertificates, setUserCertificates] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    /* ── Data fetch ── */
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [courseRes, userCertRes] = await Promise.allSettled([
                    coursesAPI.getAll(),
                    userCertificateApi.getAll()
                ]);
                if (courseRes.status === "fulfilled" && courseRes.value?.courses) {
                    setCourses(courseRes.value.courses);
                }
                if (userCertRes.status === "fulfilled" && userCertRes.value?.success) {
                    setUserCertificates(userCertRes.value.data);
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

    const handleDeleteUserCert = async (id) => {
        try {
            const res = await userCertificateApi.delete(id);
            if (res.success) {
                setUserCertificates(prev => prev.filter(c => c._id !== id));
                toast.success("Certificate removed from vault");
            }
        } catch (err) {
            toast.error("Failed to delete certificate");
        }
    };

    /* ── Derived stats ── */
    const badges = user?.badges || [];
    const completedAssessments = Object.values(stageStatus).filter(s => s?.completed).length;

    const certificateTypes = [
        { id: "capacity", title: "Certificate in Capacity & Work Readiness", code: "CAP", level: "Level 1" },
        { id: "capability", title: "Advanced Certificate in Applied Capability", code: "APC", level: "Level 2" },
        { id: "leadership", title: "Diploma in Employability & Leadership", code: "ELR", level: "Level 3" },
        { id: "combined", title: "Master Diploma in Comprehensive Readiness", code: "MPD", level: "Master" },
    ];

    const sampleFlashcards = [
        { term: "Cognitive Reasoning (CRQ)", definition: "The ability to analyze, synthesize, and evaluate information to derive meaningful conclusions and solve complex problems.", category: "Quotient" },
        { term: "Self-Regulation (SRQ)", definition: "The capacity to manage emotions, thoughts, and behaviors effectively across different situations and towards goals.", category: "Quotient" },
        { term: "Learning Agility (LQ)", definition: "The willingness and ability to learn from experience and then apply those lessons in new and first-time situations.", category: "Quotient" },
        { term: "Social Interaction (SIQ)", definition: "The skill of navigating social environments with emotional intelligence, empathy, and effective communication.", category: "Quotient" },
        { term: "Professional Execution (PEQ)", definition: "The competence to deliver professional outcomes with accountability, precision, and stakeholder orientation.", category: "Quotient" },
        { term: "Digital & AI Literacy (DAQ)", definition: "The ability to leverage digital tools and artificial intelligence to enhance productivity and innovation.", category: "Quotient" },
    ];

    if (userLoading) {
        return (
            <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-none animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <DashboardSidebar />
            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="w-full relative py-8 px-4 md:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto space-y-8">

                        {/* ── Header ── */}
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
                                Your professional vault — view and manage your certificates, badges, course progress, and key learning flashcards all in one place.
                            </p>
                        </motion.div>

                        {/* ── Tab Navigation ── */}
                        <div className="flex justify-center">
                            <div className="inline-flex bg-white dark:bg-slate-800 rounded-none p-1.5 shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full">
                                {TABS.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-none font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                                    ? "bg-[#1a3884] text-white shadow-md"
                                                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Content ── */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.3 }}
                            >

                                {/* ════════ OVERVIEW TAB ════════ */}
                                {activeTab === "overview" && (
                                    <div className="space-y-6">
                                        {/* Quick Stats */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: "Certificates", value: certificateTypes.length, icon: Award, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
                                                { label: "Badges Earned", value: badges.length, icon: Trophy, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                                                { label: "Courses", value: courses.length, icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                                                { label: "Assessments", value: `${completedAssessments}/4`, icon: Brain, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-900/20" },
                                            ].map((stat, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.08 }}
                                                    className="bg-white dark:bg-slate-800 rounded-none p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                                                >
                                                    <div className={`w-10 h-10 rounded-none ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                                                        <stat.icon className="w-5 h-5" />
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">{stat.label}</p>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* What's in your wallet */}
                                        <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">What's in your SMAART Wallet?</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                                                Your SMAART Wallet is a centralized hub that securely stores and showcases all your professional achievements, learning progress, and key resources. Here's what you'll find:
                                            </p>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {[
                                                    { icon: Award, title: "Certificates", desc: "Verified professional credentials issued upon completing programme milestones — Capacity, Capability, Leadership, and the Master Diploma." },
                                                    { icon: Trophy, title: "Badges & Achievements", desc: "Micro-credentials earned through course activities, assessments, and engagement — each one verifiable and shareable." },
                                                    { icon: BookOpen, title: "Course Overview", desc: "A dashboard view of all your enrolled courses, modules completed, and overall progress across the SMAART curriculum." },
                                                    { icon: Zap, title: "Flashcards & Key Terms", desc: "Quick-reference cards for the six core quotients and other essential professional terminology from your learning journey." },
                                                ].map((item, i) => (
                                                    <div key={i} className="flex gap-4 p-4 rounded-none bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                                                        <div className="w-10 h-10 rounded-none bg-[#1a3884]/10 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                            <item.icon className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1">{item.title}</h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ════════ CERTIFICATES TAB ════════ */}
                                {activeTab === "certificates" && (
                                    <div className="space-y-8">
                                        <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <Award className="w-6 h-6 text-amber-600" />
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Professional Credentials</h3>
                                                </div>
                                                <button
                                                    onClick={() => navigate("/dashboard/certificate")}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-[#1a3884] text-white text-sm font-bold hover:bg-[#2d5dc7] transition-colors"
                                                >
                                                    <Download className="w-4 h-4" /> Download Centre
                                                </button>
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {certificateTypes.map((cert, i) => (
                                                    <motion.div
                                                        key={cert.id}
                                                        initial={{ opacity: 0, y: 16 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.08 }}
                                                        onClick={() => navigate("/dashboard/certificate")}
                                                        className="bg-slate-50 dark:bg-slate-700/30 rounded-none border border-slate-100 dark:border-slate-700 p-5 cursor-pointer hover:border-[#1a3884]/40 dark:hover:border-blue-500/30 hover:shadow-md transition-all group"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-none bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                                <Award className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                                                                    {cert.title}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                                        {cert.code}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400">
                                                                        {cert.level}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors flex-shrink-0 mt-1" />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* User Uploaded Certificates */}
                                        <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <Shield className="w-6 h-6 text-blue-600" />
                                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your Uploaded Credentials</h3>
                                                </div>
                                                <button
                                                    onClick={() => setIsUploadModalOpen(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                                >
                                                    <Upload className="w-4 h-4" /> Upload Certificate
                                                </button>
                                            </div>

                                            {userCertificates.length > 0 ? (
                                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {userCertificates.map((cert, i) => (
                                                        <motion.div
                                                            key={cert._id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="bg-slate-50 dark:bg-slate-900/50 rounded-none border border-slate-100 dark:border-slate-700 p-5 relative group"
                                                        >
                                                            <div className="flex items-start gap-4 mb-4">
                                                                <div className="w-12 h-12 rounded-none bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                                                    <FileText className="w-6 h-6" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight mb-1 truncate">
                                                                        {cert.title}
                                                                    </h4>
                                                                    <p className="text-[11px] text-slate-400 font-medium truncate">{cert.issuer}</p>
                                                                </div>
                                                            </div>

                                                            <div className="space-y-2 mb-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                                    Issued: {new Date(cert.issueDate).toLocaleDateString()}
                                                                </div>
                                                                {cert.verificationUrl && (
                                                                    <a 
                                                                        href={cert.verificationUrl} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                                                                    >
                                                                        <LinkIcon className="w-3 h-3" />
                                                                        Verify Credential
                                                                    </a>
                                                                )}
                                                                {cert.qrCodeIdentifier && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                                        <QrCode className="w-3 h-3" />
                                                                        ID: {cert.qrCodeIdentifier}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <a 
                                                                    href={cert.certificateUrl} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" /> View File
                                                                </a>
                                                                <button 
                                                                    onClick={() => handleDeleteUserCert(cert._id)}
                                                                    className="p-2 rounded-none border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-700/50 rounded-none">
                                                    <div className="w-12 h-12 rounded-none bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                                                        <Award className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-400">No external certificates uploaded yet.</p>
                                                    <button
                                                        onClick={() => setIsUploadModalOpen(true)}
                                                        className="mt-4 text-xs font-bold text-blue-600 hover:underline"
                                                    >
                                                        Add your first credential
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Verification Section */}
                                        <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    <Shield className="w-5 h-5 text-emerald-600" />
                                                    Credential Verification
                                                </h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Verify any SMAART certificate using its unique ID or QR code.</p>
                                            </div>
                                            <div className="p-0">
                                                <CertificateVerification />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ════════ BADGES TAB ════════ */}
                                {activeTab === "badges" && (
                                    <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
                                        <BadgeGallery badges={badges} userName={user?.fullName || "Student"} />
                                    </div>
                                )}

                                {/* ════════ COURSES TAB ════════ */}
                                {activeTab === "courses" && (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Course Overview</h3>
                                            <button
                                                onClick={() => navigate("/dashboard/courses")}
                                                className="text-sm font-semibold text-[#1a3884] dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                Go to Courses <ChevronRight className="w-4 h-4" />
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
                                                        className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-md hover:border-[#1a3884]/30 dark:hover:border-blue-500/30 transition-all group"
                                                    >
                                                        {/* Thumbnail */}
                                                        <div className="h-32 bg-gradient-to-br from-[#1a3884] to-[#2d5dc7] relative overflow-hidden">
                                                            {course.thumbnail && (
                                                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                            <div className="absolute bottom-3 left-3 right-3">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-white/20 backdrop-blur-sm text-white">
                                                                    {course.courseCode || "Course"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className="p-4">
                                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1 line-clamp-1 group-hover:text-[#1a3884] dark:group-hover:text-blue-400 transition-colors">
                                                                {course.title}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                                                                {course.description || "Professional development course"}
                                                            </p>
                                                            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                                                <span className="flex items-center gap-1">
                                                                    <BookOpen className="w-3 h-3" />
                                                                    {course.modules?.length || 0} Modules
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {course.duration || "Self-paced"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-10 text-center">
                                                <div className="w-16 h-16 mx-auto mb-4 rounded-none bg-slate-50 dark:bg-slate-700 flex items-center justify-center">
                                                    <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1">No Courses Yet</h4>
                                                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                                                    You haven't enrolled in any courses. Visit the course library to get started.
                                                </p>
                                                <button
                                                    onClick={() => navigate("/dashboard/courses")}
                                                    className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-none bg-[#1a3884] text-white text-sm font-bold hover:bg-[#2d5dc7] transition-colors"
                                                >
                                                    Browse Courses
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ════════ FLASHCARDS TAB ════════ */}
                                {activeTab === "flashcards" && (
                                    <div className="space-y-5">
                                        <div className="mb-2">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Key Flashcards</h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Quick-reference cards covering the six core SMAART quotients and essential professional terminology.
                                            </p>
                                        </div>

                                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {sampleFlashcards.map((card, i) => (
                                                <FlashcardItem key={i} card={card} index={i} />
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-none border border-slate-200 dark:border-slate-700 p-5 text-center">
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                More flashcards are available within each course module
                                            </p>
                                            <button
                                                onClick={() => navigate("/dashboard/courses")}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-none border-2 border-[#1a3884] dark:border-blue-500 text-[#1a3884] dark:text-blue-400 text-sm font-bold hover:bg-[#1a3884]/5 dark:hover:bg-blue-500/10 transition-colors"
                                            >
                                                <BookOpen className="w-4 h-4" /> Explore Course Flashcards
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>

                    </div>
                </main>
            </div>

            <UserCertificateUploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={(newCert) => setUserCertificates(prev => [newCert, ...prev])}
            />
        </div>
    );
};

/* ── Flashcard Card Component ── */
const FlashcardItem = ({ card, index }) => {
    const [flipped, setFlipped] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer group perspective"
            style={{ perspective: "1000px" }}
        >
            <div
                className={`relative h-48 transition-transform duration-500 preserve-3d ${flipped ? "rotate-y-180" : ""}`}
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0)" }}
            >
                {/* Front */}
                <div
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between backface-hidden hover:shadow-md hover:border-[#1a3884]/30 dark:hover:border-blue-500/30 transition-all"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none bg-blue-50 dark:bg-blue-500/10 text-[#1a3884] dark:text-blue-400">
                            {card.category}
                        </span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <h4 className="text-base font-bold text-slate-800 dark:text-white text-center leading-snug">
                            {card.term}
                        </h4>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-medium">Tap to reveal definition →</p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-[#1a3884] to-[#2d5dc7] rounded-none p-5 flex flex-col justify-center text-white"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <p className="text-sm leading-relaxed text-center text-white/90">
                        {card.definition}
                    </p>
                    <p className="text-[10px] text-white/50 text-center mt-3 font-medium">Tap to flip back</p>
                </div>
            </div>
        </motion.div>
    );
};

export default SMAARTWallet;
