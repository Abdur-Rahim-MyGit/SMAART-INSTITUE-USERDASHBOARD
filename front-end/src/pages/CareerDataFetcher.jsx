import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Database, Brain, Target, GraduationCap, Briefcase, MapPin, DollarSign,
    ArrowRight, ArrowLeft, Loader2, CheckCircle2, Sparkles, TrendingUp,
    BookOpen, Shield, Zap, Users, Award, BarChart3, Download, ChevronDown,
    ChevronUp, RefreshCw, Clock, Star, Lightbulb, Rocket, FileText, Plus,
    Code, Cpu, Heart, Globe, Layers, PieChart, Activity, AlertTriangle, Lock, Table,
    LayoutDashboard, Milestone, CircuitBoard, Gauge, Radio, Compass
} from 'lucide-react';
import careerIntelligenceApi from '@/services/careerIntelligenceApi';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// ========== CONSTANTS ==========
const DEGREE_GROUPS = ['BTech', 'BSc', 'BA', 'BVoc', 'BCom', 'BBA / BMS', 'BCA', 'BDes / BFA', 'LLB', 'BPharm', 'BJM / BMM', 'BHM', 'BSc Nursing', 'BPT', 'BEd', 'BSW', 'BArch', 'Diploma', 'Other'];

const SPECIALISATIONS = {
    'BTech': ['CS / IT', 'Mechanical', 'Civil', 'Electrical', 'ECE', 'Chemical', 'Aerospace', 'Biotech', 'Industrial', 'Environmental', 'Biomedical'],
    'BSc': ['CS / IT / Math / Stats', 'Physics', 'Chemistry', 'Zoology', 'Botany', 'Microbiology', 'Genetics', 'Biochemistry', 'Bioinformatics', 'Nutrition'],
    'BA': ['Economics', 'English', 'History', 'Political Science', 'Sociology', 'Psychology', 'Philosophy', 'Geography'],
    'BVoc': ['Renewable Energy', 'IT', 'Retail', 'Healthcare', 'Tourism', 'Media'],
    'BCom': ['General', 'Accounting & Finance', 'Banking & Insurance', 'Taxation', 'Computer Applications'],
    'BCA': ['General', 'Data Science', 'Cloud Computing', 'Cybersecurity'],
    'BDes / BFA': ['Fashion Design', 'Graphic Design', 'Product Design', 'Interior Design', 'Animation', 'Fine Arts'],
    'LLB': ['Corporate Law', 'Criminal Law', 'Constitutional Law', 'IPR', 'Cyber Law'],
    'BPharm': ['Industrial Pharmacy', 'Pharmacology', 'Clinical Research', 'Drug Regulatory Affairs'],
    'BJM / BMM': ['Journalism', 'Advertising', 'Public Relations', 'Digital Media', 'Broadcast Media'],
    'BArch': ['Urban Design', 'Landscape Architecture', 'Interior Architecture'],
};

const FOUR_YEAR_DEGREES = ['BTech', 'BArch', 'BPharm', 'BSc Nursing', 'MBBS'];

const SECTOR_OPTIONS = [
    'IT & Software', 'BFSI', 'Consulting', 'E-Commerce & Retail', 'Manufacturing',
    'Healthcare & Pharma', 'Education & EdTech', 'Media & Entertainment', 'Government',
    'Telecom', 'FMCG', 'Hospitality & Tourism', 'Logistics', 'Aerospace & Defence',
    'Real Estate', 'Renewable Energy', 'Oil Gas & Energy', 'Agriculture & AgriTech',
    'Sports & Fitness', 'Maritime & Shipping', 'Open to Any'
];

const COMPANY_TYPES = ['STARTUP', 'TRADITIONAL', 'OPEN'];

const INTEREST_OPTIONS = [
    { name: 'Technology', icon: '💻' },
    { name: 'Data & Numbers', icon: '📊' },
    { name: 'People & Communication', icon: '🤝' },
    { name: 'Creativity & Design', icon: '🎨' },
    { name: 'Business & Strategy', icon: '💼' },
    { name: 'Healthcare & Wellbeing', icon: '🏥' },
    { name: 'Law & Policy', icon: '⚖️' },
    { name: 'Science & Research', icon: '🔬' },
    { name: 'Teaching & Education', icon: '🎓' },
    { name: 'Money & Finance', icon: '💰' },
];

