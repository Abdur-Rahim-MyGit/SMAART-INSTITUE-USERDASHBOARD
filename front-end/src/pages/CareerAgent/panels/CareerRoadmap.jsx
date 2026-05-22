import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Network, Terminal, ShieldCheck, Zap, X, Upload, CheckCircle } from 'lucide-react';

const CareerRoadmap = ({ roleName, mongoRoleData, direction }) => {
    const [roadmap, setRoadmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [skillProgress, setSkillProgress] = useState({});
    const [totalRolesCount, setTotalRolesCount] = useState(0);
    const [certModal, setCertModal] = useState(null); // { skillName } or null

    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('smaart_user') || '{}');
    const userEmail = user.email || 'guest@smaart.edu';

    useEffect(() => {
        const fetchManualRoadmap = async () => {
            try {
                setLoading(true);

                // 1. Fetch existing progress
                try {
                    const progRes = await fetch(`/api/career-agent/user-skills/${encodeURIComponent(userEmail)}`);
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
                />
            )}

            <div style={styles.roadmapFlow}>
                {foundation.length > 0 && <RoadmapPhase title="Foundational Skills" icon={ShieldCheck} items={foundation} color="var(--accent)" skillProgress={skillProgress} onStatusChange={handleStatusChange} totalRoles={totalRolesCount} />}
                {growth.length > 0 && <RoadmapPhase title="Specialization Skills" icon={Terminal} items={growth} color="var(--accent2)" skillProgress={skillProgress} onStatusChange={handleStatusChange} totalRoles={totalRolesCount} />}
                {mastery.length > 0 && <RoadmapPhase title="Edge Skills" icon={Zap} items={mastery} color="#a78bfa" skillProgress={skillProgress} onStatusChange={handleStatusChange} totalRoles={totalRolesCount} />}
            </div>
        </div>
    );
};

const RoadmapPhase = ({ title, icon: Icon, items, color, skillProgress, onStatusChange, totalRoles }) => (
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
                    totalRoles={totalRoles}
                />
            ))}
        </div>
    </div>
);

