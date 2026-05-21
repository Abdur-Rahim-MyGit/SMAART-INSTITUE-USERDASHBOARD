import React from "react";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    X,
    Download,
    BarChart2,
    Share2,
    CheckCircle,
    Award,
    MapPin,
    Briefcase,
    Calendar,
    Target
} from "lucide-react";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import spImage from "@/assets/sp.jpeg";

const QUOTIENTS = [
    { id: 'CRQ', label: 'CRQ', desc: 'Cognitive Reasoning Quotient', color: '#a78bfa' },
    { id: 'SRQ', label: 'SRQ', desc: 'Self-Regulation Quotient', color: '#60a5fa' },
    { id: 'LQ', label: 'LQ', desc: 'Learning Quotient (Learning Agility Quotient)', color: '#34d399' },
    { id: 'SIQ', label: 'SIQ', desc: 'Social Intelligence Quotient', color: '#f472b6' },
    { id: 'PEQ', label: 'PEQ', desc: 'Professional Execution Quotient', color: '#fb923c' },
    { id: 'DAQ', label: 'DAQ', desc: 'Digital & AI Quotient', color: '#38bdf8' },
    { id: 'SEQ', label: 'SEQ', desc: 'Sustainability & Ethics Quotient', color: '#4ade80' },
];

const SkillsPassportModal = ({ onClose, currentUser, baselineResult }) => {
    const userName = currentUser?.fullName || "SMAART Minds";
    const identityRef = (currentUser?._id || currentUser?.id || "6933C176").toString().slice(-8).toUpperCase();
    const joinYear = currentUser?.createdAt
        ? new Date(currentUser.createdAt).getFullYear()
        : new Date().getFullYear();
    const stageBand = baselineResult?.stageBand || null;
    const verifiedDate = baselineResult
        ? new Date(baselineResult.createdAt || Date.now()).toLocaleDateString('en-GB').replace(/\//g, '/')
        : new Date().toLocaleDateString('en-GB').replace(/\//g, '/');

    const score = baselineResult?.baselineScore || 0;
    const circumference = 2 * Math.PI * 54;
    const dashOffset = circumference - (score / 100) * circumference;

    const skills = [
        "Lead Generation",
        "CRM Management (HubSpot / Zoho)",
        "Sales Negotiation",
        "Market Research & Competitor Analysis",
        "Client Relationship Management",
        "Communication & Presentation",
        "Proposal & Pitch Deck Creation",
        "Sales Pipeline Tracking",
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md sm:items-center sm:p-6"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 200, damping: 24 }}
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200/70 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_52%,_#eef4ff_100%)] shadow-[0_24px_60px_-36px_rgba(15,23,42,0.24)] dark:border-slate-700/70 dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(15,23,42,0.98)_48%,_rgba(30,41,59,1)_100%)]"
            >
                {/* Decorative glows */}
                <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
                <div className="pointer-events-none absolute bottom-0 left-8 h-32 w-32 rounded-full bg-cyan-100/50 blur-3xl dark:bg-cyan-400/10" />

                <div className="relative px-6 pb-6 pt-10 sm:px-8">
                    <button
                        onClick={onClose}
                        className="absolute left-6 top-6 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:bg-[#002A5C]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Dashboard
                    </button>
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#002A5C] dark:hover:text-slate-300"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="mt-8 text-center sm:mt-4">
                        <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                            Digital Skills Passport
                        </h1>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Verified Career Identity & Competency Credential
                        </p>

                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                            <button
                                onClick={() => baselineResult && generateAssessmentReport(currentUser, baselineResult)}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3884] to-[#4f7cf3] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_16px_-6px_rgba(26,56,132,0.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_20px_-6px_rgba(26,56,132,0.5)]"
                            >
                                <Download className="h-4 w-4" />
                                Export Credential
                            </button>
                            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-[#002A5C]">
                                <BarChart2 className="h-4 w-4" />
                                View Reports
                            </button>
                            <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:bg-white dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-[#002A5C]">
                                <Share2 className="h-4 w-4" />
                                Share Profile
                            </button>
                        </div>
                    </div>
                </div>

                {/* Identity Card */}
                <div className="relative z-10 mx-6 mb-4 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/60 sm:mx-8">
                    <div className="flex flex-col justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center sm:gap-0">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="4" />
                                    <path d="M8 12h8M12 8v8" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-base font-bold text-slate-950 dark:text-slate-50">{userName}</p>
                                <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    VERIFIED
                                </span>
                            </div>
                        </div>
                        <div className="text-left sm:text-right">
                            <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase dark:text-slate-400">Identity Ref</p>
                            <p className="mt-0.5 text-lg font-black tracking-widest text-[#1a3884] dark:text-blue-400">{identityRef}</p>
                        </div>
                    </div>
                </div>

                {/* Main Body */}
                <div className="relative z-10 mx-6 mb-6 overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/60 sm:mx-8">
                    <div className="flex flex-col lg:flex-row">
                        {/* Left Column */}
                        <div className="flex flex-col items-center border-b border-slate-200/80 px-6 py-8 dark:border-slate-700/80 lg:w-[45%] lg:border-b-0 lg:border-r">
                            <div className="relative mb-6 h-32 w-32 sm:h-36 sm:w-36">
                                <div className="absolute inset-0 rounded-full bg-blue-100/50 blur-xl dark:bg-blue-500/20" />
                                <img
                                    src={spImage}
                                    alt="SMAART AI"
                                    className="relative h-full w-full rounded-2xl border-2 border-white object-cover shadow-lg dark:border-white/8"
                                    loading="lazy"
                                />
                            </div>

                            <div className="w-full space-y-3">
                                {stageBand && (
                                    <div className="flex items-center gap-3">
                                        <Award className="h-4 w-4 flex-shrink-0 text-[#1a3884] dark:text-blue-400" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Rank</span>
                                        <span className="ml-auto text-xs font-bold text-slate-900 dark:text-slate-100">{stageBand.toUpperCase()}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 flex-shrink-0 text-[#1a3884] dark:text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Loc</span>
                                    <span className="ml-auto text-xs font-bold text-slate-900 dark:text-slate-100">Remote, Earth</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Briefcase className="h-4 w-4 flex-shrink-0 text-[#1a3884] dark:text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Exp</span>
                                    <span className="ml-auto max-w-[120px] truncate text-xs font-bold text-slate-900 dark:text-slate-100">SMAART Institute</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 flex-shrink-0 text-[#1a3884] dark:text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Join</span>
                                    <span className="ml-auto text-xs font-bold text-slate-900 dark:text-slate-100">{joinYear}</span>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col items-center">
                                <svg width="120" height="120" viewBox="0 0 120 120" className="drop-shadow-sm">
                                    <circle cx="60" cy="60" r="54" fill="none" className="stroke-slate-200 dark:stroke-slate-700" strokeWidth="8" />
                                    <motion.circle
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        className="stroke-[#1a3884] dark:stroke-blue-500"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        initial={{ strokeDashoffset: circumference }}
                                        animate={{ strokeDashoffset: dashOffset }}
                                        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
                                        transform="rotate(-90 60 60)"
                                    />
                                    <text x="60" y="55" textAnchor="middle" fontSize="18" fontWeight="900" className="fill-slate-900 dark:fill-slate-100">{score}%</text>
                                    <text x="60" y="72" textAnchor="middle" fontSize="8" fontWeight="700" className="fill-slate-500 dark:fill-slate-400">SCORE</text>
                                </svg>
                                <p className="mt-2 text-[11px] font-black tracking-widest text-[#1a3884] uppercase dark:text-blue-400">Global Readiness</p>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="px-6 py-8 lg:w-[55%]">
                            <div className="mb-6 flex items-center gap-2.5">
                                <Target className="h-4 w-4 text-[#1a3884] dark:text-blue-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Skill Proficiency</h3>
                            </div>

                            <div className="flex flex-col gap-2.5">
                                {skills.map((skill, i) => (
                                    <motion.div
                                        key={skill}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * i, duration: 0.35 }}
                                        className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/50 dark:text-slate-300"
                                    >
                                        <span>{skill}</span>
                                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1a3884] shadow-[0_0_8px_#1a3884] dark:bg-blue-400 dark:shadow-[0_0_8px_#60a5fa]" />
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-8">
                                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Assessment Quotients</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {QUOTIENTS.map(q => (
                                        <div key={q.id} className="flex items-center gap-3">
                                            <span className="w-10 flex-shrink-0 text-xs font-black" style={{ color: q.color }}>{q.id}</span>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">– {q.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 mx-6 mb-8 flex items-center justify-between rounded-xl border border-slate-200/80 bg-white/60 px-5 py-3 backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/60 sm:mx-8 sm:mb-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Issued by</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">SMAART Minds AI</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-[#1a3884] dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        AI Verified <span className="ml-1 font-medium text-slate-500 dark:text-slate-400">• {verifiedDate}</span>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default SkillsPassportModal;
