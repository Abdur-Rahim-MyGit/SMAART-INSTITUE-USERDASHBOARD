import React, { useEffect, useState, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * RoleDetailedView
 * Fetches role detail from the unified /api/career-agent/role-profile/:roleTitle endpoint.
 * Priority 1: roles-profile-data (What This Role Does, How AI Changing, Who Should Consider, Career Growth)
 * Priority 2: careerroles (narrative_para1/2/3 mapped to same 4 sections)
 */
const RoleDetailedView = ({ roleName, mongoRoleData, direction }) => {
    const [selectedRole, setSelectedRole] = useState(roleName);
    const [familyRoles, setFamilyRoles] = useState([]);
    const [roleProfile, setRoleProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const contextId = `${roleName}_${direction?.directionName || ''}`;
    const lastContext = useRef(null);

    /* ── 1. Resolve role tabs from direction ─────────────────────────────── */
    useEffect(() => {
        if (lastContext.current === contextId) return;
        lastContext.current = contextId;

        const resolveFamily = async () => {
            let roles = [];

            // From direction prop (preferred — comes from careerdirections DB)
            if (direction?.roles && direction.roles.length > 0) {
                roles = direction.roles
                    .map(r => (typeof r === 'string' ? r : r.role))
                    .filter(Boolean);
            }

            // Fallback: fetch siblings by job family
            if (roles.length === 0) {
                const jf = mongoRoleData?.job_family
                    || mongoRoleData?.['Job Family']
                    || mongoRoleData?.job_family_name;
                if (jf) {
                    try {
                        const firstWord = jf.split(/[\s–-]/)[0];
                        const res = await fetch(
                            `/api/career-agent/role-skills/family/${encodeURIComponent(firstWord)}`
                        );
                        if (res.ok) roles = await res.json();
                    } catch (e) {
                        console.warn('[RoleDetailedView] Family fetch error:', e);
                    }
                }
            }

            if (roles.length > 0) {
                const unique = [...new Set(roles)].filter(Boolean);
                setFamilyRoles(unique);

                // Select: if roleName is already a tab pick it, else pick first
                const match = unique.find(
                    r => r.toLowerCase() === roleName.toLowerCase()
                );
                setSelectedRole(match || unique[0]);
            }
        };

        resolveFamily();
    }, [contextId, direction, mongoRoleData, roleName]);

    /* ── 2. Fetch role profile whenever selected tab changes ─────────────── */
    useEffect(() => {
        if (!selectedRole) return;

        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            setRoleProfile(null);
            try {
                // Use the new unified endpoint
                const res = await fetch(
                    `/api/career-agent/role-profile/${encodeURIComponent(selectedRole)}`
                );
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Role not found in database');
                }
                const data = await res.json();
                if (!cancelled) {
                    setRoleProfile(data);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e.message);
                    setLoading(false);
                }
            }
        };

        load();
        return () => { cancelled = true; };
    }, [selectedRole]);

    /* ── Loading state ───────────────────────────────────────────────────── */
    if (loading) {
        return (
            <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Loading career intelligence for <strong>{selectedRole}</strong>…
                </p>
            </div>
        );
    }


    /* ── Main render ─────────────────────────────────────────────────────── */
    return (
        <div style={styles.container} className="animate-fade-in">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .rdv-box-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.25rem;
                }
                @media (max-width: 900px) {
                    .rdv-box-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            {/* ── Role Selector Tabs ── */}
            {familyRoles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                    {familyRoles.map(role => {
                        const isSel = selectedRole === role;
                        return (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0.42rem 0.95rem',
                                    background: isSel ? 'var(--accent)' : 'var(--navy3)',
                                    border: '1px solid',
                                    borderColor: isSel ? 'var(--accent)' : 'var(--border)',
                                    borderRadius: '100px',
                                    fontSize: '0.74rem',
                                    fontWeight: 600,
                                    color: isSel ? 'white' : 'var(--text2)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: isSel ? '0 4px 12px rgba(37,99,235,0.25)' : 'none',
                                }}
                            >
                                {role}
                                {isSel && <ChevronRight size={13} style={{ marginLeft: '3px' }} />}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Role title ── */}
            <div style={styles.pageHeader}>
                <h2 style={styles.roleName}>{selectedRole}</h2>
            </div>

            {/* ── Error / no data ── */}
            {error ? (
                <div style={styles.emptyWrap}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <h3 style={{ color: 'var(--text2)', marginBottom: '0.5rem' }}>
                        No Detailed Data for "{selectedRole}"
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
                        The Agent Database doesn't yet have high-resolution narratives for this
                        specific role. Please select another role from the menu above.
                    </p>
                </div>
            ) : roleProfile ? (
                <>
                    {/* ── 2-section grid (What This Role Does + Who Should Consider) ── */}
                    <div className="rdv-box-grid">

                        {/* BOX 1 – What This Role Actually Does */}
                        <div style={styles.box}>
                            <div style={styles.boxHeader}>
                                <span style={styles.boxIconWrap}>🏛️</span>
                                <div style={styles.boxTitle}>What This Role Actually Does</div>
                            </div>
                            <div style={styles.boxDivider} />
                            {roleProfile.whatRoleDoes ? (
                                <p style={styles.boxText}>{roleProfile.whatRoleDoes}</p>
                            ) : (
                                <p style={styles.missingText}>Narrative not available for this role.</p>
                            )}

                        </div>

                        {/* BOX 2 – Who Should Consider This Role */}
                        <div style={styles.box}>
                            <div style={styles.boxHeader}>
                                <span style={styles.boxIconWrap}>🧑‍💼</span>
                                <div style={styles.boxTitle}>Who Should Consider This Role</div>
                            </div>
                            <div style={styles.boxDivider} />
                            {roleProfile.whoShouldConsider ? (
                                <p style={styles.boxText}>{roleProfile.whoShouldConsider}</p>
                            ) : (
                                <p style={styles.missingText}>Suitability narrative not available for this role.</p>
                            )}
                        </div>
                    </div>

                </>
            ) : null}
        </div>
    );
};

const styles = {
    container: {
        display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.25rem',
    },
    loadingWrap: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '300px',
    },
    spinner: {
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid var(--border)', borderTopColor: 'var(--accent)',
        animation: 'spin 0.8s linear infinite',
    },
    emptyWrap: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '280px', textAlign: 'center',
        padding: '3rem', background: 'var(--navy2)', borderRadius: '16px',
        border: '1px solid var(--border)',
    },
    pageHeader: {
        display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.25rem',
    },
    roleName: {
        fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em',
        color: 'var(--text1)', margin: 0,
    },
    boxGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem',
    },
    box: {
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '16px', padding: '1.5rem',
        display: 'flex', flexDirection: 'column', gap: 0,
    },
    boxAccent: {
        background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, var(--navy2) 60%)',
        borderColor: 'rgba(79,142,247,0.2)',
    },
    boxGrowth: {
        background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, var(--navy2) 60%)',
        borderColor: 'rgba(16,185,129,0.2)',
    },
    boxHeader: {
        display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem',
    },
    boxIconWrap: { fontSize: '1.4rem' },
    boxTitle: {
        fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)',
    },
    boxDivider: {
        height: '1px', background: 'var(--border)', marginBottom: '1rem',
    },
    boxText: {
        fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text2)', margin: 0,
    },
    missingText: {
        fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0,
    },
    salaryGrid: {
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.6rem', marginTop: '1.25rem',
    },
    salaryItem: {
        textAlign: 'center', padding: '0.6rem 0.4rem',
        background: 'rgba(79,142,247,0.05)',
        border: '1px solid var(--border)', borderRadius: '10px',
    },
    salaryLabel: {
        fontSize: '0.55rem', color: 'var(--muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem',
    },
    salaryValue: {
        fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent)',
    },
    aiBadge: {
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        marginTop: '1rem', padding: '0.35rem 0.8rem',
        background: 'rgba(79,142,247,0.08)', borderRadius: '20px',
        border: '1px solid rgba(79,142,247,0.2)', width: 'fit-content',
    },
    aiBadgeDot: {
        width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)',
    },
    aiBadgeText: {
        fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent)',
    },
    humanValueBox: {
        marginTop: '1.25rem', padding: '0.9rem 1rem',
        background: 'rgba(16,185,129,0.06)', borderRadius: '10px',
        border: '1px solid rgba(16,185,129,0.15)',
    },
    humanValueLabel: {
        fontSize: '0.65rem', fontWeight: 800, color: '#10b981',
        textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    englishRow: {
        display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem',
        padding: '0.6rem 1rem',
        background: 'var(--navy2)', borderRadius: '10px',
        border: '1px solid var(--border)',
    },
    englishChip: {
        fontSize: '0.8rem', color: 'var(--text2)',
    },
    englishContext: {
        fontSize: '0.78rem', color: 'var(--muted)',
    },
};

export default RoleDetailedView;
