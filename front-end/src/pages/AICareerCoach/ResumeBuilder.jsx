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
    MapPin,
    Mail,
    Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import resumeApi from '@/services/resumeApi';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { apiCall } from '@/services/api';
import { toast } from 'sonner';

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    
    const [resumeId, setResumeId] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    const [resumeData, setResumeData] = useState({
        personalInfo: { fullName: '', email: '', mobile: '', location: '', targetRole: '', linkedinUrl: '', portfolioUrl: '' },
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: []
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
                    skills: r.skills || [],
                    projects: r.projects || []
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
                            mobile: userObj.mobile || prevInfo.mobile || '',
                            location: userObj.address?.city ? `${userObj.address.city}, ${userObj.address.state || ''}` : prevInfo.location || ''
                        };

                        // Auto-fill Education mapping
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

            if(userObj && userObj.fullName) {
                setResumeData(prev => {
                    const newData = { ...prev };
                    
                    // Personal Info
                    const prevInfo = prev.personalInfo || {};
                    newData.personalInfo = {
                        ...newData.personalInfo,
                        fullName: userObj.fullName || prevInfo.fullName || '',
                        email: userObj.email || prevInfo.email || '',
                        mobile: userObj.mobile || prevInfo.mobile || '',
                        location: userObj.address?.city ? `${userObj.address.city}, ${userObj.address.state || ''}` : prevInfo.location || ''
                    };

                    // Education mapping
                    const degreeObj = userObj.degree;
                    const collegeObj = userObj.college; 

                    if (degreeObj || collegeObj) {
                        const newInstitution = collegeObj?.collegeName || 'Your College';
                        const newDegree = degreeObj ? `${degreeObj.fullName}${degreeObj.specialization && degreeObj.specialization !== 'General' ? ' in ' + degreeObj.specialization : ''}` : '';
                        
                        // Check if we already have this in education to avoid dupes
                        const eduArray = Array.isArray(newData.education) ? newData.education : [];
                        const hasThisEdu = eduArray.some(edu => edu && (edu.degree === newDegree || edu.institution === newInstitution));
                        if (!hasThisEdu && (newInstitution || newDegree)) {
                            newData.education = [
                                ...eduArray,
                                {
                                    institution: newInstitution,
                                    degree: newDegree,
                                    grade: ''
                                }
                            ];
                        }
                    }

                    return newData;
                });
                toast.success("Profile data completely synced!");
            } else {
                toast.error("Could not sync profile. Missing required data.");
            }
        } catch(e) {
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

    const handlePrint = () => {
        window.print();
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
        } catch(e) {
            toast.error('AI Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1a3884]" />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col print-wrapper h-[calc(100vh-80px)] overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1120]">
            {/* --- PRINT ONLY CSS --- */}
            <style dangerouslySetInnerHTML={{__html: `
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
                    <button onClick={handleSmartAssist} disabled={generating} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm">
                        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        <span className="hidden md:inline">Smart Assist</span>
                    </button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm border border-slate-200 dark:border-slate-700">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="hidden md:inline">Save Progress</span>
                    </button>
                    <button onClick={handlePrint} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 shadow-md shadow-blue-600/20">
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
                        { id: 'experience', icon: Briefcase, label: 'Experience' },
                        { id: 'education', icon: GraduationCap, label: 'Education' },
                        { id: 'skills', icon: Award, label: 'Skills' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            title={tab.label}
                            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all relative ${
                                activeTab === tab.id 
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
                                                    <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500" />
                                                </div>
                                                <input type="text" name="location" value={resumeData.personalInfo.location || ''} onChange={handlePersonalInfoChange} placeholder="City, State" className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Professional Summary</label>
                                        <textarea value={resumeData.summary} onChange={(e) => setResumeData({...resumeData, summary: e.target.value})} rows={6} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none dark:text-white transition-all text-sm leading-relaxed font-medium resize-none" placeholder="Write a compelling summary..."></textarea>
                                    </div>
                                </div>
                            )}

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
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Description & Achievements</label>
                                                    <textarea placeholder="Describe your responsibilities and achievements..." value={exp.description} onChange={(e) => handleArrayChange('experience', idx, 'description', e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium resize-none" rows={4}></textarea>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                    <button onClick={() => addArrayItem('experience', { company: '', role: '', description: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                        <Plus className="w-4 h-4" /> Add Work Experience
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
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Degree</label>
                                                        <input type="text" placeholder="e.g. B.Tech in CS" value={edu.degree} onChange={(e) => handleArrayChange('education', idx, 'degree', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Grade/CGPA</label>
                                                        <input type="text" placeholder="Grade/CGPA" value={edu.grade} onChange={(e) => handleArrayChange('education', idx, 'grade', e.target.value)} className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-sm border border-slate-200 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 transition-colors font-medium" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                    </AnimatePresence>
                                    <button onClick={() => addArrayItem('education', { institution: '', degree: '', grade: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                        <Plus className="w-4 h-4" /> Add Education
                                    </button>
                                </div>
                            )}

                            {activeTab === 'skills' && (
                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-2.5">
                                        <AnimatePresence>
                                        {resumeData.skills.map((skill, idx) => (
                                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} key={idx} className="flex items-center bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 shadow-sm">
                                                <input type="text" value={skill.name} onChange={(e) => handleArrayChange('skills', idx, 'name', e.target.value)} className="bg-transparent outline-none w-28 placeholder:text-slate-300 dark:placeholder:text-slate-600 font-semibold" placeholder="e.g. React.js" />
                                                <button onClick={() => removeArrayItem('skills', idx)} className="ml-2 hover:text-red-500 text-slate-400 transition-colors bg-slate-50 dark:bg-slate-900 rounded-full p-1 border border-slate-100 dark:border-slate-700 hover:bg-red-50 hover:border-red-100">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </motion.div>
                                        ))}
                                        </AnimatePresence>
                                    </div>
                                    <button onClick={() => addArrayItem('skills', { name: '' })} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-white dark:bg-slate-900">
                                        <Plus className="w-4 h-4" /> Add Skill
                                    </button>
                                </div>
                            )}
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

                    {/* The A4 Resume Paper */}
                    <div id="resume-preview" className="mx-auto bg-white w-[210mm] min-h-[297mm] shadow-[0_20px_60px_rgba(0,0,0,0.08)] ring-1 ring-slate-900/5 p-[15mm] shrink-0 text-slate-800 text-[14px] leading-relaxed relative rounded-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {/* Visual Header */}
                        <div className="border-b-4 border-slate-800 pb-6 mb-8">
                            <h1 className="text-4xl font-black text-slate-900 m-0 leading-none tracking-tight uppercase">{resumeData.personalInfo.fullName || 'YOUR NAME'}</h1>
                            <h2 className="text-xl font-bold text-slate-500 mt-2 mb-4 uppercase tracking-widest">{resumeData.personalInfo.targetRole || 'Target Role / Profession'}</h2>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
                                {resumeData.personalInfo.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400"/> {resumeData.personalInfo.email}</span>}
                                {resumeData.personalInfo.mobile && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400"/> {resumeData.personalInfo.mobile}</span>}
                                {resumeData.personalInfo.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400"/> {resumeData.personalInfo.location}</span>}
                            </div>
                        </div>

                        {/* Summary */}
                        {resumeData.summary && (
                            <div className="mb-8">
                                <h3 className="text-sm font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-blue-600 inline-block"></span>
                                    Professional Summary
                                </h3>
                                <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{resumeData.summary}</p>
                            </div>
                        )}

                        {/* Experience */}
                        {resumeData.experience.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-blue-600 inline-block"></span>
                                    Experience
                                </h3>
                                <div className="space-y-6">
                                    {resumeData.experience.map((exp, idx) => (
                                        <div key={idx} className="relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="font-bold text-slate-900 text-base">{exp.role || 'Role Title'}</h4>
                                                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">{exp.company || 'Company Name'}</span>
                                            </div>
                                            <p className="text-[13px] text-slate-600 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {resumeData.education.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-blue-600 inline-block"></span>
                                    Education
                                </h3>
                                <div className="space-y-4">
                                    {resumeData.education.map((edu, idx) => (
                                        <div key={idx} className="flex justify-between items-start relative pl-4 before:absolute before:left-0 before:top-2 before:w-1.5 before:h-1.5 before:bg-slate-300 before:rounded-full">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{edu.degree || 'Degree Program'}</h4>
                                                <p className="text-[13px] font-medium text-slate-500 mt-0.5">{edu.institution || 'University / Institution'}</p>
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600">{edu.grade || 'Grade'}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Skills */}
                        {resumeData.skills.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-black text-slate-900 border-b-2 border-slate-100 pb-2 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-sm bg-blue-600 inline-block"></span>
                                    Skills
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {resumeData.skills.map((skill, idx) => (
                                        <span key={idx} className="text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-md">
                                            {skill.name || 'Skill'}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default ResumeBuilder;
