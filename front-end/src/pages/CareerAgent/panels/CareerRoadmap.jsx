import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Network, Terminal, ShieldCheck, Zap, X, Upload, CheckCircle, Target, FileText, AlertTriangle, RotateCcw, Map } from '@/components/icons';
import { Spinner, EmptyState, CardHead } from './shared';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';

const CareerRoadmap = ({ roleName, mongoRoleData, direction }) => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [roadmap, setRoadmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [skillProgress, setSkillProgress] = useState({});
    const [totalRolesCount, setTotalRolesCount] = useState(0);
    const [certModal, setCertModal] = useState(null); // { skillName } or null
    const [inProgressModal, setInProgressModal] = useState(null); // { skillName } or null

    // Get user properly from sessionStorage first, fallback to old localStorage if needed
    const userStr = sessionStorage.getItem('user');
    const parsedUser = userStr ? JSON.parse(userStr) : {};
    const legacyUser = JSON.parse(localStorage.getItem('smaart_user') || '{}');
    const userEmail = parsedUser.email || legacyUser.email || 'guest@smaart.edu';

    useEffect(() => {
        const fetchManualRoadmap = async () => {
            try {
                setLoading(true);

                // 1. Fetch existing progress
                try {
                    const token = sessionStorage.getItem('token');
                    const progRes = await fetch(`/api/career-agent/user-skills/${encodeURIComponent(userEmail)}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (progRes.ok) {
                        const progData = await progRes.json();
                        const progMap = {};
                        progData.forEach(p => progMap[p.skillName] = p.status);
                        setSkillProgress(progMap);
                    }
                } catch (pe) {
                    console.warn('Failed to fetch skill progress:', pe);
                }

                // 2. Resolve Family Roles
                let roles = [];
                if (direction?.roles && direction.roles.length > 0) {
                    roles = direction.roles.map(r => typeof r === 'string' ? r : (r.role || r.role_name));
                }

                // Fallback: Resolve Job Family siblings if direction is empty
                if (roles.length === 0) {
                    const jf = mongoRoleData?.job_family || mongoRoleData?.tab1?.job_family ||
                        mongoRoleData?.job_family_name || mongoRoleData?.tab1?.job_family_name;
                    if (jf) {
                        const cleanFamily = jf.split(' ')[0];
                        const familyRes = await fetch(`/api/career-agent/role-skills/family/${encodeURIComponent(cleanFamily)}`);
                        if (familyRes.ok) roles = await familyRes.json();
                    }
                }

                const targetRoles = roles.filter(r => r && r.toLowerCase() !== 'software engineer');

                if (targetRoles.length === 0) {
                    setLoading(false);
                    return;
                }

                // 3. Fetch skills for each role in parallel
                const skillSets = await Promise.all(
                    targetRoles.map(async (role) => {
                        try {
                            const res = await fetch(`/api/career-agent/role-skills/${encodeURIComponent(role)}`);
                            if (!res.ok) return [];
                            const data = await res.json();
                            return data.skills || [];
                        } catch (e) {
                            return [];
                        }
                    })
                );

                // 4. Aggregate and Calculate Overlap
                const frequencyMap = {};
                targetRoles.forEach((role, idx) => {
                    const set = skillSets[idx];
                    set.forEach(s => {
                        const key = s.skillName;
                        if (!frequencyMap[key]) {
                            frequencyMap[key] = {
                                name: key,
                                count: 0,
                                category: s.skillCategory,
                                importance: s.importance,
                                roles: []
                            };
                        }
                        frequencyMap[key].count += 1;
                        if (!frequencyMap[key].roles.includes(role)) {
                            frequencyMap[key].roles.push(role);
                        }
                    });
                });

                const totalRoles = targetRoles.length;
                setTotalRolesCount(totalRoles);
                const aggregated = Object.values(frequencyMap)
                    .map(s => ({
                        ...s,
                        overlap: Math.round((s.count / totalRoles) * 100)
                    }))
                    .sort((a, b) => b.count - a.count || b.overlap - a.overlap);

                setRoadmap(aggregated);
            } catch (e) {
                console.error('Roadmap Aggregation Error:', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchManualRoadmap();
    }, [direction, mongoRoleData, roleName, userEmail]);

    const handleStatusChange = async (skillName, newStatus) => {
        if (newStatus === 'Completed') {
            try {
                const res = await fetch(`/api/assessments/skill/${encodeURIComponent(skillName)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        // Assessment exists, navigate to the skill assessment player!
                        navigate(`/skill-assessment/${encodeURIComponent(skillName)}`);
                        return;
                    }
                }
            } catch (e) {
                console.error("Error checking skill assessment:", e);
            }
            // Open certificate modal instead of marking directly (fallback)
            setCertModal({ skillName });
            return;
        }
        setSkillProgress(prev => ({ ...prev, [skillName]: newStatus }));
        try {
            await fetch('/api/career-agent/user-skills/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, skillName, status: newStatus })
            });
        } catch (e) {
            console.error('Failed to update status:', e);
        }
    };

    const handleCertConfirm = async (skillName, file) => {
        setCertModal(null);
        setSkillProgress(prev => ({ ...prev, [skillName]: 'Completed' }));
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

    if (loading) return <Spinner text="Building your multi-role roadmap…" />;

    if (!roadmap.length) {
        return (
            <EmptyState
                icon={<Network size={24} />}
                title="Roadmap not available yet"
                text="We could not aggregate enough mapped skills from this direction's roles to build a roadmap."
            />
        );
    }

    const foundation = roadmap.filter(s => s.overlap >= 70);
    const growth = roadmap.filter(s => s.overlap >= 30 && s.overlap < 70);
    const mastery = roadmap.filter(s => s.overlap < 30);
    const doneCount = roadmap.filter(s => skillProgress[s.name] === 'Completed').length;
    const doingCount = roadmap.filter(s => skillProgress[s.name] === 'In Progress').length;
    const pct = roadmap.length ? Math.round((doneCount / roadmap.length) * 100) : 0;

    const PHASES = [
        { title: 'Foundational skills', sub: `Needed by 70%+ of the ${totalRolesCount} roles — start here`, icon: <ShieldCheck size={20} />, items: foundation },
        { title: 'Specialisation skills', sub: 'Needed by 30–70% of roles — build depth', icon: <Terminal size={20} />, items: growth },
        { title: 'Edge skills', sub: 'Niche skills that set you apart for specific roles', icon: <Zap size={20} />, items: mastery },
    ].filter(p => p.items.length > 0);

    return (
        <div className="rm animate-fade-in">
            {certModal && (
                <CertificateModal
                    skillName={certModal.skillName}
                    onConfirm={handleCertConfirm}
                    onClose={() => setCertModal(null)}
                    theme={theme}
                />
            )}
            {inProgressModal && (
                <InProgressModal
                    skillName={inProgressModal.skillName}
                    onConfirm={() => {
                        handleStatusChange(inProgressModal.skillName, 'In Progress');
                        setInProgressModal(null);
                    }}
                    onClose={() => setInProgressModal(null)}
                    theme={theme}
                />
            )}

            {/* Progress summary */}
            <div className="rm-summary">
                <div className="stat">
                    <div className="stat-k">Overall progress</div>
                    <div className="stat-v brand">{pct}%</div>
                    <div className="meter" style={{ marginTop: 6 }}><i style={{ width: `${pct}%` }} /></div>
                </div>
                <div className="stat"><div className="stat-k">Skills in roadmap</div><div className="stat-v">{roadmap.length}</div><div className="stat-s">across {totalRolesCount} roles</div></div>
                <div className="stat"><div className="stat-k">In progress</div><div className="stat-v">{doingCount}</div><div className="stat-s">currently learning</div></div>
                <div className="stat"><div className="stat-k">Completed</div><div className="stat-v" style={{ color: 'var(--green)' }}>{doneCount}</div><div className="stat-s">verified or marked done</div></div>
            </div>

            <div className="dp-card soft" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent-text)', display: 'flex' }}><Map size={18} /></span>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                    Skills are ordered by how many of this direction's roles need them. Hover a skill to see which roles need it; mark a skill <strong style={{ fontWeight: 600, color: 'var(--text1)' }}>In progress</strong> or <strong style={{ fontWeight: 600, color: 'var(--text1)' }}>Done</strong> to track your progress.
                </span>
            </div>

            {PHASES.map(ph => (
                <RoadmapPhase
                    key={ph.title}
                    title={ph.title}
                    sub={ph.sub}
                    icon={ph.icon}
                    items={ph.items}
                    skillProgress={skillProgress}
                    onStatusChange={handleStatusChange}
                    onInProgress={setInProgressModal}
                    totalRoles={totalRolesCount}
                />
            ))}
        </div>
    );
};

const RoadmapPhase = ({ title, sub, icon, items, skillProgress, onStatusChange, onInProgress, totalRoles }) => (
    <div className="dp-card">
        <CardHead icon={icon} title={title} sub={sub} right={<span className="dchip">{items.length} skills</span>} />
        <div className="rm-grid">
            {items.map((item) => (
                <SkillCard
                    key={item.name}
                    item={item}
                    status={skillProgress[item.name] || 'Not Started'}
                    onStatusChange={onStatusChange}
                    onInProgress={onInProgress}
                    totalRoles={totalRoles}
                />
            ))}
        </div>
    </div>
);

const SkillCard = ({ item, status, onStatusChange, onInProgress, totalRoles }) => {
    const [tip, setTip] = useState(false);
    const done = status === 'Completed';
    const doing = status === 'In Progress';
    return (
        <div className={`rm-card${done ? ' done' : doing ? ' doing' : ''}`}>
            <div className="rm-top">
                <span className="rm-name">{item.name}</span>
                <span className="rm-count" onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
                    {item.count}/{totalRoles} roles
                    {tip && (
                        <div className="rm-tip">
                            <div className="rm-tip-h">Needed for</div>
                            {item.roles.map((r, i) => <div key={i} className="rm-tip-i">{r}</div>)}
                        </div>
                    )}
                </span>
            </div>
            <div className="rm-meta">
                <span>{item.category || 'Competency'}</span>
                {done && <span className="status-chip done"><CheckCircle size={12} /> Done</span>}
                {doing && <span className="status-chip doing">In progress</span>}
            </div>
            {!done && (
                <div className="rm-actions">
                    {!doing ? (
                        <button type="button" className="rm-btn" onClick={(e) => { e.stopPropagation(); onInProgress({ skillName: item.name }); }}>
                            Start
                        </button>
                    ) : (
                        <button type="button" className="rm-btn" title="Undo In Progress" onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Not Started'); }}>
                            <RotateCcw size={13} /> Undo
                        </button>
                    )}
                    <button type="button" className="rm-btn primary" onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Completed'); }}>
                        <CheckCircle size={13} /> Done
                    </button>
                </div>
            )}
        </div>
    );
};

/* ── In Progress Confirmation Modal ── */
const InProgressModal = ({ skillName, onConfirm, onClose, theme }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const C = {
        bg:      isDark ? '#0f1729' : '#ffffff',
        surface: isDark ? '#141f35' : '#f8fafc',
        border:  isDark ? 'rgba(255,255,255,0.09)' : '#d7ebf5',
        text1:   isDark ? '#f1f5f9' : '#072036',
        text2:   isDark ? '#94a3b8' : '#475569',
        muted:   isDark ? '#64748b' : '#94a3b8',
        btnBg:   isDark ? '#1e2d48' : '#f1f5f9',
    };

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.15s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: '20px',
                    width: '100%', maxWidth: '380px',
                    overflow: 'hidden',
                    boxShadow: isDark
                        ? '0 32px 64px -16px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)'
                        : '0 20px 50px -10px rgba(0,0,0,0.18)',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div style={{ height: '4px', background: 'var(--accent)' }} />

                {/* Body */}
                <div style={{ padding: '1.8rem 1.5rem 1.2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{
                        width: '54px', height: '54px', borderRadius: '50%',
                        background: 'var(--accent-tint)',
                        border: '1px solid var(--accent-border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#045C9A',
                    }}><Target size={26} /></div>

                    <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.text1, marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                            Start Learning?
                        </div>
                        <div style={{ fontSize: '0.82rem', color: C.text2, lineHeight: 1.6 }}>
                            Mark <strong style={{ color: C.text1 }}>&#34;{skillName}&#34;</strong> as{' '}
                            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>In Progress</span>?<br />
                            <span style={{ color: C.muted, fontSize: '0.76rem' }}>You can undo this at any time.</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: '0.6rem',
                    padding: '1rem 1.5rem',
                    borderTop: `1px solid ${C.border}`,
                    background: C.surface,
                    justifyContent: 'flex-end',
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.55rem 1.2rem',
                            background: C.btnBg, color: C.text2,
                            border: `1px solid ${C.border}`, borderRadius: '9px',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.55rem 1.4rem',
                            background: 'var(--accent2)',
                            color: '#ffffff',
                            border: '1px solid var(--accent2)',
                            borderRadius: '9px',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            boxShadow: 'none',
                        }}
                    >
                        Yes, Start Learning
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