const SkillCard = ({ item, color, status, onStatusChange, totalRoles }) => {
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
                    style={{ ...styles.overlapTag, background: `rgba(${color === 'var(--accent)' ? '79,142,247' : '34,211,238'}, 0.1)`, color: color, cursor: 'help', position: 'relative' }}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                >
                    {item.count}/{totalRoles} Roles

                    {showTooltip && (
                        <div style={styles.customTooltip}>
                            <div style={styles.tooltipHeader}>Required for:</div>
                            <div style={styles.tooltipList}>
                                {item.roles.map((r, i) => (
                                    <div key={i} style={styles.tooltipItem}>• {r}</div>
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

            <div style={{ ...styles.progressActions, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(5px)' }}>
                {status !== 'In Progress' && status !== 'Completed' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'In Progress'); }}
                        style={{ ...styles.actionBtn, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
                    >
                        In Progress
                    </button>
                )}
                {status !== 'Completed' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Completed'); }}
                        style={{ ...styles.actionBtn, background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                        Completed
                    </button>
                )}
            </div>
        </div>
    );
};

/* ── Certificate Modal ── */
const CertificateModal = ({ skillName, onConfirm, onClose }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [verified, setVerified] = useState(false);
    const [skipCert, setSkipCert] = useState(false);
    const fileInputRef = useRef(null);

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

    // Step display
    const step = !file && !skipCert ? 1 : (file && !verified) ? 2 : 3;

    return ReactDOM.createPortal(
        <div
            style={cmStyles.overlay}
            onClick={onClose}
        >
            <div style={cmStyles.modal} onClick={e => e.stopPropagation()}>

                {/* Top accent bar */}
                <div style={cmStyles.accentBar} />

                {/* Header */}
                <div style={cmStyles.header}>
                    <div style={cmStyles.headerLeft}>
                        <div style={cmStyles.headerTag}>
                            <CheckCircle size={11} />
                            Mark as Completed
                        </div>
                        <div style={cmStyles.headerSkill}>{skillName}</div>
                    </div>
                    <button onClick={onClose} style={cmStyles.closeBtn}><X size={16} /></button>
                </div>

                {/* Step indicator */}
                <div style={cmStyles.steps}>
                    {['Upload', 'Verify', 'Confirm'].map((s, i) => (
                        <div key={s} style={cmStyles.stepItem}>
                            <div style={{
                                ...cmStyles.stepDot,
                                background: step > i + 1 ? '#22c55e' : step === i + 1 ? 'var(--accent)' : 'var(--navy4)',
                                border: step === i + 1 ? '2px solid var(--accent)' : step > i + 1 ? '2px solid #22c55e' : '2px solid var(--border)',
                            }}>
                                {step > i + 1 ? <CheckCircle size={10} color="#fff" /> : <span style={{ fontSize: '0.6rem', fontWeight: 800, color: step === i + 1 ? '#fff' : 'var(--muted)' }}>{i + 1}</span>}
                            </div>
                            <span style={{ ...cmStyles.stepLabel, color: step === i + 1 ? 'var(--text1)' : step > i + 1 ? '#22c55e' : 'var(--muted)' }}>{s}</span>
                            {i < 2 && <div style={{ ...cmStyles.stepLine, background: step > i + 1 ? '#22c55e' : 'var(--border)' }} />}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div style={cmStyles.body}>

                    {/* Drop Zone */}
                    <div
                        style={{
                            ...cmStyles.dropZone,
                            borderColor: dragOver ? 'var(--accent)' : verified ? '#22c55e' : file ? 'rgba(34,197,94,0.4)' : 'var(--border)',
                            background: verified ? 'rgba(34,197,94,0.05)' : dragOver ? 'rgba(79,142,247,0.05)' : 'var(--navy3)',
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !verified && fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                        {verified ? (
                            <>
                                <div style={cmStyles.verifiedIcon}><CheckCircle size={32} color="#22c55e" /></div>
                                <div style={cmStyles.verifiedTitle}>Certificate Verified ✓</div>
                                <div style={cmStyles.verifiedFile}>{file.name}</div>
                            </>
                        ) : file ? (
                            <>
                                <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>📄</div>
                                <div style={cmStyles.fileName}>{file.name}</div>
                                <div style={cmStyles.fileSize}>{(file.size / 1024).toFixed(1)} KB · Click to change</div>
                            </>
                        ) : (
                            <>
                                <div style={cmStyles.uploadIcon}><Upload size={26} color="var(--muted)" /></div>
                                <div style={cmStyles.dropText}>
                                    Drop your certificate here or{' '}
                                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>browse files</span>
                                </div>
                                <div style={cmStyles.dropSub}>PDF, JPG or PNG accepted</div>
                            </>
                        )}
                    </div>

                    {/* Actions row */}
                    <div style={cmStyles.actionsRow}>
                        {file && !verified && (
                            <button onClick={handleVerify} style={cmStyles.verifyBtn}>
                                <CheckCircle size={13} /> Verify Certificate
                            </button>
                        )}
                        {!skipCert && !verified && (
                            <button onClick={() => setSkipCert(true)} style={cmStyles.skipBtn}>
                                Skip — Mark Without Certificate
                            </button>
                        )}
                        {skipCert && (
                            <div style={cmStyles.skipNote}>
                                ⚠ Marking as complete without a certificate
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={cmStyles.footer}>
                    <button onClick={onClose} style={cmStyles.cancelBtn}>Cancel</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        style={{
                            ...cmStyles.confirmBtn,
                            opacity: canConfirm ? 1 : 0.4,
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
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

const cmStyles = {
    overlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
    },
    modal: {
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        width: '100%', maxWidth: '460px',
        overflow: 'hidden',
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)',
        position: 'relative',
    },
    accentBar: {
        height: '3px',
        background: 'linear-gradient(90deg, var(--accent), #22c55e)',
    },
    header: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '1.25rem 1.4rem 0.85rem',
    },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
    headerTag: {
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        fontSize: '0.6rem', fontWeight: 800, color: '#22c55e',
        textTransform: 'uppercase', letterSpacing: '0.08em',
    },
    headerSkill: { fontSize: '1.1rem', fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.01em' },
    closeBtn: {
        background: 'var(--navy3)', border: '1px solid var(--border)',
        cursor: 'pointer', color: 'var(--muted)',
        padding: '0.35rem', borderRadius: '8px', display: 'flex', alignItems: 'center',
        transition: 'all 0.15s',
    },

    /* Step indicator */
    steps: {
        display: 'flex', alignItems: 'center',
        padding: '0.6rem 1.4rem 0.85rem',
        gap: 0,
    },
    stepItem: { display: 'flex', alignItems: 'center', gap: '0.4rem' },
    stepDot: {
        width: '20px', height: '20px', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s', flexShrink: 0,
    },
    stepLabel: { fontSize: '0.68rem', fontWeight: 700, transition: 'color 0.2s' },
    stepLine: { width: '28px', height: '1px', margin: '0 0.4rem', transition: 'background 0.3s' },

    /* Body */
    body: { padding: '0 1.4rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' },

    dropZone: {
        border: '1.5px dashed',
        borderRadius: '14px', padding: '1.75rem 1.25rem',
        textAlign: 'center', cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
        userSelect: 'none',
    },
    uploadIcon: { marginBottom: '0.25rem', opacity: 0.6 },
    dropText: { fontSize: '0.84rem', color: 'var(--text2)', lineHeight: 1.4 },
    dropSub: { fontSize: '0.7rem', color: 'var(--muted)' },
    fileName: { fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)' },
    fileSize: { fontSize: '0.7rem', color: 'var(--muted)' },
    verifiedIcon: { marginBottom: '0.25rem' },
    verifiedTitle: { fontSize: '0.9rem', fontWeight: 800, color: '#22c55e' },
    verifiedFile: { fontSize: '0.72rem', color: 'var(--muted)' },

    /* Action row below drop zone */
    actionsRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' },
    verifyBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
        padding: '0.5rem 1rem',
        background: 'rgba(79,142,247,0.1)', color: 'var(--accent)',
        border: '1px solid rgba(79,142,247,0.3)', borderRadius: '8px',
        fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
    },
    skipBtn: {
        display: 'inline-flex', alignItems: 'center',
        padding: '0.5rem 0.9rem',
        background: 'transparent', color: 'var(--muted)',
        border: '1px solid var(--border)', borderRadius: '8px',
        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    },
    skipNote: {
        fontSize: '0.72rem', color: 'var(--amber)',
        padding: '0.4rem 0.75rem',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: '8px',
    },

    /* Footer */
    footer: {
        display: 'flex', gap: '0.65rem', padding: '1rem 1.4rem',
        borderTop: '1px solid var(--border)', justifyContent: 'flex-end',
        background: 'var(--navy3)',
    },
    cancelBtn: {
        padding: '0.55rem 1.2rem',
        background: 'transparent', color: 'var(--text2)',
        border: '1px solid var(--border)', borderRadius: '8px',
        fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
    },
    confirmBtn: {
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.55rem 1.3rem',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.15))',
        color: '#22c55e',
        border: '1px solid rgba(34,197,94,0.35)',
        borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
        transition: 'all 0.2s',
    },
};


const styles = {
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', padding: '2rem' },
    spinner: { width: '42px', height: '42px', borderRadius: '50%', border: '3px solid rgba(79,142,247,0.1)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' },
    unavailableWrap: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    iconGhost: { color: 'var(--muted)', opacity: 0.3, marginBottom: '1.5rem' },
    roadmapHeader: { maxWidth: '800px' },
    badge: { display: 'inline-flex', alignItems: 'center', padding: '0.4rem 0.8rem', borderRadius: '100px', background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.2)', color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' },
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
