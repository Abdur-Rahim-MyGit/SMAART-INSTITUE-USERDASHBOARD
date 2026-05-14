import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, ArrowLeft, Sparkles, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const AIProfile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const [formData, setFormData] = useState({
        skills: [],
        experience: '',
        education: '',
        interests: [],
        goals: '',
        experienceLevel: 'Beginner',
        preferredIndustry: '',
        preferredWorkStyle: 'Flexible',
        targetRole: ''
    });

    const [skillInput, setSkillInput] = useState('');
    const [interestInput, setInterestInput] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success && response.profile) {
                setFormData({
                    skills: response.profile.skills || [],
                    experience: response.profile.experience || '',
                    education: response.profile.education || '',
                    interests: response.profile.interests || [],
                    goals: response.profile.goals || '',
                    experienceLevel: response.profile.experienceLevel || 'Beginner',
                    preferredIndustry: response.profile.preferredIndustry || '',
                    preferredWorkStyle: response.profile.preferredWorkStyle || 'Flexible',
                    targetRole: response.profile.targetRole || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
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

    const handleAnalyze = async () => {
        setAnalyzing(true);
        try {
            const response = await aiCareerCoachApi.analyzeProfile();
            if (response.success) {
                setAnalysis(response.analysis);
                toast.success('Profile analyzed successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to analyze profile');
        } finally {
            setAnalyzing(false);
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#e8ecef] dark:bg-dark-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-dark-bg transition-colors duration-300">
            <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-4xl mx-auto pb-12">

                        {/* Header */}
                        <div className="mb-6 px-4">
                            <button
                                onClick={() => navigate('/dashboard/ai-career-coach')}
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back to AI Career Coach</span>
                            </button>

                            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Career Profile</h1>
                            <p className="text-slate-600 dark:text-slate-400">Complete your profile to get personalized AI insights</p>
                        </div>

                        {/* Form */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 mb-6">
                            <div className="space-y-6">

                                {/* Skills */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Skills
                                    </label>
                                    <div className="flex gap-2 mb-3">
                                        <input
                                            type="text"
                                            value={skillInput}
                                            onChange={(e) => setSkillInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                            placeholder="Add a skill (e.g., JavaScript, Leadership)"
                                            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white"
                                        />
                                        <button
                                            onClick={addSkill}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {formData.skills.map((skill, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-2"
                                            >
                                                {skill}
                                                <button
                                                    onClick={() => removeSkill(skill)}
                                                    className="hover:text-purple-900 dark:hover:text-purple-100"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Level */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Experience Level
                                    </label>
                                    <select
                                        value={formData.experienceLevel}
                                        onChange={(e) => setFormData(prev => ({ ...prev, experienceLevel: e.target.value }))}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                        <option value="Expert">Expert</option>
                                    </select>
                                </div>

                                {/* Experience */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Work Experience
                                    </label>
                                    <textarea
                                        value={formData.experience}
                                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                                        placeholder="Describe your work experience..."
                                        rows={4}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Education */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Education
                                    </label>
                                    <textarea
                                        value={formData.education}
                                        onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                                        placeholder="Describe your educational background..."
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Target Role */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Target Role
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.targetRole}
                                        onChange={(e) => setFormData(prev => ({ ...prev, targetRole: e.target.value }))}
                                        placeholder="e.g., Software Engineer, Data Scientist"
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white"
                                    />
                                </div>

                                {/* Career Goals */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Career Goals
                                    </label>
                                    <textarea
                                        value={formData.goals}
                                        onChange={(e) => setFormData(prev => ({ ...prev, goals: e.target.value }))}
                                        placeholder="What are your career aspirations?"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                        {saving ? 'Saving...' : 'Save Profile'}
                                    </button>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={analyzing || !formData.skills.length}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Results */}
                        {analysis && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6 md:p-8"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <TrendingUp className="w-6 h-6 text-purple-600" />
                                    <h2 className="text-2xl font-black text-purple-900 dark:text-purple-100">AI Analysis Results</h2>
                                </div>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{analysis}</p>
                                </div>
                            </motion.div>
                        )}

                    </div>
                </main>
        </div>
    );
};

export default AIProfile;
