import React, { useEffect, useState } from 'react';
import { Briefcase, TrendingUp, DollarSign, Globe, Award, Info, ChevronRight, BarChart3, Bot, Zap, UserCheck, Compass } from 'lucide-react';

/* ─── Components ─── */

const MarketIntelligence = ({ roleName: initialRoleName, fallback }) => {
    const [allProfiles, setAllProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFamily, setSelectedFamily] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            try {
                const res = await fetch('/api/career-agent/role-profiles');
                if (!res.ok) throw new Error('API fetch failed');
                const data = await res.json();

                if (mounted) {
                    // Filter based on specific Direction Roles if available
                    const directionRoles = fallback?.direction?.roles || [];
                    let filteredData = data;

                    if (directionRoles.length > 0) {
                        const drIds = directionRoles.map(r => r.id);
                        const drTitles = directionRoles.map(r => r.role?.toLowerCase());

                        const matched = data.filter(p =>
                            drIds.includes(p.roleId) ||
                            drTitles.includes(p.roleTitle?.toLowerCase())
                        );

                        if (matched.length > 0) {
                            filteredData = matched;
                        }
                    }

                    setAllProfiles(filteredData);

                    // Try to find the initial role passed from dashboard within the filtered set
                    const matching = filteredData.find(p =>
                        p.roleTitle?.toLowerCase() === initialRoleName?.toLowerCase() ||
                        p.roleId === initialRoleName
                    );

                    if (matching) {
                        setSelectedRole(matching);
                        setSelectedFamily(matching.jobFamily);
                    } else if (filteredData.length > 0) {
                        // Default to first profile if no match
                        setSelectedRole(filteredData[0]);
                        setSelectedFamily(filteredData[0].jobFamily);
                    }
                    setLoading(false);
                }
            } catch (err) {
                console.error('Market Intel load error:', err);
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [initialRoleName, fallback]);

    if (loading) return (
        <div style={S.loadWrap}>
            <div style={S.spinner} />
            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '1rem' }}>Synchronizing Market Intelligence...</p>
        </div>
    );

    if (allProfiles.length === 0) return (
        <div style={S.emptyState}>
            <Info size={32} color="var(--muted)" />
            <p>No role profile data available in the system.</p>
        </div>
    );

    // Grouping for tabs
    const directionName = fallback?.direction?.directionName;
    const families = [...new Set(allProfiles.map(p => p.jobFamily))].sort();
    const rolesInFamily = directionName ? allProfiles : allProfiles.filter(p => p.jobFamily === selectedFamily);
    const p = selectedRole;

    /* ── Helpers ── */
    const aiColor = pct => pct >= 65 ? '#ef4444' : pct >= 45 ? '#f59e0b' : '#3b82f6';

    return (
        <div style={S.root} className="animate-fade-in">

            {/* ── TOP TABS: Job Families (or Direction Name if filtered) ── */}
            <div style={S.familyTabs}>
                {directionName ? (
                    <div style={{ ...S.familyTab, ...S.familyTabActive, display: 'flex', alignItems: 'center', gap: '0.4rem', pointerEvents: 'none' }}>
                        <Compass size={14} /> Core Entry Roles for {directionName}
                    </div>
                ) : (
                    families.map(fam => (
                        <button
                            key={fam}
                            onClick={() => {
                                setSelectedFamily(fam);
                                const firstInFam = allProfiles.find(x => x.jobFamily === fam);
                                setSelectedRole(firstInFam);
                            }}
                            style={{
                                ...S.familyTab,
                                ...(selectedFamily === fam ? S.familyTabActive : {})
                            }}
                        >
                            {fam.split(' – ')[1] || fam}
                        </button>
                    ))
                )}
            </div>

            {/* ── SUB TABS: Roles in Selected Family ── */}
            <div style={S.roleSelector}>
                {rolesInFamily.map(role => (
                    <button
                        key={role.roleId}
                        onClick={() => setSelectedRole(role)}
                        style={{
                            ...S.roleChip,
                            ...(selectedRole?.roleId === role.roleId ? S.roleChipActive : {})
                        }}
                    >
                        {role.roleTitle}
                        {selectedRole?.roleId === role.roleId && <ChevronRight size={14} style={{ marginLeft: '4px' }} />}
                    </button>
                ))}
            </div>

            {/* ── MAIN CONTENT AREA ── */}
            {p && (
                <div key={p.roleId} style={S.contentGrid}>

                    {/* Column 1: Core Stats & Narrative */}
                    <div style={S.mainCol}>

                        {/* Header Info */}
                        <div style={S.roleHeader}>
                            <div style={S.roleTitleArea}>
                                <h1 style={S.roleTitleText}>{p.roleTitle}</h1>
                                <span style={S.roleIdBadge}>{p.roleId}</span>
                            </div>
                            <p style={S.roleFamilyLabel}>{p.jobFamily}</p>
                        </div>

                        {/* Narrative Sections */}
                        <div style={S.sectionBlock}>
                            <div style={S.sectionHeading}><Zap size={16} color="var(--accent)" /> Role Intelligence Overview</div>
                            <div style={S.narrativeBox}>
                                <div style={S.narrativeItem}>
                                    <strong>Context:</strong> {p.whatRoleDoes}
                                </div>
                                <div style={S.narrativeItem}>
                                    <strong>AI Evolution:</strong> {p.howAiChanging}
                                </div>
                                <div style={S.narrativeItem}>
                                    <strong>Ideal Candidate:</strong> {p.whoShouldConsider}
                                </div>
                            </div>
                        </div>

                        {/* Salary Progression */}
                        <div style={S.sectionBlock}>
                            <div style={S.sectionHeading}><TrendingUp size={16} color="var(--green)" /> Salary Progression (LPA)</div>
                            <div style={S.salaryTimeline}>
                                <SalaryPoint label="Entry (0-1y)" value={p.salaryYear0_1} color="#60a5fa" />
                                <SalaryPoint label="Growth (2-3y)" value={p.salaryYear2_3} color="#34d399" />
                                <SalaryPoint label="Mid (4-5y)" value={p.salaryYear4_5} color="#fbbf24" />
                                <SalaryPoint label="Expert (6+y)" value={p.salaryYear6plus} color="#f87171" />
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Specific Attributes & AI Pulse */}
                    <div style={S.sideCol}>

                        {/* AI Exposure Gauge */}
                        <div style={S.gaugeCard}>
                            <div style={S.gaugeLabel}>AI Exposure Index</div>
                            <div style={{ ...S.gaugeValue, color: aiColor(p.aiExposurePct) }}>{p.aiExposurePct}%</div>
                            <div style={{ ...S.gaugeLevel, background: aiColor(p.aiExposurePct) + '22', color: aiColor(p.aiExposurePct) }}>
                                {p.aiExposureLevel} Exposure
                            </div>
                            <div style={S.progressBarBase}>
                                <div style={{ ...S.progressBarFill, width: `${p.aiExposurePct}%`, background: aiColor(p.aiExposurePct) }} />
                            </div>
                        </div>

                        {/* Human Value Matrix */}
                        <div style={S.sideBlock}>
                            <div style={S.sideLabel}><UserCheck size={14} /> Irreplaceable Human Value</div>
                            <p style={S.sideDetail}>{p.humanValueTasks}</p>
                        </div>

                        {/* Requirements */}
                        <div style={S.sideBlock}>
                            <div style={S.sideLabel}><Globe size={14} /> English & Communication</div>
                            <div style={S.reqBadge}>{p.englishRequirement}</div>
                            <p style={S.sideDetail}>{p.englishContext}</p>
                        </div>

                        {/* <div style={S.sideBlock}>
                            <div style={S.sideLabel}><Award size={14} /> Career Trajectory</div>
                            <p style={S.sideDetail}>{p.careerGrowthPath}</p>
                        </div> */}

                    </div>
                </div>
            )}
        </div>
    );
};

