import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain, Target, GraduationCap, Briefcase, MapPin, DollarSign,
    ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles, TrendingUp,
    BookOpen, Shield, Zap, Users, Award, BarChart3, Download, ChevronDown,
    ChevronUp, RefreshCw, Clock, Star, Lightbulb, Rocket, FileText, Plus,
    Code, Cpu, Heart, Globe, Layers, PieChart, Activity, AlertTriangle, Lock, Table,
    LayoutDashboard, Milestone, CircuitBoard, Gauge, Radio, Compass, Trash2, ExternalLink, QrCode
} from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import careerGuideApi from '@/services/careerGuideApi';
import excelIntelligenceApi from '@/services/careerIntelligenceApi'; // Reuse for Excel lookups
import { toast } from 'sonner';

// ========== CONSTANTS ==========
const DOMAINS = ['Engineering', 'Business', 'Computer Science', 'Arts', 'Healthcare', 'Management', 'Finance', 'Law', 'Life Sciences', 'Media'];
const DEGREE_GROUPS = ['Undergraduate Degree', 'Postgraduate Degree', 'Diploma', 'Doctorate'];
const JOB_TYPES = ['Full-Time', 'Part-Time', 'Full-Time Internship', 'Part-Time Internship', 'Freelance or Gig Work', 'Fully Remote'];
const SALARY_RANGES = ['0–3 LPA', '3–5 LPA', '5–8 LPA', '8-12 LPA', '12-18 LPA', '18-25 LPA', '25+ LPA'];
const ORG_TYPES = [
    'Startup', 'High-growth scale-up', 'Small or medium enterprise',
    'Large Indian corporate company', 'Multinational corporation',
    'Government organization', 'Non-profit organization',
    'Academic institution', 'Consulting firm',
    'Family-owned business', 'Entrepreneurial venture', 'Open to any organization'
];
const EXPERIENCE_TYPES = ['Full-Time', 'Part-Time', 'Full-Time Internship', 'Part-Time Internship', 'Freelance or Gig Work', 'Remote Work', 'Volunteering'];
const VERIFICATION_MODES = ['URL Link', 'QR Code', 'Not Verified'];

// Reusing some icons from lucide that weren't imported
const History = Clock;

const FORM_STEPS = [
    { id: 'education', title: 'Education', icon: GraduationCap, description: 'Academic foundation' },
    { id: 'preferences', title: 'Job Preferences', icon: Briefcase, description: 'Target job roles' },
    { id: 'aspirations', title: 'Aspirations', icon: Target, description: 'Career goals & salary' },
    { id: 'experience', title: 'Experience', icon: History, description: 'Work history' },
    { id: 'skills', title: 'Skills & Certs', icon: Award, description: 'Verification & credentials' }
];

// ========== COMPONENTS ==========

const FormSection = ({ title, description, icon: Icon, children }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Icon size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            </div>
        </div>
        {children}
    </div>
);

const InputField = ({ label, value, onChange, placeholder, type = 'text', icon: Icon, required = false }) => (
    <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />}
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-800 dark:text-white`}
            />
        </div>
    </div>
);

const SelectField = ({ label, value, onChange, options, icon: Icon, required = false }) => (
    <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
            <select
                value={value}
                onChange={onChange}
                className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-slate-800 dark:text-white appearance-none`}
            >
                <option value="">Select Option</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    </div>
);

