import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconFileDescription,
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
import { ATS_TEMPLATES, adaptData } from './ResumeTemplates';
import NeuralBackground from '@/components/ui/NeuralBackground';
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
    if (type === 'classicBW') {
        return (
            <div className="w-full h-32 bg-white border border-[#d7ebf5] rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
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
    if (type === 'navySerif') {
        return (
            <div className="w-full h-32 bg-white border border-[#d7ebf5] rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
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
                        <div className="w-4/5 h-1 bg-slate-300 rounded" />
                    </div>
                    <div className="w-full flex gap-1">
                        <div className="w-2 h-2 bg-blue-100 rounded-full" />
                        <div className="w-5/6 h-1 bg-slate-200 rounded" />
                    </div>
                </div>
                <div className="w-full flex justify-between items-center pl-3 border-t border-[#d7ebf5]/60 pt-1">
                    <div className="w-12 h-1 bg-slate-300 rounded" />
                    <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                </div>
            </div>
        );
    }
    if (type === 'charcoalCentered') {
        return (
            <div className="w-full h-32 bg-white border border-[#d7ebf5] rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex flex-col items-center gap-1">
                    <div className="w-24 h-2 bg-[#0d3a5f] rounded-full" />
                    <div className="w-36 h-[1px] bg-slate-200" />
                    <div className="w-20 h-1 bg-slate-400 rounded-full" />
                    <div className="w-36 h-[1px] bg-slate-200" />
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    <div className="w-20 h-1.5 bg-[#0d3a5f] rounded" />
                    <div className="w-full flex gap-2">
                        <div className="w-1/4 h-1 bg-slate-300 rounded" />
                        <div className="w-3/4 h-1 bg-slate-200 rounded" />
                    </div>
                </div>
                <div className="w-full flex justify-between items-center border-t border-[#0d3a5f]/20 pt-1">
                    <div className="w-14 h-1 bg-slate-300 rounded" />
                    <div className="w-4 h-4 bg-slate-200 rounded-sm" />
                </div>
            </div>
        );
    }
    if (type === 'minimalModern') {
        return (
            <div className="w-full h-32 bg-white border border-[#d7ebf5] rounded p-3 flex flex-col gap-1.5 justify-between select-none pointer-events-none">
                <div className="flex flex-col gap-0.5">
                    <div className="w-20 h-2 bg-slate-800 rounded-sm" />
                    <div className="w-16 h-1.5 bg-[#045C9A] rounded-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full mt-1 border-b border-[#d7ebf5] pb-1">
                    <div className="w-12 h-1.5 bg-slate-800 rounded-sm" />
                </div>
                <div className="flex flex-col gap-1 w-full mt-1">
                    <div className="w-full flex gap-1 pl-1">
                        <div className="w-1 h-1 bg-[#045C9A] rounded-full mt-[1px]" />
                        <div className="w-5/6 h-1 bg-slate-300 rounded-sm" />
                    </div>
                </div>
                <div className="w-full flex gap-1 pl-1">
                    <div className="px-1 py-0.5 bg-slate-100 border border-[#d7ebf5] rounded text-[5px] text-slate-700">API</div>
                    <div className="px-1 py-0.5 bg-slate-100 border border-[#d7ebf5] rounded text-[5px] text-slate-700">React</div>
                    <div className="px-1 py-0.5 bg-slate-100 border border-[#d7ebf5] rounded text-[5px] text-slate-700">Node</div>
                </div>
            </div>
        );
    }
    // forestFormal
    return (
        <div className="w-full h-32 bg-white border border-[#d7ebf5] rounded p-3 flex flex-col gap-1 justify-between select-none pointer-events-none">
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
            <div className="w-full h-[1px] bg-slate-300 mt-1" />
        </div>
    );
};



// Same ambient layer the dashboard, courses and assessments pages use, so the
// builder reads as one product with them. Off inside the placement modal,
// which paints its own surface.
const BuilderBackdrop = ({ dark }) => (
    <>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-25">
            <NeuralBackground theme={dark ? 'dark' : 'light'} />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#045C9A]/5 via-blue-500/5 to-transparent blur-[120px] dark:from-blue-900/10" />
            <div className="absolute bottom-10 right-10 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 via-blue-600/5 to-transparent blur-[120px] dark:from-indigo-900/10" />
        </div>
    </>
);

// Same chip the assessment stage cards use for "36 Qs / 45 min".
const MetaChip = ({ icon: Icon, label, tone = 'neutral' }) => (
    <span
        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
            tone === 'success'
                ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-[#d7ebf5] bg-[#F1F5F9] text-slate-600 dark:border-white/10 dark:bg-[#072036]/60 dark:text-slate-300'
        }`}
    >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{label}</span>
    </span>
);

const ResumeBuilder = ({ embedded = false, jobContext = null, onClose = null, viewOnly = false, preloadedData = null }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(viewOnly ? false : true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
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
    const [userSkills, setUserSkills] = useState([]); // Raw user skills from platform
    const [skillChipsLoading, setSkillChipsLoading] = useState(false);
    const [jobSkills, setJobSkills] = useState([]); // Skills from job posting
    const [verifiedCgpa, setVerifiedCgpa] = useState(null);

    const [dataLoaded, setDataLoaded] = useState(false);

    // The constellation canvas paints from a prop, not CSS, so it has to be
    // told when the dark class flips -- same observer the dashboard uses.
    const [isDarkTheme, setIsDarkTheme] = useState(
        typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
    );
    useEffect(() => {
        if (embedded || typeof document === 'undefined') return undefined;
        const observer = new MutationObserver(() => {
            setIsDarkTheme(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [embedded]);

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
    const [selectedTemplate, setSelectedTemplate] = useState('classicBW');
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
            domain: '',
            ai: '',
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
            if (preloadedData.template) {
                setSelectedTemplate(preloadedData.template);
            }
            setDataLoaded(true);
        }
    }, [preloadedData]);

    // Keep primary college education entry synced with verified CGPA
    useEffect(() => {
        if (verifiedCgpa) {
            setResumeData(prev => {
                if (!prev.education || prev.education.length === 0) return prev;
                if (prev.education[0].grade === verifiedCgpa) return prev;
                const nextEdu = [...prev.education];
                nextEdu[0] = { ...nextEdu[0], grade: verifiedCgpa };
                return { ...prev, education: nextEdu };
            });
        }
    }, [verifiedCgpa]);

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

            let fetchedCgpa = null;
            if (hydratedProfileRes.success) {
                const pData = hydratedProfileRes.richProfile || {};
                const pReg = hydratedProfileRes.registration || {};
                const pStudent = hydratedProfileRes.student || {};
                const pUser = hydratedProfileRes.user || {};
                setStudentId(pData.studentId || pReg.studentId || pStudent.studentId || '');
                
                fetchedCgpa = extractCgpa(pStudent, pUser, pReg, pData);
                if (fetchedCgpa) {
                    setVerifiedCgpa(fetchedCgpa);
                }
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
                
                let loadedEdu = r.education || [];
                if (fetchedCgpa && loadedEdu.length > 0) {
                    loadedEdu[0] = { ...loadedEdu[0], grade: fetchedCgpa };
                }
                
                setResumeData({
                    personalInfo: r.personalInfo || {},
                    summary: r.summary || '',
                    experience: r.experience || [],
                    education: loadedEdu,
                    skills: { technical: r.skills?.technical || '', domain: r.skills?.domain || '', ai: r.skills?.ai || '', languages: r.skills?.languages || '' },
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
                    primary: analysisRes.analysis.primary?.tab1?.role_name || null,
                    secondary: analysisRes.analysis.secondary?.tab1?.role_name || null,
                    tertiary: analysisRes.analysis.tertiary?.tab1?.role_name || null,
                };
                setCareerPaths(paths);
                // Auto-select primary path
                if (paths.primary) {
                    setSelectedCareerPath({ key: 'primary', roleName: paths.primary });
                }
            } else if (analysisRes) {
                // Fallback in case of old structure
                const paths = {
                    primary: analysisRes.primary?.tab1?.role_name || null,
                    secondary: analysisRes.secondary?.tab1?.role_name || null,
                    tertiary: analysisRes.tertiary?.tab1?.role_name || null,
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

    // ── Skill chips: the student's Completed / In Progress skills, grouped
    //    Technical / Domain / AI. Progress records carry no category, so it is
    //    resolved against the skill lists of ALL the student's career paths
    //    (primary, secondary, tertiary). Resolving against the primary role
    //    alone dumped every skill earned for the other two paths into
    //    "Technical", which is why Domain and AI never showed anything.
    const fetchSkillChips = useCallback(async (roleNames, email) => {
        const roles = (roleNames || []).filter(Boolean);
        if (roles.length === 0) return;
        setSkillChipsLoading(true);
        try {
            const emailToUse = email || userEmail || JSON.parse(sessionStorage.getItem('user') || '{}').email || '';

            const [userSkillsRes, ...roleResList] = await Promise.all([
                emailToUse ? apiCall(`/career-agent/user-skills/${encodeURIComponent(emailToUse)}`).catch(() => null) : Promise.resolve(null),
                ...roles.map(r => apiCall(`/career-agent/role-skills/${encodeURIComponent(r)}`).catch(() => null)),
            ]);

            const roleSkills = roleResList.flatMap(r => r?.skills || []);
            const userSkillsRaw = Array.isArray(userSkillsRes) ? userSkillsRes : [];

            const mastered = userSkillsRaw.filter(s => s.status === 'Completed').map(s => s.skillName);
            const inProgress = userSkillsRaw.filter(s => s.status === 'In Progress').map(s => s.skillName);
            const known = new Set([...mastered, ...inProgress].map(s => (s || '').toLowerCase().trim()));
            const suggested = roleSkills
                .filter(s => !known.has((s.skillName || '').toLowerCase().trim()) && s.skillCategory !== 'Soft Skill')
                .map(s => s.skillName);

            setMasteredSkills(mastered);
            setInProgressSkills(inProgress);
            setSuggestedSkills([...new Set(suggested)]);

            const catLabel = (name) => {
                const row = roleSkills.find(rs => (rs.skillName || '').toLowerCase().trim() === (name || '').toLowerCase().trim());
                const c = row?.skillCategory;
                if (c === 'Domain') return 'Domain Skill';
                if (c === 'AI-Tool') return 'AI Skill';
                if (c === 'Soft Skill') return 'Soft Skill';
                return 'Technical Skill';
            };
            setUserSkills(userSkillsRaw
                .map(u => ({ ...u, skillCategory: u.skillCategory || catLabel(u.skillName) }))
                .filter(u => u.skillCategory !== 'Soft Skill'));
        } catch (e) {
            console.error('Skill chips fetch error:', e);
        } finally {
            setSkillChipsLoading(false);
        }
    }, [userEmail]);

    // Refetch once the career paths resolve. The typed Target Role does not
    // drive this: suggestions come from the paths chosen in Career Directions,
    // not from free text.
    useEffect(() => {
        if (!dataLoaded) return;
        const roles = [careerPaths.primary, careerPaths.secondary, careerPaths.tertiary].filter(Boolean);
        if (roles.length) fetchSkillChips(roles);
    }, [careerPaths, fetchSkillChips, dataLoaded]);



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

    // Robust CGPA extractor from all possible profile sources
    const extractCgpa = (student, user, reg, richProfile) => {
        // 1. Check latest record in academicRecords
        const academicRecords = student?.academicRecords || user?.academicRecords;
        if (Array.isArray(academicRecords) && academicRecords.length > 0) {
            const sorted = [...academicRecords].sort((a, b) => (Number(a.semester) || 0) - (Number(b.semester) || 0));
            const latest = sorted[sorted.length - 1];
            if (latest && (latest.cgpa || latest.sgpa)) {
                const val = Number(latest.cgpa || latest.sgpa);
                if (!isNaN(val) && val > 0) {
                    const sem = Number(latest.semester);
                    return sem ? `${val.toFixed(2)} CGPA (Upto Sem ${sem})` : `${val.toFixed(2)} CGPA`;
                }
            }
        }

        // 2. Check if richProfile already formatted it with semester
        if (richProfile?.cgpa && typeof richProfile.cgpa === 'string' && richProfile.cgpa.includes('CGPA')) {
            return richProfile.cgpa;
        }

        const sem = Number(student?.academic?.latestSemester || student?.academic?.currentSemester || student?.currentSemester || richProfile?.latestSemester || richProfile?.academic?.latestSemester);
        const semSuffix = sem ? ` (Upto Sem ${sem})` : '';

        // 3. Check direct cgpa / overallCgpa fields
        const candidates = [
            student?.cgpa,
            student?.academic?.overallCgpa,
            richProfile?.overallCgpa,
            richProfile?.academic?.overallCgpa,
            reg?.cgpa,
            reg?.cgpaPercentage,
            reg?.higherEducation?.[0]?.cgpaPercentage,
            user?.academic?.overallCgpa,
            user?.cgpa
        ];

        for (const cand of candidates) {
            if (cand !== undefined && cand !== null && cand !== '' && cand !== 0 && cand !== '0') {
                const num = parseFloat(String(cand).replace(/[^0-9.]/g, ''));
                if (!isNaN(num) && num > 0) {
                    return `${num.toFixed(2)} CGPA${semSuffix}`;
                }
            }
        }

        return null;
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

        const formattedCgpa = extractCgpa(student, user, reg, data) || verifiedCgpa;

        // Education
        const eduList = [];
        if (listFrom(reg.higherEducation).length > 0) {
            listFrom(reg.higherEducation).forEach((edu, idx) => {
                eduList.push({
                    degree: firstCleanValue(edu.degreeFullName, edu.degree, edu.qualificationLevel),
                    institution: firstCleanValue(edu.institutionName, edu.university, reg.institution, data.college),
                    year: firstCleanValue(edu.yearOfPassing, edu.graduationYear),
                    grade: idx === 0
                        ? firstCleanValue(formattedCgpa, edu.cgpaPercentage ? `${edu.cgpaPercentage}` : null, edu.percentage, edu.grade)
                        : firstCleanValue(edu.cgpaPercentage ? `${edu.cgpaPercentage}` : null, edu.percentage, edu.grade),
                    location: firstCleanValue(edu.location, defaultLoc)
                });
            });
        } else if (reg.institution || data.college || formattedCgpa) {
            eduList.push({
                degree: firstCleanValue(reg.educationLevel, reg.academic?.degreeLevel, data.department, 'Student'),
                institution: firstCleanValue(reg.institution, data.college, 'SMAART Institute'),
                year: firstCleanValue(reg.yearOfPassing, data.batch),
                grade: firstCleanValue(formattedCgpa, data.academic?.overallCgpa ? `${data.academic.overallCgpa} CGPA` : ''),
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
                domain: base?.skills?.domain || '',
                ai: base?.skills?.ai || '',
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
                const cgpa = extractCgpa(hydratedRes.student, hydratedRes.user, hydratedRes.registration, hydratedRes.richProfile);
                if (cgpa) {
                    setVerifiedCgpa(cgpa);
                }
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
                versionName,
                targetRole: resumeData.personalInfo?.targetRole || '',
                template: selectedTemplate,
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
                const cgpa = extractCgpa(hydratedRes.student, hydratedRes.user, hydratedRes.registration, hydratedRes.richProfile);
                if (cgpa) {
                    setVerifiedCgpa(cgpa);
                }
                const newResumeData = buildResumeDataFromProfile(hydratedRes, null);
                setResumeData(newResumeData);
            } else {
                // Fallback to blank slate if profile fetch fails
                setResumeData({
                    personalInfo: { fullName: '', email: '', mobile: '', location: '', targetRole: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', profileImage: '' },
                    summary: '',
                    experience: [],
                    education: [],
                    skills: { technical: '', domain: '', ai: '', languages: '' },
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
                skills: { technical: '', domain: '', ai: '', languages: '' },
                projects: [],
                achievements: [],
                personalDetails: { fatherName: '', motherName: '', dob: '', nationality: '' }
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEditResume = (resume) => {
        setResumeId(resume._id);
        setVersionName(resume.versionName || 'My Resume');

        if (resume.template) {
            setSelectedTemplate(resume.template);
        }

        // If the resume has a targetRole that matches one of their paths, auto-select it
        if (resume.targetRole) {
            const foundKey = Object.keys(careerPaths).find(key => careerPaths[key] === resume.targetRole);
            if (foundKey) {
                setSelectedCareerPath({ key: foundKey, roleName: resume.targetRole });
            } else {
                setSelectedCareerPath({ key: 'custom', roleName: resume.targetRole });
            }
        }

        let loadedEdu = resume.education || [];
        if (verifiedCgpa && loadedEdu.length > 0) {
            loadedEdu[0] = { ...loadedEdu[0], grade: verifiedCgpa };
        }

        setResumeData({
            personalInfo: resume.personalInfo || {},
            summary: resume.summary || '',
            experience: resume.experience || [],
            education: loadedEdu,
            skills: { technical: resume.skills?.technical || '', domain: resume.skills?.domain || '', ai: resume.skills?.ai || '', languages: resume.skills?.languages || '' },
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
            <div className="h-full w-full flex items-center justify-center bg-[#F1F5F9] dark:bg-[#072036]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full border-4 border-[#045C9A]/20"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-[#045C9A] animate-spin"></div>
                    </div>
                    <p className="text-[#045C9A] dark:text-[#A6D7E8] font-bold animate-pulse uppercase tracking-widest text-xs">{t('resume_builder.loading', 'Loading Builder...')}</p>
                </div>
            </div>
        );
    }

    if (viewOnly) {
        const TemplateComponent = (ATS_TEMPLATES[selectedTemplate] || ATS_TEMPLATES.classicBW).Component;

        const footer = (
            <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] pt-4 border-t border-gray-300 flex justify-between items-center gap-4 text-left z-20 bg-white">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider !text-slate-700">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#045C9A]" />
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
                    <img src={verificationQr} alt="Resume verification QR code" className="w-12 h-12 border border-[#d7ebf5] bg-white p-0.5 shrink-0" />
                ) : (
                    <div className="w-12 h-12 border border-[#d7ebf5] bg-white flex items-center justify-center shrink-0">
                        <QrCode className="w-6 h-6 text-slate-400" />
                    </div>
                )}
            </div>
        );

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
                        style={{
                            transform: scale < 1 ? `scale(${scale})` : 'none',
                            transformOrigin: 'top center',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        <TemplateComponent data={adaptData(resumeData)} watermark={<ResumeWatermark />} footer={footer} />
                    </div>
                </div>
            </div>
        );
    }

    if (pageMode === 'list') {
        return (
            <div className={`relative flex flex-col h-full overflow-hidden font-sans selection:bg-[#045C9A] selection:text-white ${embedded ? 'bg-[#F1F5F9] dark:bg-[#072036]' : 'bg-transparent'}`}>
                {!embedded && <BuilderBackdrop dark={isDarkTheme} />}
                <main className="relative z-10 flex-1 overflow-y-auto">
                    {/* Same container, gaps and padding as the assessments and
                        courses pages, so the three read as one product. */}
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 p-4 pb-10 sm:gap-6 sm:p-5 lg:p-6">

                        {/* Back */}
                        <div className="flex items-center">
                            <button
                                onClick={() => {
                                    if (embedded && onClose) onClose();
                                    else navigate('/dashboard/smaart-toolkit');
                                }}
                                className="group flex w-fit items-center gap-3 selection:bg-transparent"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7ebf5] bg-white shadow-sm transition-all duration-300 group-hover:border-[#045C9A]/40 group-hover:shadow-md dark:border-white/10 dark:bg-white/5">
                                    <IconArrowLeft stroke={2} className="h-4 w-4 text-[#034a7d] transition-transform group-hover:-translate-x-0.5 dark:text-slate-300" />
                                </div>
                                <span className="text-xs font-extrabold uppercase tracking-widest text-[#034a7d] transition-colors group-hover:text-[#045C9A] dark:text-[#A6D7E8] dark:group-hover:text-white">
                                    {t('resume_builder.back_to_toolkit', 'Back to Toolkit')}
                                </span>
                            </button>
                        </div>

                        {/* Page hero -- same structure, padding and type scale as the
                            assessments and courses heroes. */}
                        <motion.section
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                            className="relative w-full overflow-hidden rounded-2xl border border-[#d7ebf5]/80 bg-white shadow-sm dark:border-[#045C9A]/20 dark:bg-[#0d3a5f]"
                        >
                            <div className="pointer-events-none absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-[#EAF7FD]/70 to-transparent dark:from-[#045C9A]/10" />

                            <div className="relative z-10 flex flex-col gap-5 px-6 py-5 sm:px-8 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
                                <div className="min-w-0 max-w-2xl">
                                    <h1
                                        className="text-xl font-extrabold leading-tight tracking-tight text-[#072036] dark:text-white sm:text-2xl"
                                        style={{ letterSpacing: '-0.02em' }}
                                    >
                                        {t('resume_builder.list_title_1', 'My')} {t('resume_builder.list_title_2', 'Resumes')}
                                    </h1>
                                    <p className="mt-0.5 text-xs font-medium text-[#35566b] dark:text-slate-400 sm:text-sm">
                                        {t('resume_builder.list_subtitle', 'Manage your tailored resumes and keep them ready for every application.')}
                                    </p>
                                    {!resumeListLoading && resumeList.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <MetaChip icon={FileText} label={t('resume_builder.resume_count', '{{count}} resumes', { count: resumeList.length })} />
                                        </div>
                                    )}
                                </div>

                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleCreateNew}
                                        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0E2136] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b3457] hover:shadow-md sm:w-auto dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                                    >
                                        <IconPlus stroke={2.5} className="h-3.5 w-3.5" />
                                        {t('resume_builder.create_new', 'Create New Resume')}
                                    </button>
                                </div>
                            </div>
                        </motion.section>

                        <motion.section
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                        >
                            {resumeListLoading ? (
                                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                    {[0, 1, 2].map((item) => (
                                        <div key={item} className="animate-pulse overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-[#0d3a5f]">
                                            <div className="mb-4 flex items-start gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-[#F1F5F9] dark:bg-white/10" />
                                                <div className="flex-1 space-y-2 pt-1">
                                                    <div className="h-4 w-3/5 rounded bg-[#F1F5F9] dark:bg-white/10" />
                                                    <div className="h-3 w-2/5 rounded bg-[#F1F5F9] dark:bg-white/10" />
                                                </div>
                                            </div>
                                            <div className="mb-5 flex gap-2">
                                                <div className="h-7 w-28 rounded-lg bg-[#F1F5F9] dark:bg-white/10" />
                                                <div className="h-7 w-24 rounded-lg bg-[#F1F5F9] dark:bg-white/10" />
                                            </div>
                                            <div className="h-9 rounded-lg bg-[#F1F5F9] dark:bg-white/10" />
                                        </div>
                                    ))}
                                </div>
                            ) : resumeList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7ebf5] bg-white/80 px-6 py-14 text-center dark:border-white/10 dark:bg-[#0d3a5f]/70">
                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                                        <IconFileDescription stroke={1.75} className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-[#072036] dark:text-white">{t('resume_builder.no_resumes', 'No resumes yet')}</h3>
                                    <p className="mt-1 max-w-sm text-sm text-slate-600 dark:text-slate-300">{t('resume_builder.no_resumes_desc', 'Create your first resume to get started on your career journey.')}</p>
                                    <button onClick={handleCreateNew} className="mt-6 inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#0E2136] px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white">
                                        <IconPlus stroke={2.5} className="h-3.5 w-3.5" />
                                        {t('resume_builder.create_first', 'Create First Resume')}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 xl:grid-cols-3">
                                    {resumeList.map((resume, index) => {
                                        const name = resume.versionName || t('resume_builder.default_name', 'My Resume');
                                        const templateName = t(`resume_builder.templates.${resume.template || 'classicBW'}.name`, (ATS_TEMPLATES[resume.template] || ATS_TEMPLATES.classicBW).name);
                                        const updated = new Date(resume.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
                                        const verified = !!resume.verification?.resumePublicId;
                                        const isRenaming = renamingId === resume._id;
                                        return (
                                            <motion.div
                                                key={resume._id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(index, 8) * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
                                                className="group h-full"
                                            >
                                                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#d7ebf5] bg-white shadow-[0_2px_16px_rgba(4,92,154,0.05)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#045C9A]/30 hover:shadow-[0_6px_20px_rgba(4,92,154,0.10)] motion-reduce:hover:translate-y-0 dark:border-white/10 dark:bg-[#0d3a5f]">
                                                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                                                        {/* Header: icon badge + name + role, template tag on the right */}
                                                        <div className="mb-4 flex items-start justify-between gap-3">
                                                            <div className="flex min-w-0 items-start gap-3">
                                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d7ebf5] bg-[#EAF7FD] text-[#045C9A] shadow-sm dark:border-[#045C9A]/30 dark:bg-[#045C9A]/20 dark:text-[#A6D7E8]">
                                                                    <IconFileDescription stroke={1.75} className="h-5 w-5" />
                                                                </div>
                                                                <div className="min-w-0 pt-0.5">
                                                                    {isRenaming ? (
                                                                        <input
                                                                            autoFocus
                                                                            value={renameValue}
                                                                            onChange={e => setRenameValue(e.target.value)}
                                                                            onKeyDown={e => {
                                                                                if (e.key === 'Enter') renameResume(resume._id, renameValue);
                                                                                if (e.key === 'Escape') setRenamingId(null);
                                                                            }}
                                                                            onBlur={() => renameResume(resume._id, renameValue)}
                                                                            className="w-full rounded-lg border border-[#045C9A] bg-white px-2 py-1 text-base font-bold leading-tight text-[#072036] outline-none ring-4 ring-[#045C9A]/10 dark:bg-[#072036] dark:text-white"
                                                                        />
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            title={t('resume_builder.rename', 'Rename')}
                                                                            onClick={() => { setRenamingId(resume._id); setRenameValue(name); }}
                                                                            className="group/name flex max-w-full items-center gap-1.5 text-left"
                                                                        >
                                                                            <h3 className="truncate text-base font-bold leading-tight tracking-tight text-[#072036] dark:text-white">{name}</h3>
                                                                            <IconPencil stroke={2} className="h-3 w-3 shrink-0 text-slate-400 opacity-0 transition-opacity group-hover/name:opacity-100" />
                                                                        </button>
                                                                    )}
                                                                    <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                                                        {resume.targetRole || t('resume_builder.general_resume', 'General Resume')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <span className="shrink-0 rounded border border-[#d7ebf5] bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                                                                {templateName}
                                                            </span>
                                                        </div>

                                                        <div className="mb-5 flex flex-wrap items-center gap-2">
                                                            <MetaChip icon={Calendar} label={t('resume_builder.updated_on', 'Updated {{date}}', { date: updated })} />
                                                            {verified
                                                                ? <MetaChip icon={ShieldCheck} tone="success" label={t('resume_builder.verified', 'Verified')} />
                                                                : <MetaChip icon={IconPencil} label={t('resume_builder.draft', 'Draft')} />}
                                                        </div>

                                                        {/* Footer: primary edit + two icon actions, same 36px rail as the stage cards */}
                                                        <div className="mt-auto flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditResume(resume)}
                                                                className="group/btn flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0E2136] text-[13px] font-semibold text-white transition-colors hover:bg-[#1b3457] dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white"
                                                            >
                                                                <IconPencil stroke={2} className="h-4 w-4 shrink-0" />
                                                                <span>{t('resume_builder.edit_resume', 'Edit Resume')}</span>
                                                                <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover/btn:translate-x-0.5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDuplicateResume(resume._id, e)}
                                                                disabled={duplicatingId === resume._id}
                                                                title={t('resume_builder.copy', 'Duplicate')}
                                                                aria-label={t('resume_builder.copy', 'Duplicate')}
                                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d7ebf5] bg-white text-slate-600 transition-colors hover:border-[#045C9A]/40 hover:bg-[#EAF7FD] hover:text-[#045C9A] disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                                                            >
                                                                {duplicatingId === resume._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconCopy stroke={1.75} className="h-4 w-4" />}
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleDeleteResume(resume._id, e)}
                                                                disabled={deletingId === resume._id}
                                                                title={t('resume_builder.delete', 'Delete')}
                                                                aria-label={t('resume_builder.delete', 'Delete')}
                                                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d7ebf5] bg-white text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-rose-500/30 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                                                            >
                                                                {deletingId === resume._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconTrash stroke={1.75} className="h-4 w-4" />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.section>
                    </div>
                </main>
            </div>
        );
    }

    // --- Builder Mode Return ---
    return (
        <div className={`relative flex flex-col lg:h-full lg:overflow-hidden font-sans selection:bg-[#045C9A] selection:text-white ${embedded ? 'bg-[#F1F5F9] dark:bg-[#072036]' : 'bg-transparent'}`}>
            {!embedded && <BuilderBackdrop dark={isDarkTheme} />}
            {/* Header */}
            <header className="relative min-h-[4rem] flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 sm:py-0 bg-white dark:bg-[#0d3a5f] border-b border-[#d7ebf5] dark:border-white/8 z-30 shrink-0 shadow-sm gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <button onClick={async () => {
                        if (embedded && onClose) {
                            onClose();
                        } else {
                            await fetchResumeList();
                            setPageMode('list');
                        }
                    }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.06] hover:bg-[#EAF7FD] dark:hover:bg-white/10 border border-[#d7ebf5] dark:border-white/10 rounded-xl transition-all font-bold text-[10px] sm:text-[11px] text-[#072036] dark:text-slate-200 uppercase tracking-wider shrink-0 shadow-sm">
                        <IconArrowLeft stroke={2} className="w-3.5 h-3.5" /> {t('resume_builder.back', 'Back')}
                    </button>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="min-w-0">
                            <div className="relative flex items-center group">
                                <input
                                    value={versionName}
                                    onChange={(e) => setVersionName(e.target.value)}
                                    className="text-base sm:text-lg font-extrabold text-[#072036] dark:text-white tracking-tight leading-tight bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-[#045C9A] outline-none transition-colors w-28 sm:w-48 pr-6 truncate"
                                    placeholder={t('resume_builder.resume_name_placeholder', 'Resume Name')}
                                />
                                <IconPencil stroke={2} className="w-3.5 h-3.5 text-slate-400 absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2.5 sm:pt-0 border-[#d7ebf5]/60 dark:border-white/5">
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EAF7FD] dark:bg-[#045C9A]/20 text-[#045C9A] dark:text-[#A6D7E8] border border-[#d7ebf5] dark:border-[#045C9A]/30">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{resumePublicId || t('resume_builder.secure_resume', 'Secure Resume')}</span>
                    </div>
                    {/* Re-pull name, contact, education, experience, projects and
                        certificates from the student's profile. Before this, a
                        resume opened for editing never saw profile updates. */}
                    <button onClick={() => handleSyncProfile(false)} disabled={isSyncing || saving} title={t('resume_builder.sync_profile_title', 'Refresh this resume with the latest details from your profile')} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.06] hover:bg-[#EAF7FD] dark:hover:bg-white/10 text-[#072036] dark:text-slate-200 rounded-xl transition-all font-semibold text-[11px] sm:text-xs border border-[#d7ebf5] dark:border-white/10 disabled:opacity-50 shadow-sm shrink-0">
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{t('resume_builder.sync_profile', 'Sync Profile')}</span>
                    </button>
                    {currentStep !== steps.length - 1 && (
                        <button onClick={() => handleStepClick(steps.length - 1)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.06] hover:bg-[#EAF7FD] dark:hover:bg-white/10 text-[#072036] dark:text-slate-200 rounded-xl transition-all font-semibold text-[11px] sm:text-xs border border-[#d7ebf5] dark:border-white/10 shadow-sm shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t('resume_builder.review', 'Review')}</span>
                        </button>
                    )}
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/[0.06] hover:bg-[#EAF7FD] dark:hover:bg-white/10 text-[#072036] dark:text-slate-200 rounded-xl transition-all font-semibold text-[11px] sm:text-xs border border-[#d7ebf5] dark:border-white/10 disabled:opacity-50 shadow-sm shrink-0">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{t('resume_builder.save', 'Save')}<span className="hidden sm:inline"> {t('resume_builder.progress', 'Progress')}</span></span>
                    </button>
                    {currentStep === steps.length - 1 && (
                        embedded ? (
                            <button onClick={handleConfirmAndSave} disabled={saving || generating} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0E2136] hover:bg-[#1b3457] text-white dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white rounded-xl transition-all font-semibold text-[11px] sm:text-xs shadow-md shadow-[#0E2136]/20 hover:shadow-lg disabled:opacity-50 shrink-0">
                                {saving || generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>{t('resume_builder.confirm_save', 'Confirm & Save')}</span>
                            </button>
                        ) : (
                            <button onClick={handleDownloadPDF} disabled={generating} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0E2136] hover:bg-[#1b3457] text-white dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white rounded-xl transition-all font-semibold text-[11px] sm:text-xs shadow-md shadow-[#0E2136]/20 hover:shadow-lg disabled:opacity-50 shrink-0">
                                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                <span>{t('resume_builder.download', 'Download')}<span className="hidden sm:inline"> {t('resume_builder.pdf', 'PDF')}</span></span>
                            </button>
                        )
                    )}
                </div>
            </header>
            <main className="relative z-10 flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
                {/* Form Section */}
                <section className={`flex-1 flex-col relative ${currentStep === steps.length - 1 ? 'hidden' : 'flex w-full'}`}>
                    <div className="flex-1 lg:overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-10">
                            {/* Modern Responsive Stepper */}
                            <div className="bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl p-4 sm:p-6 shadow-sm mb-6 sm:mb-8">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[11px] font-bold text-[#0E2136] dark:text-[#A6D7E8] uppercase tracking-widest">
                                        {t('resume_builder.step_of', 'Step {{current}} of {{total}} :', { current: currentStep + 1, total: steps.length })} <span className="text-[#072036] dark:text-white">{steps[currentStep].label}</span>
                                    </span>
                                </div>

                                {/* Progress Bar / Stepper Track */}
                                <div className="relative flex items-center justify-between w-full px-2 sm:px-16">
                                    {/* Track line container */}
                                    <div className="absolute left-6 sm:left-20 right-6 sm:right-20 top-1/2 -translate-y-1/2 h-1 -z-0">
                                        {/* Background Track Line */}
                                        <div className="absolute inset-0 bg-[#d7ebf5] dark:bg-white/10 rounded-full" />
                                        {/* Active Progress Line */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-[#0E2136] dark:bg-[#A6D7E8] rounded-full transition-all duration-550 ease-in-out"
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
                                                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${isActive
                                                            ? 'bg-[#0E2136] text-white ring-4 ring-[#0E2136]/15 scale-110 shadow-md shadow-[#0E2136]/25 dark:bg-[#A6D7E8] dark:text-[#072036] dark:ring-[#A6D7E8]/20'
                                                            : isCompleted
                                                                ? 'bg-[#EAF7FD] dark:bg-[#A6D7E8]/15 text-[#0E2136] dark:text-[#A6D7E8] border border-[#0E2136]/30 dark:border-[#A6D7E8]/30 hover:bg-[#d7ebf5] dark:hover:bg-[#A6D7E8]/25'
                                                                : 'bg-white dark:bg-[#0d3a5f] text-slate-400 dark:text-slate-500 border border-[#d7ebf5] dark:border-white/10 hover:border-[#045C9A]/40 dark:hover:border-white/20'
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
                                                <span className={`absolute top-10 sm:top-11 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap hidden sm:block transition-all duration-300 ${isActive
                                                        ? 'text-[#0E2136] dark:text-[#A6D7E8] font-extrabold'
                                                        : isCompleted
                                                            ? 'text-[#072036] dark:text-slate-300'
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
                                        {/* Target Role is free text. It defaults to the primary career
                                            path (handleCreateNew) or the job title in the placement
                                            modal, and the student can overwrite it with anything. */}
                                        <div className="space-y-6 bg-white dark:bg-[#0d3a5f] p-4 sm:p-8 rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm">

                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.full_name', 'Full Name')}</label>
                                                <div className="relative group/input">
                                                    <User className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                                    <input type="text" value={resumeData.personalInfo.fullName} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F1F5F9] dark:bg-white/[0.06] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none cursor-not-allowed text-slate-700 dark:text-slate-400 transition-all text-sm font-semibold shadow-sm" title={t('resume_builder.full_name_title', 'Full name is verified from your profile and cannot be changed here.')} />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.target_role', 'Target Role')}</label>
                                                <div className="relative group/input">
                                                    <Briefcase className="absolute z-10 left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                    <input type="text" placeholder={t('resume_builder.target_role_placeholder', 'e.g. Frontend Developer, Marketing Executive')} value={resumeData.personalInfo.targetRole || ''} onChange={(e) => handleNestedChange('personalInfo', 'targetRole', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.email_address', 'Email Address')}</label>
                                                    <div className="relative group/input">
                                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                        <input type="email" placeholder="email@example.com" value={resumeData.personalInfo.email} onChange={(e) => handleNestedChange('personalInfo', 'email', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.mobile_number', 'Mobile Number')}</label>
                                                    <div className="relative group/input">
                                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                        <input type="text" placeholder="+91 00000 00000" value={resumeData.personalInfo.mobile} onChange={(e) => handleNestedChange('personalInfo', 'mobile', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                                <div className="relative group/input">
                                                    <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                    <input type="text" placeholder={t('resume_builder.location_placeholder', 'City, State, Country')} value={resumeData.personalInfo.location} onChange={(e) => handleNestedChange('personalInfo', 'location', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="group">
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.linkedin_url', 'LinkedIn URL')}</label>
                                                    <div className="relative group/input">
                                                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                        <input type="text" placeholder="linkedin.com/in/username" value={resumeData.personalInfo.linkedinUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'linkedinUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.github_url', 'GitHub URL')}</label>
                                                    <div className="relative group/input">
                                                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within/input:text-[#045C9A] dark:group-focus-within/input:text-[#A6D7E8] pointer-events-none" />
                                                        <input type="text" placeholder="github.com/username" value={resumeData.personalInfo.githubUrl || ''} onChange={(e) => handleNestedChange('personalInfo', 'githubUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:focus:border-[#A6D7E8] dark:focus:ring-[#A6D7E8]/10 dark:text-white transition-all text-sm font-semibold shadow-sm" />
                                                    </div>
                                                </div>
                                            </div>



                                            <div className="group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('resume_builder.professional_summary', 'Professional Summary')}</label>

                                                </div>
                                                <textarea value={resumeData.summary} onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))} rows={4} className="w-full p-4 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 rounded-2xl outline-none focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 dark:text-white transition-all text-sm font-semibold shadow-sm resize-none" placeholder={t('resume_builder.summary_placeholder', 'A brief overview of your professional background and key strengths...')}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'experience' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.experience.map((exp, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-[#F1F5F9]/70 dark:bg-white/[0.04] px-4 sm:px-6 py-4 border-b border-[#d7ebf5] dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-bold text-[#072036] dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <Briefcase className="w-4 h-4 text-[#045C9A] shrink-0" />
                                                            <span className="truncate">{exp.company || t('resume_builder.work_experience', 'Work Experience')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('experience', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.company', 'Company')}</label>
                                                                <input type="text" placeholder={t('resume_builder.company_placeholder', 'Company Name')} value={exp.company} onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.job_role', 'Job Role')}</label>
                                                                <input type="text" placeholder={t('resume_builder.job_role_placeholder', 'e.g. Project Associate')} value={exp.role} onChange={(e) => handleArrayChange('experience', idx, 'role', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.duration', 'Duration')}</label>
                                                                <input type="text" placeholder={t('resume_builder.duration_placeholder', 'e.g. 2021 - Present')} value={exp.duration} onChange={(e) => handleArrayChange('experience', idx, 'duration', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                                                <input type="text" placeholder={t('resume_builder.city_state', 'City, State')} value={exp.location} onChange={(e) => handleArrayChange('experience', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.exp_desc_placeholder', 'Key responsibilities and achievements...')} value={exp.description} onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 min-h-[100px] resize-none" rows={4}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', location: '', description: '' })} className="w-full py-6 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#045C9A] hover:text-[#045C9A] transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_experience', 'Add Experience')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'education' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.education.map((edu, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-[#F1F5F9]/70 dark:bg-white/[0.04] px-4 sm:px-6 py-4 border-b border-[#d7ebf5] dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-bold text-[#072036] dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <GraduationCap className="w-4 h-4 text-[#045C9A] shrink-0" />
                                                            <span className="truncate">{edu.institution || t('resume_builder.education_details', 'Education Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('education', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.institution_name', 'Institution Name')}</label>
                                                            <input type="text" placeholder={t('resume_builder.institution_placeholder', 'College / University Name')} value={edu.institution} onChange={(e) => handleArrayChange('education', idx, 'institution', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.degree', 'Degree')}</label>
                                                                <input type="text" placeholder={t('resume_builder.degree_placeholder', 'e.g. MCA or B.Tech')} value={edu.degree} onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.year_of_passing', 'Year of Passing')}</label>
                                                                <input type="text" placeholder={t('resume_builder.year_placeholder', 'e.g. 2025')} value={edu.year} onChange={(e) => handleArrayChange('education', idx, 'year', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.grade_cgpa', 'Grade / CGPA')}</label>
                                                                <div className="relative">
                                                                    <input type="text" placeholder={t('resume_builder.grade_placeholder', 'e.g. 8.5 CGPA')} value={edu.grade} onChange={(e) => handleArrayChange('education', idx, 'grade', e.target.value)} className={`w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 ${idx === 0 ? 'pr-10 bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50 cursor-not-allowed text-emerald-800 dark:text-emerald-300 font-bold' : ''}`} readOnly={idx === 0} title={idx === 0 ? "Auto-synced from College Academic Records" : ""} />
                                                                    {idx === 0 && (
                                                                        <ShieldCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" title="Auto-synced from College Academic Records" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.location', 'Location')}</label>
                                                                <input type="text" placeholder={t('resume_builder.city_state', 'City, State')} value={edu.location} onChange={(e) => handleArrayChange('education', idx, 'location', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('education', { institution: '', degree: '', grade: '', year: '', location: '' })} className="w-full py-6 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#045C9A] hover:text-[#045C9A] transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_education', 'Add Education')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'projects' && (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {resumeData.projects.map((proj, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm overflow-hidden animate-fade-in">
                                                    <div className="bg-[#F1F5F9]/70 dark:bg-white/[0.04] px-4 sm:px-6 py-4 border-b border-[#d7ebf5] dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-bold text-[#072036] dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <FileText className="w-4 h-4 text-[#045C9A] shrink-0" />
                                                            <span className="truncate">{proj.title || t('resume_builder.project_details', 'Project Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('projects', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.project_title', 'Project Title')}</label>
                                                                <input type="text" placeholder={t('resume_builder.project_name_placeholder', 'Project Name')} value={proj.title} onChange={(e) => handleArrayChange('projects', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.project_link', 'Project Link')}</label>
                                                                <input type="text" placeholder={t('resume_builder.link_placeholder', 'URL or [Link]')} value={proj.link} onChange={(e) => handleArrayChange('projects', idx, 'link', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.proj_desc_placeholder', 'Describe the technology and your contribution...')} value={proj.description} onChange={(e) => handleArrayChange('projects', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 min-h-[80px] resize-none" rows={3}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('projects', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#045C9A] hover:text-[#045C9A] transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_project', 'Add Project')}
                                        </button>
                                    </div>
                                )}

                                {steps[currentStep].id === 'skills' && (
                                    <div className="space-y-6">
                                        {/* Job Context Skills */}
                                        {embedded && jobContext && jobSkills.length > 0 && (
                                            <div className="bg-white dark:bg-[#0d3a5f] p-4 sm:p-6 rounded-2xl border border-[#045C9A]/30 shadow-sm animate-fade-in relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-[#EAF7FD] to-[#F1F5F9] dark:from-[#045C9A]/5 dark:to-[#045C9A]/10 pointer-events-none" />
                                                <div className="relative">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <Briefcase className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8]" />
                                                        <h3 className="text-sm font-bold text-[#072036] dark:text-white uppercase tracking-wider">{t('resume_builder.job_required_skills', 'Job Required Skills')}</h3>
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
                                                                }} className="px-3 py-1.5 bg-white hover:bg-[#0E2136] dark:bg-slate-800 dark:hover:bg-[#0E2136] text-slate-700 hover:text-white dark:text-slate-300 text-[11px] font-bold rounded-xl border border-[#d7ebf5] hover:border-[#0E2136] dark:border-slate-700 transition-all flex items-center gap-1.5 shadow-sm hover:shadow group/btn">
                                                                    {skill} <Plus className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white transition-colors" />
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Skills from the student's career paths: every Completed and
                                            In Progress skill, grouped Technical / Domain / AI. */}
                                        {(skillChipsLoading || userSkills.length > 0) && (
                                            <div className="bg-white dark:bg-[#0d3a5f] p-4 sm:p-6 rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm animate-fade-in">
                                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Sparkles className="w-5 h-5 text-[#045C9A] dark:text-[#A6D7E8] shrink-0" />
                                                            <h3 className="text-sm font-bold text-[#072036] dark:text-white">{t('resume_builder.career_suggestions', 'Skills from your career path')}</h3>
                                                        </div>
                                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                            {t('resume_builder.career_suggestions_desc', 'Everything you have completed or are working on across your chosen career paths. Click a skill to add it to your resume.')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0">
                                                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{t('resume_builder.skill_completed', 'Completed')}</span>
                                                        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />{t('resume_builder.skill_in_progress', 'In progress')}</span>
                                                    </div>
                                                </div>

                                                {skillChipsLoading ? (
                                                    <div className="flex items-center gap-2 py-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        <Loader2 className="w-4 h-4 animate-spin" /> {t('resume_builder.loading_skills', 'Loading your skills...')}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-5">
                                                        {[
                                                            { label: t('resume_builder.technical_skills', 'Technical Skills'), field: 'technical', match: (c) => c === 'Technical Skill' },
                                                            { label: t('resume_builder.domain_skills', 'Domain Skills'), field: 'domain', match: (c) => c === 'Domain Skill' },
                                                            { label: t('resume_builder.ai_skills', 'AI Skills'), field: 'ai', match: (c) => c === 'AI Skill' || c === 'GenAI Skill' },
                                                        ].map((group) => {
                                                            const items = userSkills.filter(s => s.skillName && (s.status === 'Completed' || s.status === 'In Progress') && group.match(s.skillCategory));
                                                            if (items.length === 0) return null;
                                                            const currentField = (resumeData.skills[group.field] || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
                                                            return (
                                                                <div key={group.field}>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#045C9A] dark:text-[#A6D7E8]">{group.label}</span>
                                                                        <span className="text-[10px] font-semibold tabular-nums text-slate-400">{items.length}</span>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {items.map(s => {
                                                                            const added = currentField.includes(s.skillName.toLowerCase());
                                                                            const done = s.status === 'Completed';
                                                                            if (added) {
                                                                                return (
                                                                                    <span key={s.skillName} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-200 dark:border-emerald-800/50 cursor-default">
                                                                                        {s.skillName} <Check className="w-3 h-3" />
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return (
                                                                                <button key={s.skillName} type="button" title={done ? t('resume_builder.skill_completed', 'Completed') : t('resume_builder.skill_in_progress', 'In progress')} onClick={() => {
                                                                                    setResumeData(prev => ({
                                                                                        ...prev,
                                                                                        skills: { ...prev.skills, [group.field]: prev.skills[group.field] ? `${prev.skills[group.field]}, ${s.skillName}` : s.skillName }
                                                                                    }));
                                                                                }} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#EAF7FD] hover:bg-[#d7ebf5] dark:bg-[#045C9A]/20 dark:hover:bg-[#045C9A]/35 text-[#045C9A] dark:text-[#A6D7E8] text-[11px] font-bold rounded-lg border border-[#d7ebf5] dark:border-[#A6D7E8]/25 transition-colors shadow-sm">
                                                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${done ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                                                    {s.skillName} <Plus className="w-3 h-3" />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="space-y-6 bg-white dark:bg-[#0d3a5f] p-8 rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm animate-fade-in">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.technical_skills', 'Technical Skills')}</label>
                                                <textarea value={resumeData.skills.technical || ''} onChange={(e) => handleNestedChange('skills', 'technical', e.target.value)} rows={3} className="w-full p-4 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#045C9A]/20 focus:border-[#045C9A] outline-none dark:text-white transition-all text-sm font-semibold resize-none shadow-sm" placeholder={t('resume_builder.technical_placeholder', 'e.g. JavaScript, React, Node.js, Python, AWS...')}></textarea>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.domain_skills', 'Domain Skills')}</label>
                                                <textarea value={resumeData.skills.domain || ''} onChange={(e) => handleNestedChange('skills', 'domain', e.target.value)} rows={2} className="w-full p-4 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#045C9A]/20 focus:border-[#045C9A] outline-none dark:text-white transition-all text-sm font-semibold resize-none shadow-sm" placeholder={t('resume_builder.domain_placeholder', 'e.g. Project Management, Agile, Healthcare, Finance...')}></textarea>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.ai_skills', 'AI Skills')}</label>
                                                <textarea value={resumeData.skills.ai || ''} onChange={(e) => handleNestedChange('skills', 'ai', e.target.value)} rows={2} className="w-full p-4 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#045C9A]/20 focus:border-[#045C9A] outline-none dark:text-white transition-all text-sm font-semibold resize-none shadow-sm" placeholder={t('resume_builder.ai_placeholder', 'e.g. Prompt Engineering, Midjourney, ChatGPT...')}></textarea>
                                            </div>

                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.languages', 'Languages')}</label>
                                                <textarea value={resumeData.skills.languages} onChange={(e) => handleNestedChange('skills', 'languages', e.target.value)} rows={2} className="w-full p-4 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#045C9A]/20 focus:border-[#045C9A] outline-none dark:text-white transition-all text-sm font-semibold resize-none shadow-sm" placeholder={t('resume_builder.languages_placeholder', 'e.g. English (Fluent), Urdu (Native), Tamil...')}></textarea>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {steps[currentStep].id === 'achievements' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <AnimatePresence>
                                            {resumeData.achievements.map((ach, idx) => (
                                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-[#0d3a5f] rounded-2xl border border-[#d7ebf5] dark:border-white/10 shadow-sm overflow-hidden">
                                                    <div className="bg-[#F1F5F9]/70 dark:bg-white/[0.04] px-4 sm:px-6 py-4 border-b border-[#d7ebf5] dark:border-white/10 flex justify-between items-center gap-4 min-w-0">
                                                        <h4 className="font-bold text-[#072036] dark:text-white text-sm flex items-center gap-2 truncate">
                                                            <Trophy className="w-4 h-4 text-[#045C9A] shrink-0" />
                                                            <span className="truncate">{ach.title || t('resume_builder.achievement_details', 'Achievement Details')}</span>
                                                        </h4>
                                                        <button onClick={() => removeArrayItem('achievements', idx)} className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="p-4 sm:p-6 space-y-4">
                                                        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.achievement_title', 'Achievement Title')}</label>
                                                                <input type="text" placeholder={t('resume_builder.achievement_title_placeholder', 'e.g. Best Student Award')} value={ach.title} onChange={(e) => handleArrayChange('achievements', idx, 'title', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">{t('resume_builder.description', 'Description')}</label>
                                                            <textarea placeholder={t('resume_builder.ach_desc_placeholder', 'Provide some context about this achievement...')} value={ach.description} onChange={(e) => handleArrayChange('achievements', idx, 'description', e.target.value)} className="w-full p-3 bg-[#F1F5F9] dark:bg-[#072036] border border-[#d7ebf5] dark:border-white/10 rounded-2xl text-sm font-semibold dark:text-white outline-none transition-all focus:border-[#045C9A] focus:ring-4 focus:ring-[#045C9A]/10 min-h-[60px] resize-none" rows={2}></textarea>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                        <button onClick={() => addArrayItem('achievements', { title: '', link: '', description: '' })} className="w-full py-6 border-2 border-dashed border-[#d7ebf5] dark:border-white/10 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-white dark:hover:bg-slate-900 hover:border-[#045C9A] hover:text-[#045C9A] transition-all">
                                            <Plus className="w-5 h-5" /> {t('resume_builder.add_achievement', 'Add Achievement')}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Navigation buttons inside max-w-4xl card layout */}
                            <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#d7ebf5] dark:border-white/10">
                                <button
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${currentStep === 0
                                        ? 'text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-800/20 cursor-not-allowed opacity-50'
                                        : 'text-slate-700 dark:text-slate-300 bg-white dark:bg-[#0d3a5f] border border-[#d7ebf5] dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#0d3a5f] hover:scale-[1.02] active:scale-95 shadow-sm'
                                        }`}
                                >
                                    <ArrowLeft className="w-4 h-4" /> {t('resume_builder.previous', 'Previous')}
                                </button>
                                <button
                                    onClick={nextStep}
                                    className={`flex items-center gap-2 px-6 py-2.5 bg-[#0E2136] hover:bg-[#1b3457] text-white dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white rounded-2xl text-xs font-bold transition-all duration-300 shadow-md shadow-[#0E2136]/25 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#0E2136]/30 active:scale-95 ${currentStep === steps.length - 1 ? 'hidden' : 'flex'}`}
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
                    className={`flex-1 flex flex-col lg:overflow-hidden relative bg-slate-50 dark:bg-[#072036] ${currentStep === steps.length - 1 ? 'flex' : 'hidden'}`}
                >
                    {!isPreviewFullscreen ? (
                        /* Layout Template Selector Dashboard */
                        <div className="flex-1 flex flex-col lg:overflow-hidden">
                            {/* Selector Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-white dark:bg-[#0d3a5f] border-b border-[#d7ebf5] dark:border-white/10 shrink-0 shadow-sm">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-[#d7ebf5] dark:border-white/10 self-start sm:self-auto"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" /> {t('resume_builder.back_to_edit', 'Back to Edit Details')}
                                </button>
                                <h2 className="text-sm font-bold uppercase tracking-wider text-[#072036] dark:text-white text-center sm:text-left">{t('resume_builder.choose_template', 'Choose A Template Style')}</h2>
                                <div className="hidden sm:block w-[130px]" />
                            </div>

                            {/* Template Grid Scroll Area */}
                            <div className="flex-1 lg:overflow-y-auto custom-scrollbar p-6 md:p-10 flex flex-col items-center">
                                <div className="text-center max-w-xl mb-8">
                                    <h1 className="text-2xl md:text-3xl font-bold text-[#072036] dark:text-white mb-2">
                                        {t('resume_builder.select_ats_layout', 'Select an ATS-Friendly Layout')}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {t('resume_builder.ats_layout_desc', 'Our templates are professionally designed and engineered to pass applicant tracking systems (ATS). Select a style below to view your resume in full-screen and download.')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
                                    {Object.values(ATS_TEMPLATES).map((tpl) => (
                                        <div
                                            key={tpl.id}
                                            className="group flex flex-col bg-white dark:bg-slate-900 border border-[#d7ebf5] dark:border-white/10 rounded-xl overflow-hidden hover:shadow-xl hover:border-slate-300 dark:hover:border-white/20 transition-all duration-300"
                                        >
                                            {/* Simulated Preview graphic */}
                                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-[#d7ebf5]/60 dark:border-white/5 flex items-center justify-center">
                                                <TemplateThumbnail type={tpl.id} />
                                            </div>

                                            {/* Details */}
                                            <div className="p-5 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <h3 className="font-bold text-[#072036] dark:text-white text-base">
                                                            {t(`resume_builder.templates.${tpl.id}.name`, tpl.name)}
                                                        </h3>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF7FD] dark:bg-[#045C9A]/25 text-[#045C9A] dark:text-[#A6D7E8] whitespace-nowrap">
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
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 px-4 bg-[#0E2136] hover:bg-[#1b3457] text-white dark:bg-[#A6D7E8] dark:text-[#072036] dark:hover:bg-white font-semibold rounded-lg text-xs transition-all shadow-md group-hover:scale-[1.02]"
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-6 py-4 bg-white dark:bg-[#0d3a5f] border-b border-[#d7ebf5] dark:border-white/10 shrink-0 shadow-md">
                                <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
                                    <button
                                        onClick={() => setIsPreviewFullscreen(false)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-[#d7ebf5] dark:border-white/10"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> {t('resume_builder.all_styles', 'All Styles')}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#d7ebf5]/60 dark:border-white/5">
                                    <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hidden sm:block">
                                            {t('resume_builder.style', 'Style:')}
                                        </label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-800 border border-[#d7ebf5] dark:border-white/10 text-[#072036] dark:text-white text-xs font-semibold rounded-lg py-1.5 px-3 outline-none focus:ring-1 focus:ring-[#045C9A] cursor-pointer w-full sm:w-auto"
                                        >
                                            {Object.values(ATS_TEMPLATES).map((tpl) => (
                                                <option key={tpl.id} value={tpl.id}>
                                                    {t(`resume_builder.templates.${tpl.id}.name`, tpl.name)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* No save/confirm button here: the sticky header already
                                        carries Save Progress and Confirm & Save / Download PDF. */}
                                </div>
                            </div>

                            {/* Scrollable canvas area */}
                            <div className="flex-1 lg:overflow-auto custom-scrollbar p-4 md:p-8 flex justify-center">
                                <div
                                    style={{
                                        transform: scale < 1 ? `scale(${scale})` : 'none',
                                        transformOrigin: 'top center',
                                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                    }}
                                >
                                    {/* id is what handleDownloadPDF captures with html2canvas — it was
                                        never set anywhere, so the standalone Download button silently
                                        did nothing. Placed inside the scale() wrapper so the capture is
                                        the unscaled 794px page. */}
                                    <div id="resume-preview">
                                        {(() => {
                                            const T = (ATS_TEMPLATES[selectedTemplate] || ATS_TEMPLATES.classicBW).Component;
                                            return <T data={adaptData(resumeData)} />;
                                        })()}
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
