import './careerAgent.css';
import React, { useEffect, useState } from 'react';
import RoleDetailedView from './panels/RoleDetailedView';
import DirectionOverview from './panels/DirectionOverview';
import MarketIntelligence from './panels/MarketIntelligence';
import SkillsPanel from './panels/SkillsPanel';
import AIImplementation from './panels/AIImplementation';
import InterviewPrep from './panels/InterviewPrep';
import ResumeTips from './panels/ResumeTips';
import FutureScope from './panels/FutureScope';
import ProjectSpace from './panels/ProjectSpace';
import CareerRoadmap from './panels/CareerRoadmap';
import CareerDirectionCard from './panels/CareerDirectionCard';
import Certifications from './panels/Certifications';
import { useNavigate } from 'react-router-dom';
import { Compass, ClipboardList, BarChart3, Dna, Map, Award, Rocket, Bot, Mic, FileText, Code, Lock, Unlock, CheckCircle, Trophy, Medal, Target, Sparkles } from 'lucide-react';
const CareerAgentDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [activeRole, setActiveRole] = useState(1);
    const [activePanel, setActivePanel] = useState('direction');
    const [lockedRoles, setLockedRoles] = useState([]);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showSelectionFlow, setShowSelectionFlow] = useState(false);
    const [selectionStates, setSelectionStates] = useState({ primary: null, secondary: null, tertiary: null });

    const handleLockPath = (roleName) => {
        // Instead of immediate lock, show the selection flow
        setShowSelectionFlow(true);
    };

    const handleFinalizeLock = () => {
        const newlyLocked = [];
        if (selectionStates.primary === 'interested') newlyLocked.push(prefPrimary);
        if (selectionStates.secondary === 'interested') newlyLocked.push(prefSecondary);
        if (selectionStates.tertiary === 'interested') newlyLocked.push(prefTertiary);
        
        setLockedRoles(newlyLocked);
        setShowSelectionFlow(false);
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 3200);
    };

    useEffect(() => {
        const cached = localStorage.getItem('smaart_analysis');
        if (cached) {
            try {
                setData(JSON.parse(cached));
                setLoading(false);
            } catch (e) {
                console.error("Failed to parse analysis data:", e);
                navigate('/dashboard/career-agent/onboarding');
            }
        } else {
            navigate('/dashboard/career-agent/onboarding');
        }
    }, [navigate]);

    if (loading) {
        return (
            <div className="career-agent-page" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
                <div className="pulse-ring" style={{ width: '80px', height: '80px' }}></div>
                <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: '#f8fafc', border: '2px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(37,99,235,0.1)', position: 'relative', zIndex: 2 }}>
                    <Sparkles size={32} color="var(--accent)" className="animate-pulse" />
                </div>
                <h2 style={{ marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text1)' }}>Synchronizing Intelligence...</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Mapping your career trajectory</p>
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

    // Read user's originally selected preferences from onboarding
    const _draft = (() => { try { return JSON.parse(localStorage.getItem('smaart_onboarding_draft') || '{}'); } catch { return {}; } })();
    const _dp = _draft?.preferences || {};
    const prefPrimary = localStorage.getItem('smaart_pref_primary') || _dp.primary?.careerDirectionName || _dp.primary?.role || primary?.tab1?.role_name || 'Primary';
    const prefSecondary = localStorage.getItem('smaart_pref_secondary') || _dp.secondary?.careerDirectionName || _dp.secondary?.role || secondary?.tab1?.role_name || 'Secondary';
    const prefTertiary = localStorage.getItem('smaart_pref_tertiary') || _dp.tertiary?.careerDirectionName || _dp.tertiary?.role || tertiary?.tab1?.role_name || 'Tertiary';


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
        { id: 'direction', label: 'Direction Overview', icon: <Compass size={18} /> },
        { id: 'roledetail', label: 'Role Detailed View', icon: <ClipboardList size={18} /> },
        { id: 'market', label: 'Market Intel', icon: <BarChart3 size={18} /> },
        { id: 'skills', label: 'Skill DNA', icon: <Dna size={18} /> },
        { id: 'roadmap', label: 'Career Roadmap', icon: <Map size={18} /> },
        { id: 'certs', label: 'Certifications', icon: <Award size={18} /> },
        { id: 'future', label: 'Future Scope', icon: <Rocket size={18} /> },
        { id: 'ai', label: 'AI Implementation', icon: <Bot size={18} /> },
        { id: 'interview', label: 'Interview Prep', icon: <Mic size={18} /> },
        { id: 'resume', label: 'Resume Tips', icon: <FileText size={18} /> },
        { id: 'projects', label: 'Project Space', icon: <Code size={18} /> }
    ];

    const matchScore = parseInt(currentData.match_explanation?.match(/\d+/) || 75);

    return (
        <div className="career-agent-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: '56px' }}>

            {/* ── Selection Flow Modal ── */}
            {showSelectionFlow && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15, 23, 42, 0.94)', backdropFilter: 'blur(16px)',
                    animation: 'fadeIn 0.3s ease',
                    padding: '2rem'
                }}>
                    <div style={{ 
                        width: '100%', maxWidth: '1180px', maxHeight: '96vh',
                        display: 'flex', flexDirection: 'column', 
                        gap: '1.25rem', position: 'relative',
                        animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both'
                    }}>
                        <div style={{ textAlign: 'center', flexShrink: 0, animation: 'fadeIn 0.6s ease 0.1s both' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'white', marginBottom: '0.2rem', letterSpacing: '-0.02em' }}>Path Precision Selection</h2>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 500 }}>Confirm your interest level for each field.</p>
                        </div>

                        <div style={{ 
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem',
                            flex: 1, minHeight: 0
                        }}>
                            {[
                                { key: 'primary', label: 'Primary Path', data: primary, title: prefPrimary, delay: '0.2s' },
                                { key: 'secondary', label: 'Secondary Path', data: secondary, title: prefSecondary, delay: '0.3s' },
                                { key: 'tertiary', label: 'Tertiary Path', data: tertiary, title: prefTertiary, delay: '0.4s' }
                            ].map((item, idx) => (
                                <div key={item.key} style={{
                                    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px',
                                    padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                                    boxShadow: '0 15px 40px rgba(0,0,0,0.3)', overflow: 'hidden',
                                    animation: 'popIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
                                    animationDelay: item.delay
                                }}>
                                    <div style={{ flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.25rem' }}>
                                            {item.label}
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text)', margin: 0, lineHeight: 1.15 }}>{item.title}</h3>
                                    </div>

                                    {/* Role mini-list - Flexible height */}
                                    <div style={{ 
                                        flex: 1, overflowY: 'auto', padding: '0.75rem', minHeight: '100px', maxHeight: '220px',
                                        background: 'var(--navy2)', borderRadius: '12px', border: '1px solid var(--border)'
                                    }} className="custom-scrollbar">
                                        <div style={{ fontSize: '0.58rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '0.05em' }}>ROLES:</div>
                                        {(item.data?.direction?.roles || []).length > 0 ? (
                                            (item.data?.direction?.roles || []).map((r, i) => (
                                                <div key={i} style={{ fontSize: '0.78rem', color: 'var(--text)', padding: '0.45rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                                                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent)', opacity: 0.5 }} />
                                                    {r.role}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', marginTop: '1.5rem' }}>No specific roles listed</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
                                        <button 
                                            onClick={() => setSelectionStates(prev => ({ ...prev, [item.key]: 'interested' }))}
                                            style={{
                                                flex: 1, padding: '0.7rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800,
                                                background: selectionStates[item.key] === 'interested' ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                                border: '1.5px solid', 
                                                borderColor: selectionStates[item.key] === 'interested' ? 'var(--green)' : 'var(--border2)',
                                                color: selectionStates[item.key] === 'interested' ? 'var(--green)' : 'var(--muted)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectionStates[item.key] === 'interested' ? '0 4px 12px rgba(16, 185, 129, 0.1)' : 'none'
                                            }}
                                        >
                                            Interested
                                        </button>
                                        <button 
                                            onClick={() => setSelectionStates(prev => ({ ...prev, [item.key]: 'not_interested' }))}
                                            style={{
                                                flex: 1, padding: '0.7rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 800,
                                                background: selectionStates[item.key] === 'not_interested' ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                                                border: '1.5px solid', 
                                                borderColor: selectionStates[item.key] === 'not_interested' ? 'var(--red)' : 'var(--border2)',
                                                color: selectionStates[item.key] === 'not_interested' ? 'var(--red)' : 'var(--muted)',
                                                cursor: 'pointer', transition: 'all 0.2s',
                                                boxShadow: selectionStates[item.key] === 'not_interested' ? '0 4px 12px rgba(239, 68, 68, 0.08)' : 'none'
                                            }}
                                        >
                                            Not Interested
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexShrink: 0, marginTop: '0.5rem', animation: 'fadeIn 0.5s ease 0.6s both' }}>
                            <button 
                                onClick={() => setShowSelectionFlow(false)}
                                style={{ 
                                    padding: '0.8rem 2.2rem', borderRadius: '12px', 
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', 
                                    color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={!selectionStates.primary || !selectionStates.secondary || !selectionStates.tertiary}
                                onClick={handleFinalizeLock}
                                style={{ 
                                    padding: '0.8rem 3.5rem', borderRadius: '12px', 
                                    background: (!selectionStates.primary || !selectionStates.secondary || !selectionStates.tertiary) ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                                    color: 'white', fontWeight: 900, cursor: 'pointer', border: 'none',
                                    opacity: (!selectionStates.primary || !selectionStates.secondary || !selectionStates.tertiary) ? 0.3 : 1,
                                    boxShadow: (!selectionStates.primary || !selectionStates.secondary || !selectionStates.tertiary) ? 'none' : '0 12px 24px rgba(37,99,235,0.4)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Confirm Selection & Lock In
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Welcome Overlay ── */}
            {showWelcome && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 11000,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,14,26,0.92)', backdropFilter: 'blur(12px)',
                    animation: 'fadeIn 0.4s ease',
                }}>
                    {/* Animated ring */}
                    <div style={{
                        width: '88px', height: '88px', borderRadius: '50%',
                        border: '2px solid rgba(79,142,247,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1.75rem', position: 'relative',
                        animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
                    }}>
                        <div style={{
                            position: 'absolute', inset: '-6px', borderRadius: '50%',
                            border: '2px solid var(--accent)', opacity: 0.4,
                        }} />
                        <span style={{ display: 'flex', color: 'var(--accent)' }}><Lock size={40} /></span>
                    </div>
                    <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.18em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.6rem', animation: 'fadeIn 0.4s ease 0.3s both' }}>Path Confirmed</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.02em', marginBottom: '0.5rem', textAlign: 'center', maxWidth: '480px', animation: 'fadeIn 0.4s ease 0.4s both' }}>
                        Welcome to Your Journey
                    </div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '360px', lineHeight: 1.65, animation: 'fadeIn 0.4s ease 0.5s both' }}>
                        {lockedRoles.length > 1 
                            ? "You've successfully locked in your chosen career paths. Your multi-track SMAART roadmaps are ready."
                            : <span>You've locked in <strong style={{ color: 'var(--text2)' }}>{lockedRoles[0]}</strong> as your career path. Your SMAART roadmap is ready.</span>
                        }
                    </div>
                    <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeIn 0.4s ease 0.7s both' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1s ease infinite' }} />
                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600 }}>Closing automatically…</span>
                    </div>
                </div>
            )}
            <header className="dash-header">
                <div className="dash-top">
                    <div>
                        <div className="dash-name">Career <span>Intelligence</span> Report</div>
                        <div className="dash-meta" style={{ display: 'flex', gap: '1rem' }}>
                            <span>CANDIDATE: {localStorage.getItem('smaart_student_name') || 'Student'}</span>
                            <span style={{ color: 'var(--muted)' }}>|</span>
                            <span>{localStorage.getItem('smaart_student_email')}</span>
                        </div>
                    </div>
                    <div className="dash-actions" style={{ display: 'flex', gap: '0.6rem' }}>
                        <button className="btn-ghost" onClick={() => window.print()}>Print Report</button>
                        <button className="btn-primary" onClick={() => navigate('/dashboard/career-agent/onboarding')}>New Analysis</button>
                    </div>
                </div>

                <div className="role-tabs-bar">
                    <button className={`rtab ${activeRole === 1 ? 'active' : ''}`} onClick={() => setActiveRole(1)}>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: activeRole === 1 ? 700 : 600 }}>
                                <Trophy size={16} color={activeRole === 1 ? "var(--green)" : "var(--muted)"} /> {prefPrimary}
                            </span>
                        </span>
                    </button>
                    <button className={`rtab ${activeRole === 2 ? 'active' : ''}`} onClick={() => setActiveRole(2)}>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: activeRole === 2 ? 700 : 600 }}>
                                <Medal size={16} color={activeRole === 2 ? "var(--amber)" : "var(--muted)"} /> {prefSecondary}
                            </span>
                        </span>
                    </button>
                    <button className={`rtab ${activeRole === 3 ? 'active' : ''}`} onClick={() => setActiveRole(3)}>
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: activeRole === 3 ? 700 : 600 }}>
                                <Target size={16} color={activeRole === 3 ? "var(--red)" : "var(--muted)"} /> {prefTertiary}
                            </span>
                        </span>
                    </button>
                </div>
            </header>

            <div className="dash-body">
                <aside className="sidebar">
                    <div className="sb-header">
                        <div className="sb-role-indicator">
                            <div className={`sb-role-dot ${activeRole === 1 ? 'green' : activeRole === 2 ? 'amber' : 'red'}`}></div>
                            <div className="sb-role-name">{currentData?.tab1?.role_name || 'Loading...'}</div>
                        </div>
                    </div>

                    <div className="sidebar-nav" style={{ marginTop: '1rem' }}>
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

                    <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
                        <div className="ri-card" style={{ padding: '0.8rem', background: 'var(--navy3)' }}>
                            <div className="ri-label" style={{ fontSize: '0.55rem' }}>Account Status</div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>PREMIUM ACCESS</div>
                        </div>
                    </div>
                </aside>

                <main className="dash-main">
                    {/* Panel 1: Overview */}
                    {activePanel === 'overview' && (
                        <div className="panel animate-fade-in">
                            <div className="overview-hero">
                                <div className={`oh-card ${activeRole === 1 ? 'zone-green-card' : activeRole === 2 ? 'zone-primary' : 'zone-red-card'}`}>
                                    <div className="oh-card-label">Overall Match</div>
                                    <div className={`oh-pct ${getScoreClass(matchScore)}`}>{matchScore}%</div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>Alignment Probability</div>
                                </div>
                                <div className="oh-card" style={{ background: 'var(--navy3)', border: '1px solid var(--border)' }}>
                                    <div className="oh-card-label">Preparation Time</div>
                                    <div className="oh-pct" style={{ fontSize: '1.5rem', marginTop: '0.3rem' }}>{currentData?.preparation_time || 'N/A'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>To reach Green Zone</div>
                                </div>
                                <div className="oh-card" style={{ background: 'var(--navy3)', border: '1px solid var(--border)' }}>
                                    <div className="oh-card-label">Market Demand</div>
                                    <div className="oh-pct" style={{ fontSize: '1.5rem', color: 'var(--accent)', marginTop: '0.3rem' }}>{currentData?.tab1?.job_demand || 'Stable'}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Hiring Velocity</div>
                                </div>
                            </div>
                            <div className="ml-score-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="ri-label" style={{ color: 'var(--accent)', marginBottom: '0.4rem', fontSize: '1rem' }}>What This Role Does</div>
                                        <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para1 || currentData?.tab1?.role_description || 'No description available.'}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: '2rem' }}>
                                        <div className={`ml-score-num ${getScoreClass(matchScore)}`}>{matchScore}</div>
                                        <div className="ri-label" style={{ fontSize: '0.55rem' }}>ML FIT SCORE</div>
                                    </div>
                                </div>
                                <div style={{ flex: 1, width: '100%' }}>
                                    <div className="ri-label" style={{ color: 'var(--accent)', marginBottom: '0.4rem', fontSize: '1rem' }}>AI Evolution</div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para2 || currentData?.tab1?.ai_impact || 'AI assessment pending.'}</div>
                                </div>
                                <div style={{ flex: 1, width: '100%' }}>
                                    <div className="ri-label" style={{ color: 'var(--accent)', marginBottom: '0.4rem', fontSize: '1rem' }}>Who Should Consider</div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>{currentData?.tab1?.narrative_para3 || `Preparing for this role...`}</div>
                                </div>
                            </div>
                            <div className="region-box">
                                <div className="ri-label">📍 Tier-1 India Market Signal</div>
                                <div className="rb-stats">
                                    <div className="rb-stat">
                                        <div className="oh-card-label">Typical Employers</div>
                                        <div className="rb-stat-num" style={{ fontSize: '0.8rem' }}>{currentData?.tab1?.typical_employers_india || 'MNCs & Startups'}</div>
                                    </div>
                                    <div className="rb-stat">
                                        <div className="oh-card-label">Common Entry</div>
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
                                        <Compass size={22} color="var(--accent)" /> Direction Overview
                                    </h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
                                        Your selected career direction and all roles within it — sourced from the SMAART Career Agent Database.
                                    </p>
                                </div>

                                {lockedRoles.includes(currentData.tab1.role_name) ? (
                                    /* Locked state badge */
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.55rem 1rem',
                                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                                        borderRadius: '10px',
                                        fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)',
                                        flexShrink: 0,
                                    }}>
                                        <Lock size={14} /> Path Locked In
                                    </div>
                                ) : (
                                    /* Lock button */
                                    <button
                                        onClick={() => handleLockPath(currentData.tab1.role_name)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.6rem 1.2rem',
                                            background: 'var(--navy2)', border: '1px solid var(--border)',
                                            borderRadius: '10px', cursor: 'pointer',
                                            fontSize: '0.8rem', fontWeight: 700, color: 'var(--text1)',
                                            transition: 'all 0.2s', flexShrink: 0,
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,142,247,0.5)'; e.currentTarget.style.color = 'var(--accent)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text1)'; }}
                                    >
                                        <Lock size={14} /> Lock In This Path
                                    </button>
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
                                    <h2 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ClipboardList size={22} color="var(--accent)" /> Role Detailed View</h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>Reviewing <strong style={{ color: 'var(--text2)' }}>{currentData.tab1.role_name}</strong> — confirm if this is your career path.</p>
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
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={22} color="var(--accent)" /> Market Intelligence</h2>
                            <MarketIntelligence
                                roleName={roleName}
                                mongoRoleData={currentData}
                                fallback={currentData.tab1}
                            />
                        </div>
                    )}

                    {/* Panel 3: Skills */}
                    {activePanel === 'skills' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Dna size={22} color="var(--accent)" /> Skills Overview</h2>
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
                                    <Compass size={24} color="var(--accent)" /> SMAART Career Intelligence
                                </h2>
                                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '600px' }}>
                                    Your personalized acceleration path for <strong style={{ color: 'var(--text2)' }}>{roleName}</strong>, matched against your educational background and skill profile.
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

                    {/* Panel 7: Future Scope */}
                    {activePanel === 'future' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Rocket size={22} color="var(--accent)" /> Future Trajectory & Growth</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                                Salary progression, role evolution, and who this path suits best — based on <strong style={{ color: 'var(--text2)' }}>{roleName}</strong>.
                            </p>
                            <FutureScope
                                roleName={roleName}
                                mongoRoleData={currentData}
                                futureScope={currentData.tab5?.future_scope}
                                targetAudience={currentData.tab5?.target_audience}
                            />
                        </div>
                    )}

                    {/* Panel 8: AI Implementation */}
                    {activePanel === 'ai' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Bot size={22} color="var(--accent)" /> AI Implementation in Role</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>How AI is reshaping <strong style={{ color: 'var(--text2)' }}>{roleName}</strong> — exposure analysis, AI-native skills, and what remains irreplaceably human.</p>
                            <AIImplementation
                                roleName={roleName}
                                mongoRoleData={currentData}
                                fallback={currentData.tab3}
                            />
                        </div>
                    )}

                    {/* Panel 11: Project Space */}
                    {activePanel === 'projects' && (
                        <div className="panel animate-fade-in">
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 style={{ margin: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Code size={22} color="var(--accent)" /> Project Space</h2>
                                    <p style={{ color: 'var(--muted)', fontSize: '0.78rem', margin: 0 }}>
                                        High-impact blueprint builds that prove your skills for <strong style={{ color: 'var(--text2)' }}>{roleName}</strong>.
                                    </p>
                                </div>
                                {lockedRoles.length > 0 && (
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.45rem 0.9rem',
                                        background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                                        borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--green)',
                                    }}>
                                        <Unlock size={14} /> Unlocked
                                    </div>
                                )}
                            </div>
 
                            <ProjectSpace
                                projects={safeTab4.projects || []}
                                locked={lockedRoles.length === 0}
                                roleName={roleName}
                                onUnlockClick={() => setActivePanel('roledetail')}
                            />
                        </div>
                    )}

                    {/* Panel: Interview Prep */}
                    {activePanel === 'interview' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mic size={22} color="var(--accent)" /> Interview Prep</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>Resources and questions tailored for <strong style={{ color: 'var(--text2)' }}>{roleName}</strong> — aptitude, domain, technical &amp; HR rounds.</p>
                            <InterviewPrep roleName={roleName} />
                        </div>
                    )}

                    {/* Panel: Resume Tips */}
                    {activePanel === 'resume' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={22} color="var(--accent)" /> Resume Tips</h2>
                            <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
                                Build a strong, ATS-ready resume for <strong style={{ color: 'var(--text2)' }}>{currentData.tab1.role_name}</strong> — structure, keywords, and an AI generator.
                            </p>
                            <ResumeTips roleName={currentData.tab1.role_name} />
                        </div>
                    )}

                    {/* Panel: Certifications */}
                    {activePanel === 'certs' && (
                        <div className="panel animate-fade-in">
                            <h2 style={{ marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Award size={22} color="var(--accent)" /> Certifications</h2>
                            <Certifications roleName={currentData.tab1.role_name} />
                        </div>
                    )}

                    {/* Placeholders for remaining panels */}
                    {!['direction', 'overview', 'roledetail', 'market', 'skills', 'roadmap', 'future', 'ai', 'projects', 'interview', 'resume', 'certs'].includes(activePanel) && (
                        <div className="panel animate-fade-in" style={{ textAlign: 'center', padding: '5rem 0' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
                            <h3>{panels.find(p => p.id === activePanel)?.label} Panel</h3>
                            <p style={{ color: 'var(--muted)', marginTop: '0.5rem' }}>This intelligence vector is currently being processed by the v7 analysis engine.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default CareerAgentDashboard;
