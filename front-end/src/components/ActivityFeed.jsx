import { useState, useEffect } from 'react';
import { CheckCircle2, Award, BookOpen, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
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

                // Fetch enrollments and assessments
                const [enrollmentsResponse, assessmentsResponse] = await Promise.all([
                    fetch(`${API_BASE_URL.replace('/api', '')}/api/courseEnrollments/student/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_BASE_URL.replace('/api', '')}/api/baselineresults/user/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const enrollments = enrollmentsResponse.ok ? await enrollmentsResponse.json() : [];
                const assessments = assessmentsResponse.ok ? await assessmentsResponse.json() : null;

                // Build activity timeline
                const timeline = [];

                // Add completed modules
                if (Array.isArray(enrollments)) {
                    enrollments.forEach(enrollment => {
                        if (enrollment.modules && Array.isArray(enrollment.modules)) {
                            enrollment.modules.forEach(module => {
                                if (module.completed && module.completedAt) {
                                    timeline.push({
                                        id: `module-${module._id || Math.random()}`,
                                        type: 'module_completed',
                                        title: `Completed ${module.title || 'a module'}`,
                                        time: new Date(module.completedAt),
                                        icon: CheckCircle2,
                                        color: 'green'
                                    });
                                }
                            });
                        }
                    });
                }

                // Add assessment completion
                if (assessments && assessments.createdAt) {
                    timeline.push({
                        id: 'baseline',
                        type: 'assessment',
                        title: `Baseline Assessment: ${assessments.baselineScore || 0}%`,
                        time: new Date(assessments.createdAt),
                        icon: Award,
                        color: 'purple'
                    });
                }

                // Sort by time (most recent first)
                timeline.sort((a, b) => b.time - a.time);

                setActivities(timeline.slice(0, 5)); // Show last 5
                setLoading(false);
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
            <div className="lms-card p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="lms-card p-6">
            <h3 className="text-base font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Activity
            </h3>

            {activities.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        No recent activity
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 ${activity.color === 'green' ? 'bg-green-100 dark:bg-green-500/20' :
                                    activity.color === 'purple' ? 'bg-purple-100 dark:bg-purple-500/20' :
                                        'bg-blue-100 dark:bg-blue-500/20'
                                }`}>
                                <activity.icon className={`w-4 h-4 ${activity.color === 'green' ? 'text-green-600 dark:text-green-400' :
                                        activity.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                                            'text-blue-600 dark:text-blue-400'
                                    }`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-[#002147] dark:text-white leading-tight mb-1">
                                    {activity.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {getTimeAgo(activity.time)}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