/* ── Certificate Modal ── */
const CertificateModal = ({ skillName, onConfirm, onClose, theme }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [verified, setVerified] = useState(false);
    const [skipCert, setSkipCert] = useState(false);
    const fileInputRef = useRef(null);

    // Use the app's actual theme value; only fall back to OS for 'system' mode
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleFile = (f) => {
        if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
            setFile(f);
            setVerified(false);
            setSkipCert(false);
        }
    };

    const handleVerify = () => { if (file) setVerified(true); };
    const canConfirm = verified || skipCert;
    const handleConfirm = () => { onConfirm(skillName, file); };

    const step = !file && !skipCert ? 1 : (file && !verified) ? 2 : 3;

    const C = {
        bg:       isDark ? '#0f1729' : '#ffffff',
        surface:  isDark ? '#141f35' : '#f8fafc',
        border:   isDark ? 'rgba(255,255,255,0.09)' : '#d7ebf5',
        text1:    isDark ? '#f1f5f9' : '#072036',
        text2:    isDark ? '#94a3b8' : '#475569',
        muted:    isDark ? '#64748b' : '#94a3b8',
        accent:   'var(--accent)',
        accentBg: isDark ? 'rgba(4,92,154,0.22)' : '#EAF7FD',
        accentBorder: isDark ? 'rgba(166,215,232,0.35)' : 'rgba(4,92,154,0.25)',
        dropBg:   isDark ? '#111827' : '#f8fafc',
        btnBg:    isDark ? '#1e2d48' : '#f1f5f9',
    };

    const STEPS = ['Upload', 'Verify', 'Confirm'];

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.18s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: '24px',
                    width: '100%', maxWidth: '460px',
                    overflow: 'hidden',
                    boxShadow: isDark
                        ? '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)'
                        : '0 24px 60px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
                    position: 'relative',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Accent gradient bar */}
                <div style={{
                    height: '4px',
                    background: 'var(--accent)',
                }} />

                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '1.4rem 1.5rem 1.1rem',
                    borderBottom: `1px solid ${C.border}`,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {/* Tag pill */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'var(--accent)',
                            background: C.accentBg,
                            border: `1px solid ${C.accentBorder}`,
                            padding: '0.22rem 0.6rem', borderRadius: '100px', width: 'fit-content',
                        }}>
                            <CheckCircle size={9} />
                            Mark as Completed
                        </div>
                        {/* Skill name */}
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text1, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                            {skillName}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: C.surface, border: `1px solid ${C.border}`,
                            cursor: 'pointer', color: C.text2,
                            padding: '0.4rem', borderRadius: '9px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0, marginTop: '0.1rem',
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Step Tracker */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem 1.5rem',
                    background: C.surface,
                    borderBottom: `1px solid ${C.border}`,
                    gap: '0',
                }}>
                    {STEPS.map((s, i) => {
                        const isActive = step === i + 1;
                        const isDone   = step > i + 1;
                        return (
                            <React.Fragment key={s}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.25s',
                                        background: isDone ? '#059669' : isActive ? 'var(--accent)' : C.btnBg,
                                        border: isDone ? '2px solid #059669' : isActive ? '2px solid var(--accent)' : `2px solid ${C.border}`,
                                        boxShadow: isActive ? '0 0 0 4px rgba(4,92,154,0.15)' : 'none',
                                    }}>
                                        {isDone
                                            ? <CheckCircle size={13} color="#fff" />
                                            : <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isActive ? '#fff' : C.muted }}>{i + 1}</span>
                                        }
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color: isDone ? '#059669' : isActive ? C.text1 : C.muted,
                                        transition: 'color 0.2s',
                                    }}>
                                        {s}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        width: '48px', height: '2px',
                                        margin: '0 0.4rem',
                                        marginBottom: '1.1rem',
                                        background: step > i + 1 ? '#059669' : C.border,
                                        transition: 'background 0.3s',
                                        borderRadius: '2px',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Body */}
                <div style={{ padding: '1.4rem 1.5rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Drop Zone */}
                    <div
                        style={{
                            border: `2px dashed ${dragOver ? 'var(--accent)' : verified ? '#059669' : file ? 'rgba(16,185,129,0.5)' : C.border}`,
                            borderRadius: '16px',
                            padding: '2.2rem 1.5rem',
                            textAlign: 'center', cursor: verified ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                            userSelect: 'none',
                            background: verified
                                ? 'rgba(16,185,129,0.06)'
                                : dragOver
                                    ? C.accentBg
                                    : C.dropBg,
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !verified && fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                        {verified ? (
                            <>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%',
                                    background: 'rgba(16,185,129,0.12)',
                                    border: '2px solid rgba(16,185,129,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CheckCircle size={26} color="#059669" />
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#059669' }}>Certificate Verified</div>
                                <div style={{ fontSize: '0.72rem', color: C.muted, maxWidth: '260px', wordBreak: 'break-all' }}>{file.name}</div>
                            </>
                        ) : file ? (
                            <>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    background: 'rgba(16,185,129,0.1)',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#059669',
                                }}><FileText size={24} /></div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>{file.name}</div>
                                <div style={{ fontSize: '0.72rem', color: C.muted }}>{(file.size / 1024).toFixed(1)} KB &middot; Click to change</div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: C.btnBg,
                                    border: `1px solid ${C.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}>
                                    <Upload size={22} color={C.muted} />
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text1, lineHeight: 1.4 }}>
                                    Drop your certificate here or{' '}
                                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>browse files</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: C.muted }}>PDF, JPG or PNG accepted</div>
                            </>
                        )}
                    </div>

                    {/* Action row */}
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {file && !verified && (
                            <button
                                onClick={handleVerify}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.55rem 1.1rem',
                                    background: C.accentBg, color: 'var(--accent)',
                                    border: `1px solid ${C.accentBorder}`, borderRadius: '9px',
                                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <CheckCircle size={13} /> Verify Certificate
                            </button>
                        )}
                        {!skipCert && !verified && (
                            <button
                                onClick={() => setSkipCert(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '0.55rem 1rem',
                                    background: 'transparent', color: C.text2,
                                    border: `1px solid ${C.border}`, borderRadius: '9px',
                                    fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                Skip - Mark Without Certificate
                            </button>
                        )}
                        {skipCert && (
                            <div style={{
                                fontSize: '0.74rem', color: '#f59e0b',
                                padding: '0.45rem 0.8rem',
                                background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.22)',
                                borderRadius: '9px',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}>
                                <AlertTriangle size={14} /> Marking as complete without a certificate
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: '0.65rem',
                    padding: '1rem 1.5rem',
                    borderTop: `1px solid ${C.border}`,
                    justifyContent: 'flex-end',
                    background: C.surface,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.3rem',
                            background: C.btnBg, color: C.text2,
                            border: `1px solid ${C.border}`, borderRadius: '10px',
                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.6rem 1.4rem',
                            background: canConfirm ? 'var(--accent2)' : C.btnBg,
                            color: canConfirm ? '#ffffff' : C.muted,
                            border: canConfirm ? '1px solid var(--accent2)' : `1px solid ${C.border}`,
                            borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                            transition: 'all 0.2s',
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                            boxShadow: 'none',
                        }}
                    >
                        <CheckCircle size={14} />
                        {verified ? 'Complete with Certificate' : 'Mark as Completed'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CareerRoadmap;

