import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
    ArrowLeft,
    Award,
    BookOpen,
    Briefcase,
    Building2,
    CheckCircle2,
    Download,
    GraduationCap,
    Mail,
    Monitor,
    Phone,
    Share2,
    ShieldCheck,
    Sparkles,
    Star,
    UserCircle2
} from "lucide-react";
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

const PAGE_DIMENSIONS = {
    width: "210mm",
    minHeight: "297mm"
};

const documentFont = {
    fontFamily: '"Aptos", "Segoe UI", "Trebuchet MS", sans-serif'
};

const displayFont = {
    fontFamily: '"Cambria", "Times New Roman", serif'
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

const PassportSectionTitle = ({ title, hint }) => (
    <div className="flex items-end justify-between gap-4">
        <div className="flex items-center gap-3">
            <div className="h-px w-6 bg-[#163878]" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.36em] text-[#355894]" style={documentFont}>
                {title}
            </h2>
        </div>
        {hint ? (
            <p className="text-[10px] font-medium text-slate-500" style={documentFont}>
                {hint}
            </p>
        ) : null}
    </div>
);

const InlinePager = ({ activePage, totalPages, onPrevious, onNext, dark = false }) => (
    <div
        className={`inline-flex h-[42px] w-full max-w-[210px] items-center justify-between rounded-[12px] border px-2 py-1 ${
            dark
                ? "border-white/20 bg-white/5"
                : "border-[#d6dfef] bg-white/96 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.12)]"
        }`}
    >
        <button
            type="button"
            onClick={onPrevious}
            disabled={activePage === 1}
            className={`flex h-[30px] min-w-[56px] items-center justify-center rounded-[8px] px-3 text-[12px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
                dark
                    ? "border border-white/10 bg-white/20 text-white hover:bg-white/25 hover:border-white/30 active:bg-white/15"
                    : "border border-[#cbd6ea] bg-white text-[#163878] hover:bg-[#eaf0fc] hover:border-[#adc4eb] hover:shadow-sm active:bg-[#dbe6f8]"
            }`}
        >
            Prev
        </button>
        <div className="flex flex-col items-center justify-center min-w-[58px] text-center leading-none">
            <p className={`text-[8px] font-bold uppercase tracking-[0.2em] ${dark ? "text-blue-200/55" : "text-[#45639b]"}`}>Page</p>
            <p className={`mt-0.5 text-[13px] font-semibold ${dark ? "text-white" : "text-[#10285a]"}`}>
                {activePage} / {totalPages}
            </p>
        </div>
        <button
            type="button"
            onClick={onNext}
            disabled={activePage === totalPages}
            className={`flex h-[30px] min-w-[56px] items-center justify-center rounded-[8px] px-3 text-[12px] font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
                dark
                    ? "border border-[#27498d] bg-[#183b7f] text-white hover:bg-[#214893] active:bg-[#122c60] hover:shadow-[0_6px_12px_-8px_rgba(255,255,255,0.25)]"
                    : "border border-[#163878] bg-[#163878] text-white hover:bg-[#102c66] active:bg-[#0b1e47] hover:shadow-[0_6px_12px_-8px_rgba(22,56,120,0.45)]"
            }`}
        >
            Next
        </button>
    </div>
);

const PageRibbon = ({ title, subtitle, pageNumber }) => (
    <div className="mb-6 flex items-start justify-between gap-6 border-b border-[#d5deef] pb-5">
        <div>
            <p
                className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#45639b]"
                style={documentFont}
            >
                DIGITAL SKILLS PASSPORT
            </p>
            <h2 className="mt-2 text-[22px] font-semibold text-[#10285a]" style={displayFont}>
                {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600" style={documentFont}>
                {subtitle}
            </p>
        </div>
        <div className="flex min-w-[120px] flex-col items-end gap-3 pt-1 text-right">
            <span className="text-[12px] font-bold uppercase tracking-[0.34em] text-slate-400" style={documentFont}>
                Page {pageNumber} / 4
            </span>
        </div>
    </div>
);

const PassportPage = ({
    pageNumber,
    title,
    subtitle,
    passportId,
    children,
    pageRef,
    showRibbon = true,
    showChrome = true
}) => (
    <section
        ref={pageRef}
        className="relative w-full overflow-hidden rounded-[28px] border border-[#cfd9ea] bg-[#f8fbff] px-5 py-5 text-slate-900 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.32)] sm:px-8 sm:py-8"
        style={{ ...PAGE_DIMENSIONS, ...documentFont }}
    >
        <div className="relative z-10 flex min-h-full flex-col">
            {showRibbon ? (
                <PageRibbon
                    title={title}
                    subtitle={subtitle}
                    pageNumber={pageNumber}
                />
            ) : null}
            <div className="flex-1">{children}</div>
            <div className="mt-6 flex items-center justify-between border-t border-[#d5deef] pt-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#45639b]">
                    {passportId} | SMAART INSTITUTE
                </span>
                <div className="flex items-center justify-end rounded-[12px] px-2 py-1">
                    <img
                        src={blueLogo}
                        alt="SMAART Institute"
                        className="h-16 w-auto object-contain opacity-100"
                    />
                </div>
            </div>
        </div>
    </section>
);

const ActionButton = ({ icon: Icon, label, onClick, disabled = false, primary = false }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
            primary
                ? "border-[#163878] bg-[#163878] text-white hover:bg-[#102c66]"
                : "border-[#cbd6ea] bg-white text-[#163878] hover:bg-[#f7faff]"
        } disabled:cursor-not-allowed disabled:opacity-60`}
        style={documentFont}
    >
        <Icon className="h-4 w-4" />
        {label}
    </button>
);

const StatCell = ({ label, value, isFirst = false }) => (
    <div className={`flex flex-1 flex-col items-center justify-center px-3 py-3 text-center ${isFirst ? "" : "border-l border-white/10"}`}>
        <span className="text-[18px] font-semibold text-white" style={displayFont}>
            {value}
        </span>
        <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.3em] text-blue-200/70" style={documentFont}>
            {label}
        </span>
    </div>
);

const StandardCard = ({ title, rating }) => (
    <div className="rounded-[18px] border border-[#d3def0] bg-[#f3f7fe] px-3 py-4 text-center">
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#20417e]">{title}</p>
        <p className="mt-2 text-[22px] font-semibold text-[#10285a]" style={displayFont}>
            {rating.toFixed(1)}
        </p>
    </div>
);

const BadgePill = ({ label, tone = "blue" }) => {
    const tones = {
        blue: "border-[#c8d6f0] bg-[#edf3ff] text-[#163878]",
        emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber: "border-amber-200 bg-amber-50 text-amber-700"
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] ${tones[tone] || tones.blue}`}>
            {label}
        </span>
    );
};

