import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Brain, Target, GraduationCap, Briefcase, MapPin, DollarSign,
    ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles, TrendingUp,
    BookOpen, Shield, Zap, Users, Award, BarChart3, Download, ChevronDown,
    ChevronUp, RefreshCw, Clock, Star, Lightbulb, Rocket, FileText, Plus,
    Code, Cpu, Heart, Globe, Layers, PieChart, Activity, AlertTriangle, Lock
} from 'lucide-react';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import careerIntelligenceApi from '@/services/careerIntelligenceApi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// ========== CONSTANTS ==========
const AREAS_OF_INTEREST = ['Technology', 'Business', 'Healthcare', 'Finance', 'Creative', 'Core Engineering', 'Education', 'Government', 'Others'];
const JOB_SECTORS = ['IT', 'Core Engineering', 'Startup', 'MNC', 'Government', 'Freelance', 'Research', 'Others'];
const COLLEGE_TYPES = ['Government', 'Private', 'Deemed', 'Autonomous', 'IIT/NIT', 'Other'];
const SALARY_RANGES = ['0-3 LPA', '3-6 LPA', '6-10 LPA', '10-15 LPA', '15-25 LPA', '25+ LPA'];

const FORM_STEPS = [
    { id: 'goals', title: 'Career Goals', icon: Target, description: 'Define your career aspirations' },
    { id: 'education', title: 'Education', icon: GraduationCap, description: 'Your academic background' },
    { id: 'interest', title: 'Interest Area', icon: Sparkles, description: 'What excites you most' },
    { id: 'job', title: 'Job Preference', icon: Briefcase, description: 'Your ideal work environment' },
];

// ========== FORM INPUT COMPONENT ==========
const FormInput = ({ label, name, value, onChange, placeholder, required, type = 'text', icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 dark:hover:border-slate-500`}
            />
        </div>
    </div>
);

// ========== FORM SELECT COMPONENT ==========
const FormSelect = ({ label, name, value, onChange, options, required, icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                    <Icon size={18} />
                </div>
            )}
            <select
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-10 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white appearance-none cursor-pointer transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 dark:hover:border-slate-500`}
            >
                <option value="">Select...</option>
                {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
    </div>
);

// ========== FORM TEXTAREA COMPONENT ==========
const FormTextarea = ({ label, name, value, onChange, placeholder, required, icon: Icon }) => (
    <div className="group">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Icon size={18} />
                </div>
            )}
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                rows={3}
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 hover:border-slate-300 dark:hover:border-slate-500 resize-none`}
            />
        </div>
    </div>
);

// ========== CIRCULAR PROGRESS ==========
const CircularProgress = ({ percentage, label, color = '#6366f1', size = 120 }) => {
    const radius = (size - 12) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-700" />
                    <motion.circle
                        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="8"
                        strokeLinecap="round" strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.span
                        className="text-2xl font-black text-slate-800 dark:text-white"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                    >
                        {percentage}%
                    </motion.span>
                </div>
            </div>
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 text-center">{label}</span>
        </div>
    );
};

// ========== REPORT SECTION CARD ==========
const ReportSection = ({ title, icon: Icon, color, children, delay = 0 }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl transition-shadow duration-300"
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} text-white shadow-lg`}>
                        <Icon size={22} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown size={20} className="text-slate-400" />
                </motion.div>
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6">{children}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ========== SKILL TAG ==========
const SkillTag = ({ text, variant = 'default' }) => {
    const variants = {
        default: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/20',
        success: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
        warning: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
        rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border ${variants[variant]} transition-all duration-200 hover:scale-105`}>
            {text}
        </span>
    );
};

// ========== PRIORITY BADGE ==========
const PriorityBadge = ({ priority }) => {
    const colors = {
        Critical: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20',
        High: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20',
        Medium: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colors[priority] || colors.Medium}`}>
            {priority}
        </span>
    );
};


