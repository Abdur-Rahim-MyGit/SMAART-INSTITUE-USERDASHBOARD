import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, Sparkles, TrendingUp, Target, BookOpen, Brain, Award, ChevronRight, CheckCircle2, User as UserIcon, Mail, Phone, MapPin, GraduationCap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const ProfileAnalysis = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState(location.state?.tab || 'profile');

    // User data from main profile
    const [userData, setUserData] = useState(null);

    // Analysis states
    const [analyzingProfile, setAnalyzingProfile] = useState(false);
    const [profileAnalysis, setProfileAnalysis] = useState(null);
    const [careerRecommendations, setCareerRecommendations] = useState(null);
    const [skillGapAnalysis, setSkillGapAnalysis] = useState(null);
    const [learningPlan, setLearningPlan] = useState(null);

    const [formData, setFormData] = useState({
        fetched: false,
        education: '',
        goals: '',
        salaryExpectation: '',
        jobSector: '',
        targetRole: '',
        // For AI context only (not displayed)
        skills: [],
        interests: []
    });

    const [skillInput, setSkillInput] = useState('');
    const [interestInput, setInterestInput] = useState('');

    useEffect(() => {
        fetchUserAndProfile();
    }, []);

    const fetchUserAndProfile = async () => {
        try {
            // Get user data from sessionStorage just for Header display
            const userDataStr = sessionStorage.getItem('userData');
            if (userDataStr) {
                const user = JSON.parse(userDataStr);
                setUserData(user);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchProfile = async () => {
        setLoading(true);
        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success) {
                const reg = response.registration || {};
                const profile = response.profile || {};

                console.log('Registration Data:', reg); // Debug log

                // 1. Education Background
                let education = '';

                // Try higher education first (IT'S AN ARRAY!)
                if (reg.higherEducation && reg.higherEducation.length > 0 && reg.higherEducation[0].degree) {
                    const hEdu = reg.higherEducation[0]; // Get first element
                    const parts = [
                        hEdu.degree,
                        hEdu.specialization ? `in ${hEdu.specialization}` : '',
                        hEdu.institutionName ? `at ${hEdu.institutionName}` : ''
                    ].filter(Boolean);
                    education = parts.join(' ');
                }
                // Fallback to basic education fields
                else if (reg.educationLevel || reg.institution) {
                    const parts = [
                        reg.educationLevel,
                        reg.department ? `(${reg.department})` : '',
                        reg.institution ? `at ${reg.institution}` : '',
                        reg.yearOfPassing ? `- ${reg.yearOfPassing}` : ''
                    ].filter(Boolean);
                    education = parts.join(' ');
                }
                // Final fallback
                else {
                    education = profile.education || 'Not specified';
                }

                // 2. Career Goals
                let goals = '';
                if (reg.careerGoals) {
                    const goalParts = [];
                    if (reg.careerGoals.shortTerm) {
                        goalParts.push(`Short-term: ${reg.careerGoals.shortTerm}`);
                    }
                    if (reg.careerGoals.mediumTerm) {
                        goalParts.push(`Medium-term: ${reg.careerGoals.mediumTerm}`);
                    }
                    if (reg.careerGoals.longTerm) {
                        goalParts.push(`Long-term: ${reg.careerGoals.longTerm}`);
                    }
                    goals = goalParts.join('\n') || 'Not specified';
                } else {
                    goals = profile.goals || 'Not specified';
                }

                // 3. Salary Expectation (jobPreferences IS AN ARRAY!)
                let salaryExpectation = 'Not specified';
                if (reg.jobPreferences && reg.jobPreferences.length > 0) {
                    const jobPref = reg.jobPreferences[0]; // Get first element
                    if (jobPref.expectedSalary) {
                        salaryExpectation = `₹${jobPref.expectedSalary}`;
                    }
                } else if (profile.salaryExpectation) {
                    salaryExpectation = profile.salaryExpectation;
                }

                // 4. Job Sector / Preferred Industry
                let jobSector = '';
                if (reg.sectorPreferences?.preferredSectors?.length > 0) {
                    jobSector = reg.sectorPreferences.preferredSectors.join(', ');
                } else if (reg.jobPreferences && reg.jobPreferences.length > 0 && reg.jobPreferences[0].preferredIndustry) {
                    jobSector = reg.jobPreferences[0].preferredIndustry;
                } else {
                    jobSector = profile.preferredIndustry || 'Not specified';
                }

                // 5. Target Role (for analysis) - jobPreferences IS AN ARRAY!
                let targetRole = '';
                if (reg.jobPreferences && reg.jobPreferences.length > 0) {
                    targetRole = reg.jobPreferences[0].preferredRole || '';
                } else {
                    targetRole = profile.targetRole || '';
                }

                setFormData(prev => ({
                    ...prev,
                    fetched: true,
                    education: education,
                    goals: goals,
                    salaryExpectation: salaryExpectation,
                    jobSector: jobSector,
                    targetRole: targetRole,
                    // Keep these for AI analysis context
                    skills: profile.skills || [],
                    interests: profile.interests || []
                }));

                toast.success('Profile data fetched successfully!');
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            toast.error('Could not fetch registration data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await aiCareerCoachApi.updateProfile(formData);
            if (response.success) {
                toast.success('Profile updated successfully!');
            }
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleAnalyzeProfile = async () => {
        setAnalyzingProfile(true);
        setActiveTab('analysis'); // Switch to analysis tab immediately

        // Animation state
        let progress = 0;
        let taskIndex = 0;
        const tasks = [
            "Analyzing skills and experience...",
            "Evaluating career readiness...",
            "Matching with industry requirements...",
            "Generating personalized insights...",
            "Finalizing recommendations..."
        ];

        // Update progress animation
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progress <= 100) {
                // Update task based on progress
                if (progress < 20) taskIndex = 0;
                else if (progress < 40) taskIndex = 1;
                else if (progress < 60) taskIndex = 2;
                else if (progress < 80) taskIndex = 3;
                else taskIndex = 4;

                // Store in state for rendering
                setProfileAnalysis({
                    isAnalyzing: true,
                    progress,
                    currentTask: taskIndex,
                    tasks
                });
            }
        }, 60); // ~6 seconds total

        try {
            // Run API call in parallel with animation
            const [response] = await Promise.all([
                aiCareerCoachApi.analyzeProfile(),
                new Promise(resolve => setTimeout(resolve, 3000)) // Minimum 3s animation
            ]);

            clearInterval(progressInterval);

            if (response.success) {
                // Show completion
                setProfileAnalysis({
                    isAnalyzing: true,
                    progress: 100,
                    currentTask: tasks.length - 1,
                    tasks
                });

                // Wait a bit then show results
                setTimeout(() => {
                    setProfileAnalysis(response.analysis);
                    toast.success('Profile analyzed successfully!');
                }, 1000);
            }
        } catch (error) {
            clearInterval(progressInterval);
            setProfileAnalysis(null);
            toast.error(error.response?.data?.message || 'Failed to analyze profile');
        } finally {
            setAnalyzingProfile(false);
        }
    };

    const handleGetCareerPaths = async () => {
        setAnalyzingProfile(true);
        try {
            const response = await aiCareerCoachApi.getCareerRecommendations();
            if (response.success) {
                setCareerRecommendations(response.recommendations);
                setActiveTab('career-paths');
                toast.success('Career paths generated!');
            }
        } catch (error) {
            toast.error('Failed to get career recommendations');
        } finally {
            setAnalyzingProfile(false);
        }
    };

    const handleSkillGapAnalysis = async () => {
        if (!formData.targetRole) {
            toast.error('Please set a target role first');
            return;
        }
        setAnalyzingProfile(true);
        try {
            const response = await aiCareerCoachApi.analyzeSkillGap(formData.targetRole);
            if (response.success) {
                setSkillGapAnalysis(response.skillGap);
                setActiveTab('skill-gap');
                toast.success('Skill gap analyzed!');
            }
        } catch (error) {
            toast.error('Failed to analyze skill gap');
        } finally {
            setAnalyzingProfile(false);
        }
    };

    const handleGenerateLearningPlan = async () => {
        if (!formData.targetRole) {
            toast.error('Please set a target role first');
            return;
        }
        setAnalyzingProfile(true);
        try {
            const response = await aiCareerCoachApi.generateLearningPlan(formData.targetRole, '6 months');
            if (response.success) {
                setLearningPlan(response.learningPlan);
                setActiveTab('learning-plan');
                toast.success('Learning plan generated!');
            }
        } catch (error) {
            toast.error('Failed to generate learning plan');
        } finally {
            setAnalyzingProfile(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
            setFormData(prev => ({
                ...prev,
                skills: [...prev.skills, skillInput.trim()]
            }));
            setSkillInput('');
        }
    };

    const removeSkill = (skill) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter(s => s !== skill)
        }));
    };

    const addInterest = () => {
        if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
            setFormData(prev => ({
                ...prev,
                interests: [...prev.interests, interestInput.trim()]
            }));
            setInterestInput('');
        }
    };

    const removeInterest = (interest) => {
        setFormData(prev => ({
            ...prev,
            interests: prev.interests.filter(i => i !== interest)
        }));
    };

    const tabs = [
        { id: 'profile', label: 'My Profile', icon: Brain },
        { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
        { id: 'career-paths', label: 'Career Paths', icon: Target },
        { id: 'skill-gap', label: 'Skill Gap', icon: TrendingUp },
        { id: 'learning-plan', label: 'Learning Plan', icon: BookOpen }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229] transition-colors duration-300">
            <DashboardSidebar />

            <div className="min-h-screen transition-all duration-300">
                <DashboardHeader />

                <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-6xl mx-auto pb-12">

                        {/* Header */}
                        <div className="mb-6 px-4">
                            <button
                                onClick={() => navigate('/dashboard/smaart-toolkit')}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back to SMAART Toolkit</span>
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                    <Brain className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">Profile Analysis</h1>
                                    <p className="text-slate-600 dark:text-slate-400">Complete profile with AI-powered insights</p>
                                </div>
                            </div>

                            {/* User Info Card */}
                            {userData && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                            {userData.fullName?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 dark:text-white">{userData.fullName}</h3>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {userData.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        <span>{userData.email}</span>
                                                    </div>
                                                )}
                                                {userData.mobile && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        <span>{userData.mobile}</span>
                                                    </div>
                                                )}
                                                {userData.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        <span>{userData.location}</span>
                                                    </div>
                                                )}
                                                {userData.qualification && (
                                                    <div className="flex items-center gap-1">
                                                        <GraduationCap className="w-3 h-3" />
                                                        <span>{userData.qualification}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${activeTab === tab.id
                                                ? 'bg-purple-600 text-white shadow-lg'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-slate-700'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8"
                                >
                                    <div className="space-y-6">
                                        {!formData.fetched ? (
                                            <div className="text-center py-12">
                                                <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <UserIcon className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                                    Import Your Profile Data
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                                    Fetch your details from your registration profile (Education, Experience, Projects) to generate a personalized career analysis.
                                                </p>
                                                <button
                                                    onClick={handleFetchProfile}
                                                    disabled={loading}
                                                    className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-3 mx-auto"
                                                >
                                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                                    Fetch from Profile
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Display Fetched Data */}
                                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700 mb-6">
                                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                        Profile Data Fetched Successfully
                                                    </h3>

                                                    <div className="space-y-6">
                                                        {/* Education Background */}
                                                        <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <GraduationCap className="w-5 h-5 text-purple-600" />
                                                                <h4 className="font-semibold text-sm uppercase text-slate-500">Education Background</h4>
                                                            </div>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium text-base">
                                                                {formData.education || 'Not specified'}
                                                            </p>
                                                        </div>

                                                        {/* Career Goals */}
                                                        <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Target className="w-5 h-5 text-indigo-600" />
                                                                <h4 className="font-semibold text-sm uppercase text-slate-500">Career Goals</h4>
                                                            </div>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium text-base whitespace-pre-line">
                                                                {formData.goals || 'Not specified'}
                                                            </p>
                                                        </div>

                                                        {/* Salary Expectation */}
                                                        <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <TrendingUp className="w-5 h-5 text-green-600" />
                                                                <h4 className="font-semibold text-sm uppercase text-slate-500">Salary Expectation</h4>
                                                            </div>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium text-base">
                                                                {formData.salaryExpectation || 'Not specified'}
                                                            </p>
                                                        </div>

                                                        {/* Job Sector */}
                                                        <div className="bg-white dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Award className="w-5 h-5 text-amber-600" />
                                                                <h4 className="font-semibold text-sm uppercase text-slate-500">Preferred Job Sector</h4>
                                                            </div>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium text-base">
                                                                {formData.jobSector || 'Not specified'}
                                                            </p>
                                                        </div>

                                                        {/* Target Role (Editable) */}
                                                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <Sparkles className="w-5 h-5 text-purple-600" />
                                                                <h4 className="font-semibold text-sm uppercase text-purple-700 dark:text-purple-300">Target Role (For AI Analysis)</h4>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={formData.targetRole}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                                                                placeholder="e.g. Software Engineer, Data Analyst, Product Manager"
                                                                className="w-full bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700 focus:border-purple-500 dark:focus:border-purple-500 rounded-lg px-4 py-3 outline-none text-slate-800 dark:text-white font-medium placeholder-slate-400"
                                                            />
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                                                💡 This helps AI provide more accurate career recommendations
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex flex-wrap gap-4 justify-center">
                                                    <button
                                                        onClick={handleAnalyzeProfile}
                                                        disabled={analyzingProfile}
                                                        className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-purple-500/20 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                                                    >
                                                        {analyzingProfile ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                                                        Generate AI Analysis
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'analysis' && (
                                <motion.div
                                    key="analysis"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 md:p-8"
                                >
                                    {profileAnalysis?.isAnalyzing ? (
                                        <div className="text-center py-8">
                                            <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                                <Loader2 className="w-10 h-10 text-purple-600 dark:text-purple-400 animate-spin" />
                                                <div className="absolute inset-0 rounded-full border-4 border-purple-200 dark:border-purple-800 animate-pulse"></div>
                                            </div>

                                            <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100 mb-2">
                                                Analyzing Your Profile...
                                            </h2>
                                            <p className="text-slate-600 dark:text-slate-400 mb-8">
                                                This may take a few moments while we review your information and generate personalized insights.
                                            </p>

                                            {/* Progress Bar */}
                                            <div className="max-w-md mx-auto mb-8">
                                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                                                    <motion.div
                                                        className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${profileAnalysis.progress}%` }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-bold text-purple-900 dark:text-purple-100">
                                                        {profileAnalysis.progress}%
                                                    </span>
                                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                                        {profileAnalysis.progress < 100 ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                {profileAnalysis.tasks[profileAnalysis.currentTask]}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                                Analysis Complete!
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Task List */}
                                            <div className="max-w-md mx-auto bg-white/50 dark:bg-slate-800/50 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                                                <div className="space-y-3">
                                                    {profileAnalysis.tasks.map((task, index) => (
                                                        <div
                                                            key={index}
                                                            className={`flex items-center gap-3 transition-all ${index <= profileAnalysis.currentTask
                                                                ? 'text-slate-800 dark:text-white'
                                                                : 'text-slate-400 dark:text-slate-600'
                                                                }`}
                                                        >
                                                            <div className="flex-shrink-0">
                                                                {index < profileAnalysis.currentTask || profileAnalysis.progress === 100 ? (
                                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                                ) : index === profileAnalysis.currentTask ? (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-purple-600 flex items-center justify-center">
                                                                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-medium">
                                                                {task.replace('...', '')}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : profileAnalysis ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles className="w-6 h-6 text-purple-600" />
                                                <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100">AI Profile Analysis</h2>
                                            </div>
                                            <div className="prose prose-purple dark:prose-invert max-w-none">
                                                <ReactMarkdown>{profileAnalysis}</ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">Click "Generate AI Analysis" to get AI-powered insights</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'career-paths' && (
                                <motion.div
                                    key="career-paths"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6 md:p-8"
                                >
                                    {careerRecommendations ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Target className="w-6 h-6 text-emerald-600" />
                                                <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-100">Career Path Recommendations</h2>
                                            </div>
                                            <div className="prose prose-emerald dark:prose-invert max-w-none">
                                                <ReactMarkdown>{careerRecommendations}</ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Target className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">Click "Get Career Paths" to discover your options</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'skill-gap' && (
                                <motion.div
                                    key="skill-gap"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-6 md:p-8"
                                >
                                    {skillGapAnalysis ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <TrendingUp className="w-6 h-6 text-amber-600" />
                                                <h2 className="text-2xl font-black text-amber-900 dark:text-amber-100">Skill Gap Analysis</h2>
                                            </div>
                                            <div className="prose prose-amber dark:prose-invert max-w-none">
                                                <ReactMarkdown>{skillGapAnalysis}</ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <TrendingUp className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">Set a target role and click "Analyze Skill Gap"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {activeTab === 'learning-plan' && (
                                <motion.div
                                    key="learning-plan"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 p-6 md:p-8"
                                >
                                    {learningPlan ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <BookOpen className="w-6 h-6 text-rose-600" />
                                                <h2 className="text-2xl font-black text-rose-900 dark:text-rose-100">6-Month Learning Plan</h2>
                                            </div>
                                            <div className="prose prose-rose dark:prose-invert max-w-none">
                                                <ReactMarkdown>{learningPlan}</ReactMarkdown>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <BookOpen className="w-16 h-16 text-rose-400 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">Set a target role and click "Generate Learning Plan"</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfileAnalysis;