// ========== MAIN COMPONENT ==========
const SMAARTCareerAgent = () => {
    const [step, setStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState(null);
    const [activeTab, setActiveTab] = useState('zones');
    const [excelData, setExcelData] = useState({ sectors: [], roles: [] });

    // ── FORM STATE ──
    const [formData, setFormData] = useState({
        education: { domain: '', degreeGroup: '', degree: '', specialization: '' },
        jobPreferences: {
            primary: { sector: '', jobFamily: '', jobRole: '' },
            secondary: { sector: '', jobFamily: '', jobRole: '' },
            tertiary: { sector: '', jobFamily: '', jobRole: '' }
        },
        aspirations: { jobType: '', expectedSalaryRange: '', preferredLocations: [], organizationType: '' },
        workExperience: [],
        skillsAndCertifications: []
    });

    const [locationInput, setLocationInput] = useState('');

    const showExperience = ['Undergraduate Degree', 'Postgraduate Degree'].includes(formData.education.degreeGroup);

    useEffect(() => {
        fetchExcelData();
        loadLatestReport();
    }, []);

    const fetchExcelData = async () => {
        try {
            const data = await excelIntelligenceApi.getExcelData();
            if (data) {
                setExcelData({
                    sectors: data.masterSectors || [],
                    roles: data.allRoles || []
                });
            }
        } catch (err) { console.error(err); }
    };

    const loadLatestReport = async () => {
        try {
            const res = await careerGuideApi.getLatestReport();
            if (res.success) setReport(res.report);
        } catch (err) { console.error(err); }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await careerGuideApi.generateReport(formData);
            if (res.success) {
                setReport(res.report);
                toast.success('Career Guide generated successfully!');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            toast.error(err.error || 'Failed to generate guide');
        } finally {
            setIsGenerating(false);
        }
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            workExperience: [...prev.workExperience, {
                organizationName: '', designation: '', sector: '', experienceType: 'Full-Time',
                startDate: '', endDate: '', currentlyWorking: false
            }]
        }));
    };

    const addSkill = () => {
        setFormData(prev => ({
            ...prev,
            skillsAndCertifications: [...prev.skillsAndCertifications, {
                skillName: '', certificateName: '', issuingOrganization: '',
                yearOfCompletion: new Date().getFullYear(), verificationMode: 'Not Verified', verificationLink: ''
            }]
        }));
    };

    // ========== RENDERERS ==========

    const renderStep = () => {
        switch (step) {
            case 0: return (
                <FormSection title="Student Profile & Education" description="Define your academic background to align your career path." icon={GraduationCap}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField label="Domain" options={DOMAINS} value={formData.education.domain} onChange={e => setFormData({ ...formData, education: { ...formData.education, domain: e.target.value } })} icon={Globe} />
                        <SelectField label="Degree Group" options={DEGREE_GROUPS} value={formData.education.degreeGroup} onChange={e => setFormData({ ...formData, education: { ...formData.education, degreeGroup: e.target.value } })} icon={Layers} />
                        <InputField label="Specific Degree" placeholder="e.g. B.Tech, MBA, BCA" value={formData.education.degree} onChange={e => setFormData({ ...formData, education: { ...formData.education, degree: e.target.value } })} icon={GraduationCap} />
                        <InputField label="Specialization" placeholder="e.g. AI & ML, Finance, Marketing" value={formData.education.specialization} onChange={e => setFormData({ ...formData, education: { ...formData.education, specialization: e.target.value } })} icon={Zap} />
                    </div>
                </FormSection>
            );
            case 1: return (
                <FormSection title="Job Preferences" description="Select 3 target career roles for multifactor intelligence analysis." icon={Briefcase}>
                    {['primary', 'secondary', 'tertiary'].map((pref, i) => (
                        <div key={pref} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-500">{pref} Preference</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <SelectField label="Sector" options={excelData.sectors} value={formData.jobPreferences[pref].sector} onChange={e => setFormData({ ...formData, jobPreferences: { ...formData.jobPreferences, [pref]: { ...formData.jobPreferences[pref], sector: e.target.value } } })} />
                                <InputField label="Job Family" placeholder="e.g. Software, Analytics" value={formData.jobPreferences[pref].jobFamily} onChange={e => setFormData({ ...formData, jobPreferences: { ...formData.jobPreferences, [pref]: { ...formData.jobPreferences[pref], jobFamily: e.target.value } } })} />
                                <SelectField label="Job Role" options={excelData.roles} value={formData.jobPreferences[pref].jobRole} onChange={e => setFormData({ ...formData, jobPreferences: { ...formData.jobPreferences, [pref]: { ...formData.jobPreferences[pref], jobRole: e.target.value } } })} />
                            </div>
                        </div>
                    ))}
                </FormSection>
            );
            case 2: return (
                <FormSection title="Career Aspirations" description="Set your sights on the future with salary and location preferences." icon={Target}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SelectField label="Job Type" options={JOB_TYPES} value={formData.aspirations.jobType} onChange={e => setFormData({ ...formData, aspirations: { ...formData.aspirations, jobType: e.target.value } })} icon={Clock} />
                        <SelectField label="Expected Salary" options={SALARY_RANGES} value={formData.aspirations.expectedSalaryRange} onChange={e => setFormData({ ...formData, aspirations: { ...formData.aspirations, expectedSalaryRange: e.target.value } })} icon={DollarSign} />
                        <SelectField label="Organization Type" options={ORG_TYPES} value={formData.aspirations.organizationType} onChange={e => setFormData({ ...formData, aspirations: { ...formData.aspirations, organizationType: e.target.value } })} icon={Globe} />
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Preferred Locations (Max 3)</label>
                            <div className="flex gap-2">
                                <input
                                    value={locationInput}
                                    onChange={e => setLocationInput(e.target.value)}
                                    placeholder="Add City"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && locationInput && formData.aspirations.preferredLocations.length < 3) {
                                            setFormData({ ...formData, aspirations: { ...formData.aspirations, preferredLocations: [...formData.aspirations.preferredLocations, locationInput] } });
                                            setLocationInput('');
                                        }
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                                />
                                <button onClick={() => {
                                    if (locationInput && formData.aspirations.preferredLocations.length < 3) {
                                        setFormData({ ...formData, aspirations: { ...formData.aspirations, preferredLocations: [...formData.aspirations.preferredLocations, locationInput] } });
                                        setLocationInput('');
                                    }
                                }} className="p-3 bg-indigo-500 text-white rounded-xl"><Plus size={20} /></button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.aspirations.preferredLocations.map(loc => (
                                    <span key={loc} className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold flex items-center gap-2">
                                        {loc} <Trash2 size={12} className="cursor-pointer" onClick={() => setFormData({ ...formData, aspirations: { ...formData.aspirations, preferredLocations: formData.aspirations.preferredLocations.filter(l => l !== loc) } })} />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </FormSection>
            );
            case 3:
                if (!showExperience) return (
                    <div className="p-12 text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                            <Lock size={32} />
                        </div>
                        <h3 className="text-xl font-bold italic">Section Locked</h3>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">Work experience is typically analyzed for Undergraduate or Postgraduate students. Please continue to the next section.</p>
                    </div>
                );
                return (
                    <FormSection title="Work Experience" description="Tell us where you've worked before (Optional)." icon={History}>
                        <div className="space-y-4">
                            {formData.workExperience.map((exp, i) => (
                                <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 relative">
                                    <button onClick={() => setFormData({ ...formData, workExperience: formData.workExperience.filter((_, idx) => idx !== i) })} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField label="Organization" value={exp.organizationName} onChange={e => {
                                            const newExp = [...formData.workExperience];
                                            newExp[i].organizationName = e.target.value;
                                            setFormData({ ...formData, workExperience: newExp });
                                        }} />
                                        <InputField label="Designation" value={exp.designation} onChange={e => {
                                            const newExp = [...formData.workExperience];
                                            newExp[i].designation = e.target.value;
                                            setFormData({ ...formData, workExperience: newExp });
                                        }} />
                                        <InputField label="Sector" value={exp.sector} onChange={e => {
                                            const newExp = [...formData.workExperience];
                                            newExp[i].sector = e.target.value;
                                            setFormData({ ...formData, workExperience: newExp });
                                        }} />
                                        <SelectField label="Type" options={EXPERIENCE_TYPES} value={exp.experienceType} onChange={e => {
                                            const newExp = [...formData.workExperience];
                                            newExp[i].experienceType = e.target.value;
                                            setFormData({ ...formData, workExperience: newExp });
                                        }} />
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Start Date</label>
                                            <input type="date" value={exp.startDate} onChange={e => {
                                                const newExp = [...formData.workExperience];
                                                newExp[i].startDate = e.target.value;
                                                setFormData({ ...formData, workExperience: newExp });
                                            }} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none" />
                                        </div>
                                        {!exp.currentlyWorking && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-semibold">End Date</label>
                                                <input type="date" value={exp.endDate} onChange={e => {
                                                    const newExp = [...formData.workExperience];
                                                    newExp[i].endDate = e.target.value;
                                                    setFormData({ ...formData, workExperience: newExp });
                                                }} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none" />
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 pt-2">
                                            <input type="checkbox" checked={exp.currentlyWorking} onChange={e => {
                                                const newExp = [...formData.workExperience];
                                                newExp[i].currentlyWorking = e.target.checked;
                                                if (e.target.checked) newExp[i].endDate = '';
                                                setFormData({ ...formData, workExperience: newExp });
                                            }} id={`current-${i}`} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                            <label htmlFor={`current-${i}`} className="text-sm font-medium text-slate-700 dark:text-slate-300">Currently working here</label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={addExperience} className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                                <Plus size={20} /> Add Experience
                            </button>
                        </div>
                    </FormSection>
                );
            case 4: return (
                <FormSection title="Skills & Certifications" description="Showcase your verified credentials for industry trust." icon={Award}>
                    <div className="space-y-4">
                        {formData.skillsAndCertifications.map((cert, i) => (
                            <div key={i} className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 relative space-y-4">
                                <button onClick={() => setFormData({ ...formData, skillsAndCertifications: formData.skillsAndCertifications.filter((_, idx) => idx !== i) })} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField label="Skill Name" value={cert.skillName} onChange={e => {
                                        const newCerts = [...formData.skillsAndCertifications];
                                        newCerts[i].skillName = e.target.value;
                                        setFormData({ ...formData, skillsAndCertifications: newCerts });
                                    }} />
                                    <InputField label="Certificate Name" value={cert.certificateName} onChange={e => {
                                        const newCerts = [...formData.skillsAndCertifications];
                                        newCerts[i].certificateName = e.target.value;
                                        setFormData({ ...formData, skillsAndCertifications: newCerts });
                                    }} />
                                    <SelectField label="Year of Completion" options={Array.from({ length: 31 }, (_, i) => 2010 + i).map(String)} value={cert.yearOfCompletion} onChange={e => {
                                        const newCerts = [...formData.skillsAndCertifications];
                                        newCerts[i].yearOfCompletion = e.target.value;
                                        setFormData({ ...formData, skillsAndCertifications: newCerts });
                                    }} />
                                    <SelectField label="Verification Mode" options={VERIFICATION_MODES} value={cert.verificationMode} onChange={e => {
                                        const newCerts = [...formData.skillsAndCertifications];
                                        newCerts[i].verificationMode = e.target.value;
                                        setFormData({ ...formData, skillsAndCertifications: newCerts });
                                    }} />
                                    {cert.verificationMode !== 'Not Verified' && (
                                        <InputField label="Verification Link" placeholder="https://..." value={cert.verificationLink} onChange={e => {
                                            const newCerts = [...formData.skillsAndCertifications];
                                            newCerts[i].verificationLink = e.target.value;
                                            setFormData({ ...formData, skillsAndCertifications: newCerts });
                                        }} icon={ExternalLink} />
                                    )}
                                </div>
                            </div>
                        ))}
                        <button onClick={addSkill} className="w-full p-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2">
                            <Plus size={20} /> Add Skill / Certificate
                        </button>
                    </div>
                </FormSection>
            );
            default: return null;
        }
    };

    const renderReport = () => {
        if (!report || !report.output) return null;
        const out = report.output;

        return (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
                {/* Status Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Career Analysis Complete</h2>
                            <p className="text-sm text-slate-500">Multifactor Report v1.0 • {new Date(report.generatedDate || report.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <button onClick={() => setReport(null)} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all">
                        <RefreshCw size={18} /> New Analysis
                    </button>
                </div>

                {/* Strategy Overview */}
                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-2xl relative overflow-hidden">
                    <CircuitBoard className="absolute top-0 right-0 w-64 h-64 text-white/5 -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                            <Brain size={12} /> Strategic Insight
                        </div>
                        <h3 className="text-2xl font-bold">Learning Path Overview</h3>
                        <p className="text-white/80 leading-relaxed max-w-4xl">{out.learningPathOverview}</p>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full max-w-2xl mx-auto">
                    {[
                        { id: 'zones', label: 'Zones', icon: Milestone },
                        { id: 'skills', label: 'Skills', icon: Cpu },
                        { id: 'tools', label: 'AI Tools', icon: Zap },
                        { id: 'path', label: 'Pathway', icon: Activity }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-md' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
                        {activeTab === 'zones' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {Object.entries(out.careerZones).map(([key, data]) => {
                                    const zoneColors = {
                                        Green: 'from-emerald-500 to-teal-600',
                                        Amber: 'from-amber-500 to-orange-600',
                                        Red: 'from-rose-500 to-pink-600'
                                    };
                                    return (
                                        <div key={key} className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 flex flex-col items-center text-center">
                                            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${zoneColors[data.zone]} flex flex-col items-center justify-center text-white shadow-lg`}>
                                                <span className="text-xl font-black">{data.skillCoverage}%</span>
                                                <span className="text-[10px] font-bold uppercase tracking-tighter">Match</span>
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">{key} Role</h3>
                                                <p className="text-xl font-bold">{formData.jobPreferences[key]?.jobRole || 'Analysis'}</p>
                                            </div>
                                            <div className="w-full h-px bg-slate-100 dark:bg-slate-800" />
                                            <div className="grid grid-cols-2 gap-4 w-full">
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Hiring</p>
                                                    <div className={`text-sm font-bold ${data.hiringLikelihood === 'Green' ? 'text-emerald-500' : data.hiringLikelihood === 'Amber' ? 'text-amber-500' : 'text-rose-500'}`}>
                                                        {data.hiringLikelihood} Likelihood
                                                    </div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Salary</p>
                                                    <p className="text-sm font-bold text-indigo-500">{data.marketIntelligence?.salaryRange}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 w-full text-left">
                                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Market Pulse</p>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">Demand: {data.marketIntelligence?.demandTrends}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'skills' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CheckCircle2 size={20} /></div>
                                        <h3 className="text-xl font-bold">Must-Have Skills</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {out.technicalSkills.mustHave.map(skill => (
                                            <div key={skill} className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><TrendingUp size={20} /></div>
                                        <h3 className="text-xl font-bold">Nice-to-Have Skills</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {out.technicalSkills.niceToHave.map(skill => (
                                            <div key={skill} className="flex items-center gap-3 p-4 rounded-xl bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-blue-700 dark:text-blue-400 font-bold text-sm">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" /> {skill}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold flex items-center gap-2"><CircuitBoard className="text-indigo-500" /> Essential AI Tools</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {out.aiTools.mustHave.map(tool => (
                                                <span key={tool} className="px-5 py-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black text-xs border border-indigo-500/20 shadow-sm">{tool}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="text-purple-500" /> Next-Gen AI Assets</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {out.aiTools.niceToHave.map(tool => (
                                                <span key={tool} className="px-5 py-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs border border-purple-500/20 shadow-sm">{tool}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'path' && (
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-3"><Award className="text-amber-500" /> Target Certifications</h3>
                                        <div className="space-y-4">
                                            {out.learningPathway.certifications.map(cert => (
                                                <div key={cert} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm font-bold">
                                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500"><Download size={14} /></div>
                                                    {cert}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                                        <h3 className="text-xl font-bold flex items-center gap-3"><BookOpen className="text-emerald-500" /> Recommended Courses</h3>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-3">Free Resources</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {out.learningPathway.courses.free.map(c => <span key={c} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 text-xs font-bold">{c}</span>)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 mb-3">Professional Tracks (Paid)</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {out.learningPathway.courses.paid.map(c => <span key={c} className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/5 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 text-xs font-bold">{c}</span>)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
                                    <h3 className="text-xl font-bold flex items-center gap-3"><Code className="text-blue-500" /> Strategic Projects</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {out.learningPathway.projects.map((proj, i) => (
                                            <div key={i} className="p-6 rounded-2xl bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 space-y-2">
                                                <h4 className="font-bold text-blue-600 dark:text-blue-400">Project {i + 1}</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{proj}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] transition-colors duration-300">
            <DashboardSidebar />

            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-6xl mx-auto pb-12">

                        {/* Header */}
                        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                                        <Brain size={28} />
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-800 dark:text-white">SMAART Career Agent AI</h1>
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Multifactor Career Intelligence • Zone-Based Strategic Analysis</p>
                            </motion.div>

                            {!report && (
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    {FORM_STEPS.map((s, i) => (
                                        <div key={s.id} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${step === i ? 'bg-indigo-600 text-white shadow-md' : i < step ? 'bg-emerald-500/20 text-emerald-500' : 'text-slate-400'}`}>
                                            {i < step ? <CheckCircle2 size={16} /> : <s.icon size={16} />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {report ? (
                                renderReport()
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl shadow-indigo-500/5 overflow-hidden">
                                    <div className="p-8 md:p-12">
                                        {renderStep()}

                                        <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <button
                                                disabled={step === 0}
                                                onClick={() => setStep(s => s - 1)}
                                                className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${step === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <ArrowLeft size={20} /> Previous
                                            </button>

                                            {step < FORM_STEPS.length - 1 ? (
                                                <button
                                                    onClick={() => setStep(s => s + 1)}
                                                    className="flex items-center gap-2 px-10 py-4 rounded-2xl bg-slate-800 dark:bg-indigo-600 text-white font-bold hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-slate-900/20 dark:shadow-indigo-600/30 group"
                                                >
                                                    Next Step <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            ) : (
                                                <button
                                                    disabled={isGenerating}
                                                    onClick={handleGenerate}
                                                    className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/40 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <Loader2 size={24} className="animate-spin" />
                                                            <span className="relative z-10">AI Thinking...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles size={24} />
                                                            <span className="relative z-10">Generate Intelligence</span>
                                                        </>
                                                    )}
                                                    <motion.div className="absolute inset-0 bg-white/20 translate-x-[-100%]" animate={{ translateX: isGenerating ? '100%' : '-100%' }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default SMAARTCareerAgent;
