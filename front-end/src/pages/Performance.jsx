import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
    TrendingUp,
    Activity,
    Award,
    Clock,
    BookOpen,
    CheckCircle2,
    BarChart2,
    PieChart,
    Calendar,
    ArrowUpRight,
    Target
} from "lucide-react";
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from "recharts";
import useUser from "@/hooks/useUser";
import { apiCall } from '@/services/api';

const Performance = () => {
    const navigate = useNavigate();
    const { user, loading: userLoading } = useUser();
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState([]);
    const [baseline, setBaseline] = useState(null);
    const [activityData, setActivityData] = useState([]);
    const [stats, setStats] = useState({
        totalLearningHours: 0,
        coursesCompleted: 0,
        avgScore: 0,
        certificatesEarned: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            if (userLoading) return;
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const userId = user.id || user._id;

                // Fetch Enrollments
                const enrollData = await apiCall(`/courseEnrollments/student/${userId}`);
                const courses = Array.isArray(enrollData.data) ? enrollData.data : (Array.isArray(enrollData) ? enrollData : []);
                setEnrollments(courses);

                // Fetch Baseline
                let baseData = null;
                try {
                    baseData = await apiCall(`/baselineresults/user/${userId}`);
                    setBaseline(baseData);
                } catch (e) {
                    // Ignore baseline fetch error (404 etc)
                    console.warn("Baseline not found or error", e);
                }

                // Calculate Stats
                let totalHours = 0;
                let completed = 0;
                let scoreSum = 0;
                let scoreCount = 0;

                courses.forEach(c => {
                    // precise time calculation
                    if (typeof c.totalTimeSpent === 'number' && c.totalTimeSpent > 0) {
                        totalHours += c.totalTimeSpent / 60;
                    } else if (c.moduleProgress && Array.isArray(c.moduleProgress)) {
                        c.moduleProgress.forEach(m => {
                            if (m.status === 'completed') {
                                totalHours += 2;
                            } else if (m.videoProgress && Array.isArray(m.videoProgress)) {
                                const vids = m.videoProgress.filter(v => v.isCompleted).length;
                                totalHours += (vids * 15) / 60;
                            }
                        });
                    }

                    if (c.status === 'completed' || c.progress === 100) completed++;
                    if (c.overallScore) {
                        scoreSum += c.overallScore;
                        scoreCount++;
                    }
                });

                setStats({
                    totalLearningHours: Math.round(totalHours),
                    coursesCompleted: completed,
                    avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
                    certificatesEarned: completed
                });

            } catch (err) {
                console.error("Error fetching performance data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, userLoading]);

    // Streak chart useEffect — moved above early return to satisfy Rules of Hooks
    useEffect(() => {
        const fetchStreakAndBuildChart = async () => {
            try {
                const res = await apiCall('/avatar/streak-status');
                if (res.success) {
                    const { cycleDay, isActive } = res.data;
                    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const today = new Date();
                    const chartData = [];
                    for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(today.getDate() - i);
                        const dayName = days[d.getDay()];
                        const daysAgo = i;
                        const hours = (isActive && daysAgo < cycleDay) ? 2.5 : 0;
                        chartData.push({ name: dayName, hours, date: d.toLocaleDateString() });
                    }
                    setActivityData(chartData);
                }
            } catch (error) {
                console.error('Failed to fetch streak for chart', error);
            }
        };
        fetchStreakAndBuildChart();
    }, []);

    if (loading || userLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8F9FC] dark:bg-dark-bg">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Prepare Course Progress Data for Bar Chart
    const courseProgressData = enrollments.map(c => ({
        name: (c.course?.title || 'Untitled Course').substring(0, 15) + '...',
        progress: c.calculatedProgress || c.progress || 0,
        score: c.overallScore || 0
    })).slice(0, 5);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="min-h-screen bg-[#F8F9FC] dark:bg-dark-bg font-sans transition-colors duration-300">
            <main className="p-4 md:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Performance Analytics</h1>
                        <p className="text-slate-500 dark:text-slate-400">Track your learning journey, skills acquisition, and achievements.</p>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Learning Hours', value: `${stats.totalLearningHours}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'Courses Completed', value: stats.coursesCompleted, icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                            { label: 'Average Score', value: `${stats.avgScore}%`, icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                            { label: 'Certificates', value: stats.certificatesEarned, icon: Award, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                        ].map((stat, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between"
                            >
                                <div>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Visual Progress (Area Chart) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" />
                                    Weekly Activity
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityData}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        {/* Course Comparison (Bar Chart) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <BarChart2 className="w-5 h-5 text-emerald-500" />
                                    Course Progress (%)
                                </h3>
                            </div>
                            <div className="h-[300px] w-full">
                                {courseProgressData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={courseProgressData} layout="vertical">
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.5} />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
                                            <YAxis type="category" dataKey="name" width={100} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Bar dataKey="progress" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        No course data available
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Detailed Course Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden"
                    >
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white">Detailed Course Performance</h3>
                            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">Download Report</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left align-middle">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold text-xs">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Course Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Progress</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Grade</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Last Active</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {enrollments.length > 0 ? enrollments.map((course, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[200px] truncate" title={course.course?.title}>
                                                {course.course?.title || 'Unknown Course'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${course.status === 'completed'
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {course.status === 'completed' ? 'Completed' : 'In Progress'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${course.calculatedProgress || course.progress || 0}%` }}
                                                        />
                                                    </div>
                                                    <span>{course.calculatedProgress || course.progress || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-900 dark:text-white font-bold whitespace-nowrap">
                                                {course.overallScore ? `${course.overallScore}%` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                                {course.lastAccessedAt ? new Date(course.lastAccessedAt).toLocaleDateString() : 'Never'}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                No enrollment history found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>

                </div>
            </main>
        </div>
    );
};

export default Performance;
