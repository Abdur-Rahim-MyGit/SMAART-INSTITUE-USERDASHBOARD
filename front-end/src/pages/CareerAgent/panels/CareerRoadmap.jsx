import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Network, Terminal, ShieldCheck, Zap, X, Upload, CheckCircle, Target, FileText, AlertTriangle, RotateCcw, Map, TrendingUp, Layers, Clock } from '@/components/icons';
import { Spinner, EmptyState, CardHead, MetricTile } from './shared';
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
                    <div className="stat-ic"><TrendingUp size={18} /></div>
                    <div className="stat-body" style={{ width: '100%' }}>
                        <div className="stat-k">Overall progress</div>
                        <div className="stat-v">{pct}%</div>
                        <div className="meter" style={{ marginTop: 6 }}><i style={{ width: `${pct}%` }} /></div>
                    </div>
                </div>
                <MetricTile icon={<Layers size={18} />} value={roadmap.length} label="Skills in roadmap" sub={`across ${totalRolesCount} roles`} />
                <MetricTile icon={<Clock size={18} />} value={doingCount} label="In progress" sub="currently learning" />
                <MetricTile icon={<CheckCircle size={18} />} value={doneCount} label="Completed" sub="verified or marked done" />
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

/* ─────────────────────────────────────────────────────────────
   Roadmap modals
   These render through a portal into document.body, i.e. OUTSIDE
   .career-agent-page — so the page's CSS variables do not resolve here.
   Every colour below is therefore literal, from the same brand palette.
   ───────────────────────────────────────────────────────────── */
const palette = (theme) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return {
        isDark,
        overlay: 'rgba(7,32,54,0.45)',
        card:    isDark ? '#001b3a' : '#ffffff',
        soft:    isDark ? '#00152E' : '#F8FAFC',
        panel:   isDark ? '#002147' : '#F1F5F9',
        hair:    isDark ? 'rgba(255,255,255,0.10)' : '#d7ebf5',
        ink:     isDark ? '#f8fafc' : '#072036',
        sub:     isDark ? '#cbd5e1' : '#35566b',
        muted:   isDark ? '#94a3b8' : '#64748b',
        brand:   isDark ? '#A6D7E8' : '#045C9A',
        tint:    isDark ? 'rgba(4,92,154,0.22)' : '#EAF7FD',
        border:  isDark ? 'rgba(166,215,232,0.35)' : 'rgba(4,92,154,0.25)',
        solid:   isDark ? '#045C9A' : '#072036',
        solidHover: isDark ? '#0b6fb8' : '#0d3a5f',
        green:   '#059669',
        amber:   '#d97706',
    };
};

const FONT = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const Shell = ({ C, width = 420, onClose, children }) => (
    <div
        style={{
            position: 'fixed', inset: 0, background: C.overlay,
            backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', animation: 'fadeIn 0.15s ease',
        }}
        onClick={onClose}
    >
        <div
            style={{
                background: C.card, border: `1px solid ${C.hair}`, borderRadius: 16,
                width: '100%', maxWidth: width, overflow: 'hidden', fontFamily: FONT,
                boxShadow: C.isDark ? '0 24px 60px rgba(0,0,0,0.6)' : '0 24px 60px rgba(7,32,54,0.18)',
                animation: 'popIn 0.18s ease',
            }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

const Head = ({ C, icon, title, sub, onClose }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 20px 16px', borderBottom: `1px solid ${C.hair}` }}>
        <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: C.tint, color: C.brand,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>{title}</div>
            {sub && <div style={{ fontSize: 13, fontWeight: 500, color: C.muted, lineHeight: 1.5 }}>{sub}</div>}
        </div>
        {onClose && (
            <button
                type="button" onClick={onClose} title="Close"
                style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
                    background: C.soft, border: `1px solid ${C.hair}`, color: C.muted,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                <X size={16} />
            </button>
        )}
    </div>
);

const Foot = ({ C, children }) => (
    <div style={{
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        padding: '14px 20px', borderTop: `1px solid ${C.hair}`, background: C.soft,
    }}>{children}</div>
);

const btnGhost = (C) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
    background: C.card, color: C.sub, border: `1px solid ${C.hair}`, borderRadius: 10,
    fontFamily: FONT, fontSize: 13, fontWeight: 600, cursor: 'pointer',
});

const btnSolid = (C, enabled = true) => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 16px',
    background: enabled ? C.solid : C.panel,
    color: enabled ? '#ffffff' : C.muted,
    border: `1px solid ${enabled ? C.solid : C.hair}`, borderRadius: 10,
    fontFamily: FONT, fontSize: 13, fontWeight: 600,
    cursor: enabled ? 'pointer' : 'not-allowed',
});

