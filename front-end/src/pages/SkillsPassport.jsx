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
import spImage from "@/assets/sp.jpeg";

// --- Custom Styles for Micro-animations ---
const PremiumStyles = () => (
    <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .shimmer-effect {
            position: relative;
            overflow: hidden;
        }
        .shimmer-effect::after {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 2s infinite;
        }
        .glass-morphism {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .dark .glass-morphism {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-glow {
            text-shadow: 0 0 15px rgba(99, 102, 241, 0.5);
        }
        .perspective-1000 {
            perspective: 1000px;
        }
    `}} />
);

// --- Constants & Metadata ---

const QUOTIENTS = [
    { id: 'CRQ', name: "Cognitive Reasoning", icon: Brain, desc: "Problem solving, critical thinking, and pattern recognition." },
    { id: 'SRQ', name: "Self-regulation", icon: Heart, desc: "Emotional intelligence, discipline, and stress management." },
    { id: 'LQ', name: "Learning Agility", icon: BookOpen, desc: "Ability to learn quickly and adapt to new situations." },
    { id: 'SIQ', name: "Social Intelligence", icon: Users, desc: "Interpersonal skills, empathy, and collaborative mindset." },
    { id: 'PEQ', name: "Professional Execution", icon: Briefcase, desc: "Deliverability, reliability, and technical proficiency." },
    { id: 'DAQ', name: "Digital & AI", icon: Monitor, desc: "Fluency with digital tools and AI-driven workflows." },
    { id: 'SEQ', name: "Sustainability & Ethics", icon: Leaf, desc: "Commitment to ethical practices and environmental awareness." },
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
        whileHover={{ y: -8, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-[32px] shadow-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 backdrop-blur-md p-6 group transition-all"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
                <h3 className={`text-3xl font-black mt-2 tracking-tight ${colorClass}`}>{value}</h3>
                <p className="text-xs mt-2 text-slate-400 dark:text-slate-500 font-bold">{sub}</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                <Icon className="w-6 h-6" />
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
            sonnerToast.success("Passport exported successfully!");
        } catch (err) {
            console.error('PDF export failed:', err);
            sonnerToast.error("Export failed. Please try again.");
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors p-4 md:p-8 relative overflow-x-hidden">
            <PremiumStyles />
            <AnimatedBackground />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-7xl mx-auto space-y-12"
                ref={containerRef}
            >
                <div className="rounded-[48px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl transition-all">
                    <div className="bg-gradient-to-br from-indigo-700 via-violet-600 to-cyan-500 p-8 md:p-16 text-white relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto relative z-10 text-center lg:text-left">
                            <div className="space-y-10">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="flex flex-wrap gap-4 justify-center lg:justify-start"
                                >
                                    <div className="px-5 py-2 rounded-full bg-white/15 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/20">
                                        Digital Skills Passport
                                    </div>
                                    <div className="px-5 py-2 rounded-full bg-emerald-500/80 backdrop-blur-xl text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 flex items-center gap-2 shimmer-effect">
                                        <BadgeCheck className="w-4 h-4" /> Employer Verifiable
                                    </div>
                                </motion.div>

                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight"
                                >
                                    The Future of <br /> <span className="text-glow">Verified Talent.</span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-xl opacity-90 max-w-2xl font-medium leading-relaxed mx-auto lg:mx-0"
                                >
                                    Your secure, AI-verified competency credential. Designed for employers who demand proof, and professionals who demand growth.
                                </motion.p>

                                <div className="flex flex-wrap gap-5 pt-4 justify-center lg:justify-start">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleExport}
                                        disabled={isExporting}
                                        className="flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-slate-900 font-black text-lg hover:bg-slate-100 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)] active:scale-95 disabled:opacity-70 shimmer-effect"
                                    >
                                        {isExporting ? <span className="animate-pulse">Processing...</span> : <><Download className="w-6 h-6" /> Get Passport PDF</>}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            sonnerToast.success("Profile link copied!");
                                        }}
                                        className="flex items-center gap-3 px-10 py-5 rounded-2xl border-2 border-white/30 text-white font-black text-lg hover:bg-white/10 transition-all active:scale-95 backdrop-blur-md"
                                    >
                                        <Share2 className="w-6 h-6" /> Share Identity
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3D Passport Card */}
                    <div className="pt-12 perspective-1000 max-w-2xl mx-auto px-4">
                        <motion.div
                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="rounded-[40px] border-0 shadow-[0_50px_100px_rgba(0,0,0,0.3)] bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-10 space-y-8 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-5">
                                    <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-2xl transform transition-transform group-hover:scale-110">
                                        <img
                                            src={profilePhoto}
                                            alt={userName}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = spImage; }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tight">{userName}</h3>
                                        <p className="text-indigo-500 dark:text-indigo-400 text-sm font-black uppercase tracking-[0.2em] mt-1">{passportId}</p>
                                    </div>
                                </div>
                                <div className="px-4 py-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30">Verified</div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="rounded-[32px] p-6 bg-slate-50 dark:bg-slate-900/60 text-center border border-slate-100 dark:border-slate-700 group-hover:border-indigo-500/30 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Global Readiness</p>
                                    <h2 className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{latestScore}%</h2>
                                </div>
                                <div className="rounded-[32px] p-6 bg-slate-50 dark:bg-slate-900/60 text-center border border-slate-100 dark:border-slate-700 group-hover:border-emerald-500/30 transition-colors">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">PLVI Band</p>
                                    <h2 className="text-5xl font-black text-emerald-500">{baselineResult?.stageBand || "A"}</h2>
                                </div>
                            </div>

                            <div className="rounded-3xl p-5 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-2xl" />
                                <div className="relative z-10">
                                    <p className="text-[10px] opacity-70 font-black uppercase tracking-widest">Secure Trust Protocol</p>
                                    <p className="text-xs font-bold mt-1 flex items-center gap-2">
                                        <Shield className="w-3 h-3 text-emerald-400" /> Public Verification Live
                                    </p>
                                </div>
                                <div className="w-16 h-16 bg-white rounded-2xl p-2 shadow-2xl relative z-10">
                                    <QRCodeSVG value={window.location.href} className="w-full h-full" />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="max-w-4xl mx-auto px-4 mt-16 mb-8">
                        <div className="flex flex-wrap justify-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-3 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                            {[
                                { id: 'smart', label: 'Smart Course', icon: Sparkles },
                                { id: 'other', label: 'Other Course', icon: ExternalLink },
                                { id: 'certificates', label: 'Certificates', icon: Award },
                                { id: 'projects', label: 'Projects', icon: Layout }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all relative overflow-hidden ${activeTab === tab.id
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

                    <div className="p-8 md:p-16 pt-0 space-y-20 relative">
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
                                            label="Growth Delta"
                                            value={`+${growth}%`}
                                            sub="Verified Progression"
                                            colorClass="text-emerald-500"
                                        />
                                        <StatCard
                                            icon={Zap}
                                            label="Momentum Score"
                                            value="High"
                                            sub="Skill Acquisition Rate"
                                            colorClass="text-orange-500"
                                        />
                                        <StatCard
                                            icon={BadgeCheck}
                                            label="Skill Badges"
                                            value="14"
                                            sub="Competency Aligned"
                                            colorClass="text-blue-500"
                                        />
                                        <StatCard
                                            icon={ShieldCheck}
                                            label="Trust Rating"
                                            value="99.2"
                                            sub="Integrity Verified"
                                            colorClass="text-indigo-500"
                                        />
                                    </div>

                                    <div className="space-y-16">
                                        {/* Competency DNA */}
                                        <motion.div
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            className="rounded-[48px] border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl p-10 md:p-14 shadow-sm relative overflow-hidden"
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
                                                        <h2 className="text-4xl font-black text-slate-800 dark:text-white">Competency DNA</h2>
                                                    </div>
                                                    <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-md mx-auto md:mx-0">
                                                        A multi-dimensional breakdown of your verified cognitive and professional strengths.
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
                                                                    {q.name}
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
                                                                        {q.desc}
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
                                                <h2 className="text-4xl font-black text-slate-800 dark:text-white">Verified Proficiency</h2>
                                            </div>
                                            <div className="space-y-14">
                                                <div>
                                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Gold Standard Verified</h4>
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
                                                <h2 className="text-3xl font-black text-slate-800 dark:text-white">Timeline</h2>
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
                                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage {idx + 1}</p>
                                                                    <h4 className="text-xl font-black">{isBaseline ? "Baseline" : `Assessment ${stage}`}</h4>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-2xl font-black text-indigo-600">{isCompleted ? `${score}%` : "Pending"}</p>
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
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Other Institute Courses</h2>
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
                                                <p className="font-bold">No external courses found.</p>
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
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Earned Certificates</h2>
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
                                                <p className="font-bold">No certificates earned yet.</p>
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
                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white">Showcase Projects</h2>
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
                className="rounded-[60px] p-12 md:p-20 bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-[0_40px_100px_rgba(79,70,229,0.3)] relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 blur-3xl" />
                <div className="space-y-6 text-center md:text-left relative z-10">
                    <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none">Ready for the <br /> Next Level?</h2>
                    <p className="opacity-80 font-bold text-xl max-w-xl">
                        Your Skills Passport is a living document. Continue your assessments to unlock advanced certifications.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/assessments')}
                    className="bg-white text-slate-900 px-14 py-7 rounded-3xl font-black text-2xl hover:bg-slate-50 transition-all shimmer-effect"
                >
                    Continue Journey
                </motion.button>
            </motion.div>
        </div>
    );
};

export default SkillsPassport;
