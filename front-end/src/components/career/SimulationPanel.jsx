import { motion } from 'react';
import { Cpu, Zap, Loader2, CheckCircle2 } from 'lucide-react';

const SimulationPanel = ({
    simCount, setSimCount,
    handleRunSimulation, isSimulating,
    simResult, handleExportToExcel, isExporting
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35 }}
            className="mt-8 bg-white dark:bg-slate-800/80 rounded-3xl border border-violet-200 dark:border-violet-500/20 shadow-2xl shadow-violet-500/10 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-white dark:bg-[#002147] border-b border-slate-200 dark:border-white/8 p-6 text-slate-800 dark:text-white relative overflow-hidden">
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
                                className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#002147] text-slate-800 dark:text-white text-lg font-bold transition-all focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
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
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#002A5C] shadow-sm border border-slate-200 dark:border-white/10 flex items-center justify-center">
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
                <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-slate-700/40 border border-slate-200 dark:border-white/10">
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
    );
};

export default SimulationPanel;