const PLACEMENT_TIMELINES = ['Within 6 months', '6 – 12 months', '12 – 24 months', 'Not sure'];

const SUGGESTED_SKILLS = {
    default: ['Communication', 'Problem Solving', 'Critical Thinking', 'Teamwork', 'Time Management', 'Leadership', 'Adaptability', 'Microsoft Office'],
    'BTech': ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'Git', 'Linux', 'React', 'Node.js', 'Machine Learning', 'AWS / Cloud', 'Figma', 'REST APIs'],
    'BSc': ['Python', 'R', 'Statistics', 'MATLAB', 'Data Analysis', 'Research Methodology', 'Excel', 'SPSS', 'Tableau'],
    'BA': ['Research Writing', 'Content Writing', 'Public Speaking', 'Social Media', 'MS Office', 'Data Interpretation', 'SPSS'],
    'BCA': ['Python', 'Java', 'Web Development', 'SQL', 'PHP', 'JavaScript', 'React', 'MySQL', 'Networking'],
    'BCom': ['Tally', 'Excel', 'GST & Taxation', 'Financial Accounting', 'MS Office', 'QuickBooks', 'SAP Basics'],
    'BBA / BMS': ['Business Analysis', 'Marketing', 'Excel', 'PowerPoint', 'CRM Tools', 'Digital Marketing', 'Sales Strategy'],
    'BDes / BFA': ['Figma', 'Adobe Illustrator', 'Photoshop', 'Canva', 'InDesign', 'Sketch', 'UI/UX Design'],
    'BJM / BMM': ['Content Writing', 'Video Editing', 'Premiere Pro', 'Social Media', 'Copywriting', 'SEO', 'Photography'],
    'BPharm': ['Pharmacology', 'Clinical Research', 'Lab Techniques', 'GMP / GLP', 'Medical Writing'],
    'LLB': ['Legal Research', 'Contract Drafting', 'Case Analysis', 'Court Procedures', 'Negotiation'],
};

const DOMAINS = [
    'Web Development', 'Data Science & AI', 'Cybersecurity', 'Cloud Computing & DevOps',
    'Mobile App Development', 'Business Analytics', 'Digital Marketing', 'Software Engineering',
    'IT Support & Networking', 'UI/UX Design', 'Blockchain Technology', 'Internet of Things (IoT)',
    'Embedded Systems', 'Product Management', 'Quality Assurance (Testing)', 'Others'
];

const REPORT_TABS = [
    { id: 'OVERVIEW', label: 'STRATEGIC OVERVIEW', icon: LayoutDashboard, color: 'indigo', description: 'Mission profile & alignment' },
    { id: 'SKILLS', label: 'INTELLIGENCE CORE', icon: Cpu, color: 'purple', description: 'Technical & AI capabilities' },
    { id: 'ROADMAP', label: 'EXECUTION PATH', icon: Milestone, color: 'emerald', description: 'Phased deployment plan' },
    { id: 'MARKET', label: 'MARKET PULSE', icon: Activity, color: 'amber', description: 'Global demand telemetry' },
    { id: 'RESOURCES', label: 'KNOWLEDGE BASE', icon: Zap, color: 'cyan', description: 'Resource & asset mapping' },
];

