import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, BookOpen, Users, Target, Briefcase, Monitor, Leaf, Download } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { assessmentApi } from "@/services/assessmentApi";
import SkillsPassportSkeleton from "@/components/skeletons/SkillsPassportSkeleton";
import { generateAssessmentReport } from "@/utils/reportGenerator";
import { toast as sonnerToast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

const SkillsPassport = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState("baseline");
    const [baselineResult, setBaselineResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch baseline data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = sessionStorage.getItem("user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const userId = user._id || user.id;
                    if (userId) {
                        const response = await assessmentApi.getBaseLineResults(userId);
                        if (response && response.success) {
                            setBaselineResult(response.data);
                        }
                    }
                }
            } catch (err) {
                // Squelch error to prevent console crash
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

    // Format Scores from Data
    const getScores = (profile) => {
        if (!profile) return { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 };
        return {
            CRQ: profile.CRQ?.rawScore || 0,
            SRQ: profile.SRQ?.rawScore || 0,
            LQ: profile.LQ?.rawScore || 0,
            SIQ: profile.SIQ?.rawScore || 0,
            PEQ: profile.PEQ?.rawScore || 0,
            DAQ: profile.DAQ?.rawScore || 0
        };
    };

    // Data for Tabs
    const testData = {
        baseline: {
            title: "T1 Assessment",
            date: baselineResult ? new Date(baselineResult.createdAt).toLocaleDateString() : "Not Completed",
            scores: getScores(baselineResult?.t1Profile),
            status: baselineResult ? "Completed" : "Pending",
            average: baselineResult?.baselineScore || 0
        },
        test2: {
            title: "T2 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 },
            status: "Pending",
            average: 0
        },
        test3: {
            title: "T3 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 },
            status: "Pending",
            average: 0
        },
        test4: {
            title: "T4 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0 },
            status: "Pending",
            average: 0
        }
    };

    const currentData = testData[activeTab];

    const handleDownloadReport = () => {
        if (!baselineResult) {
            sonnerToast.error("Please complete the assessment to download your report.");
            return;
        }

        try {
            const userStr = sessionStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                generateAssessmentReport(user, baselineResult);
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

                            {/* Tabs */}
                            <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-fit transition-colors">
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
                                            {isLoading ? "Loading status..." : `Completed: ${currentData.date}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-[#1a3884]">
                                            {currentData.average}%
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Average</div>
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


