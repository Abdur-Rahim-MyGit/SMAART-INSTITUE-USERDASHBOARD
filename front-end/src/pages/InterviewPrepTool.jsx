import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IconMicrophone as Mic, IconArrowLeft as ArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import InterviewPrep from './CareerAgent/panels/InterviewPrep';
import '../pages/CareerAgent/careerAgent.css'; // Import the CSS to ensure variables are present

const InterviewPrepTool = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
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
            <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 mt-2"
                >
                    <button
                        onClick={() => navigate('/dashboard/smaart-toolkit')}
                        className="group mb-5 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#1a3884]/70 transition-all hover:text-[#1a3884] dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e6f7] bg-white shadow-sm transition-all duration-200 group-hover:-translate-x-0.5 group-hover:shadow-md dark:border-[#1a3884]/30 dark:bg-[#001a3d]">
                            <ArrowLeft stroke={1.5} className="h-4 w-4" />
                        </div>
                        {t('interview_prep_tool.back_to_toolkit', 'Back to Toolkit')}
                    </button>

                    <div className="relative mb-6 overflow-hidden rounded-2xl border border-[#d8e6f7] bg-white px-6 py-5 shadow-[0_2px_16px_rgba(26,56,132,0.07)] dark:border-[#1a3884]/20 dark:bg-[#001630] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
                        <div className="relative z-10">
                            <h1 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight text-[#0d1f4e] dark:text-white">
                                {t('interview_prep_tool.title_1', 'Interview')} <span className="text-[#1a3884] dark:text-blue-300">{t('interview_prep_tool.title_2', 'Preparation')}</span>
                            </h1>
                            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400">
                                {t('interview_prep_tool.tailored_before', 'Resources and questions tailored for')} <strong className="text-[#1a3884] dark:text-blue-300">{roleName}</strong>{t('interview_prep_tool.tailored_after', '. Switch your target role in the Career Agent dashboard to update this.')}
                            </p>
                        </div>
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
