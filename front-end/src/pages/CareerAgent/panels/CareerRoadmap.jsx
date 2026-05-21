import React, { useEffect, useState } from 'react';
import { Network, Terminal, ShieldCheck, Zap } from 'lucide-react';

const CareerRoadmap = ({ roleName, mongoRoleData, direction }) => {
    const [roadmap, setRoadmap] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [skillProgress, setSkillProgress] = useState({});
    const [totalRolesCount, setTotalRolesCount] = useState(0);

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
                <div style={styles.badge}><Zap size={14} style={{ marginRight: '0.4rem' }} /> Data-Driven Path</div>
                <h2 style={styles.title}>Dynamic Career Roadmap</h2>
                <p style={styles.subtitle}>
                    Strategic learning path based on skill overlaps across all **{totalRolesCount}** roles within this family.
                    Foundational skills appear first, followed by niche specializations
                </p>
            </div>

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
            default: return { background: 'rgba(148, 163, 184, 0.1)', color: '#94a7b8', border: '1px solid rgba(148, 163, 184, 0.2)' };
        }
    };

    return (
        <div
            style={{
                ...styles.skillCard,
                borderColor: isHovered ? color : 'var(--border)',
                transform: isHovered ? 'translateY(-2px)' : 'none',
                boxShadow: isHovered ? `0 10px 20px -5px rgba(0,0,0,0.3)` : 'none'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
        >
            <div style={styles.skillTop}>
                <span style={styles.skillName}>{item.name}</span>
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
                <span>{item.category || 'Competency'}</span>
                {status !== 'Not Started' && (
                    <span style={{ ...styles.statusBadge, ...getStatusStyle(status) }}>
                        {status}
                    </span>
                )}
            </div>

            <div style={{ ...styles.progressActions, opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(5px)' }}>
                {status !== 'In Progress' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'In Progress'); }}
                        style={{ ...styles.actionBtn, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}
                    >
                        In Progress
                    </button>
                )}
                {status !== 'Completed' && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onStatusChange(item.name, 'Completed'); }}
                        style={{ ...styles.actionBtn, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}
                    >
                        Completed
                    </button>
                )}
            </div>
        </div>
    );
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
        background: 'rgba(10, 15, 30, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        padding: '0.6rem',
        width: '150px',
        zIndex: 100,
        boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
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
        borderBottom: '1px solid rgba(255,255,255,0.05)',
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
        borderTop: '6px solid rgba(10, 15, 30, 0.95)'
    }
};

export default CareerRoadmap;
