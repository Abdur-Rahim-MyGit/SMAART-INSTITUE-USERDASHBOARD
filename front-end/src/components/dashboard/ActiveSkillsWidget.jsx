import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Zap, Layers, Map, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import CertificateModal from '../CertificateModal';
import { motion, AnimatePresence } from 'framer-motion';

const ActiveSkillsWidget = ({ userEmail, paths }) => {
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
            const scrollAmount = 227; // card width (215) + gap (12)
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const checkScrollLimits = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            // Add a 2px buffer for rounding differences
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

    if (!validPaths || validPaths.length === 0) {
        return null; // Hide completely if the user hasn't generated paths yet
    }

    if (loadingSkills) {
        return <div className="w-full h-48 bg-slate-100 dark:bg-[#002147] rounded-2xl animate-pulse mb-6" />;
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
        <motion.div className="w-full mb-6 rounded-2xl overflow-hidden shadow-sm group/widget"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{
                background: isDark ? 'var(--navy)' : '#ffffff',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'
            }}>

            {/* Header & Tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 border-b"
                style={{
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc'
                }}>

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff' }}>
                        <Target size={20} color={isDark ? '#60a5fa' : '#1a3884'} />
                    </div>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight"
                            style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                            Active Skills to Master
                        </h2>
                        <p className="text-[0.72rem] mt-0.5" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            Track your targeted skills across your career directions
                        </p>
                    </div>
                </div>

                {/* Pathway Tabs */}
                <div className="flex p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar"
                    style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9' }}>
                    {validPaths.map((path, idx) => {
                        const isActive = activeTab === idx;
                        const label = path.id === 'primary' ? 'Primary Path' :
                            path.id === 'secondary' ? 'Secondary Path' : 'Tertiary Path';

                        return (
                            <button
                                key={path.id}
                                onClick={() => setActiveTab(idx)}
                                className="flex-1 lg:flex-none whitespace-nowrap px-4 py-2 text-[0.75rem] font-bold rounded-lg transition-all duration-300"
                                style={{
                                    background: isActive ? (isDark ? '#3b82f6' : '#1a3884') : 'transparent',
                                    color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                                    boxShadow: isActive && !isDark ? '0 4px 10px rgba(26,56,132,0.25)' : 'none'
                                }}
                                onMouseOver={(e) => {
                                    if (!isActive) e.currentTarget.style.color = isDark ? '#ffffff' : '#1a3884';
                                }}
                                onMouseOut={(e) => {
                                    if (!isActive) e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b';
                                }}
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
            <div className="p-4 sm:p-5 min-h-[170px] relative group/skills">
                {displayedSkills.length > 5 && !loadingRoleSkills && (
                    <>
                        {/* Left Arrow Overlay Button */}
                        <button
                            onClick={() => scroll('left')}
                            className={`absolute z-10 w-7 h-7 rounded-full border shadow-sm flex items-center justify-center transition-all duration-300 left-4 sm:left-5 ${
                                canScrollLeft 
                                ? 'opacity-0 group-hover/widget:opacity-100 pointer-events-none group-hover/widget:pointer-events-auto hover:scale-105 active:scale-95' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            style={{
                                top: '50%',
                                marginTop: '-20px',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
                                background: isDark ? 'rgba(0, 42, 92, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                color: isDark ? '#ffffff' : '#1a3884',
                            }}
                        >
                            <ChevronLeft size={14} />
                        </button>

                        {/* Right Arrow Overlay Button */}
                        <button
                            onClick={() => scroll('right')}
                            className={`absolute z-10 w-7 h-7 rounded-full border shadow-sm flex items-center justify-center transition-all duration-300 right-4 sm:right-5 ${
                                canScrollRight 
                                ? 'opacity-0 group-hover/widget:opacity-100 pointer-events-none group-hover/widget:pointer-events-auto hover:scale-105 active:scale-95' 
                                : 'opacity-0 pointer-events-none'
                            }`}
                            style={{
                                top: '50%',
                                marginTop: '-20px',
                                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#cbd5e1',
                                background: isDark ? 'rgba(0, 42, 92, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                color: isDark ? '#ffffff' : '#1a3884',
                            }}
                        >
                            <ChevronRight size={14} />
                        </button>
                    </>
                )}

                {loadingRoleSkills ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
                        style={{ background: isDark ? 'var(--navy)' : '#ffffff' }}>
                        <div className="w-7 h-7 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin mb-3" />
                        <span className="text-[0.75rem] font-semibold" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>Mapping skills to pathway...</span>
                    </div>
                ) : displayedSkills.length > 0 ? (
                    <div ref={scrollContainerRef} onScroll={checkScrollLimits} className="flex overflow-x-auto gap-3 pb-3 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {displayedSkills.map((skill, idx) => (
                            <SkillDashboardCard
                                key={`skill-${idx}`}
                                skill={skill}
                                isDark={isDark}
                                onMarkDone={() => setCertModal({ skillName: skill.skillName })}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center rounded-xl border border-dashed"
                        style={{
                            background: isDark ? '#00152e' : '#f8fafc',
                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'
                        }}>
                        <div className="w-10 h-10 rounded-full mb-2 flex items-center justify-center"
                            style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9' }}>
                            <Layers size={18} color={isDark ? '#475569' : '#94a3b8'} />
                        </div>
                        <p className="text-[0.82rem] font-bold" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            No active skills in this pathway.
                        </p>
                        <p className="text-[0.7rem] mt-1 px-4" style={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                            Jump into the Career Roadmap for <strong style={{ color: isDark ? '#e2e8f0' : '#475569' }}>{currentPath?.title}</strong> to start mastering new skills!
                        </p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const SkillDashboardCard = ({ skill, onMarkDone, isDark }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Pick a subtle accent color based on the first letter of the skill name
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    const colorIndex = skill.skillName.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];

    return (
        <motion.div
            title={skill.skillName}
            whileHover={{ y: -5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
                background: isDark ? '#002A5C' : '#ffffff',
                border: isHovered
                    ? `1px solid #1a3884`
                    : (isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'),
                borderRadius: '12px',
                padding: '1rem',
                boxShadow: isHovered ? '0 12px 24px -6px rgba(0,0,0,0.08)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '145px',
                width: '215px',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: isHovered ? '#1a3884' : 'transparent', transition: 'background 0.3s' }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '8px' }}>
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isDark ? '#ffffff' : '#0f172a',
                        lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                    }}>
                        {skill.skillName}
                    </span>
                    <Target size={16} color={isDark ? '#60a5fa' : '#1a3884'} style={{ opacity: 0.8, flexShrink: 0, marginTop: '2px' }} />
                </div>

                <div style={{ marginTop: 'auto', marginBottom: '0.8rem' }}>
                    <span style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26, 56, 132, 0.06)',
                        color: isDark ? '#bfdbfe' : '#1a3884',
                        border: isDark ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(26, 56, 132, 0.15)'
                    }}>
                        In Progress
                    </span>
                </div>
            </div>

            <motion.button
                onClick={(e) => { e.stopPropagation(); onMarkDone(); }}
                whileTap={{ scale: 0.95 }}
                style={{
                    width: '100%',
                    padding: '0.4rem',
                    borderRadius: '6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    border: '1px solid rgba(26, 56, 132, 0.3)',
                    background: isHovered ? '#1a3884' : 'transparent',
                    color: isHovered ? '#ffffff' : '#1a3884',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem'
                }}
            >
                Mark Done
            </motion.button>
        </motion.div>
    );
};

export default ActiveSkillsWidget;
