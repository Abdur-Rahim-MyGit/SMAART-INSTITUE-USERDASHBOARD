import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InterviewPrep from './CareerAgent/panels/InterviewPrep';
import '../pages/CareerAgent/careerAgent.css'; // Import the CSS to ensure variables are present

const InterviewPrepTool = () => {
    const navigate = useNavigate();
    const [roleName, setRoleName] = useState('Software Engineer');

    useEffect(() => {
        // Try to get user's role from Career Agent analysis
        try {
            const cached = localStorage.getItem('smaart_analysis');
            if (cached) {
                const data = JSON.parse(cached);
                if (data?.tab1?.role_name) {
                    setRoleName(data.tab1.role_name);
                }
            }
        } catch (e) {
            console.warn('Failed to parse cached analysis:', e);
        }
    }, []);

    return (
        <div className="career-agent-page" style={{ height: 'auto', overflow: 'visible', background: 'transparent' }}>
            <div className="max-w-5xl mx-auto w-full pb-12">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 mt-2"
                >
                    <button
                        onClick={() => navigate('/dashboard/smaart-toolkit')}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#1a3884] transition-colors mb-6"
                    >
                        <ArrowLeft size={16} /> Back to Toolkit
                    </button>

                    <div className="bg-white dark:bg-[#00152E] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[#1a3884] dark:text-blue-400 flex items-center justify-center">
                                <Mic size={20} strokeWidth={2.5} />
                            </div>
                            <h1 className="text-[22px] font-extrabold text-[#0d1f4e] dark:text-white">
                                Interview Preparation
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm ml-[52px]">
                            Resources and questions tailored for <strong className="text-[#1a3884] dark:text-blue-300">{roleName}</strong>. 
                            Switch your target role in the Career Agent dashboard to update this.
                        </p>
                    </div>
                </motion.div>

                <div className="dash-main" style={{ padding: '0', background: 'transparent', overflow: 'visible' }}>
                    <InterviewPrep roleName={roleName} />
                </div>
            </div>
        </div>
    );
};

export default InterviewPrepTool;
