import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Network, Terminal, ShieldCheck, Zap, X, Upload, CheckCircle } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const CareerRoadmap = ({ roleName, mongoRoleData, direction }) => {
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
            // Open certificate modal instead of marking directly
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

    if (loading) {
        return (
            <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.85rem' }}>Building multi-role roadmap intelligence...</p>
            </div>
        );
    }

    if (!roadmap.length) {
        return (
            <div style={styles.unavailableWrap}>
                <div style={styles.iconGhost}><Network size={48} /></div>
                <h3 style={{ color: 'var(--text1)', marginBottom: '0.5rem' }}>Dynamic Roadmap Unavailable</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', maxWidth: '400px' }}>
                    We couldn't aggregate enough skills from this job family to build a roadmap.
                </p>
            </div>
        );
    }

    const foundation = roadmap.filter(s => s.overlap >= 70);
    const growth = roadmap.filter(s => s.overlap >= 30 && s.overlap < 70);
    const mastery = roadmap.filter(s => s.overlap < 30);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={styles.roadmapHeader}>
                <h2 style={styles.title}>Dynamic Career Roadmap</h2>
                <p style={styles.subtitle}>
                    Strategic learning path based on skill overlaps across all {totalRolesCount} roles within this family.
                    Foundational skills appear first, followed by niche specializations
                </p>
            </div>

            {/* Certificate Upload Modal */}
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

            <div style={styles.roadmapFlow}>
                {foundation.length > 0 && <RoadmapPhase title="Foundational Skills" icon={ShieldCheck} items={foundation} color="var(--accent)" skillProgress={skillProgress} onStatusChange={handleStatusChange} onInProgress={setInProgressModal} totalRoles={totalRolesCount} />}
                {growth.length > 0 && <RoadmapPhase title="Specialization Skills" icon={Terminal} items={growth} color="var(--accent2)" skillProgress={skillProgress} onStatusChange={handleStatusChange} onInProgress={setInProgressModal} totalRoles={totalRolesCount} />}
                {mastery.length > 0 && <RoadmapPhase title="Edge Skills" icon={Zap} items={mastery} color="#a78bfa" skillProgress={skillProgress} onStatusChange={handleStatusChange} onInProgress={setInProgressModal} totalRoles={totalRolesCount} />}
            </div>
        </div>
    );
};

const RoadmapPhase = ({ title, icon: Icon, items, color, skillProgress, onStatusChange, onInProgress, totalRoles }) => (
    <div style={styles.phaseWrap}>
        <div style={{ ...styles.phaseLine, background: `linear-gradient(to bottom, ${color}, transparent)` }} />
        <div style={styles.phaseHeader}>
            <div style={{ ...styles.phaseIcon, borderColor: color, color: color }}><Icon size={18} /></div>
            <h3 style={{ ...styles.phaseTitle, color: color }}>{title}</h3>
        </div>
        <div style={styles.phaseGrid}>
            {items.map((item, idx) => (
                <SkillCard
                    key={idx}
                    item={item}
                    color={color}
                    status={skillProgress[item.name] || 'Not Started'}
                    onStatusChange={onStatusChange}
                    onInProgress={onInProgress}
                    totalRoles={totalRoles}
                />
            ))}
        </div>
    </div>
);

