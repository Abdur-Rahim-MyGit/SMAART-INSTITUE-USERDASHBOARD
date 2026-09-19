import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
    ArrowLeft, Award, BookOpen, Briefcase, CheckCircle2, ChevronLeft, ChevronRight, Clock,
    Download, Layers, Share2, ShieldCheck, Sparkles, UserCircle2,
} from "@/components/icons";
import NeuralBackground from "@/components/ui/NeuralBackground";
import PageTransition from "@/components/PageTransition";
import SkillsPassportSkeleton from "@/components/skeletons/SkillsPassportSkeleton";
import { assessmentApi } from "@/services/assessmentApi";
import { API_BASE_URL, courseEnrollmentAPI, coursesAPI, getBackendUrl } from "@/services/api";
import { userCertificateApi } from "@/services/userCertificateApi";
import { toast as sonnerToast } from "sonner";
import blueLogo from "@/assets/blue.png";
import spImage from "@/assets/sp.jpeg";

const PROFESSIONAL_STANDARDS = [
    "UNDERSTAND",
    "STRUCTURE",
    "VERIFY",
    "ADAPT",
    "COMMUNICATE",
    "CONNECT",
    "OWN",
    "CREATE",
    "LEAD",
    "GROW"
];

const STANDARD_SCORE_MAP = {
    UNDERSTAND: "CRQ",
    STRUCTURE: "PEQ",
    VERIFY: "DAQ",
    ADAPT: "LQ",
    COMMUNICATE: "SIQ",
    CONNECT: "SIQ",
    OWN: "SRQ",
    CREATE: "CRQ",
    LEAD: "PEQ",
    GROW: "LQ"
};

const AI_KEYWORDS = [
    "ai",
    "artificial intelligence",
    "machine learning",
    "ml",
    "llm",
    "gpt",
    "prompt",
    "genai",
    "generative",
    "automation",
    "chatbot",
    "nlp"
];

const SOFT_KEYWORDS = [
    "communication",
    "leadership",
    "critical thinking",
    "teamwork",
    "collaboration",
    "problem solving",
    "adaptability",
    "presentation",
    "ownership",
    "strategy",
    "creativity",
    "negotiation",
    "mentoring"
];

const TECH_KEYWORDS = [
    "python",
    "sql",
    "excel",
    "data",
    "analytics",
    "react",
    "java",
    "javascript",
    "node",
    "cloud",
    "devops",
    "web",
    "frontend",
    "backend",
    "api",
    "database",
    "programming",
    "software",
    "coding",
    "visualization",
    "tableau",
    "power bi",
    "engineering",
    "iot",
    "cyber"
];

const PAGE_DIMENSIONS_STANDARD = {
    width: "210mm",
    minHeight: "297mm"
};

const documentFont = {
    fontFamily: '"Aptos", "Segoe UI", "Trebuchet MS", sans-serif'
};

const normalizeList = (value) => {
    if (Array.isArray(value)) {
        return value.flatMap((item) => normalizeList(item));
    }

    if (typeof value === "string") {
        return value
            .split(/,|\/|\||;|\n/g)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    if (value && typeof value === "object") {
        return Object.values(value).flatMap((item) => normalizeList(item));
    }

    return [];
};

const sanitizeLabel = (value) =>
    String(value || "")
        .replace(/\s+/g, " ")
        .replace(/^[\s,.;:/\\-]+|[\s,.;:/\\-]+$/g, "")
        .trim();

const isMeaningfulLabel = (value) => {
    const label = sanitizeLabel(value);
    if (!label) return false;
    if (label.length < 2 || label.length > 52) return false;
    return !["n/a", "none", "other", "na", "nil"].includes(label.toLowerCase());
};

const resolveMediaUrl = (value, fallback = "") => {
    const raw = typeof value === "string" ? value.trim() : "";
    if (!raw) return fallback;

    const normalized = raw.replace(/\\/g, "/");
    if (
        normalized.startsWith("http://") ||
        normalized.startsWith("https://") ||
        normalized.startsWith("data:")
    ) {
        return normalized;
    }

    const cleaned = normalized.startsWith("/") ? normalized.slice(1) : normalized;
    return `${getBackendUrl()}/${cleaned}`;
};

const formatDateLabel = (value) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
};

const getScoreMap = (profile) => {
    if (!profile) {
        return {
            CRQ: 0,
            SRQ: 0,
            LQ: 0,
            SIQ: 0,
            PEQ: 0,
            DAQ: 0,
            SEQ: 0
        };
    }

    const readScore = (key) =>
        Number(
            profile?.[key]?.rawScore ??
            profile?.[key]?.percentage ??
            profile?.[key]?.score ??
            0
        );

    return {
        CRQ: readScore("CRQ"),
        SRQ: readScore("SRQ"),
        LQ: readScore("LQ"),
        SIQ: readScore("SIQ"),
        PEQ: readScore("PEQ"),
        DAQ: readScore("DAQ"),
        SEQ: readScore("SEQ")
    };
};

const toFiveScale = (score) => {
    const bounded = Number.isFinite(score) ? Math.max(0, Math.min(100, score)) : 0;
    return Math.max(1, Math.min(5, Number((bounded / 20).toFixed(1))));
};

const average = (values) => {
    const numeric = values.filter((value) => Number.isFinite(value));
    if (!numeric.length) return 0;
    return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
};

const classifySkill = (label, sourceBucket = "") => {
    const normalized = sanitizeLabel(label).toLowerCase();
    if (!normalized) return "domain";

    if (sourceBucket) {
        return sourceBucket;
    }

    if (AI_KEYWORDS.some((keyword) => normalized.includes(keyword))) return "ai";
    if (SOFT_KEYWORDS.some((keyword) => normalized.includes(keyword))) return "soft";
    if (TECH_KEYWORDS.some((keyword) => normalized.includes(keyword))) return "technical";
    return "domain";
};

