import { motion } from 'react';
import {
    Brain, Target, Database, Briefcase, Sparkles,
    TrendingUp, Clock, AlertTriangle, ArrowRight, Loader2, RefreshCw, FileText, Download, Table,
    Code, Cpu, Heart, Activity, Shield, Lightbulb, BookOpen, GraduationCap, Lock, BarChart3, Zap, Award
} from 'lucide-react';

import { CircularProgress, ReportSection, SkillTag, PriorityBadge } from './CareerUIComponents';

const CareerReport = ({
    report, reportRef, startNew, loadReports,
    setShowForm, handleDownloadPDF, handleExportToExcel,
    isExporting, previousReports, viewReport
}) => {
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

export default CareerReport;
