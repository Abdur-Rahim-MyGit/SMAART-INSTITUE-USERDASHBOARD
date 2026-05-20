import React, { useEffect, useState, useRef } from 'react';

const RoleDetailedView = ({ roleName, mongoRoleData, direction }) => {
    const [selectedRole, setSelectedRole] = useState(roleName);
    const [familyRoles, setFamilyRoles] = useState([]);
    const [dbRole, setDbRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Track context to avoid infinite loops
    const contextId = `${roleName}_${mongoRoleData?.job_family || ''}`;
    const lastContext = useRef(null);

    /* 1. Resolve Family Roles (Tabs) */
    useEffect(() => {
        if (lastContext.current === contextId) return;
        lastContext.current = contextId;

        const resolveFamily = async () => {
            let roles = [];

            // Case A: From props/Analysis state
            if (direction?.roles && direction.roles.length > 0) {
                roles = direction.roles.map(r => typeof r === 'string' ? r : r.role);
            }

            // Case B: Fallback - Resolve Job Family name and fetch siblings
            if (roles.length === 0) {
                // Robust check for job_family in different object levels
                const jf = mongoRoleData?.job_family ||
                    mongoRoleData?.tab1?.job_family ||
                    mongoRoleData?.job_family_name ||
                    mongoRoleData?.tab1?.job_family_name;

                if (jf) {
                    try {
                        const cleanFamily = jf.split(' ')[0];
                        const familyRes = await fetch(`/api/role-skills/family/${encodeURIComponent(cleanFamily)}`);
                        if (familyRes.ok) roles = await familyRes.json();
                    } catch (e) { console.warn('Family fetch err:', e); }
                }
            }

            if (roles.length > 0) {
                const uniqueRoles = [...new Set(roles)]
                    .filter(Boolean)
                    .filter(r => r.toLowerCase() !== 'software engineer');
                setFamilyRoles(uniqueRoles);

                // If our current roleName is a "Category Name" (often matches jf), 
                // we should select the first ACTUAL sub-role.
                const jfName = (mongoRoleData?.job_family || mongoRoleData?.job_family_name || '').toLowerCase();
                const currentIsCategory = roleName.toLowerCase() === jfName;

                if (currentIsCategory || !uniqueRoles.includes(roleName)) {
                    setSelectedRole(uniqueRoles[0]);
                } else {
                    setSelectedRole(roleName);
                }
            }
        };

        resolveFamily();
    }, [contextId, direction, mongoRoleData, roleName]);

    /* 2. Fetch Detailed Role Data */
    useEffect(() => {
        if (!selectedRole) return;

        // SPECIAL GUARD: If selectedRole is EXACTLY the same as the Job Family name, 
        // we shouldn't attempt a profile fetch yet, as it's likely a category.
        const jf = (mongoRoleData?.job_family || mongoRoleData?.job_family_name || '').toLowerCase();
        if (selectedRole.toLowerCase() === jf && familyRoles.length > 0) {
            return;
        }

        let cancelled = false;

        const loadRoleData = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/career-role/${encodeURIComponent(selectedRole)}`);
                if (!res.ok) throw new Error('Role narrative not found in Database');
                const data = await res.json();

                if (!cancelled) {
                    setDbRole(data);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    // Try searching role-skills if career-role fails? 
                    // No, usually career-role is the source for narratives.
                    setError(e.message);
                    setLoading(false);
                }
            }
        };

        loadRoleData();
        return () => { cancelled = true; };
    }, [selectedRole]);

    /* Display shortcuts */
    const para1 = dbRole?.narrative_para1;
    const para2 = dbRole?.narrative_para2;
    const para3 = dbRole?.narrative_para3;
    const aiSkills = dbRole?.ai_skills || [];
    const salaryProgressions = dbRole?.salary_progression;

    /* ─────────── LOADING/ERROR ─────────── */
    if (loading) {
        return (
            <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.85rem' }}>
                    Downloading career intelligence for {selectedRole}…
                </p>
            </div>
        );
    }

    /* ─────────── MAIN RENDER ─────────── */
    return (
        <div style={styles.container} className="animate-fade-in">

            {/* ── Role Selector Tabs ── */}
            {familyRoles.length > 0 && (
                <div
                    className="custom-scrollbar"
                    style={{
                        display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem',
                        borderBottom: '1px solid var(--border)',
                        msOverflowStyle: 'none',
                    }}
                >
                    <style>{`
                        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
                        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent); }
                    `}</style>
                    {familyRoles.map(role => {
                        const isSel = selectedRole === role;
                        return (
                            <button
                                key={role}
                                onClick={() => setSelectedRole(role)}
                                style={{
                                    padding: '0.5rem 1.1rem', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 700,
                                    background: isSel ? 'var(--accent)' : 'var(--navy3)',
                                    border: '1px solid',
                                    borderColor: isSel ? 'var(--accent)' : 'var(--border)',
                                    color: isSel ? 'white' : 'var(--text2)',
                                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
                                    boxShadow: isSel ? '0 4px 12px rgba(37,99,235,0.2)' : 'none',
                                    flexShrink: 0
                                }}
                            >
                                {role}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ───── Page header ───── */}
            <div style={styles.pageHeader}>
                {/* <div style={styles.roleChip}>
                    <span style={styles.roleChipDot} />
                    <span style={styles.roleChipText}>
                        {dbRole?.job_family || 'ROLE INTELLIGENCE'}
                    </span>
                </div> */}
                <h2 style={styles.roleName}>{selectedRole}</h2>
            </div>

            {error ? (
                <div style={styles.emptyWrap}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <h3 style={{ color: 'var(--text2)', marginBottom: '0.5rem' }}>
                        No Detailed Data for "{selectedRole}"
                    </h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
                        The Agent Database doesn't yet have high-resolution narratives for this specific variant.
                        Please select another role from the family menu above.
                    </p>
                </div>
            ) : (
                /* ───── Three narrative boxes ───── */
                <div style={styles.boxGrid}>
                    {/* BOX 1 – What This Role Does */}
                    <div style={styles.box}>
                        <div style={styles.boxHeader}>
                            <span style={styles.boxIcon}>🎯</span>
                            <div style={styles.boxTitle}>Core Mission & Responsibilities</div>
                        </div>
                        <div style={styles.boxDivider} />
                        {para1 ? (
                            <p style={styles.boxText}>{para1}</p>
                        ) : (
                            <p style={styles.missingText}>Narrative not available for this role in the Agent Database.</p>
                        )}

                        {/* Salary progression mini-grid */}
                        {salaryProgressions && (
                            <div style={styles.salaryGrid}>
                                {Object.entries(salaryProgressions).map(([yr, val]) => (
                                    <div key={yr} style={styles.salaryItem}>
                                        <div style={styles.salaryLabel}>{yr.replace(/_/g, ' ')}</div>
                                        <div style={styles.salaryValue}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BOX 2 – AI Evolution */}
                    <div style={{ ...styles.box, ...styles.boxAccent }}>
                        <div style={styles.boxHeader}>
                            <span style={styles.boxIcon}>🤖</span>
                            <div style={styles.boxTitle}>AI Impact & Automation Transformation</div>
                        </div>
                        <div style={styles.boxDivider} />
                        {para2 ? (
                            <p style={styles.boxText}>{para2}</p>
                        ) : (
                            <p style={styles.missingText}>AI evolution narrative not available for this role.</p>
                        )}

                        {/* AI tools tags */}
                        {aiSkills.length > 0 && (
                            <div style={{ marginTop: '1.25rem' }}>
                                <div style={styles.tagGroupLabel}>🔑 Strategic AI Proficiency</div>
                                <div style={styles.tagRow}>
                                    {aiSkills.map((s, i) => (
                                        <span key={i} style={{ ...styles.tag, background: 'rgba(79,142,247,0.12)', color: 'var(--accent)', borderColor: 'rgba(79,142,247,0.3)' }}>
                                            {s.skill_name || s.tool_name}
                                            <span style={styles.tagBadge}>{s.importance || s.priority}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOX 3 – Future Outlook */}
                    <div style={styles.box}>
                        <div style={styles.boxHeader}>
                            <span style={styles.boxIcon}>📈</span>
                            <div style={styles.boxTitle}>Future Market Relevance</div>
                        </div>
                        <div style={styles.boxDivider} />
                        {para3 ? (
                            <p style={styles.boxText}>{para3}</p>
                        ) : (
                            <p style={styles.missingText}>Market outlook narrative not available for this role.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.25rem' },
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
    spinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' },
    emptyWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '280px', textAlign: 'center', padding: '3rem', background: 'var(--navy2)', borderRadius: '16px', border: '1px solid var(--border)' },
    pageHeader: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.25rem' },
    roleChip: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
    roleChipDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' },
    roleChipText: { fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' },
    roleName: { fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text1)', margin: 0 },
    boxGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' },
    box: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0' },
    boxAccent: { background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, var(--navy2) 60%)', borderColor: 'rgba(79,142,247,0.2)' },
    boxHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
    boxIcon: { fontSize: '1.4rem' },
    boxTitle: { fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' },
    boxDivider: { height: '1px', background: 'var(--border)', marginBottom: '1rem' },
    boxText: { fontSize: '0.92rem', lineHeight: 1.8, color: 'var(--text2)', margin: 0 },
    missingText: { fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 },
    salaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginTop: '1.25rem' },
    salaryItem: { textAlign: 'center', padding: '0.6rem 0.4rem', background: 'rgba(79,142,247,0.05)', border: '1px solid var(--border)', borderRadius: '10px' },
    salaryLabel: { fontSize: '0.55rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' },
    salaryValue: { fontSize: '0.78rem', fontWeight: 800, color: 'var(--accent)' },
    tagGroupLabel: { fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' },
    tagRow: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
    tag: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: '8px', border: '1px solid', fontSize: '0.75rem', fontWeight: 600 },
    tagBadge: { fontSize: '0.6rem', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.1rem 0.3rem', color: 'var(--muted)' },
};

export default RoleDetailedView;
