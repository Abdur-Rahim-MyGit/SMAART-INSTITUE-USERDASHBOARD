import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconFileDescription } from '@tabler/icons-react';
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

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const [resumeId, setResumeId] = useState(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [scale, setScale] = useState(1);
    const containerRef = useRef(null);
    const [resumePublicId, setResumePublicId] = useState('');
    const [resumeFingerprint, setResumeFingerprint] = useState('');
    const [verificationUrl, setVerificationUrl] = useState('');
    const [verificationQr, setVerificationQr] = useState('');
    const [studentId, setStudentId] = useState('');

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
            portfolioUrl: ''
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

            // Always capture student ID from profile (used in PDF footer for both branches)
            if (profileRes.success) {
                const pData = profileRes.richProfile || {};
                const pReg = profileRes.registration || {};
                setStudentId(pData.studentId || pReg.studentId || profileRes.student?.studentId || '');
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
            } else if (profileRes.success) {
                const data = profileRes.richProfile || {};
                const reg = profileRes.registration || {};
                // Capture student ID for PDF footer
                setStudentId(data.studentId || reg.studentId || profileRes.student?.studentId || '');

                setResumeData(prev => ({
                    ...prev,
                    personalInfo: {
                        ...prev.personalInfo,
                        fullName: data.fullName || prev.personalInfo.fullName || '',
                        email: data.email || prev.personalInfo.email || '',
                        phone: data.mobile || prev.personalInfo.phone || '',
                        targetRole: data.targetRole || prev.personalInfo.targetRole || '',
                        location: reg.address ? `${reg.address.city || ''}, ${reg.address.state || ''}` : (data.location || prev.personalInfo.location || ''),
                    },
                    summary: reg.bio || prev.summary || '',
                    education: (() => {
                        const eduList = [];
                        if (reg.higherEducation && reg.higherEducation.length > 0) {
                            reg.higherEducation.forEach(edu => {
                                eduList.push({
                                    degree: edu.degreeFullName || edu.degree || '',
                                    institution: edu.institutionName || edu.university || '',
                                    year: edu.yearOfPassing || '',
                                    score: edu.cgpaPercentage || ''
                                });
                            });
                        }
                        else if (reg.institution || data.college) {
                            eduList.push({
                                degree: reg.educationLevel || data.department || 'Student',
                                institution: reg.institution || data.college || 'SMAART Institute',
                                year: reg.yearOfPassing || data.batch || '',
                                score: ''
                            });
                        }

                        if (reg.twelfthDetails && reg.twelfthDetails.schoolName) {
                            eduList.push({
                                degree: `12th Standard (${reg.twelfthDetails.stream || 'N/A'})`,
                                institution: reg.twelfthDetails.schoolName,
                                year: reg.twelfthDetails.yearOfPassing || '',
                                score: reg.twelfthDetails.percentage || ''
                            });
                        }
                        if (reg.tenthDetails && reg.tenthDetails.schoolName) {
                            eduList.push({
                                degree: '10th Standard',
                                institution: reg.tenthDetails.schoolName,
                                year: reg.tenthDetails.yearOfPassing || '',
                                score: reg.tenthDetails.percentage || ''
                            });
                        }
                        return eduList.length > 0 ? eduList : prev.education;
                    })(),
                    experience: (() => {
                        if (reg.workExperience && reg.workExperience.length > 0) {
                            return reg.workExperience.map(exp => ({
                                role: exp.jobTitle || exp.role || '',
                                company: exp.organizationName || exp.companyName || '',
                                duration: exp.duration || '',
                                description: exp.description || ''
                            }));
                        }
                        if (data.experience && data.experience !== 'None' && !data.experience.includes('Batch')) {
                            return [{
                                role: 'Professional',
                                company: data.experience,
                                duration: '',
                                description: ''
                            }];
                        }
                        return prev.experience;
                    })(),
                    skills: {
                        technical: data.skills?.join(', ') || prev.skills.technical || '',
                        soft: prev.skills.soft || '',
                        languages: prev.skills.languages || ''
                    },
                    projects: (() => {
                        if (reg.projects && reg.projects.length > 0) {
                            return reg.projects.map(p => ({
                                title: p.title || '',
                                description: p.description || '',
                                link: p.link || p.projectUrl || ''
                            }));
                        }
                        if (data.projects && data.projects !== 'None') {
                            return [{
                                title: 'Key Project',
                                description: data.projects,
                                link: ''
                            }];
                        }
                        return prev.projects;
                    })(),
                    achievements: (() => {
                        const list = [];
                        if (reg.certificates && reg.certificates.length > 0) {
                            reg.certificates.forEach(c => {
                                list.push({
                                    title: c.title || '',
                                    description: `Issued by ${c.issuingOrg || c.issuer || 'N/A'}`,
                                    link: c.link || ''
                                });
                            });
                        }
                        if (reg.extracurricular && reg.extracurricular.length > 0) {
                            reg.extracurricular.forEach(e => {
                                list.push({
                                    title: e.activityType || 'Extracurricular Activity',
                                    description: `${e.description || ''} - ${e.achievements || ''}`,
                                    link: ''
                                });
                            });
                        }
                        if (list.length === 0 && data.certificates && data.certificates !== 'None') {
                            list.push({
                                title: 'Certification',
                                description: data.certificates,
                                link: ''
                            });
                        }
                        return list.length > 0 ? list : prev.achievements;
                    })(),
                }));
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSyncProfile = async () => {
        setIsSyncing(true);
        try {
            const res = await aiCareerCoachApi.getProfile();
            if (res.success) {
                const data = res.richProfile || {};
                const reg = res.registration || {};

                setResumeData(prev => ({
                    ...prev,
                    personalInfo: {
                        ...prev.personalInfo,
                        fullName: data.fullName || prev.personalInfo.fullName || '',
                        email: data.email || prev.personalInfo.email || '',
                        phone: data.mobile || prev.personalInfo.phone || '',
                        targetRole: data.targetRole || prev.personalInfo.targetRole || '',
                        location: reg.address ? `${reg.address.city || ''}, ${reg.address.state || ''}` : (data.location || prev.personalInfo.location || ''),
                    },
                    summary: reg.bio || prev.summary || '',
                    education: (() => {
                        const eduList = [];
                        if (reg.higherEducation && reg.higherEducation.length > 0) {
                            reg.higherEducation.forEach(edu => {
                                eduList.push({
                                    degree: edu.degreeFullName || edu.degree || '',
                                    institution: edu.institutionName || edu.university || '',
                                    year: edu.yearOfPassing || '',
                                    score: edu.cgpaPercentage || ''
                                });
                            });
                        }
                        else if (reg.institution || data.college) {
                            eduList.push({
                                degree: reg.educationLevel || data.department || 'Student',
                                institution: reg.institution || data.college || 'SMAART Institute',
                                year: reg.yearOfPassing || data.batch || '',
                                score: ''
                            });
                        }

                        if (reg.twelfthDetails && reg.twelfthDetails.schoolName) {
                            eduList.push({
                                degree: `12th Standard (${reg.twelfthDetails.stream || 'N/A'})`,
                                institution: reg.twelfthDetails.schoolName,
                                year: reg.twelfthDetails.yearOfPassing || '',
                                score: reg.twelfthDetails.percentage || ''
                            });
                        }
                        if (reg.tenthDetails && reg.tenthDetails.schoolName) {
                            eduList.push({
                                degree: '10th Standard',
                                institution: reg.tenthDetails.schoolName,
                                year: reg.tenthDetails.yearOfPassing || '',
                                score: reg.tenthDetails.percentage || ''
                            });
                        }
                        return eduList.length > 0 ? eduList : prev.education;
                    })(),
                    experience: (() => {
                        if (reg.workExperience && reg.workExperience.length > 0) {
                            return reg.workExperience.map(exp => ({
                                role: exp.jobTitle || exp.role || '',
                                company: exp.organizationName || exp.companyName || '',
                                duration: exp.duration || '',
                                description: exp.description || ''
                            }));
                        }
                        if (data.experience && data.experience !== 'None' && !data.experience.includes('Batch')) {
                            return [{
                                role: 'Professional',
                                company: data.experience,
                                duration: '',
                                description: ''
                            }];
                        }
                        return prev.experience;
                    })(),
                    skills: {
                        technical: data.skills?.join(', ') || prev.skills.technical || '',
                        soft: prev.skills.soft || '',
                        languages: prev.skills.languages || ''
                    },
                    projects: (() => {
                        if (reg.projects && reg.projects.length > 0) {
                            return reg.projects.map(p => ({
                                title: p.title || '',
                                description: p.description || '',
                                link: p.link || p.projectUrl || ''
                            }));
                        }
                        if (data.projects && data.projects !== 'None') {
                            return [{
                                title: 'Key Project',
                                description: data.projects,
                                link: ''
                            }];
                        }
                        return prev.projects;
                    })(),
                    achievements: (() => {
                        const list = [];
                        if (reg.certificates && reg.certificates.length > 0) {
                            reg.certificates.forEach(c => {
                                list.push({
                                    title: c.title || '',
                                    description: `Issued by ${c.issuingOrg || c.issuer || 'N/A'}`,
                                    link: c.link || ''
                                });
                            });
                        }
                        if (reg.extracurricular && reg.extracurricular.length > 0) {
                            reg.extracurricular.forEach(e => {
                                list.push({
                                    title: e.activityType || 'Extracurricular Activity',
                                    description: `${e.description || ''} - ${e.achievements || ''}`,
                                    link: ''
                                });
                            });
                        }
                        if (list.length === 0 && data.certificates && data.certificates !== 'None') {
                            list.push({
                                title: 'Certification',
                                description: data.certificates,
                                link: ''
                            });
                        }
                        return list.length > 0 ? list : prev.achievements;
                    })(),
                }));
                toast.success('Profile data synced successfully!');
            }
        } catch (error) {
            console.error('Sync error:', error);
            toast.error('Failed to sync profile');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (resumeId) {
                await resumeApi.updateResume(resumeId, resumeData);
                toast.success('Resume updated successfully!');
            } else {
                const res = await resumeApi.createResume(resumeData);
                if (res.success) {
                    setResumeId(res.data._id);
                    toast.success('Resume saved successfully!');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save resume');
        } finally {
            setSaving(false);
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

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
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
            <div className="min-h-screen w-full flex items-center justify-center bg-[#F8FAFC] dark:bg-[#00152E]">
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

    return (
        <div className="flex flex-col h-[calc(100vh-130px)] min-h-[600px] bg-[#F8FAFC] dark:bg-[#00152E] overflow-hidden rounded-[24px] border border-[#d8e6f7] shadow-[0_4px_24px_rgba(26,56,132,0.05)] dark:border-[#1a3884]/20 font-sans selection:bg-blue-500/30 selection:text-blue-200">
            {/* Header */}
            <header className="h-[72px] flex items-center justify-between px-6 bg-white dark:bg-[#001a3d] border-b border-[#d8e6f7] dark:border-[#1a3884]/20 z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-[#002A5C] rounded-2xl transition-all group text-slate-500 hover:text-slate-900 dark:hover:text-white">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1a3884] flex items-center justify-center shadow-sm">
                            <IconFileDescription stroke={1.5} className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-[17px] font-bold text-slate-800 dark:text-white tracking-tight leading-tight">Resume Builder</h1>
                            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Create, customize, and download a professional, ATS-optimized resume.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">{resumePublicId || 'Secure Resume'}</span>
                    </div>
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
<main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white/50 dark:bg-transparent">
                {/* Form Section */}
                <section className={`flex-1 flex-col relative ${currentStep === steps.length - 1 ? 'hidden lg:flex lg:w-1/2' : 'flex w-full'}`}>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="max-w-4xl mx-auto p-5 md:p-8 pb-12">
                            <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">Step {currentStep + 1} of {steps.length}</span>


                                </div>

                                <div className="flex-1 min-w-0 flex items-center justify-start md:justify-end gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                                    <AnimatePresence initial={false}>
                                        {steps.slice(0, currentStep + 1).map((step, idx) => {
                                            const Icon = step.icon;
                                            const isActive = idx === currentStep;
                                            const isCompleted = idx < currentStep;
                                            return (
                                                <motion.div
                                                    key={step.id}
                                                    initial={{ opacity: 0, x: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                                    className="flex items-center shrink-0"
                                                >
                                                    <button
                                                        onClick={() => setCurrentStep(idx)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                                                            isActive
                                                                ? 'bg-[#1a3884] text-white shadow-md shadow-blue-500/10'
                                                                : isCompleted
                                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100/50'
                                                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                                        }`}
                                                    >
                                                        <Icon className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{step.label}</span>
                                                    </button>
                                                    {idx < currentStep && (
                                                        <div className="mx-1.5 h-[2px] w-3 rounded-full bg-emerald-300 dark:bg-emerald-500" />
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="min-h-[400px]">
                                {steps[currentStep].id === 'personal' && (
                                    <div className="space-y-6 bg-white dark:bg-[#002147] p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="text" value={resumeData.personalInfo.fullName} readOnly className="w-full pl-9 pr-3 py-3 bg-[#F8FAFC] dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-2xl outline-none cursor-not-allowed dark:text-slate-400 transition-all text-sm font-medium shadow-sm opacity-80" title="Full name is verified from your profile and cannot be changed here." />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Target Role</label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="text" placeholder="e.g. Senior Frontend Developer" value={resumeData.personalInfo.targetRole} onChange={(e) => handleNestedChange('personalInfo', 'targetRole', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Email Address</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input type="email" placeholder="email@example.com" value={resumeData.personalInfo.email} onChange={(e) => handleNestedChange('personalInfo', 'email', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Mobile Number</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input type="text" placeholder="+91 00000 00000" value={resumeData.personalInfo.phone} onChange={(e) => handleNestedChange('personalInfo', 'phone', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Location</label>
                                            <div className="relative">
                                                <MapPinIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <input type="text" placeholder="City, State, Country" value={resumeData.personalInfo.location} onChange={(e) => handleNestedChange('personalInfo', 'location', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">LinkedIn URL</label>
                                                <div className="relative">
                                                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input type="text" placeholder="linkedin.com/in/username" value={resumeData.personalInfo.linkedinUrl} onChange={(e) => handleNestedChange('personalInfo', 'linkedinUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">GitHub URL</label>
                                                <div className="relative">
                                                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input type="text" placeholder="github.com/username" value={resumeData.personalInfo.githubUrl} onChange={(e) => handleNestedChange('personalInfo', 'githubUrl', e.target.value)} className="w-full pl-9 pr-3 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Father's Name</label>
                                                <input type="text" placeholder="Father's Name" value={resumeData.personalDetails?.fatherName} onChange={(e) => handleNestedChange('personalDetails', 'fatherName', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Mother's Name</label>
                                                <input type="text" placeholder="Mother's Name" value={resumeData.personalDetails?.motherName} onChange={(e) => handleNestedChange('personalDetails', 'motherName', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Date of Birth</label>
                                                <input type="date" value={resumeData.personalDetails?.dob} onChange={(e) => handleNestedChange('personalDetails', 'dob', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                            <div className="group">
                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Nationality</label>
                                                <input type="text" placeholder="Nationality" value={resumeData.personalDetails?.nationality} onChange={(e) => handleNestedChange('personalDetails', 'nationality', e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm" />
                                            </div>
                                        </div>

                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Professional Summary</label>
                                            <textarea value={resumeData.summary} onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))} rows={4} className="w-full p-4 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-2xl outline-none focus:border-blue-500 dark:text-white transition-all text-sm font-medium shadow-sm resize-none" placeholder="A brief overview of your professional background and key strengths..."></textarea>
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
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 ${
                                        currentStep === 0
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
                    className={`flex-1 flex flex-col overflow-hidden relative bg-slate-100 dark:bg-[#001a3d] ${currentStep === steps.length - 1 ? 'flex' : 'hidden'}`}
                >
                    {/* Preview toolbar */}
                    <div className="flex items-center justify-between px-5 py-2.5 bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/10 shrink-0 shadow-sm">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200 dark:border-white/10"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" /> Edit Details
                            </button>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Preview</p>
                        <div className="w-[88px]" />{/* spacer */}
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
                                    fontFamily: '"Times New Roman", Times, serif',
                                    transform: scale < 1 ? `scale(${scale})` : 'none',
                                    transformOrigin: 'top center'
                                }}
                            >
                                <ResumeWatermark />

                                <div className="relative z-10 text-left">
                                    {/* Header Section */}
                                    <div className="flex flex-col items-center text-center relative z-10 mb-6">
                                        <h1 className="text-4xl font-bold !text-black m-0 leading-tight uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                            {resumeData.personalInfo.fullName || 'FIRST LAST'}
                                        </h1>
                                        <h2 className="text-lg font-semibold !text-gray-800 mt-1 uppercase tracking-widest">{resumeData.personalInfo.targetRole || 'Professional Title'}</h2>

                                        <div className="mt-4 w-full border border-slate-200 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-4 rounded-sm">
                                            <div className="text-left min-w-0">
                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider !text-slate-700">
                                                    <ShieldCheck className="w-3.5 h-3.5 text-[#1a3884]" />
                                                    {ORG_NAME} verified resume
                                                </div>
                                                <p className="mt-1.5 text-[10px] !text-slate-650">
                                                    ID: <span className="font-semibold !text-black">{resumePublicId}</span>
                                                </p>
                                                <p className="text-[9px] !text-slate-500 mt-0.5">Scan QR to verify authenticity</p>
                                            </div>
                                            {verificationQr ? (
                                                <img
                                                    src={verificationQr}
                                                    alt="Resume verification QR code"
                                                    className="w-14 h-14 border border-slate-200 bg-white p-1 shrink-0"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 border border-slate-200 bg-white flex items-center justify-center shrink-0">
                                                    <QrCode className="w-7 h-7 text-slate-400" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 mt-3 text-[10.5px] !text-gray-700 max-w-full">
                                            {resumeData.personalInfo.phone && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-[10px] h-[10px] shrink-0" />
                                                    {resumeData.personalInfo.phone}
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

                                    <div className="space-y-6">
                                        {/* Summary */}
                                        {resumeData.summary && (
                                            <section>
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Professional Summary</h3>
                                                <p className="!text-gray-800 text-[11px] leading-normal whitespace-pre-wrap">
                                                    {resumeData.summary}
                                                </p>
                                            </section>
                                        )}

                                        {/* Education */}
                                        {resumeData.education.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Education</h3>
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
                                            <div className="mb-6">
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Professional Experience</h3>
                                                <div className="space-y-4">
                                                    {resumeData.experience.map((exp, idx) => (
                                                        <div key={idx} className="flex flex-col">
                                                            <div className="flex justify-between items-start">
                                                                <span className="font-bold text-[13px] !text-black">{exp.role}</span>
                                                                <span className="text-[11px] font-semibold !text-gray-700">{exp.duration}</span>
                                                            </div>
                                                            <span className="text-[12px] font-medium !text-gray-800 italic">{exp.company}</span>
                                                            <p className="text-[11px] !text-gray-700 mt-1.5 leading-relaxed text-justify">{exp.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Projects */}
                                        {resumeData.projects.length > 0 && (
                                            <section>
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Projects</h3>
                                                <div className="space-y-3">
                                                    {resumeData.projects.map((proj, i) => (
                                                        <div key={i}>
                                                            <div className="flex justify-between items-baseline">
                                                                <span className="font-bold text-[13px] !text-black">{proj.title}</span>
                                                                {proj.link && <span className="block italic text-blue-800 underline mt-0.5">{proj.link}</span>}
                                                            </div>
                                                            <p className="!text-gray-700 text-[11px] leading-normal mt-1 whitespace-pre-wrap pl-4 relative before:content-['•'] before:absolute before:left-0">
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
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Skills</h3>
                                                <div className="text-[11px] space-y-1 px-1 !text-gray-700">
                                                    {resumeData.skills.technical && (
                                                        <div><span className="font-bold !text-black">Technical Skills:</span> {resumeData.skills.technical}</div>
                                                    )}
                                                    {resumeData.skills.soft && (
                                                        <div><span className="font-bold !text-black">Soft Skills:</span> {resumeData.skills.soft}</div>
                                                    )}
                                                    {resumeData.skills.languages && (
                                                        <div><span className="font-bold !text-black">Languages:</span> {resumeData.skills.languages}</div>
                                                    )}
                                                </div>
                                            </section>
                                        )}

                                        {/* Achievements */}
                                        {resumeData.achievements.length > 0 && (
                                            <section>
                                                <h3 className="text-[13px] font-bold !text-black uppercase border-b-2 border-black pb-0.5 mb-1.5 tracking-wider">Achievements</h3>
                                                <div className="space-y-2">
                                                    {resumeData.achievements.map((ach, i) => (
                                                        <div key={i} className="text-[11px]">
                                                            <div className="flex justify-between items-baseline">
                                                                <span className="font-bold !text-black">{ach.title}</span>
                                                                {ach.link && <span className="italic text-blue-800 underline text-[10px] ml-2">{ach.link}</span>}
                                                            </div>
                                                            <p className="italic !text-gray-700">{ach.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>

                                {/* Preview-only footer — pinned to bottom of A4, hidden during html2canvas PDF capture */}
                                <div
                                    data-html2canvas-ignore="true"
                                    className="absolute bottom-[10mm] left-[15mm] right-[15mm] pt-2 border-t border-slate-200"
                                >
                                    <p className="text-center text-[8px] !text-slate-400 tracking-wide">
                                        {ORG_NAME} &middot; Verified Securely{studentId ? ` \u00b7 STU ID: ${studentId}` : ''} &middot; {resumePublicId || 'Document ID pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ResumeBuilder;
