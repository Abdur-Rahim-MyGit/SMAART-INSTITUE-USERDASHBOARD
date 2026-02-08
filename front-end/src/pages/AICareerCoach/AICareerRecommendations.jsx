import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const AICareerRecommendations = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState(null);

    const handleGetRecommendations = async () => {
        setLoading(true);
        try {
            const response = await aiCareerCoachApi.getCareerRecommendations();
            if (response.success) {
                setRecommendations(response.recommendations);
                toast.success('Recommendations generated!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to get recommendations');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#e8ecef] dark:bg-[#001229]">
            <DashboardSidebar />
            <div className="min-h-screen">
                <DashboardHeader />
                <main className="w-full relative py-8 px-4 md:px-0">
                    <div className="max-w-4xl mx-auto pb-12">
                        <div className="mb-6 px-4">
                            <button onClick={() => navigate('/dashboard/ai-career-coach')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 mb-4">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back</span>
                            </button>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Career Recommendations</h1>
                            <p className="text-slate-600 dark:text-slate-400">Get personalized career path suggestions</p>
                        </div>

                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
                            {!recommendations ? (
                                <div className="text-center py-12">
                                    <Target className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Discover Your Career Path</h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">Get AI-powered career recommendations based on your profile</p>
                                    <button onClick={handleGetRecommendations} disabled={loading} className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 mx-auto">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                                        {loading ? 'Generating...' : 'Get Recommendations'}
                                    </button>
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 leading-relaxed">{recommendations}</p>
                                    <button onClick={handleGetRecommendations} disabled={loading} className="mt-6 px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                                        Regenerate
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AICareerRecommendations;
