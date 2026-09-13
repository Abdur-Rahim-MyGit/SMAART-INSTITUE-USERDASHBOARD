import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Briefcase, Bot, UserCheck, TrendingUp, X } from '@/components/icons';

/* ─────────────────────────────────────────────────────────────
   DirectionRolesGrid
   Shared by Direction Overview and Recommended Directions so a
   recommended direction shows exactly the same depth as a chosen one:
     • role cards with a one-line plain-English brief (/role-briefs)
     • click a role → full profile sections (/role-profile/:roleTitle)
   Props:
     roles        [{ role, id }] | string[]
     currentRole  string (highlighted as the student's target role)
   ───────────────────────────────────────────────────────────── */

const BRIEF_CACHE = new Map();
const PROFILE_CACHE = new Map();

const normaliseRoles = (roles = []) => roles
    .map(r => (typeof r === 'string' ? { role: r, id: null } : r))
    .filter(r => r && typeof r.role === 'string' && r.role.trim() !== '');

const DirectionRolesGrid = ({ roles = [], currentRole = '' }) => {
    const list = useMemo(() => normaliseRoles(roles), [roles]);
    const names = useMemo(() => list.map(r => r.role), [list]);

    const [briefs, setBriefs] = useState({});
    const [briefsLoading, setBriefsLoading] = useState(false);
    const [openRole, setOpenRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState(false);

    // Collapse the detail when the role list changes (tab switch etc.)
    useEffect(() => { setOpenRole(null); setProfile(null); setProfileError(false); }, [names.join('|')]);

    /* ── Briefs ── */
    useEffect(() => {
        if (names.length === 0) { setBriefs({}); return; }
        const cached = {};
        const missing = [];
        names.forEach(n => { if (BRIEF_CACHE.has(n)) cached[n] = BRIEF_CACHE.get(n); else missing.push(n); });
        setBriefs(cached);
        if (missing.length === 0) return;

        let cancelled = false;
        setBriefsLoading(true);
        fetch('/api/career-agent/role-briefs', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names: missing }),
        })
            .then(r => (r.ok ? r.json() : { briefs: {} }))
            .then(p => {
                const got = p?.briefs || {};
                missing.forEach(n => BRIEF_CACHE.set(n, got[n] || { description: '', jobFamily: '' }));
                if (!cancelled) setBriefs(prev => ({ ...prev, ...got }));
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setBriefsLoading(false); });
        return () => { cancelled = true; };
    }, [names.join('|')]);

    /* ── Full profile for the opened role ── */
    useEffect(() => {
        if (!openRole) return;
        if (PROFILE_CACHE.has(openRole)) { setProfile(PROFILE_CACHE.get(openRole)); setProfileError(false); return; }
        let cancelled = false;
        setProfileLoading(true);
        setProfileError(false);
        setProfile(null);
        fetch(`/api/career-agent/role-profile/${encodeURIComponent(openRole)}`, { credentials: 'include' })
            .then(r => (r.ok ? r.json() : null))
            .then(p => {
                if (cancelled) return;
                if (p && p.roleTitle) { PROFILE_CACHE.set(openRole, p); setProfile(p); }
                else setProfileError(true);
            })
            .catch(() => { if (!cancelled) setProfileError(true); })
            .finally(() => { if (!cancelled) setProfileLoading(false); });
        return () => { cancelled = true; };
    }, [openRole]);

    if (list.length === 0) {
        return <div className="rec-empty">No job roles are mapped to this direction yet.</div>;
    }

    const sections = profile ? [
        { key: 'whatRoleDoes', title: 'What this role does', icon: <Briefcase size={18} /> },
        { key: 'whoShouldConsider', title: 'Who should consider it', icon: <UserCheck size={18} /> },
        { key: 'howAiChanging', title: 'How AI is changing it', icon: <Bot size={18} /> },
        { key: 'careerGrowthPath', title: 'Career growth path', icon: <TrendingUp size={18} /> },
    ] : [];

    const stats = profile ? [
        { k: 'Year 0–1', v: profile.salaryYear0_1 },
        { k: 'Year 2–3', v: profile.salaryYear2_3 },
        { k: 'Year 4–5', v: profile.salaryYear4_5 },
        { k: 'Year 6+', v: profile.salaryYear6plus },
    ].filter(s => s.v) : [];

    return (
        <div className="dp">
            <div className="dir-roles-grid">
                {list.map((r, i) => {
                    const b = briefs[r.role];
                    const isOpen = openRole === r.role;
                    const isCurrent = currentRole && r.role.toLowerCase() === String(currentRole).toLowerCase();
                    return (
                        <button
                            type="button"
                            key={r.id || `${r.role}-${i}`}
                            className={`dir-role-card clickable${isOpen ? ' selected' : ''}${!isOpen && isCurrent ? ' current' : ''}`}
                            onClick={() => setOpenRole(isOpen ? null : r.role)}
                            aria-expanded={isOpen}
                        >
                            <div className="dir-role-card-number">{i + 1}</div>
                            <div className="dir-role-body">
                                <div className="dir-role-card-name">{r.role}</div>
                                {b?.jobFamily && <div className="dir-role-card-family">{b.jobFamily}</div>}
                                {b ? (
                                    b.description
                                        ? <div className="dir-role-card-desc">{b.description}</div>
                                        : <div className="dir-role-card-desc muted">Description coming soon.</div>
                                ) : briefsLoading ? (
                                    <span className="dir-role-skel" />
                                ) : null}
                            </div>
                            <ChevronDown size={18} className="dir-role-caret" />
                        </button>
                    );
                })}
            </div>

            {openRole && (
                <div className="dir-role-detail animate-fade-in">
                    <div className="dir-role-detail-head">
                        <div className="dir-role-detail-title">{profile?.roleTitle || openRole}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {profile?.jobFamily && <span className="dchip brand">{profile.jobFamily}</span>}
                            {profile?.aiExposureLevel && <span className="dchip">AI exposure · {profile.aiExposureLevel}</span>}
                            <button type="button" className="btn-icon" style={{ width: 32, height: 32, borderRadius: 8 }} onClick={() => setOpenRole(null)} title="Close">
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {profileLoading ? (
                        <div className="rec-empty">Loading role profile…</div>
                    ) : profileError ? (
                        <div className="rec-empty">A detailed profile is not available for this role yet.</div>
                    ) : profile ? (
                        <>
                            {stats.length > 0 && (
                                <div className="dir-role-stats">
                                    {stats.map(s => (
                                        <div key={s.k} className="dir-role-stat">
                                            <div className="dir-role-stat-k">Salary · {s.k}</div>
                                            <div className="dir-role-stat-v">{s.v}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="dir-role-detail-grid">
                                {sections.map(sec => (
                                    <div key={sec.key} className="dir-role-section">
                                        <div className="dir-role-section-head"><span className="ic">{sec.icon}</span>{sec.title}</div>
                                        {profile[sec.key]
                                            ? <p>{profile[sec.key]}</p>
                                            : <p className="muted">Not available for this role yet.</p>}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
};

export default DirectionRolesGrid;
