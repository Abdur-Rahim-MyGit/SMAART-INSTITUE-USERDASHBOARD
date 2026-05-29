import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    Download,
    Loader2,
    ArrowLeft,
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
    LinkIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import resumeApi from '@/services/resumeApi';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { apiCall } from '@/services/api';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';

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


    const fetchData = async () => {
        try {
            const [resumeRes, profileRes] = await Promise.all([
                resumeApi.getMyResumes().catch(() => ({ success: false })),
                aiCareerCoachApi.getProfile().catch(() => ({ success: false }))
            ]);

            if (resumeRes.success && resumeRes.data && resumeRes.data.length > 0) {
                const r = resumeRes.data[0];
                setResumeId(r._id);
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
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resumeData.personalInfo.fullName || 'Resume'}.pdf`);
            toast.success('Resume downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to generate PDF');
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
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#00152E] font-sans selection:bg-[#1a3884]/30 selection:text-[#1a3884] transition-colors duration-300">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-16">
                {/* Premium Back Button */}
                <button
                    onClick={() => navigate('/dashboard/smaart-toolkit')}
                    className="group flex items-center gap-3 text-[#112b6b] dark:text-white text-[11px] font-bold uppercase tracking-[0.2em] mb-6 hover:text-[#1a3884] transition-all animate-fade-in"
                >
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:shadow-md group-hover:-translate-x-1 transition-all duration-300">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    Back to Toolkit
                </button>

                {/* Page Title & Actions Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-[#112b6b] to-[#1a3884] dark:from-blue-600 dark:to-indigo-650 rounded-2xl shadow-lg shadow-blue-500/20">
                            <FileText className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Pro Resume Builder</h1>
                            <p className="text-slate-650 dark:text-slate-350 font-medium">Create, customize, and download a professional, ATS-optimized resume.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#002A5C] text-slate-700 dark:text-slate-350 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-[#1a3884] hover:bg-slate-50 dark:hover:bg-[#003170] transition-all font-bold text-sm shadow-sm disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Save Progress</span>
                        </button>
                        {currentStep === steps.length - 1 && (
                            <button onClick={handleDownloadPDF} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a3884] dark:bg-blue-600 hover:bg-[#132c6b] dark:hover:bg-blue-550 text-white rounded-2xl transition-all font-bold text-sm shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 animate-pulse-slow">
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                <span>Download PDF</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Steps Wizard Progress Bar */}
                <div className="bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 rounded-3xl p-6 shadow-sm mb-8 overflow-hidden">
                    <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth">
                        <div className="flex items-center gap-6 px-4 py-2">
                            {steps.map((step, idx) => {
                                const Icon = step.icon;
                                const isActive = idx === currentStep;
                                const isCompleted = idx < currentStep;

                                return (
                                    <div key={step.id} className="flex items-center gap-2 md:gap-4 shrink-0">
                                        <button
                                            onClick={() => setCurrentStep(idx)}
                                            className={`flex flex-col items-center gap-2 group transition-all ${isActive ? 'scale-105' : ''}`}
                                        >
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? 'bg-[#1a3884] text-white shadow-lg shadow-blue-500/40' : isCompleted ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-[#002A5C] text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isActive ? 'text-blue-650 dark:text-blue-400' : 'text-slate-400'}`}>
                                                {step.label}
                                            </span>
                                        </button>
                                        {idx < steps.length - 1 && (
                                            <div className={`h-[2px] w-4 md:w-12 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-[#002A5C]'}`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Wizard Forms & Preview Switch */}
                {currentStep !== steps.length - 1 ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-tight">
                                {steps[currentStep].label}
                                <span className="text-blue-500">.</span>
                            </h2>
                            {currentStep === 0 && (
                                <button onClick={handleSyncProfile} disabled={isSyncing} className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-550/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-[#1a3884] dark:text-blue-450 rounded-2xl transition-all font-bold text-xs border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                    {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Sync with Profile
                                </button>
                            )}
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

                        {/* Navigation Buttons Card */}
                        <div className="flex justify-between items-center bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm mt-8">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${currentStep === 0 ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50' : 'text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-[#002A5C]'}`}
                            >
                                <ArrowLeft className="w-4 h-4" /> Previous
                            </button>
                            <button
                                onClick={nextStep}
                                className="flex items-center gap-2 px-10 py-3 bg-[#1a3884] dark:bg-blue-600 hover:bg-[#132c6b] dark:hover:bg-blue-550 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 group active:scale-95"
                            >
                                Next Step
                                <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="group-hover:translate-x-1 transition-transform">
                                    <Plus className="w-4 h-4 rotate-[-90deg]" />
                                </motion.div>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Preview Canvas (Shows on last step) */
                    <div ref={containerRef} className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#002147] border border-slate-200 dark:border-white/10 p-6 rounded-3xl shadow-sm">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Review & Download</h2>
                                <p className="text-slate-500 text-sm font-medium">Verify your final resume and generate the official PDF.</p>
                            </div>
                            <button
                                onClick={prevStep}
                                className="flex items-center gap-2 px-6 py-3 text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-[#002A5C] rounded-2xl font-bold transition-all border border-slate-200 dark:border-white/10 shadow-sm"
                            >
                                <ArrowLeft className="w-4 h-4" /> Edit Details
                            </button>
                        </div>

                        <div className="flex justify-center items-start w-full bg-slate-100/50 dark:bg-[#001E3D] border border-slate-200 dark:border-white/10 p-4 md:p-12 rounded-3xl shadow-inner overflow-hidden min-h-[600px]">
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
                                    {/* Content Area */}
                                    <div className="relative z-10 text-left">
                                        {/* Header Section */}
                                        <div className="flex flex-col items-center text-center relative z-10 mb-6">
                                            <h1 className="text-4xl font-bold !text-black m-0 leading-tight uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                                {resumeData.personalInfo.fullName || 'FIRST LAST'}
                                            </h1>
                                            <h2 className="text-lg font-semibold !text-gray-800 mt-1 uppercase tracking-widest">{resumeData.personalInfo.targetRole || 'Professional Title'}</h2>

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
                                                                    <span>{edu.score}</span>
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

                                    {/* SMAART Watermark - Premium Bottom Right Position */}
                                    <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.12] z-0 flex flex-col items-start" style={{ fontFamily: 'sans-serif' }}>
                                        <div className="flex items-center gap-1">
                                            <span className="text-3xl font-black tracking-tighter !text-black leading-none" style={{ fontWeight: 900 }}>SMAART</span>
                                            <div className="w-2 h-2 rounded-full bg-black mt-1"></div>
                                        </div>
                                        <span className="text-[10px] font-bold tracking-[0.45em] !text-black uppercase mt-1">INSTITUTE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ResumeBuilder;
