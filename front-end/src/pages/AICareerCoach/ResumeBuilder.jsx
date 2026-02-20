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
    Printer,
    CheckCircle2
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
    const [richProfile, setRichProfile] = useState(null);
    const [targetRole, setTargetRole] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await aiCareerCoachApi.getProfile();
            if (response.success) {
                setProfile(response.profile);
                setRichProfile(response.richProfile);
                setTargetRole(response.profile?.targetRole || response.richProfile?.targetRole || '');
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
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
                toast.success('AI Resume generated successfully!');
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

        const logoUrl = window.location.origin + '/logo.png';

        const printWindow = window.open('', '', 'width=850,height=1100');
        printWindow.document.write(`
            <html>
                <head>
                    <title>SMAART Resume - ${richProfile?.fullName || 'Student'}</title>
                    <style>
                        @page { size: A4; margin: 15mm; }
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                            line-height: 1.6; 
                            color: #1a1a1a; 
                            width: 100%;
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .header {
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            border-bottom: 3px solid #6366f1;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        .logo-container {
                            width: 150px;
                        }
                        .logo-container img {
                            max-width: 100%;
                            height: auto;
                        }
                        .student-info {
                            text-align: right;
                        }
                        .student-name {
                            font-size: 28px;
                            font-weight: 900;
                            margin: 0;
                            color: #1a1a1a;
                        }
                        .target-role {
                            font-size: 18px;
                            color: #6366f1;
                            font-weight: 700;
                            margin: 5px 0 0 0;
                        }
                        .content-wrapper { 
                            padding: 0 5mm; 
                        }
                        h1, h2, h3 { color: #1e1b4b; margin-top: 1.5em; margin-bottom: 0.5em; page-break-after: avoid; }
                        h1 { font-size: 24px; border-bottom: 2px solid #312e81; padding-bottom: 8px; margin-top: 0; }
                        h2 { 
                            font-size: 18px; 
                            border-bottom: 1px solid #e2e8f0; 
                            padding-bottom: 4px; 
                            background-color: #f8fafc; 
                            padding: 6px 12px; 
                            border-radius: 6px;
                            color: #4338ca;
                        }
                        ul { padding-left: 20px; margin-bottom: 1.2em; }
                        li { margin-bottom: 6px; }
                        p { margin-bottom: 10px; text-align: justify; }
                        li, p, h2, h3 { page-break-inside: avoid; }
                    </style>
                </head>
                <body>
                    <div class="content-wrapper">
                        <div class="header">
                            <div class="logo-container">
                                <img src="${logoUrl}" alt="SMAART INSTITUTE" onerror="this.style.display='none'">
                                <div style="font-weight: 900; font-size: 20px; color: #4338ca; display: none;" id="logo-text">SMAART INSTITUTE</div>
                            </div>
                            <div class="student-info">
                                <h1 class="student-name">${richProfile?.fullName || 'PROFESSIONAL RESUME'}</h1>
                                <p class="target-role">${targetRole.toUpperCase()}</p>
                            </div>
                        </div>
                        <div class="resume-body">
                            ${printContent.innerHTML}
                        </div>
                    </div>
                </body>
                <script>
                    window.onload = () => {
                        const img = document.querySelector('img');
                        if (!img.complete || img.naturalWidth === 0) {
                            document.getElementById('logo-text').style.display = 'block';
                        }
                    };
                </script>
            </html>
        `);
        printWindow.document.close();

        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
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
                                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors mb-4 group"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="font-semibold">Back to Toolkit</span>
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">AI Resume Architect</h1>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">Precision engineered resumes powered by SMAART AI</p>
                                </div>
                            </div>
                        </div>

                        {/* Input Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 px-4 md:px-0">
                            <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 dark:text-slate-400 mb-3 ml-1 tracking-widest">
                                            Desired Career Path
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="e.g., Lead Data Scientist, Full Stack Developer"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all font-bold text-slate-800 dark:text-white"
                                            />
                                            <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-600" />
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateResume}
                                        disabled={generating || !targetRole.trim()}
                                        className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                Architecting Content...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-6 h-6" />
                                                Generate Professional Resume
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Data Context Card */}
                            <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                            <User className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="font-bold text-sm">Data Context</span>
                                    </div>
                                    <h3 className="text-xl font-black mb-1">{richProfile?.fullName || 'Student'}</h3>
                                    <div className="flex flex-col gap-1 mb-6">
                                        <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">
                                            {richProfile?.education?.split('at')[0] || 'Learning Pathway'}
                                        </p>
                                        {richProfile?.department && (
                                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-white/40"></div>
                                                {richProfile.department}
                                            </p>
                                        )}
                                        {richProfile?.college && (
                                            <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                                                <div className="w-1 h-1 rounded-full bg-white/40"></div>
                                                {richProfile.college}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold">Skills Synced</span>
                                            <span className="px-2 py-0.5 bg-white text-indigo-600 rounded-lg text-xs font-black">
                                                {richProfile?.skills?.length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/5">
                                            <span className="text-xs font-bold">Experience Lv</span>
                                            <span className="px-2 py-0.5 bg-white text-indigo-600 rounded-lg text-xs font-black">
                                                {profile?.experienceLevel || 'Beginner'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-[10px] text-white/60 font-medium mt-6">
                                    * AI uses your SMAART Profile, Education & Experience history for maximum precision.
                                </p>
                            </div>
                        </div>

                        {/* Resume Content Rendering */}
                        {resumeContent ? (
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#1e293b] rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden px-4 md:px-0"
                            >
                                <div className="bg-slate-900 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-2">
                                            <img src="/logo.png" alt="Logo" className="max-w-full h-auto" />
                                        </div>
                                        <div>
                                            <h2 className="text-white font-black text-lg leading-tight">Master Draft</h2>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{targetRole}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handlePrint}
                                            className="flex-1 md:flex-none px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                                        >
                                            <Printer className="w-4 h-4" />
                                            Export to PDF
                                        </button>
                                        <button
                                            onClick={handleCopyToClipboard}
                                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-2xl font-black text-sm transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 md:p-12">
                                    <div id="resume-preview" className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
                                        <ReactMarkdown>{resumeContent}</ReactMarkdown>
                                    </div>

                                    <div className="mt-12 flex items-center gap-4 p-6 bg-purple-50 dark:bg-purple-900/10 rounded-3xl border border-purple-100 dark:border-purple-900/30">
                                        <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                                            <Sparkles className="w-6 h-6 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white text-sm">Fine-Tune Required?</h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">You can copy the raw text and adjust details in any word processor. This content is structured for top-tier ATS screening.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="px-4 md:px-0">
                                {!generating && (
                                    <div className="bg-white dark:bg-[#1e293b] rounded-[40px] border border-slate-200 dark:border-slate-700 p-16 text-center shadow-sm">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[35%] flex items-center justify-center mx-auto mb-8">
                                            <FileText className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white mb-3">No Resume Architected</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium mb-10">
                                            Define your target role above. Our AI agent will cross-reference your SMAART achievements to build a high-impact document.
                                        </p>

                                        <div className="flex flex-wrap justify-center gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                                <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">ATS Optimized</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                                <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">Data Backed</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                                                <span className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400">Instant PDF</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ResumeBuilder;
