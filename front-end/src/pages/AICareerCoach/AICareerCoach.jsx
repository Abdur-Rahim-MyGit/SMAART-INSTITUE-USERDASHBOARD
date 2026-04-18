import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MessageSquare,
    User,
    Target,
    TrendingUp,
    BookOpen,
    FileText,
    Sparkles,
    ArrowRight,
    Brain,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const features = [
    {
        id: 'profile',
        title: 'Profile Analysis',
        description: 'Get AI-powered insights into your strengths, weaknesses, and career potential based on your skills and experience.',
        icon: User,
        path: '/dashboard/profile-analysis',
        state: { tab: 'profile' },
        color: 'from-blue-500 to-cyan-600',
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badge: 'Insights',
        badgeColor: 'bg-blue-500'
    },
    {
        id: 'recommendations',
        title: 'Career Paths',
        description: 'Discover personalized career recommendations tailored to your skills, interests, and professional goals.',
        icon: Target,
        path: '/dashboard/profile-analysis',
        state: { tab: 'career-paths' },
        color: 'from-emerald-500 to-teal-600',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badge: 'Personalized',
        badgeColor: 'bg-emerald-500'
    },
    {
        id: 'skill-gap',
        title: 'Skill Gap Analysis',
        description: 'Identify the exact skills you need to develop for your target role and get a prioritized learning roadmap.',
        icon: TrendingUp,
        path: '/dashboard/profile-analysis',
        state: { tab: 'skill-gap' },
        color: 'from-amber-500 to-orange-600',
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        badge: 'Strategic',
        badgeColor: 'bg-amber-500'
    },
    {
        id: 'learning-plan',
        title: 'Learning Plan',
        description: 'Generate a comprehensive 6-month learning plan with courses, projects, and milestones to achieve your goals.',
        icon: BookOpen,
        path: '/dashboard/profile-analysis',
        state: { tab: 'learning-plan' },
        color: 'from-rose-500 to-pink-600',
        iconBg: 'bg-rose-100 dark:bg-rose-900/30',
        iconColor: 'text-rose-600 dark:text-rose-400',
        badge: 'Structured',
        badgeColor: 'bg-rose-500'
    },
    {
        id: 'resume',
        title: 'Resume Builder',
        description: 'Create ATS-optimized resume content powered by AI, tailored specifically for your target role.',
        icon: FileText,
        path: '/dashboard/resume-builder',
        state: null,
        color: 'from-violet-500 to-purple-600',
        iconBg: 'bg-violet-100 dark:bg-violet-900/30',
        iconColor: 'text-violet-600 dark:text-violet-400',
        badge: 'Professional',
        badgeColor: 'bg-violet-500'
    }
];

const FeatureCard = ({ feature, index }) => {
    const navigate = useNavigate();
    const Icon = feature.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onClick={() => navigate(feature.path, { state: feature.state })}
            className="group relative cursor-pointer"
        >
            {/* Glow Effect */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition duration-500`} />

            <div className="relative h-full bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 group-hover:translate-y-[-4px] group-hover:shadow-2xl">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`${feature.iconBg} w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                        <Icon className={`w-7 h-7 ${feature.iconColor}`} />
                    </div>
                    <span className={`${feature.badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                        {feature.badge}
                    </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-indigo-600 transition-all">
                    {feature.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {feature.description}
                </p>

                {/* Action */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        Explore
                    </span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-indigo-600 transition-all duration-300 group-hover:scale-110">
                        <ArrowRight className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const AICareerCoach = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success) {
                setProfile(response.profile);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuickStart = () => {
        if (!profile || profile.completionPercentage < 50) {
            navigate('/dashboard/ai-career-coach/profile');
            toast.info('Complete your profile to get started!');
        } else {
            navigate('/dashboard/profile-analysis');
        }
    };

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-7xl mx-auto pb-12">

                        {/* Hero Section */}
                        <div className="relative mb-12 px-4">
                            {/* Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/10 rounded-3xl blur-3xl" />

                            <div className="relative bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-8 md:p-12 overflow-hidden">
                                {/* Animated Background Pattern */}
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse" />
                                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse delay-1000" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Brain className="w-8 h-8 text-white" />
                                            <span className="text-white/90 font-semibold text-sm uppercase tracking-wider">AI-Powered Career Coaching</span>
                                        </div>
                                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                                            Your Personal AI <br />
                                            <span className="text-yellow-300">Career Coach</span>
                                        </h1>
                                        <p className="text-white/90 text-lg leading-relaxed mb-6 max-w-2xl">
                                            Get personalized career guidance, skill development plans, and professional growth strategies powered by advanced AI technology.
                                        </p>

                                        {/* Stats */}
                                        <div className="flex flex-wrap gap-6 mb-6">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-5 h-5 text-yellow-300" />
                                                <span className="text-white font-semibold">AI-Powered Insights</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-yellow-300" />
                                                <span className="text-white font-semibold">24/7 Availability</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleQuickStart}
                                            className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                                        >
                                            Get Started
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Profile Completion */}
                                    {profile && (
                                        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                                            <div className="text-center mb-4">
                                                <div className="text-5xl font-black text-white mb-2">
                                                    {profile.completionPercentage}%
                                                </div>
                                                <div className="text-white/80 text-sm font-semibold">Profile Complete</div>
                                            </div>
                                            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${profile.completionPercentage}%` }}
                                                    transition={{ duration: 1, delay: 0.5 }}
                                                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="px-4">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">
                                    Explore AI Career Tools
                                </h2>
                                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                                    Choose from our comprehensive suite of AI-powered career development tools
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {features.map((feature, index) => (
                                    <FeatureCard key={feature.id} feature={feature} index={index} />
                                ))}
                            </div>
                        </div>

                    </div>
                </main>
        </div>
    );
};

export default AICareerCoach;