// ========== MAIN COMPONENT ==========
const CareerDataFetcher = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [report, setReport] = useState(null);
    const [previousReports, setPreviousReports] = useState([]);
    const [showForm, setShowForm] = useState(true);
    const [error, setError] = useState('');
    const [loadingReports, setLoadingReports] = useState(true);
    const reportRef = useRef(null);

    // ── Simulation Engine State ──
    const [simCount, setSimCount] = useState(50);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simResult, setSimResult] = useState(null);
    const [showSimPanel, setShowSimPanel] = useState(false);

    const [formData, setFormData] = useState({
        shortTermGoal: '',
        longTermGoal: '',
        degree: '',
        specialization: '',
        collegeType: '',
        yearOfGraduation: '',
        academicPerformance: '',
        areaOfInterest: '',
        areaOfInterestOther: '',
        interestedJobRole: '',
        jobSector: '',
        preferredLocation: '',
        expectedSalaryRange: '',
    });

    const [excelData, setExcelData] = useState({ sectors: [], roles: [] });
    const [roleSuggestions, setRoleSuggestions] = useState([]);
    const [isSearchingRole, setIsSearchingRole] = useState(false);
    const suggestionsRef = useRef(null);

    const loadReports = async () => {
        const userId = JSON.parse(sessionStorage.getItem('user'))?._id;
        if (!userId) return;

        setLoadingReports(true);
        try {
            const data = await careerIntelligenceApi.getReports();
            const reports = data.reports || [];
            setPreviousReports(reports);

            // Check if we were tracking a specific generating report
            const trackingId = sessionStorage.getItem('generating_report_id');
            if (trackingId) {
                const tracked = reports.find(r => r._id === trackingId);
                if (tracked && tracked.status === 'completed') {
                    setReport(tracked);
                    setShowForm(false);
                    sessionStorage.removeItem('generating_report_id');
                    return;
                } else if (tracked && tracked.status === 'failed') {
                    setError('The previous generation attempt failed. Please try again.');
                    sessionStorage.removeItem('generating_report_id');
                } else if (tracked) {
                    setIsGenerating(true);
                }
            }

            // Normal flow: show latest if no generation is in progress
            if (reports.length > 0 && !isGenerating) {
                const latest = reports.find(r => r.status === 'completed');
                if (latest && !report) { // Only auto-set if not already viewing one
                    setReport(latest);
                    setShowForm(false);
                }
            }
        } catch (err) {
            console.error('Failed to load reports:', err);
        } finally {
            setLoadingReports(false);
        }
    };

    const fetchExcelData = async () => {
        try {
            const data = await apiCall('/career-intelligence/excel-data');
            if (data) {
                setExcelData({
                    sectors: data.masterSectors || [],
                    roles: data.allRoles || []
                });
            }
        } catch (error) {
            console.error("Error fetching career data:", error);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadReports();
        fetchExcelData();

        const handleClickOutside = (event) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
                setRoleSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validateStep = () => {
        switch (currentStep) {
            case 0: return formData.shortTermGoal?.trim().length > 2 && formData.longTermGoal?.trim().length > 2;
            case 1: return formData.degree && formData.specialization;
            case 2: return formData.areaOfInterest;
            case 3: return formData.interestedJobRole && formData.jobSector;
            default: return true;
        }
    };

    const handleSubmit = async () => {
        setIsGenerating(true);
        setError('');
        try {
            const submitData = { ...formData };
            if (submitData.yearOfGraduation) submitData.yearOfGraduation = parseInt(submitData.yearOfGraduation);

            const data = await careerIntelligenceApi.generateReport(submitData);

            const reportId = data.report?._id || data.report?.id;
            if (reportId) {
                sessionStorage.setItem('generating_report_id', reportId);
            }

            if (data.report?.status === 'completed') {
                setReport(data.report);
                setShowForm(false);
                setPreviousReports(prev => [data.report, ...prev]);
                sessionStorage.removeItem('generating_report_id');
            } else {
                // It's processing - start polling or just wait
                // For now, our implementation usually finishes in one call but lets be safe
                setReport(data.report);
                setShowForm(false);
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.message || 'The AI engine is busy. Your data is saved from Excel, but we could not generate the full report right now. Please try again in a few minutes.');
            sessionStorage.removeItem('generating_report_id');
        } finally {
            setIsGenerating(false);
        }
    };

    const viewReport = (r) => {
        setReport(r);
        setShowForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startNew = () => {
        setShowForm(true);
        setCurrentStep(0);
        setFormData({
            shortTermGoal: '', longTermGoal: '', degree: '', specialization: '',
            collegeType: '', yearOfGraduation: '', academicPerformance: '',
            areaOfInterest: '', areaOfInterestOther: '', interestedJobRole: '',
            jobSector: '', preferredLocation: '', expectedSalaryRange: '',
        });
        setError('');
    };

    // ── Simulation Engine Handler ──
    const handleRunSimulation = async () => {
        const finalCount = Math.min(Math.max(parseInt(simCount) || 50, 1), 50);
        setIsSimulating(true);
        setSimResult(null);
        try {
            const data = await careerIntelligenceApi.runSimulation(finalCount);
            setSimResult(data);
            toast.success(`✅ Simulation complete! ${data.totalGenerated} profiles saved to database.`);
        } catch (err) {
            toast.error(err.message || 'Simulation failed. Please try again.');
        } finally {
            setIsSimulating(false);
        }
    };


    const handleDownloadPDF = async () => {
        if (!report || !reportRef.current) return;

        const toastId = toast.loading("Preparing your professional PDF report...");

        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff', // Ensure clean background
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width / 2, canvas.height / 2] // Match dimensions at scale 1
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
            pdf.save(`SMAART-Career-Report-${report.careerInput?.interestedJobRole || 'Intelligence'}.pdf`);

            toast.success("Report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Failed to generate PDF. Please try again.", { id: toastId });
        }
    };

    // ========== RENDER FORM STEP ==========
    const renderFormStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <motion.div key="goals" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <FormTextarea label="Short-Term Goal (1–2 years)" name="shortTermGoal" value={formData.shortTermGoal} onChange={handleInputChange} placeholder="e.g., Get my first job as a software developer at a product company" required icon={Target} />
                        <FormTextarea label="Long-Term Goal (5+ years)" name="longTermGoal" value={formData.longTermGoal} onChange={handleInputChange} placeholder="e.g., Become a Technical Lead or CTO, building scalable products" required icon={Rocket} />
                    </motion.div>
                );
            case 1:
                return (
                    <motion.div key="education" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput label="Degree" name="degree" value={formData.degree} onChange={handleInputChange} placeholder="e.g., B.Tech, BBA, MBA" required icon={GraduationCap} />
                            <FormInput label="Specialization" name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g., Computer Science, Marketing" required icon={BookOpen} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormSelect label="College Type" name="collegeType" value={formData.collegeType} onChange={handleInputChange} options={COLLEGE_TYPES} icon={Award} />
                            <FormInput label="Year of Graduation" name="yearOfGraduation" value={formData.yearOfGraduation} onChange={handleInputChange} placeholder="e.g., 2025" type="number" icon={Clock} />
                            <FormInput label="Academic Performance" name="academicPerformance" value={formData.academicPerformance} onChange={handleInputChange} placeholder="e.g., 8.5 CGPA" icon={Star} />
                        </div>
                    </motion.div>
                );
            case 2:
                return (
                    <motion.div key="interest" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                                Select Your Area of Interest <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {AREAS_OF_INTEREST.map(area => (
                                    <button
                                        key={area}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, areaOfInterest: area }))}
                                        className={`p-4 rounded-xl border-2 text-sm font-semibold transition-all duration-300 ${formData.areaOfInterest === area
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-500/20 scale-[1.02]'
                                            : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        {area}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {formData.areaOfInterest === 'Others' && (
                            <FormInput label="Specify Your Area" name="areaOfInterestOther" value={formData.areaOfInterestOther} onChange={handleInputChange} placeholder="e.g., Agriculture Tech, Space Engineering" icon={Lightbulb} />
                        )}
                    </motion.div>
                );
            case 3:
                return (
                    <motion.div key="job" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="relative">
                            <FormInput
                                label="Interested Job Role"
                                name="interestedJobRole"
                                value={formData.interestedJobRole}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFormData(prev => ({ ...prev, interestedJobRole: val }));
                                    if (val.length > 1) {
                                        const matches = excelData.roles.filter(r => r.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
                                        setRoleSuggestions(matches);
                                        setIsSearchingRole(true);
                                    } else {
                                        setRoleSuggestions([]);
                                    }
                                }}
                                placeholder="e.g., Full Stack Developer, Data Scientist"
                                required
                                icon={Briefcase}
                            />
                            {isSearchingRole && roleSuggestions.length > 0 && (
                                <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
                                    <div className="p-2 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3">SMAART Role Suggestions</div>
                                    {roleSuggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 text-slate-700 dark:text-slate-200"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, interestedJobRole: suggestion }));
                                                setRoleSuggestions([]);
                                                setIsSearchingRole(false);
                                            }}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormSelect label="Job Sector" name="jobSector" value={formData.jobSector} onChange={handleInputChange} options={excelData.sectors.length > 0 ? excelData.sectors : JOB_SECTORS} required icon={Layers} />
                            <FormInput label="Preferred Location" name="preferredLocation" value={formData.preferredLocation} onChange={handleInputChange} placeholder="e.g., Bangalore, Remote, Hybrid" icon={MapPin} />
                        </div>
                        <FormSelect label="Expected Salary Range" name="expectedSalaryRange" value={formData.expectedSalaryRange} onChange={handleInputChange} options={SALARY_RANGES} icon={DollarSign} />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    // ========== RENDER REPORT ==========
    const renderReport = () => {
        if (!report) return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Report Not Found</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">We couldn't load the requested career report. It may still be generating or has been moved.</p>
                <button onClick={startNew} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold transition-all hover:scale-105">Start New Assessment</button>
            </div>
        );

        if (report.status === 'processing' || report.status === 'pending') {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
                    <Loader2 size={48} className="animate-spin text-indigo-500 mb-6" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analyzing Data...</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">Our engines are busy building your career intelligence. This usually takes 30-60 seconds.</p>
                    <button onClick={loadReports} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 transition-all">
                        <RefreshCw size={18} /> Refresh Status
                    </button>
                </div>
            );
        }

        if (!report.output && !report.careerOutput) {
            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-center">
                    <Zap size={48} className="text-amber-500 mb-6" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generation Incomplete</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">The report was saved but the AI analysis is still being processed. Please refresh in a moment.</p>
                    <div className="flex gap-3">
                        <button onClick={loadReports} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold transition-all">Check Again</button>
                        <button onClick={startNew} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold transition-all">Reset Form</button>
                    </div>
                </div>
            )
        }

        const output = report.output || report.careerOutput;

        return (
            <div ref={reportRef} className="space-y-6">
                {/* Report Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Brain className="w-10 h-10" />
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black">Career Intelligence Report</h2>
                                <p className="text-white/70 text-sm mt-1">Version {report.version} • Generated {new Date(report.generatedDate || report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Action Bar */}
                <div className="flex flex-wrap gap-3">
                    <button onClick={startNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl">
                        <RefreshCw size={16} /> Generate New
                    </button>
                    <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all">
                        <FileText size={16} /> View Form
                    </button>
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl ml-auto">
                        <Download size={16} /> Download Report
                    </button>
                </div>

                {/* 1. Technical Skills */}
                <ReportSection title="Technical Skills Required" icon={Code} color="from-blue-500 to-cyan-500" delay={0.1}>
                    <div className="space-y-4">
                        {output.technicalSkills?.coreSkills?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Core Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {output.technicalSkills.coreSkills.map((skill, i) => <SkillTag key={i} text={skill} />)}
                                </div>
                            </div>
                        )}
                        {output.technicalSkills?.toolsAndTechnologies?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Tools & Technologies</h4>
                                <div className="flex flex-wrap gap-2">
                                    {output.technicalSkills.toolsAndTechnologies.map((tool, i) => <SkillTag key={i} text={tool} variant="success" />)}
                                </div>
                            </div>
                        )}
                        {output.technicalSkills?.certifications?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Certifications</h4>
                                <div className="flex flex-wrap gap-2">
                                    {output.technicalSkills.certifications.map((cert, i) => (
                                        typeof cert === 'string'
                                            ? <SkillTag key={i} text={cert} variant="purple" />
                                            : <div key={i} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20">
                                                <Award size={12} /> {cert.name} {cert.provider && <span className="text-purple-400">({cert.provider})</span>} {cert.cost && <span className="text-[10px] ml-1 opacity-70">{cert.cost}</span>}
                                            </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </ReportSection>

                {/* 2. AI Skills */}
                <ReportSection title="AI Skills To Learn" icon={Cpu} color="from-purple-500 to-violet-500" delay={0.15}>
                    <div className="space-y-4">
                        {output.aiSkills?.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {output.aiSkills.skills.map((skill, i) => <SkillTag key={i} text={skill} variant="purple" />)}
                            </div>
                        )}
                        {output.aiSkills?.tools?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">AI Tools</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {output.aiSkills.tools.map((tool, i) => (
                                        <div key={i} className="p-3 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/10">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold text-sm text-purple-800 dark:text-purple-200">{tool.name}</span>
                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tool.costType?.includes('FREE') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'}`}>{tool.costType || 'N/A'}</span>
                                            </div>
                                            <p className="text-[11px] text-purple-600 dark:text-purple-400">{tool.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {output.aiSkills?.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-purple-50 dark:bg-purple-500/5 p-4 rounded-xl border border-purple-100 dark:border-purple-500/10">
                                <Sparkles size={14} className="inline mr-1 text-purple-500" /> {output.aiSkills.description}
                            </p>
                        )}
                    </div>
                </ReportSection>

                {/* 3. Human Intelligence Skills (15+) */}
                <ReportSection title="Human Intelligence Skills (15+)" icon={Heart} color="from-rose-500 to-pink-500" delay={0.2}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(output.humanIntelligenceSkills || output.humanSkills)?.map((skill, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-semibold text-sm text-slate-800 dark:text-white">{skill.name}</span>
                                        {skill.code && <span className="text-[9px] font-mono bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-300 px-1.5 py-0.5 rounded">{skill.code}</span>}
                                        <PriorityBadge priority={skill.priority} />
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{skill.taskApplication || skill.relevance}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ReportSection>

                {/* 4. Suggested Jobs */}
                <ReportSection title="Jobs You Can Apply For" icon={Briefcase} color="from-emerald-500 to-teal-500" delay={0.25}>
                    <div className="space-y-5">
                        {['entryLevel', 'midLevel', 'seniorLevel', 'lateralOpportunities'].map((level) => {
                            const jobs = output.suggestedJobs?.[level];
                            if (!jobs?.length) return null;
                            const labels = { entryLevel: 'Entry Level', midLevel: 'Mid Level', seniorLevel: 'Senior Level', lateralOpportunities: 'Lateral Opportunities' };
                            const colors = { entryLevel: 'from-emerald-500 to-green-500', midLevel: 'from-blue-500 to-indigo-500', seniorLevel: 'from-purple-500 to-violet-500', lateralOpportunities: 'from-amber-500 to-orange-500' };
                            return (
                                <div key={level}>
                                    <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">{labels[level]}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {jobs.map((job, i) => (
                                            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colors[level]}`} />
                                                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{job.title}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 pl-4">{job.description}</p>
                                                {job.salaryRange && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 pl-4 mt-1 font-semibold">{job.salaryRange}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ReportSection>

                {/* 5. Emerging Jobs */}
                <ReportSection title="Emerging Future Jobs" icon={Zap} color="from-amber-500 to-orange-500" delay={0.3}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {output.emergingJobs?.map((job, i) => (
                            <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/5 dark:to-orange-500/5 border border-amber-200 dark:border-amber-500/20">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-sm text-amber-900 dark:text-amber-200">{job.title}</span>
                                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">{job.growthPotential}</span>
                                </div>
                                <p className="text-xs text-amber-800/70 dark:text-amber-300/60 mb-2">{job.description}</p>
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    <Cpu size={10} className="inline mr-1" /> {job.aiIntegration}
                                </div>
                            </div>
                        ))}
                    </div>
                </ReportSection>

                {/* 6. Career Path Roadmap */}
                <ReportSection title="Career Path Roadmap" icon={TrendingUp} color="from-indigo-500 to-blue-500" delay={0.35}>
                    <div className="relative">
                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 to-pink-500" />
                        <div className="space-y-6">
                            {output.careerPathRoadmap?.map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + i * 0.1 }}
                                    className="flex items-start gap-4 relative"
                                >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-lg shadow-indigo-500/30 z-10">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-sm text-slate-800 dark:text-white">{step.role}</span>
                                            <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">{step.timeline}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </ReportSection>

                {/* 7. Future Scope with AI */}
                <ReportSection title="Future Scope With AI" icon={Sparkles} color="from-violet-500 to-fuchsia-500" delay={0.4}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: 'AI Impact', value: output.futureScope?.aiImpact, icon: Activity, color: 'from-violet-500 to-purple-500' },
                                { label: 'AI Enhancement', value: output.futureScope?.aiEnhancement, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
                                { label: 'Automation Risk', value: output.futureScope?.automationRisk, icon: Shield, color: 'from-amber-500 to-red-500' },
                                { label: 'How to Stay Relevant', value: output.futureScope?.stayRelevantTips, icon: Lightbulb, color: 'from-emerald-500 to-teal-500' },
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} text-white flex items-center justify-center`}>
                                            <item.icon size={14} />
                                        </div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-white">{item.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.value}</p>
                                </div>
                            ))}
                        </div>
                        {output.futureScope?.jobChangeSummary && (
                            <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-500/5 border border-violet-200 dark:border-violet-500/15">
                                <h4 className="text-sm font-bold text-violet-800 dark:text-violet-300 mb-2">🔮 How This Job Changes in the AI Era</h4>
                                <p className="text-xs text-violet-700 dark:text-violet-400 leading-relaxed">{output.futureScope.jobChangeSummary}</p>
                            </div>
                        )}
                        {(output.futureScope?.automatedTasks?.length > 0 || output.futureScope?.humanTasksThatRemain?.length > 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {output.futureScope?.automatedTasks?.length > 0 && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15">
                                        <h4 className="text-sm font-bold text-red-700 dark:text-red-300 mb-3 flex items-center gap-2"><AlertTriangle size={14} /> Tasks Being Automated</h4>
                                        <ul className="space-y-1.5">{output.futureScope.automatedTasks.map((t, i) => <li key={i} className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />{t}</li>)}</ul>
                                    </div>
                                )}
                                {output.futureScope?.humanTasksThatRemain?.length > 0 && (
                                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15">
                                        <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><Lock size={14} /> Human-Only Tasks (AI-Proof)</h4>
                                        <ul className="space-y-1.5">{output.futureScope.humanTasksThatRemain.map((t, i) => <li key={i} className="text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"><span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />{t}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </ReportSection>

                {/* 8. Market Demand */}
                <ReportSection title="Job Market Demand" icon={BarChart3} color="from-cyan-500 to-blue-500" delay={0.45}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Demand Level', value: output.marketDemand?.demandLevel },
                            { label: 'Salary Growth', value: output.marketDemand?.salaryGrowthPrediction },
                            { label: 'Geographic Demand', value: output.marketDemand?.geographicDemand },
                            { label: 'Industry Trends', value: output.marketDemand?.industryTrends },
                        ].map((item, i) => (
                            <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</span>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white mt-1">{item.value || 'N/A'}</p>
                            </div>
                        ))}
                    </div>
                </ReportSection>

                {/* 9. Resource Map */}
                <ReportSection title="Learning Resource Map" icon={BookOpen} color="from-emerald-500 to-green-500" delay={0.5}>
                    <div className="space-y-5">
                        {(output.resourceMap?.freeCourses?.length > 0 || output.resourceMap?.courses?.length > 0) && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">📚 Free Courses & Certifications</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(output.resourceMap.freeCourses || output.resourceMap.courses || []).map((c, i) => <SkillTag key={i} text={c} variant="success" />)}
                                </div>
                            </div>
                        )}
                        {(output.resourceMap?.paidCourses?.length > 0 || output.resourceMap?.certifications?.length > 0) && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">🏆 Paid Certifications</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(output.resourceMap.paidCourses || output.resourceMap.certifications || []).map((c, i) => <SkillTag key={i} text={c} variant="warning" />)}
                                </div>
                            </div>
                        )}
                        {output.resourceMap?.tools?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">🔧 Tools</h4>
                                <div className="flex flex-wrap gap-2">
                                    {output.resourceMap.tools.map((t, i) => <SkillTag key={i} text={t} />)}
                                </div>
                            </div>
                        )}
                        {output.resourceMap?.smaartModules?.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">🎯 SMAART Modules</h4>
                                <div className="flex flex-wrap gap-2">
                                    {output.resourceMap.smaartModules.map((m, i) => <SkillTag key={i} text={m} variant="purple" />)}
                                </div>
                            </div>
                        )}
                        {output.resourceMap?.learningRoadmap && (
                            <div className="mt-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
                                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2">📍 Learning Roadmap</h4>
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{output.resourceMap.learningRoadmap}</p>
                            </div>
                        )}
                    </div>
                </ReportSection>

                {/* 10. Qualifications Needed */}
                {output.qualificationsNeeded?.length > 0 && (
                    <ReportSection title="Qualifications & Degrees" icon={GraduationCap} color="from-teal-500 to-cyan-500" delay={0.52}>
                        <div className="space-y-2">
                            {output.qualificationsNeeded.map((q, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                                    <span className="font-semibold text-sm text-slate-800 dark:text-white">{q.qualification}</span>
                                    {q.relevance && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{q.relevance}</p>}
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                )}

                {/* 11. Data Source Transparency */}
                {output.dataSource && (
                    <ReportSection title="Data Source Intelligence" icon={Database} color="from-slate-500 to-slate-600" delay={0.54}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Role Match', value: output.dataSource.excelRoleMatch, sub: output.dataSource.excelExactMatch ? '✅ Exact' : '🔍 Fuzzy' },
                                { label: 'AI Tools from DB', value: output.dataSource.aiToolsFromDB },
                                { label: 'HI Skills from DB', value: output.dataSource.hiSkillsFromDB },
                                { label: 'Certifications', value: output.dataSource.certificationsFromDB },
                            ].map((item, i) => (
                                <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{item.label}</p>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white">{item.value}</p>
                                    {item.sub && <p className="text-[10px] text-slate-400">{item.sub}</p>}
                                </div>
                            ))}
                        </div>
                    </ReportSection>
                )}

                {/* Previous Reports */}
                {previousReports.length > 1 && (
                    <ReportSection title="Report History" icon={Clock} color="from-slate-500 to-slate-600" delay={0.55}>
                        <div className="space-y-2">
                            {previousReports.map((r, i) => (
                                <button
                                    key={r.id || r._id}
                                    onClick={() => viewReport(r)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${(r.id || r._id) === (report.id || report._id)
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-white">v{r.version}</span>
                                        <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                                            {r.status}
                                        </span>
                                    </div>
                                    <ArrowRight size={14} className="text-slate-400" />
                                </button>
                            ))}
                        </div>
                    </ReportSection>
                )}
            </div>
        );
    };

    // ========== MAIN RENDER ==========
    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <DashboardSidebar />

            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-5xl mx-auto pb-12">

                        {/* Page Header */}
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                                        <Database className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                        <Sparkles size={10} className="text-white" />
                                    </div>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white">
                                    Career Intelligence Agent
                                </h1>
                                <div className="flex gap-2">
                                    {previousReports.length > 0 && (
                                        <div className="relative group/history">
                                            <button
                                                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-500/30 transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
                                                title="Report History"
                                            >
                                                <Clock size={18} />
                                                <span className="text-[10px] font-bold uppercase tracking-tight hidden sm:block">History</span>
                                            </button>
                                            <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl opacity-0 invisible group-hover/history:opacity-100 group-hover/history:visible transition-all z-[60] overflow-hidden">
                                                <div className="p-3 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-4">Your Intelligence History</div>
                                                <div className="max-h-80 overflow-y-auto no-scrollbar">
                                                    {previousReports.map((r, idx) => (
                                                        <button
                                                            key={r._id}
                                                            onClick={() => viewReport(r)}
                                                            className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700 last:border-0 flex items-center gap-3 ${report?._id === r._id ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${r.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600'}`}>
                                                                {idx === 0 ? 'NEW' : previousReports.length - idx}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-700 dark:text-white truncate max-w-[160px]">{r.careerInput?.interestedJobRole || 'Career Report'}</div>
                                                                <div className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString()} • {r.status}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={startNew}
                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-500 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all shadow-sm active:scale-95"
                                        title="Start New Assessment"
                                    >
                                        <Plus size={18} />
                                    </button>
                                    <button
                                        onClick={loadReports}
                                        disabled={loadingReports}
                                        className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        title="Refresh Reports"
                                    >
                                        <RefreshCw size={18} className={loadingReports ? 'animate-spin' : ''} />
                                    </button>
                                    {/* Simulation Engine Toggle */}
                                    <button
                                        onClick={() => setShowSimPanel(prev => !prev)}
                                        className={`p-2 rounded-lg border transition-all shadow-sm active:scale-95 flex items-center gap-1.5 text-xs font-bold ${showSimPanel
                                                ? 'bg-violet-600 border-violet-600 text-white shadow-violet-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-violet-500 hover:border-violet-300 dark:hover:border-violet-500/30'
                                            }`}
                                        title="Career Simulation Engine"
                                    >
                                        <Cpu size={16} />
                                        <span className="hidden sm:block uppercase tracking-tight">Simulate</span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                AI-Powered Career Intelligence Engine — combining structured career data with personalized AI analysis to build your career roadmap
                            </p>
                        </motion.div>

                        {/* Generating Overlay */}
                        <AnimatePresence>
                            {isGenerating && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                                    <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white dark:bg-slate-800 rounded-3xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">
                                        <div className="relative w-24 h-24 mx-auto mb-6">
                                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 animate-spin" style={{ clipPath: 'inset(0 0 50% 0)' }} />
                                            <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center">
                                                <Brain className="w-10 h-10 text-indigo-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generating Career Intelligence</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Analyzing your profile with AI + Excel data engine...</p>
                                        <div className="space-y-3">
                                            {['Mapping career data...', 'Running AI analysis...', 'Merging intelligence...'].map((step, i) => (
                                                <motion.div
                                                    key={step}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 1.5 }}
                                                    className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400"
                                                >
                                                    <Loader2 size={14} className="animate-spin text-indigo-500" />
                                                    {step}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Error Alert */}
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-300 text-sm font-medium">
                                ⚠️ {error}
                            </motion.div>
                        )}

                        {/* Content Area */}
                        {showForm ? (
                            /* ===== FORM VIEW ===== */
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-200/50 dark:shadow-black/30 overflow-hidden">
                                {/* Step Indicator */}
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between max-w-lg mx-auto">
                                        {FORM_STEPS.map((step, i) => {
                                            const StepIcon = step.icon;
                                            const isActive = i === currentStep;
                                            const isCompleted = i < currentStep;
                                            return (
                                                <div key={step.id} className="flex items-center">
                                                    <button
                                                        onClick={() => i <= currentStep && setCurrentStep(i)}
                                                        className={`relative flex flex-col items-center gap-2 transition-all duration-300 ${i <= currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                                                    >
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 scale-110'
                                                            : isCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                            }`}>
                                                            {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                                                            {step.title}
                                                        </span>
                                                    </button>
                                                    {i < FORM_STEPS.length - 1 && (
                                                        <div className={`w-12 lg:w-20 h-0.5 mx-2 rounded-full transition-colors ${i < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="p-8">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{FORM_STEPS[currentStep].title}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{FORM_STEPS[currentStep].description}</p>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {renderFormStep()}
                                    </AnimatePresence>
                                </div>

                                {/* Navigation */}
                                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                    <button
                                        onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                                        disabled={currentStep === 0}
                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${currentStep === 0 ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <ArrowLeft size={16} /> Back
                                    </button>

                                    {report && !showForm && (
                                        <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                                            View Report
                                        </button>
                                    )}

                                    {currentStep < FORM_STEPS.length - 1 ? (
                                        <button
                                            onClick={() => validateStep() && setCurrentStep(currentStep + 1)}
                                            disabled={!validateStep()}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${validateStep()
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02]'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            Next <ArrowRight size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!validateStep() || isGenerating}
                                            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${validateStep() && !isGenerating
                                                ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-[1.02]'
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            {isGenerating ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Brain size={16} /> Generate Career Intelligence</>}
                                        </button>
                                    )}
                                </div>

                                {/* Existing report banner */}
                                {report && (
                                    <div className="px-6 pb-6">
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="w-full p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10 border border-indigo-200 dark:border-indigo-500/20 text-center hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-500/20 dark:hover:to-purple-500/20 transition-all"
                                        >
                                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                                📊 You have a previous Career Intelligence Report — <span className="underline">View it here</span>
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* ===== REPORT VIEW ===== */
                            renderReport()
                        )}

                        {/* ===== SIMULATION ENGINE PANEL ===== */}
                        <AnimatePresence>
                            {showSimPanel && (
                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 24 }}
                                    transition={{ duration: 0.35 }}
                                    className="mt-8 bg-white dark:bg-slate-800/80 rounded-3xl border border-violet-200 dark:border-violet-500/20 shadow-2xl shadow-violet-500/10 overflow-hidden"
                                >
                                    {/* Header */}
                                    <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                                                <Cpu size={24} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black">Career Simulation Engine</h2>
                                                <p className="text-white/70 text-sm mt-0.5">Auto-generate synthetic student career profiles for research & ML datasets</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 space-y-6">
                                        {/* Info Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Excel DB Only', icon: '📊', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20' },
                                                { label: 'Zero AI Cost', icon: '⚡', color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20' },
                                                { label: 'Unique Profiles', icon: '🔀', color: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20' },
                                                { label: 'Bulk MongoDB Insert', icon: '💾', color: 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/20' },
                                                { label: 'ML-Ready Dataset', icon: '🤖', color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20' },
                                            ].map((b, i) => (
                                                <span key={i} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${b.color}`}>
                                                    {b.icon} {b.label}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Count Input + Button */}
                                        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                                            <div className="flex-1">
                                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                                    Simulation Count <span className="text-slate-400 font-normal">(Max 50)</span>
                                                </label>
                                                <div className="relative">
                                                    <Cpu size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-400" />
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        value={simCount}
                                                        onChange={(e) => {
                                                            const v = Math.min(Math.max(parseInt(e.target.value) || 1, 1), 50);
                                                            setSimCount(v);
                                                        }}
                                                        className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-lg font-bold transition-all focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                                        placeholder="50"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1.5">
                                                    Each profile uses a unique combination of role, interest area, and degree. All data is sourced from SMAART Excel database.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleRunSimulation}
                                                disabled={isSimulating}
                                                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-black text-sm transition-all whitespace-nowrap ${isSimulating
                                                        ? 'bg-violet-300 dark:bg-violet-800 text-white cursor-not-allowed'
                                                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-500/30 hover:shadow-2xl hover:scale-[1.03] active:scale-100'
                                                    }`}
                                            >
                                                {isSimulating
                                                    ? <><Loader2 size={18} className="animate-spin" /> Simulating...</>
                                                    : <><Zap size={18} /> Start Simulation</>
                                                }
                                            </button>
                                        </div>

                                        {/* Result Card */}
                                        {simResult && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 16 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-500/10 dark:to-fuchsia-500/10 border border-violet-200 dark:border-violet-500/20 p-5"
                                            >
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                                                        <CheckCircle2 size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-violet-900 dark:text-violet-200">Simulation Complete</h4>
                                                        <p className="text-xs text-violet-600 dark:text-violet-400">Batch ID: {simResult.batchId}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Requested', value: simResult.totalRequested, color: 'text-slate-800 dark:text-white' },
                                                        { label: 'Generated', value: simResult.totalGenerated, color: 'text-emerald-600 dark:text-emerald-400' },
                                                        { label: 'Skipped', value: simResult.skipped, color: 'text-amber-600 dark:text-amber-400' },
                                                        { label: 'Time (s)', value: simResult.executionTimeSeconds, color: 'text-violet-600 dark:text-violet-400' },
                                                    ].map((stat, i) => (
                                                        <div key={i} className="text-center p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-violet-100 dark:border-violet-500/10">
                                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{stat.label}</p>
                                                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {simResult.sampleProfile && (
                                                    <div className="mt-4 p-3 rounded-xl bg-white/60 dark:bg-slate-800/40 border border-violet-100 dark:border-violet-500/10">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Sample Generated Profile</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {[
                                                                simResult.sampleProfile.interestedJobRole,
                                                                simResult.sampleProfile.domain,
                                                                simResult.sampleProfile.areaOfInterest,
                                                                simResult.sampleProfile.degree,
                                                                simResult.sampleProfile.jobSector,
                                                                simResult.sampleProfile.expectedSalaryRange,
                                                            ].filter(Boolean).map((tag, i) => (
                                                                <span key={i} className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-semibold">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}

                                        {/* What gets stored */}
                                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">📦 What gets stored in MongoDB per profile:</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                {[
                                                    'careerInput (goals, education, role, sector)',
                                                    'careerOutput (10-section Excel report)',
                                                    'domain (logically matched to role)',
                                                    'isSimulated: true',
                                                    'simulationBatchId (grouped by batch)',
                                                    'status: completed, version: 1',
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
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

export default CareerDataFetcher;
