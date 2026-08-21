import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Zap, Layers, Map, Target, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import CertificateModal from '../CertificateModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/services/api';

const ActiveSkillsWidget = ({ userEmail, paths }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [userSkills, setUserSkills] = useState([]);
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [activeTab, setActiveTab] = useState(0);
    const [roleSkillsCache, setRoleSkillsCache] = useState({});
    const [certModal, setCertModal] = useState(null);
    const [loadingRoleSkills, setLoadingRoleSkills] = useState(false);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = 247; // card width (235) + gap (12)
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const checkScrollLimits = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 2);
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            checkScrollLimits();
        }, 100);
        window.addEventListener('resize', checkScrollLimits);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScrollLimits);
        };
    }, [userSkills, activeTab, roleSkillsCache]);

    // Filter to only include the 3 core career directions (if available)
    const validPaths = (paths || []).filter(p => p && p.title && ['primary', 'secondary', 'tertiary'].includes(p.id));

    useEffect(() => {
        const fetchUserSkills = async () => {
            const emailToUse = userEmail || JSON.parse(sessionStorage.getItem('user') || '{}').email || JSON.parse(localStorage.getItem('smaart_user') || '{}').email || 'guest@smaart.edu';
            if (!emailToUse) {
                setLoadingSkills(false);
                return;
            }
            try {
                setLoadingSkills(true);
                const token = sessionStorage.getItem('token');
                const res = await fetch(`/api/career-agent/user-skills/${encodeURIComponent(emailToUse)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                    const data = await res.json();
                    setUserSkills(data.filter(s => s.status === 'In Progress'));
                }
            } catch (e) {
                console.warn('Failed to fetch in progress skills for dashboard:', e);
            } finally {
                setLoadingSkills(false);
            }
        };

        fetchUserSkills();
    }, [userEmail]);

    useEffect(() => {
        if (validPaths.length === 0) return;
        
        const currentPath = validPaths[activeTab];
        if (!currentPath) return;

        const cacheKey = currentPath.title || currentPath.id;
        if (roleSkillsCache[cacheKey]) return; // Already fetched

        const fetchPathSkills = async () => {
            setLoadingRoleSkills(true);
            try {
                let allPathSkills = new Set();
                const rolesToFetch = currentPath.roles || [];

                // Fetch skills for all roles within this path
                await Promise.all(rolesToFetch.map(async (role) => {
                    if (!role) return;
                    try {
                        const res = await fetch(`/api/career-agent/role-skills/${encodeURIComponent(role)}`);
                        if (res.ok) {
                            const data = await res.json();
                            (data.skills || []).forEach(s => allPathSkills.add(s.skillName));
                        }
                    } catch (e) { }
                }));

                setRoleSkillsCache(prev => ({ ...prev, [cacheKey]: allPathSkills }));
            } catch (e) {
                console.error('Failed to fetch role skills:', e);
            } finally {
                setLoadingRoleSkills(false);
            }
        };

        fetchPathSkills();
    }, [activeTab, validPaths, roleSkillsCache]);

    const handleCertConfirm = async (skillName, file) => {
        setCertModal(null);
        setUserSkills(prev => prev.filter(s => s.skillName !== skillName));

        try {
            await fetch('/api/career-agent/user-skills/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, skillName, status: 'Completed', hasCertificate: !!file })
            });
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const handleMarkDone = async (skillName) => {
        try {
            const res = await fetch(`/api/assessments/skill/${encodeURIComponent(skillName)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.data) {
                    navigate(`/skill-assessment/${encodeURIComponent(skillName)}`);
                    return;
                }
            }
        } catch (e) {
            console.error("Error checking skill assessment:", e);
        }
        setCertModal({ skillName });
    };

    if (!validPaths || validPaths.length === 0) {
        return null; // Hide completely if the user hasn't generated paths yet
    }

    if (loadingSkills) {
        return <div className="w-full h-48 bg-slate-100 dark:bg-[#002147]/50 rounded-3xl animate-pulse mb-6" />;
    }

    const currentPath = validPaths[activeTab];
    const pathSkillSet = currentPath ? roleSkillsCache[currentPath.title || currentPath.id] : null;

    let displayedSkills = [];
    if (pathSkillSet && pathSkillSet.size > 0) {
        const pathSkillsArray = Array.from(pathSkillSet).map(s => s.toLowerCase().trim());
        displayedSkills = userSkills.filter(s => {
            const userSkillName = s.skillName.toLowerCase().trim();
            return pathSkillsArray.some(ps => ps === userSkillName || ps.includes(userSkillName) || userSkillName.includes(ps));
        });
    }

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    return (
        <motion.div 
            className="w-full mb-6 rounded-3xl overflow-hidden bg-white/80 dark:bg-[#002147]/70 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 shadow-[0_8px_30px_rgba(26,56,132,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] group/widget relative"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* Header & Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 border border-blue-100/30 dark:border-blue-900/20">
                        <Target className="w-5 h-5 text-[#1a3884] dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            {t('dashboard.active_skills_to_master', 'Active Skills to Master')}
                        </h2>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {t('dashboard.track_targeted_skills', 'Track your targeted skills across your career directions')}
                        </p>
                    </div>
                </div>

                {/* Pathway Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-black/20 border border-slate-200/30 dark:border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {validPaths.map((path, idx) => {
                        const isActive = activeTab === idx;
                        const label = path.id === 'primary' 
                            ? t('dashboard.primary_path', 'Primary Path') 
                            : path.id === 'secondary' 
                              ? t('dashboard.secondary_path', 'Secondary Path') 
                              : t('dashboard.tertiary_path', 'Tertiary Path');

                        return (
                            <button
                                key={path.id}
                                onClick={() => setActiveTab(idx)}
                                className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 text-[11px] font-extrabold rounded-xl transition-all duration-300 ${
                                    isActive 
                                        ? 'bg-[#1a3884] dark:bg-blue-600 text-white shadow-md shadow-blue-500/10'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#1a3884] dark:hover:text-white'
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Certificate Modal */}
            {certModal && (
                <CertificateModal
                    skillName={certModal.skillName}
                    onConfirm={handleCertConfirm}
                    onClose={() => setCertModal(null)}
                    theme={theme}
                />
            )}

            {/* Skills Grid Area */}
            <div className="p-5 relative group/skills">
                {displayedSkills.length > 4 && !loadingRoleSkills && (
                    <>
                        {/* Left Arrow Overlay Button */}
                        <button
                            onClick={() => scroll('left')}
                            className={`absolute z-10 w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center transition-all duration-300 left-3 hover:scale-105 active:scale-95 ${
                                canScrollLeft 
                                ? 'opacity-100 cursor-pointer bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-blue-400' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            style={{ top: 'calc(50% - 16px)' }}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Right Arrow Overlay Button */}
                        <button
                            onClick={() => scroll('right')}
                            className={`absolute z-10 w-8 h-8 rounded-full border border-slate-200 dark:border-white/10 shadow-md flex items-center justify-center transition-all duration-300 right-3 hover:scale-105 active:scale-95 ${
                                canScrollRight 
                                ? 'opacity-100 cursor-pointer bg-white dark:bg-[#002A5C] text-[#1a3884] dark:text-blue-400' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            style={{ top: 'calc(50% - 16px)' }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </>
                )}

                {loadingRoleSkills ? (
                    <div className="flex flex-col items-center justify-center h-36 z-10 bg-transparent">
                        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-3.5" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Mapping skills to pathway...</span>
                    </div>
                ) : displayedSkills.length > 0 ? (
                    <div 
                        ref={scrollContainerRef} 
                        onScroll={checkScrollLimits} 
                        className="flex overflow-x-auto gap-3 pb-3 scrollbar-none"
                    >
                        {displayedSkills.map((skill, idx) => (
                            <SkillDashboardCard
                                key={`skill-${idx}`}
                                idx={idx}
                                skill={skill}
                                onMarkDone={() => handleMarkDone(skill.skillName)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-36 text-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
                        <div className="w-10 h-10 rounded-2xl mb-2.5 flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/10">
                            <Layers className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                        </div>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                            {t('dashboard.no_active_skills', 'No active skills in this pathway.')}
                        </p>
                        <p className="text-[10px] font-bold text-slate-450 dark:text-slate-400 mt-1 px-4 max-w-sm leading-normal">
                            {t('dashboard.jump_into_roadmap', 'Jump into the Career Roadmap for')} <strong className="text-blue-600 dark:text-blue-400">{currentPath?.title}</strong> {t('dashboard.to_start_mastering', 'to start mastering new skills!')}
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const SkillDashboardCard = ({ skill, onMarkDone, idx }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            title={skill.skillName}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={`w-[235px] min-h-[175px] flex-shrink-0 p-4 rounded-2xl flex flex-col justify-between bg-white dark:bg-[#002A5C]/40 border transition-all duration-300 relative overflow-hidden ${
                isHovered 
                    ? 'shadow-lg border-blue-500/40 shadow-blue-500/5 dark:shadow-black/20' 
                    : 'border-slate-200/70 dark:border-white/5 shadow-sm'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Soft Ambient Corner Blue Glow */}
            <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full blur-xl pointer-events-none transition-opacity duration-300 bg-blue-500/10 dark:bg-blue-450/10 ${isHovered ? 'opacity-100' : 'opacity-40'}`} />

            {/* Permanent top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-slate-105 dark:bg-white/5" />
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500/40 via-indigo-500/40 to-blue-500/40" />
            <div className={`absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

            {/* Content Top */}
            <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2.5 mb-3">
                    <span className="text-xs font-black tracking-tight text-slate-800 dark:text-white line-clamp-3 leading-snug">
                        {skill.skillName}
                    </span>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-950/40 border border-blue-100/30 dark:border-blue-900/20 flex-shrink-0">
                        <Target className="w-3.5 h-3.5 text-[#1a3884] dark:text-blue-400" />
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="mt-auto mb-3">
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-black/10 border border-slate-200/50 dark:border-white/5 py-1 px-2 w-max rounded-lg">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-blue-400"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            In Progress
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Action Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
                className={`relative z-10 w-full py-2 px-3 rounded-xl text-[11px] font-extrabold transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isHovered
                        ? 'bg-[#1a3884] dark:bg-blue-600 text-white border-transparent shadow-md shadow-blue-500/10'
                        : 'bg-[#f0f4ff] dark:bg-[#1a3884]/20 text-[#1a3884] dark:text-blue-400 border border-[#1a3884]/15 dark:border-blue-400/20 hover:bg-[#1a3884] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-transparent dark:hover:border-transparent'
                }`}
            >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Done</span>
            </button>
        </motion.div>
    );
};

export default ActiveSkillsWidget;
