import React, { useEffect, useState, useRef } from 'react';

const SkillsPanel = ({ roleName, mongoRoleData, direction }) => {
    const [selectedRole, setSelectedRole] = useState(roleName);
    const [familyRoles, setFamilyRoles] = useState([]);
    const [dbRole, setDbRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    // Track context to avoid infinite loops
    const contextId = `${roleName}_${mongoRoleData?.job_family || ''}`;
    const lastContext = useRef(null);

    /* 1. Resolve Family Roles (Horizontal Tabs) */
    useEffect(() => {
        if (lastContext.current === contextId) return;
        lastContext.current = contextId;

        const resolveFamily = async () => {
            let roles = [];

            // Case A: From props/Analysis state
            if (direction?.roles && direction.roles.length > 0) {
                roles = direction.roles.map(r => typeof r === 'string' ? r : (r.role || r.role_name));
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

            // Case C: Predict direction from roleName if still empty
            if (roles.length === 0 && roleName) {
                try {
                    const dirRes = await fetch('/api/career-direction', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ roleName, degree: 'Any', specialisation: 'Any' })
                    });
                    if (dirRes.ok) {
                        const dirData = await dirRes.json();
                        if (dirData?.direction?.roles) {
                            roles = dirData.direction.roles;
                        }
                    }
                } catch (e) { console.warn('Direction prediction err:', e); }
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
            } else {
                setSelectedRole(roleName);
            }
        };

        resolveFamily();
    }, [contextId, direction, mongoRoleData, roleName]);

    /* 2. Fetch Skills for Selected Role */
    useEffect(() => {
        if (!selectedRole) return;
        
        // SPECIAL GUARD: If selectedRole is EXACTLY the same as the Job Family name, 
        // we shouldn't attempt a role fetch yet, as it's likely a category container.
        const jf = (mongoRoleData?.job_family || mongoRoleData?.tab1?.job_family || '').toLowerCase();
        if (selectedRole.toLowerCase() === jf && familyRoles.length > 0) {
             // Let resolveFamily update selectedRole to the first sub-role instead
             return;
        }

        let cancelled = false;
        
        const loadSkills = async () => {
            setLoading(true);
            setErrorMsg(null);
            try {
                // Fetch from roleSkills collection - Ensure absolute path starting with /
                const res = await fetch(`/api/role-skills/${encodeURIComponent(selectedRole)}`);
                if (!res.ok) {
                    // Try basic role data if skills collection is missing this specific entry
                    const fallbackRes = await fetch(`/api/career-role/${encodeURIComponent(selectedRole)}`);
                    if (fallbackRes.ok) {
                        const basic = await fallbackRes.json();
                        if (!cancelled) {
                            setDbRole(basic);
                            setLoading(false);
                        }
                    } else {
                        if (!cancelled) {
                            setDbRole(null);
                            setLoading(false);
                        }
                    }
                    return;
                }
                const data = await res.json();
                if (!cancelled) {
                    setDbRole(data);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setErrorMsg(e.message);
                    setLoading(false);
                }
            }
        };

        loadSkills();
        return () => { cancelled = true; };
    }, [selectedRole, familyRoles, mongoRoleData]);

    if (loading) {
        return (
            <div style={styles.loadingWrap}>
                <div style={styles.spinner} />
                <p style={{ color: 'var(--muted)', marginTop: '1rem', fontSize: '0.85rem' }}>Resolving skill DNA for {selectedRole}...</p>
            </div>
        );
    }

    const skills = dbRole?.skills || [];
    
    // Group by category if available
    const categories = [...new Set(skills.map(s => s.skillCategory))].filter(Boolean);

    return (
        <div style={styles.container} className="animate-fade-in">
            
            {/* ── Role Selector Tabs ── */}
            {familyRoles.length > 0 && (
                <div 
                    className="custom-scrollbar"
                    style={{ 
                        display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.8rem', 
                        borderBottom: '1px solid var(--border)',
                        msOverflowStyle: 'none'
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

            {/* ───── Page Header ───── */}
            <div style={styles.pageHeader}>
                <div style={styles.roleChip}>
                    <span style={styles.roleChipDot} />
                    <span style={styles.roleChipText}>SKILL DNA • {selectedRole}</span>
                </div>
                <h2 style={styles.roleName}>Skill DNA Profile</h2>
                <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: 0 }}>
                    Granular breakdown of core competencies, tools, and certifications required in the industry today.
                </p>
            </div>

            {!dbRole || skills.length === 0 ? (
                <div style={styles.emptyWrap}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔬</div>
                    <h3 style={{ color: 'var(--text2)', marginBottom: '0.5rem' }}>No Skill Data for "{selectedRole}"</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
                        The Agent Database doesn't have a mapped skill profile for this specific variant yet. 
                        Please try another role from the tabs above.
                    </p>
                </div>
            ) : (
                <div style={styles.skillsGrid}>
                    {categories.map(cat => (
                        <div key={cat} style={styles.categoryWrap}>
                            <h4 style={styles.categoryTitle}>{cat}</h4>
                            <div style={styles.tagWrap}>
                                {skills
                                    .filter(s => s.skillCategory === cat)
                                    .map((s, i) => (
                                        <div key={i} style={styles.skillTag}>
                                            <span style={styles.skillName}>{s.skillName}</span>
                                            {s.importance && <span style={{...styles.importance, background: s.importance === 'High' ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.03)', color: s.importance === 'High' ? 'var(--accent)' : 'var(--muted)'}}>{s.importance}</span>}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* Uncategorized skills fallback */}
                    {skills.filter(s => !s.skillCategory).length > 0 && (
                        <div style={styles.categoryWrap}>
                            <h4 style={styles.categoryTitle}>Additional Competencies</h4>
                            <div style={styles.tagWrap}>
                                {skills
                                    .filter(s => !s.skillCategory)
                                    .map((s, i) => (
                                        <div key={i} style={styles.skillTag}>
                                            <span style={styles.skillName}>{s.skillName}</span>
                                            {s.importance && <span style={{...styles.importance, background: s.importance === 'High' ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.03)', color: s.importance === 'High' ? 'var(--accent)' : 'var(--muted)'}}>{s.importance}</span>}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0.25rem' },
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
    spinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' },
    emptyWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', textAlign: 'center', padding: '2rem', background: 'var(--navy2)', borderRadius: '16px', border: '1px solid var(--border)' },
    pageHeader: { display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' },
    roleChip: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
    roleChipDot: { width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)' },
    roleChipText: { fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent)', textTransform: 'uppercase' },
    roleName: { fontSize: '1.4rem', fontWeight: 900, color: 'var(--text1)', letterSpacing: '-0.02em', margin: 0 },
    skillsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' },
    categoryWrap: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.25rem' },
    categoryTitle: { fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', borderBottom: '1px solid rgba(79,142,247,0.1)', paddingBottom: '0.5rem' },
    tagWrap: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
    skillTag: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' },
    skillName: { fontSize: '0.8rem', fontWeight: 600, color: 'var(--text2)' },
    importance: { fontSize: '0.55rem', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase' },
};

export default SkillsPanel;
