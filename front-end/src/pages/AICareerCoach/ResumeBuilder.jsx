import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
    IconFileDescription,
    IconLock,
    IconLockOpen,
    IconBriefcase,
    IconCopy,
    IconTrash,
    IconPencil,
    IconDownload,
    IconPlus,
    IconStar,
    IconStarFilled,
    IconCircleCheck,
    IconCircleHalf,
    IconCircleDashed,
    IconChartBar,
    IconListCheck,
    IconChevronDown,
    IconChevronUp,
    IconArrowLeft,
    IconAlertTriangle,
    IconSparkles,
    IconTarget,
} from '@tabler/icons-react';
import {
    FileText,
    Download,
    Loader2,
    ArrowLeft,
    ArrowRight,
    Sparkles,
    User,
    Briefcase,
    GraduationCap,
    Award,
    Printer,
    Save,
    Eye,
    Check,
    Plus,
    Trash2,
    RefreshCw,
    X,
    MapPin as MapPinIcon,
    Mail,
    Phone,
    Trophy,
    Linkedin,
    Github,
    Globe,
    Calendar,
    Flag,
    Heart,
    LinkIcon,
    QrCode,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import resumeApi from '@/services/resumeApi';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { apiCall } from '@/services/api';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';
import QRCode from 'qrcode';
import {
    ORG_NAME,
    normalizeText,
    buildResumeFingerprint,
    createResumePublicId,
    buildVerificationUrl,
} from '@/utils/resumeSecurity';

/** Footer on each PDF page (body watermark is rendered once in the resume preview) */
const applyPdfWatermarks = (pdf, pdfWidth, pdfHeight, resumePublicId, studentId) => {
    const pageCount = pdf.getNumberOfPages();
    const stuPart = studentId ? ` · STU ID: ${studentId}` : '';
    for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        pdf.setDrawColor(210, 210, 210);
        pdf.setLineWidth(0.25);
        pdf.line(14, pdfHeight - 16, pdfWidth - 14, pdfHeight - 16);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.setTextColor(110, 110, 110);
        pdf.text(
            `${ORG_NAME} · Verified Securely${stuPart} · ${resumePublicId}`,
            pdfWidth / 2,
            pdfHeight - 9,
            { align: 'center' }
        );
    }
};

const ResumeWatermark = () => (
    <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden select-none"
        aria-hidden
    >
        <span
            className="font-black uppercase whitespace-nowrap !text-black -rotate-45"
            style={{
                fontSize: '72px',
                letterSpacing: '0.18em',
                opacity: 0.015,
                fontFamily: 'Arial, Helvetica, sans-serif',
            }}
        >
            SMAART INSTITUTE
        </span>
    </div>
);

