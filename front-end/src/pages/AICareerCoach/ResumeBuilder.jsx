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
import { useTranslation } from 'react-i18next';
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

const ResumeBuilder = ({ embedded = false, jobContext = null, onClose = null, viewOnly = false, preloadedData = null }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(viewOnly ? false : true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // ── Multi-resume list mode ───────────────────────────────────────────
    const [pageMode, setPageMode] = useState(embedded ? 'builder' : 'list');       // 'list' | 'builder'
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
    const [jobSkills, setJobSkills] = useState([]); // Skills from job posting

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
        { id: 'personal', label: t('resume_builder.steps.profile', 'Profile'), icon: User },
        { id: 'education', label: t('resume_builder.steps.education', 'Education'), icon: GraduationCap },
        { id: 'experience', label: t('resume_builder.steps.experience', 'Experience'), icon: Briefcase },
        { id: 'projects', label: t('resume_builder.steps.projects', 'Projects'), icon: FileText },
        { id: 'skills', label: t('resume_builder.steps.skills', 'Skills'), icon: Sparkles },
        { id: 'achievements', label: t('resume_builder.steps.awards', 'Awards'), icon: Trophy },
        { id: 'preview', label: embedded ? t('resume_builder.steps.review_save', 'Review & Save') : t('resume_builder.steps.review_download', 'Review & Download'), icon: FileText }
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
        if (preloadedData) {
            setResumeData(preloadedData);
            setDataLoaded(true);
        }
    }, [preloadedData]);

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
        if (!viewOnly && !preloadedData) {
            fetchData();
            fetchCareerData();
            fetchResumeList();
        }
    }, [viewOnly, preloadedData]);

    useEffect(() => {
        if (embedded && jobContext && dataLoaded) {
            // Get skills from jobContext
            let extractedSkills = [];
            if (jobContext.eligibility?.skills && Array.isArray(jobContext.eligibility.skills) && jobContext.eligibility.skills.length > 0) {
                extractedSkills = jobContext.eligibility.skills;
            } else if (jobContext.skills && Array.isArray(jobContext.skills)) {
                extractedSkills = jobContext.skills;
            }
            
            // Format skills to string array
            const formattedSkills = extractedSkills.filter(Boolean).map(s => typeof s === 'object' ? (s.name || s.title || '') : String(s)).filter(Boolean);
            setJobSkills(formattedSkills);

            // Force target role to job title
            const targetRole = jobContext.displayTitle || jobContext.title || jobContext.jobTitle || '';
            if (targetRole) {
                setResumeData(prev => ({
                    ...prev,
                    personalInfo: { ...prev.personalInfo, targetRole }
                }));
            }
        }
    }, [embedded, jobContext, dataLoaded]);

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
        const cat1 = { label: t('resume_builder.ats.cat_parseability', 'Parseability & Format'), max: 25, checks: [] };
        cat1.checks.push({ label: t('resume_builder.ats.chk_ats_safe', 'ATS-safe template'), pts: 8, pass: true, step: null });
        cat1.checks.push({ label: t('resume_builder.ats.chk_standard_headings', 'Standard section headings'), pts: 7, pass: true, step: null });
        const hasDates = (data.education || []).every(e => e.year?.trim()) && (data.experience || []).every(e => e.duration?.trim());
        cat1.checks.push({ label: t('resume_builder.ats.chk_dates', 'Dates in all entries'), pts: 5, pass: hasDates, step: hasDates ? null : 2 });
        const badChars = /[^\w\s@.\-+()]/;
        const noSpecial = !badChars.test(data.personalInfo?.fullName || '') && !badChars.test(data.personalInfo?.email || '') && !badChars.test(data.personalInfo?.mobile || '');
        cat1.checks.push({ label: t('resume_builder.ats.chk_no_special', 'No special chars in contact'), pts: 5, pass: noSpecial, step: noSpecial ? null : 1 });
        cat1.score = cat1.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat1);

        // CAT 2 — Keyword & Role Match (30 pts)
        const cat2 = { label: t('resume_builder.ats.cat_keyword', 'Keyword & Role Match'), max: 30, checks: [] };
        const hasRole = !!data.personalInfo?.targetRole?.trim();
        cat2.checks.push({ label: t('resume_builder.ats.chk_target_role', 'Target Role is set'), pts: 5, pass: hasRole, step: hasRole ? null : 1 });
        const techSkillsArr = (data.skills?.technical || '').split(',').map(s => s.trim()).filter(Boolean);
        const hasTech3 = techSkillsArr.length >= 3;
        cat2.checks.push({ label: t('resume_builder.ats.chk_tech_3', 'Technical Skills (3+ skills)'), pts: 10, pass: hasTech3, step: hasTech3 ? null : 5 });
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
        cat2.checks.push({ label: t('resume_builder.ats.chk_skills_match', 'Skills match role keywords'), pts: 10, pass: kwScore >= 5, step: 5, earned: kwScore });
        const hasSoft = !!data.skills?.soft?.trim();
        cat2.checks.push({ label: t('resume_builder.ats.chk_soft_filled', 'Soft Skills filled'), pts: 5, pass: hasSoft, step: hasSoft ? null : 5 });
        cat2.score = cat2.checks.reduce((s, c) => s + (c.earned !== undefined ? c.earned : (c.pass ? c.pts : 0)), 0);
        results.push(cat2);

        // CAT 3 — Content Completeness (25 pts)
        const cat3 = { label: t('resume_builder.ats.cat_completeness', 'Content Completeness'), max: 25, checks: [] };
        const summaryOk = (data.summary || '').length >= 80;
        cat3.checks.push({ label: t('resume_builder.ats.chk_summary', 'Summary (80+ chars)'), pts: 8, pass: summaryOk, step: summaryOk ? null : 1 });
        const expOk = data.experience?.length > 0 && (data.experience[0]?.description || '').length > 30;
        cat3.checks.push({ label: t('resume_builder.ats.chk_exp_desc', 'Work Experience with description'), pts: 7, pass: expOk, step: expOk ? null : 3 });
        const eduOk = data.education?.length > 0 && data.education[0]?.institution?.trim() && data.education[0]?.year?.trim();
        cat3.checks.push({ label: t('resume_builder.ats.chk_edu', 'Education (institution + year)'), pts: 5, pass: eduOk, step: eduOk ? null : 2 });
        const projOk = data.projects?.length >= 2 && data.projects.every(p => (p.description || '').length > 20);
        cat3.checks.push({ label: t('resume_builder.ats.chk_projects', '2+ Projects with descriptions'), pts: 5, pass: projOk, step: projOk ? null : 4 });
        cat3.score = cat3.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat3);

        // CAT 4 — Contact & Credibility (10 pts)
        const cat4 = { label: t('resume_builder.ats.cat_contact', 'Contact & Credibility'), max: 10, checks: [] };
        cat4.checks.push({ label: t('resume_builder.ats.chk_linkedin', 'LinkedIn URL'), pts: 3, pass: !!data.personalInfo?.linkedinUrl?.trim(), step: 1 });
        cat4.checks.push({ label: t('resume_builder.ats.chk_github', 'GitHub URL'), pts: 3, pass: !!data.personalInfo?.githubUrl?.trim(), step: 1 });
        cat4.checks.push({ label: t('resume_builder.ats.chk_location', 'Location'), pts: 2, pass: !!data.personalInfo?.location?.trim(), step: 1 });
        cat4.checks.push({ label: t('resume_builder.ats.chk_portfolio', 'Portfolio / Website'), pts: 2, pass: !!data.personalInfo?.portfolioUrl?.trim(), step: 1 });
        cat4.score = cat4.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat4);

        // CAT 5 — Impact & Context (10 pts)
        const cat5 = { label: t('resume_builder.ats.cat_impact', 'Impact & Context'), max: 10, checks: [] };
        cat5.checks.push({ label: t('resume_builder.ats.chk_achievement', '1+ Achievement/Award'), pts: 3, pass: data.achievements?.length > 0, step: 6 });
        const metricRegex = /\d+(%|K|\+| years| months| users| projects)/i;
        const allDescriptions = [...(data.experience || []).map(e => e.description || ''), ...(data.projects || []).map(p => p.description || '')].join(' ');
        const hasMetrics = metricRegex.test(allDescriptions);
        cat5.checks.push({ label: t('resume_builder.ats.chk_metrics', 'Numbers/metrics in descriptions'), pts: 4, pass: hasMetrics, step: 3 });
        const expSubstantive = (data.experience || []).every(e => (e.description || '').length >= 50);
        cat5.checks.push({ label: t('resume_builder.ats.chk_substantive', 'Substantive experience descriptions'), pts: 3, pass: expSubstantive || data.experience?.length === 0, step: 3 });
        cat5.score = cat5.checks.reduce((s, c) => s + (c.pass ? c.pts : 0), 0);
        results.push(cat5);

        const total = results.reduce((s, c) => s + c.score, 0);
        return { total, breakdown: results };
    }, [t]);

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
                if (!silent) toast.success(t('resume_builder.toast.sync_success', 'Profile data synced successfully!'));
            } else {
                if (!silent) toast.error(t('resume_builder.toast.sync_failed_retry', 'Failed to sync profile. Please try again.'));
            }
        } catch (error) {
            console.error('Sync error:', error);
            if (!silent) toast.error(t('resume_builder.toast.sync_failed', 'Failed to sync profile'));
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async (showToast = true) => {
        setSaving(true);
        let currentId = resumeId;
        try {
            const payload = {
                ...resumeData,
                atsScore,
                versionName,
                targetRole: resumeData.personalInfo?.targetRole || '',
            };

            if (currentId) {
                await resumeApi.updateResume(currentId, payload);
                if (showToast) toast.success(t('resume_builder.toast.update_success', 'Resume updated successfully!'));
            } else {
                const res = await resumeApi.createResume(payload);
                if (res.success) {
                    currentId = res.data._id;
                    setResumeId(currentId);
                    if (showToast) toast.success(t('resume_builder.toast.save_success', 'Resume saved successfully!'));
                }
            }
            return currentId;
        } catch (error) {
            toast.error(error.response?.data?.message || t('resume_builder.toast.save_failed', 'Failed to save resume'));
            return null;
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
            toast.error(t('resume_builder.toast.summary_needs_context', "Please fill out your Target Role, Experience, or Education first so the AI has context to write your summary."));
            return;
        }

        setIsGeneratingSummary(true);
        try {
            const res = await aiCareerCoachApi.generateSummary(resumeData, targetRole);
            if (res.success && res.summary) {
                setResumeData(prev => ({ ...prev, summary: res.summary }));
                toast.success(t('resume_builder.toast.summary_success', 'Professional summary generated successfully!'));
            } else {
                toast.error(res.message || t('resume_builder.toast.summary_failed', 'Failed to generate summary.'));
            }
        } catch (error) {
            console.error('Error generating summary:', error);
            toast.error(t('resume_builder.toast.summary_error', 'An error occurred while generating the summary.'));
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
                toast.success(t('resume_builder.toast.duplicate_success', 'Resume duplicated!'));
                fetchResumeList();
            }
        } catch (err) {
            toast.error(t('resume_builder.toast.duplicate_failed', 'Failed to duplicate resume'));
        } finally {
            setDuplicatingId(null);
        }
    };

    const handleDeleteResume = async (id, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm(t('resume_builder.confirm_delete', 'Are you sure you want to delete this resume?'))) return;
        setDeletingId(id);
        try {
            const res = await resumeApi.deleteResume(id);
            if (res.success) {
                toast.success(t('resume_builder.toast.delete_success', 'Resume deleted'));
                fetchResumeList();
            }
        } catch (err) {
            toast.error(t('resume_builder.toast.delete_failed', 'Failed to delete resume'));
        } finally {
            setDeletingId(null);
        }
    };

    const renameResume = async (id, newName) => {
        if (!newName.trim()) return;
        try {
            await resumeApi.updateResume(id, { versionName: newName.trim() });
            toast.success(t('resume_builder.toast.rename_success', 'Name updated'));
            fetchResumeList();
            setRenamingId(null);
        } catch (err) {
            toast.error(t('resume_builder.toast.rename_failed', 'Failed to rename'));
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
                    throw new Error(created?.message || t('resume_builder.toast.save_before_export', 'Save resume before exporting'));
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
                    t('resume_builder.toast.export_limit', 'Export limit reached. Try again in {{minutes}} minutes.', { minutes: retryMinutes })
                );
                return;
            }

            const issued = exportRes.data;
            setResumePublicId(issued.resumePublicId);
            setResumeFingerprint(issued.fingerprint);
            setVerificationUrl(buildVerificationUrl(issued.resumePublicId, issued.fingerprint));

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
            toast.success(t('resume_builder.toast.pdf_success', 'Verified PDF downloaded with org watermark and QR.'));
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error.message || t('resume_builder.toast.pdf_failed', 'Failed to generate PDF'));
        } finally {
            setGenerating(false);
        }
    };

    const handleConfirmAndSave = async () => {
        const id = await handleSave(true);
        if (id) {
            try {
                setGenerating(true);
                const exportRes = await resumeApi.issueExport(id);
                if (exportRes?.success) {
                    const issued = exportRes.data;
                    const url = buildVerificationUrl(issued.resumePublicId, issued.fingerprint);
                    if (onClose) {
                        onClose({
                            id,
                            url,
                            name: resumeData.personalInfo?.fullName || 'Resume',
                            publicId: issued.resumePublicId
                        });
                    }
                    return;
                }
            } catch (err) {
                console.error("Export error on confirm:", err);
                toast.error(err.message || t('resume_builder.toast.export_failed', 'Failed to generate resume link'));
            } finally {
                setGenerating(false);
            }
        }
        if (onClose) onClose();
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
            const padding = window.innerWidth < 768 ? 32 : 64; // p-4 (32px) vs p-8 (64px)
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
                toast.error(t('resume_builder.validation.target_role', "Please enter your Target Role."));
                return false;
            }
            if (!info.email?.trim()) {
                toast.error(t('resume_builder.validation.email', "Please enter your Email Address."));
                return false;
            }
            if (!info.mobile?.trim()) {
                toast.error(t('resume_builder.validation.mobile', "Please enter your Mobile Number."));
                return false;
            }
            if (!info.location?.trim()) {
                toast.error(t('resume_builder.validation.location', "Please enter your Location."));
                return false;
            }
            if (!info.linkedinUrl?.trim()) {
                toast.error(t('resume_builder.validation.linkedin', "Please enter your LinkedIn URL."));
                return false;
            } else if (!isValidUrl(info.linkedinUrl)) {
                toast.error(t('resume_builder.validation.linkedin_invalid', "Please enter a valid LinkedIn URL."));
                return false;
            }
            if (!info.githubUrl?.trim()) {
                toast.error(t('resume_builder.validation.github', "Please enter your GitHub URL."));
                return false;
            } else if (!isValidUrl(info.githubUrl)) {
                toast.error(t('resume_builder.validation.github_invalid', "Please enter a valid GitHub URL."));
                return false;
            }
            if (info.portfolioUrl?.trim() && !isValidUrl(info.portfolioUrl)) {
                toast.error(t('resume_builder.validation.portfolio_invalid', "Please enter a valid Portfolio URL."));
                return false;
            }

            if (!resumeData.summary?.trim()) {
                toast.error(t('resume_builder.validation.summary', "Please enter a Professional Summary."));
                return false;
            }
        }

        if (stepId === 'education') {
            if (!resumeData.education || resumeData.education.length === 0) {
                toast.error(t('resume_builder.validation.education_required', "Please add at least one Education entry."));
                return false;
            }
            for (let i = 0; i < resumeData.education.length; i++) {
                const edu = resumeData.education[i];
                if (!edu.institution?.trim()) {
                    toast.error(t('resume_builder.validation.edu_institution', "Please enter Institution Name for Education entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!edu.degree?.trim()) {
                    toast.error(t('resume_builder.validation.edu_degree', "Please enter Degree for Education entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!edu.year?.trim()) {
                    toast.error(t('resume_builder.validation.edu_year', "Please enter Year of Passing for Education entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!edu.grade?.trim()) {
                    toast.error(t('resume_builder.validation.edu_grade', "Please enter Grade / CGPA for Education entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!edu.location?.trim()) {
                    toast.error(t('resume_builder.validation.edu_location', "Please enter Location for Education entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
            }
        }

        if (stepId === 'experience') {
            for (let i = 0; i < resumeData.experience.length; i++) {
                const exp = resumeData.experience[i];
                if (!exp.company?.trim()) {
                    toast.error(t('resume_builder.validation.exp_company', "Please enter Company Name for Experience entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!exp.role?.trim()) {
                    toast.error(t('resume_builder.validation.exp_role', "Please enter Role / Position for Experience entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!exp.duration?.trim()) {
                    toast.error(t('resume_builder.validation.exp_duration', "Please enter Duration for Experience entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!exp.description?.trim()) {
                    toast.error(t('resume_builder.validation.exp_description', "Please enter Description for Experience entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
            }
        }

        if (stepId === 'projects') {
            if (!resumeData.projects || resumeData.projects.length === 0) {
                toast.error(t('resume_builder.validation.projects_required', "Please add at least one Project."));
                return false;
            }
            for (let i = 0; i < resumeData.projects.length; i++) {
                const proj = resumeData.projects[i];
                if (!proj.title?.trim()) {
                    toast.error(t('resume_builder.validation.proj_title', "Please enter Title for Project entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!proj.description?.trim()) {
                    toast.error(t('resume_builder.validation.proj_description', "Please enter Description for Project entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (proj.link?.trim() && !isValidUrl(proj.link)) {
                    toast.error(t('resume_builder.validation.proj_link', "Please enter a valid URL for Project entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
            }
        }

        if (stepId === 'skills') {
            const skills = resumeData.skills || {};
            if (!skills.technical?.trim()) {
                toast.error(t('resume_builder.validation.technical', "Please enter Technical Skills."));
                return false;
            }
            if (!skills.soft?.trim()) {
                toast.error(t('resume_builder.validation.soft', "Please enter Soft Skills."));
                return false;
            }
            if (!skills.languages?.trim()) {
                toast.error(t('resume_builder.validation.languages', "Please enter Languages."));
                return false;
            }
        }

        if (stepId === 'achievements') {
            for (let i = 0; i < resumeData.achievements.length; i++) {
                const ach = resumeData.achievements[i];
                if (!ach.title?.trim()) {
                    toast.error(t('resume_builder.validation.award_title', "Please enter Title for Award entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (!ach.description?.trim()) {
                    toast.error(t('resume_builder.validation.award_description', "Please enter Description for Award entry #{{num}}.", { num: i + 1 }));
                    return false;
                }
                if (ach.link?.trim() && !isValidUrl(ach.link)) {
                    toast.error(t('resume_builder.validation.award_link', "Please enter a valid URL for Award entry #{{num}}.", { num: i + 1 }));
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

    if (loading && !viewOnly) {
        return (
            <div className="h-full w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                    </div>
                    <p className="text-[#1a3884] dark:text-blue-400 font-bold animate-pulse uppercase tracking-widest text-xs">{t('resume_builder.loading', 'Loading Builder...')}</p>
                </div>
            </div>
        );
    }

    if (viewOnly) {
        return (
            <div className="w-full flex justify-center bg-transparent py-6">
                <div 
                    className="flex justify-center items-start overflow-hidden custom-scrollbar max-w-full"
                    style={{
                        width: scale < 1 ? `${794 * scale}px` : '100%',
                        height: scale < 1 ? `${1122.5 * scale}px` : 'auto',
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

                        <div className="relative z-10 text-left pb-[20mm]">
                            {/* Header Section */}
                            <div className={`flex w-full mb-6 ${templates[selectedTemplate]?.hasPhoto ? 'items-center' : ''}`}>
                                {templates[selectedTemplate]?.hasPhoto && resumeData.personalInfo.profileImage && (
                                    <div className="w-[28mm] h-[28mm] rounded-full overflow-hidden mr-6 border-2 border-[#1a3884] shrink-0">
                                        <img src={resumeData.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className={(selectedTemplate === 'modern' || selectedTemplate === 'tech' || selectedTemplate === 'modernProfile') ? 'flex flex-col items-start text-left relative z-10 w-full' : 'flex flex-col items-center text-center relative z-10 w-full'}>
                                    <h1 className={templates[selectedTemplate]?.titleClass} style={{ fontFamily: templates[selectedTemplate]?.fontFamily }}>
                                        {resumeData.personalInfo.fullName || t('resume_builder.first_last', 'FIRST LAST')}
                                    </h1>
                                    <h2 className={templates[selectedTemplate]?.subtitleClass}>{resumeData.personalInfo.targetRole || t('resume_builder.professional_title', 'Professional Title')}</h2>

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
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.summary_heading', 'Professional Summary')}</h3>
                                        <p className={templates[selectedTemplate]?.bodyTextClass}>{resumeData.summary}</p>
                                    </section>
                                )}

                                {/* Experience */}
                                {resumeData.experience.length > 0 && (
                                    <section>
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.experience_heading', 'Experience')}</h3>
                                        <div className={templates[selectedTemplate]?.sectionClass}>
                                            {resumeData.experience.map((exp, i) => (
                                                <div key={i} className="mb-3 last:mb-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="font-bold !text-black text-[12px]">{exp.role}</span>
                                                        <span className={`text-[10px] font-semibold ${templates[selectedTemplate]?.bodyTextClass}`}>{exp.duration}</span>
                                                    </div>
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className={`font-semibold italic text-[11px] ${templates[selectedTemplate]?.bodyTextClass}`}>{exp.company}</span>
                                                        <span className={`text-[10px] ${templates[selectedTemplate]?.bodyTextClass}`}>{exp.location}</span>
                                                    </div>
                                                    {exp.description && <p className={templates[selectedTemplate]?.bulletClass}>{exp.description}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Projects */}
                                {resumeData.projects.length > 0 && (
                                    <section>
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.projects_heading', 'Projects')}</h3>
                                        <div className={templates[selectedTemplate]?.sectionClass}>
                                            {resumeData.projects.map((proj, i) => (
                                                <div key={i} className="mb-2 last:mb-0">
                                                    <div className="flex justify-between items-baseline mb-0.5">
                                                        <span className="font-bold !text-black text-[12px]">{proj.title}</span>
                                                        {proj.link && <span className="italic text-blue-800 underline text-[10px] ml-2">{proj.link}</span>}
                                                    </div>
                                                    <p className={templates[selectedTemplate]?.bulletClass}>{proj.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Education */}
                                {resumeData.education.length > 0 && (
                                    <section>
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.education_heading', 'Education')}</h3>
                                        <div className={templates[selectedTemplate]?.sectionClass}>
                                            {resumeData.education.map((edu, i) => (
                                                <div key={i} className="mb-2 last:mb-0 flex justify-between items-start">
                                                    <div>
                                                        <div className="font-bold !text-black text-[11px] leading-tight">{edu.degree}</div>
                                                        <div className={`italic text-[11px] ${templates[selectedTemplate]?.bodyTextClass} leading-tight`}>{edu.institution}</div>
                                                        {edu.grade && <div className={`text-[10px] ${templates[selectedTemplate]?.bodyTextClass} mt-0.5`}>{t('resume_builder.grade', 'Grade:')} <span className="font-semibold">{edu.grade}</span></div>}
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <div className={`text-[10px] font-semibold ${templates[selectedTemplate]?.bodyTextClass}`}>{edu.year}</div>
                                                        <div className={`text-[10px] ${templates[selectedTemplate]?.bodyTextClass}`}>{edu.location}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* Skills */}
                                {(resumeData.skills.technical || resumeData.skills.soft || resumeData.skills.languages) && (
                                    <section>
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.skills_heading', 'Skills')}</h3>
                                        <div className={templates[selectedTemplate]?.skillsClass}>
                                            {resumeData.skills.technical && (
                                                <div className="mt-1">
                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.technical_label', 'Technical Skills:')}</span>{' '}
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
                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.soft_skills_label', 'Soft Skills:')}</span>{' '}
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
                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.languages_label', 'Languages:')}</span>{' '}
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
                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.achievements_heading', 'Achievements')}</h3>
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
                                    {ORG_NAME} {t('resume_builder.verified_resume', 'Verified Resume')}
                                </div>
                                <p className="mt-1 text-[9.5px] !text-gray-600">
                                    {t('resume_builder.document_id', 'Document ID:')} <span className="font-semibold !text-black">{resumePublicId || t('resume_builder.pending', 'Pending')}</span>
                                    {studentId && (
                                        <> &bull; {t('resume_builder.student_id', 'Student ID:')} <span className="font-semibold !text-black">{studentId}</span></>
                                    )}
                                </p>
                                <p className="text-[8.5px] !text-gray-500 mt-0.5">{t('resume_builder.scan_qr', 'Scan the QR code to verify the authenticity of this document online.')}</p>
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
        );
    }

    // --- SVG Circular Score Ring ---
    const CircularScoreRing = ({ score, size = 120, strokeWidth = 10, label = "ATS" }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (score / 100) * circumference;

        let colorClass = "text-emerald-500";
        let glowColor = "rgba(16,185,129,0.45)";
        let glowColorStrong = "rgba(16,185,129,0.8)";
        if (score < 50) {
            colorClass = "text-rose-500";
            glowColor = "rgba(244,63,94,0.45)";
            glowColorStrong = "rgba(244,63,94,0.8)";
        } else if (score < 80) {
            colorClass = "text-amber-500";
            glowColor = "rgba(245,158,11,0.45)";
            glowColorStrong = "rgba(245,158,11,0.8)";
        }

        const count = useMotionValue(0);
        const rounded = useTransform(count, Math.round);
        const [displayScore, setDisplayScore] = useState(0);
        const [prevScore, setPrevScore] = useState(score);
        const [flashing, setFlashing] = useState(false);

        useEffect(() => {
            // Trigger gold flash when score increases
            if (score > prevScore && prevScore !== 0) {
                setFlashing(true);
                const t = setTimeout(() => setFlashing(false), 800);
                return () => clearTimeout(t);
            }
            setPrevScore(score);
        }, [score]);

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
            <div
                className="relative flex items-center justify-center"
                style={{ width: size, height: size }}
            >
                {/* Always-visible outer glow — flashes gold on score increase */}
                <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    animate={{
                        boxShadow: flashing
                            ? `0 0 ${size * 0.3}px ${size * 0.12}px rgba(251,191,36,0.9), 0 0 ${size * 0.12}px ${size * 0.05}px rgba(251,191,36,0.6)`
                            : `0 0 ${size * 0.18}px ${size * 0.06}px ${glowColor}`,
                    }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />

                {/* SVG Ring */}
                <motion.svg className="transform -rotate-90 w-full h-full relative z-10">
                    {/* Background track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        stroke="currentColor" strokeWidth={strokeWidth} fill="transparent"
                        className="text-slate-100 dark:text-slate-800"
                    />
                    {/* Animated progress arc */}
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

                {/* Center number + optional label */}
                <div className="absolute flex flex-col items-center justify-center text-center z-20">
                    <motion.span
                        animate={flashing ? { color: "#fbbf24", scale: 1.15 } : { color: undefined, scale: 1 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="font-black text-slate-800 dark:text-white leading-none tracking-tighter"
                        style={{ fontSize: `${Math.max(14, size * 0.28)}px` }}
                    >
                        {displayScore}
                    </motion.span>
                    {label && (
                        <span
                            className="font-bold text-slate-400 uppercase tracking-widest mt-0.5"
                            style={{ fontSize: `${Math.max(8, size * 0.08)}px` }}
                        >
                            {label}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    if (pageMode === 'list') {
        return (
            <div className="flex flex-col h-full bg-[#F8FAFC] dark:bg-[#00152E] overflow-hidden font-sans selection:bg-[#1a3884] selection:text-white">
                <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
                    <div className="max-w-6xl mx-auto space-y-6">
                        {/* Header & Back Button */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => {
                                    if (embedded && onClose) onClose();
                                    else navigate("/dashboard/smaart-toolkit");
                                }}
                                className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-[#112b6b] transition-all hover:text-[#1a3884] dark:text-slate-300"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-300 group-hover:-translate-x-1 group-hover:shadow-md dark:border-white/10 dark:bg-slate-800">
                                    <IconArrowLeft stroke={2.5} className="h-4 w-4 text-[#112b6b] dark:text-slate-300" />
                                </div>
                                {t('resume_builder.back_to_toolkit', 'BACK TO TOOLKIT')}
                            </button>
                        </div>
                        {/* Page Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="relative overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)] flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex-1">
                                <h1 className="text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                    {t('resume_builder.list_title_1', 'My')} <span className="text-[#1a3884] dark:text-blue-300">{t('resume_builder.list_title_2', 'Resumes')}</span>
                                </h1>
                                <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-2xl">
                                    {t('resume_builder.list_subtitle', 'Manage your tailored resumes and track your ATS optimization scores.')}
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
                                    {t('resume_builder.create_new', 'Create New Resume')}
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
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t('resume_builder.no_resumes', 'No resumes found')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{t('resume_builder.no_resumes_desc', 'Create your first ATS-optimized resume to get started on your career journey.')}</p>
                                <button onClick={handleCreateNew} className="px-6 py-2.5 bg-[#1a3884] text-white rounded-xl font-bold text-sm hover:bg-[#132c6b] transition-colors shadow-md">
                                    {t('resume_builder.create_first', 'Create First Resume')}
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
                                                <div className="flex items-center gap-2 mb-2 w-full justify-center group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 rounded-lg p-1 transition-colors cursor-text" onClick={() => { setRenamingId(resume._id); setRenameValue(resume.versionName || t('resume_builder.default_name', 'My Resume')); }}>
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate max-w-[80%]">{resume.versionName || t('resume_builder.default_name', 'My Resume')}</h3>
                                                    <IconPencil stroke={2} className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#1a3884]/20 text-[#1a3884] dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-4 border border-blue-100 dark:border-[#1a3884]/30">
                                                <IconTarget stroke={2} className="w-3 h-3" />
                                                <span className="truncate max-w-[150px]">{resume.targetRole || t('resume_builder.general_resume', 'General Resume')}</span>
                                            </div>

                                            <p className="text-[10px] text-slate-400 font-medium">{t('resume_builder.last_updated', 'Last updated:')} {new Date(resume.updatedAt).toLocaleDateString()}</p>
                                        </div>

                                        <div className="grid grid-cols-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/20">
                                            <button onClick={() => handleEditResume(resume)} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[#1a3884] hover:text-white text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-100 dark:border-white/5">
                                                <IconPencil stroke={1.5} className="w-4 h-4" />
                                                <span className="text-[10px] font-bold">{t('resume_builder.edit', 'Edit')}</span>
                                            </button>
                                            <button onClick={(e) => handleDuplicateResume(resume._id, e)} disabled={duplicatingId === resume._id} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-[#1a3884] hover:text-white text-slate-600 dark:text-slate-300 transition-colors border-r border-slate-100 dark:border-white/5 disabled:opacity-50">
                                                {duplicatingId === resume._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconCopy stroke={1.5} className="w-4 h-4" />}
                                                <span className="text-[10px] font-bold">{t('resume_builder.copy', 'Copy')}</span>
                                            </button>
                                            <button onClick={(e) => handleDeleteResume(resume._id, e)} disabled={deletingId === resume._id} className="flex flex-col items-center justify-center py-3 gap-1 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50">
                                                {deletingId === resume._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconTrash stroke={1.5} className="w-4 h-4" />}
                                                <span className="text-[10px] font-bold">{t('resume_builder.delete', 'Delete')}</span>
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
        <div className="flex flex-col lg:h-full bg-[#F8FAFC] dark:bg-[#00152E] lg:overflow-hidden font-sans selection:bg-[#1a3884] selection:text-white">
            {/* Header */}
            <header className="min-h-[4rem] flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-0 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/8 z-30 shrink-0 shadow-sm gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <button onClick={async () => {
                        if (embedded && onClose) {
                            onClose();
                        } else {
                            await fetchResumeList();
                            setPageMode('list');
                        }
                    }} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-bold text-[10px] sm:text-[11px] text-slate-650 dark:text-slate-350 uppercase tracking-wider shrink-0">
                        <IconArrowLeft stroke={2} className="w-3.5 h-3.5" /> {t('resume_builder.back', 'Back')}
                    </button>
                    <div className="flex items-center gap-2.5 min-w-0">
                        {!embedded && (
                            <div className="w-9 h-9 sm:w-10 sm:h-10 cursor-help shrink-0" title={t('resume_builder.ats_score_title', 'ATS Score: {{score}}/100', { score: atsScore })}>
                                <CircularScoreRing score={atsScore} size={36} strokeWidth={4} label="" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <div className="relative flex items-center group">
                                <input
                                    value={versionName}
                                    onChange={(e) => setVersionName(e.target.value)}
                                    className="text-sm sm:text-[17px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#1a3884] outline-none transition-colors w-28 sm:w-48 pr-6 truncate"
                                    placeholder={t('resume_builder.resume_name_placeholder', 'Resume Name')}
                                />
                                <IconPencil stroke={2} className="w-3.5 h-3.5 text-slate-400 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            {!embedded && (
                                <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate hidden sm:block">{t('resume_builder.ats_score_status', 'ATS Score Status')}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 dark:border-white/5">
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{resumePublicId || t('resume_builder.secure_resume', 'Secure Resume')}</span>
                    </div>
                    {currentStep !== steps.length - 1 && (
                        <button onClick={() => handleStepClick(steps.length - 1)} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-55 dark:bg-[#002A5C] hover:bg-slate-100 dark:hover:bg-[#003575] text-slate-700 dark:text-slate-205 rounded-xl transition-all font-semibold text-[11px] sm:text-xs border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('resume_builder.review', 'Review')}</span>
                        </button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-55 dark:bg-[#002A5C] hover:bg-slate-100 dark:hover:bg-[#003575] text-slate-700 dark:text-slate-205 rounded-xl transition-all font-semibold text-[11px] sm:text-xs border border-slate-200 dark:border-white/10 disabled:opacity-50 shadow-sm shrink-0">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{t('resume_builder.save', 'Save')}<span className="hidden sm:inline"> {t('resume_builder.progress', 'Progress')}</span></span>
                    </button>
                    {currentStep === steps.length - 1 && (
                        embedded ? (
                            <button onClick={handleConfirmAndSave} disabled={saving || generating} className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-xl transition-all font-semibold text-[11px] sm:text-xs shadow-md shadow-blue-600/10 hover:shadow-lg disabled:opacity-50 shrink-0">
                                {saving || generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>{t('resume_builder.confirm_save', 'Confirm & Save')}</span>
                            </button>
                        ) : (
                            <button onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-1 px-3 py-1.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-xl transition-all font-semibold text-[11px] sm:text-xs shadow-md shadow-blue-600/10 hover:shadow-lg disabled:opacity-50 shrink-0">
                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                <span>{t('resume_builder.download', 'Download')}<span className="hidden sm:inline"> {t('resume_builder.pdf', 'PDF')}</span></span>
                            </button>
                        )
                    )}
                </div>
            </header>
            <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
                {/* Form Section */}
                <section className={`flex-1 flex-col relative ${currentStep === steps.length - 1 ? 'hidden' : 'flex w-full'}`}>
                    <div className="flex-1 lg:overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-10">
                            {/* Modern Responsive Stepper */}
                            <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-bold text-[#1a3884] dark:text-blue-400 uppercase tracking-widest">
                                        {t('resume_builder.step_of', 'Step {{current}} of {{total}} :', { current: currentStep + 1, total: steps.length })} <span className="text-slate-800 dark:text-slate-200">{steps[currentStep].label}</span>
                                    </span>
                                </div>
                                
                                {/* Progress Bar / Stepper Track */}
                                <div className="relative flex items-center justify-between w-full px-2 sm:px-16">
                                    {/* Track line container */}
                                    <div className="absolute left-6 sm:left-20 right-6 sm:right-20 top-1/2 -translate-y-1/2 h-1 -z-0">
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
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
                                                        isActive 
                                                            ? 'bg-[#1a3884] text-white ring-4 ring-blue-500/20 scale-110 shadow-md shadow-blue-500/10'
                                                            : isCompleted
                                                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                                                : 'bg-white dark:bg-[#002147] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20'
                                                    }`}
                                                    title={step.label}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    ) : (
                                                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    )}
                                                </button>
                                                
                                                {/* Step label - hidden on mobile to avoid layout crowding */}
                                                <span className={`absolute top-10 sm:top-11 text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block transition-all duration-300 ${
                                                    isActive 
                                                        ? 'text-[#1a3884] dark:text-blue-400 font-extrabold scale-105'
                                                        : isCompleted
                                                            ? 'text-emerald-600 dark:text-emerald-400'
                                                            : 'text-slate-400 dark:text-slate-500'
                                                }`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-2 sm:h-8" aria-hidden="true" /> {/* spacing for labels */}
                            </div>

                            <div className="min-h-[400px]">
                                {steps[currentStep].id === 'personal' && (
                                    <div className="space-y-6">
                                        {/* Career Path Selection Banner/Cards */}
                                        <div className="bg-white dark:bg-[#002147] p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm" style={{ display: (embedded && jobContext) ? 'none' : 'block' }}>
                                            {careerLoading ? (
                                                <div className="flex items-center gap-3 text-slate-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span className="text-sm font-medium">{t('resume_builder.checking_career', 'Checking career direction...')}</span>
                                                </div>
                                            ) : careerPaths?.primary ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {careerLocked ? (
                                                            <IconLock stroke={2} className="w-4 h-4 text-[#1a3884] dark:text-blue-400" />
                                                        ) : (
                                                            <IconLockOpen stroke={2} className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                                        )}
                                                        <h3 className="text-xs font-bold text-slate-800 dark:text-white">{t('resume_builder.select_target_path', 'Select Target Career Path')}</h3>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">{t('resume_builder.select_path_desc', 'Choose one of your career paths to automatically optimize this resume.')}</p>
                                                    
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
                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-[#1a3884] dark:text-blue-300' : 'text-slate-400'}`}>{t('resume_builder.path_label', '{{tier}} Path', { tier: t(`resume_builder.tier_${key}`, key) })}</span>
                                                                    <span className={`text-xs font-bold truncate w-full ${isSelected ? 'text-[#1a3884] dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{roleName}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {!careerLocked && (
                                                        <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-2 items-start">
                                                            <IconLockOpen className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-amber-700 dark:text-amber-500">{t('resume_builder.eval_note', 'Note: Your career direction is currently in evaluation mode. Your latest analysis will automatically lock as your permanent career path after 14 days or once you use all 5 attempts.')}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50">
                                                    <IconLockOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-sm font-bold text-amber-800 dark:text-amber-500 mb-1">{t('resume_builder.no_career_path', 'No Career Path Found')}</h4>
                                                        <p className="text-xs text-amber-700/80 dark:text-amber-500/80">{t('resume_builder.no_career_path_desc', 'Complete your AI Career Analysis in the Career Agent to automatically tailor your resume and skills.')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6 bg-white dark:bg-[#002147] p-4 sm:p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.profile_photo', 'Profile Photo (Optional)')}</label>
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
                                                    <div className="flex-1 w-full">
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
                                                        <p className="text-[10px] text-slate-400 mt-1">{t('resume_builder.photo_hint', 'Recommended for Modern Profile template. Max size 2MB.')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.full_name', 'Full Name')}</label>
                                                <div className="relative group/input">
                                                    <User className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                    <input type="text" value={resumeData.personalInfo.fullName} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F1F5F9] dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl outline-none cursor-not-allowed text-slate-700 dark:text-slate-400 transition-all text-sm font-semibold shadow-sm" title={t('resume_builder.full_name_title', 'Full name is verified from your profile and cannot be changed here.')} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.target_role', 'Target Role')}</label>
                                                <div className="relative group/input">
                                                    <Briefcase className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                    <input type="text" placeholder={t('resume_builder.target_role_placeholder', 'Select a career path above')} value={(embedded && jobContext) ? (jobContext.displayTitle || jobContext.title || jobContext.jobTitle || resumeData.personalInfo.targetRole) : resumeData.personalInfo.targetRole} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F1F5F9] dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-2xl outline-none cursor-not-allowed text-slate-700 dark:text-slate-400 transition-all text-sm font-semibold shadow-sm" title={t('resume_builder.target_role_title', 'Target Role is automatically set based on your selected Career Path or Job.')} />
                                                </div>
                                            </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.email_address', 'Email Address')}</label>
                                                <div className="relative group/input">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="email" placeholder="email@example.com" value={resumeData.personalInfo.email} onChange={(e) => handleNestedChange('personalInfo', 'email', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.mobile_number', 'Mobile Number')}</label>
                                                <div className="relative group/input">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="+91 00000 00000" value={resumeData.personalInfo.mobile} onChange={(e) => handleNestedChange('personalInfo', 'mobile', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                            <div className="relative group/input">
                                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                <input type="text" placeholder={t('resume_builder.location_placeholder', 'City, State, Country')} value={resumeData.personalInfo.location} onChange={(e) => handleNestedChange('personalInfo', 'location', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.linkedin_url', 'LinkedIn URL')}</label>
                                                <div className="relative group/input">
                                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="linkedin.com/in/username" value={resumeData.personalInfo.linkedinUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'linkedinUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.github_url', 'GitHub URL')}</label>
                                                <div className="relative group/input">
                                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#1a3884] dark:group-focus-within/input:text-blue-400 pointer-events-none" />
                                                    <input type="text" placeholder="github.com/username" value={resumeData.personalInfo.githubUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'githubUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-[#1a3884] focus:ring-4 focus:ring-[#1a3884]/10 dark:focus:border-blue-400 dark:focus:ring-blue-400/10 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>



                                        <div className="group">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('resume_builder.professional_summary', 'Professional Summary')}</label>
                                                <button 
                                                    onClick={handleGenerateSummary}
                                                    disabled={isGeneratingSummary}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
                                                >
                                                    {isGeneratingSummary ? (
                                                        <><Loader2 className="w-3 h-3 animate-spin" /> {t('resume_builder.generating', 'Generating...')}</>
                                                    ) : (
                                                        <><Sparkles className="w-3 h-3" /> {t('resume_builder.generate_ai', 'Generate with AI')}</>
                                                    )}
                                                </button>
                                            </div>
                                            <textarea value={resumeData.summary} onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))} rows={4} className="w-full p-4 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm resize-none" placeholder={t('resume_builder.summary_placeholder', 'A brief overview of your professional background and key strengths...')}></textarea>
                                        </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'experience' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.experience.map((exp, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                                                            <span className="truncate">{exp.company || t('resume_builder.work_experience', 'Work Experience')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('experience', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.company', 'Company')}</label>
                                                                <input type="text" placeholder={t('resume_builder.company_placeholder', 'Company Name')} value={exp.company} onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.job_role', 'Job Role')}</label>
                                                                <input type="text" placeholder={t('resume_builder.job_role_placeholder', 'e.g. Project Associate')} value={exp.role} onChange={(e) => handleArrayChange('experience', idx, 'role', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.duration', 'Duration')}</label>
                                                                <input type="text" placeholder={t('resume_builder.duration_placeholder', 'e.g. 2021 - Present')} value={exp.duration} onChange={(e) => handleArrayChange('experience', idx, 'duration', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                                                <input type="text" placeholder={t('resume_builder.city_state', 'City, State')} value={exp.location} onChange={(e) => handleArrayChange('experience', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.exp_desc_placeholder', 'Key responsibilities and achievements...')} value={exp.description} onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[100px] resize-none" rows={4}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', location: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#1a3884] hover:text-[#1a3884] transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_experience', 'Add Experience')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'education' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.education.map((edu, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
                                                            <span className="truncate">{edu.institution || t('resume_builder.education_details', 'Education Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('education', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.institution_name', 'Institution Name')}</label>
                                                            <input type="text" placeholder={t('resume_builder.institution_placeholder', 'College / University Name')} value={edu.institution} onChange={(e) => handleArrayChange('education', idx, 'institution', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.degree', 'Degree')}</label>
                                                                <input type="text" placeholder={t('resume_builder.degree_placeholder', 'e.g. MCA or B.Tech')} value={edu.degree} onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.year_of_passing', 'Year of Passing')}</label>
                                                                <input type="text" placeholder={t('resume_builder.year_placeholder', 'e.g. 2025')} value={edu.year} onChange={(e) => handleArrayChange('education', idx, 'year', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.grade_cgpa', 'Grade / CGPA')}</label>
                                                                <input type="text" placeholder={t('resume_builder.grade_placeholder', 'e.g. 8.5 CGPA')} value={edu.grade} onChange={(e) => handleArrayChange('education', idx, 'grade', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                                                <input type="text" placeholder={t('resume_builder.city_state', 'City, State')} value={edu.location} onChange={(e) => handleArrayChange('education', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('education', { institution: '', degree: '', grade: '', year: '', location: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_education', 'Add Education')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'projects' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.projects.map((proj, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                                                            <span className="truncate">{proj.title || t('resume_builder.project_details', 'Project Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('projects', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.project_title', 'Project Title')}</label>
                                                                <input type="text" placeholder={t('resume_builder.project_name_placeholder', 'Project Name')} value={proj.title} onChange={(e) => handleArrayChange('projects', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.project_link', 'Project Link')}</label>
                                                                <input type="text" placeholder={t('resume_builder.link_placeholder', 'URL or [Link]')} value={proj.link} onChange={(e) => handleArrayChange('projects', idx, 'link', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.proj_desc_placeholder', 'Describe the technology and your contribution...')} value={proj.description} onChange={(e) => handleArrayChange('projects', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[80px] resize-none" rows={3}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('projects', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-indigo-500 hover:text-indigo-500 transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_project', 'Add Project')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'skills' && (
                                    <div className="space-y-6">
                                        {/* Job Context Skills */}
                                        {embedded && jobContext && jobSkills.length > 0 && (
                                            <div className="bg-white dark:bg-[#002147] p-4 sm:p-6 rounded-3xl border border-[#1a3884]/30 shadow-sm animate-fade-in relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-[#1a3884]/5 dark:to-indigo-900/5 pointer-events-none" />
                                                <div className="relative">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Briefcase className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('resume_builder.job_required_skills', 'Job Required Skills')}</h3>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                                                        {t('resume_builder.job_skills_desc', 'Click to add these requested skills from the job posting to your technical skills.')}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {jobSkills.map(skill => {
                                                            const added = resumeData.skills.technical.toLowerCase().includes(skill.toLowerCase());
                                                            if (added) {
                                                                return (
                                                                    <span key={skill} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-xl border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1.5 opacity-80 cursor-default">
                                                                        {skill} <Check className="w-3.5 h-3.5" />
                                                                    </span>
                                                                );
                                                            }
                                                            return (
                                                                <button key={skill} onClick={() => {
                                                                    setResumeData(prev => ({
                                                                        ...prev,
                                                                        skills: { ...prev.skills, technical: prev.skills.technical ? `${prev.skills.technical}, ${skill}` : skill }
                                                                    }));
                                                                }} className="px-3 py-1.5 bg-white hover:bg-[#1a3884] dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-700 hover:text-white dark:text-slate-300 text-[11px] font-bold rounded-xl border border-slate-200 hover:border-[#1a3884] dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm hover:shadow group/btn">
                                                                    {skill} <Plus className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white transition-colors" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Suggestions Card */}
                                        {careerPaths && (
                                            <div className="bg-white dark:bg-[#002147] p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm animate-fade-in">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Sparkles className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">{t('resume_builder.career_suggestions', 'Career Agent Suggestions')}</h3>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {masteredSkills.length > 0 && (
                                                        <div>
                                                            <div className="flex items-center gap-1.5 mb-2 text-emerald-600 dark:text-emerald-400">
                                                                <Check className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('resume_builder.mastered_auto', 'Mastered (Auto-added)')}</span>
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
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">{t('resume_builder.in_progress_click', 'In Progress (Click to add)')}</span>
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
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-6 bg-white dark:bg-[#002147] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm animate-fade-in">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.technical_skills', 'Technical Skills')}</label>
                                                <textarea value={resumeData.skills.technical} onChange={(e) => handleNestedChange('skills', 'technical', e.target.value)} rows={4} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder={t('resume_builder.technical_placeholder', 'e.g. JavaScript, React, Node.js, Python, AWS...')}></textarea>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.soft_skills', 'Soft Skills')}</label>
                                                <textarea value={resumeData.skills.soft} onChange={(e) => handleNestedChange('skills', 'soft', e.target.value)} rows={3} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder={t('resume_builder.soft_placeholder', 'e.g. Team Leadership, Problem Solving, Public Speaking...')}></textarea>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.languages', 'Languages')}</label>
                                                <textarea value={resumeData.skills.languages} onChange={(e) => handleNestedChange('skills', 'languages', e.target.value)} rows={2} className="w-full p-4 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#1a3884]/20 focus:border-[#1a3884] outline-none dark:text-white transition-all text-sm font-medium resize-none shadow-sm" placeholder={t('resume_builder.languages_placeholder', 'e.g. English (Fluent), Urdu (Native), Tamil...')}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'achievements' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <AnimatePresence>
                                            {resumeData.achievements.map((ach, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
                                                    <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-black text-slate-800 dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                                                            <span className="truncate">{ach.title || t('resume_builder.achievement_details', 'Achievement Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('achievements', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.achievement_title', 'Achievement Title')}</label>
                                                                <input type="text" placeholder={t('resume_builder.achievement_title_placeholder', 'e.g. Best Student Award')} value={ach.title} onChange={(e) => handleArrayChange('achievements', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.link', 'Link')}</label>
                                                                <input type="text" placeholder={t('resume_builder.link_placeholder', 'URL or [Link]')} value={ach.link} onChange={(e) => handleArrayChange('achievements', idx, 'link', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.ach_desc_placeholder', 'Provide some context about this achievement...')} value={ach.description} onChange={(e) => handleArrayChange('achievements', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F8FAFC] dark:bg-[#00152E] border border-slate-200 dark:border-white/10 rounded-2xl text-sm dark:text-white outline-none focus:border-blue-500 min-h-[60px] resize-none" rows={2}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('achievements', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-amber-500 hover:text-amber-500 transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_achievement', 'Add Achievement')}
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
                                    <ArrowLeft className="w-4 h-4" /> {t('resume_builder.previous', 'Previous')}
                                </button>
                                <button
                                    onClick={nextStep}
                                    className={`flex items-center gap-2 px-6 py-2.5 bg-[#1a3884] hover:bg-[#132c6b] text-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-[#1a3884]/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#1a3884]/30 active:scale-95 ${currentStep === steps.length - 1 ? 'hidden' : 'flex'}`}
                                >
                                    {t('resume_builder.next_step', 'Next Step')}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Preview Canvas (Shows on last step) */}
                <section
                    ref={containerRef}
                    className={`flex-1 flex flex-col lg:overflow-hidden relative bg-slate-50 dark:bg-[#001a3d] ${currentStep === steps.length - 1 ? 'flex' : 'hidden'}`}
                >
                    {!isPreviewFullscreen ? (
                        /* Layout Template Selector Dashboard */
                        <div className="flex-1 flex flex-col lg:overflow-hidden">
                            {/* Selector Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/10 shrink-0 shadow-sm">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-655 dark:text-slate-355 bg-slate-100 dark:bg-slate-800 hover:bg-slate-205 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-202 dark:border-white/10 self-start sm:self-auto"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> {t('resume_builder.back_to_edit', 'Back to Edit Details')}
                                </button>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white text-center sm:text-left">{t('resume_builder.choose_template', 'Choose A Template Style')}</h2>
                                <div className="hidden sm:block w-[130px]" />
                            </div>

                            {/* Template Grid Scroll Area */}
                            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col items-center">
                                <div className="text-center max-w-xl mb-8">
                                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-2">
                                        {t('resume_builder.select_ats_layout', 'Select an ATS-Friendly Layout')}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-405 leading-relaxed">
                                        {t('resume_builder.ats_layout_desc', 'Our templates are professionally designed and engineered to pass applicant tracking systems (ATS). Select a style below to view your resume in full-screen and download.')}
                                    </p>
                                </div>

                                {/* ATS Breakdown Panel */}
                                <div className="w-full max-w-6xl bg-white dark:bg-[#002147] rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm mb-10 overflow-hidden">
                                    <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 shrink-0">
                                                <CircularScoreRing score={atsScore} size={56} strokeWidth={6} label="" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{t('resume_builder.ats_compliance_score', 'ATS Compliance Score')}</h3>
                                                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('resume_builder.ats_compliance_desc', "Detailed breakdown of your resume's parser performance")}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <AnimatePresence>
                                            {atsBreakdown.map((item, index) => {
                                                const feedback = item.checks.filter(c => !c.pass).map(c => c.label).join(', ') || t('resume_builder.perfect_score', 'Perfect score! All checks passed.');
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
                                                                <span className="flex items-start gap-1"><span className="text-amber-500 mt-0.5 shrink-0">•</span> <span>{t('resume_builder.needs_improvement', 'Needs improvement:')} {feedback}</span></span>
                                                            )}
                                                        </p>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
                                    {Object.values(templates).map((tpl) => (
                                        <div
                                            key={tpl.id}
                                            className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-205 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
                                        >
                                            {/* Simulated Preview graphic */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-white/5 flex items-center justify-center">
                                                <TemplateThumbnail type={tpl.id} />
                                            </div>

                                            {/* Details */}
                                            <div className="p-5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                            {t(`resume_builder.templates.${tpl.id}.name`, tpl.name)}
                                                        </h3>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-[#1a3884] dark:text-blue-300 whitespace-nowrap">
                                                            {t(`resume_builder.templates.${tpl.id}.tag`, tpl.tag)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                                        {t(`resume_builder.templates.${tpl.id}.desc`, tpl.desc)}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setSelectedTemplate(tpl.id);
                                                        setIsPreviewFullscreen(true);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#1a3884] hover:bg-[#152e6c] text-white font-semibold rounded-lg text-xs transition-all shadow-md group-hover:scale-[1.02]"
                                                >
                                                    <Eye className="w-3.5 h-3.5" /> {t('resume_builder.preview_select', 'Preview & Select')}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Full Screen Interactive Preview */
                        <div className="flex-1 flex flex-col lg:overflow-hidden">
                            {/* Toolbar with navigation and controls */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-white dark:bg-[#002147] border-b border-slate-202 dark:border-white/10 shrink-0 shadow-md">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsPreviewFullscreen(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-655 dark:text-slate-355 bg-slate-105 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-202 dark:border-white/10"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> {t('resume_builder.all_styles', 'All Styles')}
                                    </button>
                                    
                                    <div className="h-8 w-px bg-slate-202 dark:bg-white/10 hidden sm:block"></div>

                                    {/* ATS Score Compact View */}
                                    {!embedded && (
                                        <div className="flex items-center gap-3">
                                            <CircularScoreRing score={atsScore} size={40} strokeWidth={4} label="" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{t('resume_builder.ats_score', 'ATS Score')}</span>
                                                <span className="text-[10px] text-slate-505 dark:text-slate-400">{t('resume_builder.score_updates', 'Score updates as you edit')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-505 dark:text-slate-400 hidden sm:block">
                                            {t('resume_builder.style', 'Style:')}
                                        </label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-800 border border-slate-202 dark:border-white/10 text-slate-855 dark:text-white text-xs font-semibold rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-[#1a3884] cursor-pointer w-full sm:w-auto"
                                        >
                                            {Object.values(templates).map((tpl) => (
                                                <option key={tpl.id} value={tpl.id}>
                                                    {t(`resume_builder.templates.${tpl.id}.name`, tpl.name)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {embedded ? (
                                        <button
                                            onClick={handleConfirmAndSave}
                                            disabled={saving || generating}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a3884] hover:bg-[#152e6c] disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#1a3884]/20 hover:shadow-lg flex-1 sm:flex-initial shrink-0"
                                        >
                                            {saving || generating ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('resume_builder.saving', 'Saving...')}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" /> {t('resume_builder.confirm_save', 'Confirm & Save')}
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={generating}
                                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1a3884] hover:bg-[#152e6c] disabled:bg-slate-400 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#1a3884]/20 hover:shadow-lg flex-1 sm:flex-initial shrink-0"
                                        >
                                            {generating ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('resume_builder.generating', 'Generating...')}
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4" /> {t('resume_builder.download_pdf', 'Download PDF')}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable canvas area */}
                            <div className="flex-1 lg:overflow-auto custom-scrollbar p-4 md:p-8">
                                <div
                                    className="flex justify-center items-start mx-auto"
                                    style={{
                                        width: scale < 1 ? `${794 * scale}px` : '100%',
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

                                        <div className="relative z-10 text-left pb-[20mm]">
                                            {/* Header Section */}
                                            <div className={`flex w-full mb-6 ${templates[selectedTemplate]?.hasPhoto ? 'items-center' : ''}`}>
                                                {templates[selectedTemplate]?.hasPhoto && resumeData.personalInfo.profileImage && (
                                                    <div className="w-[28mm] h-[28mm] rounded-full overflow-hidden mr-6 border-2 border-[#1a3884] shrink-0">
                                                        <img src={resumeData.personalInfo.profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <div className={(selectedTemplate === 'modern' || selectedTemplate === 'tech' || selectedTemplate === 'modernProfile') ? 'flex flex-col items-start text-left relative z-10 w-full' : 'flex flex-col items-center text-center relative z-10 w-full'}>
                                                    <h1 className={templates[selectedTemplate]?.titleClass} style={{ fontFamily: templates[selectedTemplate]?.fontFamily }}>
                                                        {resumeData.personalInfo.fullName || t('resume_builder.first_last', 'FIRST LAST')}
                                                    </h1>
                                                    <h2 className={templates[selectedTemplate]?.subtitleClass}>{resumeData.personalInfo.targetRole || t('resume_builder.professional_title', 'Professional Title')}</h2>

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
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.professional_summary', 'Professional Summary')}</h3>
                                                        <p className={`${templates[selectedTemplate]?.bodyTextClass} whitespace-pre-wrap`}>
                                                            {resumeData.summary}
                                                        </p>
                                                    </section>
                                                )}

                                                {/* Education */}
                                                {resumeData.education.length > 0 && (
                                                    <div className={templates[selectedTemplate]?.sectionClass}>
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.education_heading', 'Education')}</h3>
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
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.experience_heading', 'Professional Experience')}</h3>
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
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.projects_heading', 'Projects')}</h3>
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
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.skills_heading', 'Skills')}</h3>
                                                        <div className={templates[selectedTemplate]?.skillsClass || "text-[11px] space-y-1 px-1 !text-gray-700"}>
                                                            {resumeData.skills.technical && (
                                                                <div>
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.technical_skills_label', 'Technical Skills:')}</span>{' '}
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
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.soft_skills_label', 'Soft Skills:')}</span>{' '}
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
                                                                    <span className={templates[selectedTemplate]?.skillsLabelClass}>{t('resume_builder.languages_label', 'Languages:')}</span>{' '}
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
                                                        <h3 className={templates[selectedTemplate]?.sectionHeaderClass}>{t('resume_builder.achievements_heading', 'Achievements')}</h3>
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
                                                    {ORG_NAME} {t('resume_builder.verified_resume', 'Verified Resume')}
                                                </div>
                                                <p className="mt-1 text-[9.5px] !text-gray-600">
                                                    {t('resume_builder.document_id', 'Document ID:')} <span className="font-semibold !text-black">{resumePublicId || t('resume_builder.pending', 'Pending')}</span>
                                                    {studentId && (
                                                        <> &bull; {t('resume_builder.student_id', 'Student ID:')} <span className="font-semibold !text-black">{studentId}</span></>
                                                    )}
                                                </p>
                                                <p className="text-[8.5px] !text-gray-500 mt-0.5">{t('resume_builder.scan_qr', 'Scan the QR code to verify the authenticity of this document online.')}</p>
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
