import React from 'react';
import { Compass, Info, Map } from 'lucide-react';

/* ─────────────────────────────────────────────
   DirectionOverview
   Props:
     directionData: {
       directionId, directionName, directionDescription,
       directionOverview, type, roles: [{ role, id }]
     }
     roleName: current role name string
   ──────────────────────────────────────────── */

const DirectionOverview = ({ directionData }) => {

    /* ── No Direction Data ── */
    if (!directionData || !directionData.directionName) {
        return (
            <div style={styles.emptyWrap}>
                <div style={styles.emptyIcon}><Compass size={48} color="var(--muted)" strokeWidth={1.5} /></div>
                <h3 style={styles.emptyTitle}>No Career Direction Data</h3>
                <p style={styles.emptyText}>
                    Direction data is sourced from your onboarding selection. Go through
                    onboarding again and select a Career Direction to see the full breakdown
                    here.
                </p>
            </div>
        );
    }

    // FIX: Normalize fields — the direction-roles API returns a single `overview` field,
    // but the engine stores both `directionDescription` and `directionOverview`.
    // Support both shapes so the UI always shows content.
    const normalizedData = {
        ...directionData,
        directionDescription: directionData.directionDescription || directionData.overview || '',
        directionOverview:    directionData.directionOverview    || directionData.overview || '',
    };

    const { directionId, directionName, directionDescription, directionOverview, type, roles = [] } = normalizedData;

    const validRoles = roles.filter(r => r.role && r.role.trim() !== '');


    /* ── Type badge colour ── */
    const typeMeta = {
        Primary: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', color: 'var(--green)', dot: '#10b981' },
        Secondary: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: 'var(--amber)', dot: '#f59e0b' },
        Alternative: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', color: '#a78bfa', dot: '#a78bfa' },
        Alternate: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', color: '#a78bfa', dot: '#a78bfa' },
    };
    const t = typeMeta[type] || typeMeta['Primary'];

    return (
        <div style={styles.container} className="animate-fade-in">

            {/* ── Header strip ── */}
            <div style={styles.headerStrip}>
                <div style={styles.headerLeft}>
                    <div style={styles.headerChip}>
                        <span style={styles.chipDot} />
                        <span style={styles.chipText}>CAREER DIRECTION</span>
                    </div>
                    <h2 style={styles.dirName}>{directionName}</h2>
                    {directionId && (
                        <div style={{}}>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Single info box: Direction Overview ── */}
            <div style={styles.singleBox}>
                <div style={styles.boxHeader}>
                    <div style={{ background: 'var(--accent-tint)', padding: '0.4rem', borderRadius: '8px', display: 'flex', fontSize: '1.2rem' }}>
                        🗺️
                    </div>
                    <div style={styles.boxTitle}>Direction Overview</div>
                </div>
                <div style={styles.boxDivider} />
                <p style={styles.boxText}>{directionOverview || directionDescription || '—'}</p>
            </div>
 
            {/* ── Core Roles – These are the possible ways ── */}
            <div style={styles.rolesSection}>
                <div style={styles.rolesSectionHeader}>
                    <div style={styles.rolesSectionLabel}>
                        <span style={styles.rolesSectionDot} />
                        Possible Job Roles for This Career Direction
                    </div>
                </div>
 
                <div className="dir-roles-grid">
                    {validRoles.map((r, i) => {
                        return (
                            <div
                                key={r.id || i}
                                className="dir-role-card"
                            >
                                <div className="dir-role-card-number">{i + 1}</div>
                                <div style={styles.roleCardBody}>
                                    <div className="dir-role-card-name">
                                        {r.role}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Inline styles — SMAART v7 dark theme
──────────────────────────────────────────── */
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '0.25rem',
    },

    /* Empty state */
    emptyWrap: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '320px',
        textAlign: 'center',
        padding: '3rem',
    },
    emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
    emptyTitle: {
        color: 'var(--text2)', margin: 0, marginBottom: '0.5rem',
        fontSize: '1.1rem', fontWeight: 800,
    },
    emptyText: {
        color: 'var(--muted)', fontSize: '0.85rem',
        lineHeight: 1.65, maxWidth: '380px',
    },

    /* Header */
    headerStrip: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
    },
    headerLeft: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
    headerChip: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem' },
    chipDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' },
    chipText: {
        fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
        color: 'var(--accent)', textTransform: 'uppercase',
    },
    dirName: {
        fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em',
        color: 'var(--text1)', margin: 0,
    },
    typeBadge: {
        display: 'inline-flex', alignItems: 'center',
        padding: '0.3rem 0.75rem',
        borderRadius: '100px',
        fontSize: '0.68rem', fontWeight: 700,
        width: 'fit-content',
        letterSpacing: '0.03em',
    },

    /* Single full-width info box */
    singleBox: {
        background: 'linear-gradient(135deg, var(--accent-tint) 0%, var(--navy2) 60%)',
        border: '1px solid var(--accent-border)',
        borderRadius: '16px',
        padding: '1.5rem',
    },
    /* Legacy twoCol kept for reference but unused */
    twoCol: {
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: '1.25rem',
    },
    infoBox: {
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
    },
    infoBoxAccent: {
        background: 'linear-gradient(135deg, var(--accent-tint) 0%, var(--navy2) 60%)',
        borderColor: 'var(--accent-border)',
    },
    boxHeader: {
        display: 'flex', alignItems: 'center',
        gap: '0.65rem', marginBottom: '0.75rem',
    },
    boxIcon: { fontSize: '1.3rem', lineHeight: 1 },
    boxTitle: { fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent)' },
    boxDivider: { height: 1, background: 'var(--border)', marginBottom: '1rem' },
    boxText: {
        fontSize: '0.9rem', lineHeight: 1.75,
        color: 'var(--text2)', margin: 0,
    },

    /* Roles section */
    rolesSection: {
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
    },
    rolesSectionHeader: {
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.25rem',
    },
    rolesSectionLabel: {
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        fontSize: '0.65rem', fontWeight: 800,
        color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
    },
    rolesSectionDot: {
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--accent)', display: 'inline-block',
    },
    roleCount: {
        fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--muted)',
        padding: '0.2rem 0.6rem',
        background: 'var(--navy3)',
        border: '1px solid var(--border)',
        borderRadius: '100px',
    },
    rolesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '0.65rem',
    },
    roleCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--navy3)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        cursor: 'default',
    },
    roleCardNumber: {
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: '50%',
        background: 'var(--accent-tint)',
        border: '1px solid var(--accent-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.68rem', fontWeight: 900,
        color: 'var(--accent)',
    },
    roleCardBody: { flex: 1, minWidth: 0 },
    roleCardName: {
        fontSize: '0.82rem', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        flexWrap: 'wrap',
    },
    roleCardId: {
        fontSize: '0.62rem', color: 'var(--muted)',
        marginTop: '0.15rem', fontFamily: 'monospace',
    },
    roleCardActive: {},
    currentBadge: {},
    activeCheck: {},
};

export default DirectionOverview;
