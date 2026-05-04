import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, Heart, BookOpen, Users, Briefcase, Monitor, Leaf, Download,
    Shield, Share2, MapPin, Calendar, CheckCircle, ArrowLeft, X,
    TrendingUp, Award, BadgeCheck, QrCode, Sparkles, BarChart3, ShieldCheck,
    Zap, Rocket, GraduationCap, Layout, FileText, ExternalLink
} from "lucide-react";
import { assessmentApi } from "@/services/assessmentApi";
import { API_BASE_URL } from "@/services/api";
import SkillsPassportSkeleton from "@/components/skeletons/SkillsPassportSkeleton";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import { toast as sonnerToast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { QRCodeSVG } from "qrcode.react";
import { getBackendUrl } from "@/services/api";
import { useTranslation } from "react-i18next";
import spImage from "@/assets/sp.jpeg";

// --- Custom Styles for Micro-animations ---
const PremiumStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes mesh {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%) rotate(-45deg); }
            100% { transform: translateX(100%) rotate(-45deg); }
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
        }
        .mesh-bg {
            background: linear-gradient(-45deg, #6366f1, #a855f7, #06b6d4, #10b981);
            background-size: 400% 400%;
            animation: mesh 15s ease infinite;
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dark .glass-card {
            background: rgba(15, 23, 42, 0.3);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .holographic {
            position: relative;
            overflow: hidden;
        }
        .holographic::after {
            content: '';
            position: absolute;
            top: -100%; left: -100%; width: 300%; height: 300%;
            background: linear-gradient(
                45deg,
                transparent 0%,
                rgba(255, 255, 255, 0) 45%,
                rgba(255, 255, 255, 0.1) 50%,
                rgba(255, 255, 255, 0) 55%,
                transparent 100%
            );
            animation: shimmer 6s infinite linear;
            pointer-events: none;
        }
        .perspective-2000 {
            perspective: 2000px;
        }
    `}} />
);

// --- Constants & Metadata ---

const QUOTIENTS = [
    { id: 'CRQ', icon: Brain },
    { id: 'SRQ', icon: Heart },
    { id: 'LQ', icon: BookOpen },
    { id: 'SIQ', icon: Users },
    { id: 'PEQ', icon: Briefcase },
    { id: 'DAQ', icon: Monitor },
    { id: 'SEQ', icon: Leaf },
];

// --- Sub-components ---

const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-500/5 blur-[100px]" />
    </div>
);

const IconBox = ({ children, className = "" }) => (
    <div className={`p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${className}`}>
        {children}
    </div>
);

const StatCard = ({ icon: Icon, label, value, sub, colorClass = "text-slate-800 dark:text-white" }) => (
    <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-[32px] border border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-7 group transition-all shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] hover:shadow-[0_30px_60px_-15px_rgba(99,102,241,0.2)]"
    >
        <div className="flex flex-col gap-5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 bg-slate-50 dark:bg-slate-800/50 group-hover:scale-110 ${colorClass.replace('text-', 'bg-').replace('-500', '-500/10')} ${colorClass}`}>
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
                <h3 className={`text-3xl font-black tracking-tighter ${colorClass}`}>{value}</h3>
                <p className="text-[10px] mt-2 text-slate-400 dark:text-slate-500 font-bold flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
                    {sub}
                </p>
            </div>
        </div>
    </motion.div>
);

const SkillBadge = ({ skill, verified = false }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${verified
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shimmer-effect"
            : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700"
            }`}>
        {verified && <ShieldCheck className="w-4 h-4" />}
        {skill}
    </motion.div>
);

const RadarChart = ({ data, theme }) => {
    const isDark = theme === 'dark';
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const totalAxes = 7;

    const getPoint = (value, index, maxRadius) => {
        const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
        const dist = (value / 100) * maxRadius;
        return {
            x: center + dist * Math.cos(angle),
            y: center + dist * Math.sin(angle)
        };
    };

    const getPath = (values, maxRadius) => {
        return values.map((v, i) => {
            const point = getPoint(v, i, maxRadius);
            return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
        }).join(' ') + ' Z';
    };

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-2xl">
            <defs>
                <linearGradient id="radarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
                </linearGradient>
            </defs>
            {[100, 75, 50, 25].map((pct, i) => (
                <path
                    key={i}
                    d={getPath(Array(totalAxes).fill(pct), radius)}
                    fill="none"
                    stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "4 4"}
                />
            ))}
            {Array.from({ length: totalAxes }).map((_, i) => {
                const point = getPoint(100, i, radius);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={point.x}
                        y2={point.y}
                        stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}
                        strokeWidth="1"
                    />
                );
            })}
            <motion.path
                initial={{ pathLength: 0, opacity: 0, scale: 0.8 }}
                animate={{ pathLength: 1, opacity: 1, scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                d={getPath(data.map(d => d.value), radius)}
                fill="url(#radarGrad)"
                stroke="#6366f1"
                strokeWidth="3"
            />
            {data.map((d, i) => {
                const point = getPoint(d.value, i, radius);
                return (
                    <motion.circle
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        cx={point.x}
                        cy={point.y}
                        r="5"
                        fill="#6366f1"
                        stroke="white"
                        strokeWidth="2.5"
                    >
                        <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                    </motion.circle>
                );
            })}
            {data.map((d, i) => {
                const point = getPoint(125, i, radius);
                return (
                    <text
                        key={i}
                        x={point.x}
                        y={point.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="900"
                        fill={isDark ? "#94a3b8" : "#64748b"}
                        className="uppercase tracking-tighter"
                    >
                        {d.id}
                    </text>
                );
            })}
        </svg>
    );
};

// --- Main Page Component ---

const SkillsPassport = () => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [baselineResult, setBaselineResult] = useState(null);
    const [stageResults, setStageResults] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [hoveredQuotient, setHoveredQuotient] = useState(null);
    const [activeTab, setActiveTab] = useState("smart");
    const [fullDetails, setFullDetails] = useState({
        certificates: [],
        projects: [],
        workExperience: [],
        otherCourses: []
    });

    // 3D Tilt Logic
    const [rotateX, setRotateX] = useState(0);
    const [rotateY, setRotateY] = useState(0);
    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        setRotateX((y - centerY) / 10);
        setRotateY(-(x - centerX) / 10);
    };
    const handleMouseLeave = () => {
        setRotateX(0);
        setRotateY(0);
    };

    useEffect(() => {
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
            try { setCurrentUser(JSON.parse(userStr)); } catch { }
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const userId = user._id || user.id;
                    const email = user.email;

                    if (userId) {
                        const [baselineRes, stageRes] = await Promise.allSettled([
                            assessmentApi.getBaseLineResults(userId),
                            assessmentApi.getStageResults(userId),
                        ]);

                        if (baselineRes.status === 'fulfilled' && baselineRes.value?.success) {
                            setBaselineResult(baselineRes.value.data);
                        }
                        if (stageRes.status === 'fulfilled' && stageRes.value?.success) {
                            setStageResults(stageRes.value.data || {});
                        }
                    }

                    if (email) {
                        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                        const response = await fetch(`${API_BASE_URL}/users/register-details/${email}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setFullDetails({
                                certificates: Array.isArray(data.certificates) ? data.certificates : [],
                                projects: Array.isArray(data.projects) ? data.projects : [],
                                workExperience: Array.isArray(data.workExperience) ? data.workExperience : [],
                                otherCourses: Array.isArray(data.workExperience) ? data.workExperience : []
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Skills Passport fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const getScores = (profile) => {
        if (!profile) return { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0, SEQ: 0 };
        return {
            CRQ: profile.CRQ?.rawScore ?? profile.CRQ?.percentage ?? 0,
            SRQ: profile.SRQ?.rawScore ?? profile.SRQ?.percentage ?? 0,
            LQ: profile.LQ?.rawScore ?? profile.LQ?.percentage ?? 0,
            SIQ: profile.SIQ?.rawScore ?? profile.SIQ?.percentage ?? 0,
            PEQ: profile.PEQ?.rawScore ?? profile.PEQ?.percentage ?? 0,
            DAQ: profile.DAQ?.rawScore ?? profile.DAQ?.percentage ?? 0,
            SEQ: profile.SEQ?.rawScore ?? profile.SEQ?.percentage ?? 0,
        };
    };

    const currentScores = getScores(baselineResult?.t1Profile);
    const latestScore = baselineResult?.baselineScore || 0;
    const t4Result = stageResults['T4'];
    const growth = t4Result ? (t4Result.stageScore - latestScore) : 0;

    const handleExport = async () => {
        if (!containerRef.current) return;
        setIsExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(containerRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const imgW = 210;
            const imgH = (canvas.height * imgW) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
            pdf.save(`SkillsPassport_${currentUser?.fullName || 'User'}.pdf`);
            sonnerToast.success(t("common.success_export") || "Passport exported successfully!");
        } catch (err) {
            console.error('PDF export failed:', err);
            sonnerToast.error(t("common.error_export") || "Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) return <SkillsPassportSkeleton />;

    const userName = currentUser?.fullName || "SMAART Minds User";
    const photoPath = currentUser?.profilePhoto || currentUser?.profileImage || currentUser?.otherDetails?.profilePhoto || currentUser?.otherDetails?.profileImage;
    const profilePhoto = photoPath
        ? (photoPath.startsWith('http') ? photoPath : `${getBackendUrl()}/${photoPath}`)
        : spImage;

    const identityRef = (currentUser?._id || currentUser?.id || "SM-0000").toString().slice(-8).toUpperCase();
    const passportId = `SM-${identityRef}-${new Date().getFullYear()}`;

    const verifiedSkills = [
        "Cognitive Analysis", "Digital Literacy", "Agile Learning",
        "Professional Execution", "Ethics & Sustainability", "Social Intelligence"
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors p-3 md:p-8 relative overflow-x-hidden">
            <PremiumStyles />
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-8 md:space-y-12"
                ref={containerRef}
            >
                <div className="rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl transition-all">
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 sm:p-10 md:p-16 text-slate-900 dark:text-white relative transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto relative z-10 text-center lg:text-left">
                            <div className="space-y-10">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap gap-4 justify-center lg:justify-start"
                                >
                                    <div className="px-5 py-2 rounded-full bg-slate-200 dark:bg-white/10 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-300 dark:border-white/20">
                                        {t("skills_passport.title")}
                                    </div>
                                    <div className="px-5 py-2 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                        <BadgeCheck className="w-4 h-4" /> {t("skills_passport.verifiable")}
                                    </div>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white"
                                >
                                    {t("skills_passport.hero_title")}
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-medium leading-relaxed mx-auto lg:mx-0"
                                >
                                    {t("skills_passport.hero_desc")}
                                </motion.p>

                                <div className="flex flex-wrap gap-5 pt-4 justify-center lg:justify-start">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)] active:scale-95 disabled:opacity-70"
                                    >
                                        {isExporting ? <span className="animate-pulse">{t("common.processing") || "Processing..."}</span> : <><Download className="w-6 h-6" /> {t("skills_passport.get_pdf")}</>}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            sonnerToast.success("Profile link copied!");
                                        }}
                                        className="flex items-center gap-3 px-10 py-5 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-black text-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 backdrop-blur-md"
                                    >
                                        <Share2 className="w-6 h-6" /> {t("skills_passport.share")}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3D Vertical Passport Card */}
                    <div className="pt-8 md:pt-12 perspective-1000 md:perspective-2000 max-w-[340px] md:max-w-sm mx-auto px-4">
                        <motion.div
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, damping: 20 }}
                            className="rounded-[32px] md:rounded-[48px] border border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.2)] dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] p-6 md:p-10 space-y-6 md:space-y-8 relative overflow-hidden group holographic"
                        >
                            {/* Animated Background Mesh */}
                            <div className="absolute inset-0 mesh-bg opacity-[0.03] dark:opacity-[0.07] pointer-events-none" />
                            
                            {/* Card Top: Branding */}
                            <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Skills Passport</span>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Verified
                                </div>
                            </div>

                            {/* Card Mid: Profile & Identification */}
                            <div className="text-center space-y-6 relative z-10">
                                <div className="relative inline-block">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-105">
                                        <img
                                            src={profilePhoto}
                                            alt={userName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = spImage; }}
                                        />
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 border-4 border-white dark:border-slate-900 text-white z-20 shadow-xl">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{userName}</h3>
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700">
                                        {passportId}
                                    </div>
                                </div>
                            </div>

                            {/* Card Stats: Circular Progress */}
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="p-5 rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 text-center group/stat transition-all hover:bg-white dark:hover:bg-slate-800/60">
                                    <div className="relative w-16 h-16 mx-auto mb-3">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                                            <motion.circle
                                                cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent"
                                                strokeDasharray={175.9}
                                                initial={{ strokeDashoffset: 175.9 }}
                                                animate={{ strokeDashoffset: 175.9 - (175.9 * latestScore) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut" }}
                                                className="text-indigo-600"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-xs font-black text-slate-900 dark:text-white">{latestScore}%</span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("skills_passport.global_readiness")}</p>
                                </div>
                                
                                <div className="p-5 rounded-[32px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 text-center transition-all hover:bg-white dark:hover:bg-slate-800/60">
                                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <TrendingUp className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white mb-1">{baselineResult?.stageBand || "A"}</h4>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t("skills_passport.plvi_band")}</p>
                                </div>
                            </div>

                            {/* Card Footer: QR & Verification */}
                            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Digital Trust Protocol</p>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Secure & Live
                                    </div>
                                </div>
                                <div className="w-16 h-16 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-xl transition-transform duration-500 hover:scale-110">
                                    <QRCodeSVG 
                                        value={window.location.href} 
                                        className="w-full h-full" 
                                        fgColor={theme === 'dark' ? '#ffffff' : '#000000'}
                                        bgColor="transparent"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="max-w-4xl mx-auto px-2 sm:px-4 mt-12 md:mt-16 mb-8">
                        <div className="flex sm:flex-wrap justify-start sm:justify-center gap-2 md:gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-2 md:p-3 rounded-[24px] md:rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
                            {[
                                { id: 'smart', label: t('skills_passport.tabs.smart'), icon: Sparkles },
                                { id: 'other', label: t('skills_passport.tabs.other'), icon: ExternalLink },
                                { id: 'certificates', label: t('skills_passport.tabs.certificates'), icon: Award },
                                { id: 'projects', label: t('skills_passport.tabs.projects'), icon: Layout }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 md:gap-3 px-5 md:px-8 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all relative overflow-hidden flex-shrink-0 ${activeTab === tab.id
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-105"
                                        : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
                                        }`}
                                >
                                    <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "animate-pulse" : ""}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 sm:p-8 md:p-16 pt-0 space-y-12 md:space-y-20 relative">
                        <AnimatePresence mode="wait">
                            {activeTab === 'smart' && (
                                <motion.div
                                    key="smart-tab"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-20"
                                >
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <StatCard
                                            icon={TrendingUp}
                                            label={t("skills_passport.stats.growth_delta")}
                                            value={`+${growth}%`}
                                            sub={t("common.verified_progression") || "Verified Progression"}
                                            colorClass="text-emerald-500"
                                        />
                                        <StatCard
                                            icon={Zap}
                                            label={t("skills_passport.stats.momentum")}
                                            value={t("common.high") || "High"}
                                            sub={t("common.skill_acquisition_rate") || "Skill Acquisition Rate"}
                                            colorClass="text-orange-500"
                                        />
                                        <StatCard
                                            icon={BadgeCheck}
                                            label={t("skills_passport.stats.badges")}
                                            value="14"
                                            sub={t("common.competency_aligned") || "Competency Aligned"}
                                            colorClass="text-blue-500"
                                        />
                                        <StatCard
                                            icon={ShieldCheck}
                                            label={t("skills_passport.stats.trust")}
                                            value="99.2"
                                            sub={t("common.integrity_verified") || "Integrity Verified"}
                                            colorClass="text-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-16">
                                        {/* Competency DNA */}
                                        <motion.div
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            className="rounded-[32px] md:rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-6 sm:p-10 md:p-14 shadow-sm relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                                                <Brain className="w-64 h-64" />
                                            </div>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16 relative z-10">
                                                <div className="space-y-4 text-center md:text-left">
                                                    <div className="flex items-center gap-4 justify-center md:justify-start">
                                                        <IconBox className="bg-indigo-600 text-white">
                                                            <Sparkles className="w-6 h-6" />
                                                        </IconBox>
                                                        <h2 className="text-4xl font-black text-slate-800 dark:text-white">{t("skills_passport.dna.title")}</h2>
                                                    </div>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto md:mx-0">
                                                        {t("skills_passport.dna.desc")}
                                                    </p>
                                                </div>
                                                <div className="w-64 h-64 flex-shrink-0 mx-auto md:mx-0">
                                                    <RadarChart
                                                        data={QUOTIENTS.map(q => ({ id: q.id, value: currentScores[q.id] || 0 }))}
                                                        theme={theme}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 relative z-10">
                                                {QUOTIENTS.map(q => {
                                                    const score = currentScores[q.id] || 0;
                                                    const isHovered = hoveredQuotient === q.id;
                                                    return (
                                                        <div
                                                            key={q.id}
                                                            className="space-y-4 cursor-help group"
                                                            onMouseEnter={() => setHoveredQuotient(q.id)}
                                                            onMouseLeave={() => setHoveredQuotient(null)}
                                                        >
                                                            <div className="flex justify-between items-end">
                                                                <span className="text-sm font-black flex items-center gap-3">
                                                                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                                        <q.icon className="w-4 h-4" />
                                                                    </div>
                                                                    {t(`quotients.${q.id}.name`)}
                                                                </span>
                                                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">
                                                                    {score}%
                                                                </span>
                                                            </div>
                                                            <div className="h-4 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden p-1">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    whileInView={{ width: `${score}%` }}
                                                                    className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full"
                                                                />
                                                            </div>
                                                            <AnimatePresence>
                                                                {isHovered && (
                                                                    <motion.p
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: 'auto' }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        className="text-xs text-slate-500 font-bold p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border"
                                                                    >
                                                                        {t(`quotients.${q.id}.desc`)}
                                                                    </motion.p>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>

                                        {/* Skills */}
                                        <div className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 md:p-14 shadow-sm">
                                            <div className="flex items-center gap-5 mb-12">
                                                <IconBox className="bg-emerald-600 text-white">
                                                    <Award className="w-6 h-6" />
                                                </IconBox>
                                                <h2 className="text-4xl font-black text-slate-800 dark:text-white">{t("skills_passport.proficiency.title")}</h2>
                                            </div>
                                            <div className="space-y-14">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">{t("skills_passport.proficiency.gold_standard")}</h4>
                                                    <div className="flex flex-wrap gap-4">
                                                        {verifiedSkills.map(skill => <SkillBadge key={skill} skill={skill} verified={true} />)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 shadow-sm">
                                            <div className="flex items-center gap-5 mb-10">
                                                <IconBox className="bg-cyan-600 text-white">
                                                    <BarChart3 className="w-6 h-6" />
                                                </IconBox>
                                                <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t("skills_passport.timeline.title")}</h2>
                                            </div>
                                            <div className="space-y-6 relative">
                                                <div className="absolute left-10 top-10 bottom-10 w-[2px] bg-slate-200 dark:bg-slate-800" />
                                                {['baseline', 'T2', 'T3', 'T4'].map((stage, idx) => {
                                                    const isBaseline = stage === 'baseline';
                                                    const result = isBaseline ? baselineResult : stageResults[stage];
                                                    const score = isBaseline ? baselineResult?.baselineScore : (result?.stageScore || 0);
                                                    const isCompleted = !!result;
                                                    return (
                                                        <motion.div key={stage} className={`relative rounded-3xl p-6 border pl-16 ${isCompleted ? "bg-white dark:bg-slate-800/80 border-slate-200" : "bg-slate-50/50 opacity-60 border-dashed"}`}>
                                                            <div className={`absolute left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 ${isCompleted ? "bg-indigo-600 border-indigo-200" : "bg-slate-300 border-slate-100"}`} />
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("skills_passport.timeline.assessment")} {idx + 1}</p>
                                                                    <h4 className="text-xl font-black">{isBaseline ? t("skills_passport.timeline.baseline") : `${t("skills_passport.timeline.assessment")} ${stage}`}</h4>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-black text-indigo-600">{isCompleted ? `${score}%` : t("common.pending") || "Pending"}</p>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>


                                </motion.div>
                            )}

                            {activeTab === 'other' && (
                                <motion.div
                                    key="other-tab"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 md:p-14 shadow-sm">
                                        <div className="flex items-center gap-5 mb-10">
                                            <IconBox className="bg-orange-600 text-white">
                                                <ExternalLink className="w-6 h-6" />
                                            </IconBox>
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t("skills_passport.other_courses.title")}</h2>
                                        </div>
                                        {fullDetails.otherCourses.length > 0 ? (
                                            <div className="grid md:grid-cols-2 gap-8">
                                                {fullDetails.otherCourses.map((course, idx) => (
                                                    <div key={idx} className="p-8 rounded-[32px] bg-white dark:bg-slate-800/50 border border-slate-200 shadow-sm">
                                                        <h3 className="text-xl font-black mb-2">{course.companyName || course.institution}</h3>
                                                        <p className="text-indigo-600 font-bold mb-4">{course.role || "Completed Course"}</p>
                                                        <div className="flex items-center gap-3 text-sm text-slate-500">
                                                            <Calendar className="w-4 h-4" />
                                                            {course.duration || "Verified Completion"}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 opacity-50">
                                                <BookOpen className="w-16 h-16 mx-auto mb-4" />
                                                <p className="font-bold">{t("skills_passport.other_courses.none")}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'certificates' && (
                                <motion.div
                                    key="cert-tab"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 md:p-14 shadow-sm">
                                        <div className="flex items-center gap-5 mb-10">
                                            <IconBox className="bg-emerald-600 text-white">
                                                <Award className="w-6 h-6" />
                                            </IconBox>
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t("skills_passport.certificates.title")}</h2>
                                        </div>
                                        {fullDetails.certificates.length > 0 ? (
                                            <div className="grid md:grid-cols-3 gap-8">
                                                {fullDetails.certificates.map((cert, idx) => (
                                                    <div key={idx} className="group relative rounded-3xl overflow-hidden border border-slate-200 bg-white dark:bg-slate-800 shadow-sm">
                                                        <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-8">
                                                            <Award className="w-20 h-20 text-indigo-500 opacity-20" />
                                                        </div>
                                                        <div className="p-6">
                                                            <h3 className="font-black text-lg mb-1">{cert.title}</h3>
                                                            <p className="text-sm text-slate-500 font-bold">{cert.issuer}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 opacity-50">
                                                <Award className="w-16 h-16 mx-auto mb-4" />
                                                <p className="font-bold">{t("skills_passport.certificates.none")}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'projects' && (
                                <motion.div
                                    key="proj-tab"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-12"
                                >
                                    <div className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 md:p-14 shadow-sm">
                                        <div className="flex items-center gap-5 mb-10">
                                            <IconBox className="bg-purple-600 text-white">
                                                <Layout className="w-6 h-6" />
                                            </IconBox>
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">{t("skills_passport.projects.title")}</h2>
                                        </div>
                                        {fullDetails.projects.length > 0 ? (
                                            <div className="space-y-8">
                                                {fullDetails.projects.map((proj, idx) => (
                                                    <div key={idx} className="p-10 rounded-[40px] bg-white dark:bg-slate-800 border border-slate-200 shadow-sm group">
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                                            <h3 className="text-2xl font-black group-hover:text-indigo-600">{proj.title}</h3>
                                                            <div className="px-4 py-1.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-widest">{proj.category || "Project"}</div>
                                                        </div>
                                                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed text-lg mb-8">
                                                            {proj.description}
                                                        </p>
                                                        {proj.link && (
                                                            <a href={proj.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-indigo-600 font-black">
                                                                View Project <ExternalLink className="w-4 h-4" />
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 opacity-50">
                                                <Rocket className="w-16 h-16 mx-auto mb-4" />
                                                <p className="font-bold">No projects uploaded yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="text-center pb-20">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em]">
                        SMAART Minds AI Verification Protocol • Institutional Grade Trust • {new Date().getFullYear()}
                    </p>
                </div>
            </motion.div>
            {/* Footer Promo */}
            <motion.div
                whileInView={{ scale: 1 }}
                initial={{ scale: 0.95 }}
                className="rounded-[40px] md:rounded-[60px] p-8 sm:p-12 md:p-20 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)] border border-slate-200 dark:border-white/5 relative overflow-hidden group transition-colors"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
                <div className="space-y-6 text-center md:text-left relative z-10">
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">Ready for the <br className="hidden md:block" /> Next Level?</h2>
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-bold max-w-xl">
                        Your Skills Passport is a living document. Continue your assessments to unlock advanced certifications.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/assessments')}
                    className="bg-indigo-600 text-white px-14 py-7 rounded-3xl font-black text-2xl hover:bg-indigo-700 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)]"
                >
                    Continue Journey
                </motion.button>
            </motion.div>
        </div>
    );
};

export default SkillsPassport;