/* ─── Sub-components ─── */

const SalaryPoint = ({ label, value, color }) => (
    <div style={S.salaryPoint}>
        <div style={{ ...S.salaryDot, background: color }} />
        <div style={S.salaryLabel}>{label}</div>
        <div style={S.salaryValue}>{value}</div>
    </div>
);

/* ─── Styles ─── */
const S = {
    root: { display: 'flex', flexDirection: 'column', gap: '1.25rem', color: 'var(--text1)' },
    loadWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
    spinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' },
    emptyState: { textAlign: 'center', padding: '4rem', color: 'var(--muted)' },

    /* Tab styles */
    familyTabs: {
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        paddingBottom: '0.25rem',
        scrollbarWidth: 'none',
        borderBottom: '1px solid var(--border)'
    },
    familyTab: {
        padding: '0.6rem 1rem',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--muted)',
        background: 'transparent',
        border: 'none',
        borderBottom: '2px solid transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.2s ease',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    },
    familyTabActive: {
        color: 'var(--accent)',
        borderBottom: '2px solid var(--accent)'
    },

    roleSelector: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.6rem',
        marginTop: '0.5rem'
    },
    roleChip: {
        padding: '0.45rem 1rem',
        background: 'var(--navy3)',
        border: '1px solid var(--border)',
        borderRadius: '100px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--text2)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.2s'
    },
    roleChipActive: {
        background: 'var(--accent)',
        borderColor: 'var(--accent)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
    },

    /* Main Content Layout */
    contentGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '1.5rem',
        marginTop: '0.5rem'
    },
    mainCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
    sideCol: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

    /* Header */
    roleHeader: {
        padding: '1.5rem',
        background: 'linear-gradient(135deg, var(--navy2) 0%, var(--navy3) 100%)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
    },
    roleTitleArea: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    roleTitleText: { margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em' },
    roleIdBadge: {
        padding: '0.2rem 0.5rem',
        fontSize: '0.65rem',
        fontWeight: 800,
        background: 'rgba(255,255,255,0.05)',
        color: 'var(--muted)',
        borderRadius: '4px',
        border: '1px solid var(--border)'
    },
    roleFamilyLabel: { margin: '0.25rem 0 0 0', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' },

    /* Section Blocks */
    sectionBlock: { background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem' },
    sectionHeading: { fontSize: '0.85rem', fontWeight: 800, color: 'var(--text1)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    narrativeBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
    narrativeItem: { fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text2)' },

    /* Salary Timeline */
    salaryTimeline: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '0.5rem' },
    salaryPoint: { padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', textAlign: 'center' },
    salaryDot: { width: '8px', height: '8px', borderRadius: '50%', margin: '0 auto 0.6rem auto' },
    salaryLabel: { fontSize: '0.6rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' },
    salaryValue: { fontSize: '0.9rem', fontWeight: 900 },

    /* Sidebar Guage */
    gaugeCard: {
        padding: '1.5rem',
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        textAlign: 'center'
    },
    gaugeLabel: { fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' },
    gaugeValue: { fontSize: '2.5rem', fontWeight: 950, lineHeight: 1, marginBottom: '0.5rem' },
    gaugeLevel: { padding: '0.25rem 0.75rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 800, display: 'inline-block', marginBottom: '1.25rem' },
    progressBarBase: { height: '8px', background: 'var(--border)', borderRadius: '100px', overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: '100px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' },

    /* Sidebar blocks */
    sideBlock: { padding: '1.25rem', background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '16px' },
    sideLabel: { fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' },
    sideDetail: { margin: 0, fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--text2)' },
    reqBadge: {
        padding: '0.35rem 0.75rem',
        background: 'rgba(79, 142, 247, 0.1)',
        color: 'var(--accent)',
        border: '1px solid rgba(79, 142, 247, 0.25)',
        borderRadius: '6px',
        fontWeight: 800,
        fontSize: '0.75rem',
        display: 'inline-block',
        marginBottom: '0.6rem'
    }
};

export default MarketIntelligence;
