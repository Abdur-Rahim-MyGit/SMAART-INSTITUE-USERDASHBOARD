import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Brain, Heart, BookOpen, Users, Briefcase, Monitor, Leaf, Download, Mail, Phone,
    Shield, Share2, MapPin, Calendar, CheckCircle, ArrowLeft, X,
    TrendingUp, Award, BadgeCheck, QrCode, Sparkles, BarChart3, ShieldCheck, Star,
    Zap, Rocket, GraduationCap, Layout, FileText, ExternalLink
} from "lucide-react";
import { assessmentApi } from "@/services/assessmentApi";
import { API_BASE_URL, coursesAPI, courseEnrollmentAPI } from "@/services/api";
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
        .passport-hex {
            clip-path: polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%);
        }
        @keyframes goldPulse {
            0%, 100% { transform: scale(1); opacity: 0.88; }
            50% { transform: scale(1.08); opacity: 1; }
        }
        .gold-star {
            animation: goldPulse 1.8s ease-in-out infinite;
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

const PROFESSIONAL_STANDARDS = [
    { title: "UNDERSTAND", description: "Comprehends context, intent, and priorities clearly." },
    { title: "STRUCTURE", description: "Organizes thinking into clear frameworks and action." },
    { title: "VERIFY", description: "Checks accuracy, quality, and evidence before delivery." },
    { title: "ADAPT", description: "Responds well to change, ambiguity, and new inputs." },
    { title: "COMMUNICATE", description: "Expresses ideas with clarity, brevity, and confidence." },
    { title: "CONNECT", description: "Builds trust and collaborates effectively with others." },
    { title: "OWN", description: "Takes responsibility and follows through with accountability." },
    { title: "CREATE", description: "Generates useful ideas, solutions, and improvements." },
    { title: "LEAD", description: "Guides others with initiative, judgment, and calm." },
    { title: "GROW", description: "Learns from feedback and evolves continuously." }
];

const getStaticStars = (label) => {
    const total = label.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return 3 + (total % 3);
};

const getFallbackData = (user) => {
    const identityRef = (user?._id || user?.id || "SM-0000").toString().slice(-8).toUpperCase();

    return {
        fullName: user?.fullName || "Rahul",
        email: user?.email || "rahul@smaart.in",
        phone: user?.mobile || user?.mobileNumber || "+91 98765 43210",
        passportId: `SM-${identityRef}-${new Date().getFullYear()}`,
        degree: "Bachelor of Technology",
        institution: "SMAART Institute",
        verificationStatus: "VERIFIED",
        profileImage: spImage
    };
};

const resolveProfilePhoto = (...candidates) => {
    const rawPath = candidates.find((value) => typeof value === "string" && value.trim().length > 0);
    if (!rawPath) return spImage;

    const cleanedPath = rawPath.trim().replace(/\\/g, "/");
    if (cleanedPath.startsWith("http://") || cleanedPath.startsWith("https://") || cleanedPath.startsWith("data:")) {
        return cleanedPath;
    }

    const normalizedPath = cleanedPath.startsWith("/") ? cleanedPath.slice(1) : cleanedPath;
    return `${getBackendUrl()}/${normalizedPath}`;
};

const getFallbackSkillCollections = (user) => ({
    smaartCourses: [
        {
            id: "course-1",
            title: "Data Analysis Fundamentals",
            skillsAcquired: ["Excel", "Data Interpretation", "Statistical Modeling"],
            platform: "SMAART Institute",
            provider: "SMAART Institute",
            level: "ADVANCED",
            verificationStatus: "VERIFIED",
            completionDate: "2026-03-18",
            meta: "Completed credential"
        },
        {
            id: "course-2",
            title: "Professional Communication Studio",
            skillsAcquired: ["Presentation", "Business Writing", "Client Readiness"],
            platform: "SMAART Institute",
            provider: "SMAART Institute",
            level: "INTERMEDIATE",
            verificationStatus: "VERIFIED",
            completionDate: "2026-02-09",
            meta: "Cohort pathway"
        }
    ],
    technicalSkills: [
        {
            id: "tech-1",
            title: "React Development",
            skillsAcquired: ["Component Architecture", "State Management", "UI Delivery"],
            platform: "Project Portfolio",
            provider: user?.fullName || "Student Portfolio",
            level: "ADVANCED",
            verificationStatus: "VERIFIED",
            meta: "4 projects",
            supportingInfo: "Certifications: Frontend Specialization"
        },
        {
            id: "tech-2",
            title: "SQL & Data Querying",
            skillsAcquired: ["Joins", "Dashboards", "Data Cleaning"],
            platform: "Applied Projects",
            provider: "SMAART Skills Vault",
            level: "INTERMEDIATE",
            verificationStatus: "SELF DECLARED",
            meta: "2 projects",
            supportingInfo: "Certifications: Database Essentials"
        }
    ],
    aiSkills: [
        {
            id: "ai-1",
            title: "ChatGPT Workflow Design",
            skillsAcquired: ["Prompt Engineering", "Research Synthesis", "Automation"],
            platform: "AI Practice Lab",
            provider: "Open AI Tooling Track",
            level: "ADVANCED",
            verificationStatus: "VERIFIED",
            meta: "Verified AI tool usage",
            supportingInfo: "Tool: ChatGPT"
        },
        {
            id: "ai-2",
            title: "Canva AI Content",
            skillsAcquired: ["Visual Drafting", "Creative Assistance", "Brand Iteration"],
            platform: "Creative Workflow",
            provider: "Self Practice",
            level: "BEGINNER",
            verificationStatus: "SELF DECLARED",
            meta: "Emerging capability",
            supportingInfo: "Tool: Canva AI"
        }
    ],
    domainSkills: [
        {
            id: "domain-1",
            title: "Applied Artificial Intelligence",
            skillsAcquired: ["Model Thinking", "Responsible AI", "Use Case Mapping"],
            platform: "Academic Domain",
            provider: "SMAART Institute",
            level: "ADVANCED",
            verificationStatus: "VERIFIED",
            meta: "Institution-aligned",
            supportingInfo: "Expertise: Applied AI"
        },
        {
            id: "domain-2",
            title: "Product Strategy",
            skillsAcquired: ["Roadmapping", "User Insights", "Execution Planning"],
            platform: "Career Domain",
            provider: "Learning Portfolio",
            level: "INTERMEDIATE",
            verificationStatus: "SELF DECLARED",
            meta: "Practice-backed",
            supportingInfo: "Expertise: Product & Growth"
        }
    ]
});

const formatDateLabel = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const normalizeList = (value) => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string") {
        return value
            .split(/,|\||;/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
};

const badgeClasses = {
    VERIFIED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "SELF DECLARED": "bg-slate-100 text-slate-600 border border-slate-200",
    ADVANCED: "text-white border",
    INTERMEDIATE: "text-white border",
    BEGINNER: "bg-slate-100 text-slate-500 border border-slate-200",
    COMPLETED: "text-white border"
};

const getBadgeClass = (value, fallback = "SELF DECLARED") => {
    const key = String(value || fallback).toUpperCase();
    return badgeClasses[key] || badgeClasses[String(fallback).toUpperCase()] || badgeClasses["SELF DECLARED"];
};

const getBadgeStyle = (value) => {
    const key = String(value || "").toUpperCase();
    if (key === "ADVANCED" || key === "COMPLETED") {
        return { backgroundColor: "#163a86", borderColor: "#163a86", color: "#ffffff" };
    }
    if (key === "INTERMEDIATE") {
        return { backgroundColor: "#475569", borderColor: "#475569", color: "#ffffff" };
    }
    return undefined;
};

const SkillPassportCard = ({ item, accentIcon: AccentIcon = Sparkles }) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.01 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="group relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/88 p-6 shadow-[0_16px_45px_-28px_rgba(15,23,42,0.28)] backdrop-blur-xl hover:border-[#163a86]/20 hover:shadow-[0_28px_65px_-24px_rgba(22,58,134,0.22)]"
    >
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#163a86]/25 to-transparent" />
        <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#163a86]/8 text-[#163a86]">
                        <AccentIcon className="h-4 w-4" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black leading-tight text-[#163a86]">{item.title}</h3>
                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                            {item.platform}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getBadgeClass(item.level, "BEGINNER")}`}
                    style={getBadgeStyle(item.level)}
                >
                    {item.level}
                </span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getBadgeClass(item.verificationStatus)}`}>
                    {item.verificationStatus}
                </span>
            </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Skills Acquired</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {item.skillsAcquired.map((skill) => (
                        <span
                            key={skill}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600"
                        >
                            {skill}
                        </span>
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Learning Platform</p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">{item.provider}</p>
                </div>
                {item.completionDate && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDateLabel(item.completionDate)}
                    </div>
                )}
                {item.meta && (
                    <p className="text-xs font-semibold text-slate-500">{item.meta}</p>
                )}
                {item.supportingInfo && (
                    <p className="text-xs font-semibold text-slate-500">{item.supportingInfo}</p>
                )}
            </div>
        </div>
    </motion.div>
);

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
    const passportExportRef = useRef(null);
    const [baselineResult, setBaselineResult] = useState(null);
    const [stageResults, setStageResults] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [hoveredQuotient, setHoveredQuotient] = useState(null);
    const [activeTab, setActiveTab] = useState("smart");
    const [registrationProfile, setRegistrationProfile] = useState(null);
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
    const [courseEnrollments, setCourseEnrollments] = useState([]);
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
                        const [baselineRes, stageRes, enrollmentsRes] = await Promise.allSettled([
                            assessmentApi.getBaseLineResults(userId),
                            assessmentApi.getStageResults(userId),
                            courseEnrollmentAPI.getByStudent(userId),
                        ]);

                        if (baselineRes.status === 'fulfilled' && baselineRes.value?.success) {
                            setBaselineResult(baselineRes.value.data);
                        }
                        if (stageRes.status === 'fulfilled' && stageRes.value?.success) {
                            setStageResults(stageRes.value.data || {});
                        }
                        if (enrollmentsRes.status === "fulfilled") {
                            const enrollmentData = Array.isArray(enrollmentsRes.value)
                                ? enrollmentsRes.value
                                : Array.isArray(enrollmentsRes.value?.data)
                                    ? enrollmentsRes.value.data
                                    : [];
                            const enrichedEnrollments = await Promise.all(
                                enrollmentData.map(async (enrollment) => {
                                    if (enrollment?.courseDetails || !enrollment?.course) return enrollment;
                                    try {
                                        const courseResponse = await coursesAPI.getById(enrollment.course);
                                        const courseDetails = courseResponse?.data || courseResponse || null;
                                        return { ...enrollment, courseDetails };
                                    } catch {
                                        return enrollment;
                                    }
                                })
                            );
                            setCourseEnrollments(enrichedEnrollments);
                        }
                    }

                    if (email) {
                        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
                        const response = await fetch(`${API_BASE_URL}/users/register-details/${email}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (response.ok) {
                            const data = await response.json();
                            setRegistrationProfile(data);
                            setFullDetails({
                                certificates: Array.isArray(data.certificates) ? data.certificates : [],
                                projects: Array.isArray(data.projects) ? data.projects : [],
                                workExperience: Array.isArray(data.workExperience) ? data.workExperience : [],
                                otherCourses: Array.isArray(data.otherCourses) ? data.otherCourses : []
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

    useEffect(() => {
        const fetchProfilePhoto = async () => {
            if (!currentUser?.email) return;
            try {
                const response = await fetch(`${API_BASE_URL}/users/register-details/${currentUser.email}`);
                if (response.ok) {
                    const data = await response.json();
                    const photoUrl =
                        data.profilePhoto ||
                        data.otherDetails?.profilePhoto ||
                        currentUser?.profileImage ||
                        currentUser?.profilePicture;
                    if (photoUrl) {
                        const fullUrl = photoUrl.startsWith("http") ? photoUrl : `${getBackendUrl()}/${photoUrl.replace(/^\/+/, "")}`;
                        setProfilePhotoUrl(fullUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile photo:", error);
            }
        };

        fetchProfilePhoto();
    }, [currentUser?.email, currentUser?.profileImage, currentUser?.profilePicture]);

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
        if (!passportExportRef.current) return;
        setIsExporting(true);
        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(passportExportRef.current, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                scrollX: 0,
                scrollY: -window.scrollY,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const imgW = 210;
            const pageH = 297;
            const imgH = (canvas.height * imgW) / canvas.width;

            if (imgH <= pageH) {
                pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
            } else {
                let heightLeft = imgH;
                let position = 0;
                pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
                heightLeft -= pageH;

                while (heightLeft > 0) {
                    position = heightLeft - imgH;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
                    heightLeft -= pageH;
                }
            }
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

    const fallbackData = getFallbackData(currentUser);
    const userName = registrationProfile?.fullName || currentUser?.fullName || fallbackData.fullName;
    const passportEmail = registrationProfile?.email || currentUser?.email || fallbackData.email;
    const passportPhone = registrationProfile?.mobileNumber || currentUser?.mobile || currentUser?.phone || fallbackData.phone;
    const passportDegree =
        registrationProfile?.higherEducation?.[0]?.degreeFullName ||
        registrationProfile?.higherEducation?.[0]?.degree ||
        registrationProfile?.department ||
        registrationProfile?.educationLevel ||
        fallbackData.degree;
    const passportInstitution =
        registrationProfile?.institution ||
        registrationProfile?.higherEducation?.[0]?.institutionName ||
        fallbackData.institution;
    const verificationStatus =
        registrationProfile?.verificationStatus ||
        (registrationProfile?.status === "approved" ? "VERIFIED" : null) ||
        fallbackData.verificationStatus;
    const profilePhoto = profilePhotoUrl || resolveProfilePhoto(
        registrationProfile?.profilePhoto,
        registrationProfile?.profileImage,
        registrationProfile?.otherDetails?.profilePhoto,
        registrationProfile?.otherDetails?.profileImage,
        registrationProfile?.avatar,
        registrationProfile?.image,
        currentUser?.profilePhoto,
        currentUser?.profileImage,
        currentUser?.profilePicture,
        currentUser?.avatar,
        currentUser?.image,
        currentUser?.otherDetails?.profilePhoto,
        currentUser?.otherDetails?.profileImage,
        currentUser?.otherDetails?.profilePicture,
        currentUser?.otherDetails?.avatar,
        fallbackData.profileImage
    );

    const passportId = registrationProfile?.passportId || registrationProfile?.studentId || fallbackData.passportId;
    const standardRatings = PROFESSIONAL_STANDARDS.map((standard) => ({
        ...standard,
        stars: getStaticStars(standard.title)
    }));
    const fallbackCollections = getFallbackSkillCollections(currentUser);
    const smaartCourses = courseEnrollments.length > 0
        ? courseEnrollments.map((enrollment, index) => {
            const courseData = enrollment.courseDetails || enrollment.course || {};
            const courseTitle = courseData.title || courseData.courseName || enrollment.courseName || `SMAART Course ${index + 1}`;
            const acquiredSkills = normalizeList(
                courseData.acquiredSkills ||
                courseData.skills ||
                enrollment.acquiredSkills ||
                enrollment.skills
            );
            const progress = Number(
                enrollment.completionPercentage ??
                enrollment.progress ??
                enrollment.progressPercentage ??
                0
            );

            return {
                id: enrollment._id || courseData._id || `course-${index}`,
                title: courseTitle,
                skillsAcquired: acquiredSkills.length > 0 ? acquiredSkills : ["Foundational competency", "Applied learning", "Outcome delivery"],
                platform: "SMAART Course",
                provider: courseData.provider || courseData.instructor || courseData.category || "SMAART Institute",
                level: String(enrollment.level || courseData.level || (progress >= 80 ? "ADVANCED" : progress >= 45 ? "INTERMEDIATE" : "BEGINNER")).toUpperCase(),
                verificationStatus: String(
                    enrollment.verificationStatus ||
                    (enrollment.completed || progress >= 100 ? "VERIFIED" : "SELF DECLARED")
                ).toUpperCase(),
                completionDate: enrollment.completedAt || enrollment.updatedAt || courseData.updatedAt || courseData.createdAt,
                meta: progress ? `${Math.round(progress)}% completed` : "In learning path"
            };
        })
        : fallbackCollections.smaartCourses;

    const technicalSkillSource = Array.isArray(registrationProfile?.skills) && registrationProfile.skills.length > 0
        ? registrationProfile.skills
        : Array.isArray(fullDetails.projects) && fullDetails.projects.length > 0
            ? fullDetails.projects
            : null;

    const technicalSkills = technicalSkillSource
        ? technicalSkillSource.map((skill, index) => ({
            id: `tech-${index}`,
            title: skill.skillName || skill.name || skill.title || `Technical Skill ${index + 1}`,
            skillsAcquired: normalizeList(skill.projects || skill.tools || skill.focusAreas || skill.significantAchievements || skill.description || skill.name || skill.title),
            platform: "Technical Skills",
            provider: skill.institution || skill.companyName || "Student Portfolio",
            level: String(skill.proficiency || "INTERMEDIATE").toUpperCase(),
            verificationStatus: String(skill.verificationStatus || "SELF DECLARED").toUpperCase(),
            meta: skill.projects ? `Projects: ${Array.isArray(skill.projects) ? skill.projects.length : skill.projects}` : skill.teamType ? `Team Type: ${skill.teamType}` : null,
            supportingInfo: skill.certifications ? `Certifications: ${normalizeList(skill.certifications).join(", ")}` : skill.projectUrl ? `Project Link Available` : null
        }))
        : fallbackCollections.technicalSkills;

    const aiSkillSource = Array.isArray(registrationProfile?.aiSkills) && registrationProfile.aiSkills.length > 0
        ? registrationProfile.aiSkills
        : Array.isArray(fullDetails.certificates) && fullDetails.certificates.length > 0
            ? fullDetails.certificates
            : null;

    const aiSkills = aiSkillSource
        ? aiSkillSource.map((skill, index) => ({
            id: `ai-${index}`,
            title: skill.aiTool || skill.tool || skill.title || `AI Skill ${index + 1}`,
            skillsAcquired: normalizeList(skill.useCases || skill.workflows || skill.skills || skill.description || skill.aiTool || skill.title),
            platform: "AI Skills",
            provider: skill.issuer || "AI Practice Stack",
            level: String(skill.proficiency || "INTERMEDIATE").toUpperCase(),
            verificationStatus: String(skill.verified ? "VERIFIED" : (skill.verificationStatus || "SELF DECLARED")).toUpperCase(),
            meta: skill.verified ? "Verified AI capability" : "Self-declared AI capability",
            supportingInfo: skill.aiTool ? `Tool: ${skill.aiTool}` : skill.issuer ? `Issuer: ${skill.issuer}` : null
        }))
        : fallbackCollections.aiSkills;

    const domainSkillSource = Array.isArray(registrationProfile?.domainSkills) && registrationProfile.domainSkills.length > 0
        ? registrationProfile.domainSkills
        : passportDegree
            ? [{ domainName: passportDegree, expertise: passportInstitution, verificationStatus }]
            : null;

    const domainSkills = domainSkillSource
        ? domainSkillSource.map((skill, index) => ({
            id: `domain-${index}`,
            title: skill.domainName || skill.name || `Domain Skill ${index + 1}`,
            skillsAcquired: normalizeList(skill.focusAreas || skill.expertise || skill.domainName),
            platform: "Domain Skills",
            provider: passportInstitution,
            level: String(skill.level || "INTERMEDIATE").toUpperCase(),
            verificationStatus: String(skill.verificationStatus || "SELF DECLARED").toUpperCase(),
            meta: skill.expertise ? `Expertise: ${skill.expertise}` : "Domain-aligned capability",
            supportingInfo: skill.domainName ? `Domain: ${skill.domainName}` : null
        }))
        : fallbackCollections.domainSkills;

    const tabCollections = {
        smart: {
            title: "Completed SMAART Courses",
            description: "Verified learning pathways completed through the SMAART ecosystem.",
            items: smaartCourses,
            icon: Sparkles
        },
        other: {
            title: "Technical Skills",
            description: "Hands-on technical abilities, projects, and supporting certifications.",
            items: technicalSkills,
            icon: Briefcase
        },
        certificates: {
            title: "AI Skills",
            description: "AI tool fluency, workflows, and verified adoption across practical work.",
            items: aiSkills,
            icon: Monitor
        },
        projects: {
            title: "Domain Skills",
            description: "Subject-matter strengths and domain-specific professional depth.",
            items: domainSkills,
            icon: Layout
        }
    };
    const verifiedSkills = [
        "Cognitive Analysis", "Digital Literacy", "Agile Learning",
        "Professional Execution", "Ethics & Sustainability", "Social Intelligence"
    ];
    const verificationTimestamp = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
    const passportShareUrl = `${window.location.origin}/verify/${passportId}`;

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
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55 }}
                    className="rounded-[32px] md:rounded-[44px] border border-slate-200/60 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_34%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.92))] px-8 py-10 md:px-14 md:py-14 shadow-[0_28px_70px_-30px_rgba(15,23,42,0.18)]"
                >
                    <div className="max-w-4xl">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="inline-flex items-center rounded-full border border-slate-300/80 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.26em] text-slate-800 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]">
                                Digital Skills Passport
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-700 shadow-[0_10px_24px_-18px_rgba(16,185,129,0.28)]">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-emerald-200">
                                    <BadgeCheck className="h-3.5 w-3.5" />
                                </span>
                                Employer Verifiable
                            </div>
                        </div>

                        <h1 className="mt-8 max-w-3xl text-[2.6rem] font-black leading-[0.98] tracking-tight text-[#0f172a] sm:text-5xl md:text-[4.25rem]">
                            The future of verified talent.
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-slate-600 md:text-[1.65rem] md:leading-[1.5]">
                            Your secure, AI-verified credential of capability. Designed for employers who demand proof, and professionals who seek growth.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleExport}
                                disabled={isExporting}
                                className="inline-flex h-14 items-center justify-center gap-3 rounded-[20px] px-6 text-base font-black text-white shadow-[0_22px_40px_-20px_rgba(79,70,229,0.42)] transition-all hover:shadow-[0_26px_46px_-18px_rgba(79,70,229,0.5)] disabled:opacity-70"
                                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #5b4cf0 100%)", color: "#ffffff" }}
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/18 ring-1 ring-white/20">
                                    <Download className="h-4 w-4 text-white" />
                                </span>
                                <span className="text-white">{isExporting ? "Exporting PDF..." : "Get Passport PDF"}</span>
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(passportShareUrl);
                                        sonnerToast.success("Passport link copied!");
                                    } catch {
                                        sonnerToast.error("Unable to copy passport link.");
                                    }
                                }}
                                className="inline-flex h-14 items-center justify-center gap-3 rounded-[20px] border border-slate-200 bg-white px-6 text-base font-black text-slate-700 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.22)] transition-all hover:border-slate-300 hover:shadow-[0_22px_34px_-22px_rgba(15,23,42,0.24)]"
                                >
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                                    <Share2 className="h-4 w-4 text-slate-600" />
                                </span>
                                <span>Share Identity</span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <div
                    ref={passportExportRef}
                    className="rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl transition-all"
                >
                    <div className="bg-slate-100 dark:bg-slate-900/50 p-6 sm:p-10 md:p-14 text-slate-900 dark:text-white relative transition-colors">
                        <div className="absolute top-0 right-10 h-52 w-52 rounded-full bg-indigo-500/6 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-8 left-20 h-36 w-36 rounded-full bg-cyan-500/6 blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto relative z-10 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55 }}
                                className="relative mx-auto w-full max-w-4xl rounded-[24px] border border-slate-200/70 dark:border-white/10 bg-white/88 dark:bg-slate-900/55 px-5 py-6 sm:px-7 md:px-8 backdrop-blur-xl shadow-[0_22px_60px_-28px_rgba(15,23,42,0.18)]"
                            >
                                <div className="space-y-5 lg:pr-[180px]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_14px_28px_rgba(79,70,229,0.28)]">
                                                    <Sparkles className="w-4 h-4" />
                                                </div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                                    Skills Passport
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            <h1 className="text-3xl sm:text-4xl md:text-[3.2rem] font-black leading-none tracking-tight text-[#163a86] dark:text-white">
                                                {userName}
                                            </h1>

                                            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium break-all">{passportEmail}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{passportPhone}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{passportId}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <GraduationCap className="w-4 h-4 text-slate-400" />
                                                    <span className="font-medium">{passportDegree}</span>
                                                </div>
                                            </div>
                                        </div>
                                </div>

                                <div className="mt-8 flex justify-center lg:hidden">
                                    <div className="space-y-4">
                                        <div
                                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            className="relative"
                                        >
                                            <div className="passport-hex flex h-28 w-28 items-center justify-center border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/30 p-3 backdrop-blur-xl shadow-[0_18px_40px_-22px_rgba(15,23,42,0.22)]">
                                                <div className="h-[72px] w-[72px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]">
                                                    <img
                                                        src={profilePhoto}
                                                        alt={userName}
                                                        className="block h-full w-full object-cover object-top"
                                                        onError={(e) => { e.target.src = spImage; }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 text-white shadow-lg">
                                                <BadgeCheck className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <div className="w-32 rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-slate-50/85 dark:bg-slate-800/30 p-3 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{passportInstitution}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden lg:block absolute right-8 top-6">
                                    <div className="space-y-4">
                                        <div
                                            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                                            onMouseMove={handleMouseMove}
                                            onMouseLeave={handleMouseLeave}
                                            className="relative"
                                        >
                                            <div className="passport-hex flex h-28 w-28 items-center justify-center border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-slate-800/30 p-3 backdrop-blur-xl shadow-[0_18px_40px_-22px_rgba(15,23,42,0.22)]">
                                                <div className="h-[72px] w-[72px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]">
                                                    <img
                                                        src={profilePhoto}
                                                        alt={userName}
                                                        className="block h-full w-full object-cover object-top"
                                                        onError={(e) => { e.target.src = spImage; }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 bg-emerald-500 text-white shadow-lg">
                                                <BadgeCheck className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <div className="w-32 rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-slate-50/85 dark:bg-slate-800/30 p-3 text-center">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{passportInstitution}</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08, duration: 0.5 }}
                                className="mx-auto max-w-5xl rounded-[24px] border border-slate-200/70 dark:border-white/10 bg-white/88 dark:bg-slate-900/55 px-6 py-6 sm:px-8 backdrop-blur-xl shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)]"
                            >
                                <div className="mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Ten Professional Standards</p>
                                    <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                                        Professional Standards Matrix
                                    </h2>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                    {standardRatings.map((standard, index) => (
                                        <motion.div
                                            key={standard.title}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.03 * index }}
                                            whileHover={{ y: -4 }}
                                            className="rounded-[20px] border border-slate-200/70 dark:border-white/10 bg-slate-50/80 dark:bg-slate-800/30 p-4"
                                        >
                                            <p className="min-h-[38px] text-sm font-black leading-snug tracking-tight text-slate-900 dark:text-white">
                                                {standard.title}
                                            </p>
                                            <p className="mt-3 min-h-[48px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                                                {standard.description}
                                            </p>
                                            <div className="mt-4 flex items-center gap-1.5">
                                                {Array.from({ length: 5 }).map((_, starIndex) => {
                                                    const active = starIndex < standard.stars;
                                                    return (
                                                        <motion.span
                                                            key={`${standard.title}-${starIndex}`}
                                                            animate={{ scale: active ? [1, 1.08, 1] : 1 }}
                                                            transition={{ duration: 1.8, repeat: Infinity, delay: starIndex * 0.12 }}
                                                        >
                                                            <Star
                                                                className={`gold-star h-4 w-4 ${active ? "" : "text-slate-300 dark:text-slate-600"}`}
                                                                style={active
                                                                    ? { fill: "#d4a017", color: "#d4a017", stroke: "#d4a017" }
                                                                    : { fill: "transparent" }
                                                                }
                                                            />
                                                        </motion.span>
                                                    );
                                                })}
                                            </div>
                                            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                                                {standard.stars}/5 Rating
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            <div className="max-w-5xl mx-auto px-2 sm:px-4">
                                <div className="flex sm:flex-wrap justify-start sm:justify-center gap-0 bg-white/65 dark:bg-slate-900/45 backdrop-blur-xl rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'smart', label: 'SMAART Courses', icon: Sparkles },
                                        { id: 'other', label: 'Technical Skills', icon: Briefcase },
                                        { id: 'certificates', label: 'AI Skills', icon: Monitor },
                                        { id: 'projects', label: 'Domain Skills', icon: Layout }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 md:px-6 py-4 font-black text-[11px] uppercase tracking-[0.18em] transition-all relative overflow-hidden ${activeTab === tab.id
                                                ? "bg-slate-50 dark:bg-slate-800/50 text-[#d94b4b]"
                                                : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
                                                }`}
                                        >
                                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-[#d94b4b]" : ""}`} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#d94b4b]" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <motion.div
                                key={`passport-top-${activeTab}`}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35 }}
                                className="mx-auto w-full max-w-5xl space-y-6"
                            >
                                <div className="rounded-[32px] border border-slate-200/70 bg-white/72 p-6 md:p-10 shadow-sm backdrop-blur-xl">
                                    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                                                Dynamic Skills Registry
                                            </p>
                                            <h2 className="mt-3 text-3xl md:text-4xl font-black text-slate-900">
                                                {tabCollections[activeTab].title}
                                            </h2>
                                            <p className="mt-3 max-w-2xl text-sm font-medium text-slate-500">
                                                {tabCollections[activeTab].description}
                                            </p>
                                        </div>
                                        <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                            {tabCollections[activeTab].items.length} Records
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-2">
                                    {tabCollections[activeTab].items.map((item) => (
                                        <SkillPassportCard
                                            key={`passport-${item.id}`}
                                            item={item}
                                            accentIcon={tabCollections[activeTab].icon}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-end justify-between gap-6 rounded-[24px] border border-slate-200/70 dark:border-white/10 bg-white/88 dark:bg-slate-900/55 px-5 py-5 sm:px-7 backdrop-blur-xl shadow-[0_18px_42px_-24px_rgba(15,23,42,0.16)]">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">Digital Trust Protocol</p>
                                        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-emerald-600">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Secure & Live
                                        </p>
                                        <p className="mt-2 text-xs font-medium text-slate-400">
                                            Scan to share or view this skills passport
                                        </p>
                                    </div>
                                    <div className="rounded-[18px] bg-white p-3 shadow-[0_18px_34px_-20px_rgba(15,23,42,0.22)]">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/verify/${passportId}`}
                                            size={72}
                                            fgColor="#0f172a"
                                            bgColor="#ffffff"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                </div>

                <div className="rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl transition-all">
                    <div className="p-4 sm:p-8 md:p-16 space-y-12 md:space-y-20 relative">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="space-y-10"
                            >
                                {activeTab === 'smart' && (
                                    <div className="space-y-16 pt-4">
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
                                )}

                                {activeTab === 'other' && (
                                    <div className="pt-4">
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
                                    </div>
                                )}

                                {activeTab === 'certificates' && (
                                    <div className="pt-4">
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
                                    </div>
                                )}

                                {activeTab === 'projects' && (
                                    <div className="pt-4">
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
                                    </div>
                                )}
                            </motion.div>
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
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[0.98] text-slate-900 dark:text-white">Ready for the <br className="hidden md:block" /> Next Level?</h2>
                    <p className="text-base md:text-lg text-slate-600 dark:text-slate-400 font-bold max-w-xl leading-relaxed">
                        Your Skills Passport is a living document. Continue your assessments to unlock advanced certifications.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/dashboard/assessments')}
                    className="bg-indigo-600 text-white px-10 py-5 rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.2)]"
                >
                    Continue Journey
                </motion.button>
            </motion.div>
        </div>
    );
};

export default SkillsPassport;
