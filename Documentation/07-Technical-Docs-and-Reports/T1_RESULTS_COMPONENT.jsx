{/* T1 BASELINE RESULTS - FINAL MINDS THEME */ }
<motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="max-w-[1400px] mx-auto py-8 px-4"
>
    {/* Main Results Card */}
    <div className="lms-card p-8 md:p-12 relative overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#30919D]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: '1s' }} />

        {/* Top Gradient Bar */}
        <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${getBandColor(testResults?.stageBand || 'Emerging').gradient}`} />

        {/* Header Section */}
        <div className="relative z-10 text-center mb-12">
            <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className={`w-32 h-32 bg-gradient-to-br ${getBandColor(testResults?.stageBand || 'Emerging').gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ${getBandColor(testResults?.stageBand || 'Emerging').glow} relative`}
            >
                <div className="absolute inset-0 bg-white/20 rounded-3xl animate-ping" style={{ animationDuration: '2s' }} />
                <CheckCircle2 className="w-16 h-16 text-white relative z-10" strokeWidth={2.5} />
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-5xl md:text-6xl font-black text-[#002147] dark:text-white mb-4 tracking-tight">
                    Baseline Established
                </h2>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#daa520]" />
                    <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 font-semibold">
                        This is your starting profile
                    </p>
                    <Sparkles className="w-5 h-5 text-[#daa520]" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    Your readiness has been analyzed across 6 key quotients. This baseline (S_baseline) is your foundation for growth.
                </p>
            </motion.div>
        </div>

        {/* Baseline Score Card */}
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`relative overflow-hidden bg-gradient-to-br ${getBandColor(testResults?.stageBand || 'Emerging').gradient} p-8 md:p-12 rounded-3xl text-center mb-12 max-w-3xl mx-auto shadow-2xl ${getBandColor(testResults?.stageBand || 'Emerging').glow}`}
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
                        {testResults?.baselineScore || 0}
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
                    <span className="text-5xl">{getBandColor(testResults?.stageBand || 'Emerging').icon}</span>
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
        <div className="mb-12 relative z-10">
            <motion.h3
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-3xl font-black text-[#002147] dark:text-white text-center mb-8"
            >
                Quotient-Wise Breakdown
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testResults?.t1Profile ? Object.entries(testResults.t1Profile).map(([quotient, data], index) => {
                    const info = quotientInfo[quotient];
                    const colors = getBandColor(data.level);

                    return (
                        <motion.div
                            key={quotient}
                            initial={{ y: 50, opacity: 0, scale: 0.9 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.1, type: "spring" }}
                            className="group relative lms-card p-6 hover:border-[#30919D]/50 hover:shadow-2xl hover:shadow-[#30919D]/10 transition-all duration-300 overflow-hidden"
                        >
                            {/* Hover Gradient Effect */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-3xl shadow-lg transform group-hover:scale-110 transition-transform`}>
                                            {info.icon}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{quotient}</span>
                                            <h4 className="text-sm font-bold text-[#002147] dark:text-white leading-tight">{info.name}</h4>
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
                                        <div className="text-5xl font-black text-[#002147] dark:text-white">
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
                                <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
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
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#30919D] border-t-transparent mx-auto mb-4" />
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
            className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10"
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
                className="group relative px-8 py-4 bg-gradient-to-r from-[#30919D] to-[#277a84] text-white rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 w-full sm:w-auto overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-[#277a84] to-[#1e5f68] opacity-0 group-hover:opacity-100 transition-opacity" />
                <TrendingUp className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Go to Dashboard</span>
            </button>

            <button
                onClick={() => navigate("/dashboard/assessments")}
                className="px-8 py-4 bg-white dark:bg-slate-800 text-[#002147] dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 border-2 border-slate-200 dark:border-slate-700 w-full sm:w-auto"
            >
                All Assessments
            </button>
        </motion.div>

        {/* Band Legend */}
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.7 }}
            className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 relative z-10"
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
                        <div key={band.level} className={`text-center p-3 rounded-xl ${colors.bg} border-2 ${colors.badge.split(' ').pop()}`}>
                            <div className="text-2xl mb-1">{band.icon}</div>
                            <div className={`text-xs font-bold ${colors.text}`}>{band.level}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{band.range}</div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    </div>
</motion.div>
