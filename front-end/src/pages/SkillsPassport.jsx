import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Heart, BookOpen, Users, Target, Briefcase, Monitor, Leaf, Download, Shield, Share2, BarChart2, MapPin, Calendar, CheckCircle, ArrowLeft, X } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { assessmentApi } from "@/services/assessmentApi";
import SkillsPassportSkeleton from "@/components/skeletons/SkillsPassportSkeleton";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import { toast as sonnerToast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import spImage from "@/assets/sp.jpeg";

const QUOTIENTS = [
    { id: 'CRQ', desc: 'Cognitive Reasoning Quotient', color: '#ffffff' },
    { id: 'SRQ', desc: 'Self-Regulation Quotient', color: '#ffffff' },
    { id: 'LQ', desc: 'Learning Quotient (Learning Agility Quotient)', color: '#ffffff' },
    { id: 'SIQ', desc: 'Social Intelligence Quotient', color: '#ffffff' },
    { id: 'PEQ', desc: 'Professional Execution Quotient', color: '#ffffff' },
    { id: 'DAQ', desc: 'Digital & AI Quotient', color: '#ffffff' },
    { id: 'SEQ', desc: 'Sustainability & Ethics Quotient', color: '#ffffff' },
];

const SKILL_TAGS = [
    "Lead Generation",
    "CRM Management (HubSpot / Zoho)",
    "Sales Negotiation",
    "Market Research & Competitor Analysis",
    "Client Relationship Management",
    "Communication & Presentation",
    "Proposal & Pitch Deck Creation",
    "Sales Pipeline Tracking",
];

const DigitalPassportModal = ({ onClose, user, baselineResult }) => {
    const cardRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);

    const userName = user?.fullName || "SMAART Minds";
    const identityRef = (user?._id || user?.id || "6933C176").toString().slice(-8).toUpperCase();
    const joinYear = user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
    const stageBand = baselineResult?.stageBand || null;
    const location = user?.city ? `${user.city}, ${user.country || 'Earth'}` : (user?.country || "Remote, Earth");
    const institution = user?.institution || user?.college || user?.organization || "SMAART Institute";
    const verifiedDate = baselineResult
        ? new Date(baselineResult.createdAt || Date.now()).toLocaleDateString('en-GB')
        : new Date().toLocaleDateString('en-GB');

    // Ring — derived from baselineScore (0-100). No text shown inside.
    const score = baselineResult?.baselineScore || 0;
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (score / 100) * circumference;

    // Export: capture the card pixel-perfect, excluding buttons
    const handleExport = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);

        // Temporarily hide elements we don't want in the PDF (collapse their space)
        const excluded = cardRef.current.querySelectorAll('[data-pdf-exclude]');
        const prevDisplay = [];
        excluded.forEach((el, i) => {
            prevDisplay[i] = el.style.display;
            el.style.display = 'none';
        });

        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const canvas = await html2canvas(cardRef.current, {
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#060e22',
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();

            // Fit width, centre vertically if shorter than page
            const imgW = pageW;
            const imgH = (canvas.height * pageW) / canvas.width;
            const yOffset = imgH < pageH ? (pageH - imgH) / 2 : 0;

            pdf.addImage(imgData, 'PNG', 0, yOffset, imgW, Math.min(imgH, pageH));
            pdf.save(`DigitalSkillsPassport_${userName.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            // Restore hidden elements
            excluded.forEach((el, i) => { el.style.display = prevDisplay[i]; });
            setIsExporting(false);
        }
    };

    const t1Profile = baselineResult?.t1Profile;

    const getQuotientLevel = (rawScore) => {
        if (rawScore >= 81) return { text: "Expert", color: "#10b981" }; // Green
        if (rawScore >= 61) return { text: "Advanced", color: "#3b82f6" }; // Blue
        if (rawScore >= 31) return { text: "Intermediate", color: "#f59e0b" }; // Yellow
        return { text: "Novice", color: "#ef4444" }; // Red
    };

    const quotientsInfo = [
        { id: 'CRQ', name: "Cognitive Reasoning", icon: Brain, color: "text-purple-600", bar: "bg-purple-600" },
        { id: 'SRQ', name: "Self-Regulation", icon: Users, color: "text-blue-600", bar: "bg-blue-600" },
        { id: 'LQ', name: "Learning Agility", icon: BookOpen, color: "text-indigo-600", bar: "bg-indigo-600" },
        { id: 'SIQ', name: "Social Intelligence", icon: Target, color: "text-rose-600", bar: "bg-rose-600" },
        { id: 'PEQ', name: "Professional Execution", icon: Heart, color: "text-emerald-600", bar: "bg-emerald-600" },
        { id: 'DAQ', name: "Digital & AI", icon: Monitor, color: "text-cyan-600", bar: "bg-cyan-600" },
        { id: 'SEQ', name: "Sustainability & Ethics", icon: Leaf, color: "text-lime-600", bar: "bg-lime-600" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-6"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div className="flex min-h-full items-start justify-center py-8 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 60, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                    onClick={e => e.stopPropagation()}
                    className="relative w-full max-w-2xl rounded-3xl shadow-[0_0_80px_rgba(56,189,248,0.18)]"
                    ref={cardRef}
                    style={{ background: 'linear-gradient(160deg,#0d1b3e 0%,#060e22 60%,#0a1628 100%)', border: '1.5px solid rgba(56,189,248,0.18)' }}
                >
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#38bdf8,#818cf8,transparent)' }} />

                    {/* Header */}
                    <div className="relative px-8 pt-10 pb-6 text-center">
                        <button data-pdf-exclude onClick={onClose} className="absolute top-5 left-5 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg" style={{ color: '#94a3b8', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                        </button>
                        <button data-pdf-exclude onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10" style={{ color: '#64748b' }}>
                            <X className="w-4 h-4" />
                        </button>
                        <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: '#f1f5f9' }}>Digital Skills Passport</h1>
                        <p className="text-sm" style={{ color: '#64748b' }}>Verified Career Identity & Competency Credential</p>
                        {/* Action buttons — physically hidden during PDF capture */}
                        <div data-pdf-exclude className="flex items-center justify-center gap-3 mt-5 flex-wrap">
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#818cf8)', color: '#fff', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? 'Exporting...' : 'Export Credential'}
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}>
                                <BarChart2 className="w-4 h-4" /> View Reports
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' }}>
                                <Share2 className="w-4 h-4" /> Share Profile
                            </button>
                        </div>
                    </div>

                    {/* Identity bar */}
                    <div className="mx-6 mb-4 rounded-2xl px-5 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.12)', border: '1.5px solid rgba(56,189,248,0.3)' }}>
                                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#38bdf8" strokeWidth="1.5" /><path d="M8 12h8M12 8v8" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" /></svg>
                            </div>
                            <div>
                                <p className="font-bold text-sm" style={{ color: '#f1f5f9' }}>{userName}</p>
                                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#10b981' }}><CheckCircle className="w-3 h-3" />VERIFIED</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#38bdf8', opacity: 0.7 }}>Identity Ref</p>
                            <p className="text-lg font-black tracking-widest" style={{ color: '#38bdf8' }}>{identityRef}</p>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="mx-6 mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        {baselineResult ? (
                            <div className="flex flex-col md:flex-row">
                                {/* Left */}
                                <div className="md:w-[42%] flex flex-col items-center px-5 py-5 border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                                    <div className="relative w-32 h-32 mb-4">
                                        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(circle,rgba(56,189,248,0.15) 0%,transparent 75%)' }} />
                                        <img src={spImage} alt="SMAART AI" className="w-full h-full object-cover rounded-2xl" style={{ border: '2px solid rgba(56,189,248,0.25)' }} />
                                    </div>
                                    <div className="w-full space-y-2 mb-4">
                                        {stageBand && <div className="flex items-center gap-2"><Target className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Rank</span><span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{stageBand.toUpperCase()}</span></div>}
                                        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Loc</span><span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{user?.location || 'Remote, Earth'}</span></div>
                                        <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Exp</span><span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{user?.experience || 'SMAART Institute'}</span></div>
                                        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#818cf8' }} /><span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#64748b' }}>Join</span><span className="ml-auto text-xs font-bold" style={{ color: '#e2e8f0' }}>{joinYear}</span></div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <svg width="110" height="110" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(56,189,248,0.1)" strokeWidth="10" />
                                            <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#rg)" strokeWidth="10" strokeLinecap="round"
                                                strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 1.5, ease: 'easeOut' }} transform="rotate(-90 60 60)" />
                                            <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#818cf8" /></linearGradient></defs>
                                        </svg>
                                        <p className="text-xs font-bold tracking-widest uppercase mt-2" style={{ color: '#38bdf8' }}>Global Readiness</p>
                                    </div>
                                </div>
                                {/* Right — skill proficiency with real progress bars */}
                                <div className="md:w-[58%] px-5 py-5 flex flex-col">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Target className="w-4 h-4 flex-shrink-0" style={{ color: '#38bdf8' }} />
                                        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#e2e8f0' }}>Skill Proficiency</h3>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        {t1Profile && quotientsInfo.map((q, i) => {
                                            const quotientData = t1Profile[q.id];
                                            if (!quotientData) return null;
                                            const { text: levelText, color: levelClr } = getQuotientLevel(quotientData.rawScore);
                                            return (
                                                <motion.div
                                                    key={q.id}
                                                    initial={{ opacity: 0, x: 16 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 * i }}
                                                    className="flex flex-col gap-1"
                                                >
                                                    {/* Row header */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-semibold" style={{ color: '#cbd5e1' }}>
                                                            {q.name}
                                                            <span className="ml-1 font-bold" style={{ color: '#94a3b8' }}>({quotientData.rawScore}%)</span>
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                                                            style={{ background: `${levelClr}22`, color: levelClr, border: `1px solid ${levelClr}55` }}
                                                        >
                                                            {levelText}
                                                        </span>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ background: `linear-gradient(90deg, ${levelClr}cc, ${levelClr})` }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${quotientData.rawScore}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut', delay: 0.1 + 0.06 * i }}
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                                <Shield className="w-12 h-12 mb-4" style={{ color: '#64748b' }} />
                                <p className="text-lg font-semibold mb-2" style={{ color: '#f1f5f9' }}>Assessment Not Yet Completed</p>
                                <p className="text-sm" style={{ color: '#94a3b8' }}>Please complete your baseline assessment to view your Digital Skills Passport.</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mx-6 mb-6 rounded-2xl flex items-center justify-between px-5 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#475569' }}>Issued by</span>
                            <span className="text-sm font-bold" style={{ color: '#94a3b8' }}>SMAART Minds AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#38bdf8' }} />
                            <span className="text-xs font-bold" style={{ color: '#38bdf8' }}>AI Verified</span>
                            <span className="text-xs" style={{ color: '#475569' }}>• {verifiedDate}</span>
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg,transparent,rgba(56,189,248,0.3),transparent)' }} />
                </motion.div>
            </div>
        </motion.div>
    );
};

const SkillsPassport = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState("baseline");
    const [baselineResult, setBaselineResult] = useState(null);
    const [stageResults, setStageResults] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showPassport, setShowPassport] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
            try { setCurrentUser(JSON.parse(userStr)); } catch { }
        }
    }, []);

    // Fetch baseline + all stage results in parallel
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const userId = user._id || user.id;
                    if (userId) {
                        // Fetch both sets of results in parallel
                        const [baselineRes, stageRes] = await Promise.allSettled([
                            assessmentApi.getBaseLineResults(userId),
                            assessmentApi.getStageResults(userId),
                        ]);

                        if (baselineRes.status === 'fulfilled' && baselineRes.value?.success) {
                            setBaselineResult(baselineRes.value.data);
                        }
                        if (stageRes.status === 'fulfilled' && stageRes.value?.success) {
                            setStageResults(stageRes.value.data || {});
                        }
                    }
                }
            } catch (err) {
                console.error('Skills Passport fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Quotients definition (Aligned with Backend/T1ResultsDisplay)
    const quotientsInfo = [
        { id: 'CRQ', name: "Cognitive Reasoning", icon: Brain, color: "text-purple-600", bar: "bg-purple-600" },
        { id: 'SRQ', name: "Self-regulation & Drive", icon: Heart, color: "text-blue-600", bar: "bg-blue-600" },
        { id: 'LQ', name: "Learning Agility", icon: BookOpen, color: "text-indigo-600", bar: "bg-indigo-600" },
        { id: 'SIQ', name: "Social Interaction", icon: Users, color: "text-rose-600", bar: "bg-rose-600" },
        { id: 'PEQ', name: "Professional Execution", icon: Briefcase, color: "text-emerald-600", bar: "bg-emerald-600" },
        { id: 'DAQ', name: "Digital & AI Literacy", icon: Monitor, color: "text-cyan-600", bar: "bg-cyan-600" },
    ];

    // Helper: extract 6-quotient scores from a quotientProfile object
    const getScores = (profile) => {
        if (!profile) return { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 };
        return {
            CRQ: profile.CRQ?.rawScore ?? profile.CRQ?.percentage ?? 0,
            SRQ: profile.SRQ?.rawScore ?? profile.SRQ?.percentage ?? 0,
            LQ: profile.LQ?.rawScore ?? profile.LQ?.percentage ?? 0,
            SIQ: profile.SIQ?.rawScore ?? profile.SIQ?.percentage ?? 0,
            PEQ: profile.PEQ?.rawScore ?? profile.PEQ?.percentage ?? 0,
            DAQ: profile.DAQ?.rawScore ?? profile.DAQ?.percentage ?? 0,
        };
    };

    // Helper: build a tab data object from a stage result or return a "Pending" placeholder
    const buildTabData = (title, stageKey, fallbackResult = null) => {
        const r = stageResults[stageKey] || fallbackResult;
        if (!r) {
            return { title, date: 'Pending', scores: getScores(null), status: 'Pending', average: 0, result: null };
        }
        return {
            title,
            date: r.completedAt ? new Date(r.completedAt).toLocaleDateString() : 'Completed',
            scores: getScores(r.quotientProfile),
            status: 'Completed',
            average: Math.round(r.stageScore || r.percentage || 0),
            stageBand: r.stageBand,
            result: r,
        };
    };

    // Data for Tabs
    const testData = {
        baseline: baselineResult
            ? {
                title: 'T1 Assessment',
                date: new Date(baselineResult.createdAt).toLocaleDateString(),
                scores: getScores(baselineResult.t1Profile),
                status: 'Completed',
                average: Math.round(baselineResult.baselineScore || 0),
                stageBand: baselineResult.stageBand,
                result: baselineResult,
            }
            : { title: 'T1 Assessment', date: 'Pending', scores: getScores(null), status: 'Pending', average: 0, result: null },
        test2: buildTabData('T2 Assessment', 'T2'),
        test3: buildTabData('T3 Assessment', 'T3'),
        test4: buildTabData('T4 Assessment', 'T4'),
    };

    const currentData = testData[activeTab];

    const handleDownloadReport = () => {
        const currentData = testData[activeTab];
        if (!currentData.result) {
            sonnerToast.error("Please complete this assessment to download your report.");
            return;
        }

        try {
            const userStr = sessionStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                generateAssessmentReport(user, currentData.result);
            }
        } catch (error) {
            console.error("Error generating report:", error);
            sonnerToast.error("Failed to generate report. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors duration-300">
            <DashboardSidebar />

            <div className="relative">
                <main className="w-full py-8 px-4 md:px-8">
                    {isLoading ? (
                        <SkillsPassportSkeleton />
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            <header className="mb-8">
                                <h1 className="text-3xl font-bold text-[#002147] dark:text-white">Skills Passport</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1.5">Track your competency growth across assessments.</p>
                            </header>

                            {/* Tabs + Skills Passport button */}
                            <div className="flex items-center gap-3 mb-8 flex-wrap">
                                <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                                    {[
                                        { id: "baseline", label: "Baseline Test" },
                                        { id: "test2", label: "Test 2" },
                                        { id: "test3", label: "Test 3" },
                                        { id: "test4", label: "Test 4" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                                                ? "bg-[#002147] dark:bg-blue-600 text-white shadow-md shadow-[#002147]/10 dark:shadow-blue-900/20"
                                                : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                                                }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Skills Passport button – sits right next to Test 4 */}
                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: '0 6px 28px rgba(56,189,248,0.28)' }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setShowPassport(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                                    style={{
                                        background: 'linear-gradient(135deg,#1e3a78,#0f2861)',
                                        color: '#38bdf8',
                                        border: '1.5px solid rgba(56,189,248,0.38)',
                                        boxShadow: '0 3px 14px rgba(56,189,248,0.14)'
                                    }}
                                >
                                    <Shield className="w-4 h-4" />
                                    Skills Passport
                                </motion.button>
                            </div>

                            {/* Content Card */}
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 dark:text-white font-sans">{currentData.title}</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium font-sans">
                                            {isLoading ? "Loading status..." : currentData.status === 'Completed' ? `Completed: ${currentData.date}` : 'Completed: Pending'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-[#1a3884]">
                                            {currentData.average}%
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Average</div>
                                        {currentData.stageBand && (
                                            <div className="text-xs font-semibold text-blue-500 dark:text-blue-400 mt-0.5 uppercase tracking-wide">
                                                {currentData.stageBand}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Layout: Chart + List OR Empty State */}
                                {currentData.status === "Pending" ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 min-h-[400px]">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                            <Briefcase className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Assessment Not Completed</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                                            {activeTab === 'baseline'
                                                ? "Complete your T1 Baseline Assessment to unlock your competency profile and see your starting point."
                                                : "This assessment milestone is not yet available. Keep progressing to unlock it."}
                                        </p>
                                        {activeTab === 'baseline' && (
                                            <a
                                                href="/dashboard/assessments/baseline"
                                                className="px-6 py-3 bg-[#002147] text-white rounded-lg font-bold hover:bg-[#002147]/90 transition-colors shadow-lg shadow-[#002147]/20"
                                            >
                                                Start Assessment
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid lg:grid-cols-5 bg-white dark:bg-slate-800">
                                        {/* Left: Radar Chart */}
                                        <div className="lg:col-span-2 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-900/20">
                                            <div className="relative w-full max-w-[320px] aspect-square">
                                                <RadarChart
                                                    data={quotientsInfo.map(q => ({
                                                        id: q.id,
                                                        value: currentData.scores[q.id] || 0
                                                    }))}
                                                    theme={theme}
                                                />
                                            </div>
                                            <div className="mt-6 text-center">
                                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Competency Profile</p>
                                            </div>
                                        </div>

                                        {/* Right: List of Quotients */}
                                        <div className="lg:col-span-3 p-6 md:p-8 space-y-6 bg-white dark:bg-slate-800 transition-colors">
                                            {quotientsInfo.map((q) => {
                                                const score = currentData.scores[q.id] || 0;
                                                const Icon = q.icon;

                                                return (
                                                    <div key={q.id}>
                                                        <div className="flex items-end justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-1.5 rounded-md bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-[#1a3884] shadow-sm`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{q.id}</span>
                                                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{q.name}</h3>
                                                                </div>
                                                            </div>
                                                            <span className="text-base font-bold text-[#002147] dark:text-blue-400">{score}%</span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${score}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={`h-full rounded-full ${score > 0 ? 'bg-gradient-to-r from-[#1a3884] to-blue-500' : 'bg-slate-200 dark:bg-slate-600'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Action */}
                                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30 flex justify-end">
                                    <button
                                        onClick={handleDownloadReport}
                                        disabled={currentData.status === "Pending"}
                                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm ${currentData.status === "Pending"
                                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                                            : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                                            }`}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download AI Report
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </main>
            </div>

            {/* Digital Skills Passport modal */}
            <AnimatePresence>
                {showPassport && (
                    <DigitalPassportModal
                        onClose={() => setShowPassport(false)}
                        user={currentUser}
                        baselineResult={baselineResult}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper Component for Radar Chart
const RadarChart = ({ data, theme }) => {
    const isDark = theme === 'dark';
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const totalAxes = 6;

    // Calculate point coordinates
    const getPoint = (value, index, maxRadius) => {
        const angle = (Math.PI * 2 * index) / totalAxes - Math.PI / 2;
        const dist = (value / 100) * maxRadius;
        return {
            x: center + dist * Math.cos(angle),
            y: center + dist * Math.sin(angle)
        };
    };

    // Generate path string for a polygon
    const getPath = (values, maxRadius) => {
        return values.map((v, i) => {
            const point = getPoint(v, i, maxRadius);
            return `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
        }).join(' ') + ' Z';
    };

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full drop-shadow-sm">
            {/* Background Grids (Concentric Heptagons) */}
            {[100, 75, 50, 25].map((pct, i) => (
                <path
                    key={i}
                    d={getPath(Array(totalAxes).fill(pct), radius)}
                    fill="none"
                    stroke={isDark ? "currentColor" : "#e2e8f0"} // slate-200
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "4 4"}
                    className={isDark ? "text-slate-700" : ""}
                />
            ))}

            {/* Axes Lines */}
            {Array.from({ length: totalAxes }).map((_, i) => {
                const point = getPoint(100, i, radius);
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={point.x}
                        y2={point.y}
                        stroke={isDark ? "currentColor" : "#e2e8f0"}
                        className={isDark ? "text-slate-700" : ""}
                        strokeWidth="1"
                    />
                );
            })}

            {/* Data Polygon */}
            <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={getPath(data.map(d => d.value), radius)}
                fill="rgba(26, 56, 132, 0.15)" // Brand Teal low opacity
                stroke="#1a3884"
                strokeWidth="2"
            />

            {/* Data Points */}
            {data.map((d, i) => {
                const point = getPoint(d.value, i, radius);
                return (
                    <motion.circle
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        cx={point.x}
                        cy={point.y}
                        r="3.5"
                        fill="#1a3884"
                        stroke="white"
                        strokeWidth="2"
                    />
                );
            })}

            {/* Labels */}
            {data.map((d, i) => {
                const point = getPoint(125, i, radius); // Push labels out slightly
                return (
                    <text
                        key={i}
                        x={point.x}
                        y={point.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill={isDark ? "#94a3b8" : "#64748b"} // slate-400 : slate-500
                        className="uppercase"
                    >
                        {d.id}
                    </text>
                );
            })}
        </svg>
    );
};

export default SkillsPassport;


