import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Download,
    Loader2,
    ArrowLeft,
    Sparkles,
    User,
    Briefcase,
    GraduationCap,
    Award,
    Code,
    Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import DashboardHeader from '@/components/DashboardHeader';
import aiCareerCoachApi from '@/services/aiCareerCoachApi';
import { toast } from 'sonner';

const ResumeBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [resumeContent, setResumeContent] = useState(null);
    const [profile, setProfile] = useState(null);
    const [targetRole, setTargetRole] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success && response.profile) {
                setProfile(response.profile);
                setTargetRole(response.profile.targetRole || '');
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateResume = async () => {
        if (!targetRole.trim()) {
            toast.error('Please enter a target role');
            return;
        }

        setGenerating(true);
        try {
            const response = await aiCareerCoachApi.generateResume(targetRole);
            if (response.success) {
                setResumeContent(response.resume);
                toast.success('Resume generated successfully!');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to generate resume');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopyToClipboard = () => {
        if (resumeContent) {
            navigator.clipboard.writeText(resumeContent);
            toast.success('Resume content copied to clipboard!');
        }
    };

    const handlePrint = () => {
        const printContent = document.getElementById('resume-preview');
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=800,height=900');
        printWindow.document.write(`
            <html>
                <head>
                    <title>SMAART Resume - ${targetRole}</title>
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
                        h1, h2, h3 { color: #1a1a1a; margin-top: 1.5em; margin-bottom: 0.5em; }
                        h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                        h2 { font-size: 18px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                        ul { padding-left: 20px; }
                        li { margin-bottom: 5px; }
                        p { margin-bottom: 10px; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

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
                    <div className="max-w-5xl mx-auto pb-12">

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
                                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">SMAART AI Resume Builder</h1>
                                    <p className="text-slate-600 dark:text-slate-400">Create ATS-optimized resume content powered by AI</p>
                                </div>
                            </div>
                        </div>

                        {/* Input Section */}
                        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 mb-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Target Role *
                                    </label>
                                    <input
                                        type="text"
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        placeholder="e.g., Senior Software Engineer, Product Manager"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-800 dark:text-white"
                                    />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                        Enter the job title you're applying for to get tailored resume content
                                    </p>
                                </div>

                                {profile && (
                                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                                        <h3 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-3">Your Profile Summary</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Code className="w-4 h-4 text-purple-600" />
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    <strong>{profile.skills?.length || 0}</strong> Skills
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-purple-600" />
                                                <span className="text-slate-700 dark:text-slate-300">
                                                    <strong>{profile.experienceLevel}</strong> Level
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerateResume}
                                    disabled={generating || !targetRole.trim()}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating Your Resume...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Generate AI Resume
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Resume Content */}
                        {resumeContent && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-violet-500 to-purple-600 p-6 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-6 h-6" />
                                            <div>
                                                <h2 className="text-xl font-bold">Your AI-Generated Resume</h2>
                                                <p className="text-sm text-white/80">For: {targetRole}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handlePrint}
                                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" />
                                                Print / PDF
                                            </button>
                                            <button
                                                onClick={handleCopyToClipboard}
                                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8">
                                    <div className="prose dark:prose-invert max-w-none">
                                        <div id="resume-preview" className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <ReactMarkdown>{resumeContent}</ReactMarkdown>
                                        </div>
                                    </div>

                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Pro Tips:</h3>
                                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                            <li>• Customize this content to match specific job descriptions</li>
                                            <li>• Add quantifiable achievements and metrics</li>
                                            <li>• Use action verbs to start each bullet point</li>
                                            <li>• Keep your resume to 1-2 pages</li>
                                            <li>• Proofread carefully before submitting</li>
                                        </ul>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Empty State */}
                        {!resumeContent && !generating && (
                            <div className="bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                                <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Resume Generated Yet</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Enter your target role and click "Generate AI Resume" to create professional resume content
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                        <User className="w-6 h-6 text-purple-600 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">Professional Summary</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">AI-crafted summary highlighting your strengths</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                        <Briefcase className="w-6 h-6 text-purple-600 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">Experience</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Optimized descriptions with action verbs</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                        <Award className="w-6 h-6 text-purple-600 mb-2" />
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-1">ATS-Optimized</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Keywords for applicant tracking systems</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
};

export default ResumeBuilder;
