import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Brain, Heart, BookOpen, Users, Briefcase, Monitor, Leaf, Download } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { assessmentApi } from "@/services/assessmentApi";
import SkillsPassportSkeleton from "@/components/skeletons/SkillsPassportSkeleton";

const SkillsPassport = () => {
    const [activeTab, setActiveTab] = useState("baseline");
    const [baselineResult, setBaselineResult] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch baseline data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const userStr = localStorage.getItem("user");
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

    // Quotients definition
    const quotientsInfo = [
        { id: 'CRQ', name: "Cognitive Reasoning", icon: Brain, color: "text-purple-600", bar: "bg-purple-600" },
        { id: 'SRQ', name: "Self-regulation & Drive", icon: Heart, color: "text-rose-600", bar: "bg-rose-600" },
        { id: 'LQ', name: "Learning Agility", icon: BookOpen, color: "text-blue-600", bar: "bg-blue-600" },
        { id: 'SIQ', name: "Social Interaction", icon: Users, color: "text-indigo-600", bar: "bg-indigo-600" },
        { id: 'PEQ', name: "Professional Execution", icon: Briefcase, color: "text-emerald-600", bar: "bg-emerald-600" },
        { id: 'DAQ', name: "Digital & AI Literacy", icon: Monitor, color: "text-cyan-600", bar: "bg-cyan-600" },
        { id: 'SEQ', name: "Ethical & Sustainability", icon: Leaf, color: "text-green-600", bar: "bg-green-600" },
    ];

    // Format Scores from Data
    const getScores = (profile) => {
        if (!profile) return { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0, SEQ: 0 };
        return {
            CRQ: profile.CRQ?.rawScore || 0,
            SRQ: profile.SRQ?.rawScore || 0,
            LQ: profile.LQ?.rawScore || 0,
            SIQ: profile.SIQ?.rawScore || 0,
            PEQ: profile.PEQ?.rawScore || 0,
            DAQ: profile.DAQ?.rawScore || 0,
            SEQ: profile.SEQ?.rawScore || 0
        };
    };

    // Data for Tabs
    const testData = {
        baseline: {
            title: "T1 Assessment",
            date: baselineResult ? new Date(baselineResult.createdAt).toLocaleDateString() : "Not Completed",
            scores: getScores(baselineResult?.t1Profile),
            status: baselineResult ? "Completed" : "Pending"
        },
        test2: {
            title: "T2 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0, SEQ: 0 },
            status: "Pending"
        },
        test3: {
            title: "T3 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0, SEQ: 0 },
            status: "Pending"
        },
        test4: {
            title: "T4 Assessment",
            date: "Pending",
            scores: { CRQ: 0, SRQ: 0, LQ: 0, SIQ: 0, PEQ: 0, DAQ: 0, SEQ: 0 },
            status: "Pending"
        }
    };

    const currentData = testData[activeTab];

    return (
        <div className="min-h-screen bg-white flex overflow-hidden font-sans">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8">
                    {isLoading ? (
                        <SkillsPassportSkeleton />
                    ) : (
                        <div className="max-w-5xl mx-auto">
                            <header className="mb-8">
                                <h1 className="text-3xl font-bold text-[#002147]">Skills Passport</h1>
                                <p className="text-slate-500 mt-1">Track your competency growth across assessments.</p>
                            </header>

                            {/* Tabs */}
                            <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-1.5 rounded-xl shadow-sm border border-slate-100 w-fit">
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
                                            ? "bg-[#002147] text-white shadow-md"
                                            : "text-slate-500 hover:text-slate-900 hover:bg-white"
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
                                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">{currentData.title}</h2>
                                        <p className="text-sm text-slate-500 font-medium">
                                            {isLoading ? "Loading status..." : `Completed: ${currentData.date}`}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-3xl font-black text-[#30919D]">
                                            {Math.round(Object.values(currentData.scores).reduce((a, b) => a + b, 0) / 7)}%
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average</div>
                                    </div>
                                </div>

                                {/* Content Layout: Chart + List OR Empty State */}
                                {currentData.status === "Pending" ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center bg-slate-50/50 min-h-[400px]">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                            <Briefcase className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Assessment Not Completed</h3>
                                        <p className="text-slate-500 max-w-md mb-8">
                                            {activeTab === 'baseline'
                                                ? "Complete your T1 Baseline Assessment to unlock your competency profile and see your starting point."
                                                : "This assessment milestone is not yet available. Keep progressing to unlock it."}
                                        </p>
                                        {activeTab === 'baseline' && (
                                            <a
                                                href="/dashboard/assessment/baseline"
                                                className="px-6 py-3 bg-[#002147] text-white rounded-lg font-bold hover:bg-[#002147]/90 transition-colors shadow-lg shadow-[#002147]/20"
                                            >
                                                Start Assessment
                                            </a>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid lg:grid-cols-5 bg-white">
                                        {/* Left: Radar Chart */}
                                        <div className="lg:col-span-2 p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col items-center justify-center bg-slate-50/30">
                                            <div className="relative w-full max-w-[320px] aspect-square">
                                                <RadarChart
                                                    data={quotientsInfo.map(q => ({
                                                        id: q.id,
                                                        value: currentData.scores[q.id] || 0
                                                    }))}
                                                />
                                            </div>
                                            <div className="mt-6 text-center">
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Competency Profile</p>
                                            </div>
                                        </div>

                                        {/* Right: List of Quotients */}
                                        <div className="lg:col-span-3 p-6 md:p-8 space-y-5">
                                            {quotientsInfo.map((q) => {
                                                const score = currentData.scores[q.id] || 0;
                                                const Icon = q.icon;

                                                return (
                                                    <div key={q.id}>
                                                        <div className="flex items-end justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-1.5 rounded-md bg-white border border-slate-100 text-[#30919D] shadow-sm`}>
                                                                    <Icon className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{q.id}</span>
                                                                    <h3 className="text-sm font-bold text-slate-700">{q.name}</h3>
                                                                </div>
                                                            </div>
                                                            <span className="text-base font-bold text-[#002147]">{score}%</span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${score}%` }}
                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                className={`h-full rounded-full ${score > 0 ? 'bg-[#30919D]' : 'bg-slate-200'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Footer Action */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex justify-end">
                                    <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all text-sm shadow-sm">
                                        <Download className="w-4 h-4" />
                                        Download Passport
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
const RadarChart = ({ data }) => {
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const totalAxes = 7;

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
                    stroke="#e2e8f0" // slate-200
                    strokeWidth="1"
                    strokeDasharray={i === 0 ? "none" : "4 4"}
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
                        stroke="#e2e8f0"
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
                fill="rgba(48, 145, 157, 0.15)" // Brand Teal low opacity
                stroke="#30919D"
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
                        fill="#30919D"
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
                        fill="#64748b" // slate-500
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
