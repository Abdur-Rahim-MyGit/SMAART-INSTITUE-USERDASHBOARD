import './careerAgent.css';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import RoleDetailedView from './panels/RoleDetailedView';
import DirectionOverview from './panels/DirectionOverview';
import MarketIntelligence from './panels/MarketIntelligence';
import SkillsPanel from './panels/SkillsPanel';
import AIImplementation from './panels/AIImplementation';
import InterviewPrep from './panels/InterviewPrep';
import ResumeTips from './panels/ResumeTips';
import CareerRoadmap from './panels/CareerRoadmap';
import CareerDirectionCard from './panels/CareerDirectionCard';
import Certifications from './panels/Certifications';
import CareerFirstVisitModal from './components/CareerFirstVisitModal';
import CareerLockBanner from './components/CareerLockBanner';

import CareerLockedModal from './components/CareerLockedModal';
import { fetchLockStatus } from '@/services/CareerLockService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
    IconCompass as Compass,
    IconClipboardList as ClipboardList,
    IconChartBar as BarChart3,
    IconDna as Dna,
    IconMap2 as Map,
    IconAward as Award,
    IconRocket as Rocket,
    IconRobot as Bot,
    IconMicrophone as Mic,
    IconFileText as FileText,
    IconCode as Code,
    IconLock as Lock,
    IconLockOpen as Unlock,
    IconCircleCheck as CheckCircle,
    IconTrophy as Trophy,
    IconMedal as Medal,
    IconTarget as Target,
    IconSparkles as Sparkles,
    IconSun as Sun,
    IconMoon as Moon,
    IconDeviceDesktop as Monitor,
    IconChevronDown as ChevronDown,
    IconX as X,
    IconMenu2 as Menu,
    IconRefresh as RefreshCw
} from '@tabler/icons-react';
const CareerAgentDashboard = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { t, i18n } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeRole, setActiveRole] = useState(() => {
        // Initialize from ?tab= query param so the correct path tab is shown immediately
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'secondary') return 2;
        if (tab === 'tertiary') return 3;
        return 1;
    });
    const [activePanel, setActivePanel] = useState('direction');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // Keep activeRole in sync if user navigates with different ?tab= param
    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'secondary') setActiveRole(2);
        else if (tab === 'tertiary') setActiveRole(3);
        else if (tab === 'primary') setActiveRole(1);
    }, [searchParams]);

    // ── Career Direction Locking System ────────────────────────────────────────
    const [lockStatus, setLockStatus] = useState(null);
    const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const prevLockedRef = useRef(false);

    const refreshLockStatus = useCallback(async () => {
        try {
            const status = await fetchLockStatus();
            if (status) {
                // Detect a new lock event (was unlocked, now locked)
                if (!prevLockedRef.current && status.isLocked) {
                    setShowLockedModal(true);
                }
                prevLockedRef.current = status.isLocked;
                setLockStatus(status);
                // Lock status is tracked via lockStatus state — no separate lockedRoles needed
                // Show first-visit modal when analysis exists and modal hasn't been shown
                if (status.found && !status.firstVisitModalShown && !status.isLocked) {
                    setShowFirstVisitModal(true);
                }
            }
        } catch (e) {
            console.warn('[Dashboard] Lock status fetch error:', e.message);
        }
    }, []);

    // No manual lock — paths are locked automatically after 5 attempts or 14 days.

    useEffect(() => {
        const loadAnalysisAndLockStatus = async () => {


            // ── Fetch career direction lock status (new system) ─────────────
            await refreshLockStatus();

            try {
                // 1️⃣ Try to load from MongoDB (per-user, persists across devices)
                const res = await fetch('/api/career-agent/my-analysis', { credentials: 'include' });
                if (res.ok) {
                    const payload = await res.json();
                    if (payload.found && payload.analysis) {
                        setData(payload.analysis);
                        // Cache locally too so offline / fast-reload works
                        localStorage.setItem('smaart_analysis', JSON.stringify(payload.analysis));
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                // Network / auth error — fall through to localStorage
                console.warn('[Dashboard] DB fetch failed, trying localStorage:', e.message);
            }

            // 2️⃣ Fallback: localStorage (set after onboarding submit)
            const cached = localStorage.getItem('smaart_analysis');
            if (cached) {
                try {
                    setData(JSON.parse(cached));
                    setLoading(false);
                } catch (e) {
                    console.error('Failed to parse cached analysis:', e);
                    navigate('/dashboard/career-agent/onboarding');
                }
            } else {
                navigate('/dashboard/career-agent/onboarding');
            }
        };

        loadAnalysisAndLockStatus();
    }, [navigate, refreshLockStatus]);

    // FIX: Direction Overview shows empty because the 'direction' field is missing from saved analyses.
    // When the engine stores a report, it attaches direction data only if fetchDirectionFromDB succeeds.
    // This effect detects missing directions and fetches them from the API using the preference names.
    useEffect(() => {
        if (!data) return;

        const _draft = (() => { try { return JSON.parse(localStorage.getItem('smaart_onboarding_draft') || '{}'); } catch { return {}; } })();
        const _dp = _draft?.preferences || {};

        // Get the direction name for each path — from the stored analysis or the onboarding draft
        const getPrefName = (roleData, draftPref, localKey) => {
            return localStorage.getItem(localKey)
                || roleData?.direction?.directionName
                || draftPref?.careerDirectionName
                || draftPref?.role
                || roleData?.tab1?.role_name
                || null;
        };

        const primaryName = getPrefName(data.primary, _dp.primary, 'smaart_pref_primary');
        const secondaryName = getPrefName(data.secondary, _dp.secondary, 'smaart_pref_secondary');
        const tertiaryName = getPrefName(data.tertiary, _dp.tertiary, 'smaart_pref_tertiary');

        // ALWAYS re-fetch roles from DB for ALL paths — the cached direction.roles in the
        // saved analysis may be incomplete. Only skip if we have no name to search by.
        const toFetch = [
            { key: 'primary', name: primaryName },
            { key: 'secondary', name: secondaryName },
            { key: 'tertiary', name: tertiaryName },
        ].filter(p => p.name);

        if (toFetch.length === 0) return;

        // Fetch fresh direction+roles from DB and patch into state
        const fetchAndPatch = async () => {
            const patches = {};
            await Promise.all(toFetch.map(async ({ key, name }) => {
                try {
                    const res = await fetch(`/api/career-agent/direction-roles/${encodeURIComponent(name)}`, { credentials: 'include' });
                    if (res.ok) {
                        const dir = await res.json();
                        if (dir.found || dir.directionName) {
                            // Preserve existing direction meta (description etc.) but ALWAYS overwrite roles with fresh DB data
                            const existingDir = data[key]?.direction || {};
                            patches[key] = {
                                ...existingDir,
                                directionId: dir.directionId || existingDir.directionId || '',
                                directionName: dir.directionName || existingDir.directionName || name,
                                directionDescription: dir.overview || existingDir.directionDescription || '',
                                directionOverview: dir.overview || existingDir.directionOverview || '',
                                type: existingDir.type || (key === 'primary' ? 'Primary' : key === 'secondary' ? 'Secondary' : 'Alternative'),
                                roles: dir.roles || [],  // ← always use fresh DB roles (full list)
                            };
                        }
                    }
                } catch (e) {
                    console.warn(`[Dashboard] Could not fetch direction for ${name}:`, e.message);
                }
            }));

            if (Object.keys(patches).length > 0) {
                setData(prev => {
                    if (!prev) return prev;
                    const updated = { ...prev };
                    for (const [key, dirData] of Object.entries(patches)) {
                        if (updated[key]) {
                            updated[key] = { ...updated[key], direction: dirData };
                        }
                    }
                    return updated;
                });
            }
        };

        fetchAndPatch();
    }, [data?.primary?.tab1?.role_name, data?.secondary?.tab1?.role_name, data?.tertiary?.tab1?.role_name]);


    if (loading) {
        return (
            <div className="career-agent-page" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)' }}>
                <div className="pulse-ring" style={{ width: '80px', height: '80px' }}></div>
                <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: 'var(--navy2)', border: '2px solid var(--accent-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(37,99,235,0.1)', position: 'relative', zIndex: 2 }}>
                    <Sparkles size={32} color="var(--accent-text)" className="animate-pulse" />
                </div>
                <h2 style={{ marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text1)' }}>{t('career_agent.loading_title', 'Synchronizing Intelligence...')}</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{t('career_agent.loading_subtitle', 'Mapping your career trajectory')}</p>
            </div>
        );
    }

    const { primary = {}, secondary = {}, tertiary = {}, combined_tab4 = {} } = data || {};

    // Safety check for current data structure
    const getSafeRole = (roleData) => {
        if (!roleData || !roleData.tab1) {
            return {
                tab1: { role_name: 'Analyzing...', role_description: 'Processing role intelligence...' },
                tab3: { ai_tools: [], ai_exposure: { percentage: '0%', level: 'Analyzing' } }
            };
        }
        return roleData;
    };

    const currentData = getSafeRole(activeRole === 1 ? primary : activeRole === 2 ? secondary : tertiary);
    const roleName = currentData.tab1?.role_name || 'Selected Role';

    // Read user's originally selected preferences — use analysis direction data first (avoids stale localStorage)
    const _draft = (() => { try { return JSON.parse(localStorage.getItem('smaart_onboarding_draft') || '{}'); } catch { return {}; } })();
    const _dp = _draft?.preferences || {};
    // Priority: analysis direction name → localStorage pref key → draft pref → role name
    const prefPrimary = primary?.direction?.directionName || localStorage.getItem('smaart_pref_primary') || _dp.primary?.careerDirectionName || _dp.primary?.role || primary?.tab1?.role_name || 'Primary';
    const prefSecondary = secondary?.direction?.directionName || localStorage.getItem('smaart_pref_secondary') || _dp.secondary?.careerDirectionName || _dp.secondary?.role || secondary?.tab1?.role_name || 'Secondary';
    const prefTertiary = tertiary?.direction?.directionName || localStorage.getItem('smaart_pref_tertiary') || _dp.tertiary?.careerDirectionName || _dp.tertiary?.role || tertiary?.tab1?.role_name || 'Tertiary';

    const userStr = sessionStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;
    const displayName = user?.fullName || user?.name || localStorage.getItem('smaart_student_name') || 'Student';
    const displayEmail = user?.email || localStorage.getItem('smaart_student_email') || '';
    const regDate = user?.createdAt || user?.registrationDate || new Date();
    const diffTime = Date.now() - new Date(regDate).getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const remainingDays = 14 - diffDays;

    // Build allDirections array for MarketIntelligence — includes roles from each direction
    const buildDirRoles = (roleData) => {
        const dir = roleData?.direction || {};
        return (dir.roles || []).filter(r => r && (r.role || typeof r === 'string'));
    };
    const allDirections = [
        { label: prefPrimary, directionName: primary?.direction?.directionName || prefPrimary, roles: buildDirRoles(primary) },
        { label: prefSecondary, directionName: secondary?.direction?.directionName || prefSecondary, roles: buildDirRoles(secondary) },
        { label: prefTertiary, directionName: tertiary?.direction?.directionName || prefTertiary, roles: buildDirRoles(tertiary) },
    ];


    // Prioritize role-specific roadmap data if available, fall back to global
    const roleSpecificTab4 = currentData?.tab4;
    const safeTab4 = roleSpecificTab4 || combined_tab4 || {
        learning_roadmap: [],
        projects: [],
        certifications: [],
        free_courses: [],
        skill_gap: { current_skills: [], missing_skills: [] }
    };

    const getScoreClass = (score) => {
        if (score >= 80) return 'green-clr';
        if (score >= 50) return 'amber-clr';
        return 'red-clr';
    };

    const panels = [
        { id: 'direction', label: t('career_agent.panels.direction', 'Direction Overview'), icon: <Compass size={18} stroke={1.5} /> },
        { id: 'roledetail', label: t('career_agent.panels.roledetail', 'Role Detailed View'), icon: <ClipboardList size={18} stroke={1.5} /> },
        { id: 'market', label: t('career_agent.panels.market', 'Market Intel'), icon: <BarChart3 size={18} stroke={1.5} /> },
        { id: 'skills', label: t('career_agent.panels.skills', 'Skill DNA'), icon: <Dna size={18} stroke={1.5} /> },
        { id: 'roadmap', label: t('career_agent.panels.roadmap', 'Career Roadmap'), icon: <Map size={18} stroke={1.5} /> },
        { id: 'certs', label: t('career_agent.panels.certs', 'Certifications'), icon: <Award size={18} stroke={1.5} /> },
        { id: 'interview', label: t('career_agent.panels.interview', 'Interview Prep'), icon: <Mic size={18} stroke={1.5} /> },
        { id: 'resume', label: t('career_agent.panels.resume', 'Resume Tips'), icon: <FileText size={18} stroke={1.5} /> }
    ];

    const matchScore = parseInt(currentData.match_explanation?.match(/\d+/) || 75);
    const isCareerLocked = lockStatus?.isLocked ?? false;

    return (
        <div className="career-agent-page">

            {/* ── Career Direction Lock: First Visit Modal ── */}
            <CareerFirstVisitModal
                isOpen={showFirstVisitModal && !showLockedModal}
                lockStatus={lockStatus}
                onStartAnalysis={() => {
                    setShowFirstVisitModal(false);
                    navigate('/dashboard/career-agent/onboarding');
                }}
                onRemindLater={() => setShowFirstVisitModal(false)}
            />

            {/* ── Career Direction Lock: Auto-Lock Notification Modal ── */}
            <CareerLockedModal
                isOpen={showLockedModal}
                lockStatus={lockStatus}
                onClose={() => setShowLockedModal(false)}
            />




            {/* ── Mobile Sidebar Drawer ── */}
            {showMobileSidebar && (
                <div
                    className="mobile-drawer-overlay"
                    onClick={() => setShowMobileSidebar(false)}
                >
                    <div
                        className="mobile-drawer"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mobile-drawer-header">
                            <div>
                                <div className="mobile-drawer-subtitle">{t('career_agent.drawer.title', 'SELECT SECTION')}</div>
                                <div className="mobile-drawer-title">{currentData?.tab1?.role_name || 'Career Path'}</div>
                            </div>
                            <button
                                onClick={() => setShowMobileSidebar(false)}
                                className="mobile-drawer-close"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mobile-drawer-content">
                            {panels.map(p => (
                                <button
                                    key={p.id}
                                    className={`mobile-drawer-item ${activePanel === p.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setActivePanel(p.id);
                                        setShowMobileSidebar(false);
                                    }}
                                >
                                    <span className="drawer-icon-wrap">{p.icon}</span>
                                    <span className="drawer-item-label">{p.label}</span>
                                    {activePanel === p.id && <div className="drawer-active-indicator" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <header className="dash-header">
                <div className="dash-top">
                    <div>
                        <div className="dash-name">{t('career_agent.header.title_start', 'Career ')}<span>{t('career_agent.header.title_span', 'Intelligence')}</span>{t('career_agent.header.title_end', ' Report')}</div>
                        <div className="dash-meta">
                            <span>{t('career_agent.header.candidate', 'CANDIDATE:')} {displayName}</span>
                            <span>|</span>
                            <span>{displayEmail}</span>
                        </div>
                    </div>
                    <div className="dash-actions">
                        <button
                            className="btn-ghost"
                            onClick={() => navigate('/dashboard')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border)' }}
                        >
                            <span className="hide-mobile">{t('career_agent.header.back', '← Back to Dashboard')}</span>
                            <span className="show-mobile-inline">← {t('common.back', 'Back')}</span>
                        </button>

                        <button
                            onClick={() => {
                                const next = theme === 'light' ? 'dark' : 'light';
                                setTheme(next);
                            }}
                            title="Toggle Theme"
                            className={`flex items-center justify-center w-[38px] h-[38px] rounded-full border transition-all duration-300 flex-shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${theme === 'dark'
                                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-[#1a3884]/30 hover:text-[#1a3884]'
                                }`}
                        >
                            {theme === 'dark' ? <Sun size={20} stroke={1.5} /> : <Moon size={20} stroke={1.5} />}
                        </button>


                        <button
                            className="btn-primary"
                            onClick={() => navigate('/dashboard/career-agent/onboarding')}
                            disabled={isCareerLocked}
                            style={{ opacity: isCareerLocked ? 0.5 : 1, cursor: isCareerLocked ? 'not-allowed' : 'pointer' }}
                            title={isCareerLocked ? "Your career direction is permanently locked." : "Start a new analysis"}
                        >
                            <span className="hide-mobile">{t('career_agent.header.new_analysis', 'New Analysis')}</span>
                            <span className="show-mobile-inline">{t('career_agent.header.new', 'New')}</span>
                        </button>
                    </div>
                </div>

                <div className="role-tabs-bar">
                    <button className={`rtab ${activeRole === 1 ? 'active' : ''}`} onClick={() => setActiveRole(1)}>
                        <Trophy size={15} stroke={1.5} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prefPrimary}</span>
                    </button>
                    <button className={`rtab ${activeRole === 2 ? 'active' : ''}`} onClick={() => setActiveRole(2)}>
                        <Medal size={15} stroke={1.5} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prefSecondary}</span>
                    </button>
                    <button className={`rtab ${activeRole === 3 ? 'active' : ''}`} onClick={() => setActiveRole(3)}>
                        <Target size={15} stroke={1.5} style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prefTertiary}</span>
                    </button>
                </div>
            </header>

            {/* Career Direction Lock Banner */}
            <CareerLockBanner lockStatus={lockStatus} />

            <div className="dash-body">
                <aside className="sidebar">
                    <div className="sb-header">
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                            Active Direction
                        </div>
                        <div className="sb-role-indicator">
                            <div className={`sb-role-dot ${activeRole === 1 ? 'green' : activeRole === 2 ? 'amber' : 'red'}`}></div>
                            <div className="sb-role-name" title={currentData?.tab1?.role_name || 'Loading...'}>
                                {currentData?.tab1?.role_name || 'Loading...'}
                            </div>
                        </div>
                    </div>



                    <div className="sidebar-nav">
                        {panels.map(p => (
                            <button
                                key={p.id}
                                className={`sitem ${activePanel === p.id ? 'active' : ''}`}
                                onClick={() => setActivePanel(p.id)}
                            >
                                <span className="si-icon-wrap">{p.icon}</span>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </aside>

                <main className="dash-main">
                    {/* Panel 1: Overview */}
                    {activePanel === 'overview' && (
                        <div className="panel animate-fade-in">
                            <div className="overview-hero">
                                <div className={`oh-card ${activeRole === 1 ? 'zone-green-card' : activeRole === 2 ? 'zone-primary' : 'zone-red-card'}`}>
                                    <div className="oh-card-label">{t('career_agent.overview.overall_match', 'Overall Match')}</div>
                                    <div className={`oh-pct ${getScoreClass(matchScore)}`}>{matchScore}%</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{t('career_agent.overview.alignment_prob', 'Alignment Probability')}</div>
                                </div>
                                <div className="oh-card" style={{ background: 'var(--navy3)', border: '1px solid var(--border)' }}>
                                    <div className="oh-card-label">{t('career_agent.overview.prep_time', 'Preparation Time')}</div>
                                    <div className="oh-pct" style={{ fontSize: '1.5rem', marginTop: '0.3rem' }}>{currentData?.preparation_time || 'N/A'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t('career_agent.overview.reach_green', 'To reach Green Zone')}</div>
                                </div>
                                <div className="oh-card" style={{ background: 'var(--navy3)', border: '1px solid var(--border)' }}>
                                    <div className="oh-card-label">{t('career_agent.overview.market_demand', 'Market Demand')}</div>
                                    <div className="oh-pct" style={{ fontSize: '1.5rem', color: 'var(--accent-text)', marginTop: '0.3rem' }}>{currentData?.tab1?.job_demand || 'Stable'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{t('career_agent.overview.hiring_velocity', 'Hiring Velocity')}</div>
                                </div>
                            </div>
                            <div className="ml-score-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="ri-label" style={{ color: 'var(--accent-text)', marginBottom: '0.4rem', fontSize: '1rem' }}>{t('career_agent.overview.role_function', 'What This Role Does')}</div>
                                        <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para1 || currentData?.tab1?.role_description || t('career_agent.overview.no_description', 'No description available.')}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: '2rem' }}>
                                        <div className={`ml-score-num ${getScoreClass(matchScore)}`}>{matchScore}</div>
                                        <div className="ri-label" style={{ fontSize: '0.55rem' }}>{t('career_agent.overview.ml_fit_score', 'ML FIT SCORE')}</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, width: '100%' }}>
                                    <div className="ri-label" style={{ color: 'var(--accent-text)', marginBottom: '0.4rem', fontSize: '1rem' }}>{t('career_agent.overview.ai_evolution', 'AI Evolution')}</div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para2 || currentData?.tab1?.ai_impact || t('career_agent.overview.ai_pending', 'AI assessment pending.')}</div>
                                </div>
                                <div style={{ flex: 1, width: '100%' }}>
                                    <div className="ri-label" style={{ color: 'var(--accent-text)', marginBottom: '0.4rem', fontSize: '1rem' }}>{t('career_agent.overview.who_consider', 'Who Should Consider')}</div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para3 || t('career_agent.overview.preparing_role', 'Preparing for this role...')}</div>
                                </div>
                            </div>
                            <div className="region-box">
                                <div className="ri-label">{t('career_agent.overview.market_signal', '📍 Tier-1 India Market Signal')}</div>
                                <div className="rb-stats">
                                    <div className="rb-stat">
                                        <div className="oh-card-label">{t('career_agent.overview.typical_employers', 'Typical Employers')}</div>
                                        <div className="rb-stat-num" style={{ fontSize: '0.8rem' }}>{currentData?.tab1?.typical_employers_india || 'MNCs & Startups'}</div>
                                    </div>
                                    <div className="rb-stat">
                                        <div className="oh-card-label">{t('career_agent.overview.common_entry', 'Common Entry')}</div>
                                        <div className="rb-stat-num" style={{ fontSize: '0.8rem' }}>{currentData?.tab1?.common_entry_paths || 'Campus Placement'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─────── Panel: Direction Overview ─────── */}
                    {activePanel === 'direction' && (
                        <div className="panel animate-fade-in">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Compass size={22} stroke={1.5} color="var(--accent-text)" /> {t('career_agent.panels.direction', 'Direction Overview')}
                                    </h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
                                        {t('career_agent.direction.desc', 'Your selected career direction and all roles within it — sourced from the SMAART Career Agent Database.')}
                                    </p>
                                </div>

                                {isCareerLocked && (
                                    /* Locked state badge */
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.55rem 1rem',
                                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                                        borderRadius: '10px',
                                        fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)',
                                        flexShrink: 0,
                                    }}>
                                        <Lock size={14} /> {t('career_agent.header.path_locked', 'Path Locked In')}
                                    </div>
                                )}
                            </div>
                            <DirectionOverview
                                directionData={currentData?.direction || null}
                                roleName={currentData?.tab1?.role_name || ''}
                            />
                        </div>
                    )}

                    {/* ─────── Panel: Role Detailed View ─────── */}
                    {activePanel === 'roledetail' && (
                        <div className="panel animate-fade-in">

                            {/* Header row with lock button */}
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={22} stroke={1.5} color="var(--accent-text)" /> {t('career_agent.panels.roledetail', 'Role Detailed View')}</h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>{t('career_agent.roledetail.desc_start', 'Reviewing ')}<strong style={{ color: 'var(--text2)' }}>{currentData.tab1.role_name}</strong>{t('career_agent.roledetail.desc_end', ' — confirm if this is your career path.')}</p>
                                </div>
                            </div>

                            <RoleDetailedView
                                roleName={currentData.tab1.role_name}
                                mongoRoleData={currentData}
                                direction={currentData.direction}
                            />
                        </div>
                    )}

                    {/* Panel 2: Market Intel */}
                    {activePanel === 'market' && (
                        <div className="panel animate-fade-in">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <h2 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BarChart3 size={22} stroke={1.5} color="var(--accent-text)" /> {t('career_agent.market.title', 'Market Intelligence')}
                                    </h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
                                        {t('career_agent.market.desc_start', 'Showing roles for ')}<strong style={{ color: 'var(--text2)' }}>
                                            {activeRole === 1 ? prefPrimary : activeRole === 2 ? prefSecondary : prefTertiary}
                                        </strong>{t('career_agent.market.desc_end', ' — select a role below to view its market data.')}
                                    </p>
                                </div>
                            </div>
                            <MarketIntelligence
                                roleName={roleName}
                                allDirections={allDirections}
                                activeTabIndex={activeRole - 1}
                            />
                        </div>
                    )}


                    {/* Panel 3: Skills */}
                    {activePanel === 'skills' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Dna size={22} stroke={1.5} color="var(--accent-text)" /> {t('career_agent.skills.title', 'Skills Overview')}</h2>
                            <SkillsPanel
                                roleName={roleName}
                                mongoRoleData={currentData}
                                direction={currentData.direction}
                            />
                        </div>
                    )}


                    {/* Panel 5: Roadmap */}
                    {activePanel === 'roadmap' && (
                        <div className="panel animate-fade-in" style={{ padding: '1.75rem' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.4rem', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <Compass size={24} color="var(--accent-text)" /> {t('career_agent.roadmap.title', 'SMAART Career Intelligence')}
                                </h2>
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '600px' }}>
                                    {t('career_agent.roadmap.desc_start', 'Your personalized acceleration path for ')}<strong style={{ color: 'var(--text2)' }}>{roleName}</strong>{t('career_agent.roadmap.desc_end', ', matched against your educational background and skill profile.')}
                                </p>
                            </div>

                            {/* LEARNING ROADMAP & MILESTONE STEPS (Now at Top) */}
                            <CareerRoadmap
                                roleName={roleName}
                                mongoRoleData={currentData}
                                direction={currentData.direction}
                            />

                            {/* DYNAMIC ROLE INTELLIGENCE & GAP ANALYSIS (Now at Last) */}
                            <CareerDirectionCard
                                roleName={roleName}
                                mongoRoleData={currentData}
                            />
                        </div>
                    )}



                    {/* Panel: Interview Prep */}
                    {activePanel === 'interview' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mic size={22} color="var(--accent-text)" /> {t('career_agent.interview.title', 'Interview Prep')}</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>{t('career_agent.interview.desc_start', 'Resources and questions tailored for ')}<strong style={{ color: 'var(--text2)' }}>{roleName}</strong>{t('career_agent.interview.desc_end', ' — aptitude, domain, technical & HR rounds.')}</p>
                            <InterviewPrep roleName={roleName} />
                        </div>
                    )}

                    {/* Panel: Resume Tips */}
                    {activePanel === 'resume' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={22} color="var(--accent-text)" /> {t('career_agent.resume.title', 'Resume Tips')}</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                                {t('career_agent.resume.desc_start', 'Build a strong, ATS-ready resume for ')}<strong style={{ color: 'var(--text2)' }}>{currentData.tab1.role_name}</strong>{t('career_agent.resume.desc_end', ' — structure, keywords, and an AI generator.')}
                            </p>
                            <ResumeTips roleName={currentData.tab1.role_name} />
                        </div>
                    )}

                    {/* Panel: Certifications */}
                    {activePanel === 'certs' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={22} color="var(--accent-text)" /> {t('career_agent.certs.title', 'Certifications')}</h2>
                            <Certifications
                                roleName={currentData.tab1.role_name}
                                directionName={currentData?.direction?.directionName || ''}
                                directionRoles={(currentData?.direction?.roles || []).map(r => typeof r === 'string' ? r : r.role)}
                            />
                        </div>
                    )}


                    {/* Placeholders for remaining panels */}
                    {!['direction', 'overview', 'roledetail', 'market', 'skills', 'roadmap', 'interview', 'resume', 'certs'].includes(activePanel) && (
                        <div className="panel animate-fade-in" style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
                            <h3>{panels.find(p => p.id === activePanel)?.label} Panel</h3>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>{t('career_agent.placeholders.processed_v7', 'This intelligence vector is currently being processed by the v7 analysis engine.')}</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CareerAgentDashboard;
