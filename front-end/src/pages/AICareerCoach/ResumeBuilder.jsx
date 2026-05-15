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

    const [resumeId, setResumeId] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

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
                apiCall('/auth/me', { method: 'GET' }).catch(() => ({ success: false }))
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
            } else if (profileRes.success || sessionStorage.getItem("user")) {
                let userObj = (profileRes.success && profileRes.data) ? profileRes.data : {};

                // Fallback to session storage if API is missing fields
                let sessionUser = {};
                try {
                    const sessionStr = sessionStorage.getItem("user");
                    if (sessionStr && sessionStr !== "undefined") {
                        sessionUser = JSON.parse(sessionStr);
                    }
                } catch (e) {
                    console.warn("Failed to parse session user", e);
                }

                if (!userObj.fullName && sessionUser.fullName) {
                    userObj = { ...sessionUser, ...userObj };
                }

                if (userObj && userObj.fullName) {
                    setResumeData(prev => {
                        const newData = { ...prev };

                        // Auto-fill Personal Info
                        const prevInfo = prev.personalInfo || {};
                        newData.personalInfo = {
                            ...newData.personalInfo,
                            fullName: userObj.fullName || prevInfo.fullName || '',
                            email: userObj.email || prevInfo.email || '',
                            mobile: userObj.mobile || userObj.mobileNumber || prevInfo.mobile || '',
                            location: userObj.address?.city ? `${userObj.address.city}, ${userObj.address.state || ''}` : prevInfo.location || ''
                        };

                        // Auto-fill Education mapping
                        if (userObj.higherEducation && Array.isArray(userObj.higherEducation) && userObj.higherEducation.length > 0) {
                            newData.education = userObj.higherEducation.map(edu => ({
                                institution: edu.institutionName || '',
                                degree: edu.degreeFullName || edu.degree || '',
                                grade: edu.cgpaPercentage || '',
                                year: edu.yearOfPassing || '',
                                location: edu.location || ''
                            }));
                        } else {
                            const degreeObj = userObj.degree;
                            const collegeObj = userObj.college;
                            if (degreeObj || collegeObj) {
                                const newInstitution = collegeObj?.collegeName || '';
                                const newDegree = degreeObj ? `${degreeObj.fullName}${degreeObj.specialization && degreeObj.specialization !== 'General' ? ' in ' + degreeObj.specialization : ''}` : '';

                                if (newInstitution || newDegree) {
                                    const eduArray = Array.isArray(newData.education) ? newData.education : [];
                                    newData.education = [...eduArray, {
                                        institution: newInstitution,
                                        degree: newDegree,
                                        grade: ''
                                    }];
                                }
                            }
                        }

                        // Auto-fill Experience mapping
                        if (userObj.workExperience && Array.isArray(userObj.workExperience) && userObj.workExperience.length > 0) {
                            newData.experience = userObj.workExperience.map(exp => ({
                                company: exp.companyName || exp.organizationName || '',
                                role: exp.role || exp.jobTitle || '',
                                duration: (exp.startDate || exp.endDate) ?
                                    `${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${exp.currentlyWorking ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}` :
                                    (exp.duration || ''),
                                location: exp.location || '',
                                description: exp.description || ''
                            }));
                        }

                        // Auto-fill Projects mapping
                        if (userObj.projects && Array.isArray(userObj.projects) && userObj.projects.length > 0) {
                            newData.projects = userObj.projects.map(proj => ({
                                title: proj.title || '',
                                description: proj.description || '',
                                link: proj.link || proj.projectUrl || ''
                            }));
                        }

                        // Auto-fill Achievements mapping
                        if (userObj.certificates && Array.isArray(userObj.certificates) && userObj.certificates.length > 0) {
                            newData.achievements = userObj.certificates.map(cert => ({
                                title: cert.title || '',
                                description: `${cert.issuer || cert.issuingOrg || ''} ${cert.yearOfCompletion ? '(' + cert.yearOfCompletion + ')' : ''}`.trim(),
                                link: cert.link || cert.verificationUrl || ''
                            }));
                        }

                        return newData;
                    });
                }
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
        try {
            toast.info("Syncing with profile...");
            let profileRes = { success: false };
            try {
                profileRes = await apiCall('/auth/me', { method: 'GET' });
            } catch (err) {
                console.log("API getProfile failed, using session fallback");
            }

            let userObj = (profileRes.success && profileRes.data) ? profileRes.data : {};

            // fallback to session storage if API is missing fields
            let sessionUser = {};
            try {
                const sessionStr = sessionStorage.getItem("user");
                if (sessionStr && sessionStr !== "undefined") {
                    sessionUser = JSON.parse(sessionStr);
                }
            } catch (e) {
                console.warn("Failed to parse session user", e);
            }
            if (!userObj.fullName && sessionUser.fullName) {
                userObj = { ...sessionUser, ...userObj }; // merge
            }

            if (userObj && userObj.fullName) {
                setResumeData(prev => {
                    const newData = { ...prev };

                    // Personal Info
                    const prevInfo = prev.personalInfo || {};
                    newData.personalInfo = {
                        ...newData.personalInfo,
                        fullName: userObj.fullName || prevInfo.fullName || '',
                        email: userObj.email || prevInfo.email || '',
                        mobile: userObj.mobile || userObj.mobileNumber || prevInfo.mobile || '',
                        location: userObj.address?.city ? `${userObj.address.city}, ${userObj.address.state || ''}` : prevInfo.location || ''
                    };

                    // Auto-fill Education mapping
                    if (userObj.higherEducation && Array.isArray(userObj.higherEducation) && userObj.higherEducation.length > 0) {
                        newData.education = userObj.higherEducation.map(edu => ({
                            institution: edu.institutionName || '',
                            degree: edu.degreeFullName || edu.degree || '',
                            grade: edu.cgpaPercentage || '',
                            year: edu.yearOfPassing || '',
                            location: edu.location || ''
                        }));
                    }

                    // Auto-fill Experience mapping
                    if (userObj.workExperience && Array.isArray(userObj.workExperience) && userObj.workExperience.length > 0) {
                        newData.experience = userObj.workExperience.map(exp => ({
                            company: exp.companyName || exp.organizationName || '',
                            role: exp.role || exp.jobTitle || '',
                            duration: (exp.startDate || exp.endDate) ?
                                `${exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''} - ${exp.currentlyWorking ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '')}` :
                                (exp.duration || ''),
                            location: exp.location || '',
                            description: exp.description || ''
                        }));
                    }

                    // Auto-fill Projects mapping
                    if (userObj.projects && Array.isArray(userObj.projects) && userObj.projects.length > 0) {
                        newData.projects = userObj.projects.map(proj => ({
                            title: proj.title || '',
                            description: proj.description || '',
                            link: proj.link || proj.projectUrl || ''
                        }));
                    }

                    // Auto-fill Achievements mapping
                    if (userObj.certificates && Array.isArray(userObj.certificates) && userObj.certificates.length > 0) {
                        newData.achievements = userObj.certificates.map(cert => ({
                            title: cert.title || '',
                            description: `${cert.issuer || cert.issuingOrg || ''} ${cert.yearOfCompletion ? '(' + cert.yearOfCompletion + ')' : ''}`.trim(),
                            link: cert.link || cert.verificationUrl || ''
                        }));
                    }

                    // Personal Details mapping
                    const reg = userObj.personalDetails || userObj.registration || {};
                    newData.personalDetails = {
                        fatherName: reg.fatherName || prev.personalDetails?.fatherName || '',
                        motherName: reg.motherName || prev.personalDetails?.motherName || '',
                        dob: reg.dob || prev.personalDetails?.dob || '',
                        nationality: reg.nationality || prev.personalDetails?.nationality || 'Indian'
                    };

                    return newData;
                });
                toast.success("Profile data completely synced!");
            } else {
                toast.error("Could not sync profile. Missing required data.");
            }
        } catch (e) {
            toast.error(`Failed to sync profile: ${e.message}`);
            console.error("Sync Profile Error:", e);
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

        try {
            toast.info("Generating PDF...");
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${resumeData.personalInfo.fullName || 'Resume'}.pdf`);
            toast.success("PDF Downloaded successfully!");
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate PDF. Falling back to print.");
            window.print();
        }
    };

    // Form Handlers
    const handlePersonalInfoChange = (e) => {
        const { name, value } = e.target;
        setResumeData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, [name]: value }
        }));
    };

    const handleArrayChange = (field, index, subfield, value) => {
        const newArray = [...resumeData[field]];
        newArray[index] = { ...newArray[index], [subfield]: value };
        setResumeData(prev => ({ ...prev, [field]: newArray }));
    };

    const handleNestedChange = (field, subfield, value) => {
        setResumeData(prev => ({
            ...prev,
            [field]: { ...prev[field], [subfield]: value }
        }));
    };

    const addArrayItem = (field, emptyItem) => {
        setResumeData(prev => ({ ...prev, [field]: [...prev[field], emptyItem] }));
    };

    const removeArrayItem = (field, index) => {
        const newArray = [...resumeData[field]];
        newArray.splice(index, 1);
        setResumeData(prev => ({ ...prev, [field]: newArray }));
    };

    // AI Smart Assist (Mockup for auto-filling based on target role)
    const handleSmartAssist = async () => {
        if (!resumeData.personalInfo.targetRole) {
            toast.error("Please enter a Target Role in Personal Info first");
            return;
        }
        setGenerating(true);
        try {
            const res = await aiCareerCoachApi.generateResume(resumeData.personalInfo.targetRole);
            if (res.success) {
                // Here we would ideally parse the markdown into the structured data.
                // For this overhaul, we will inject it into the summary.
                setResumeData(prev => ({
                    ...prev,
                    summary: prev.summary ? prev.summary + "\n\n[AI SUGGESTION]:\n" + res.resume.substring(0, 500) + "..." : res.resume.substring(0, 500) + "..."
                }));
                toast.success('AI Suggestions added to your summary!');
            }
        } catch (e) {
            toast.error('AI Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-dark-card flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3884]" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col print-wrapper h-[calc(100vh-80px)] overflow-hidden bg-[#F8FAFC] dark:bg-dark-card">
            {/* --- PRINT ONLY CSS --- */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    body * { visibility: hidden; }
                    .print-wrapper { background: white !important; height: auto !important; overflow: visible !important; }
                    #resume-preview, #resume-preview * { visibility: visible; }
                    #resume-preview { position: absolute; left: 0; top: 0; width: 100%; background: white; padding: 0 !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
                    .no-print { display: none !important; }
                }
            `}} />

            {/* Header (Top Bar) */}
            <header className="h-[72px] shrink-0 bg-white dark:bg-[#111827] px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 z-30 shadow-sm no-print">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/smaart-toolkit')}
                        className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                    >
                        <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 tracking-tight">
                            <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            Pro Resume Builder
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* <button onClick={handleSmartAssist} disabled={generating} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm">
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="hidden md:inline">Smart Assist</span>
                    </button> */}
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden md:inline">Save Progress</span>
                    </button>
                    <button onClick={handleDownloadPDF} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-md shadow-blue-600/20">
                        <Printer className="w-4 h-4" />
                        <span className="hidden md:inline">Download PDF</span>
                    </button>
                </div>
            </header>

            {/* Workspace */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden no-print relative">

                {/* 1. Nav Rail (Left) */}
                <nav className="w-full md:w-[88px] bg-white dark:bg-[#111827] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex md:flex-col items-center justify-center md:justify-start py-2 md:py-6 gap-2 md:gap-4 shrink-0 z-20 overflow-x-auto">
                    {[
                        { id: 'personal', icon: User, label: 'Profile' },
                        // { id: 'summary', icon: Sparkles, label: 'Objective' },
                        { id: 'experience', icon: Briefcase, label: 'Experience' },
                        { id: 'education', icon: GraduationCap, label: 'Education' },
                        { id: 'projects', icon: FileText, label: 'Projects' },
                        { id: 'skills', icon: Award, label: 'Skills' },
                        { id: 'achievements', icon: Trophy, label: 'Awards' },
                        // { id: 'personalDetails', icon: User, label: 'Details' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all relative ${activeTab === tab.id
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            {activeTab === tab.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 dark:bg-blue-500 rounded-r-md shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>}
                            <tab.icon className="w-6 h-6" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                            <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                {/* 2. Editor Panel (Middle) */}
                <section className="w-full md:w-[400px] xl:w-[480px] bg-white dark:bg-[#111827] border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)] h-[40vh] md:h-auto">

                    {/* Editor Header */}
                    <div className="h-[72px] border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-50/50 dark:bg-slate-800/20 backdrop-blur-md">
                        <h2 className="text-lg font-black text-slate-800 dark:text-white capitalize flex items-center gap-2 tracking-tight">
                            {activeTab.replace(/([A-Z])/g, ' $1').trim()}
                        </h2>
                        {activeTab === 'personal' && (
                            <button onClick={handleSyncProfile} className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-blue-500/20">
                                <RefreshCw className="w-3.5 h-3.5" /> Sync Profile
                            </button>
                        )}
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {activeTab === 'personal' && (
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                            </div>
                                            <input type="text" name="fullName" value={resumeData.personalInfo.fullName} onChange={handlePersonalInfoChange} className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Target Role</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Briefcase className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                            </div>
                                            <input type="text" name="targetRole" value={resumeData.personalInfo.targetRole} onChange={handlePersonalInfoChange} placeholder="e.g. Frontend Developer" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Email</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                </div>
                                                <input type="email" name="email" value={resumeData.personalInfo.email} onChange={handlePersonalInfoChange} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Mobile</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                </div>
                                                <input type="text" name="mobile" value={resumeData.personalInfo.mobile} onChange={handlePersonalInfoChange} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">Location</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <MapPinIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                            </div>
                                            <input type="text" name="location" value={resumeData.personalInfo.location || ''} onChange={handlePersonalInfoChange} placeholder="City, State" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">LinkedIn URL</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Linkedin className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                </div>
                                                <input type="text" name="linkedinUrl" value={resumeData.personalInfo.linkedinUrl || ''} onChange={handlePersonalInfoChange} placeholder="linkedin.com/in/..." className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                            </div>
                                        </div>
                                        <div className="group">
                                            <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider group-focus-within:text-blue-600 transition-colors">GitHub URL</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Github className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                </div>
                                                <input type="text" name="githubUrl" value={resumeData.personalInfo.githubUrl || ''} onChange={handlePersonalInfoChange} placeholder="github.com/..." className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* {activeTab === 'summary' && (
                            <div className="space-y-4">
                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Professional Objective</label>
                                <textarea value={resumeData.summary} onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })} rows={12} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm leading-relaxed font-medium resize-none" placeholder="Write a compelling objective for your career..."></textarea>
                            </div>
                        )} */}

                        {activeTab === 'experience' && (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {resumeData.experience.map((exp, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-blue-400/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-black">
                                                        {idx + 1}
                                                    </div>
                                                    {exp.company || 'New Experience'}
                                                </h4>
                                                <button onClick={() => removeArrayItem('experience', idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Company</label>
                                                        <input type="text" placeholder="Company Name" value={exp.company} onChange={(e) => handleArrayChange('experience', idx, 'company', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Role Title</label>
                                                        <input type="text" placeholder="Role/Title" value={exp.role} onChange={(e) => handleArrayChange('experience', idx, 'role', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Duration</label>
                                                        <input type="text" placeholder="e.g. JAN 2025 - FEB 2025" value={exp.duration} onChange={(e) => handleArrayChange('experience', idx, 'duration', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Location/Type</label>
                                                        <input type="text" placeholder="e.g. Remote / Chennai" value={exp.location} onChange={(e) => handleArrayChange('experience', idx, 'location', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Description & Achievements</label>
                                                    <textarea placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium resize-none" rows={4}></textarea>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', location: '', description: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                    <Plus className="w-4 h-4" /> Add Experience
                                </button>
                            </div>
                        )}

                        {activeTab === 'education' && (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {resumeData.education.map((edu, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-blue-400/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-black">
                                                        {idx + 1}
                                                    </div>
                                                    {edu.institution || 'New Education'}
                                                </h4>
                                                <button onClick={() => removeArrayItem('education', idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Institution</label>
                                                    <input type="text" placeholder="Institution Name" value={edu.institution} onChange={(e) => handleArrayChange('education', idx, 'institution', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Location</label>
                                                    <input type="text" placeholder="e.g. Chennai" value={edu.location} onChange={(e) => handleArrayChange('education', idx, 'location', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Degree</label>
                                                        <input type="text" placeholder="e.g. MCA" value={edu.degree} onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Year/Duration</label>
                                                        <input type="text" placeholder="e.g. 2025 - 2027" value={edu.year} onChange={(e) => handleArrayChange('education', idx, 'year', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Additional Info (Grade, Status)</label>
                                                    <input type="text" placeholder="e.g. CGPA: 8.2 or (Pursuing)" value={edu.grade} onChange={(e) => handleArrayChange('education', idx, 'grade', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button onClick={() => addArrayItem('education', { institution: '', degree: '', grade: '', year: '', location: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                    <Plus className="w-4 h-4" /> Add Education
                                </button>
                            </div>
                        )}

                        {activeTab === 'projects' && (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {resumeData.projects.map((project, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-blue-400/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 text-xs font-black">
                                                        {idx + 1}
                                                    </div>
                                                    {project.title || 'New Project'}
                                                </h4>
                                                <button onClick={() => removeArrayItem('projects', idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Project Title</label>
                                                        <input type="text" placeholder="e.g. Chatter App" value={project.title} onChange={(e) => handleArrayChange('projects', idx, 'title', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Link</label>
                                                        <input type="text" placeholder="e.g. [Link] or URL" value={project.link} onChange={(e) => handleArrayChange('projects', idx, 'link', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Description</label>
                                                    <textarea placeholder="Describe the tech stack and features..." value={project.description} onChange={(e) => handleArrayChange('projects', idx, 'description', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium resize-none" rows={3}></textarea>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button onClick={() => addArrayItem('projects', { title: '', link: '', description: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                    <Plus className="w-4 h-4" /> Add Project
                                </button>
                            </div>
                        )}

                        {activeTab === 'skills' && (
                            <div className="space-y-6">
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Technical Skills</label>
                                    <textarea value={resumeData.skills.technical} onChange={(e) => handleNestedChange('skills', 'technical', e.target.value)} rows={4} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium resize-none" placeholder="e.g. HTML5, CSS3, Tailwind JavaScript, React..."></textarea>
                                </div>
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Soft Skills</label>
                                    <textarea value={resumeData.skills.soft} onChange={(e) => handleNestedChange('skills', 'soft', e.target.value)} rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium resize-none" placeholder="e.g. Communication, Teamwork, Problem-Solving..."></textarea>
                                </div>
                                <div className="group">
                                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Languages</label>
                                    <textarea value={resumeData.skills.languages} onChange={(e) => handleNestedChange('skills', 'languages', e.target.value)} rows={2} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium resize-none" placeholder="e.g. English, Urdu, Tamil"></textarea>
                                </div>
                            </div>
                        )}

                        {activeTab === 'achievements' && (
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {resumeData.achievements.map((ach, idx) => (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} key={idx} className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:border-blue-400/50 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                                            <div className="bg-slate-50/80 dark:bg-slate-900/50 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center backdrop-blur-sm">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                                                    <Trophy className="w-4 h-4 text-amber-500" />
                                                    {ach.title || 'New Achievement'}
                                                </h4>
                                                <button onClick={() => removeArrayItem('achievements', idx)} className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Achievement Title</label>
                                                        <input type="text" placeholder="e.g. Web Development" value={ach.title} onChange={(e) => handleArrayChange('achievements', idx, 'title', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Link</label>
                                                        <input type="text" placeholder="e.g. [Link] or URL" value={ach.link} onChange={(e) => handleArrayChange('achievements', idx, 'link', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Details</label>
                                                    <textarea placeholder="Briefly describe your achievement..." value={ach.description} onChange={(e) => handleArrayChange('achievements', idx, 'description', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium resize-none" rows={3}></textarea>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <button onClick={() => addArrayItem('achievements', { title: '', link: '', description: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                    <Plus className="w-4 h-4" /> Add Achievement
                                </button>
                            </div>
                        )}

                        {/* {activeTab === 'personalDetails' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Father's Name</label>
                                        <input type="text" value={resumeData.personalDetails.fatherName} onChange={(e) => handleNestedChange('personalDetails', 'fatherName', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white text-sm font-medium" />
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Mother's Name</label>
                                        <input type="text" value={resumeData.personalDetails.motherName} onChange={(e) => handleNestedChange('personalDetails', 'motherName', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white text-sm font-medium" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" placeholder="e.g. 26-08-2003" value={resumeData.personalDetails.dob} onChange={(e) => handleNestedChange('personalDetails', 'dob', e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white text-sm font-medium" />
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nationality</label>
                                        <div className="relative">
                                            <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input type="text" placeholder="e.g. Indian" value={resumeData.personalDetails.nationality} onChange={(e) => handleNestedChange('personalDetails', 'nationality', e.target.value)} className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-blue-500 dark:text-white text-sm font-medium" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )} */}
                    </div>
                </section>

                {/* 3. Preview Canvas (Right) */}
                <section className="flex-1 overflow-auto relative p-8 md:p-12 custom-scrollbar shadow-inner bg-slate-100 dark:bg-slate-900 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNFMkU4RjAiIGZpbGwtb3BhY2l0eT0iMSIvPjwvc3ZnPg==')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiMxRTI5M0IiIGZpbGwtb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]">
                    <div className="sticky top-0 right-0 w-full flex justify-end z-10 mb-6 h-0 overflow-visible">
                        <div className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md border border-slate-700 uppercase tracking-widest">
                            <Sparkles className="w-3 h-3 text-blue-400" />
                            Live Canvas
                        </div>
                    </div>

                    <div id="resume-preview" className="mx-auto bg-white w-[210mm] min-h-[297mm] shadow-[0_20px_60px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 p-[15mm] shrink-0 text-black text-[12px] leading-snug relative rounded-sm" style={{ fontFamily: '"Times New Roman", Times, serif' }}>

                        {/* Header Section */}
                        <div className="text-center mb-6">
                            <h1 className="text-4xl font-normal text-black m-0 leading-tight uppercase tracking-tight" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                                {resumeData.personalInfo.fullName || 'FIRST LAST'}
                            </h1>
                            {resumeData.personalInfo.targetRole && (
                                <span className="flex justify-center items-center gap-1 text-[14px]">
                                    {resumeData.personalInfo.targetRole}
                                </span>
                            )}

                            <div className="text-[11px] text-black mt-1 space-y-0.5">
                                <div className="flex items-center justify-center gap-4 mt-1 flex-wrap">
                                    {resumeData.personalInfo.location && (
                                        <span className="flex justify-center items-center gap-1">
                                            <MapPinIcon className="w-3 h-3" /> {resumeData.personalInfo.location}
                                        </span>
                                    )}
                                    {resumeData.personalInfo.mobile && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3 h-3" /> {resumeData.personalInfo.mobile}
                                        </span>
                                    )}
                                    {resumeData.personalInfo.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {resumeData.personalInfo.email}
                                        </span>
                                    )}
                                    {resumeData.personalInfo.linkedinUrl && (
                                        <span className="flex items-center gap-1">
                                            <Linkedin className="w-3 h-3" /> {resumeData.personalInfo.linkedinUrl.replace('https://', '')}
                                        </span>
                                    )}
                                    {resumeData.personalInfo.githubUrl && (
                                        <span className="flex items-center gap-1">
                                            <Github className="w-3 h-3" /> {resumeData.personalInfo.githubUrl.replace('https://', '')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            {/* Education */}
                            {resumeData.education.length > 0 && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Education</h3>
                                    <div className="space-y-3">
                                        {resumeData.education.map((edu, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-bold text-[13px]">{edu.institution}</span>
                                                    <span className="text-[12px] font-bold">{edu.year}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="italic text-[12px]">{edu.degree}</span>
                                                    <span className="italic text-[11px]">{edu.location || 'City, State'}</span>
                                                </div>
                                                {edu.grade && <div className="text-[11px] mt-0.5">Grade: {edu.grade}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Experience */}
                            {resumeData.experience.length > 0 && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Experience</h3>
                                    <div className="space-y-4">
                                        {resumeData.experience.map((exp, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-bold text-[13px]">{exp.company}</span>
                                                    <span className="text-[12px] font-bold">{exp.duration}</span>
                                                </div>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="italic text-[12px]">{exp.role}</span>
                                                    <span className="italic text-[11px]">{exp.location || 'City, State'}</span>
                                                </div>
                                                <p className="text-black text-[11px] leading-normal whitespace-pre-wrap pl-4 relative before:content-['•'] before:absolute before:left-0">
                                                    {exp.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Projects */}
                            {resumeData.projects.length > 0 && (
                                <section>
                                    <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Projects</h3>
                                    <div className="space-y-4">
                                        {resumeData.projects.map((proj, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="font-bold text-[13px]">{proj.title}</span>
                                                    {proj.link && <span className="block italic text-blue-800 underline mt-0.5">{proj.link}</span>}
                                                </div>
                                                <p className="text-black text-[11px] leading-normal mt-1 whitespace-pre-wrap pl-4 relative before:content-['•'] before:absolute before:left-0">
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
                                    <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Skills</h3>
                                    <div className="text-[11px] space-y-1">
                                        {resumeData.skills.technical && (
                                            <div><span className="font-bold">Technical Skills:</span> {resumeData.skills.technical}</div>
                                        )}
                                        {resumeData.skills.soft && (
                                            <div><span className="font-bold">Soft Skills:</span> {resumeData.skills.soft}</div>
                                        )}
                                        {resumeData.skills.languages && (
                                            <div><span className="font-bold">Languages:</span> {resumeData.skills.languages}</div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Achievements & Details */}
                            <div className="gap-8">
                                {resumeData.achievements.length > 0 && (
                                    <section>
                                        <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Achievements</h3>
                                        <div className="space-y-2">
                                            {resumeData.achievements.map((ach, i) => (
                                                <div key={i} className="text-[11px]">
                                                    <div className="flex justify-between items-baseline">
                                                        <span className="font-bold">{ach.title}</span>
                                                        {ach.link && <span className="italic text-blue-800 underline text-[10px] ml-2">{ach.link}</span>}
                                                    </div>
                                                    <p className="italic text-slate-700">{ach.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* <section>
                                    <h3 className="text-[14px] font-bold text-black uppercase border-b border-black mb-2">Personal Details</h3>
                                    <div className="space-y-1 text-[11px]">
                                        {resumeData.personalDetails.fatherName && <div className="flex justify-between"><span>Father:</span> <span>{resumeData.personalDetails.fatherName}</span></div>}
                                        {resumeData.personalDetails.motherName && <div className="flex justify-between"><span>Mother:</span> <span>{resumeData.personalDetails.motherName}</span></div>}
                                        {resumeData.personalDetails.dob && <div className="flex justify-between"><span>D.O.B:</span> <span>{resumeData.personalDetails.dob}</span></div>}
                                        {resumeData.personalDetails.nationality && <div className="flex justify-between"><span>Nationality:</span> <span>{resumeData.personalDetails.nationality}</span></div>}
                                    </div>
                                </section> */}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ResumeBuilder;