const CredentialCard = ({ credential }) => (
    <div className="flex h-full flex-col justify-between rounded-[22px] border border-[#cfdaee] bg-white px-4 py-4">
        <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-[#d5def0] bg-[#163878]/[0.03]">
                {credential.icon ? (
                    <img src={credential.icon} alt={credential.title} className="h-full w-full object-cover" />
                ) : (
                    <Award className="h-5 w-5 text-[#163878]" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-[15px] font-semibold leading-snug text-[#10285a]" style={documentFont}>
                    {credential.title}
                </h3>
                <p className="mt-1 text-[11px] text-slate-500" style={documentFont}>
                    {credential.subtitle}
                </p>
            </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
            <BadgePill
                label={credential.difficulty}
                tone={credential.difficulty === "ADVANCED" ? "blue" : credential.difficulty === "INTERMEDIATE" ? "emerald" : "amber"}
            />
            <BadgePill label="VERIFIED" tone="emerald" />
            <BadgePill label="AI VERIFIED" tone="blue" />
            <BadgePill label="SMAART VERIFIED" tone="blue" />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e5ecf7] pt-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {credential.liveStatus}
            </span>
            <span className="text-slate-500">{credential.meta}</span>
        </div>
    </div>
);

const SkillChip = ({ label, source, verified = true, tone = "blue" }) => {
    const tones = {
        blue: "border-[#c9d7ef] bg-[#edf4ff] text-[#163878]",
        teal: "border-teal-200 bg-teal-50 text-teal-800",
        slate: "border-slate-200 bg-white text-slate-700"
    };

    return (
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold ${tones[tone] || tones.blue}`}>
            {verified ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span>{label}</span>
            {source ? <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-60">{source}</span> : null}
        </div>
    );
};

const EmptySkillState = ({ title }) => (
    <div className="rounded-[22px] border border-dashed border-[#cfd9ea] bg-white/75 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-[#163878]">{title}</p>
        <p className="mt-2 text-sm text-slate-500">No synced records are available for this category yet.</p>
    </div>
);

const SkillsPassport = () => {
    const navigate = useNavigate();
    const activePageRef = useRef(null);
    const TOTAL_PAGES = 4;

    const [currentUser, setCurrentUser] = useState(null);
    const [registrationProfile, setRegistrationProfile] = useState(null);
    const [baselineResult, setBaselineResult] = useState(null);
    const [stageResults, setStageResults] = useState({});
    const [courseEnrollments, setCourseEnrollments] = useState([]);
    const [externalCertificates, setExternalCertificates] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isExporting, setIsExporting] = useState(false);
    const [activePage, setActivePage] = useState(1);

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
                ...(registrationProfile?.sectorPreferences?.preferredSectors || []),
                ...(registrationProfile?.sectorPreferences?.secondarySectors || [])
            ],
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
                pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
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
        return <SkillsPassportSkeleton />;
    }

    return (
        <div className="min-h-screen bg-transparent" style={documentFont}>
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="mx-auto flex max-w-[235mm] flex-col gap-5"
            >
                <div className="mx-auto flex w-full max-w-[210mm] flex-col gap-4 rounded-[24px] border border-[#d6dfef] bg-white/80 px-5 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-[1.65rem] font-[800] tracking-tight text-[#10285a]" style={displayFont}>
                            Skills Passport
                        </h1>
                        <p className="mt-1 text-[0.85rem] font-[500] text-slate-500 max-w-[480px] leading-relaxed">
                            Your comprehensive academic and professional identity, securely synced with live SMAART records.
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <ActionButton icon={ArrowLeft} label="Back" onClick={() => navigate(-1)} />
                        <ActionButton icon={Share2} label="Copy Link" onClick={handleCopyLink} />
                        <ActionButton
                            icon={Download}
                            label={isExporting ? "Exporting..." : "Export PDF"}
                            onClick={handleExport}
                            disabled={isExporting}
                            primary
                        />
                    </div>
                </div>

                {activePage === 1 ? (
                <div className="mx-auto w-full max-w-[210mm]">
                    <div className="mb-2 flex justify-end">
                        <InlinePager
                            activePage={activePage}
                            totalPages={TOTAL_PAGES}
                            onPrevious={() => setActivePage((page) => Math.max(1, page - 1))}
                            onNext={() => setActivePage((page) => Math.min(TOTAL_PAGES, page + 1))}
                        />
                    </div>
                <PassportPage
                    pageNumber={1}
                    title="Main Passport Overview"
                    subtitle="Identity, standards matrix, and verified SMAART credentials"
                    passportId={passportData.passportId}
                    pageRef={activePageRef}
                    showRibbon={false}
                    showChrome={false}
                >
                    <div className="bg-[linear-gradient(135deg,_#102c66_0%,_#173d87_58%,_#1b4ba5_100%)] px-5 py-5 text-white sm:px-6 sm:py-5" style={{ borderRadius: "18px 18px 0 0" }}>
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-blue-200/75">
                                    DIGITAL SKILLS PASSPORT
                                </p>
                                <h2 className="mt-2 text-[30px] leading-none text-white sm:text-[34px]" style={displayFont}>
                                    {passportData.fullName}
                                </h2>
                                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f5d88d]">
                                    {passportData.degree}
                                </p>
                                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-blue-50/90">
                                    <span className="inline-flex items-center gap-2">
                                        <Mail className="h-3.5 w-3.5 text-blue-200" />
                                        {passportData.email}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <Phone className="h-3.5 w-3.5 text-blue-200" />
                                        {passportData.phone}
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
                                        {passportData.passportId}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center justify-center rounded-[16px] bg-white p-2 shadow-lg h-[88px] w-[88px]">
                                    <QRCodeSVG
                                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/verify-passport/${passportData.passportId}?name=${encodeURIComponent(passportData.fullName)}&institution=${encodeURIComponent(passportData.institution)}`}
                                        size={56}
                                        bgColor={"#ffffff"}
                                        fgColor={"#102c66"}
                                        level={"M"}
                                    />
                                    <span className="mt-1 text-[6px] font-bold uppercase tracking-[0.15em] text-[#102c66] whitespace-nowrap">
                                        Scan to Verify
                                    </span>
                                </div>
                                <div className="flex flex-col items-center justify-start gap-2 min-w-[100px]">
                                    <div className="relative">
                                        <div className="relative h-[88px] w-[88px] overflow-hidden rounded-[20px] border border-white/20 bg-white/10 shadow-md">
                                            {passportData.profilePhoto ? (
                                                <img
                                                    src={passportData.profilePhoto}
                                                    alt={passportData.fullName}
                                                    className="h-full w-full object-cover"
                                                    onError={(event) => {
                                                        event.currentTarget.src = spImage;
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <UserCircle2 className="h-16 w-16 text-white/80" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#173d87] bg-emerald-500 text-white shadow-lg">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </div>
                                    </div>
                                    <p className="pt-1 text-center text-[18px] font-semibold uppercase tracking-[0.04em] text-white/92 w-full" style={displayFont}>
                                        {sanitizeLabel(passportData.institution).split(" ")[0] || passportData.institution}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 overflow-hidden rounded-[12px] border border-white/10 bg-white/5">
                            <div className="flex flex-col sm:flex-row">
                                <StatCell label="Avg Rating" value={passportData.avgRating.toFixed(1)} isFirst />
                                <StatCell label="Standards" value={String(passportData.standardRatings.length)} />
                                <StatCell label="Credentials" value={String(passportData.credentials.length)} />
                                <StatCell label="Cohort" value={passportData.cohort} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-7 border-x border-b border-[#d9e3f2] bg-white px-5 py-7 sm:px-7">
                        <div className="space-y-4">
                            <PassportSectionTitle title="Professional Standards Matrix" hint="Assessment-aligned ratings" />
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                                {passportData.standardRatings.map((item) => (
                                    <StandardCard key={item.title} title={item.title} rating={item.rating} />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <PassportSectionTitle
                                title="Verified SMAART Credentials"
                                hint={`${passportData.credentials.length} live credentials synced from backend`}
                            />
                            {passportData.credentials.length ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {passportData.credentials.map((credential) => (
                                        <CredentialCard key={credential.id} credential={credential} />
                                    ))}
                                </div>
                            ) : (
                                <EmptySkillState title="No SMAART credentials are available yet." />
                            )}
                        </div>
                    </div>
                </PassportPage>
                </div>
                ) : null}

                {activePage === 2 ? (
                <div className="mx-auto w-full max-w-[210mm]">
                    <div className="mb-2 flex justify-end">
                        <InlinePager
                            activePage={activePage}
                            totalPages={TOTAL_PAGES}
                            onPrevious={() => setActivePage((page) => Math.max(1, page - 1))}
                            onNext={() => setActivePage((page) => Math.min(TOTAL_PAGES, page + 1))}
                        />
                    </div>
                <PassportPage
                    pageNumber={2}
                    title="Technical Skills"
                    subtitle="Backend-synced technical competencies and verified learning signals"
                    passportId={passportData.passportId}
                    pageRef={activePageRef}
                >
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                            <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#163878]">
                                        <Monitor className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#45639b]">Technical Ledger</p>
                                        <h3 className="text-lg font-semibold text-[#10285a]" style={displayFont}>
                                            Verified technical stack
                                        </h3>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-600">
                                    This page consolidates technical skills inferred from enrolled courses, submitted projects, course metadata,
                                    and synced credential records.
                                </p>
                            </div>

                            <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#45639b]">Verification Status</p>
                                <div className="mt-4 space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                        <span>Skills are rendered only from synced backend records.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Sparkles className="h-4 w-4 text-[#163878]" />
                                        <span>Credential-linked course tags elevate skills to verified status.</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Star className="h-4 w-4 text-amber-500" />
                                        <span>Layout is optimized for export-ready A4 rendering.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                            <PassportSectionTitle title="Technical Skills" hint={`${passportData.technicalSkills.length} synced skills`} />
                            {passportData.technicalSkills.length ? (
                                <div className="mt-5 flex flex-wrap gap-3">
                                    {passportData.technicalSkills.map((skill) => (
                                        <SkillChip
                                            key={`${skill.label}-${skill.source}`}
                                            label={skill.label}
                                            source={skill.source}
                                            verified={skill.verified}
                                            tone="blue"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-5">
                                    <EmptySkillState title="No technical skills are synced yet." />
                                </div>
                            )}
                        </div>
                    </div>
                </PassportPage>
                </div>
                ) : null}

                {activePage === 3 ? (
                <div className="mx-auto w-full max-w-[210mm]">
                    <div className="mb-2 flex justify-end">
                        <InlinePager
                            activePage={activePage}
                            totalPages={TOTAL_PAGES}
                            onPrevious={() => setActivePage((page) => Math.max(1, page - 1))}
                            onNext={() => setActivePage((page) => Math.min(TOTAL_PAGES, page + 1))}
                        />
                    </div>
                <PassportPage
                    pageNumber={3}
                    title="AI Skills"
                    subtitle="AI capability page with verified tools, prompts, and automation-oriented learning"
                    passportId={passportData.passportId}
                    pageRef={activePageRef}
                >
                    <div className="space-y-6">
                        <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#45639b]">AI Competency Registry</p>
                                    <h3 className="text-lg font-semibold text-[#10285a]" style={displayFont}>
                                        AI-verified skill surface
                                    </h3>
                                </div>
                            </div>
                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                AI skills are grouped from course metadata, synced certificate categories, and profile-linked AI learning entries.
                            </p>
                        </div>

                        <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                            <PassportSectionTitle title="AI Skills" hint={`${passportData.aiSkills.length} synced skills`} />
                            {passportData.aiSkills.length ? (
                                <div className="mt-5 flex flex-wrap gap-3">
                                    {passportData.aiSkills.map((skill) => (
                                        <SkillChip
                                            key={`${skill.label}-${skill.source}`}
                                            label={skill.label}
                                            source={skill.source}
                                            verified={skill.verified}
                                            tone="teal"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-5">
                                    <EmptySkillState title="No AI skills are synced yet." />
                                </div>
                            )}
                        </div>
                    </div>
                </PassportPage>
                </div>
                ) : null}

                {activePage === 4 ? (
                <div className="mx-auto w-full max-w-[210mm]">
                    <div className="mb-2 flex justify-end">
                        <InlinePager
                            activePage={activePage}
                            totalPages={TOTAL_PAGES}
                            onPrevious={() => setActivePage((page) => Math.max(1, page - 1))}
                            onNext={() => setActivePage((page) => Math.min(TOTAL_PAGES, page + 1))}
                        />
                    </div>
                <PassportPage
                    pageNumber={4}
                    title="Domain Skills"
                    subtitle="Academic domain signals and career-aligned specialization markers"
                    passportId={passportData.passportId}
                    pageRef={activePageRef}
                    showChrome={false}
                >
                    <div className="rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#163878]">
                                <Briefcase className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#45639b]">Domain Skills</p>
                                <h3 className="text-lg font-semibold text-[#10285a]" style={displayFont}>
                                    Academic and career domains
                                </h3>
                            </div>
                        </div>
                        {passportData.domainSkills.length ? (
                            <div className="mt-5 flex flex-wrap gap-3">
                                {passportData.domainSkills.map((skill) => (
                                    <SkillChip
                                        key={`${skill.label}-${skill.source}`}
                                        label={skill.label}
                                        source={skill.source}
                                        verified={skill.verified}
                                        tone="blue"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-5">
                                <EmptySkillState title="No domain skills are synced yet." />
                            </div>
                        )}
                    </div>

                    <div className="mt-6 rounded-[24px] border border-[#cfdaee] bg-white px-5 py-5">
                        <PassportSectionTitle title="Verification Summary" hint="Institutional digital identity profile" />
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <div className="rounded-[20px] border border-[#d8e1f1] bg-[#f8fbff] px-4 py-4">
                                <div className="flex items-center gap-2 text-[#163878]">
                                    <GraduationCap className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.28em]">Institution</span>
                                </div>
                                <p className="mt-3 text-base font-semibold text-[#10285a]">{passportData.institution}</p>
                            </div>
                            <div className="rounded-[20px] border border-[#d8e1f1] bg-[#f8fbff] px-4 py-4">
                                <div className="flex items-center gap-2 text-[#163878]">
                                    <BookOpen className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.28em]">Programme</span>
                                </div>
                                <p className="mt-3 text-base font-semibold text-[#10285a]">{passportData.degree}</p>
                            </div>
                            <div className="rounded-[20px] border border-[#d8e1f1] bg-[#f8fbff] px-4 py-4">
                                <div className="flex items-center gap-2 text-[#163878]">
                                    <ShieldCheck className="h-4 w-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.28em]">Verified On</span>
                                </div>
                                <p className="mt-3 text-base font-semibold text-[#10285a]">{passportData.verificationDate}</p>
                            </div>
                        </div>
                    </div>
                </PassportPage>
                </div>
                ) : null}
            </motion.div>
        </div>
    );
};

export default SkillsPassport;