const deriveDifficulty = (enrollment, courseData) => {
    const explicit = sanitizeLabel(
        enrollment?.level ||
        courseData?.level ||
        courseData?.difficulty
    ).toUpperCase();

    if (["ADVANCED", "INTERMEDIATE", "BEGINNER"].includes(explicit)) {
        return explicit;
    }

    const progress = Number(
        enrollment?.progress ??
        enrollment?.completionPercentage ??
        enrollment?.progressPercentage ??
        0
    );

    if (progress >= 80) return "ADVANCED";
    if (progress >= 45) return "INTERMEDIATE";
    return "BEGINNER";
};

const buildPassportId = (registrationProfile, currentUser) => {
    const directId = sanitizeLabel(
        registrationProfile?.passportId ||
        registrationProfile?.studentId ||
        currentUser?.studentId
    );

    if (directId) return directId.startsWith("SM-") ? directId : `SM-${directId}`;

    const raw = String(currentUser?._id || currentUser?.id || "000000")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(-6)
        .toUpperCase();

    return `SM-${raw.padStart(6, "0")}`;
};

const extractYear = (...values) => {
    const firstValid = values.find((value) => {
        const raw = String(value || "").trim();
        return /\b(19|20)\d{2}\b/.test(raw);
    });

    if (!firstValid) return String(new Date().getFullYear());
    const match = String(firstValid).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : String(new Date().getFullYear());
};

const createSkillBuckets = () => ({
    technical: new Map(),
    ai: new Map(),
    domain: new Map(),
    soft: new Map()
});

const collectEntryLabels = (items, fields = []) => {
    if (typeof items === "string") {
        return normalizeList(items);
    }

    if (!Array.isArray(items)) return [];

    return items.flatMap((item) => {
        if (typeof item === "string") {
            return [item];
        }

        if (!item || typeof item !== "object") {
            return [];
        }

        return fields.flatMap((field) => normalizeList(item?.[field]));
    });
};

const pushSkill = (buckets, label, options = {}) => {
    if (!isMeaningfulLabel(label)) return;

    const cleaned = sanitizeLabel(label);
    const bucket = classifySkill(cleaned, options.bucket);
    const key = cleaned.toLowerCase();
    const target = buckets[bucket];

    if (!target) return;

    const existing = target.get(key);
    if (!existing) {
        target.set(key, {
            label: cleaned,
            source: options.source || "Backend sync",
            verified: options.verified !== false
        });
        return;
    }

    target.set(key, {
        ...existing,
        source: existing.source || options.source || "Backend sync",
        verified: existing.verified || options.verified !== false
    });
};

const PassportHeader = ({ sectionName, count }) => {
    const subtitle = sectionName
        ? (count !== undefined ? `${sectionName} • ${count} ${count === 1 ? "RECORD" : "RECORDS"}` : sectionName)
        : "CAPABILITY & SKILLS RECORD";

    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
                <div>
                    <h2 className="text-[20px] font-black text-[#072036] tracking-tight leading-none" style={{ color: "#072036" }}>
                        SMAART Passport
                    </h2>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">
                        {subtitle}
                    </p>
                </div>
            </div>

            {/* Verified Badge */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#EAF7FD] text-[9px] font-black text-[#045C9A] uppercase tracking-widest shrink-0 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-[#045C9A]" />
                <span>VERIFIED</span>
            </div>
        </div>
    );
};
const PassportProfile = ({ fullName, passportId, profilePhoto }) => {
    return (
        <div className="flex items-center gap-5">
            {/* Avatar Box */}
            <div className="w-32 h-32 rounded-[22px] bg-[#f0f2f5] border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                {profilePhoto ? (
                    <img src={profilePhoto} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                    <UserCircle2 className="w-10 h-10 text-slate-300" />
                )}
            </div>

            {/* Profile Info styled as the skeleton-like rounded pills */}
            <div className="flex-1 min-w-0 flex flex-col items-start gap-2.5">
                <div className="flex items-center px-5 py-2 w-fit max-w-full">
                    <h1 className="text-[18px] font-black text-[#072036] tracking-tight leading-none" style={{ color: "#072036" }}>
                        {fullName}
                    </h1>
                </div>
                <div className="flex items-center px-4 py-1.5 w-fit max-w-full">
                    <p className="text-[13px] font-black uppercase tracking-wider text-slate-400 leading-none">
                        {passportId}
                    </p>
                </div>
            </div>
        </div>
    );
};

const PassportRow = ({ label, badgeText }) => {
    return (
        <div className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.01)] hover:border-slate-200/80 transition-all">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Circular Check Outline Icon */}
                <div className="w-8 h-8 rounded-full border border-[#045C9A]/20 bg-[#EAF7FD] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#045C9A]" />
                </div>

                {/* Label pill in center */}
                <div className="h-8 flex items-center px-4 w-fit max-w-full">
                    <span className="text-[12px] font-bold text-[#072036] truncate leading-none">
                        {label}
                    </span>
                </div>
            </div>

            {/* Badge pill on right */}
            {badgeText && (
                <div className="h-7 flex items-center px-4 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">
                        {badgeText}
                    </span>
                </div>
            )}
        </div>
    );
};

const PassportFooter = ({ passportId }) => {
    const qrUrl = typeof window !== "undefined"
        ? `${window.location.origin}/verify-passport/${passportId}`
        : `https://smaart.institute/verify-passport/${passportId}`;

    return (
        <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
                {/* Bottom Left: Real QR code */}
                <div className="flex items-center gap-3">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200/80 p-2 flex items-center justify-center shadow-sm shrink-0">
                        <QRCodeSVG
                            value={qrUrl}
                            size={64}
                            level="H"
                            includeMargin={false}
                        />
                    </div>
                </div>

                {/* Bottom Right: Issued By SMAART Institute */}
                <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-slate-400 block">
                        ISSUED BY
                    </span>
                    <span className="text-[14px] font-black text-slate-500 tracking-tight leading-none mt-1.5 block">
                        SMAART Institute
                    </span>
                </div>
            </div>
        </div>
    );
};