const FORM_STEPS = [
    { id: 'degree', title: 'Degree', icon: GraduationCap, description: 'Select your degree group' },
    { id: 'year', title: 'Year', icon: Clock, description: 'Year of study' },
    { id: 'roles', title: 'Job Roles', icon: Briefcase, description: 'Your preferred job roles' },
    { id: 'sector', title: 'Sector', icon: Layers, description: 'Preferred industries (optional)' },
    { id: 'goals', title: 'Career Goals', icon: Target, description: 'Your career aspirations' },
    { id: 'interests', title: 'Interests', icon: Sparkles, description: 'What excites you most' },
    { id: 'timeline', title: 'Timeline', icon: Compass, description: 'Placement timeline' },
    { id: 'skills', title: 'Skills', icon: Brain, description: 'Your current skills' },
    { id: 'domain', title: 'Gen Domain', icon: Database, description: 'Confirm generation target' },
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
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600`}
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
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-10 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white appearance-none cursor-pointer transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600`}
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
                className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 transition-all duration-300 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 hover:border-slate-300 dark:hover:border-slate-600 resize-none`}
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
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700`}>
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
        default: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        success: 'bg-slate-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700',
        warning: 'bg-slate-50 dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700',
        purple: 'bg-slate-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-slate-200 dark:border-slate-700',
        rose: 'bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 border-slate-200 dark:border-slate-700',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${variants[variant]} transition-colors hover:bg-slate-100 dark:hover:bg-slate-700`}>
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
    const [isExporting, setIsExporting] = useState(false);
    const [activeReportTab, setActiveReportTab] = useState('OVERVIEW');

    const [formData, setFormData] = useState({
        // Field 1
        degreeGroup: '',
        // Field 2 (conditional)
        specialisation: '',
        // Field 3
        yearOfStudy: '',
        // Field 4
        jobRolePreferences: [],
        // Field 5 (optional)
        sectorPreference: [],
        // Field 6 (optional)
        companyTypePreference: 'OPEN',
        // Field 7
        shortTermGoal: '',
        // Field 8
        longTermGoal: '',
        // Field 9
        interests: [],
        // Field 10
        placementTimeline: '',
        isPriority: false,
        // Field 11
        currentSkills: [],
        // Generation domain
        domain: '',
        domainOther: '',
        // Legacy / compat aliases
        interestedJobRole: '',
    });

    const [skillInput, setSkillInput] = useState('');

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
            case 0: // Degree (required) — specialisation validated if applicable
                if (!formData.degreeGroup) return false;
                if (SPECIALISATIONS[formData.degreeGroup] && !formData.specialisation) return false;
                return true;
            case 1: return !!formData.yearOfStudy;
            case 2: return formData.jobRolePreferences.length >= 1;
            case 3: return true; // sector & company type are optional
            case 4: return formData.shortTermGoal.trim().length > 2 && formData.longTermGoal.trim().length > 2;
            case 5: return formData.interests.length >= 1;
            case 6: return !!formData.placementTimeline;
            case 7: return formData.currentSkills.length >= 1;
            case 8: return formData.domain && (formData.domain !== 'Others' || formData.domainOther.trim().length > 2);
            default: return true;
        }
    };

    const handleSubmit = async () => {
        setIsGenerating(true);
        setError('');
        try {
            // Build submit payload mapping new fields to API-expected keys
            const submitData = {
                ...formData,
                // Map new fields to legacy aliases the backend uses
                degree: formData.degreeGroup,
                specialization: formData.specialisation || null,
                interestedJobRole: formData.jobRolePreferences.join(', '),
                jobSector: formData.sectorPreference.join(', ') || 'Open to Any',
                areaOfInterest: formData.interests.join(', '),
            };

            const data = await careerIntelligenceApi.generateReport(submitData);

            const reportId = data.report?._id || data.report?.id;
            if (reportId) sessionStorage.setItem('generating_report_id', reportId);

            if (data.report?.status === 'completed') {
                setReport(data.report);
                setShowForm(false);
                setPreviousReports(prev => [data.report, ...prev]);
                sessionStorage.removeItem('generating_report_id');
            } else {
                setReport(data.report);
                setShowForm(false);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Generation failed:', err);
            setError(err.message || 'The AI engine is busy. Please try again in a few minutes.');
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
            degreeGroup: '', specialisation: '', yearOfStudy: '',
            jobRolePreferences: [], sectorPreference: [],
            companyTypePreference: 'OPEN',
            shortTermGoal: '', longTermGoal: '',
            interests: [], placementTimeline: '', isPriority: false,
            currentSkills: [], domain: '', domainOther: '',
            interestedJobRole: '',
        });
        setSkillInput('');
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


    // ── Excel Export Handler ──
    const handleExportToExcel = async (params) => {
        setIsExporting(true);
        try {
            const data = await careerIntelligenceApi.exportToExcel(params);
            toast.success(data.message || '✅ Successfully exported to Excel!');
        } catch (err) {
            toast.error(err.message || 'Export failed. Please try again.');
        } finally {
            setIsExporting(false);
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
            pdf.save(`SMAART - Career - Report - ${report.careerInput?.interestedJobRole || 'Intelligence'}.pdf`);

            toast.success("Report downloaded successfully!", { id: toastId });
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Failed to generate PDF. Please try again.", { id: toastId });
        }
    };

    // ========== RENDER FORM STEP ==========
    const renderFormStep = () => {
        switch (currentStep) {
            /* ── STEP 0: Degree Group + Specialisation ── */
            case 0: {
                const specs = SPECIALISATIONS[formData.degreeGroup];
                return (
                    <motion.div key="degree" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Degree Group <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {DEGREE_GROUPS.map(deg => (
                                    <button key={deg} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, degreeGroup: deg, specialisation: '' }))}
                                        className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all duration-200 ${formData.degreeGroup === deg ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        {formData.degreeGroup === deg && <CheckCircle2 size={13} className="inline mr-1 text-indigo-500" />}{deg}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {specs && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Specialisation <span className="text-red-500">*</span> <span className="text-xs font-normal text-slate-400">(Conditional — based on your degree)</span></label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {specs.map(sp => (
                                        <button key={sp} type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, specialisation: sp }))}
                                            className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all duration-200 ${formData.specialisation === sp ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            {formData.specialisation === sp && <CheckCircle2 size={13} className="inline mr-1 text-violet-500" />}{sp}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                );
            }

            /* ── STEP 1: Year of Study ── */
            case 1: {
                const isFour = FOUR_YEAR_DEGREES.includes(formData.degreeGroup);
                const years = isFour ? ['Year 1', 'Year 2', 'Year 3', 'Year 4'] : ['Year 1', 'Year 2', 'Year 3'];
                return (
                    <motion.div key="year" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
                            <GraduationCap size={20} className="text-indigo-500" />
                            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">{formData.degreeGroup}{formData.specialisation ? ` → ${formData.specialisation}` : ''}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Year of Study <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {years.map(yr => (
                                    <button key={yr} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, yearOfStudy: yr }))}
                                        className={`p-6 rounded-2xl border-2 text-center font-bold transition-all duration-200 ${formData.yearOfStudy === yr ? 'border-indigo-500 bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 scale-105' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <div className="text-2xl font-black">{yr.split(' ')[1]}</div>
                                        <div className="text-xs mt-1 opacity-70">{yr}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );
            }

            /* ── STEP 2: Job Role Preferences ── */
            case 2: {
                const addRole = (role) => {
                    if (!role || !role.trim()) return;
                    if (formData.jobRolePreferences.includes(role)) return;
                    if (formData.jobRolePreferences.length >= 5) { toast.error('Maximum 5 roles allowed'); return; }
                    setFormData(prev => ({ ...prev, jobRolePreferences: [...prev.jobRolePreferences, role], interestedJobRole: role }));
                    setRoleSuggestions([]);
                    setIsSearchingRole(false);
                };
                return (
                    <motion.div key="roles" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                            Select <strong>1–5</strong> job roles. Search from our database or type your own and press Enter.
                        </div>
                        <div className="relative">
                            <div className="relative">
                                <Briefcase size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input id="roleSearchInput" type="text"
                                    placeholder="Search role… e.g. Data Analyst, UX Designer"
                                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (val.length > 1) {
                                            const matches = excelData.roles.filter(r => r.toLowerCase().includes(val.toLowerCase())).slice(0, 10);
                                            setRoleSuggestions(matches.length ? matches : [val]);
                                            setIsSearchingRole(true);
                                        } else { setRoleSuggestions([]); setIsSearchingRole(false); }
                                    }}
                                    onKeyDown={e => { if (e.key === 'Enter') { addRole(e.target.value); e.target.value = ''; } }}
                                />
                            </div>
                            {isSearchingRole && roleSuggestions.length > 0 && (
                                <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto no-scrollbar">
                                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">SMAART Role Database</div>
                                    {roleSuggestions.map((s, i) => (
                                        <button key={i} className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-700 last:border-0"
                                            onClick={() => { addRole(s); document.getElementById('roleSearchInput').value = ''; }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {formData.jobRolePreferences.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.jobRolePreferences.map((r, i) => (
                                    <span key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-500/30">
                                        {r}
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, jobRolePreferences: prev.jobRolePreferences.filter((_, j) => j !== i) }))} className="text-indigo-400 hover:text-red-500 transition-colors leading-none">✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-slate-400">{formData.jobRolePreferences.length}/5 roles selected (minimum 1)</p>
                    </motion.div>
                );
            }

            /* ── STEP 3: Sector + Company Type ── */
            case 3:
                return (
                    <motion.div key="sector" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-8">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium">
                            Both fields are <strong>optional</strong> — they boost your career match score, not filter it.
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Sector Preference <span className="text-xs font-normal text-slate-400">(Optional · Max 2)</span></label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                                {SECTOR_OPTIONS.map(s => {
                                    const sel = formData.sectorPreference.includes(s);
                                    return (
                                        <button key={s} type="button"
                                            onClick={() => {
                                                if (sel) {
                                                    setFormData(prev => ({ ...prev, sectorPreference: prev.sectorPreference.filter(x => x !== s) }));
                                                } else if (formData.sectorPreference.length < 2) {
                                                    setFormData(prev => ({ ...prev, sectorPreference: [...prev.sectorPreference, s] }));
                                                } else {
                                                    toast.error('Maximum 2 sectors allowed');
                                                }
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${sel ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                            {sel && <CheckCircle2 size={11} className="inline mr-1 text-emerald-500" />}{s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Company Type Preference <span className="text-xs font-normal text-slate-400">(Optional)</span></label>
                            <div className="flex gap-4">
                                {COMPANY_TYPES.map(ct => (
                                    <button key={ct} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, companyTypePreference: ct }))}
                                        className={`flex-1 py-5 rounded-2xl border-2 font-bold text-sm transition-all duration-200 flex flex-col items-center gap-1 ${formData.companyTypePreference === ct ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-md' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <span className="text-2xl">{ct === 'STARTUP' ? '🚀' : ct === 'TRADITIONAL' ? '🏢' : '🌐'}</span>
                                        <span className="text-xs">{ct}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                );

            /* ── STEP 4: Career Goals ── */
            case 4:
                return (
                    <motion.div key="goals" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <FormTextarea label="Career Goal – Short Term (0–12 months)" name="shortTermGoal" value={formData.shortTermGoal} onChange={handleInputChange} placeholder="e.g., Land my first internship / entry-level role in data analytics by October" required icon={Target} />
                        <FormTextarea label="Career Goal – Long Term (3–5 years)" name="longTermGoal" value={formData.longTermGoal} onChange={handleInputChange} placeholder="e.g., Become a Senior Data Scientist at a product company or start my own AI venture" required icon={Rocket} />
                    </motion.div>
                );

            /* ── STEP 5: Interests ── */
            case 5:
                return (
                    <motion.div key="interests" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                            Select up to <strong>3</strong> interest areas that best describe you. <span className="text-red-400">*</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                            {INTEREST_OPTIONS.map(item => {
                                const sel = formData.interests.includes(item.name);
                                return (
                                    <button key={item.name} type="button"
                                        onClick={() => {
                                            if (sel) {
                                                setFormData(prev => ({ ...prev, interests: prev.interests.filter(x => x !== item.name) }));
                                            } else if (formData.interests.length < 3) {
                                                setFormData(prev => ({ ...prev, interests: [...prev.interests, item.name] }));
                                            } else {
                                                toast.error('Maximum 3 interests allowed');
                                            }
                                        }}
                                        className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition-all duration-200 ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-lg scale-105' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="text-xs font-bold leading-tight">{item.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-slate-400">{formData.interests.length}/3 selected</p>
                    </motion.div>
                );

            /* ── STEP 6: Placement Timeline ── */
            case 6:
                return (
                    <motion.div key="timeline" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {PLACEMENT_TIMELINES.map(tl => {
                                const isPri = tl === 'Within 6 months';
                                const sel = formData.placementTimeline === tl;
                                return (
                                    <button key={tl} type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, placementTimeline: tl, isPriority: isPri }))}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-xl shadow-indigo-500/10 scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-sm font-bold ${sel ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>{tl}</span>
                                            <div className="flex items-center gap-2">
                                                {isPri && <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">⚡ Priority</span>}
                                                {sel && <CheckCircle2 size={16} className="text-indigo-500" />}
                                            </div>
                                        </div>
                                        {isPri && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Your profile will be fast-tracked for skill ranking</p>}
                                    </button>
                                );
                            })}
                        </div>
                        {formData.isPriority && (
                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                                <Zap size={18} className="text-amber-500 flex-shrink-0" />
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">You are marked as a <strong>Priority Candidate</strong> — your skills will be ranked first.</p>
                            </motion.div>
                        )}
                    </motion.div>
                );

            /* ── STEP 7: Current Skills ── */
            case 7: {
                const suggested = [...new Set([...(SUGGESTED_SKILLS[formData.degreeGroup] || []), ...SUGGESTED_SKILLS.default])];
                const addSkill = (sk) => {
                    if (!sk || !sk.trim()) return;
                    if (formData.currentSkills.includes(sk.trim())) return;
                    setFormData(prev => ({ ...prev, currentSkills: [...prev.currentSkills, sk.trim()] }));
                    setSkillInput('');
                };
                return (
                    <motion.div key="skills" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 font-medium">
                            Add skills from the suggestions below, or type any skill (programming language, tool, soft skill, certification) and press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">Enter</kbd> or click Add.
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                                placeholder="e.g. Python, Leadership, AWS, Figma…"
                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm" />
                            <button type="button" onClick={() => addSkill(skillInput)}
                                className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all">Add</button>
                        </div>
                        {formData.currentSkills.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {formData.currentSkills.map((sk, i) => (
                                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-sm font-semibold border border-indigo-200 dark:border-indigo-500/30">
                                        {sk}
                                        <button type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, currentSkills: prev.currentSkills.filter((_, j) => j !== i) }))}
                                            className="text-indigo-400 hover:text-red-500 transition-colors leading-none ml-0.5">✕</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested for {formData.degreeGroup || 'your degree'}</p>
                            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto no-scrollbar">
                                {suggested.filter(sk => !formData.currentSkills.includes(sk)).map((sk, i) => (
                                    <button key={i} type="button" onClick={() => addSkill(sk)}
                                        className="px-3 py-1.5 rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-medium hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all">
                                        + {sk}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">{formData.currentSkills.length} skill{formData.currentSkills.length !== 1 ? 's' : ''} added</p>
                    </motion.div>
                );
            }

            /* ── STEP 8: Generation Domain ── */
            case 8:
                return (
                    <motion.div key="domain" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2">
                                <div className="p-8 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm border border-slate-200 dark:border-slate-700 relative overflow-hidden h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <h3 className="text-2xl font-black mb-4">Confirm Target</h3>
                                        <p className="text-white/80 dark:text-slate-600 text-sm leading-relaxed mb-6">Skills, roadmap &amp; market data will be generated based on this domain.</p>
                                        <div className="mt-auto space-y-3">
                                            <div className="p-3 rounded-2xl bg-black/20 dark:bg-slate-100 border border-white/10 dark:border-slate-200">
                                                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-300 dark:text-indigo-600 mb-1">Target Roles</p>
                                                <p className="text-sm font-bold">{formData.jobRolePreferences.join(', ') || 'Not Selected'}</p>
                                            </div>
                                            {formData.isPriority && (
                                                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 text-xs font-bold text-amber-300 dark:text-amber-700 text-center">⚡ Priority Candidate</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-3 space-y-4">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Which domain should the data be generated from? <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
                                    {DOMAINS.map(domain => (
                                        <button key={domain} type="button" onClick={() => setFormData(prev => ({ ...prev, domain }))}
                                            className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${formData.domain === domain ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-lg' : 'border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:bg-slate-700/30'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold">{domain}</span>
                                                {formData.domain === domain ? <CheckCircle2 size={16} className="text-indigo-500" /> : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                {formData.domain === 'Others' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                        <FormInput label="Specify Custom Domain" name="domainOther" value={formData.domainOther} onChange={handleInputChange} placeholder="e.g., Quantum Computing, Neurotech" icon={Target} required />
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );

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
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 mb-6 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Brain className="w-10 h-10" />
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">Career Intelligence Report</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Version {report.version} • Generated {new Date(report.generatedDate || report.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-3 p-4 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-sm sticky top-4 z-40">
                <button onClick={startNew} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl">
                    <RefreshCw size={16} /> Generate New
                </button>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all shadow-sm">
                    <FileText size={16} /> View Form
                </button>
                <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
                <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl ml-auto">
                    <Download size={16} /> PDF
                </button>
                <button
                    onClick={() => handleExportToExcel({ reportId: report._id || report.id })}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-all shadow-lg shadow-amber-500/30 hover:shadow-xl"
                >
                    {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Table size={16} />}
                    Export to Excel
                </button>
            </div>

            {/* 0. Blueprint Dashboard Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center">
                    <CircularProgress percentage={output.careerMatchPercentage || 85} label="Career Alignment" color="#6366f1" size={140} />
                    <p className="text-xs text-slate-400 mt-4 leading-relaxed max-w-[180px]">Based on your goals and background match to {report.careerInput?.interestedJobRole}</p>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group transition-transform">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                                <Target size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Target Domain</h4>
                                <p className="text-lg font-black text-slate-800 dark:text-white leading-tight">{report.domain || report.careerInput?.domain || 'General'}</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Market Demand</span>
                                <span className="text-emerald-500 font-bold">{output.marketDemand?.demandLevel || 'High'}</span>
                            </div>
                            <div className="w-full h-1.5 bg-indigo-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md group transition-transform">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-purple-500 text-white shadow-lg shadow-purple-500/30">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Skill Gap</h4>
                                <p className="text-xl font-black text-slate-800 dark:text-white">{output.skillGapPercentage || 45}%</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                            "Focus on AI-specific tools to bridge this gap in the next 6 months."
                        </p>
                    </div>

                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-4 shadow-sm">
                        <div className="hidden">
                            <Brain size={120} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">AI Intelligence Tip</h4>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed max-w-lg">
                                Leverage tools like <span className="text-indigo-300 underline decoration-indigo-300/30 underline-offset-4">{output.aiSkills?.tools?.[0]?.name || 'Generative AI'}</span> to enhance your daily workflow in {report.careerInput?.interestedJobRole}.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

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
                                            <span className={`text - [9px] font - bold px - 2 py - 0.5 rounded - full ${tool.costType?.includes('FREE') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'} `}>{tool.costType || 'N/A'}</span>
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
                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold">
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
                                                <div className={`w - 2 h - 2 rounded - full bg - gradient - to - r ${colors[level]} `} />
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
                                <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold shadow-lg shadow-indigo-500/30 z-10">
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
                                    <div className={`w - 8 h - 8 rounded - lg bg - gradient - to - br ${item.color} text - white flex items - center justify - center`}>
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
                                className={`w - full flex items - center justify - between p - 3 rounded - xl border transition - all ${(r.id || r._id) === (report.id || report._id)
                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10'
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                    } `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">v{r.version}</span>
                                    <span className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    <span className={`text - [10px] font - bold px - 2 py - 0.5 rounded - full ${r.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'} `}>
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 transition-colors duration-300">
        <main className="w-full relative py-8 px-4 md:px-0">
                <div className="max-w-5xl mx-auto pb-12">

                    {/* Page Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="relative">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            {/* Step Indicator */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between max-w-2xl mx-auto">
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
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-white shadow-lg shadow-indigo-500/30 scale-110'
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
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100'
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
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-100'
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
                                <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 text-slate-800 dark:text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                                    <div className="relative z-10 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                                            <Cpu size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black">Career Simulation Engine</h2>
                                            <p className="text-slate-500 text-sm mt-0.5">Auto-generate synthetic student career profiles for research & ML datasets</p>
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
                                                    className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-lg font-bold transition-all focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
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
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
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

                                            {/* Bulk Export Button */}
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={() => handleExportToExcel({ batchId: simResult.batchId })}
                                                    disabled={isExporting}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold text-xs transition-all border border-amber-200"
                                                >
                                                    {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                                    Save Entire Batch to AI AGNEENT OUTPUT.xlsx
                                                </button>
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
);
};

export default CareerDataFetcher;