const TemplateThumbnail = ({ type }) => {
    if (type === 'classic') {
        return (
            <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-20 h-2 bg-slate-900 rounded-full" />
                    <div className="w-12 h-1 bg-slate-500 rounded-full" />
                    <div className="w-32 h-1 bg-slate-300 rounded-full mt-1" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                    <div className="w-full h-0.5 bg-slate-300" />
                    <div className="w-full flex gap-1">
                        <div className="w-1/3 h-1 bg-slate-300 rounded" />
                        <div className="w-2/3 h-1 bg-slate-200 rounded" />
                    </div>
                    <div className="w-5/6 h-1 bg-slate-200 rounded" />
                </div>
                <div className="w-full h-0.5 bg-slate-300 mt-1" />
            </div>
        );
    }
    if (type === 'modern') {
        return (
            <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex gap-2">
                    <div className="w-1.5 h-8 bg-blue-700 rounded-sm" />
                    <div className="flex flex-col gap-1">
                        <div className="w-24 h-2.5 bg-slate-900 rounded" />
                        <div className="w-14 h-1.5 bg-blue-600 rounded" />
                    </div>
                </div>
                <div className="flex flex-col gap-1 w-full pl-3 mt-1">
                    <div className="w-16 h-1.5 bg-slate-800 rounded mb-1" />
                    <div className="w-full flex gap-1">
                        <div className="w-2 h-2 bg-blue-100 rounded-full" />
                        <div className="w-4/5 h-1 bg-slate-350 rounded" />
                    </div>
                    <div className="w-full flex gap-1">
                        <div className="w-2 h-2 bg-blue-100 rounded-full" />
                        <div className="w-5/6 h-1 bg-slate-250 rounded" />
                    </div>
                </div>
                <div className="w-full flex justify-between items-center pl-3 border-t border-slate-100 pt-1">
                    <div className="w-12 h-1 bg-slate-300 rounded" />
                    <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                </div>
            </div>
        );
    }
    if (type === 'executive') {
        return (
            <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-24 h-2 bg-[#002147] rounded-full" />
                    <div className="w-36 h-[1px] bg-slate-200" />
                    <div className="w-20 h-1 bg-slate-400 rounded-full" />
                    <div className="w-36 h-[1px] bg-slate-200" />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="w-20 h-1.5 bg-[#002147] rounded" />
                    <div className="w-full flex gap-2">
                        <div className="w-1/4 h-1 bg-slate-300 rounded" />
                        <div className="w-3/4 h-1 bg-slate-200 rounded" />
                    </div>
                </div>
                <div className="w-full flex justify-between items-center border-t border-[#002147]/20 pt-1">
                    <div className="w-14 h-1 bg-slate-350 rounded" />
                    <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                </div>
            </div>
        );
    }
    if (type === 'tech') {
        return (
            <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex flex-col gap-0.5">
                    <div className="w-20 h-2 bg-slate-800 rounded-sm" />
                    <div className="w-16 h-1.5 bg-[#1a3884] rounded-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full mt-1 border-b border-slate-200 pb-1">
                    <div className="w-12 h-1.5 bg-slate-800 rounded-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full mt-1">
                    <div className="w-full flex gap-1 pl-1">
                        <div className="w-1 h-1 bg-[#1a3884] rounded-full mt-[1px]" />
                        <div className="w-5/6 h-1 bg-slate-300 rounded-sm" />
                    </div>
                </div>
                <div className="w-full flex gap-1 pl-1">
                    <div className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[5px] text-slate-700">API</div>
                    <div className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[5px] text-slate-700">React</div>
                    <div className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[5px] text-slate-700">Node</div>
                </div>
            </div>
        );
    }
    if (type === 'modernProfile') {
        return (
            <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex gap-2 select-none pointer-events-none">
                <div className="w-8 h-8 rounded bg-slate-300 shrink-0" />
                <div className="flex flex-col gap-1 w-full">
                    <div className="w-20 h-2 bg-[#1a3884] rounded-sm" />
                    <div className="w-14 h-1.5 bg-slate-500 rounded-sm mb-1" />
                    <div className="w-full h-[1px] bg-slate-200 mb-1" />
                    <div className="w-full flex gap-1">
                        <div className="w-1 h-1 bg-[#1a3884] rounded-full mt-[1px]" />
                        <div className="w-4/5 h-1 bg-slate-350 rounded" />
                    </div>
                    <div className="w-full flex gap-1">
                        <div className="w-1 h-1 bg-[#1a3884] rounded-full mt-[1px]" />
                        <div className="w-5/6 h-1 bg-slate-250 rounded" />
                    </div>
                </div>
            </div>
        );
    }
    // academic
    return (
        <div className="w-full h-32 bg-white border border-slate-200 rounded p-3 flex flex-col gap-1 justify-between select-none pointer-events-none">
            <div className="flex flex-col items-center">
                <div className="w-24 h-2 bg-black rounded-full" />
                <div className="w-14 h-1.5 bg-black rounded-full mt-0.5" />
            </div>
            <div className="flex flex-col gap-1 w-full mt-1">
                <div className="w-16 h-1.5 bg-black rounded" />
                <div className="w-full flex gap-1">
                    <div className="w-1 h-1 bg-black rounded-full mt-[3px]" />
                    <div className="w-full h-1 bg-slate-700 rounded" />
                </div>
                <div className="w-full flex gap-1">
                    <div className="w-1 h-1 bg-black rounded-full mt-[3px]" />
                    <div className="w-5/6 h-1 bg-slate-700 rounded" />
                </div>
            </div>
            <div className="w-full h-[1px] bg-slate-350 mt-1" />
        </div>
    );
};

const templates = {
    classic: {
        id: 'classic',
        name: 'Classic Professional',
        desc: 'Traditional serif styling preferred by corporate, finance, and legal sectors.',
        tag: 'Corporate & Finance',
        fontFamily: '"Times New Roman", Times, serif',
        titleClass: 'text-4xl font-bold uppercase tracking-tight text-black text-center',
        subtitleClass: 'text-lg font-semibold text-gray-800 uppercase tracking-widest text-center mt-1',
        contactClass: 'flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-3 text-[10.5px] text-gray-700 max-w-full',
        sectionHeaderClass: 'text-[13px] font-bold text-black uppercase border-b-2 border-black pb-0.5 mb-2.5 tracking-wider',
        sectionClass: 'mb-6',
        bodyTextClass: 'text-gray-800 text-[11px] leading-normal',
        bulletClass: 'text-gray-700 text-[11px] leading-normal mt-1 whitespace-pre-wrap pl-4 relative before:content-[\'•\'] before:absolute before:left-0',
        skillsClass: 'flex flex-col gap-2 mt-1',
        skillsLabelClass: 'font-bold text-black text-[11px] w-full mb-1',
        skillsBadge: 'bg-blue-50 text-[#1a3884] px-2 py-0.5 border border-blue-200 rounded text-[10.5px] font-semibold',
        cardBg: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-slate-205 dark:border-white/10'
    },
    modern: {
        id: 'modern',
        name: 'Modern Minimalist',
        desc: 'Clean sans-serif typography and optimized spacing, perfect for tech and startups.',
        tag: 'Tech & Startups',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        titleClass: 'text-3xl font-black tracking-tight text-slate-900 text-left border-l-4 border-[#1a3884] pl-3',
        subtitleClass: 'text-md font-bold text-[#1a3884] uppercase tracking-wider text-left mt-1 pl-3',
        contactClass: 'flex flex-wrap justify-start items-center gap-x-4 gap-y-1 mt-3 text-[10.5px] text-slate-600 pl-3',
        sectionHeaderClass: 'text-[12px] font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-1 mb-2.5 flex items-center gap-2',
        sectionClass: 'mb-5',
        bodyTextClass: 'text-slate-700 text-[11px] leading-relaxed',
        bulletClass: 'text-slate-600 text-[11px] leading-relaxed mt-1 whitespace-pre-wrap pl-4 relative before:content-[\'◦\'] before:absolute before:left-0 before:text-[#1a3884] before:font-bold',
        skillsClass: 'flex flex-col gap-2 mt-1',
        skillsLabelClass: 'font-bold text-slate-800 text-[11px] w-full mb-1',
        skillsBadge: 'bg-slate-100 text-slate-850 px-2 py-0.5 rounded-md text-[10px] font-semibold border border-slate-200',
        cardBg: 'from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200/50 dark:border-blue-500/10'
    },
    executive: {
        id: 'executive',
        name: 'Executive Premium',
        desc: 'Distinguished editorial styling with navy accents, tailored for senior roles.',
        tag: 'Business & Management',
        fontFamily: 'Georgia, serif',
        titleClass: 'text-3xl font-bold tracking-tight text-[#002147] text-center italic',
        subtitleClass: 'text-sm font-bold text-slate-600 uppercase tracking-widest text-center mt-1 border-t border-b border-slate-200 py-1 max-w-md mx-auto',
        contactClass: 'flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-3 text-[10.5px] text-slate-700 max-w-full italic',
        sectionHeaderClass: 'text-[13px] font-extrabold text-[#002147] uppercase border-b-2 border-[#002147]/30 pb-0.5 mb-2.5 tracking-wider',
        sectionClass: 'mb-5',
        bodyTextClass: 'text-slate-800 text-[11px] leading-normal',
        bulletClass: 'text-slate-700 text-[11px] leading-normal mt-1 whitespace-pre-wrap pl-4 relative before:content-[\'■\'] before:absolute before:left-0 before:text-[#002147] before:text-[8px] before:top-[2px]',
        skillsClass: 'flex flex-col gap-2 mt-1',
        skillsLabelClass: 'font-bold text-[#002147] text-[11px] w-full mb-1 block',
        skillsBadge: 'bg-slate-50 text-slate-800 px-2 py-0.5 border border-slate-300 rounded text-[10.5px] font-semibold',
        cardBg: 'from-amber-50/30 to-amber-100/20 dark:from-amber-950/10 dark:to-amber-900/5 border-amber-250/30 dark:border-amber-500/10'
    },
    tech: {
        id: 'tech',
        name: 'Tech Professional',
        desc: 'Ultra-clean, structured layout with sharp typography for engineering and analyst roles.',
        tag: 'Engineering & IT',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        titleClass: 'text-3xl font-extrabold tracking-tight text-slate-900 text-left uppercase',
        subtitleClass: 'text-sm font-bold text-[#1a3884] uppercase tracking-widest text-left mt-0.5',
        contactClass: 'flex flex-wrap justify-start items-center gap-x-4 gap-y-1 mt-2.5 text-[10.5px] text-slate-600 border-b border-slate-200 pb-3',
        sectionHeaderClass: 'text-[13px] font-bold text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-300 pb-1',
        sectionClass: 'mb-5',
        bodyTextClass: 'text-slate-700 text-[11px] leading-relaxed',
        bulletClass: 'text-slate-700 text-[11px] leading-relaxed mt-1 whitespace-pre-wrap pl-4 relative before:content-[\'•\'] before:absolute before:left-0 before:text-[#1a3884]',
        skillsClass: 'flex flex-wrap gap-1.5 mt-1',
        skillsLabelClass: 'font-bold text-slate-800 text-[11px] w-full mb-1 block',
        skillsBadge: 'bg-slate-50 text-slate-800 px-2 py-1 rounded text-[10px] font-semibold border border-slate-200',
        cardBg: 'from-slate-50 to-slate-100/50 border-slate-200/80 dark:border-white/10'
    },
    academic: {
        id: 'academic',
        name: 'Academic Standard',
        desc: 'High density format focusing purely on content length and traditional formatting.',
        tag: 'Academic & Research',
        fontFamily: 'Arial, Helvetica, sans-serif',
        titleClass: 'text-3xl font-black text-black text-center uppercase tracking-normal',
        subtitleClass: 'text-sm font-bold text-black uppercase tracking-wide text-center mt-0.5',
        contactClass: 'flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-2 text-[10.5px] text-black max-w-full',
        sectionHeaderClass: 'text-[12px] font-bold text-black uppercase border-b border-black pb-0.5 mb-2 tracking-wide',
        sectionClass: 'mb-4',
        bodyTextClass: 'text-black text-[10.5px] leading-normal',
        bulletClass: 'text-black text-[10.5px] leading-normal mt-0.5 whitespace-pre-wrap pl-4 relative before:content-[\'•\'] before:absolute before:left-0',
        skillsClass: 'flex flex-col gap-1.5 mt-1',
        skillsLabelClass: 'font-bold text-[10.5px] text-black w-full mb-0.5 block',
        skillsBadge: 'bg-gray-100 text-black px-1.5 py-0.5 border border-gray-300 rounded-sm text-[10px]',
        cardBg: 'from-gray-50 to-gray-150 dark:from-slate-800 dark:to-slate-850 border-slate-200 dark:border-white/10'
    },
    modernProfile: {
        id: 'modernProfile',
        name: 'Modern Profile',
        desc: 'Includes a professional photo. Popular in Europe, Asia, and creative fields.',
        tag: 'Creative & Global',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        hasPhoto: true,
        titleClass: 'text-3xl font-black tracking-tight text-[#1a3884] text-left uppercase',
        subtitleClass: 'text-sm font-bold text-slate-500 uppercase tracking-widest text-left mt-1',
        contactClass: 'flex flex-wrap justify-start items-center gap-x-4 gap-y-1 mt-2 text-[10.5px] text-slate-600',
        sectionHeaderClass: 'text-[13px] font-bold text-slate-900 uppercase border-b-2 border-[#1a3884] pb-1 mb-3 tracking-wider flex items-center gap-2',
        sectionClass: 'mb-6',
        bodyTextClass: 'text-slate-700 text-[11px] leading-relaxed',
        bulletClass: 'text-slate-600 text-[11px] leading-relaxed mt-1.5 whitespace-pre-wrap pl-4 relative before:content-[\'•\'] before:absolute before:left-0 before:text-[#1a3884]',
        skillsClass: 'flex flex-wrap gap-1.5 mt-1',
        skillsLabelClass: 'font-bold text-slate-800 text-[11px] w-full mb-1 block',
        skillsBadge: 'bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-semibold border border-slate-200',
        cardBg: 'from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/20 dark:to-purple-900/10 border-indigo-200/50 dark:border-purple-500/10'
    }
};

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // ── Multi-resume list mode ───────────────────────────────────────────
    const [pageMode, setPageMode] = useState('list');       // 'list' | 'builder'
    const [resumeList, setResumeList] = useState([]);
    const [editingResumeId, setEditingResumeId] = useState(null);
    const [resumeListLoading, setResumeListLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [duplicatingId, setDuplicatingId] = useState(null);
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [versionName, setVersionName] = useState('My Resume');

    // ── Career path / lock state ─────────────────────────────────────────
    const [careerLocked, setCareerLocked] = useState(false);
    const [careerPaths, setCareerPaths] = useState({ primary: null, secondary: null, tertiary: null });
    const [selectedCareerPath, setSelectedCareerPath] = useState(null); // { key, roleName }
    const [careerLoading, setCareerLoading] = useState(true);
    const [userEmail, setUserEmail] = useState('');

    // ── Skill chips (3-tier) ─────────────────────────────────────────────
    const [masteredSkills, setMasteredSkills] = useState([]);   // status: Completed
    const [inProgressSkills, setInProgressSkills] = useState([]); // status: In Progress
    const [suggestedSkills, setSuggestedSkills] = useState([]);  // from role API only
    const [skillChipsLoading, setSkillChipsLoading] = useState(false);

    const [atsScore, setAtsScore] = useState(0);
    const [atsBreakdown, setAtsBreakdown] = useState([]);
    const [atsOpenCategory, setAtsOpenCategory] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);

    // ── Builder core state ───────────────────────────────────────────────
    const [resumeId, setResumeId] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const [resumePublicId, setResumePublicId] = useState('');
    const [resumeFingerprint, setResumeFingerprint] = useState('');
    const [verificationUrl, setVerificationUrl] = useState('');
    const [verificationQr, setVerificationQr] = useState('');
    const [studentId, setStudentId] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('classic');
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

    const steps = [
        { id: 'personal', label: 'Profile', icon: User },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'projects', label: 'Projects', icon: FileText },
        { id: 'skills', label: 'Skills', icon: Sparkles },
        { id: 'achievements', label: 'Awards', icon: Trophy },
        { id: 'preview', label: 'Review & Download', icon: FileText }
    ];

    const [resumeData, setResumeData] = useState({
        personalInfo: {
            fullName: '',
            email: '',
            mobile: '',
            location: '',
            targetRole: '',
            linkedinUrl: '',
            githubUrl: '',
            portfolioUrl: '',
            profileImage: ''
        },
        summary: '',
        experience: [],
        education: [],
        skills: {
            technical: '',
            soft: '',
            languages: ''
        },
        projects: [],
        achievements: [],
        personalDetails: {
            fatherName: '',
            motherName: '',
            dob: '',
            nationality: ''
        }
    });

    useEffect(() => {
        const fingerprint = buildResumeFingerprint(resumeData);
        const nextResumePublicId = resumePublicId || createResumePublicId(fingerprint);
        const nextVerificationUrl = buildVerificationUrl(nextResumePublicId, fingerprint);

        setResumeFingerprint(fingerprint);
        if (!resumePublicId) {
            setResumePublicId(nextResumePublicId);
        }
        setVerificationUrl(nextVerificationUrl);

        QRCode.toDataURL(nextVerificationUrl, {
            margin: 1,
            width: 180,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })
            .then(setVerificationQr)
            .catch(error => {
                console.error('Failed to generate resume verification QR:', error);
                setVerificationQr('');
            });
    }, [resumeData, resumePublicId]);

    const fetchData = async () => {
        try {
            const [resumeRes, profileRes] = await Promise.all([
                resumeApi.getMyResumes().catch(() => ({ success: false })),
                aiCareerCoachApi.getProfile().catch(() => ({ success: false }))
            ]);
            const hydratedProfileRes = profileRes.success
                ? await hydrateProfileWithRegisteredDetails(profileRes)
                : profileRes;

            // Always capture student ID from profile (used in PDF footer for both branches)
            if (hydratedProfileRes.success) {
                const pData = hydratedProfileRes.richProfile || {};
                const pReg = hydratedProfileRes.registration || {};
                setStudentId(pData.studentId || pReg.studentId || hydratedProfileRes.student?.studentId || '');
            }

            if (resumeRes.success && resumeRes.data && resumeRes.data.length > 0) {
                const r = resumeRes.data[0];
                setResumeId(r._id);
                if (r.verification?.resumePublicId) {
                    setResumePublicId(r.verification.resumePublicId);
                    setResumeFingerprint(r.verification.fingerprint || '');
                    setVerificationUrl(
                        buildVerificationUrl(
                            r.verification.resumePublicId,
                            r.verification.fingerprint || buildResumeFingerprint(r)
                        )
                    );
                }
                setResumeData({
                    personalInfo: r.personalInfo || {},
                    summary: r.summary || '',
                    experience: r.experience || [],
                    education: r.education || [],
                    skills: r.skills || { technical: '', soft: '', languages: '' },
                    projects: r.projects || [],
                    achievements: r.achievements || [],
                    personalDetails: r.personalDetails || { fatherName: '', motherName: '', dob: '', nationality: '' }
                });
            } else if (hydratedProfileRes.success) {
                const data = hydratedProfileRes.richProfile || {};
                const reg = hydratedProfileRes.registration || {};
                const student = hydratedProfileRes.student || {};
                // Capture student ID for PDF footer
                setStudentId(data.studentId || reg.studentId || student.studentId || '');

                setResumeData(prev => buildResumeDataFromProfile(hydratedProfileRes, prev));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setDataLoaded(true);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchCareerData();
        fetchResumeList();
    }, []);

    // ── Fetch all resumes (list mode) ────────────────────────────────────
    const fetchResumeList = async () => {
        setResumeListLoading(true);
        try {
            const res = await resumeApi.getMyResumes();
            if (res.success) setResumeList(res.data || []);
        } catch (e) {
            console.error('Failed to fetch resume list:', e);
        } finally {
            setResumeListLoading(false);
        }
    };

    // ── Fetch career lock + path analysis ────────────────────────────────
    const fetchCareerData = async () => {
        setCareerLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            const [lockRes, analysisRes] = await Promise.all([
                apiCall('/career-agent/direction-lock/status').catch(e => { console.error('lockRes error:', e); return null; }),
                apiCall('/career-agent/my-analysis').catch(e => { console.error('analysisRes error:', e); return null; }),
            ]);
            console.log('lockRes:', lockRes);
            console.log('analysisRes:', analysisRes);

            const locked = lockRes?.isLocked === true;
            setCareerLocked(locked);

            if (analysisRes && analysisRes.analysis) {
                const paths = {
                    primary:   analysisRes.analysis.primary?.tab1?.role_name   || null,
                    secondary: analysisRes.analysis.secondary?.tab1?.role_name || null,
                    tertiary:  analysisRes.analysis.tertiary?.tab1?.role_name  || null,
                };
                setCareerPaths(paths);
                // Auto-select primary path
                if (paths.primary) {
                    setSelectedCareerPath({ key: 'primary', roleName: paths.primary });
                }
            } else if (analysisRes) {
                // Fallback in case of old structure
                const paths = {
                    primary:   analysisRes.primary?.tab1?.role_name   || null,
                    secondary: analysisRes.secondary?.tab1?.role_name || null,
                    tertiary:  analysisRes.tertiary?.tab1?.role_name  || null,
                };
                setCareerPaths(paths);
                if (paths.primary) {
                    setSelectedCareerPath({ key: 'primary', roleName: paths.primary });
                }
            }
        } catch (e) {
            console.error('Career fetch error:', e);
        } finally {
            setCareerLoading(false);
        }
    };

    // ── Fetch skill chips when career path is selected ───────────────────
    const fetchSkillChips = useCallback(async (roleName, email) => {
        if (!roleName) return;
        setSkillChipsLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const emailToUse = email || userEmail || JSON.parse(sessionStorage.getItem('user') || '{}').email || '';

            const [roleRes, userSkillsRes] = await Promise.all([
                apiCall(`/career-agent/role-skills/${encodeURIComponent(roleName)}`).catch(() => null),
                emailToUse ? apiCall(`/career-agent/user-skills/${encodeURIComponent(emailToUse)}`).catch(() => null) : Promise.resolve(null),
            ]);

            const roleSkills = roleRes?.skills || [];
            const userSkillsRaw = Array.isArray(userSkillsRes) ? userSkillsRes : [];

            // Build mastered and in-progress from platform activity
            const mastered    = userSkillsRaw.filter(s => s.status === 'Completed').map(s => s.skillName);
            const inProgress  = userSkillsRaw.filter(s => s.status === 'In Progress').map(s => s.skillName);

            // Suggested = role skills NOT in mastered/in-progress (case-insensitive)
            const known = new Set([...mastered, ...inProgress].map(s => s.toLowerCase().trim()));
            const suggested = roleSkills
                .filter(s => !known.has(s.skillName?.toLowerCase().trim()))
                .filter(s => s.skillCategory !== 'Soft Skill')
                .map(s => s.skillName);

            const softSuggested = roleSkills
                .filter(s => s.skillCategory === 'Soft Skill' && !known.has(s.skillName?.toLowerCase().trim()))
                .map(s => s.skillName);

            setMasteredSkills(mastered);
            setInProgressSkills(inProgress);
            setSuggestedSkills([...new Set([...suggested, ...softSuggested])]);

            // Auto-fill mastered skills into technical field
            if (mastered.length > 0) {
                setResumeData(prev => {
                    const existingTech = prev.skills.technical ? prev.skills.technical.split(',').map(s => s.trim()).filter(Boolean) : [];
                    const toAdd = mastered.filter(m => !existingTech.some(e => e.toLowerCase() === m.toLowerCase()));
                    if (toAdd.length === 0) return prev;
                    const merged = [...existingTech, ...toAdd].join(', ');
                    return { ...prev, skills: { ...prev.skills, technical: merged } };
                });
            }
        } catch (e) {
            console.error('Skill chips fetch error:', e);
        } finally {
            setSkillChipsLoading(false);
        }
    }, [userEmail]);

    // Trigger skill chip fetch when path selection changes
    useEffect(() => {
        if (selectedCareerPath?.roleName && dataLoaded) {
            fetchSkillChips(selectedCareerPath.roleName);
        }
    }, [selectedCareerPath, fetchSkillChips, dataLoaded]);

    // ── ATS Score Engine (5 categories, 100 pts) ─────────────────────────
    const calculateATSScore = useCallback((data, mastered = [], roleSkillsFromAPI = []) => {
        const results = [];

        // CAT 1 — Parseability & Format (25 pts)
        const cat1 = { label: 'Parseability & Format', max: 25, checks: [] };
        cat1.checks.push({ label: 'ATS-safe template', pts: 8, pass: true, step: null });
        cat1.checks.push({ label: 'Standard section headings', pts: 7, pass: true, step: null });
        const hasDates = (data.education || []).every(e => e.year?.trim()) && (data.experience || []).every(e => e.duration?.trim());
        cat1.checks.push({ label: 'Dates in all entries', pts: 5, pass: hasDates, step: hasDates ? null : 2 });
        const badChars = /[^\w\s@.\-+()]/;
        const noSpecial = !badChars.test(data.personalInfo?.fullName || '') && !badChars.test(data.personalInfo?.email || '') && !badChars.test(data.personalInfo?.mobile || '');
        cat1.checks.push({ label: 'No special chars in contact', pts: 5, pass: noSpecial, step: noSpecial ? null : 1 });
        cat1.score = cat1.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat1);

        // CAT 2 — Keyword & Role Match (30 pts)
        const cat2 = { label: 'Keyword & Role Match', max: 30, checks: [] };
        const hasRole = !!data.personalInfo?.targetRole?.trim();
        cat2.checks.push({ label: 'Target Role is set', pts: 5, pass: hasRole, step: hasRole ? null : 1 });
        const techSkillsArr = (data.skills?.technical || '').split(',').map(s => s.trim()).filter(Boolean);
        const hasTech3 = techSkillsArr.length >= 3;
        cat2.checks.push({ label: 'Technical Skills (3+ skills)', pts: 10, pass: hasTech3, step: hasTech3 ? null : 5 });
        // Keyword match with mastered bonus
        let kwScore = 0;
        if (roleSkillsFromAPI.length > 0 && techSkillsArr.length > 0) {
            let matched = 0;
            techSkillsArr.forEach(skill => {
                const isMatch = roleSkillsFromAPI.some(rs => rs.toLowerCase() === skill.toLowerCase());
                if (isMatch) {
                    const isMastered = mastered.some(m => m.toLowerCase() === skill.toLowerCase());
                    matched += isMastered ? 1.2 : 1;
                }
            });
            kwScore = Math.min(10, Math.round((matched / roleSkillsFromAPI.length) * 10));
        }
        cat2.checks.push({ label: 'Skills match role keywords', pts: 10, pass: kwScore >= 5, step: 5, earned: kwScore });
        const hasSoft = !!data.skills?.soft?.trim();
        cat2.checks.push({ label: 'Soft Skills filled', pts: 5, pass: hasSoft, step: hasSoft ? null : 5 });
        cat2.score = cat2.checks.reduce((s, c) => s + (c.earned !== undefined ? c.earned : (c.pass ? c.pts : 0)), 0);
        results.push(cat2);

        // CAT 3 — Content Completeness (25 pts)
        const cat3 = { label: 'Content Completeness', max: 25, checks: [] };
        const summaryOk = (data.summary || '').length >= 80;
        cat3.checks.push({ label: 'Summary (80+ chars)', pts: 8, pass: summaryOk, step: summaryOk ? null : 1 });
        const expOk = data.experience?.length > 0 && (data.experience[0]?.description || '').length > 30;
        cat3.checks.push({ label: 'Work Experience with description', pts: 7, pass: expOk, step: expOk ? null : 3 });
        const eduOk = data.education?.length > 0 && data.education[0]?.institution?.trim() && data.education[0]?.year?.trim();
        cat3.checks.push({ label: 'Education (institution + year)', pts: 5, pass: eduOk, step: eduOk ? null : 2 });
        const projOk = data.projects?.length >= 2 && data.projects.every(p => (p.description || '').length > 20);
        cat3.checks.push({ label: '2+ Projects with descriptions', pts: 5, pass: projOk, step: projOk ? null : 4 });
        cat3.score = cat3.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat3);

        // CAT 4 — Contact & Credibility (10 pts)
        const cat4 = { label: 'Contact & Credibility', max: 10, checks: [] };
        cat4.checks.push({ label: 'LinkedIn URL', pts: 3, pass: !!data.personalInfo?.linkedinUrl?.trim(), step: 1 });
        cat4.checks.push({ label: 'GitHub URL', pts: 3, pass: !!data.personalInfo?.githubUrl?.trim(), step: 1 });
        cat4.checks.push({ label: 'Location', pts: 2, pass: !!data.personalInfo?.location?.trim(), step: 1 });
        cat4.checks.push({ label: 'Portfolio / Website', pts: 2, pass: !!data.personalInfo?.portfolioUrl?.trim(), step: 1 });
        cat4.score = cat4.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat4);

        // CAT 5 — Impact & Context (10 pts)
        const cat5 = { label: 'Impact & Context', max: 10, checks: [] };
        cat5.checks.push({ label: '1+ Achievement/Award', pts: 3, pass: data.achievements?.length > 0, step: 6 });
        const metricRegex = /\d+(%|K|\+| years| months| users| projects)/i;
        const allDescriptions = [...(data.experience || []).map(e => e.description || ''), ...(data.projects || []).map(p => p.description || '')].join(' ');
        const hasMetrics = metricRegex.test(allDescriptions);
        cat5.checks.push({ label: 'Numbers/metrics in descriptions', pts: 4, pass: hasMetrics, step: 3 });
        const expSubstantive = (data.experience || []).every(e => (e.description || '').length >= 50);
        cat5.checks.push({ label: 'Substantive experience descriptions', pts: 3, pass: expSubstantive || data.experience?.length === 0, step: 3 });
        cat5.score = cat5.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat5);

        const total = results.reduce((s, c) => s + c.score, 0);
        return { total, breakdown: results };
    }, []);

    // Recalculate ATS score whenever resume data changes
    useEffect(() => {
        const roleSkillNames = [...masteredSkills, ...inProgressSkills, ...suggestedSkills];
        const { total, breakdown } = calculateATSScore(resumeData, masteredSkills, roleSkillNames);
        setAtsScore(total);
        setAtsBreakdown(breakdown);
    }, [resumeData, masteredSkills, inProgressSkills, suggestedSkills, calculateATSScore]);



    const cleanProfileValue = (value) => {
        if (value === null || value === undefined) return '';
        const text = String(value).trim();
        if (!text) return '';
        const lowered = text.toLowerCase();
        if (['not specified', 'n/a', 'na', 'none', 'null', 'undefined'].includes(lowered)) return '';
        return text;
    };

    const firstCleanValue = (...values) => {
        for (const value of values) {
            const cleaned = cleanProfileValue(value);
            if (cleaned) return cleaned;
        }
        return '';
    };

    const getAddressObject = (...sources) => {
        for (const source of sources) {
            if (source && typeof source === 'object' && !Array.isArray(source)) {
                const hasAddress = ['street', 'city', 'state', 'country'].some(key => cleanProfileValue(source[key]));
                if (hasAddress) return source;
            }
        }
        return {};
    };

    const buildCleanLocation = (...addresses) => {
        const address = getAddressObject(...addresses);
        const cityStateCountry = [address.city, address.state, address.country]
            .map(cleanProfileValue)
            .filter(Boolean);
        if (cityStateCountry.length > 0) return cityStateCountry.join(', ');
        return cleanProfileValue(address.street);
    };

    const joinClean = (...values) => values.map(cleanProfileValue).filter(Boolean).join(', ');

    const listFrom = (value) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.items)) return value.items;
        return [];
    };

    const uniqueCleanList = (...groups) => {
        const seen = new Set();
        const result = [];
        groups.flat().forEach(value => {
            const cleaned = cleanProfileValue(value);
            if (!cleaned) return;
            const key = cleaned.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            result.push(cleaned);
        });
        return result;
    };

    const formatResumeDate = (value) => {
        const cleaned = cleanProfileValue(value);
        if (!cleaned) return '';
        const date = new Date(cleaned);
        if (Number.isNaN(date.getTime())) return cleaned;
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const buildDateRange = (startDate, endDate, currentlyActive = false) => {
        const start = formatResumeDate(startDate);
        const end = currentlyActive ? 'Present' : formatResumeDate(endDate);
        if (start && end) return `${start} - ${end}`;
        return start || end;
    };

    const hydrateProfileWithRegisteredDetails = async (profileRes) => {
        const data = profileRes.richProfile || {};
        const reg = profileRes.registration || {};
        const student = profileRes.student || {};
        const user = profileRes.user || {};
        const sessionUser = (() => {
            try {
                return JSON.parse(sessionStorage.getItem('user') || '{}');
            } catch {
                return {};
            }
        })();
        const email = firstCleanValue(data.email, reg.email, student.email, user.email, sessionUser.email);

        if (!email) return profileRes;

        try {
            const registeredDetails = await apiCall(`/users/register-details/${encodeURIComponent(email)}`).catch(() => null);
            if (!registeredDetails || registeredDetails.error) return profileRes;

            return {
                ...profileRes,
                registration: {
                    ...reg,
                    ...registeredDetails,
                    address: {
                        ...(reg.address || {}),
                        ...(registeredDetails.address || {})
                    }
                },
                richProfile: {
                    ...data,
                    fullName: firstCleanValue(data.fullName, registeredDetails.fullName),
                    email: firstCleanValue(data.email, registeredDetails.email),
                    mobile: firstCleanValue(data.mobile, registeredDetails.mobileNumber)
                }
            };
        } catch (error) {
            console.warn('Failed to hydrate resume profile from registered details:', error);
            return profileRes;
        }
    };

    // Helper: build full resume data from profile API response
    const buildResumeDataFromProfile = (res, base = null) => {
        const data = res.richProfile || {};
        const reg = res.registration || {};
        const student = res.student || {};
        const user = res.user || {};

        // Mobile: richProfile already merges student/reg/user
        const mobile = firstCleanValue(
            data.mobile,
            reg.mobileNumber,
            student.mobileNumber,
            student.mobile,
            user.mobileNumber,
            user.mobile,
            base?.personalInfo?.mobile
        );

        const location = firstCleanValue(
            buildCleanLocation(reg.address, student.address, user.address, data.address),
            base?.personalInfo?.location
        );

        // Profile image
        const profileImage = firstCleanValue(
            reg.profilePhoto,
            student.profileImage,
            student.profilePhoto,
            user.profileImage,
            user.profilePhoto,
            user.otherDetails?.profilePhoto,
            base?.personalInfo?.profileImage
        );

        const defaultLoc = location || firstCleanValue(reg.address?.country, student.address?.country, user.address?.country);

        // Education
        const eduList = [];
        if (listFrom(reg.higherEducation).length > 0) {
            listFrom(reg.higherEducation).forEach(edu => {
                eduList.push({
                    degree: firstCleanValue(edu.degreeFullName, edu.degree, edu.qualificationLevel),
                    institution: firstCleanValue(edu.institutionName, edu.university, reg.institution, data.college),
                    year: firstCleanValue(edu.yearOfPassing, edu.graduationYear),
                    grade: firstCleanValue(edu.cgpaPercentage, edu.percentage, edu.grade),
                    location: firstCleanValue(edu.location, defaultLoc)
                });
            });
        } else if (reg.institution || data.college) {
            eduList.push({
                degree: firstCleanValue(reg.educationLevel, reg.academic?.degreeLevel, data.department, 'Student'),
                institution: firstCleanValue(reg.institution, data.college, 'SMAART Institute'),
                year: firstCleanValue(reg.yearOfPassing, data.batch),
                grade: '',
                location: defaultLoc
            });
        }
        if (reg.twelfthDetails?.schoolName) {
            eduList.push({
                degree: `12th Standard${cleanProfileValue(reg.twelfthDetails.stream) ? ` (${cleanProfileValue(reg.twelfthDetails.stream)})` : ''}`,
                institution: cleanProfileValue(reg.twelfthDetails.schoolName),
                year: cleanProfileValue(reg.twelfthDetails.yearOfPassing),
                grade: cleanProfileValue(reg.twelfthDetails.percentage),
                location: defaultLoc
            });
        }
        if (reg.tenthDetails?.schoolName) {
            eduList.push({
                degree: '10th Standard',
                institution: cleanProfileValue(reg.tenthDetails.schoolName),
                year: cleanProfileValue(reg.tenthDetails.yearOfPassing),
                grade: cleanProfileValue(reg.tenthDetails.percentage),
                location: defaultLoc
            });
        }

        // Experience
        let experience = base?.experience || [];
        if (listFrom(reg.workExperience).length > 0) {
            experience = listFrom(reg.workExperience).map(exp => ({
                role: firstCleanValue(exp.jobTitle, exp.role, exp.designation, exp.experienceType),
                company: firstCleanValue(exp.organizationName, exp.companyName, exp.company),
                duration: firstCleanValue(
                    exp.duration,
                    buildDateRange(exp.startDate, exp.endDate, exp.currentlyWorking)
                ),
                location: firstCleanValue(exp.location, defaultLoc),
                description: joinClean(
                    exp.description,
                    exp.keyResponsibilities,
                    exp.significantAccomplishments
                )
            }));
        } else if (cleanProfileValue(data.experience) && !cleanProfileValue(data.experience).includes('Batch')) {
            experience = [{ role: 'Professional', company: cleanProfileValue(data.experience), duration: '', location: defaultLoc, description: '' }];
        }

        // Projects
        let projects = base?.projects || [];
        if (listFrom(reg.projects).length > 0) {
            projects = listFrom(reg.projects).map(p => ({
                title: cleanProfileValue(p.title),
                description: joinClean(
                    p.description,
                    p.significantAchievements,
                    p.doneIn,
                    p.institution,
                    p.companyName,
                    p.teamType
                ),
                link: firstCleanValue(p.link, p.projectUrl)
            }));
        } else if (cleanProfileValue(data.projects)) {
            projects = [{ title: 'Key Project', description: cleanProfileValue(data.projects), link: '' }];
        }

        // Achievements
        const achievementList = [];
        if (listFrom(reg.certificates).length > 0) {
            listFrom(reg.certificates).forEach(c => {
                const issuer = firstCleanValue(c.issuingOrg, c.issuer);
                const completion = firstCleanValue(c.yearOfCompletion, formatResumeDate(c.issueDate));
                achievementList.push({
                    title: cleanProfileValue(c.title),
                    description: joinClean(
                        issuer ? `Issued by ${issuer}` : '',
                        completion ? `Completed ${completion}` : ''
                    ),
                    link: firstCleanValue(c.link, c.verificationUrl)
                });
            });
        }
        if (listFrom(reg.extracurricular).length > 0) {
            listFrom(reg.extracurricular).forEach(e => achievementList.push({
                title: firstCleanValue(e.customActivityType, e.activityType, 'Extracurricular Activity'),
                description: joinClean(e.level, e.achievements, e.description),
                link: ''
            }));
        }
        if (achievementList.length === 0 && cleanProfileValue(data.certificates)) {
            achievementList.push({ title: 'Certification', description: cleanProfileValue(data.certificates), link: '' });
        }

        // Target role
        const profileTargetRole = cleanProfileValue(data.targetRole);
        const targetRole = profileTargetRole && profileTargetRole !== 'Professional'
            ? profileTargetRole
            : firstCleanValue(
                selectedCareerPath?.roleName,
                careerPaths.primary,
                reg.jobPreferences?.[0]?.preferredRole,
                base?.personalInfo?.targetRole
            );

        const technicalSkills = uniqueCleanList(
            listFrom(data.skills),
            listFrom(reg.skills),
            listFrom(reg.technicalSkills),
            listFrom(reg.certificates).map(c => c.title),
            reg.sectorPreferences?.preferredSectors || [],
            reg.sectorPreferences?.secondarySectors || [],
            base?.skills?.technical ? base.skills.technical.split(',') : []
        ).join(', ');

        return {
            personalInfo: {
                fullName: firstCleanValue(data.fullName, reg.fullName, student.fullName, user.fullName, base?.personalInfo?.fullName),
                email: firstCleanValue(data.email, reg.email, student.email, user.email, base?.personalInfo?.email),
                mobile,
                location,
                targetRole,
                linkedinUrl: base?.personalInfo?.linkedinUrl || '',
                githubUrl: base?.personalInfo?.githubUrl || '',
                portfolioUrl: base?.personalInfo?.portfolioUrl || '',
                profileImage,
            },
            summary: firstCleanValue(reg.bio, data.summary, base?.summary),
            education: eduList.length > 0 ? eduList : (base?.education || []),
            experience,
            skills: {
                technical: technicalSkills,
                soft: base?.skills?.soft || '',
                languages: base?.skills?.languages || ''
            },
            projects,
            achievements: achievementList.length > 0 ? achievementList : (base?.achievements || []),
            personalDetails: base?.personalDetails || { fatherName: '', motherName: '', dob: '', nationality: '' }
        };
    };

    const handleSyncProfile = async (silent = false) => {
        setIsSyncing(true);
        try {
            const res = await aiCareerCoachApi.getProfile();
            if (res.success) {
                const hydratedRes = await hydrateProfileWithRegisteredDetails(res);
                setResumeData(prev => buildResumeDataFromProfile(hydratedRes, prev));
                if (!silent) toast.success('Profile data synced successfully!');
            } else {
                if (!silent) toast.error('Failed to sync profile. Please try again.');
            }
        } catch (error) {
            console.error('Sync error:', error);
            if (!silent) toast.error('Failed to sync profile');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async (showToast = true) => {
        setSaving(true);
        try {
            const payload = {
                ...resumeData,
                atsScore,
                versionName,
                targetRole: resumeData.personalInfo?.targetRole || '',
            };

            if (resumeId) {
                await resumeApi.updateResume(resumeId, payload);
                if (showToast) toast.success('Resume updated successfully!');
            } else {
                const res = await resumeApi.createResume(payload);
                if (res.success) {
                    setResumeId(res.data._id);
                    if (showToast) toast.success('Resume saved successfully!');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save resume');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateNew = async () => {
        setResumeId(null);
        setVersionName('New Resume');
        setAtsScore(0);
        setSelectedCareerPath(careerPaths.primary ? { key: 'primary', roleName: careerPaths.primary } : null);
        setCurrentStep(0);
        setPageMode('builder');
        setIsSyncing(true);

        try {
            // Fetch profile FIRST, then build the full resume data in one atomic update
            // This avoids the race condition where setResumeData(empty) and handleSyncProfile
            // would run in parallel, causing sync to read stale prev state.
            const res = await aiCareerCoachApi.getProfile();
            if (res.success) {
                const hydratedRes = await hydrateProfileWithRegisteredDetails(res);
                const newResumeData = buildResumeDataFromProfile(hydratedRes, null);
                setResumeData(newResumeData);
            } else {
                // Fallback to blank slate if profile fetch fails
                setResumeData({
                    personalInfo: { fullName: '', email: '', mobile: '', location: '', targetRole: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', profileImage: '' },
                    summary: '',
                    experience: [],
                    education: [],
                    skills: { technical: '', soft: '', languages: '' },
                    projects: [],
                    achievements: [],
                    personalDetails: { fatherName: '', motherName: '', dob: '', nationality: '' }
                });
            }
        } catch (error) {
            console.error('Failed to load profile for new resume:', error);
            // Fallback to blank slate
            setResumeData({
                personalInfo: { fullName: '', email: '', mobile: '', location: '', targetRole: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', profileImage: '' },
                summary: '',
                experience: [],
                education: [],
                skills: { technical: '', soft: '', languages: '' },
                projects: [],
                achievements: [],
                personalDetails: { fatherName: '', motherName: '', dob: '', nationality: '' }
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleGenerateSummary = async () => {
        // Validation: Ensure they have at least a target role or some experience/education
        const hasExperience = resumeData.experience && resumeData.experience.length > 0;
        const hasEducation = resumeData.education && resumeData.education.length > 0;
        const targetRole = resumeData.personalInfo?.targetRole || selectedCareerPath?.roleName;

        if (!targetRole && !hasExperience && !hasEducation) {
            toast.error("Please fill out your Target Role, Experience, or Education first so the AI has context to write your summary.");
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const res = await aiCareerCoachApi.generateSummary(resumeData, targetRole);
            if (res.success && res.summary) {
                setResumeData(prev => ({ ...prev, summary: res.summary }));
                toast.success('Professional summary generated successfully!');
            } else {
                toast.error(res.message || 'Failed to generate summary.');
            }
        } catch (error) {
            console.error('Error generating summary:', error);
            toast.error('An error occurred while generating the summary.');
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleEditResume = (resume) => {
        setResumeId(resume._id);
        setVersionName(resume.versionName || 'My Resume');
        setAtsScore(resume.atsScore || 0);
        
        // If the resume has a targetRole that matches one of their paths, auto-select it
        if (resume.targetRole) {
            const foundKey = Object.keys(careerPaths).find(key => careerPaths[key] === resume.targetRole);
            if (foundKey) {
                setSelectedCareerPath({ key: foundKey, roleName: resume.targetRole });
            } else {
                setSelectedCareerPath({ key: 'custom', roleName: resume.targetRole });
            }
        }

        setResumeData({
            personalInfo: resume.personalInfo || {},
            summary: resume.summary || '',
            experience: resume.experience || [],
            education: resume.education || [],
            skills: resume.skills || { technical: '', soft: '', languages: '' },
            projects: resume.projects || [],
            achievements: resume.achievements || [],
            personalDetails: resume.personalDetails || { fatherName: '', motherName: '', dob: '', nationality: '' }
        });
        
        setCurrentStep(0);
        setPageMode('builder');
    };

    const handleDuplicateResume = async (id, e) => {
        if (e) e.stopPropagation();
        setDuplicatingId(id);
        try {
            const res = await resumeApi.duplicateResume(id);
            if (res.success) {
                toast.success('Resume duplicated!');
                fetchResumeList();
            }
        } catch (err) {
            toast.error('Failed to duplicate resume');
        } finally {
            setDuplicatingId(null);
        }
    };

    const handleDeleteResume = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this resume?')) return;
        setDeletingId(id);
        try {
            const res = await resumeApi.deleteResume(id);
            if (res.success) {
                toast.success('Resume deleted');
                fetchResumeList();
            }
        } catch (err) {
            toast.error('Failed to delete resume');
        } finally {
            setDeletingId(null);
        }
    };

    const renameResume = async (id, newName) => {
        if (!newName.trim()) return;
        try {
            await resumeApi.updateResume(id, { versionName: newName.trim() });
            toast.success('Name updated');
            fetchResumeList();
            setRenamingId(null);
        } catch (err) {
            toast.error('Failed to rename');
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('resume-preview');
        if (!element) return;

        setGenerating(true);
        try {
            let activeResumeId = resumeId;
            if (!activeResumeId) {
                const created = await resumeApi.createResume(resumeData);
                if (!created?.success) {
                    throw new Error(created?.message || 'Save resume before exporting');
                }
                activeResumeId = created.data._id;
                setResumeId(activeResumeId);
            } else {
                await resumeApi.updateResume(activeResumeId, resumeData);
            }

            const exportRes = await resumeApi.issueExport(activeResumeId);
            if (!exportRes?.success) {
                const retryMinutes = exportRes?.retryAfter || 60;
                toast.error(
                    exportRes?.error ||
                    exportRes?.message ||
                    `Export limit reached. Try again in ${retryMinutes} minutes.`
                );
                return;
            }

            const issued = exportRes.data;
            setResumePublicId(issued.resumePublicId);
            setResumeFingerprint(issued.fingerprint);
            setVerificationUrl(issued.verificationUrl || buildVerificationUrl(issued.resumePublicId, issued.fingerprint));

            await new Promise((resolve) => setTimeout(resolve, 150));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            applyPdfWatermarks(pdf, pdfWidth, pageHeight, issued.resumePublicId, studentId);

            pdf.save(
                `${normalizeText(resumeData.personalInfo.fullName) || 'Resume'}_${issued.resumePublicId}.pdf`
            );
            toast.success('Verified PDF downloaded with org watermark and QR.');
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.message || 'Failed to generate PDF');
        } finally {
            setGenerating(false);
        }
    };

    const addArrayItem = (key, emptyItem) => {
        setResumeData(prev => ({
            ...prev,
            [key]: [...prev[key], emptyItem]
        }));
    };

    const removeArrayItem = (key, index) => {
        setResumeData(prev => ({
            ...prev,
            [key]: prev[key].filter((_, i) => i !== index)
        }));
    };

    const handleArrayChange = (key, index, field, value) => {
        setResumeData(prev => {
            const newArray = [...prev[key]];
            newArray[index] = { ...newArray[index], [field]: value };
            return { ...prev, [key]: newArray };
        });
    };

    const handleNestedChange = (parent, field, value) => {
        setResumeData(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    useEffect(() => {
        const handleResize = () => {
            if (!containerRef.current) return;
            const parentWidth = containerRef.current.getBoundingClientRect().width;
            const canvasWidth = 794; // 210mm in pixels
            const padding = window.innerWidth < 768 ? 24 : 64; // md:p-12 vs p-8
            const availableWidth = parentWidth - padding;

            if (availableWidth < canvasWidth) {
                setScale(availableWidth / canvasWidth);
            } else {
                setScale(1);
            }
        };

        window.addEventListener('resize', handleResize);
        const timer = setTimeout(handleResize, 100);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [currentStep, loading]);

    const isValidUrl = (url) => {
        if (!url || !url.trim()) return true;
        try {
            const urlToTest = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
            new URL(urlToTest);
            return urlToTest.includes('.');
        } catch (_) {
            return false;
        }
    };

    const validateStep = (stepIndex) => {
        const stepId = steps[stepIndex]?.id;
        if (!stepId) return true;

        if (stepId === 'personal') {
            const info = resumeData.personalInfo || {};
            const details = resumeData.personalDetails || {};
            
            if (!info.targetRole?.trim()) {
                toast.error("Please enter your Target Role.");
                return false;
            }
            if (!info.email?.trim()) {
                toast.error("Please enter your Email Address.");
                return false;
            }
            if (!info.mobile?.trim()) {
                toast.error("Please enter your Mobile Number.");
                return false;
            }
            if (!info.location?.trim()) {
                toast.error("Please enter your Location.");
                return false;
            }
            if (!info.linkedinUrl?.trim()) {
                toast.error("Please enter your LinkedIn URL.");
                return false;
            } else if (!isValidUrl(info.linkedinUrl)) {
                toast.error("Please enter a valid LinkedIn URL.");
                return false;
            }
            if (!info.githubUrl?.trim()) {
                toast.error("Please enter your GitHub URL.");
                return false;
            } else if (!isValidUrl(info.githubUrl)) {
                toast.error("Please enter a valid GitHub URL.");
                return false;
            }
            if (info.portfolioUrl?.trim() && !isValidUrl(info.portfolioUrl)) {
                toast.error("Please enter a valid Portfolio URL.");
                return false;
            }

            if (!resumeData.summary?.trim()) {
                toast.error("Please enter a Professional Summary.");
                return false;
            }
        }

        if (stepId === 'education') {
            if (!resumeData.education || resumeData.education.length === 0) {
                toast.error("Please add at least one Education entry.");
                return false;
            }
            for (let i = 0; i < resumeData.education.length; i++) {
                const edu = resumeData.education[i];
                if (!edu.institution?.trim()) {
                    toast.error(`Please enter Institution Name for Education entry #${i + 1}.`);
                    return false;
                }
                if (!edu.degree?.trim()) {
                    toast.error(`Please enter Degree for Education entry #${i + 1}.`);
                    return false;
                }
                if (!edu.year?.trim()) {
                    toast.error(`Please enter Year of Passing for Education entry #${i + 1}.`);
                    return false;
                }
                if (!edu.grade?.trim()) {
                    toast.error(`Please enter Grade / CGPA for Education entry #${i + 1}.`);
                    return false;
                }
                if (!edu.location?.trim()) {
                    toast.error(`Please enter Location for Education entry #${i + 1}.`);
                    return false;
                }
            }
        }

        if (stepId === 'experience') {
            for (let i = 0; i < resumeData.experience.length; i++) {
                const exp = resumeData.experience[i];
                if (!exp.company?.trim()) {
                    toast.error(`Please enter Company Name for Experience entry #${i + 1}.`);
                    return false;
                }
                if (!exp.role?.trim()) {
                    toast.error(`Please enter Role / Position for Experience entry #${i + 1}.`);
                    return false;
                }
                if (!exp.duration?.trim()) {
                    toast.error(`Please enter Duration for Experience entry #${i + 1}.`);
                    return false;
                }
                if (!exp.description?.trim()) {
                    toast.error(`Please enter Description for Experience entry #${i + 1}.`);
                    return false;
                }
            }
        }

        if (stepId === 'projects') {
            if (!resumeData.projects || resumeData.projects.length === 0) {
                toast.error("Please add at least one Project.");
                return false;
            }
            for (let i = 0; i < resumeData.projects.length; i++) {
                const proj = resumeData.projects[i];
                if (!proj.title?.trim()) {
                    toast.error(`Please enter Title for Project entry #${i + 1}.`);
                    return false;
                }
                if (!proj.description?.trim()) {
                    toast.error(`Please enter Description for Project entry #${i + 1}.`);
                    return false;
                }
                if (proj.link?.trim() && !isValidUrl(proj.link)) {
                    toast.error(`Please enter a valid URL for Project entry #${i + 1}.`);
                    return false;
                }
            }
        }

        if (stepId === 'skills') {
            const skills = resumeData.skills || {};
            if (!skills.technical?.trim()) {
                toast.error("Please enter Technical Skills.");
                return false;
            }
            if (!skills.soft?.trim()) {
                toast.error("Please enter Soft Skills.");
                return false;
            }
            if (!skills.languages?.trim()) {
                toast.error("Please enter Languages.");
                return false;
            }
        }

        if (stepId === 'achievements') {
            for (let i = 0; i < resumeData.achievements.length; i++) {
                const ach = resumeData.achievements[i];
                if (!ach.title?.trim()) {
                    toast.error(`Please enter Title for Award entry #${i + 1}.`);
                    return false;
                }
                if (!ach.description?.trim()) {
                    toast.error(`Please enter Description for Award entry #${i + 1}.`);
                    return false;
                }
                if (ach.link?.trim() && !isValidUrl(ach.link)) {
                    toast.error(`Please enter a valid URL for Award entry #${i + 1}.`);
                    return false;
                }
            }
        }

        return true;
    };

    const handleStepClick = (idx) => {
        if (idx <= currentStep) {
            setCurrentStep(idx);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            for (let s = currentStep; s < idx; s++) {
                if (!validateStep(s)) return;
            }
            setCurrentStep(idx);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            if (!validateStep(currentStep)) return;
            setCurrentStep(currentStep + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                    </div>
                    <p className="text-[#1a3884] dark:text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Builder...</p>
                </div>
            </div>
        );
    }

    // --- SVG Circular Score Ring ---
    const CircularScoreRing = ({ score, size = 120, strokeWidth = 10, label = "ATS" }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (score / 100) * circumference;
        
        let colorClass = "text-emerald-500";
        let glowClass = "drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
        if (score < 50) {
            colorClass = "text-rose-500";
            glowClass = "drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]";
        } else if (score < 80) {
            colorClass = "text-amber-500";
            glowClass = "drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]";
        }

        const count = useMotionValue(0);
        const rounded = useTransform(count, Math.round);
        const [displayScore, setDisplayScore] = useState(0);

        useEffect(() => {
            const controls = animate(count, score, {
                duration: 1.5,
                ease: "easeOut",
            });
            return controls.stop;
        }, [score]);

        useEffect(() => {
            const unsubscribe = rounded.on("change", (v) => setDisplayScore(v));
            return () => unsubscribe();
        }, [rounded]);

        return (
            <motion.div 
                className="relative flex items-center justify-center group" 
                style={{ width: size, height: size }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                <div className={`absolute inset-0 rounded-full ${glowClass} opacity-50 group-hover:opacity-100 animate-pulse transition-opacity duration-500`} />
                <motion.svg className="transform -rotate-90 w-full h-full relative z-10">
                    {/* Background circle */}
                    <circle 
                        cx={size / 2} cy={size / 2} r={radius} 
                        stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" 
                        className="text-slate-100 dark:text-slate-800" 
                    />
                    {/* Progress circle */}
                    <motion.circle 
                        cx={size / 2} cy={size / 2} r={radius} 
                        stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" 
                        strokeDasharray={circumference} 
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        className={colorClass} 
                    />
                </motion.svg>
                <div className="absolute flex flex-col items-center justify-center text-center z-20">
                    <span 
                        className="font-black text-slate-800 dark:text-white leading-none tracking-tighter"
                        style={{ fontSize: `${Math.max(14, size * 0.28)}px` }}
                    >
                        {displayScore}
                    </span>
                    {label && (
                        <span 
                            className="font-bold text-slate-400 uppercase tracking-widest mt-0.5"
                            style={{ fontSize: `${Math.max(8, size * 0.08)}px` }}
                        >
                            {label}
                        </span>
                    )}
                </div>
            </motion.div>
        );
    };

    if (pageMode === 'list') {
        return (
            <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#00152E] overflow-hidden font-sans selection:bg-[#1a3884] selection:text-white">
                <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {/* Page Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex-1">
                                <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                    My <span className="text-[#1a3884] dark:text-blue-300">Resumes</span>
                                </h1>
                                <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                                    Manage your tailored resumes and track your ATS optimization scores.
                                </p>
                            </div>

                            <div className="flex-shrink-0 border-t md:border-t-0 md:border-l border-[#d8e6f7] dark:border-[#1a3884]/20 pt-3 md:pt-0 md:pl-6">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCreateNew}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-[#1a3884] px-4 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-[#112b6b] dark:bg-blue-600 dark:hover:bg-blue-700"
                                >
                                    <IconPlus stroke={2.5} className="h-3.5 w-3.5" />
                                    Create New Resume
                                </motion.button>
                            </div>
                        </motion.div>
                        {resumeListLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a3884]"></div>
                            </div>
                        ) : resumeList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-[#1a3884]/20 flex items-center justify-center mb-4">
                                    <IconFileDescription stroke={1.5} className="w-8 h-8 text-[#1a3884] dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No resumes found</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">Create your first ATS-optimized resume to get started on your career journey.</p>
                                <button onClick={handleCreateNew} className="px-6 py-2.5 bg-[#1a3884] text-white rounded-xl font-bold text-sm hover:bg-[#132c6b] transition-colors shadow-md">
                                    Create First Resume
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {resumeList.map(resume => (
                                    <div key={resume._id} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500/30 transition-all duration-300 overflow-hidden flex flex-col group">
                                        
                                        <div className="p-6 flex-1 flex flex-col items-center relative">
                                            {/* Score Ring */}
                                            <div className="mb-4 relative">
                                                <CircularScoreRing score={resume.atsScore || 0} size={100} strokeWidth={8} />
                                            </div>

                                            {renamingId === resume._id ? (
                                                <div className="w-full mb-2">
                                                    <input 
                                                        autoFocus
                                                        value={renameValue}
                                                        onChange={e => setRenameValue(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') renameResume(resume._id, renameValue);
                                                            if (e.key === 'Escape') setRenamingId(null);
                                                        }}
                                                        onBlur={() => renameResume(resume._id, renameValue)}
                                                        className="w-full text-center font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 border-b-2 border-[#1a3884] outline-none px-2 py-1"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 mb-2 w-full justify-center group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-lg p-1 transition-colors cursor-text" onClick={() => { setRenamingId(resume._id); setRenameValue(resume.versionName || 'My Resume'); }}>
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[80%]">{resume.versionName || 'My Resume'}</h3>
                                                    <IconPencil stroke={2} className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#1a3884]/20 text-[#1a3884] dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-[#1a3884]/30">
                                                <IconTarget stroke={2} className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">{resume.targetRole || 'General Resume'}</span>
                                            </div>

                                            <p className="text-[10px] text-slate-400 font-medium">Last updated: {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                        </div>

                                        <div className="grid grid-cols-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                            <button onClick={() => handleEditResume(resume)} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[#1a3884] hover:text-white text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-100 dark:border-white/5">
                                                <IconPencil stroke={1.5} className="w-4 h-4" />
                                                <span className="text-[10px] font-bold">Edit</span>
                                            </button>
                                            <button onClick={(e) => handleDuplicateResume(resume._id, e)} disabled={duplicatingId === resume._id} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[#1a3884] hover:text-white text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-100 dark:border-white/5 disabled:opacity-50">
                                                {duplicatingId === resume._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconCopy stroke={1.5} className="w-4 h-4" />}
                                                <span className="text-[10px] font-bold">Copy</span>
                                            </button>
                                            <button onClick={(e) => handleDeleteResume(resume._id, e)} disabled={deletingId === resume._id} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50">
                                                {deletingId === resume._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconTrash stroke={1.5} className="w-4 h-4" />}
                                                <span className="text-[10px] font-bold">Delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        );
    }

    // --- Builder Mode Return ---
    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#00152E] overflow-hidden font-sans selection:bg-[#1a3884] selection:text-white">
            {/* Header */}
            <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/8 z-30 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={async () => {
                        await fetchResumeList();
                        setPageMode('list');
                    }} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-bold text-[11px] text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        <IconArrowLeft stroke={2} className="w-3.5 h-3.5" /> Back
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1a3884] flex items-center justify-center shadow-sm relative group cursor-help">
                            {/* Small ATS Score instead of icon */}
                            <div className="absolute inset-0 flex items-center justify-center font-black text-white text-sm">
                                {atsScore}
                            </div>
                            <svg className="transform -rotate-90 w-full h-full">
                                <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="transparent" />
                                <circle cx="20" cy="20" r="18" stroke="#10b981" strokeWidth="3" fill="transparent" 
                                    strokeDasharray={18 * 2 * Math.PI} 
                                    strokeDashoffset={(18 * 2 * Math.PI) - ((atsScore / 100) * (18 * 2 * Math.PI))} 
                                    className={`${atsScore >= 80 ? 'stroke-emerald-400' : atsScore >= 50 ? 'stroke-amber-400' : 'stroke-rose-400'} transition-all duration-1000`} 
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="relative flex items-center group">
                                <input
                                    value={versionName}
                                    onChange={(e) => setVersionName(e.target.value)}
                                    className="text-[17px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#1a3884] outline-none transition-colors w-[200px] pr-6"
                                    placeholder="Resume Name"
                                />
                                <IconPencil stroke={2} className="w-3.5 h-3.5 text-slate-400 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">ATS Score Status</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{resumePublicId || 'Secure Resume'}</span>
                    </div>
                    {currentStep !== steps.length - 1 && (
                        <button onClick={() => handleStepClick(steps.length - 1)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-[#002A5C] hover:bg-slate-100 dark:hover:bg-[#003575] text-slate-700 dark:text-slate-200 rounded-xl transition-all font-semibold text-xs border border-slate-200 dark:border-white/10 shadow-sm">
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                        </button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-[#002A5C] hover:bg-slate-100 dark:hover:bg-[#003575] text-slate-700 dark:text-slate-205 rounded-xl transition-all font-semibold text-xs border border-slate-200 dark:border-white/10 disabled:opacity-50 shadow-sm">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Save Progress</span>
                    </button>
                    {currentStep === steps.length - 1 && (
                        <button onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-xl transition-all font-semibold text-xs shadow-md shadow-blue-600/10 hover:shadow-lg disabled:opacity-50">
                            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            <span>Download PDF</span>
                        </button>
                    )}
                </div>
            </header>
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Form Section */}
                <section className={`flex-1 flex-col relative ${currentStep === steps.length - 1 ? 'hidden' : 'flex w-full'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-10">
                            {/* Modern Responsive Stepper */}
                            <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-bold text-[#1a3884] dark:text-blue-400 uppercase tracking-widest">
                                        Step {currentStep + 1} of {steps.length}
                                    </span>
                                </div>
                                
                                {/* Progress Bar / Stepper Track */}
                                <div className="relative flex items-center justify-between w-full px-6 sm:px-16">
                                    {/* Track line container */}
                                    <div className="absolute left-10 sm:left-20 right-10 sm:right-20 top-1/2 -translate-y-1/2 h-1 -z-0">
                                        {/* Background Track Line */}
                                        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                                        {/* Active Progress Line */}
                                        <div 
                                            className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-500 to-[#1a3884] rounded-full transition-all duration-550 ease-in-out"
                                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                                        />
                                    </div>

                                    {steps.map((step, idx) => {
                                        const Icon = step.icon;
                                        const isActive = idx === currentStep;
                                        const isCompleted = idx < currentStep;
                                        
                                        return (
                                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                                <button
                                                    onClick={() => handleStepClick(idx)}
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                                                        isActive 
                                                            ? 'bg-[#1a3884] text-white ring-4 ring-blue-500/20 scale-110 shadow-md shadow-blue-500/10'
                                                            : isCompleted
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                : 'bg-white dark:bg-[#002147] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20'
                                                    }`}
                                                    title={step.label}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <Icon className="w-4 h-4" />
                                                    )}
                                                </button>
                                                
                                                {/* Step label - hidden on mobile to avoid layout crowding */}
                                                <span className={`absolute top-11 text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block transition-all duration-300 ${
                                                    isActive 
                                                        ? 'text-[#1a3884] dark:text-blue-400 font-extrabold scale-105'
                                                        : isCompleted
                                                            ? 'text-emerald-600 dark:text-emerald-450'
                                                            : 'text-slate-400 dark:text-slate-500'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-6 sm:h-8" aria-hidden="true" /> {/* spacing for labels */}
                            </div>

                            <div className="min-h-[400px]">
                                {steps[currentStep].id === 'personal' && (
                                    <div className="space-y-6">
                                        {/* Career Path Selection Banner/Cards */}
                                        <div className="bg-white dark:bg-[#002147] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                                            {careerLoading ? (
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm font-medium">Checking career direction...</span>
                                                </div>
                                            ) : careerPaths?.primary ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {careerLocked ? (
                                                            <IconLock stroke={2} className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                                        ) : (
                                                            <IconLockOpen stroke={2} className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                                        )}
                                                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">Select Target Career Path</h3>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Choose one of your career paths to automatically optimize this resume.</p>
                                                    
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                                        {['primary', 'secondary', 'tertiary'].map(key => {
                                                            const roleName = careerPaths[key];
                                                            if (!roleName) return null;
                                                            const isSelected = selectedCareerPath?.key === key;
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    onClick={() => {
                                                                        setSelectedCareerPath({ key, roleName });
                                                                        handleNestedChange('personalInfo', 'targetRole', roleName);
                                                                    }}
                                                                    className={`flex flex-col text-left py-2.5 px-3 rounded-xl border transition-all ${isSelected ? 'border-[#1a3884] bg-blue-50/50 dark:bg-[#1a3884]/20 ring-1 ring-[#1a3884]' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                                                >
                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-[#1a3884] dark:text-blue-300' : 'text-slate-400'}`}>{key} Path</span>
                                                                    <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-[#1a3884] dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{roleName}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {!careerLocked && (
                                                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-2 items-start">
                                                            <IconLockOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-amber-700 dark:text-amber-500">Note: Your career direction is currently in evaluation mode. Your latest analysis will automatically lock as your permanent career path after 14 days or once you use all 5 attempts.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                                    <IconLockOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-1">No Career Path Found</h4>
                                                        <p className="text-xs text-amber-700/80 dark:text-amber-500/80">Complete your AI Career Analysis in the Career Agent to automatically tailor your resume and skills.</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6 bg-white dark:bg-[#002147] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Profile Photo (Optional)</label>
                                                <div className="flex items-center gap-4">
                                                    {resumeData.personalInfo.profileImage ? (
                                                        <div className="relative w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0 group/photo">
                                                            <img src={resumeData.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                            <button 
                                                                onClick={() => handleNestedChange('personalInfo', 'profileImage', '')}
                                                                className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                                                            <User className="w-6 h-6 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        handleNestedChange('personalInfo', 'profileImage', reader.result);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                            className="block w-full text-xs text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#1a3884] hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300 dark:hover:file:bg-blue-900/50 cursor-pointer"
                                                        />
                                                        <p className="text-[10px] text-slate-400 mt-1">Recommended for Modern Profile template. Max size 2MB.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
                                                <div className="relative group/input">
                                                    <User className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                    <input type="text" value={resumeData.personalInfo.fullName} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F1F5F9] dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl outline-none cursor-not-allowed text-slate-700 dark:text-slate-400 transition-all text-sm font-semibold shadow-sm" title="Full name is verified from your profile and cannot be changed here." />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Target Role</label>
                                                <div className="relative group/input">
                                                    <Briefcase className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                    <input type="text" placeholder="Select a career path above" value={resumeData.personalInfo.targetRole} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F1F5F9] dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl outline-none cursor-not-allowed text-slate-700 dark:text-slate-400 transition-all text-sm font-semibold shadow-sm" title="Target Role is automatically set based on your selected Career Path." />
                                                </div>
                                            </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                                                <div className="relative group/input">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="email" placeholder="email@example.com" value={resumeData.personalInfo.email} onChange={(e) => handleNestedChange('personalInfo', 'email', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Mobile Number</label>
                                                <div className="relative group/input">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="+91 00000 00000" value={resumeData.personalInfo.mobile} onChange={(e) => handleNestedChange('personalInfo', 'mobile', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Location</label>
                                            <div className="relative group/input">
                                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                <input type="text" placeholder="City, State, Country" value={resumeData.personalInfo.location} onChange={(e) => handleNestedChange('personalInfo', 'location', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">LinkedIn URL</label>
                                                <div className="relative group/input">
                                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="linkedin.com/in/username" value={resumeData.personalInfo.linkedinUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'linkedinUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">GitHub URL</label>
                                                <div className="relative group/input">
                                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="github.com/username" value={resumeData.personalInfo.githubUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'githubUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>



                                        <div className="group">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Professional Summary</label>
                                                <button 
                                                    onClick={handleGenerateSummary}
                                                    disabled={isGeneratingSummary}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                >
                                                    {isGeneratingSummary ? (
                                                        <><Loader2 className="w-3 h-3 animate-spin" /> Generating...</>
                                                    ) : (
                                                        <><Sparkles className="w-3 h-3" /> Generate with AI</>
                                                    )}
                                                </button>
                                            </div>
                                            <textarea value={resumeData.summary} onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))} rows={4} className="w-full p-4 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm resize-none" placeholder="A brief overview of your professional background and key strengths..."></textarea>
                                        </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'experience' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.experience.map((exp, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                            <Briefcase className="w-4 h-4 text-blue-500" />
                                                            {exp.company || 'Work Experience'}
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('experience', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Company</label>
                                                                <input type="text" placeholder="Company Name" value={exp.company} onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Job Role</label>
                                                                <input type="text" placeholder="e.g. Project Associate" value={exp.role} onChange={(e) => handleArrayChange('experience', idx, 'role', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Duration</label>
                                                                <input type="text" placeholder="e.g. 2021 - Present" value={exp.duration} onChange={(e) => handleArrayChange('experience', idx, 'duration', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Location</label>
                                                                <input type="text" placeholder="City, State" value={exp.location} onChange={(e) => handleArrayChange('experience', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                                                            <textarea placeholder="Key responsibilities and achievements..." value={exp.description} onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[100px] resize-none" rows={4}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', location: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#1a3884] hover:text-[#1a3884] transition-all">
                                            <Plus className="w-5 h-5" /> Add Experience
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'education' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.education.map((edu, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                            <GraduationCap className="w-4 h-4 text-emerald-500" />
                                                            {edu.institution || 'Education Details'}
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('education', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Institution Name</label>
                                                            <input type="text" placeholder="College / University Name" value={edu.institution} onChange={(e) => handleArrayChange('education', idx, 'institution', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Degree</label>
                                                                <input type="text" placeholder="e.g. MCA or B.Tech" value={edu.degree} onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Year of Passing</label>
                                                                <input type="text" placeholder="e.g. 2025" value={edu.year} onChange={(e) => handleArrayChange('education', idx, 'year', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Grade / CGPA</label>
                                                                <input type="text" placeholder="e.g. 8.5 CGPA" value={edu.grade} onChange={(e) => handleArrayChange('education', idx, 'grade', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Location</label>
                                                                <input type="text" placeholder="City, State" value={edu.location} onChange={(e) => handleArrayChange('education', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('education', { institution: '', degree: '', grade: '', year: '', location: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                                            <Plus className="w-5 h-5" /> Add Education
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'projects' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.projects.map((proj, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                            <FileText className="w-4 h-4 text-indigo-500" />
                                                            {proj.title || 'Project Details'}
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('projects', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Project Title</label>
                                                                <input type="text" placeholder="Project Name" value={proj.title} onChange={(e) => handleArrayChange('projects', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Project Link</label>
                                                                <input type="text" placeholder="URL or [Link]" value={proj.link} onChange={(e) => handleArrayChange('projects', idx, 'link', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                                                            <textarea placeholder="Describe the technology and your contribution..." value={proj.description} onChange={(e) => handleArrayChange('projects', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[80px] resize-none" rows={3}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('projects', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-500 hover:text-indigo-500 transition-all">
                                            <Plus className="w-5 h-5" /> Add Project
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'skills' && (
                                    <div className="space-y-6">
                                        {/* Skill Chips from Career Agent */}
                                        {(masteredSkills.length > 0 || inProgressSkills.length > 0 || suggestedSkills.length > 0) && (
                                            <div className="bg-white dark:bg-[#002147] p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm animate-fade-in">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <IconSparkles className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Career Agent Suggestions</h3>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {masteredSkills.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                                                                <IconCircleCheck className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Mastered (Auto-added)</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {masteredSkills.map(skill => (
                                                                    <span key={skill} className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                                                                        {skill} <Check className="w-3 h-3" />
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {inProgressSkills.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-2 text-amber-600 dark:text-amber-400">
                                                                <IconCircleHalf className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">In Progress (Click to add)</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {inProgressSkills.map(skill => (
                                                                    <button key={skill} onClick={() => {
                                                                        setResumeData(prev => ({
                                                                            ...prev,
                                                                            skills: { ...prev.skills, technical: prev.skills.technical ? `${prev.skills.technical}, ${skill}` : skill }
                                                                        }));
                                                                        setInProgressSkills(prev => prev.filter(s => s !== skill));
                                                                    }} className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-lg border border-amber-200 dark:border-amber-800/50 transition-colors flex items-center gap-1 shadow-sm">
                                                                        {skill} <Plus className="w-3 h-3" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {suggestedSkills.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-2 text-slate-500 dark:text-slate-400">
                                                                <IconCircleDashed className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Suggested for {selectedCareerPath?.roleName || 'Role'}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {suggestedSkills.map(skill => (
                                                                    <button key={skill} onClick={() => {
                                                                        setResumeData(prev => ({
                                                                            ...prev,
                                                                            skills: { ...prev.skills, technical: prev.skills.technical ? `${prev.skills.technical}, ${skill}` : skill }
                                                                        }));
                                                                        setSuggestedSkills(prev => prev.filter(s => s !== skill));
                                                                    }} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-white/10 transition-colors flex items-center gap-1 shadow-sm">
                                                                        {skill} <Plus className="w-3 h-3" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6 bg-white dark:bg-[#002147] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm animate-fade-in">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Technical Skills</label>
                                                <textarea value={resumeData.skills.technical} onChange={(e) => handleNestedChange('skills', 'technical', e.target.value)} rows={4} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder="e.g. JavaScript, React, Node.js, Python, AWS..."></textarea>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Soft Skills</label>
                                                <textarea value={resumeData.skills.soft} onChange={(e) => handleNestedChange('skills', 'soft', e.target.value)} rows={3} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder="e.g. Team Leadership, Problem Solving, Public Speaking..."></textarea>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Languages</label>
                                                <textarea value={resumeData.skills.languages} onChange={(e) => handleNestedChange('skills', 'languages', e.target.value)} rows={2} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder="e.g. English (Fluent), Urdu (Native), Tamil..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'achievements' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <AnimatePresence>
                                            {resumeData.achievements.map((ach, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2">
                                                            <Trophy className="w-4 h-4 text-amber-500" />
                                                            {ach.title || 'Achievement Details'}
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('achievements', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Achievement Title</label>
                                                                <input type="text" placeholder="e.g. Best Student Award" value={ach.title} onChange={(e) => handleArrayChange('achievements', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Link</label>
                                                                <input type="text" placeholder="URL or [Link]" value={ach.link} onChange={(e) => handleArrayChange('achievements', idx, 'link', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Description</label>
                                                            <textarea placeholder="Provide some context about this achievement..." value={ach.description} onChange={(e) => handleArrayChange('achievements', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[60px] resize-none" rows={2}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('achievements', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-amber-500 hover:text-amber-500 transition-all">
                                            <Plus className="w-5 h-5" /> Add Achievement
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Navigation buttons inside max-w-4xl card layout */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${currentStep === 0
                                        ? 'text-slate-350 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-800/20 cursor-not-allowed opacity-50'
                                        : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#002147] border border-slate-250 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#002A5C] hover:scale-[1.02] active:scale-95 shadow-sm'
                                        }`}
                                >
                                    <ArrowLeft className="w-4 h-4" /> Previous
                                </button>
                                <button
                                    onClick={nextStep}
                                    className={`flex items-center gap-2 px-6 py-2.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-[#1a3884]/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#1a3884]/30 active:scale-95 ${currentStep === steps.length - 1 ? 'hidden' : 'flex'}`}
                                >
                                    Next Step
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Preview Canvas (Shows on last step) */}
                <section
                    ref={containerRef}
                    className={`flex-1 flex flex-col overflow-hidden relative bg-slate-50 dark:bg-[#001a3d] ${currentStep === steps.length - 1 ? 'flex' : 'hidden'}`}
                >
                    {!isPreviewFullscreen ? (
                        /* Layout Template Selector Dashboard */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Selector Header */}
                            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/10 shrink-0 shadow-sm">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-650 dark:text-slate-350 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-white/10"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Edit Details
                                </button>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">Choose A Template Style</h2>
                                <div className="w-[130px]" />
                            </div>

                            {/* Template Grid Scroll Area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col items-center">
                                <div className="text-center max-w-xl mb-8">
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
                                        Select an ATS-Friendly Layout
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-405 leading-relaxed">
                                        Our templates are professionally designed and engineered to pass applicant tracking systems (ATS). Select a style below to view your resume in full-screen and download.
                                    </p>
                                </div>

                                {/* ATS Breakdown Panel */}
                                <div className="w-full max-w-6xl bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm mb-10 overflow-hidden">
                                    <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14">
                                                <CircularScoreRing score={atsScore} size={56} strokeWidth={6} label="" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">ATS Compliance Score</h3>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Detailed breakdown of your resume's parser performance</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <AnimatePresence>
                                            {atsBreakdown.map((item, index) => {
                                                const feedback = item.checks.filter(c => !c.pass).map(c => c.label).join(', ') || 'Perfect score! All checks passed.';
                                                return (
                                                    <motion.div 
                                                        key={item.label}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                                                        className="flex flex-col bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-white/5"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</span>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${item.score >= item.max * 0.8 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                                                {item.score} / {item.max}
                                                            </span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-3 overflow-hidden relative">
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(item.score / item.max) * 100}%` }}
                                                                transition={{ delay: 0.2 + (index * 0.1), duration: 1, ease: "easeOut" }}
                                                                className={`absolute top-0 left-0 h-full rounded-full ${item.score >= item.max * 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                                                            />
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex-1">
                                                            {item.score === item.max ? (
                                                                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> {feedback}</span>
                                                            ) : (
                                                                <span className="flex items-start gap-1"><span className="text-amber-500 mt-0.5 shrink-0">•</span> <span>Needs improvement: {feedback}</span></span>
                                                            )}
                                                        </p>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
                                    {Object.values(templates).map((t) => (
                                        <div
                                            key={t.id}
                                            className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
                                        >
                                            {/* Simulated Preview graphic */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5 flex items-center justify-center">
                                                <TemplateThumbnail type={t.id} />
                                            </div>

                                            {/* Details */}
                                            <div className="p-5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            {t.name}
                                                        </h3>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1a3884] dark:text-blue-300 whitespace-nowrap">
                                                            {t.tag}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                        {t.desc}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedTemplate(t.id);
                                                        setIsPreviewFullscreen(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#1a3884] hover:bg-[#152e6c] text-white font-semibold rounded-lg text-xs transition-all shadow-md group-hover:scale-[1.02]"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> Preview & Select
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Full Screen Interactive Preview */
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Toolbar with navigation and controls */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/10 shrink-0 shadow-md">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setIsPreviewFullscreen(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-650 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-white/10"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> All Styles
                                    </button>
                                    
                                    <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden md:block"></div>

                                    {/* ATS Score Compact View */}
                                    <div className="flex items-center gap-3">
                                        <CircularScoreRing score={atsScore} size={40} strokeWidth={4} label="" />
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">ATS Score</span>
                                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Score updates as you edit</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:block">
                                            Style:
                                        </label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-850 dark:text-white text-xs font-semibold rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-[#1a3884] cursor-pointer"
                                        >
                                            {Object.values(templates).map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={generating}
                                        className="flex items-center justify-center gap-1.5 px-5 py-2 bg-[#1a3884] hover:bg-[#152e6c] disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#1a3884]/20 hover:shadow-lg"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" /> Download PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable canvas area */}
                            <div className="flex-1 overflow-auto custom-scrollbar p-4 md:p-8">
                                <div
                                    className="flex justify-center items-start w-full"
                                    style={{
                                        height: scale < 1 ? `${1122.5 * scale}px` : 'auto',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <div
                                        id="resume-preview"
                                        className="bg-white w-[210mm] min-h-[297mm] shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5 p-[15mm] shrink-0 text-black text-[12px] leading-snug relative rounded-sm"
                                        style={{
                                            fontFamily: templates[selectedTemplate]?.fontFamily || '"Times New Roman", Times, serif',
                                            transform: scale < 1 ? `scale(${scale})` : 'none',
                                            transformOrigin: 'top center'
                                        }}
                                    >
                                        <ResumeWatermark />

                                        <div className="relative z-10 text-left">
                                            {/* Header Section */}
                                            <div className={`flex w-full mb-6 ${templates[selectedTemplate]?.hasPhoto ? 'items-center' : ''}`}>
                                                {templates[selectedTemplate]?.hasPhoto && resumeData.personalInfo.profileImage && (
                                                    <div className="w-[28mm] h-[28mm] rounded-full overflow-hidden mr-6 border-2 border-[#1a3884] shrink-0">
                                                        <img src={resumeData.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className={(selectedTemplate === 'modern' || selectedTemplate === 'tech' || selectedTemplate === 'modernProfile') ? 'flex flex-col items-start text-left relative z-10 w-full' : 'flex flex-col items-center text-center relative z-10 w-full'}>
                                                    <h1 className={templates[selectedTemplate]?.titleClass} style={{ fontFamily: templates[selectedTemplate]?.fontFamily }}>
                                                        {resumeData.personalInfo.fullName || 'FIRST LAST'}
                                                    </h1>
                                                    <h2 className={templates[selectedTemplate]?.subtitleClass}>{resumeData.personalInfo.targetRole || 'Professional Title'}</h2>

                                                    <div className={templates[selectedTemplate]?.contactClass}>
                                                    {resumeData.personalInfo.mobile && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-[10px] h-[10px] shrink-0" />
                                                            {resumeData.personalInfo.mobile}
                                                        </span>
                                                    )}
                                                    {resumeData.personalInfo.email && (
                                                        <span className="flex items-center gap-1">
                                                            <Mail className="w-[10px] h-[10px] shrink-0" />
                                                            {resumeData.personalInfo.email}
                                                        </span>
                                                    )}
                                                    {resumeData.personalInfo.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPinIcon className="w-[10px] h-[10px] shrink-0" />
                                                            {resumeData.personalInfo.location}
                                                        </span>
                                                    )}
                                                    {resumeData.personalInfo.linkedinUrl && (
                                                        <span className="flex items-center gap-1">
                                                            <Linkedin className="w-[10px] h-[10px] shrink-0" />
                                                            {resumeData.personalInfo.linkedinUrl}
                                                        </span>
                                                    )}
                                                    {resumeData.personalInfo.githubUrl && (
                                                        <span className="flex items-center gap-1">
                                                            <Github className="w-[10px] h-[10px] shrink-0" />
                                                            {resumeData.personalInfo.githubUrl}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Summary */}
                                                {resumeData.summary && (
                                                    <section>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Professional Summary</h3>
                                                        <p className={`${templates[selectedTemplate]?.bodyTextClass} whitespace-pre-wrap`}>
                                                            {resumeData.summary}
                                                        </p>
                                                    </section>
                                                )}

                                                {/* Education */}
                                                {resumeData.education.length > 0 && (
                                                    <div className={templates[selectedTemplate]?.sectionClass}>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Education</h3>
                                                        <div className="space-y-3">
                                                            {resumeData.education.map((edu, idx) => (
                                                                <div key={idx} className="flex justify-between items-start">
                                                                    <div className="flex flex-col">
                                                                        <span className="font-bold text-[13px] !text-black">{edu.institution}</span>
                                                                        <span className="text-[12px] !text-gray-800">{edu.degree}</span>
                                                                    </div>
                                                                    <div className="flex flex-col items-end text-[11px] !text-gray-700">
                                                                        <span className="font-semibold">{edu.year}</span>
                                                                        <span>{edu.grade || edu.score}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Experience */}
                                                {resumeData.experience.length > 0 && (
                                                    <div className={templates[selectedTemplate]?.sectionClass}>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Professional Experience</h3>
                                                        <div className="space-y-4">
                                                            {resumeData.experience.map((exp, idx) => (
                                                                <div key={idx} className="flex flex-col">
                                                                    <div className="flex justify-between items-start">
                                                                        <span className="font-bold text-[13px] !text-black">{exp.role}</span>
                                                                        <span className="text-[11px] font-semibold !text-gray-700">{exp.duration}</span>
                                                                    </div>
                                                                    <span className="text-[12px] font-medium !text-gray-800 italic">{exp.company}</span>
                                                                    <p className={`${templates[selectedTemplate]?.bodyTextClass} mt-1.5 leading-relaxed text-justify`}>{exp.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Projects */}
                                                {resumeData.projects.length > 0 && (
                                                    <section>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Projects</h3>
                                                        <div className="space-y-3">
                                                            {resumeData.projects.map((proj, i) => (
                                                                <div key={i}>
                                                                    <div className="flex justify-between items-baseline">
                                                                        <span className="font-bold text-[13px] !text-black">{proj.title}</span>
                                                                        {proj.link && <span className="block italic text-blue-800 underline mt-0.5">{proj.link}</span>}
                                                                    </div>
                                                                    <p className={templates[selectedTemplate]?.bulletClass}>
                                                                        {proj.description}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}

                                                {/* Technical Skills */}
                                                {(resumeData.skills.technical || resumeData.skills.soft || resumeData.skills.languages) && (
                                                    <section>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Skills</h3>
                                                        <div className={templates[selectedTemplate]?.skillsClass || "text-[11px] space-y-1 px-1 !text-gray-700"}>
                                                            {resumeData.skills.technical && (
                                                                <div>
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>Technical Skills:</span>{' '}
                                                                    {templates[selectedTemplate]?.skillsBadge ? (
                                                                        <span className="flex flex-wrap gap-1 mt-1">
                                                                            {resumeData.skills.technical.split(',').map((s, i) => (
                                                                                <span key={i} className={templates[selectedTemplate]?.skillsBadge}>
                                                                                    {s.trim()}
                                                                                </span>
                                                                            ))}
                                                                        </span>
                                                                    ) : (
                                                                        resumeData.skills.technical
                                                                    )}
                                                                </div>
                                                            )}
                                                            {resumeData.skills.soft && (
                                                                <div className="mt-1">
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>Soft Skills:</span>{' '}
                                                                    {templates[selectedTemplate]?.skillsBadge ? (
                                                                        <span className="flex flex-wrap gap-1 mt-1">
                                                                            {resumeData.skills.soft.split(',').map((s, i) => (
                                                                                <span key={i} className={templates[selectedTemplate]?.skillsBadge}>
                                                                                    {s.trim()}
                                                                                </span>
                                                                            ))}
                                                                        </span>
                                                                    ) : (
                                                                        resumeData.skills.soft
                                                                    )}
                                                                </div>
                                                            )}
                                                            {resumeData.skills.languages && (
                                                                <div className="mt-1">
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>Languages:</span>{' '}
                                                                    {templates[selectedTemplate]?.skillsBadge ? (
                                                                        <span className="flex flex-wrap gap-1 mt-1">
                                                                            {resumeData.skills.languages.split(',').map((s, i) => (
                                                                                <span key={i} className={templates[selectedTemplate]?.skillsBadge}>
                                                                                    {s.trim()}
                                                                                </span>
                                                                            ))}
                                                                        </span>
                                                                    ) : (
                                                                        resumeData.skills.languages
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </section>
                                                )}

                                                {/* Achievements */}
                                                {resumeData.achievements.length > 0 && (
                                                    <section>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>Achievements</h3>
                                                        <div className="space-y-2">
                                                            {resumeData.achievements.map((ach, i) => (
                                                                <div key={i} className="text-[11px]">
                                                                    <div className="flex justify-between items-baseline">
                                                                        <span className="font-bold !text-black">{ach.title}</span>
                                                                        {ach.link && <span className="italic text-blue-800 underline text-[10px] ml-2">{ach.link}</span>}
                                                                    </div>
                                                                    <p className={`italic ${templates[selectedTemplate]?.bodyTextClass}`}>{ach.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                                            </div>
                                        </div>

                                        {/* Verification Footer absolutely pinned to the bottom of the A4 printed page */}
                                        <div
                                            className="absolute bottom-[15mm] left-[15mm] right-[15mm] pt-4 border-t border-gray-300 flex justify-between items-center gap-4 text-left z-20 bg-white"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider !text-slate-700">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a3884]" />
                                                    {ORG_NAME} Verified Resume
                                                </div>
                                                <p className="mt-1 text-[9.5px] !text-gray-600">
                                                    Document ID: <span className="font-semibold !text-black">{resumePublicId || 'Pending'}</span>
                                                    {studentId && (
                                                        <> &bull; Student ID: <span className="font-semibold !text-black">{studentId}</span></>
                                                    )}
                                                </p>
                                                <p className="text-[8.5px] !text-gray-500 mt-0.5">Scan the QR code to verify the authenticity of this document online.</p>
                                            </div>
                                            {verificationQr ? (
                                                <img
                                                    src={verificationQr}
                                                    alt="Resume verification QR code"
                                                    className="w-12 h-12 border border-slate-200 bg-white p-0.5 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-12 h-12 border border-slate-200 bg-white flex items-center justify-center shrink-0">
                                                    <QrCode className="w-6 h-6 text-slate-400" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ResumeBuilder;