/* The sheet is a printable, always-white document. index.css paints every
   h1-h6 white under .dark, and that class rule outranks the headings' own
   colour utilities, so the sheet's headings carry inline colours instead. */
const PassportPage = ({
    pageNumber,
    passportId,
    sectionName,
    count,
    children,
    pageRef
}) => (
    <section
        ref={pageRef}
        className="relative w-full overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white px-8 py-8 text-slate-900 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05),_0_4px_18px_-8px_rgba(0,0,0,0.02)] flex flex-col justify-between"
        style={{
            width: "100%",
            maxWidth: PAGE_DIMENSIONS_STANDARD.width,
            minHeight: PAGE_DIMENSIONS_STANDARD.minHeight,
            ...documentFont
        }}
    >
        {/* Decorative background grids/patterns */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: "radial-gradient(#045C9A 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative z-10 flex flex-col flex-1 justify-between">
            {/* Header */}
            <PassportHeader sectionName={sectionName} count={count} />

            {/* Page Content */}
            <div className="flex-1 flex flex-col justify-start my-4">
                {children}
            </div>

            {/* Footer */}
            <PassportFooter passportId={passportId} />
        </div>
    </section>
);

const EmptySkillState = ({ title }) => (
    <div className="rounded-[22px] border border-dashed border-slate-200 bg-white/75 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-[#045C9A]">{title}</p>
        <p className="mt-2 text-sm text-slate-500">No synced records are available for this category yet.</p>
    </div>
);

const InlinePager = ({ activePage, totalPages, onPrevious, onNext, pageLabel }) => (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#d7ebf5] bg-[#F1F5F9] p-1 dark:border-white/10 dark:bg-[#072036]/60">
        <button type="button" id="passport-prev" onClick={onPrevious} disabled={activePage === 1} aria-label="Previous page"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#072036] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-white dark:hover:bg-white/10">
            <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-[64px] text-center text-xs font-bold tabular-nums text-[#072036] dark:text-white" aria-live="polite">{pageLabel}</span>
        <button type="button" id="passport-next" onClick={onNext} disabled={activePage === totalPages} aria-label="Next page"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#072036] transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:text-white dark:hover:bg-white/10">
            <ChevronRight className="h-4 w-4" />
        </button>
    </div>
);

const ActionButton = ({ icon: Icon, label, onClick, disabled = false, primary = false, id }) => (
    <button type="button" id={id} onClick={onClick} disabled={disabled}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${primary
            ? "bg-[#072036] text-white shadow-md shadow-[#072036]/20 hover:bg-[#0d3a5f] dark:bg-[#A6D7E8] dark:text-[#072036] dark:shadow-none dark:hover:bg-white"
            : "border border-[#d7ebf5] bg-white text-[#034a7d] hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] dark:border-white/10 dark:bg-white/5 dark:text-[#A6D7E8] dark:hover:bg-white/10"}`}>
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

const getExpDateString = (exp) => {
    if (!exp) return "Date Range";
    if (exp.duration) return exp.duration;
    const start = exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "";
    const end = exp.currentlyWorking ? "Present" : (exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "");
    if (start && end) return `${start} - ${end}`;
    if (start) return `${start} - Present`;
    return "Date Range";
};

const ElaboratedExperienceCard = ({ exp }) => {
    return (
        <div className="p-5 bg-[#f8f9fc] hover:bg-[#f1f3f9] rounded-2xl border border-slate-100/80 transition-all space-y-2">
            <div className="text-[14px] font-extrabold text-[#072036] flex items-center gap-1.5 flex-wrap leading-none">
                <span>{exp.companyName || exp.organizationName || exp.organization || "Organization"}</span>
                {exp.location && (
                    <>
                        <span className="text-slate-300 font-normal">|</span>
                        <span className="text-slate-400 font-medium text-[12.5px]">{exp.location}</span>
                    </>
                )}
            </div>

            <div className="text-[13px] font-bold text-[#045C9A] leading-none pt-0.5">
                {exp.role || exp.jobTitle || exp.title || "Professional Role"}
            </div>

            <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 font-semibold leading-none pt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{getExpDateString(exp)}</span>
            </div>

            <p className="text-[12px] text-slate-600 leading-relaxed font-medium pt-1">
                {exp.description || "Verified employment tenure, key contributions, and team deliverables under this professional capacity."}
            </p>
        </div>
    );
};

const ElaboratedCertificateCard = ({ cert }) => {
    const certUrl = cert.certificateFile || cert.link;
    const resolvedUrl = certUrl ? (certUrl.includes("cloudinary.com") && certUrl.includes("/upload/fl_attachment/") ? certUrl.replace("/upload/fl_attachment/", "/upload/") : certUrl) : null;

    return (
        <div className="p-5 bg-[#f8f9fc] hover:bg-[#f1f3f9] rounded-2xl border border-slate-100/80 transition-all space-y-2">
            <div className="text-[14px] font-extrabold text-[#072036] leading-none">
                {cert.title || "Certification"}
            </div>

            <div className="text-[12.5px] font-semibold text-slate-400 leading-none pt-0.5">
                {cert.issuer || cert.issuingOrg || "Issuing Body"}
            </div>

            <div className="pt-1">
                {resolvedUrl ? (
                    <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#045C9A] font-extrabold hover:underline inline-flex items-center"
                    >
                        View Certificate
                    </a>
                ) : (
                    <span className="text-[12px] text-[#045C9A] font-extrabold cursor-pointer hover:underline">
                        View Certificate
                    </span>
                )}
            </div>
        </div>
    );
};

const ElaboratedProjectCard = ({ project }) => {
    const projectUrl = project.link || project.projectLink;
    return (
        <div className="p-5 bg-[#f8f9fc] hover:bg-[#f1f3f9] rounded-2xl border border-slate-100/80 transition-all space-y-2">
            <div className="text-[14px] font-extrabold text-[#072036] leading-none">
                {project.title || "Capstone Project"}
            </div>

            <div className="pt-0.5">
                {projectUrl ? (
                    <a
                        href={projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#045C9A] font-bold hover:underline inline-flex items-center"
                    >
                        View Project +
                    </a>
                ) : (
                    <span className="text-[12px] text-[#045C9A] font-bold cursor-pointer hover:underline">
                        View Project +
                    </span>
                )}
            </div>

            <p className="text-[12px] text-slate-600 leading-relaxed font-medium pt-0.5">
                {project.description || "An advanced capstone assignment completed under academic supervision, verifying direct hands-on application of technical concepts."}
            </p>
        </div>
    );
};

const SkillsPassport = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const activePageRef = useRef(null);
    const TOTAL_PAGES = 6;

    const [currentUser, setCurrentUser] = useState(null);
    const [registrationProfile, setRegistrationProfile] = useState(null);
    const [baselineResult, setBaselineResult] = useState(null);
    const [stageResults, setStageResults] = useState({});
    const [stageMeta, setStageMeta] = useState({});
    const [courseEnrollments, setCourseEnrollments] = useState([]);
    const [externalCertificates, setExternalCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isExporting, setIsExporting] = useState(false);
    const [activePage, setActivePage] = useState(1);

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
        const rawUser = sessionStorage.getItem("user");
        if (!rawUser) {
            setIsLoading(false);
            return;
        }

        try {
            setCurrentUser(JSON.parse(rawUser));
        } catch (error) {
            console.error("Unable to parse current user from session storage:", error);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const fetchPassportData = async () => {
            setIsLoading(true);

            try {
                const userId = currentUser?._id || currentUser?.id;
                const email = currentUser?.email;
                const token = sessionStorage.getItem("token") || localStorage.getItem("token");

                const requests = [
                    userId ? assessmentApi.getBaseLineResults(userId) : Promise.resolve(null),
                    userId ? assessmentApi.getStageResults(userId) : Promise.resolve(null),
                    userId ? courseEnrollmentAPI.getByStudent(userId) : Promise.resolve(null),
                    userCertificateApi.getAll().catch(() => null),
                    email
                        ? fetch(`${API_BASE_URL}/users/register-details/${encodeURIComponent(email)}`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                        })
                        : Promise.resolve(null)
                ];

                const [baselineRes, stageRes, enrollmentRes, userCertificatesRes, registrationRes] = await Promise.allSettled(requests);

                if (baselineRes.status === "fulfilled" && baselineRes.value?.success) {
                    setBaselineResult(baselineRes.value.data || null);
                }

                if (stageRes.status === "fulfilled" && stageRes.value?.success) {
                    setStageResults(stageRes.value.data || {});
                    setStageMeta(stageRes.value.meta || {});
                }

                if (enrollmentRes.status === "fulfilled" && enrollmentRes.value) {
                    const rawEnrollments = Array.isArray(enrollmentRes.value)
                        ? enrollmentRes.value
                        : Array.isArray(enrollmentRes.value?.data)
                            ? enrollmentRes.value.data
                            : [];

                    const enrichedEnrollments = await Promise.all(
                        rawEnrollments.map(async (enrollment) => {
                            const populatedCourse = enrollment?.course;
                            const needsEnrichment =
                                typeof populatedCourse === "string" ||
                                !populatedCourse?.tags ||
                                !populatedCourse?.banner;

                            if (!needsEnrichment) {
                                return { ...enrollment, courseDetails: populatedCourse };
                            }

                            const courseId =
                                typeof populatedCourse === "string"
                                    ? populatedCourse
                                    : populatedCourse?._id || enrollment?.course?._id;

                            if (!courseId) return enrollment;

                            try {
                                const courseResponse = await coursesAPI.getById(courseId);
                                const courseDetails = courseResponse?.data || courseResponse || null;
                                return { ...enrollment, courseDetails };
                            } catch (error) {
                                console.error("Failed to enrich course enrollment:", error);
                                return enrollment;
                            }
                        })
                    );

                    setCourseEnrollments(enrichedEnrollments);
                }

                if (userCertificatesRes.status === "fulfilled") {
                    const certificateData = Array.isArray(userCertificatesRes.value?.data)
                        ? userCertificatesRes.value.data
                        : [];
                    setExternalCertificates(certificateData);
                }

                if (registrationRes.status === "fulfilled" && registrationRes.value?.ok) {
                    const registrationData = await registrationRes.value.json();
                    setRegistrationProfile(registrationData || null);
                }
            } catch (error) {
                console.error("Skills Passport fetch failed:", error);
                sonnerToast.error("Unable to load the skills passport right now.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPassportData();
    }, [currentUser]);

    const passportData = useMemo(() => {
        const fallbackName = currentUser?.fullName || "SMAART Student";
        const fallbackEmail = currentUser?.email || "student@smaart.in";
        const fallbackPhone = currentUser?.mobile || currentUser?.mobileNumber || "+91 00000 00000";

        const activeStageProfile =
            stageResults?.T4?.quotientProfile ||
            stageResults?.T4?.t1Profile ||
            baselineResult?.quotientProfile ||
            baselineResult?.t1Profile ||
            null;

        const scores = getScoreMap(activeStageProfile);
        const standardRatings = PROFESSIONAL_STANDARDS.map((title) => {
            const mappedScore = scores[STANDARD_SCORE_MAP[title]] ?? baselineResult?.baselineScore ?? 0;
            return {
                title,
                rating: toFiveScale(mappedScore),
                rawScore: mappedScore
            };
        });

        const avgRating = Number(average(standardRatings.map((item) => item.rating)).toFixed(1)) || 0;

        const fullName = registrationProfile?.fullName || fallbackName;
        const degree =
            registrationProfile?.higherEducation?.[0]?.degreeFullName ||
            registrationProfile?.higherEducation?.[0]?.degree ||
            registrationProfile?.department ||
            registrationProfile?.educationLevel ||
            "Professional Learning Track";
        const institution =
            registrationProfile?.college?.collegeName ||
            registrationProfile?.institution ||
            registrationProfile?.higherEducation?.[0]?.institutionName ||
            "SMAART Institute";
        const email = registrationProfile?.email || fallbackEmail;
        const phone = registrationProfile?.mobileNumber || fallbackPhone;
        const passportId = buildPassportId(registrationProfile, currentUser);
        const cohort = extractYear(
            registrationProfile?.yearOfPassing,
            registrationProfile?.higherEducation?.[0]?.yearOfPassing,
            currentUser?.createdAt,
            registrationProfile?.createdAt
        );
        const profilePhoto = resolveMediaUrl(
            registrationProfile?.profilePhoto ||
            currentUser?.profilePhoto ||
            currentUser?.profileImage ||
            currentUser?.profilePicture,
            spImage
        );

        const credentials = courseEnrollments
            .map((enrollment, index) => {
                const courseData = enrollment?.courseDetails || enrollment?.course || {};
                const title = sanitizeLabel(courseData?.title || enrollment?.courseName || `SMAART Course ${index + 1}`);
                const progress = Number(
                    enrollment?.progress ??
                    enrollment?.completionPercentage ??
                    enrollment?.progressPercentage ??
                    0
                );

                const tags = [
                    ...normalizeList(courseData?.tags),
                    ...normalizeList(courseData?.acquiredSkills),
                    ...normalizeList(courseData?.skills),
                    ...normalizeList(courseData?.modules?.map((module) => module?.title))
                ].filter(isMeaningfulLabel);

                const difficulty = deriveDifficulty(enrollment, courseData);
                const isVerified = Boolean(enrollment?.certificateIssued) || enrollment?.status === "completed";
                const issueLabel = formatDateLabel(
                    enrollment?.certificateIssuedDate ||
                    enrollment?.completionDate ||
                    enrollment?.updatedAt
                );

                return {
                    id: enrollment?._id || courseData?._id || `credential-${index}`,
                    title,
                    subtitle: `${institution} | ${sanitizeLabel(courseData?.courseCode || courseData?.category || "Verified Credential")}`,
                    difficulty,
                    liveStatus: isVerified ? "Live verified" : "Realtime sync",
                    meta: issueLabel ? `Issued ${issueLabel}` : `${Math.max(0, Math.round(progress))}% progress`,
                    verified: isVerified,
                    tags,
                    icon: resolveMediaUrl(courseData?.banner, "")
                };
            })
            .sort((a, b) => Number(b.verified) - Number(a.verified));

        const buckets = createSkillBuckets();

        const addMany = (labels, options = {}) => {
            labels.forEach((label) => pushSkill(buckets, label, options));
        };

        addMany(
            collectEntryLabels(registrationProfile?.skills, ["skillName", "name", "title", "tool"]),
            { bucket: "technical", source: "Profile", verified: true }
        );
        addMany(
            collectEntryLabels(registrationProfile?.aiSkills, ["title", "aiTool", "name", "tool", "skills", "workflows", "useCases"]),
            { bucket: "ai", source: "Profile", verified: true }
        );
        addMany(
            collectEntryLabels(registrationProfile?.domainSkills, ["domainName", "name", "expertise", "focusAreas"]),
            { bucket: "domain", source: "Profile", verified: true }
        );

        credentials.forEach((credential) => {
            addMany(credential.tags, {
                source: "Course",
                verified: credential.verified
            });

            pushSkill(buckets, credential.title, {
                bucket: classifySkill(credential.title),
                source: "Credential",
                verified: credential.verified
            });
        });

        addMany(
            (registrationProfile?.projects || []).flatMap((project) => [
                project?.title,
                project?.qualificationLevel,
                project?.teamType
            ]),
            { source: "Project", verified: true }
        );

        addMany(
            (registrationProfile?.workExperience || []).flatMap((work) => [
                work?.jobTitle,
                work?.role,
                work?.industry
            ]),
            { source: "Experience", verified: true }
        );

        addMany(
            (registrationProfile?.certificates || []).flatMap((certificate) => [
                certificate?.title,
                certificate?.issuingOrg
            ]),
            { source: "Registration", verified: true }
        );

        externalCertificates.forEach((certificate) => {
            pushSkill(buckets, certificate?.title, {
                bucket: classifySkill(certificate?.title, classifySkill(certificate?.category)),
                source: "Certificate",
                verified: true
            });

            pushSkill(buckets, certificate?.category, {
                bucket: classifySkill(certificate?.category),
                source: "Certificate",
                verified: true
            });
        });

        addMany(
            [
                registrationProfile?.department,
                registrationProfile?.educationLevel,
                registrationProfile?.higherEducation?.[0]?.specialization,
                registrationProfile?.higherEducation?.[0]?.degreeFullName,
                registrationProfile?.higherEducation?.[0]?.degree
            ],
            { bucket: "domain", source: "Academic", verified: true }
        );

        addMany(
            [
                ...(registrationProfile?.jobPreferences || []).map((job) => job?.preferredRole),
                ...(registrationProfile?.sectorPreferences?.preferredSectors || []).map((s) => typeof s === 'string' ? s : s?.name || s?.label || s?.title || s?.sector || ""),
                ...(registrationProfile?.sectorPreferences?.secondarySectors || []).map((s) => typeof s === 'string' ? s : s?.name || s?.label || s?.title || s?.sector || "")
            ].filter(Boolean),
            { bucket: "domain", source: "Career", verified: true }
        );

        return {
            fullName,
            degree,
            institution,
            email,
            phone,
            passportId,
            cohort,
            avgRating,
            standardRatings,
            credentials,
            technicalSkills: Array.from(buckets.technical.values()).sort((a, b) => a.label.localeCompare(b.label)),
            aiSkills: Array.from(buckets.ai.values()).sort((a, b) => a.label.localeCompare(b.label)),
            domainSkills: Array.from(buckets.domain.values()).sort((a, b) => a.label.localeCompare(b.label)),
            experiences: registrationProfile?.workExperience || [],
            projects: registrationProfile?.projects || [],
            certificates: [
                ...(registrationProfile?.certificates || []),
                ...(externalCertificates || [])
            ],
            profilePhoto,
            verificationDate: formatDateLabel(
                stageResults?.T4?.updatedAt ||
                baselineResult?.updatedAt ||
                registrationProfile?.updatedAt ||
                new Date()
            ),
            shareUrl: typeof window !== "undefined" ? window.location.href : ""
        };
    }, [baselineResult, courseEnrollments, currentUser, externalCertificates, registrationProfile, stageResults]);

    // Save passport data to localStorage for demo verification purposes
    useEffect(() => {
        if (passportData && passportData.passportId) {
            try {
                localStorage.setItem(`passport_demo_${passportData.passportId}`, JSON.stringify({
                    fullName: passportData.fullName,
                    profilePhoto: passportData.profilePhoto,
                    institution: passportData.institution
                }));
            } catch (e) {
                console.error("Failed to save passport to localStorage", e);
            }
        }
    }, [passportData]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(passportData.shareUrl);
            sonnerToast.success("Passport link copied.");
        } catch (error) {
            console.error("Copy failed:", error);
            sonnerToast.error("Unable to copy the passport link.");
        }
    };

    const handleExport = async () => {
        if (!activePageRef.current) return;

        setIsExporting(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });

            const previousPage = activePage;

            for (let pageNumber = 1; pageNumber <= TOTAL_PAGES; pageNumber += 1) {
                setActivePage(pageNumber);
                await new Promise((resolve) => window.setTimeout(resolve, 120));
                const page = activePageRef.current;
                if (!page) continue;

                const canvas = await html2canvas(page, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: "#eef3fb",
                    width: page.scrollWidth,
                    height: page.scrollHeight,
                    windowWidth: page.scrollWidth,
                    windowHeight: page.scrollHeight
                });

                const imgData = canvas.toDataURL("image/png");
                if (pageNumber > 1) pdf.addPage();
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                const yOffset = imgHeight < 297 ? (297 - imgHeight) / 2 : 0;
                pdf.addImage(imgData, "PNG", 0, yOffset, imgWidth, imgHeight, undefined, "FAST");
            }

            setActivePage(previousPage);

            pdf.save(`SMAART_Skills_Passport_${passportData.fullName.replace(/\s+/g, "_")}.pdf`);
            sonnerToast.success("Passport exported successfully.");
        } catch (error) {
            console.error("Passport export failed:", error);
            sonnerToast.error("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading) {
        return (
            <PageTransition>
                <div className="mx-auto max-w-7xl p-4 sm:p-5 lg:p-6"><SkillsPassportSkeleton /></div>
            </PageTransition>
        );
    }

    // Learning Velocity summary (Blueprint v1.0 PLVI + Total Growth Δ).
    const latestVelocityStage = ["T4", "T3", "T2"].find((k) => stageResults?.[k]?.plviBand);
    const velocity = {
        band: stageMeta?.finalPlviBand || stageResults?.[latestVelocityStage]?.plviBand || null,
        delta: (stageMeta?.totalGrowthDelta ?? stageResults?.[latestVelocityStage]?.growthDelta) ?? null,
        isFinal: !!stageResults?.T4?.plviBand,
        stage: latestVelocityStage || null,
        tDays: stageResults?.[latestVelocityStage]?.tDays ?? null,
        basis: stageResults?.[latestVelocityStage]?.tDaysBasis ?? null,
    };
    const hasVelocity = velocity.band != null || velocity.delta != null;

    const sections = [
        { page: 1, icon: UserCircle2, label: t("skills_passport_page.section_cover", "Cover"), count: null },
        { page: 2, icon: Briefcase, label: t("skills_passport_page.section_experience", "Experience"), count: passportData.experiences.length },
        { page: 3, icon: BookOpen, label: t("skills_passport_page.section_courses", "Courses"), count: passportData.credentials.length },
        { page: 4, icon: Award, label: t("skills_passport_page.section_certificates", "Certificates"), count: passportData.certificates.length },
        { page: 5, icon: Layers, label: t("skills_passport_page.section_projects", "Projects"), count: passportData.projects.length },
        { page: 6, icon: Sparkles, label: t("skills_passport_page.section_skills", "Skills"), count: passportData.technicalSkills.length + passportData.aiSkills.length + passportData.domainSkills.length }
    ];
    const activeSection = sections.find((sec) => sec.page === activePage) || sections[0];
    const goPrev = () => setActivePage((page) => Math.max(1, page - 1));
    const goNext = () => setActivePage((page) => Math.min(TOTAL_PAGES, page + 1));

    return (
        <PageTransition>
            <div className="relative min-h-screen overflow-hidden bg-transparent pb-8 transition-colors duration-300">
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
                    <NeuralBackground theme={isDarkTheme ? "dark" : "light"} />
                </div>
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
                    <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
                </div>

                <main className="relative z-10">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">
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

                        {/* Hero -- same structure as Skills Vault / Settings / Help */}
                        <motion.section initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]">
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />
                            <div className="relative z-10 flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
                                <div className="flex items-center gap-4">
                                    <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8] sm:flex">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl" style={{ letterSpacing: "-0.02em" }}>
                                            {t("skills_passport_page.title", "Skills Passport")}
                                        </h1>
                                        <p className="mt-0.5 max-w-2xl text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                                            {t("skills_passport_page.subtitle", "Your verified academic and professional record, synced from live SMAART data and shareable with employers.")}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <ActionButton id="passport-copy" icon={Share2} label={t("skills_passport_page.copy_link", "Copy Link")} onClick={handleCopyLink} />
                                    <ActionButton id="passport-export" icon={Download} label={isExporting ? t("skills_passport_page.exporting", "Exporting...") : t("skills_passport_page.export_pdf", "Export PDF")} onClick={handleExport} disabled={isExporting} primary />
                                </div>
                            </div>
                        </motion.section>

                        {/* Viewer: document page */}
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: 0.05 }}
                            className="grid grid-cols-1 gap-4 sm:gap-6">
                            <section className="flex flex-col rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]">
                                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d7ebf5] px-5 py-4 dark:border-white/10 sm:px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#045C9A]/10 text-[#045C9A] dark:bg-[#045C9A]/30 dark:text-[#A6D7E8]">
                                            <activeSection.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h2 className="text-base font-extrabold leading-tight text-[#072036] dark:text-white">{activeSection.label}</h2>
                                            <p className="text-xs text-[#35566b] dark:text-slate-400">
                                                {t("skills_passport_page.page_of", { page: activePage, total: TOTAL_PAGES, defaultValue: `Page ${activePage} of ${TOTAL_PAGES}` })}
                                                {activeSection.count != null ? ` · ${activeSection.count} ${t("skills_passport_page.records", "records")}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <InlinePager activePage={activePage} totalPages={TOTAL_PAGES} onPrevious={goPrev} onNext={goNext} pageLabel={`${activePage} / ${TOTAL_PAGES}`} />
                                </header>

                                {/* The A4 document sits on a muted desk. It scrolls sideways on narrow screens instead of shrinking, so the PDF capture stays 1:1. */}
                                <div id="passport-desk" className="overflow-x-auto rounded-b-2xl bg-[#F1F5F9] px-4 py-5 dark:bg-[#072036]/60 sm:px-6 sm:py-6">
                                    <div className="mx-auto w-full max-w-[210mm]" style={documentFont}>
                                    {activePage === 1 && (
                                        <PassportPage
                                            pageNumber={1}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="CAPABILITY & SKILLS RECORD"
                                        >
                                            {/* Profile Cover Section */}
                                            <PassportProfile
                                                fullName={passportData.fullName}
                                                passportId={passportData.passportId}
                                                profilePhoto={passportData.profilePhoto}
                                            />
                                        
                                            {/* Section Indexes / Table of Contents */}
                                            <div className="space-y-3 mt-6">
                                                <PassportRow
                                                    label="Experience"
                                                    badgeText={`${passportData.experiences.length} ${passportData.experiences.length === 1 ? 'Record' : 'Records'}`}
                                                />
                                                <PassportRow
                                                    label="Courses"
                                                    badgeText={`${passportData.credentials.length} ${passportData.credentials.length === 1 ? 'Course' : 'Courses'}`}
                                                />
                                                <PassportRow
                                                    label="Certificates"
                                                    badgeText={`${passportData.certificates.length} ${passportData.certificates.length === 1 ? 'Certificate' : 'Certificates'}`}
                                                />
                                                <PassportRow
                                                    label="Projects"
                                                    badgeText={`${passportData.projects.length} ${passportData.projects.length === 1 ? 'Project' : 'Projects'}`}
                                                />
                                                <PassportRow
                                                    label="Skills"
                                                    badgeText={`${passportData.technicalSkills.length + passportData.aiSkills.length + passportData.domainSkills.length} Verified`}
                                                />
                                            </div>
                                        
                                            {/* Learning Velocity — PLVI + Total Growth Δ (T1 → latest stage) */}
                                            {hasVelocity ? (
                                                <div className="mt-6 rounded-2xl border border-[#d7ebf5] bg-[#F1F5F9] p-4">
                                                    <div className="mb-3 flex items-center justify-between">
                                                        <h4 className="text-[0.8rem] font-[800] uppercase tracking-[0.12em] text-[#072036]" style={{ color: "#072036" }}>
                                                            Learning Velocity
                                                        </h4>
                                                        <span className="rounded-md border border-[#045C9A]/20 bg-[#EAF7FD] px-2 py-0.5 text-[0.6rem] font-[800] uppercase tracking-wider text-[#045C9A]">
                                                            {velocity.isFinal ? "Final" : (velocity.stage || "Current")}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="rounded-xl border border-[#d7ebf5] bg-white px-3 py-2.5">
                                                            <p className="text-[0.6rem] font-[700] uppercase tracking-wider text-slate-400">Total Growth</p>
                                                            <p className="text-[1.15rem] font-[800] text-[#072036]">
                                                                {velocity.delta == null ? "—" : `${velocity.delta >= 0 ? "+" : ""}${velocity.delta} pts`}
                                                            </p>
                                                            <p className="text-[0.6rem] font-[500] text-slate-400">since baseline (T1)</p>
                                                        </div>
                                                        <div className="rounded-xl border border-[#d7ebf5] bg-white px-3 py-2.5">
                                                            <p className="text-[0.6rem] font-[700] uppercase tracking-wider text-slate-400">Velocity Band</p>
                                                            <p className="text-[1.15rem] font-[800] text-[#045C9A]">{velocity.band || "—"}</p>
                                                            <p className="text-[0.6rem] font-[500] text-slate-400">
                                                                {velocity.tDays ? `over ${velocity.tDays} ${velocity.basis === "active" ? "active learning days" : "days"}` : "rate of growth"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </PassportPage>
                                    )}
                                    {activePage === 2 && (
                                        <PassportPage
                                            pageNumber={2}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="EXPERIENCE"
                                            count={passportData.experiences.length}
                                        >
                                            {/* Professional Experience */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400" style={{ color: "#94a3b8" }}>
                                                        Professional Experience
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {passportData.experiences.length} total
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {passportData.experiences.slice(0, 4).map((exp, index) => (
                                                        <ElaboratedExperienceCard
                                                            key={exp._id || exp.id || index}
                                                            exp={exp}
                                                        />
                                                    ))}
                                                    {passportData.experiences.length === 0 && (
                                                        <EmptySkillState title="No professional experience records synced yet." />
                                                    )}
                                                </div>
                                            </div>
                                        </PassportPage>
                                    )}
                                    {activePage === 3 && (
                                        <PassportPage
                                            pageNumber={3}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="COURSES"
                                            count={passportData.credentials.length}
                                        >
                                            {/* Courses */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400" style={{ color: "#94a3b8" }}>
                                                        Academic & Professional Courses
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {passportData.credentials.length} total
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {passportData.credentials.slice(0, 4).map((credential) => (
                                                        <PassportRow
                                                            key={credential.id}
                                                            label={credential.title}
                                                            badgeText={credential.difficulty || "COMPLETED"}
                                                        />
                                                    ))}
                                                    {passportData.credentials.length === 0 && (
                                                        <EmptySkillState title="No courses synced yet." />
                                                    )}
                                                </div>
                                            </div>
                                        </PassportPage>
                                    )}
                                    {activePage === 4 && (
                                        <PassportPage
                                            pageNumber={4}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="CERTIFICATES"
                                            count={passportData.certificates.length}
                                        >
                                            {/* Certificates */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400" style={{ color: "#94a3b8" }}>
                                                        Verified Certifications
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {passportData.certificates.length} total
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {passportData.certificates.slice(0, 4).map((cert, index) => (
                                                        <ElaboratedCertificateCard
                                                            key={cert._id || cert.id || index}
                                                            cert={cert}
                                                        />
                                                    ))}
                                                    {passportData.certificates.length === 0 && (
                                                        <EmptySkillState title="No certifications synced yet." />
                                                    )}
                                                </div>
                                            </div>
                                        </PassportPage>
                                    )}
                                    {activePage === 5 && (
                                        <PassportPage
                                            pageNumber={5}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="PROJECTS"
                                            count={passportData.projects.length}
                                        >
                                            {/* Projects */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400" style={{ color: "#94a3b8" }}>
                                                        Featured Projects
                                                    </h3>
                                                    <span className="text-[10px] text-slate-400 font-bold">
                                                        {passportData.projects.length} total
                                                    </span>
                                                </div>
                                                <div className="space-y-3">
                                                    {passportData.projects.slice(0, 4).map((project, index) => (
                                                        <ElaboratedProjectCard
                                                            key={project._id || project.id || index}
                                                            project={project}
                                                        />
                                                    ))}
                                                    {passportData.projects.length === 0 && (
                                                        <EmptySkillState title="No projects synced yet." />
                                                    )}
                                                </div>
                                            </div>
                                        </PassportPage>
                                    )}
                                    {activePage === 6 && (
                                        <PassportPage
                                            pageNumber={6}
                                            passportId={passportData.passportId}
                                            pageRef={activePageRef}
                                            sectionName="SKILLS"
                                            count={passportData.technicalSkills.length + passportData.aiSkills.length + passportData.domainSkills.length}
                                        >
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2" style={{ color: "#94a3b8" }}>
                                                        Technical Skills
                                                    </h3>
                                                    <div className="space-y-2.5">
                                                        {passportData.technicalSkills.slice(0, 2).map((skill) => (
                                                            <PassportRow key={skill.label} label={skill.label} badgeText="TECHNICAL" />
                                                        ))}
                                                        {passportData.technicalSkills.length === 0 && (
                                                            <p className="text-[11px] text-slate-400 italic pl-1">No technical skills added</p>
                                                        )}
                                                    </div>
                                                </div>
                                        
                                                <div>
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2" style={{ color: "#94a3b8" }}>
                                                        AI Capabilities
                                                    </h3>
                                                    <div className="space-y-2.5">
                                                        {passportData.aiSkills.slice(0, 2).map((skill) => (
                                                            <PassportRow key={skill.label} label={skill.label} badgeText="AI & AUTOMATION" />
                                                        ))}
                                                        {passportData.aiSkills.length === 0 && (
                                                            <p className="text-[11px] text-slate-400 italic pl-1">No AI capabilities added</p>
                                                        )}
                                                    </div>
                                                </div>
                                        
                                                <div>
                                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2" style={{ color: "#94a3b8" }}>
                                                        Domain Expertise
                                                    </h3>
                                                    <div className="space-y-2.5">
                                                        {passportData.domainSkills.slice(0, 2).map((skill) => (
                                                            <PassportRow key={skill.label} label={skill.label} badgeText="DOMAIN SPECIALIST" />
                                                        ))}
                                                        {passportData.domainSkills.length === 0 && (
                                                            <p className="text-[11px] text-slate-400 italic pl-1">No domain specializations added</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </PassportPage>
                                    )}
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    </div>
                </main>
            </div>
        </PageTransition>
    );
};

export default SkillsPassport;
