import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Loader2, ArrowLeft, Sparkles, TrendingUp, Target,
    BookOpen, Brain, Award, ChevronRight, CheckCircle2,
    User as UserIcon, Mail, Phone, MapPin, GraduationCap,
    RefreshCw, Save, Search, Briefcase
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useLocation } from 'react-router-dom';

import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const ProfileAnalysis = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

    // User data from main profile (for context/header)
    const [userData, setUserData] = useState(null);

    // Analysis results
    const [profileAnalysis, setProfileAnalysis] = useState(null);
    const [careerRecommendations, setCareerRecommendations] = useState(null);
    const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
    const [learningPlan, setLearningPlan] = useState(null);

    // Form data (editable profile)
    const [formData, setFormData] = useState({
        isInitialized: false,
        fullName: '',
        education: '',
        experience: '',
        goals: '',
        salaryExpectation: '',
        jobSector: '',
        targetRole: '',
        skills: [],
        interests: []
    });

    const [skillInput, setSkillInput] = useState('');
    const [interestInput, setInterestInput] = useState('');

    useEffect(() => {
        const userDataStr = sessionStorage.getItem('userData');
        if (userDataStr) {
            setUserData(JSON.parse(userDataStr));
        }
        autoLoadProfile();
    }, []);

    const autoLoadProfile = async (isManual = false) => {
        if (!isManual) {
            setLoading(true);
        } else {
            setFetching(true);
        }

        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success) {
                mapResponseToForm(response);
                if (isManual) {
                    toast.success('Career profile synchronized with SMAART Cloud!');
                }
            }
        } catch (error) {
            console.error('Failed to sync profile:', error);
            if (isManual) toast.error('Check your internet connection.');
        } finally {
            setLoading(false);
            setFetching(false);
        }
    };

    const mapResponseToForm = (response) => {
        const rich = response.richProfile || {};
        const profile = response.profile || {};

        setFormData({
            isInitialized: true,
            fullName: rich.fullName || formData.fullName,
            education: rich.education || '',
            experience: rich.experience || '',
            goals: rich.goals || '',
            salaryExpectation: rich.salaryExpectation || '',
            jobSector: rich.jobSector || '',
            targetRole: profile.targetRole || rich.targetRole || '',
            skills: Array.isArray(profile.skills) ? profile.skills : (Array.isArray(rich.skills) ? rich.skills : []),
            interests: Array.isArray(profile.interests) ? profile.interests : (Array.isArray(rich.interests) ? rich.interests : [])
        });
    };

    const handleManualFetch = () => autoLoadProfile(true);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const response = await aiCareerCoachApi.updateProfile(formData);
            if (response.success) {
                toast.success('Career profile saved!');
            }
        } catch (error) {
            toast.error('Failed to save profile updates.');
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyzeProfile = async () => {
        setAnalyzing(true);
        setActiveTab('analysis');

        // Mock progress state for UX
        setProfileAnalysis({
            isAnalyzing: true,
            progress: 0,
            tasks: ["Reading profile data...", "Scanning industry trends...", "Identifying skill gaps...", "Generating insights..."],
            currentTask: 0
        });

        // Simulating progress
        const interval = setInterval(() => {
            setProfileAnalysis(prev => ({
                ...prev,
                progress: Math.min(prev.progress + 15, 95)
            }));
        }, 500);

        try {
            const response = await aiCareerCoachApi.analyzeProfile();
            clearInterval(interval);
            if (response.success) {
                setProfileAnalysis(response.analysis);
                toast.success('Analysis complete!');
            }
        } catch (error) {
            clearInterval(interval);
            setProfileAnalysis(null);
            toast.error('AI analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGetCareerPaths = async () => {
        setFetching(true);
        try {
            const response = await aiCareerCoachApi.getCareerRecommendations();
            if (response.success) {
                setCareerRecommendations(response.recommendations);
                setActiveTab('career-paths');
            }
        } catch (error) {
            toast.error('Failed to get career paths');
        } finally {
            setFetching(false);
        }
    };

    const handleSkillGapAnalysis = async () => {
        if (!formData.targetRole) {
            toast.error('Please specify a Target Role first');
            return;
        }
        setFetching(true);
        try {
            const response = await aiCareerCoachApi.analyzeSkillGap(formData.targetRole);
            if (response.success) {
                setSkillGapAnalysis(response.skillGap);
                setActiveTab('skill-gap');
            }
        } catch (error) {
            toast.error('Skill gap analysis failed');
        } finally {
            setFetching(false);
        }
    };

    const handleGenerateLearningPlan = async () => {
        if (!formData.targetRole) {
            toast.error('Please specify a Target Role first');
            return;
        }
        setFetching(true);
        try {
            const response = await aiCareerCoachApi.generateLearningPlan(formData.targetRole);
            if (response.success) {
                setLearningPlan(response.learningPlan);
                setActiveTab('learning-plan');
            }
        } catch (error) {
            toast.error('Learning plan generation failed');
        } finally {
            setFetching(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput('');
        }
    };

    const removeSkill = (s) => setFormData(prev => ({ ...prev, skills: prev.skills.filter(i => i !== s) }));

    const tabs = [
        { id: 'profile', label: 'My Career Profile', icon: Brain },
        { id: 'analysis', label: 'AI Insights', icon: Sparkles },
        { id: 'career-paths', label: 'Career Paths', icon: Target },
        { id: 'skill-gap', label: 'Skill Gap', icon: TrendingUp },
        { id: 'learning-plan', label: 'Learning Plan', icon: BookOpen }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#000d1a] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Syncing with SMAART Cloud...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#eef2f5] dark:bg-[#000d1a] transition-colors duration-300">
            <main className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    {/* Breadcrumb & Title */}
                    <div className="mb-8">
                        <button
                            onClick={() => navigate('/dashboard/smaart-toolkit')}
                            className="flex items-center gap-2 text-slate-500 hover:text-purple-600 transition-colors mb-4 group font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Toolkit
                        </button>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-500/20">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">AI Profile Analysis</h1>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">Map your skills, bridge your gaps, and build your future.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleManualFetch}
                                disabled={fetching}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all font-bold text-sm"
                            >
                                <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
                                Sync Profile Data
                            </button>
                        </div>
                    </div>

                    {/* Main Tabs Navigation */}
                    <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all duration-300 ${isActive
                                        ? 'bg-purple-600 text-white shadow-xl shadow-purple-500/20'
                                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="career-profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                            >
                                {/* Left: Profile Form */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                                <GraduationCap className="w-6 h-6 text-purple-600" />
                                                Professional Identity
                                            </h2>
                                            {!formData.isInitialized && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold animate-pulse">
                                                    Action Required
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 dark:text-white"
                                                    placeholder="Your name"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Education Background</label>
                                                <input
                                                    type="text"
                                                    value={formData.education}
                                                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 dark:text-white"
                                                    placeholder="Highest degree, Institution"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Career Goals</label>
                                                <textarea
                                                    rows="3"
                                                    value={formData.goals}
                                                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 dark:text-white"
                                                    placeholder="What are your short and long-term career objectives?"
                                                ></textarea>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Job Sector Interest</label>
                                                <input
                                                    type="text"
                                                    value={formData.jobSector}
                                                    onChange={(e) => setFormData({ ...formData, jobSector: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 dark:text-white"
                                                    placeholder="e.g. Technology, Health, Finance"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Salary Expectation</label>
                                                <input
                                                    type="text"
                                                    value={formData.salaryExpectation}
                                                    onChange={(e) => setFormData({ ...formData, salaryExpectation: e.target.value })}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-800 dark:text-white"
                                                    placeholder="Desired annual/monthly salary"
                                                />
                                            </div>

                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-xs font-black uppercase text-slate-500 ml-1">Target Role (For Analysis)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={formData.targetRole}
                                                        onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border-2 border-purple-100 dark:border-purple-900/30 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-black text-slate-800 dark:text-white"
                                                        placeholder="e.g. Senior Product Manager"
                                                    />
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center justify-end">
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={saving}
                                                className="flex items-center gap-2 px-8 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg shadow-purple-500/20 hover:bg-purple-700 transition-all disabled:opacity-50"
                                            >
                                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                                Save Career Profile
                                            </button>
                                        </div>
                                    </div>

                                    {/* Skills Section */}
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                                            <Award className="w-6 h-6 text-blue-500" />
                                            Skills Inventory
                                        </h2>
                                        <div className="flex gap-4 mb-6">
                                            <input
                                                type="text"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                                                className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                                placeholder="Add a skill (e.g. React, Python, Leadership)"
                                            />
                                            <button
                                                onClick={addSkill}
                                                className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                                            >
                                                Add
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map(skill => (
                                                <span
                                                    key={skill}
                                                    className="group flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl font-bold text-sm border border-blue-100 dark:border-blue-900/30"
                                                >
                                                    {skill}
                                                    <button onClick={() => removeSkill(skill)} className="hover:text-red-500">×</button>
                                                </span>
                                            ))}
                                            {formData.skills.length === 0 && (
                                                <p className="text-slate-400 text-sm italic">No skills added yet. Add some to improve AI accuracy.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Quick Actions Card */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl">
                                        <Sparkles className="w-10 h-10 mb-6 text-purple-200" />
                                        <h3 className="text-2xl font-black mb-2">Ready for Analysis?</h3>
                                        <p className="text-indigo-100 mb-8 font-medium">Let our AI coach evaluate your career standing and give you a roadmap to success.</p>

                                        <button
                                            onClick={handleAnalyzeProfile}
                                            disabled={analyzing}
                                            className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-50 transition-all mb-4 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {analyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Brain className="w-6 h-6" />}
                                            Start Full AI Analysis
                                        </button>

                                        <div className="space-y-2 mt-8">
                                            <button onClick={handleGetCareerPaths} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold">
                                                Recommendations <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleSkillGapAnalysis} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold">
                                                Skill Gap Analysis <ChevronRight className="w-4 h-4" />
                                            </button>
                                            <button onClick={handleGenerateLearningPlan} className="w-full flex items-center justify-between p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold">
                                                Learning Roadmap <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <h4 className="font-black text-slate-800 dark:text-white mb-4">Support</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-4">Need help defining your career goals? Chat with our coach directly.</p>
                                        <button
                                            onClick={() => navigate('/dashboard/smaart-toolkit/ai-career-chat')}
                                            className="text-purple-600 font-black text-sm flex items-center gap-1 group"
                                        >
                                            Open AI Career Chat
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'analysis' && (
                            <motion.div
                                key="analysis-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm min-h-[400px]"
                            >
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="relative w-24 h-24 mb-8">
                                            <div className="absolute inset-0 border-8 border-purple-100 dark:border-slate-700 rounded-full"></div>
                                            <svg className="w-full h-full rotate-[-90deg]">
                                                <circle
                                                    cx="48" cy="48" r="40"
                                                    fill="none" stroke="currentColor" strokeWidth="8"
                                                    strokeDasharray="251.2"
                                                    strokeDashoffset={251.2 - (251.2 * profileAnalysis.progress / 100)}
                                                    className="text-purple-600 transition-all duration-300"
                                                />
                                            </svg>
                                            <Brain className="absolute inset-0 m-auto w-8 h-8 text-purple-600 animate-pulse" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Generating Insights...</h3>
                                        <p className="text-slate-500 font-medium">{profileAnalysis.tasks[profileAnalysis.progress < 25 ? 0 : profileAnalysis.progress < 50 ? 1 : profileAnalysis.progress < 75 ? 2 : 3]}</p>
                                    </div>
                                ) : profileAnalysis ? (
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-slate-700">
                                            <Sparkles className="w-8 h-8 text-purple-600" />
                                            <div>
                                                <h2 className="m-0 text-2xl font-black">AI Career Analysis</h2>
                                                <p className="m-0 text-slate-500 font-bold uppercase text-[10px] tracking-widest">Powered by OpenRouter DeepSeek</p>
                                            </div>
                                        </div>
                                        <ReactMarkdown>{profileAnalysis}</ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center">
                                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-full mb-6">
                                            <Sparkles className="w-12 h-12 text-slate-300" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-400">No active analysis found.</h3>
                                        <button onClick={() => setActiveTab('profile')} className="mt-4 text-purple-600 font-bold">Go back and start analysis</button>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {['career-paths', 'skill-gap', 'learning-plan'].includes(activeTab) && (
                            <motion.div
                                key="tab-content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm min-h-[400px]"
                            >
                                {activeTab === 'career-paths' && (
                                    careerRecommendations ? (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <div className="flex items-center gap-3 mb-8">
                                                <Target className="w-8 h-8 text-emerald-500" />
                                                <h2 className="m-0 text-2xl font-black">Recommended Career Paths</h2>
                                            </div>
                                            <ReactMarkdown>{careerRecommendations}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <Target className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Discover Your Future</h3>
                                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Get personalized career trajectory suggestions based on your profile.</p>
                                            <button onClick={handleGetCareerPaths} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">Get Recommendations</button>
                                        </div>
                                    )
                                )}

                                {activeTab === 'skill-gap' && (
                                    skillGapAnalysis ? (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <div className="flex items-center gap-3 mb-8">
                                                <TrendingUp className="w-8 h-8 text-amber-500" />
                                                <h2 className="m-0 text-2xl font-black">Skill Gap Analysis: {formData.targetRole}</h2>
                                            </div>
                                            <ReactMarkdown>{skillGapAnalysis}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <TrendingUp className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Measure Your Readiness</h3>
                                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">See how your current skills stack up against your target role requirements.</p>
                                            <button onClick={handleSkillGapAnalysis} className="px-8 py-3 bg-amber-600 text-white rounded-2xl font-black shadow-lg">Run Analysis</button>
                                        </div>
                                    )
                                )}

                                {activeTab === 'learning-plan' && (
                                    learningPlan ? (
                                        <div className="prose dark:prose-invert max-w-none">
                                            <div className="flex items-center gap-3 mb-8">
                                                <BookOpen className="w-8 h-8 text-purple-500" />
                                                <h2 className="m-0 text-2xl font-black">6-Month Upskilling Roadmap</h2>
                                            </div>
                                            <ReactMarkdown>{learningPlan}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20">
                                            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Build Your Roadmap</h3>
                                            <p className="text-slate-500 mb-8 max-w-sm mx-auto">Get a month-by-month plan to master the skills you're missing.</p>
                                            <button onClick={handleGenerateLearningPlan} className="px-8 py-3 bg-purple-600 text-white rounded-2xl font-black shadow-lg">Generate Roadmap</button>
                                        </div>
                                    )
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
        </div>
    );
};

export default ProfileAnalysis;
