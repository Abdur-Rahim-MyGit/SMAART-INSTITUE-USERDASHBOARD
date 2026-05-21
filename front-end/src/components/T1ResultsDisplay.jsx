import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/DashboardHeader";
import { assessmentApi } from "@/services/assessmentApi";
import { CheckCircle2, XCircle, Target, AlertTriangle, Lock, Download, TrendingUp, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";

// Helper function to get band colors and styling
const getBandColor = (level) => {
    const colors = {
        'Advanced': {
            gradient: 'from-purple-500 via-violet-600 to-purple-700',
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            text: 'text-purple-700 dark:text-purple-400',
            badge: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
            bar: 'bg-gradient-to-r from-purple-400 to-violet-600',
            icon: '🏆'
        },
        'Strong': {
            gradient: 'from-emerald-500 via-teal-600 to-emerald-700',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            text: 'text-emerald-700 dark:text-emerald-400',
            badge: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
            bar: 'bg-gradient-to-r from-emerald-400 to-teal-600',
            icon: '💪'
        },
        'Progressing': {
            gradient: 'from-blue-500 via-cyan-600 to-blue-700',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            text: 'text-blue-700 dark:text-blue-400',
            badge: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
            bar: 'bg-gradient-to-r from-blue-400 to-cyan-600',
            icon: '📈'
        },
        'Developing': {
            gradient: 'from-amber-500 via-orange-600 to-amber-700',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            text: 'text-amber-700 dark:text-amber-400',
            badge: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
            bar: 'bg-gradient-to-r from-amber-400 to-orange-600',
            icon: '🌱'
        },
        'Emerging': {
            gradient: 'from-rose-500 via-red-600 to-rose-700',
            bg: 'bg-rose-50 dark:bg-rose-500/10',
            text: 'text-rose-700 dark:text-rose-400',
            badge: 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
            bar: 'bg-gradient-to-r from-rose-400 to-red-600',
            icon: '🌟'
        }
    };
    return colors[level] || colors['Emerging'];
};

// Quotient information
const quotientInfo = {
    CRQ: { name: 'Cognitive Reasoning', fullName: 'Cognitive Reasoning Quotient', icon: '🧠', desc: 'Critical thinking & logical reasoning' },
    SRQ: { name: 'Self-regulation & Drive', fullName: 'Self-regulation & Drive Quotient', icon: '🤝', desc: 'Motivation, resilience & emotional control' },
    LQ: { name: 'Learning Agility', fullName: 'Learning Agility Quotient', icon: '📚', desc: 'Adaptability & continuous learning' },
    SIQ: { name: 'Social Interaction', fullName: 'Social Interaction Quotient', icon: '🎯', desc: 'Collaboration, empathy & communication' },
    PEQ: { name: 'Professional Execution', fullName: 'Professional Execution Quotient', icon: '💪', desc: 'Work ethic, reliability & delivery' },
    DAQ: { name: 'Digital & AI Literacy', fullName: 'Digital & AI Literacy Quotient', icon: '💻', desc: 'Tech proficiency & AI readiness' }
};

// Download report function
const downloadReport = (user, testResults) => {
    const reportData = {
        studentName: user?.fullName || 'Student',
        studentId: user?.studentId || user?.email || 'N/A',
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        baselineScore: testResults?.stageScore ?? testResults?.baselineScore ?? 0,
        stageBand: testResults?.stageBand || 'Emerging',
        quotients: testResults?.quotientProfile || testResults?.t1Profile || {}
    };

    let report = `╔═══════════════════════════════════════════════════════════════════╗\n`;
    report += `║                                                                   ║\n`;
    report += `║          BASELINE ASSESSMENT REPORT - T1 (S_baseline)            ║\n`;
    report += `║                                                                   ║\n`;
    report += `╚═══════════════════════════════════════════════════════════════════╝\n\n`;
    report += `Student Name: ${reportData.studentName}\n`;
    report += `Student ID:   ${reportData.studentId}\n`;
    report += `Date:         ${reportData.date}\n\n`;
    report += `${'═'.repeat(69)}\n`;
    report += `                    BASELINE READINESS INDEX\n`;
    report += `${'═'.repeat(69)}\n\n`;
    report += `                          ${reportData.baselineScore}/100\n`;
    report += `                      [${reportData.stageBand.toUpperCase()}]\n\n`;
    report += `${'═'.repeat(69)}\n`;
    report += `                    QUOTIENT-WISE BREAKDOWN\n`;
    report += `${'═'.repeat(69)}\n\n`;

    Object.entries(reportData.quotients).forEach(([key, data]) => {
        const info = quotientInfo[key];
        report += `┌${'─'.repeat(67)}┐\n`;
        report += `│ ${key} - ${info.fullName.padEnd(60)}│\n`;
        report += `├${'─'.repeat(67)}┤\n`;
        report += `│ ${info.icon} ${info.desc.padEnd(61)}│\n`;
        report += `│                                                                   │\n`;
        report += `│ Score:       ${data.rawScore}%`.padEnd(68) + `│\n`;
        report += `│ Level:       ${data.level}`.padEnd(68) + `│\n`;
        report += `│ Performance: ${data.earned}/${data.possible} questions correct`.padEnd(68) + `│\n`;
        report += `└${'─'.repeat(67)}┘\n\n`;
    });

    report += `${'═'.repeat(69)}\n`;
    report += `                   BAND CLASSIFICATION SYSTEM\n`;
    report += `${'═'.repeat(69)}\n\n`;
    report += `  🏆 Advanced    (81-100%): Exceptional mastery\n`;
    report += `  💪 Strong      (61-80%):  Solid competence\n`;
    report += `  📈 Progressing (41-60%):  Developing skills\n`;
    report += `  🌱 Developing  (21-40%):  Early stage\n`;
    report += `  🌟 Emerging    (0-20%):   Beginning journey\n\n`;
    report += `${'═'.repeat(69)}\n\n`;
    report += `                    "This is your starting profile"\n\n`;
    report += `This baseline assessment (S_baseline) establishes your current readiness\n`;
    report += `across six key quotients. Use this as your foundation for growth and\n`;
    report += `development throughout your learning journey.\n\n`;
    report += `Next Steps:\n`;
    report += `  • Review each quotient's level and identify areas for improvement\n`;
    report += `  • Focus on quotients marked as "Developing" or "Emerging"\n`;
    report += `  • Celebrate your "Strong" and "Advanced" areas\n`;
    report += `  • Track your progress in future assessments (T2, T3, T4)\n\n`;
    report += `${'═'.repeat(69)}\n`;
    report += `Generated by SMAART Institute Assessment System\n`;
    report += `Report ID: T1_${reportData.studentId}_${Date.now()}\n`;
    report += `${'═'.repeat(69)}\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SMAART_Baseline_Report_${reportData.studentId}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('📥 Report downloaded successfully!');
};

// Results Display Component (to replace the existing results section)
const T1ResultsDisplay = ({ testResults, user, navigate }) => {
    const stageBandColors = getBandColor(testResults?.stageBand || 'Emerging');

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-7xl mx-auto py-8 px-4"
        >
            {/* Main Results Card */}
            <div className="bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0B1120] dark:via-[#001229] dark:to-[#0B1120] rounded-[2.5rem] border-2 border-slate-200 dark:border-white/8 shadow-2xl overflow-hidden relative">
                {/* Animated Background */}
                <div className="absolute inset-0 opacity-30 dark:opacity-20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#1a3884]/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                {/* Top Gradient Bar */}
                <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${stageBandColors.gradient}`} />

                {/* Header Section */}
                <div className="relative z-10 p-8 md:p-12 text-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className={`w-32 h-32 bg-gradient-to-br ${stageBandColors.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl relative`}
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-3xl animate-ping" style={{ animationDuration: '2s' }} />
                        <CheckCircle2 className="w-16 h-16 text-white relative z-10" strokeWidth={2.5} />
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                            Baseline Established
                        </h2>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-medium">
                                This is your starting profile
                            </p>
                            <Sparkles className="w-5 h-5 text-amber-500" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                            Your readiness has been analyzed across 6 key quotients. This baseline (S_baseline) is your foundation for growth.
                        </p>
                    </motion.div>
                </div>

                <div className="relative z-10 px-6 md:px-12 pb-12">
                    {/* Baseline Score Card */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className={`relative overflow-hidden bg-gradient-to-br ${stageBandColors.gradient} p-8 md:p-12 rounded-3xl text-center mb-12 max-w-3xl mx-auto shadow-2xl`}
                    >
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Award className="w-8 h-8 text-white/80" />
                                <span className="text-white/90 uppercase tracking-[0.3em] font-bold text-sm">
                                    Baseline Readiness Index
                                </span>
                                <Award className="w-8 h-8 text-white/80" />
                            </div>

                            <div className="flex items-baseline justify-center gap-4 mb-6">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.7, type: "spring", stiffness: 150 }}
                                    className="text-8xl md:text-9xl font-black text-white tracking-tighter drop-shadow-2xl"
                                >
                                    {testResults?.stageScore ?? testResults?.baselineScore ?? 0}
                                </motion.div>
                                <div className="text-left pb-4">
                                    <div className="text-4xl text-white/70 font-bold">/100</div>
                                    <div className="text-sm text-white/60 uppercase tracking-wider">Points</div>
                                </div>
                            </div>

                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.9 }}
                                className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-8 py-4 rounded-2xl border-2 border-white/30"
                            >
                                <span className="text-5xl">{stageBandColors.icon}</span>
                                <div className="text-left">
                                    <div className="text-xs text-white/70 uppercase tracking-wider font-semibold">Stage Band</div>
                                    <div className="text-3xl font-black text-white">{testResults?.stageBand || 'Emerging'}</div>
                                </div>
                            </motion.div>

                            <p className="text-white/80 text-sm mt-6 max-w-xl mx-auto">
                                Average across all quotients • Stored as <span className="font-mono font-bold">S_baseline</span>
                            </p>
                        </div>
                    </motion.div>

                    {/* Quotient Cards Grid */}
                    <div className="mb-12">
                        <motion.h3
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-3xl font-black text-slate-900 dark:text-white text-center mb-8"
                        >
                            Quotient-Wise Breakdown
                        </motion.h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {(testResults?.quotientProfile || testResults?.t1Profile) ? Object.entries(testResults?.quotientProfile || testResults?.t1Profile).map(([quotient, data], index) => {
                                const info = quotientInfo[quotient];
                                const colors = getBandColor(data.level);

                                return (
                                    <motion.div
                                        key={quotient}
                                        initial={{ y: 50, opacity: 0, scale: 0.9 }}
                                        animate={{ y: 0, opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                                        className="group relative bg-white dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-white/8 hover:border-[#1a3884]/50 hover:shadow-2xl hover:shadow-[#1a3884]/10 transition-all duration-300 overflow-hidden"
                                    >
                                        {/* Hover Gradient Effect */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                                        <div className="relative z-10 p-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform`}>
                                                        {info.icon}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{quotient}</span>
                                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{info.name}</h4>
                                                    </div>
                                                </div>
                                                <motion.span
                                                    whileHover={{ scale: 1.05 }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border-2 ${colors.badge}`}
                                                >
                                                    {data.level}
                                                </motion.span>
                                            </div>

                                            {/* Description */}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{info.desc}</p>

                                            {/* Score Display */}
                                            <div className="flex items-end justify-between mb-4">
                                                <div>
                                                    <div className="text-5xl font-black text-slate-900 dark:text-white">
                                                        {data.rawScore}
                                                        <span className="text-2xl text-slate-400 ml-1">%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 mb-1">Performance</div>
                                                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                        {data.earned}/{data.possible} correct
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="relative h-3 w-full bg-slate-100 dark:bg-[#002A5C] rounded-full overflow-hidden">
                                                {/* Threshold markers */}
                                                <div className="absolute left-[20%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                                                <div className="absolute left-[40%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                                                <div className="absolute left-[60%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />
                                                <div className="absolute left-[80%] top-0 bottom-0 w-0.5 bg-white/30 dark:bg-black/20 z-10" />

                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${data.rawScore}%` }}
                                                    transition={{ delay: 0.9 + index * 0.1, duration: 1.2, ease: "easeOut" }}
                                                    className={`h-full ${colors.bar} shadow-lg relative`}
                                                >
                                                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                                </motion.div>
                                            </div>

                                            {/* Band indicator */}
                                            <div className="mt-2 flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                <span>0</span>
                                                <span>20</span>
                                                <span>40</span>
                                                <span>60</span>
                                                <span>80</span>
                                                <span>100</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="col-span-3 text-center py-12">
                                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1a3884] border-t-transparent mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg">Processing your profile...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <button
                            onClick={() => downloadReport(user, testResults)}
                            className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 overflow-hidden w-full sm:w-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Download className="w-5 h-5 relative z-10 group-hover:animate-bounce" />
                            <span className="relative z-10">Download Report</span>
                            <div className="absolute right-0 top-0 w-20 h-20 bg-white/20 rounded-full blur-xl group-hover:scale-150 transition-transform" />
                        </button>

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="group relative px-8 py-4 bg-gradient-to-r from-[#1a3884] to-[#277a84] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#277a84] to-[#1e5f68] opacity-0 group-hover:opacity-100 transition-opacity" />
                            <TrendingUp className="w-5 h-5 relative z-10" />
                            <span className="relative z-10">Go to Dashboard</span>
                        </button>

                        <button
                            onClick={() => navigate("/dashboard/assessment-centre")}
                            className="px-8 py-4 bg-white dark:bg-[#002A5C] text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-[#F8FAFC] dark:hover:bg-[#002A5C] hover:scale-105 transition-all duration-300 border-2 border-slate-200 dark:border-white/10 w-full sm:w-auto"
                        >
                            All Assessments
                        </button>
                    </motion.div>

                    {/* Band Legend */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.7 }}
                        className="mt-12 p-6 bg-[#F8FAFC] dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/8"
                    >
                        <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-4 text-center uppercase tracking-wider">
                            Band Classification System
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {[
                                { level: 'Advanced', range: '81-100%', icon: '🏆' },
                                { level: 'Strong', range: '61-80%', icon: '💪' },
                                { level: 'Progressing', range: '41-60%', icon: '📈' },
                                { level: 'Developing', range: '21-40%', icon: '🌱' },
                                { level: 'Emerging', range: '0-20%', icon: '🌟' }
                            ].map((band) => {
                                const colors = getBandColor(band.level);
                                return (
                                    <div key={band.level} className={`text-center p-3 rounded-xl ${colors.bg} border ${colors.badge.split(' ').pop()}`}>
                                        <div className="text-2xl mb-1">{band.icon}</div>
                                        <div className={`text-xs font-bold ${colors.text}`}>{band.level}</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{band.range}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export { T1ResultsDisplay, downloadReport, getBandColor, quotientInfo };