const SkillCard = ({ item, color, status, onStatusChange, onInProgress, totalRoles }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    const getStatusStyle = (s) => {
        switch (s) {
            case 'Completed': return { background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.2)' };
            case 'In Progress': return { background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' };
            default: return { background: 'rgba(148, 163, 184, 0.1)', color: '#64748b', border: '1px solid rgba(148, 163, 184, 0.2)' };
        }
    };

    return (
        <div
            style={{
                ...styles.skillCard,
                borderColor: isHovered ? color : 'var(--border)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                background: isHovered ? 'var(--navy3)' : 'var(--navy2)',
                boxShadow: isHovered ? `0 10px 20px -5px rgba(0,0,0,0.15)` : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
        >
            <div style={styles.skillTop}>
                <span style={{ ...styles.skillName, color: isHovered ? 'var(--text1)' : 'var(--text2)' }}>{item.name}</span>
                <div
                    style={{ ...styles.overlapTag, background: color === 'var(--accent)' ? 'var(--accent-tint)' : 'rgba(34,211,238, 0.1)', color: color, cursor: 'help', position: 'relative' }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    {item.count}/{totalRoles} Roles

                    {showTooltip && (
                        <div style={styles.customTooltip}>
                            <div style={styles.tooltipHeader}>Required for:</div>
                            <div style={styles.tooltipList}>
                                {item.roles.map((r, i) => (
                                    <div key={i} style={styles.tooltipItem}>&bull; {r}</div>
                                ))}
                            </div>
                            <div style={styles.tooltipArrow} />
                        </div>
                    )}
                </div>
            </div>

            <div style={styles.skillMeta}>
                <span style={{ color: 'var(--muted)' }}>{item.category || 'Competency'}</span>
                {status !== 'Not Started' && (
                    <span style={{ ...styles.statusBadge, ...getStatusStyle(status) }}>
                        {status}
                    </span>
                )}
            </div>

            {status !== 'Completed' && (
                <div style={{ ...styles.progressActions, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(5px)' }}>
                    {status !== 'In Progress' ? (
                        <button
                            onClick={(e) => { e.stopPropagation(); onInProgress({ skillName: item.name }); }}
                            style={{ ...styles.actionBtn, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                        >
                            In Progress
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Not Started'); }}
                            style={{ ...styles.actionBtn, background: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.25)' }}
                            title="Undo In Progress"
                        >
                            ↩ Undo
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Completed'); }}
                        style={{ ...styles.actionBtn, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                        Mark Done
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
        border:  isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0',
        text1:   isDark ? '#f1f5f9' : '#0f172a',
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
                <div style={{ height: '4px', background: 'linear-gradient(90deg, #3b82f6, #6366f1)' }} />

                {/* Body */}
                <div style={{ padding: '1.8rem 1.5rem 1.2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                    <div style={{
                        width: '54px', height: '54px', borderRadius: '50%',
                        background: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.6rem',
                    }}>🎯</div>

                    <div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: C.text1, marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
                            Start Learning?
                        </div>
                        <div style={{ fontSize: '0.82rem', color: C.text2, lineHeight: 1.6 }}>
                            Mark <strong style={{ color: C.text1 }}>&#34;{skillName}&#34;</strong> as{' '}
                            <span style={{ color: '#3b82f6', fontWeight: 700 }}>In Progress</span>?<br />
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
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59,130,246,0.4)',
                            borderRadius: '9px',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(59,130,246,0.2)',
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
        border:   isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0',
        text1:    isDark ? '#f1f5f9' : '#0f172a',
        text2:    isDark ? '#94a3b8' : '#475569',
        muted:    isDark ? '#64748b' : '#94a3b8',
        accent:   'var(--accent)',
        accentBg: isDark ? 'rgba(79,142,247,0.12)' : 'rgba(37,99,235,0.08)',
        accentBorder: isDark ? 'rgba(79,142,247,0.3)' : 'rgba(37,99,235,0.25)',
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
                    background: 'linear-gradient(90deg, var(--accent), #818cf8, #06b6d4)',
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
                                        background: isDone ? '#22c55e' : isActive ? 'var(--accent)' : C.btnBg,
                                        border: isDone ? '2px solid #22c55e' : isActive ? '2px solid var(--accent)' : `2px solid ${C.border}`,
                                        boxShadow: isActive ? '0 0 0 4px rgba(79,142,247,0.18)' : 'none',
                                    }}>
                                        {isDone
                                            ? <CheckCircle size={13} color="#fff" />
                                            : <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isActive ? '#fff' : C.muted }}>{i + 1}</span>
                                        }
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color: isDone ? '#22c55e' : isActive ? C.text1 : C.muted,
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
                                        background: step > i + 1 ? '#22c55e' : C.border,
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
                            border: `2px dashed ${dragOver ? 'var(--accent)' : verified ? '#22c55e' : file ? 'rgba(34,197,94,0.5)' : C.border}`,
                            borderRadius: '16px',
                            padding: '2.2rem 1.5rem',
                            textAlign: 'center', cursor: verified ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                            userSelect: 'none',
                            background: verified
                                ? 'rgba(34,197,94,0.06)'
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
                                    background: 'rgba(34,197,94,0.12)',
                                    border: '2px solid rgba(34,197,94,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CheckCircle size={26} color="#22c55e" />
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#22c55e' }}>Certificate Verified ✓</div>
                                <div style={{ fontSize: '0.72rem', color: C.muted, maxWidth: '260px', wordBreak: 'break-all' }}>{file.name}</div>
                            </>
                        ) : file ? (
                            <>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    background: 'rgba(34,197,94,0.1)',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem',
                                }}>📄</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#22c55e' }}>{file.name}</div>
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
                                ⚠️ Marking as complete without a certificate
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
                            background: canConfirm ? 'var(--accent)' : C.btnBg,
                            color: canConfirm ? '#ffffff' : C.muted,
                            border: canConfirm ? '1px solid var(--accent)' : `1px solid ${C.border}`,
                            borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                            transition: 'all 0.2s',
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                            boxShadow: canConfirm ? '0 4px 14px rgba(79,142,247,0.35)' : 'none',
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

const styles = {
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '2rem' },
    spinner: { width: '42px', height: '42px', borderRadius: '50%', border: '3px solid var(--accent-border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' },
    unavailableWrap: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconGhost: { color: 'var(--muted)', opacity: 0.3, marginBottom: '1.5rem' },
    roadmapHeader: { maxWidth: '800px' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '0.4rem 0.8rem', borderRadius: '100px', background: 'var(--accent-tint)', border: '1px solid var(--accent-border)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' },
    title: { fontSize: '1.75rem', fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.02em', margin: '0 0 0.5rem 0' },
    subtitle: { color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 },
    roadmapFlow: { display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative' },
    phaseWrap: { position: 'relative', paddingLeft: '1.8rem' },
    phaseLine: { position: 'absolute', left: '10px', top: '20px', bottom: '-20px', width: '2px', opacity: 0.12 },
    phaseHeader: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' },
    phaseIcon: { width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy1)', zIndex: 2, position: 'absolute', left: '0' },
    phaseTitle: { fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' },
    phaseGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem' },
    skillCard: {
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '0.65rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'default',
        position: 'relative'
    },
    skillTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' },
    skillName: { fontSize: '0.75rem', fontWeight: 700, color: 'var(--text2)', lineHeight: 1.2 },
    overlapTag: { fontSize: '0.55rem', fontWeight: 800, padding: '0.12rem 0.4rem', borderRadius: '3px' },
    skillMeta: { fontSize: '0.65rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    statusBadge: {
        fontSize: '0.55rem',
        fontWeight: 700,
        padding: '0.15rem 0.4rem',
        borderRadius: '5px',
        textTransform: 'uppercase',
        letterSpacing: '0.02em'
    },
    progressActions: {
        marginTop: '0.5rem',
        display: 'flex',
        gap: '0.3rem',
        transition: 'all 0.3s ease',
        pointerEvents: 'auto'
    },
    actionBtn: {
        width: 'auto',
        minWidth: '70px',
        padding: '0.25rem 0.45rem',
        borderRadius: '4px',
        fontSize: '0.6rem',
        fontWeight: 700,
        border: '1px solid rgba(255,255,255,0.08)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.2rem'
    },
    customTooltip: {
        position: 'absolute',
        bottom: '100%',
        right: '0',
        transform: 'translateY(-8px)',
        background: 'var(--navy2)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '0.65rem 0.75rem',
        width: '170px',
        zIndex: 100,
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        animation: 'fadeInUp 0.2s ease forwards',
        pointerEvents: 'none'
    },
    tooltipHeader: {
        fontSize: '0.65rem',
        fontWeight: 800,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.4rem',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '0.3rem'
    },
    tooltipList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem'
    },
    tooltipItem: {
        fontSize: '0.7rem',
        color: 'var(--text1)',
        lineHeight: 1.3
    },
    tooltipArrow: {
        position: 'absolute',
        top: '100%',
        right: '15px',
        width: '0',
        height: '0',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid var(--navy2)'
    }
};

export default CareerRoadmap;

