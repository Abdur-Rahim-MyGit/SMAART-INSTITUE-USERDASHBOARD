import { useState, useEffect } from 'react';
import { CheckCircle2, Award, BookOpen, Clock, Zap, Target } from 'lucide-react';import { motion } from 'framer-motion';
import { API_BASE_URL } from '@/services/api';

const ActivityFeed = ({ userId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!userId || !token) {
                    setLoading(false);
                    return;
                }

=======
                // Fetch enrollments and assessments
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f
                const [enrollmentsResponse, assessmentsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL.replace('/api', '')}/api/courseEnrollments/student/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL.replace('/api', '')}/api/baselineresults/user/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

<<<<<<< HEAD
                const enrollments = enrollmentsResponse.ok ? await enrollmentsResponse.ok && enrollmentsResponse.json() : [];
                const assessments = assessmentsResponse.ok ? await assessmentsResponse.json() : null;

                const timeline = [];
                if (Array.isArray(enrollments)) {
                    enrollments.forEach(enrollment => {
                        if (enrollment.modules && Array.isArray(enrollment.modules)) {
                            enrollment.modules.forEach(module => {
                                if (module.completed && module.completedAt) {
                                    timeline.push({
                                        id: `module-${module._id || Math.random()}`,
                                        type: 'module_completed',
                                        title: `Completed ${module.title || 'a module'}`,
                                        subtitle: enrollment.course?.title || 'Course Module',
                                        time: new Date(module.completedAt),
                                        icon: CheckCircle2,
                                        color: 'emerald'                                    });
                                }
                            });
                        }
                    });
                }

=======
                // Add assessment completion
>>>>>>> fc2825fbaa54e1b4fc5ae041d1051e6ce061b29f
                if (assessments && assessments.createdAt) {
                    timeline.push({
                        id: 'baseline',
                        type: 'assessment',
<<<<<<< HEAD
                        title: `Baseline Assessment Mastered`,
                        subtitle: `Score: ${assessments.baselineScore || 0}% Rank: ${assessments.stageBand || 'Elite'}`,
                        time: new Date(assessments.createdAt),
                        icon: Target,                        color: 'purple'
                    });
                }

                timeline.sort((a, b) => b.time - a.time);
                setActivities(timeline.slice(0, 5));                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch activities:', err);
                setLoading(false);
            }
        };

        if (userId) fetchActivities();
        else setLoading(false);
    }, [userId]);

    const getTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-22xl animate-pulse">
                <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-full w-1/2 mb-8" />
                <div className="space-y-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-4">
                            <div className="w-12 h-12 bg-slate-200 dark:bg-white/5 rounded-2xl shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
                                <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black text-[#002147] dark:text-white mb-8 flex items-center justify-between">
                <span>Timeline</span>
                <Clock className="w-5 h-5 text-slate-400" />
            </h3>

            {activities.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No activity yet</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Start your journey today</p>
                </div>
            ) : (
                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-white/5" />

                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 relative z-10 group"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110
                                ${activity.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 shadow-emerald-500/5' :
                                    activity.color === 'purple' ? 'bg-purple-500/10 text-purple-500 shadow-purple-500/5' :
                                        'bg-blue-500/10 text-blue-500 shadow-blue-500/5'
                                }`}>
                                <activity.icon className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-sm font-black text-[#002147] dark:text-white truncate">
                                        {activity.title}
                                    </p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter shrink-0 ml-4">
                                        {getTimeAgo(activity.time)}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 dark:text-gray-500 truncate uppercase tracking-tight">
                                    {activity.subtitle}                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
