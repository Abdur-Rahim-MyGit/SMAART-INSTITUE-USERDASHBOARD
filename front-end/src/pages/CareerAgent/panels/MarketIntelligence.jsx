import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, Globe, Zap, UserCheck, BarChart3, ChevronRight, Info } from 'lucide-react';

/**
 * MarketIntelligence
 * ─────────────────────────────────────────────────────────────────────────
 * Direction is controlled ENTIRELY by the top 3 tabs in the dashboard
 * (activeTabIndex = activeRole - 1). No duplicate direction switcher here.
 *
 * Role chips = specific job roles inside the active direction.
 * Content    = fetched live from /api/career-agent/role-profile/:roleTitle
 *
 * Props:
 *   roleName       – active role name for the current direction (from top tab)
 *   allDirections  – [{ label, directionName, roles:[{role,id}] }, ...]
 *   activeTabIndex – 0/1/2 — which direction is active (synced with top tabs)
 */
const MarketIntelligence = ({ roleName, allDirections = [], activeTabIndex = 0 }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleProfile, setRoleProfile]   = useState(null);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState(null);
    const [fetchedRoles, setFetchedRoles] = useState([]);

    /* ── Current direction data from the prop (no internal activeDir state) ── */
    const currentDir   = allDirections[activeTabIndex] || allDirections[0] || {};
    const dirRolesRaw  = (currentDir.roles || []).filter(r => r && (typeof r === 'string' ? r : r.role));
    const dirRoleNames = dirRolesRaw.length > 0
        ? dirRolesRaw.map(r => typeof r === 'string' ? r : r.role)
        : fetchedRoles;

    /* ── When top tab changes (activeTabIndex), reset and reload roles ── */
    useEffect(() => {
        setFetchedRoles([]);
        setRoleProfile(null);
        setError(null);

        if (dirRolesRaw.length > 0) {
            // Use roles from analysis data directly
            const names = dirRolesRaw.map(r => typeof r === 'string' ? r : r.role);
            const match = names.find(n => n?.toLowerCase() === roleName?.toLowerCase());
            setSelectedRole(match || names[0]);
            return;
        }

        // Fallback: fetch roles from careerdirections collection
        const dirName = currentDir.directionName || currentDir.label;
        if (!dirName) return;

        fetch(`/api/career-agent/direction-roles/${encodeURIComponent(dirName)}`)
            .then(r => r.json())
            .then(data => {
                if (data.roles && data.roles.length > 0) {
                    const names = data.roles.map(r => r.role);
                    setFetchedRoles(names);
                    const match = names.find(n => n?.toLowerCase() === roleName?.toLowerCase());
                    setSelectedRole(match || names[0]);
                } else {
                    setSelectedRole(null); // No roles in DB for this direction
                }
            })
            .catch(e => console.warn('[MarketIntel] direction-roles fetch error:', e));
    }, [activeTabIndex]); // eslint-disable-line

    /* ── Fetch role profile whenever selected role changes ── */
    const fetchProfile = useCallback(async (title) => {
        if (!title) return;
        setLoading(true);
        setError(null);
        setRoleProfile(null);
        try {
            const res = await fetch(`/api/career-agent/role-profile/${encodeURIComponent(title)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `No market data for "${title}"`);
            }
            setRoleProfile(await res.json());
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedRole) fetchProfile(selectedRole);
    }, [selectedRole, fetchProfile]);

    /* ── Helpers ── */
    const aiColor = pct => pct >= 65 ? '#ef4444' : pct >= 45 ? '#f59e0b' : '#3b82f6';

    /* ── No data in DB for this direction ── */
    if (!loading && dirRoleNames.length === 0 && selectedRole === null) {
        return (
            <div style={S.emptyState}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔧</div>
                <h3 style={{ color: 'var(--text2)', margin: '0 0 0.5rem' }}>Data Coming Soon</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', maxWidth: '380px', textAlign: 'center' }}>
                    Market intelligence for <strong style={{ color: 'var(--text1)' }}>
                        {currentDir.label || currentDir.directionName}
                    </strong> is not yet in the database. Your team is working on it.
                </p>
            </div>
        );
    }

    return (
        <div style={S.root} className="animate-fade-in">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                .mi-content-grid {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 1.5rem;
                    margin-top: 0.25rem;
                }
                @media (max-width: 900px) {
                    .mi-content-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {/* ── Role chips for the active direction ── */}
            {dirRoleNames.length > 0 && (
                <div style={S.roleRow}>
                    {dirRoleNames.map(role => (
                        <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            style={{ ...S.roleChip, ...(selectedRole === role ? S.roleChipActive : {}) }}
                        >
                            {role}
                            {selectedRole === role && <ChevronRight size={13} style={{ marginLeft: '3px' }} />}
                        </button>
                    ))}
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div style={S.loadWrap}>
                    <div style={S.spinner} />
                    <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: '1rem' }}>
                        Loading market intelligence for <strong>{selectedRole}</strong>…
                    </p>
                </div>
            )}

            {/* ── Error ── */}
            {!loading && error && (
                <div style={S.emptyState}>
                    <Info size={28} color="var(--muted)" />
                    <p style={{ marginTop: '0.75rem', color: 'var(--muted)', fontSize: '0.88rem' }}>{error}</p>
                </div>
            )}

            {/* ── Main Content ── */}
            {!loading && !error && roleProfile && (
                <div className="mi-content-grid">

                    {/* LEFT: Role Header + AI Narrative */}
                    <div style={S.mainCol}>

                        {/* Role Header — name LEFT, entry salary RIGHT */}
                        <div style={S.roleHeader}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={S.roleTitleArea}>
                                    <h1 style={S.roleTitleText}>{roleProfile.roleTitle}</h1>
                                </div>
                                {roleProfile.salaryYear0_1 && (
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Entry-Level Salary</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.02em', lineHeight: 1 }}>{roleProfile.salaryYear0_1}</div>
                                        <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginTop: '0.2rem' }}>per annum (LPA)</div>
                                    </div>
                                )}
                            </div>
                            {roleProfile.jobFamily && (
                                <p style={S.roleFamilyLabel}>
                                    {roleProfile.jobFamily.replace(/^JF\d+\s*[–-]\s*/, '')}
                                </p>
                            )}
                        </div>

                        {/* How AI Is Changing This Role */}
                        {roleProfile.howAiChanging && (
                            <div style={S.sectionBlock}>
                                <div style={S.sectionHeading}><Zap size={16} color="var(--accent)" /> How AI is Changing This Role</div>
                                <div style={S.narrativeBox}>
                                    <div style={S.narrativeItem}>{roleProfile.howAiChanging}</div>
                                </div>
                            </div>
                        )}

                        {/* English & Communication — moved from sidebar */}
                        {roleProfile.englishRequirement && (
                            <div style={S.sectionBlock}>
                                <div style={S.sectionHeading}><Globe size={16} color="var(--accent)" /> English &amp; Communication</div>
                                <div style={{ marginBottom: '0.6rem' }}>
                                    <span style={S.reqBadge}>{roleProfile.englishRequirement}</span>
                                </div>
                                {roleProfile.englishContext && <p style={{ ...S.narrativeItem, marginTop: 0 }}>{roleProfile.englishContext}</p>}
                            </div>
                        )}

                        {/* Career Growth Path — moved from sidebar */}
                        {roleProfile.careerGrowthPath && (
                            <div style={S.sectionBlock}>
                                <div style={S.sectionHeading}><BarChart3 size={16} color="var(--accent)" /> Career Growth Path</div>
                                <div style={S.narrativeBox}>
                                    <div style={S.narrativeItem}>{roleProfile.careerGrowthPath}</div>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* RIGHT: AI Gauge + Human Value only */}
                    <div style={S.sideCol}>

                        {roleProfile.aiExposurePct > 0 && (
                            <div style={S.gaugeCard}>
                                <div style={S.gaugeLabel}>AI Exposure Index</div>
                                <div style={{ ...S.gaugeValue, color: aiColor(roleProfile.aiExposurePct) }}>
                                    {roleProfile.aiExposurePct}%
                                </div>
                                {roleProfile.aiExposureLevel && (
                                    <div style={{ ...S.gaugeLevel, background: aiColor(roleProfile.aiExposurePct) + '22', color: aiColor(roleProfile.aiExposurePct) }}>
                                        {roleProfile.aiExposureLevel} Exposure
                                    </div>
                                )}
                                <div style={S.progressBarBase}>
                                    <div style={{ ...S.progressBarFill, width: `${roleProfile.aiExposurePct}%`, background: aiColor(roleProfile.aiExposurePct) }} />
                                </div>
                            </div>
                        )}

                        {roleProfile.humanValueTasks && (
                            <div style={S.sideBlock}>
                                <div style={S.sideLabel}><UserCheck size={14} /> Irreplaceable Human Value</div>
                                <p style={S.sideDetail}>{roleProfile.humanValueTasks}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Styles ─── */
const S = {
    root: { display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text1)' },
    loadWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px' },
    spinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' },
    emptyState: { textAlign: 'center', padding: '4rem 2rem', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' },

    /* Role chips */
    roleRow: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' },
    roleChip: {
        display: 'flex', alignItems: 'center',
        padding: '0.42rem 0.95rem', background: 'var(--navy3)',
        border: '1px solid var(--border)', borderRadius: '100px',
        fontSize: '0.74rem', fontWeight: 600, color: 'var(--text2)',
        cursor: 'pointer', transition: 'all 0.2s',
    },
    roleChipActive: {
        background: 'var(--accent)', borderColor: 'var(--accent)',
        color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
    },

    /* Main 2-col grid */
    contentGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', marginTop: '0.25rem' },
    mainCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    sideCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

    /* Role header */
    roleHeader: {
        padding: '1.4rem 1.5rem',
        background: 'linear-gradient(135deg, var(--navy2) 0%, var(--navy3) 100%)',
        border: '1px solid var(--border)', borderRadius: '16px',
    },
    roleTitleArea: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
    roleTitleText: { margin: 0, fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.02em' },
    roleIdBadge: { padding: '0.2rem 0.5rem', fontSize: '0.62rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', color: 'var(--muted)', borderRadius: '4px', border: '1px solid var(--border)' },
    roleFamilyLabel: { margin: '0.3rem 0 0 0', color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },

    /* Narrative */
    sectionBlock: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' },
    sectionHeading: { fontSize: '0.82rem', fontWeight: 800, color: 'var(--text1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    narrativeBox: { display: 'flex', flexDirection: 'column', gap: '0.9rem' },
    narrativeItem: { fontSize: '0.88rem', lineHeight: 1.65, color: 'var(--text2)' },

    /* Entry salary card */
    entryCard: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '12px', marginBottom: '0.75rem', marginTop: '0.5rem' },
    entryDot: { width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa', flexShrink: 0 },
    entryContent: { flex: 1 },
    entryLabel: { fontSize: '0.62rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' },
    entryValue: { fontSize: '1.45rem', fontWeight: 900, color: '#60a5fa', letterSpacing: '-0.02em' },
    entryNote: { fontSize: '0.6rem', fontWeight: 600, color: 'var(--muted)', textAlign: 'right', flexShrink: 0 },

    /* Salary progression (non-entry levels) */
    salaryTimeline: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.5rem' },
    salaryPoint: { padding: '1rem 0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' },
    salaryDot: { width: '8px', height: '8px', borderRadius: '50%', margin: '0 auto 0.6rem' },
    salaryLabel: { fontSize: '0.58rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' },
    salaryValue: { fontSize: '0.88rem', fontWeight: 900 },

    /* Side gauge */
    gaugeCard: { padding: '1.5rem', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', textAlign: 'center' },
    gaugeLabel: { fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' },
    gaugeValue: { fontSize: '2.5rem', fontWeight: 950, lineHeight: 1, marginBottom: '0.5rem' },
    gaugeLevel: { padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.68rem', fontWeight: 800, display: 'inline-block', marginBottom: '1.25rem' },
    progressBarBase: { height: '8px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: '100px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' },

    /* Sidebar blocks */
    sideBlock: { padding: '1.25rem', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px' },
    sideLabel: { fontSize: '0.68rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' },
    sideDetail: { margin: 0, fontSize: '0.82rem', lineHeight: 1.65, color: 'var(--text2)' },
    reqBadge: { padding: '0.32rem 0.75rem', background: 'var(--accent-tint)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: '6px', fontWeight: 800, fontSize: '0.74rem', display: 'inline-block', marginBottom: '0.6rem' },
};

export default MarketIntelligence;