/* ── Start-learning confirmation ── */
const InProgressModal = ({ skillName, onConfirm, onClose, theme }) => {
    const C = palette(theme);
    return ReactDOM.createPortal(
        <Shell C={C} width={420} onClose={onClose}>
            <Head
                C={C}
                icon={<Target size={20} />}
                title="Start learning this skill?"
                sub="It moves to In progress on your roadmap. You can undo this at any time."
                onClose={onClose}
            />
            <div style={{ padding: '18px 20px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    background: C.tint, border: `1px solid ${C.border}`, borderRadius: 10,
                }}>
                    <span style={{ color: C.brand, display: 'flex', flexShrink: 0 }}><Terminal size={18} /></span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{skillName}</span>
                </div>
            </div>
            <Foot C={C}>
                <button type="button" style={btnGhost(C)} onClick={onClose}>Cancel</button>
                <button type="button" style={btnSolid(C)} onClick={onConfirm}>
                    <CheckCircle size={16} /> Start learning
                </button>
            </Foot>
        </Shell>,
        document.body
    );
};

/* ── Mark-as-complete + certificate upload ── */
const CertificateModal = ({ skillName, onConfirm, onClose, theme }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [verified, setVerified] = useState(false);
    const [skipCert, setSkipCert] = useState(false);
    const fileInputRef = useRef(null);
    const C = palette(theme);

    const handleFile = (f) => {
        if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
            setFile(f); setVerified(false); setSkipCert(false);
        }
    };
    const canConfirm = verified || skipCert;
    const step = !file && !skipCert ? 1 : (file && !verified) ? 2 : 3;
    const STEPS = ['Upload', 'Verify', 'Confirm'];

    return ReactDOM.createPortal(
        <Shell C={C} width={480} onClose={onClose}>
            <Head
                C={C}
                icon={<CheckCircle size={20} />}
                title="Mark this skill as completed"
                sub={skillName}
                onClose={onClose}
            />

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '14px 20px', background: C.soft, borderBottom: `1px solid ${C.hair}` }}>
                {STEPS.map((s, i) => {
                    const active = step === i + 1;
                    const done = step > i + 1;
                    return (
                        <React.Fragment key={s}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: 999, flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: done ? C.green : active ? C.solid : C.panel,
                                    border: `1px solid ${done ? C.green : active ? C.solid : C.hair}`,
                                    color: done || active ? '#ffffff' : C.muted,
                                    fontSize: 11, fontWeight: 700,
                                }}>
                                    {done ? <CheckCircle size={13} /> : i + 1}
                                </div>
                                <span style={{ fontSize: 12.5, fontWeight: active || done ? 600 : 500, color: done ? C.green : active ? C.ink : C.muted }}>{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div style={{ flex: 1, height: 1, margin: '0 12px', background: step > i + 1 ? C.green : C.hair }} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Body */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                    style={{
                        border: `1px dashed ${dragOver ? C.solid : verified ? C.green : file ? C.border : C.hair}`,
                        borderRadius: 12, padding: '28px 20px', textAlign: 'center',
                        cursor: verified ? 'default' : 'pointer', userSelect: 'none',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                        background: verified ? 'rgba(5,150,105,0.06)' : dragOver ? C.tint : C.soft,
                        transition: 'border-color 0.15s, background 0.15s',
                    }}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => !verified && fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: verified ? 'rgba(5,150,105,0.12)' : file ? 'rgba(5,150,105,0.1)' : C.panel,
                        border: `1px solid ${verified || file ? 'rgba(5,150,105,0.3)' : C.hair}`,
                        color: verified || file ? C.green : C.muted,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {verified ? <CheckCircle size={20} /> : file ? <FileText size={20} /> : <Upload size={20} />}
                    </div>
                    {verified ? (
                        <>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.green }}>Certificate verified</div>
                            <div style={{ fontSize: 12, color: C.muted, maxWidth: 280, wordBreak: 'break-all' }}>{file.name}</div>
                        </>
                    ) : file ? (
                        <>
                            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, maxWidth: 320, wordBreak: 'break-all' }}>{file.name}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>{(file.size / 1024).toFixed(1)} KB · click to change</div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 14, fontWeight: 500, color: C.ink, lineHeight: 1.5 }}>
                                Drop your certificate here or <span style={{ color: C.brand, fontWeight: 600 }}>browse files</span>
                            </div>
                            <div style={{ fontSize: 12, color: C.muted }}>PDF, JPG or PNG</div>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    {file && !verified && (
                        <button type="button" style={{ ...btnGhost(C), height: 36, color: C.brand, borderColor: C.border, background: C.tint }} onClick={() => setVerified(true)}>
                            <CheckCircle size={15} /> Verify certificate
                        </button>
                    )}
                    {!skipCert && !verified && (
                        <button type="button" style={{ ...btnGhost(C), height: 36 }} onClick={() => setSkipCert(true)}>
                            Continue without a certificate
                        </button>
                    )}
                    {skipCert && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 12px', borderRadius: 8,
                            background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)',
                            fontSize: 12.5, fontWeight: 500, color: C.amber,
                        }}>
                            <AlertTriangle size={15} /> Marking as complete without a certificate
                        </div>
                    )}
                </div>
            </div>

            <Foot C={C}>
                <button type="button" style={btnGhost(C)} onClick={onClose}>Cancel</button>
                <button type="button" style={btnSolid(C, canConfirm)} disabled={!canConfirm} onClick={() => onConfirm(skillName, file)}>
                    <CheckCircle size={16} />
                    {verified ? 'Complete with certificate' : 'Mark as completed'}
                </button>
            </Foot>
        </Shell>,
        document.body
    );
};

export default CareerRoadmap;

