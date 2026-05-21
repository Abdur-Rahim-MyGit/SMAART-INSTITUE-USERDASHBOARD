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
import { getBackendUrl } from "@/services/api";
import { useTranslation } from "react-i18next";
import spImage from "@/assets/sp.jpeg";
import PageHero from "@/components/ui/PageHero";


// --- Constants & Metadata ---



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
    VERIFIED: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20",
    "SELF DECLARED": "bg-slate-100 dark:bg-dark-elevated text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10",
    ADVANCED: "bg-teal dark:bg-teal text-white border-teal shadow-md",
    INTERMEDIATE: "bg-navy-light dark:bg-dark-elevated text-white border-navy-light shadow-sm",
    BEGINNER: "bg-slate-100 dark:bg-dark-elevated text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5",
    COMPLETED: "bg-teal dark:bg-teal text-white border-teal shadow-md"
};

const getBadgeClass = (value, fallback = "SELF DECLARED") => {
    const key = String(value || fallback).toUpperCase();
    return badgeClasses[key] || badgeClasses[String(fallback).toUpperCase()] || badgeClasses["SELF DECLARED"];
};

const SkillPassportCard = ({ item, accentIcon: AccentIcon = Sparkles }) => (
    <motion.div
        whileHover={{ y: -12, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-[#1a3884]/20 bg-white dark:bg-[#002147] p-6 shadow-lg transition-all duration-500 hover:shadow-xl"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-teal/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-x-12 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal/40 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />

        <div className="flex items-start justify-between gap-5 relative z-10">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-[#002A5C] shadow-sm border border-slate-100 dark:border-[#1a3884]/20 group-hover:scale-110 group-hover:bg-[#1a3884] group-hover:text-white transition-all duration-500">
                        <AccentIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-white group-hover:text-[#1a3884] dark:group-hover:text-blue-300 transition-colors duration-300">{item.title}</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors">
                            {item.platform}
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
                <span
                    className={`rounded-xl px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] shadow-sm ${getBadgeClass(item.level, "BEGINNER")}`}
                >
                    {item.level}
                </span>
                <span className={`rounded-xl px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 shadow-sm`}>
                    Verified
                </span>
            </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-[#1a3884]/15 relative z-10">
            <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-white dark:border-[#1a3884]/30 bg-slate-200 dark:bg-[#003170] overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-br from-slate-400 to-slate-500 opacity-20" />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <ShieldCheck className="w-3 h-3" />
                <span>SMAART Verified Record</span>
            </div>
        </div>
    </motion.div>
);



// --- Sub-components ---

const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-navy/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-teal/5 blur-[100px]" />
    </div>
);

const IconBox = ({ children, className = "" }) => (
    <div className={`p-3.5 rounded-2xl bg-slate-100 dark:bg-[#002A5C] text-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${className}`}>
        {children}
    </div>
);



const SkillBadge = ({ skill, verified = false }) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${verified
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 shimmer-effect"
            : "bg-[#F8FAFC] dark:bg-dark-elevated text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-white/5"
            }`}>
        {verified && <ShieldCheck className="w-4 h-4" />}
        {skill}
    </motion.div>
);



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
                backgroundColor: theme === 'dark' ? '#00152e' : '#ffffff',
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
        <div className="min-h-screen page-bg transition-colors p-3 md:p-8 relative overflow-x-hidden">
            <AnimatedBackground />
            <style>
                {`
                .passport-hex {
                    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
                }
                .shimmer-effect {
                    position: relative;
                    overflow: hidden;
                }
                .shimmer-effect::after {
                    content: "";
                    position: absolute;
                    top: 0; right: 0; bottom: 0; left: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                    transform: translateX(-100%);
                    animation: shimmer 2s infinite;
                }
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                `}
            </style>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="max-w-6xl mx-auto space-y-8 md:space-y-10"
                ref={containerRef}
            >
                {/* Standardized PageHero */}
                <PageHero
                    badge="Digital Skills Passport"
                    title="Skills Passport"
                    subtitle="Your secure, AI-verified credential of capability. Designed for employers who demand proof, and professionals who seek growth."
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleExport}
                            disabled={isExporting}
                            className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl px-5 text-sm font-bold text-white bg-[#1a3884] hover:bg-[#132c6b] shadow-lg transition-all disabled:opacity-70"
                        >
                            <Download className="h-4 w-4" />
                            {isExporting ? "Exporting..." : "Get Passport PDF"}
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
                            className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-200 dark:border-[#1a3884]/25 bg-white dark:bg-[#002147] px-5 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-[#002A5C]"
                        >
                            <Share2 className="h-4 w-4" />
                            Share Identity
                        </motion.button>
                    </div>
                </PageHero>

                <div
                    ref={passportExportRef}
                    className="rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-[#1a3884]/20 bg-white dark:bg-[#002147] transition-all"
                >
                    <div className="bg-[#F8FAFC] dark:bg-[#002147] p-6 sm:p-10 md:p-14 text-slate-900 dark:text-white relative transition-colors">
                        <div className="absolute top-0 right-10 h-52 w-52 rounded-full bg-teal/10 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-8 left-20 h-36 w-36 rounded-full bg-navy/10 blur-3xl pointer-events-none" />

                        <div className="max-w-5xl mx-auto relative z-10 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55 }}
                                className="relative mx-auto w-full max-w-4xl rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white dark:bg-dark-elevated px-5 py-6 sm:px-7 md:px-8 shadow-xl"
                            >
                                <div className="space-y-5 lg:pr-[180px]">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal text-white shadow-lg">
                                                <Sparkles className="w-4 h-4" />
                                            </div>
                                            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                                                Skills Passport
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight text-teal dark:text-white">
                                            {userName}
                                        </h1>

                                        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold break-all">{passportEmail}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold">{passportPhone}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ShieldCheck className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold">{passportId}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <GraduationCap className="w-4 h-4 text-slate-400" />
                                                <span className="font-bold">{passportDegree}</span>
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
                                            <div className="passport-hex flex h-28 w-28 items-center justify-center border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-dark-elevated p-3 backdrop-blur-xl shadow-[0_18px_40px_-22px_rgba(15,23,42,0.22)]">
                                                <div className="h-[72px] w-[72px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]">
                                                    <img
                                                        src={profilePhoto}
                                                        alt={userName}
                                                        className="block h-full w-full object-cover object-top"
                                                        onError={(e) => { e.target.src = spImage; }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white dark:border-white/8 bg-emerald-500 text-white shadow-lg">
                                                <BadgeCheck className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <div className="w-32 rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-slate-50/85 dark:bg-dark-elevated p-3 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{passportInstitution}</p>
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
                                            <div className="passport-hex flex h-28 w-28 items-center justify-center border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-dark-elevated p-3 backdrop-blur-xl shadow-[0_18px_40px_-22px_rgba(15,23,42,0.22)]">
                                                <div className="h-[72px] w-[72px] overflow-hidden rounded-sm border border-slate-200 bg-white shadow-[0_16px_30px_-18px_rgba(15,23,42,0.35)]">
                                                    <img
                                                        src={profilePhoto}
                                                        alt={userName}
                                                        className="block h-full w-full object-cover object-top"
                                                        onError={(e) => { e.target.src = spImage; }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white dark:border-white/8 bg-emerald-500 text-white shadow-lg">
                                                <BadgeCheck className="h-3.5 w-3.5" />
                                            </div>
                                        </div>
                                        <div className="w-32 rounded-[18px] border border-slate-200/70 dark:border-white/10 bg-slate-50/85 dark:bg-dark-elevated p-3 text-center">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{passportInstitution}</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08, duration: 0.5 }}
                                className="mx-auto max-w-5xl rounded-[24px] border border-slate-200/70 dark:border-[#1a3884]/20 bg-white dark:bg-[#002147] px-6 py-6 sm:px-8 shadow-[0_18px_42px_-24px_rgba(15,23,42,0.2)]"
                            >
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">Ten Professional Standards</p>
                                    <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                        Professional Standards Matrix
                                    </h2>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                    {standardRatings.map((standard, index) => (
                                        <motion.div
                                            key={standard.title}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 * index }}
                                            whileHover={{ y: -5 }}
                                            className="group relative rounded-2xl border border-slate-200/80 dark:border-[#1a3884]/20 bg-white dark:bg-[#002A5C]/40 p-5 shadow-sm transition-all duration-300 hover:bg-slate-50 dark:hover:bg-[#002A5C]/60"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Sparkles className="w-12 h-12" />
                                            </div>
                                            <p className="text-xs font-bold leading-snug tracking-[0.1em] text-[#1a3884] dark:text-blue-400 uppercase mb-3">
                                                {standard.title}
                                            </p>
                                            <p className="min-h-[48px] text-[11px] leading-snug font-medium text-slate-500 dark:text-slate-400">
                                                {standard.description}
                                            </p>
                                            <div className="mt-5 flex items-center justify-between">
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: 5 }).map((_, starIndex) => {
                                                        const active = starIndex < standard.stars;
                                                        return (
                                                            <Star
                                                                key={`${standard.title}-${starIndex}`}
                                                                className={`h-3 w-3 ${active ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                                                    Rating: {standard.stars}.0
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            <div className="max-w-5xl mx-auto px-2 sm:px-4">
                                <div className="flex sm:flex-wrap justify-start sm:justify-center gap-2 p-2 bg-slate-100/50 dark:bg-[#001A38] backdrop-blur-xl rounded-[28px] border border-slate-200 dark:border-[#1a3884]/20 shadow-inner overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'smart', label: 'SMAART Courses', icon: Sparkles },
                                        { id: 'other', label: 'Technical Skills', icon: Briefcase },
                                        { id: 'certificates', label: 'AI Skills', icon: Monitor },
                                        { id: 'projects', label: 'Domain Skills', icon: Layout }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex-1 min-w-[160px] flex items-center justify-center gap-3 px-6 py-4 font-bold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 rounded-[22px] relative overflow-hidden ${activeTab === tab.id
                                                ? "bg-white dark:bg-dark-elevated text-teal shadow-md"
                                                : "text-slate-500 dark:text-slate-300/70 hover:text-slate-700 dark:hover:text-white bg-transparent"
                                                }`}
                                        >
                                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-teal animate-pulse" : ""}`} />
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div
                                                    layoutId="tab-indicator"
                                                    className="absolute inset-0 border-2 border-teal-500/20 rounded-[22px]"
                                                    initial={false}
                                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                />
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
                                <div className="rounded-[40px] border border-slate-200/60 dark:border-[#1a3884]/20 bg-white dark:bg-[#002147] p-8 md:p-12 shadow-sm">
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-10 rounded-full bg-teal" />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">
                                                    Institutional Registry
                                                </p>
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                                {tabCollections[activeTab].title}
                                            </h2>
                                            <p className="max-w-2xl text-base font-bold text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {tabCollections[activeTab].description}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center rounded-[32px] bg-[#F8FAFC] dark:bg-[#002A5C] border border-slate-100 dark:border-[#1a3884]/20 px-8 py-6 shadow-sm">
                                            <span className="text-4xl font-bold text-teal dark:text-teal-light">{tabCollections[activeTab].items.length}</span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Verified Records</span>
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


                            </motion.div>
                        </div>
                    </div>

                </div>



                <div className="text-center pb-20">

                </div>
            </motion.div>
            {/* Footer Promo */}

        </div>
    );
};

export default SkillsPassport;
