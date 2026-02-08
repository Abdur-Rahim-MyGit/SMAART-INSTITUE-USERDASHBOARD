import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Save,
    Loader2,
    ArrowLeft,
    Sparkles,
    TrendingUp,
    Target,
    BookOpen,
    Brain,
    Award,
    ChevronRight,
    CheckCircle2,
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const ProfileAnalysis = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

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
        skills: [],
        experience: '',
        education: '',
        interests: [],
        goals: '',
        projects: '',
        certificates: '',
        experienceLevel: 'Beginner',
        preferredIndustry: '',
        preferredWorkStyle: 'Flexible',
        targetRole: ''
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

                // Construct rich data strings from Registration object
                const workExp = reg.workExperience?.map(e => {
                    const start = e.startDate ? new Date(e.startDate).getFullYear() : '';
                    const end = e.currentlyWorking ? 'Present' : (e.endDate ? new Date(e.endDate).getFullYear() : '');
                    const duration = start ? `(${start} - ${end})` : '';
                    return `${e.jobTitle} at ${e.organizationName} ${duration}`;
                }).join('\n') || profile.experience || '';

                const projects = reg.projects?.map(p => `${p.title}: ${p.description}`).join('\n\n') || '';
                const certs = reg.certificates?.map(c => c.title).join(', ') || '';

                let education = '';
                const hEdu = reg.higherEducation;
                if (hEdu && (hEdu.degree || hEdu.institutionName)) {
                    education = [hEdu.degree, hEdu.specialization ? `in ${hEdu.specialization}` : '', hEdu.institutionName ? `at ${hEdu.institutionName}` : ''].filter(Boolean).join(' ');
                } else {
                    education = profile.education || 'Not specified';
                }

                const goals = reg.careerGoals
                    ? `Short-term: ${reg.careerGoals.shortTerm}\nLong-term: ${reg.careerGoals.longTerm}`
                    : (profile.goals || '');

                setFormData(prev => ({
                    ...prev,
                    fetched: true,
                    education: education,
                    experience: workExp,
                    projects: projects,
                    certificates: certs,
                    goals: goals,
                    skills: profile.skills || [],
                    targetRole: reg.jobPreferences?.preferredRole || profile.targetRole || '',
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
        try {
            const response = await aiCareerCoachApi.analyzeProfile();
            if (response.success) {
                setProfileAnalysis(response.analysis);
                setActiveTab('analysis');
                toast.success('Profile analyzed successfully!');
            }
        } catch (error) {
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

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        <div>
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Education</h4>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.education || 'Not specified'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Work Experience</h4>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line">{formData.experience || 'None'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Projects</h4>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-line">{formData.projects || 'None'}</p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Certificates</h4>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.certificates || 'None'}</p>
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Target Role</h4>
                                                            <input
                                                                type="text"
                                                                value={formData.targetRole}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                                                                placeholder="e.g. Software Engineer (Required for Skill Gap Analysis)"
                                                                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-purple-500 outline-none text-slate-800 dark:text-white font-medium pb-2 placeholder-slate-400"
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <h4 className="font-semibold text-sm uppercase text-slate-500 mb-2">Career Goals</h4>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.goals || 'Not specified'}</p>
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
                                    {profileAnalysis ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-6">
                                                <Sparkles className="w-6 h-6 text-purple-600" />
                                                <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100">AI Profile Analysis</h2>
                                            </div>
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{profileAnalysis}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                                            <p className="text-slate-600 dark:text-slate-400">Click "Analyze Profile" to get AI-powered insights</p>
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
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{careerRecommendations}</p>
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
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{skillGapAnalysis}</p>
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
                                            <div className="prose dark:prose-invert max-w-none">
                                                <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{learningPlan}</p>
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
