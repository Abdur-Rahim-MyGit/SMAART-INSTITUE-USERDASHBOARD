import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, X, ClipboardList, BarChart3, Dna, Map, Award } from '@/components/icons';
import { Spinner, EmptyState, SalaryStats, ProfileSections, DegreeFit, useRoleProfile, cleanFamily } from './shared';
import MarketIntelligence from './MarketIntelligence';
import SkillsPanel from './SkillsPanel';
import CareerRoadmap from './CareerRoadmap';
import Certifications from './Certifications';

/* ─────────────────────────────────────────────────────────────
   DirectionRolesGrid
   Shared by Direction Overview and Recommended Directions so a
   recommended direction shows exactly the same depth as a chosen one:
     • role cards with a one-line plain-English brief (/role-briefs)
       and, when the data set carries it, the degree-fit tag
     • click a role → the same set of report sections a chosen path
       gets (Role Profile / Market Intel / Skill DNA / Roadmap /
       Certifications), scoped to this direction, without switching
       the top-level Primary/Secondary/Tertiary tab.
   Props:
     roles         [{ role, id, jobFamily?, achievability?, rationale? }] | string[]
     currentRole   string (highlighted as the student's target role)
     directionName string (used by Market Intel / Certifications)
   ───────────────────────────────────────────────────────────── */

const BRIEF_CACHE = new Map();

const normaliseRoles = (roles = []) => roles
    .map(r => (typeof r === 'string' ? { role: r, id: null } : r))
    .filter(r => r && typeof r.role === 'string' && r.role.trim() !== '');

const fitLabel = (tag) => {
    if (!tag) return '';
    const t = String(tag).replace(/-/g, ' ').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
};

const SUB_TABS = [
    { id: 'profile', label: 'Role Profile', icon: <ClipboardList size={15} /> },
    { id: 'market', label: 'Market Intel', icon: <BarChart3 size={15} /> },
    { id: 'skills', label: 'Skill DNA', icon: <Dna size={15} /> },
    { id: 'roadmap', label: 'Roadmap', icon: <Map size={15} /> },
    { id: 'certs', label: 'Certifications', icon: <Award size={15} /> },
];

const DirectionRolesGrid = ({ roles = [], currentRole = '', directionName = '' }) => {
    const list = useMemo(() => normaliseRoles(roles), [roles]);
    const names = useMemo(() => list.map(r => r.role), [list]);
    const namesKey = names.join('|');

    const [briefs, setBriefs] = useState({});
    const [briefsLoading, setBriefsLoading] = useState(false);
    const [openRole, setOpenRole] = useState(null);
    const [subTab, setSubTab] = useState('profile');
    const { profile, loading: profileLoading, error: profileError } = useRoleProfile(subTab === 'profile' ? openRole : null);

    useEffect(() => { setOpenRole(null); setSubTab('profile'); }, [namesKey]);

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
    }, [namesKey]);

    // A minimal "direction" shape the Market Intel / Skill DNA / Roadmap
    // panels already know how to read (they only need { roles }). Computed
    // unconditionally, before any early return, so hook order never
    // depends on whether the role list is empty (Rules of Hooks).
    const directionShape = useMemo(() => ({ roles: list }), [list]);

    if (list.length === 0) {
        return <EmptyState title="No job roles mapped yet" text="No job roles are mapped to this direction in the database yet." />;
    }

    const openItem = openRole ? list.find(r => r.role === openRole) : null;

    return (
        <div className="dp">
            <div className="dir-roles-grid">
                {list.map((r, i) => {
                    const b = briefs[r.role];
                    const family = cleanFamily(r.jobFamily || b?.jobFamily || '');
                    const isOpen = openRole === r.role;
                    const isCurrent = currentRole && r.role.toLowerCase() === String(currentRole).toLowerCase();
                    return (
                        <button
                            type="button"
                            key={r.id || `${r.role}-${i}`}
                            className={`dir-role-card clickable${isOpen ? ' selected' : ''}${!isOpen && isCurrent ? ' current' : ''}`}
                            onClick={() => { setOpenRole(isOpen ? null : r.role); setSubTab('profile'); }}
                            aria-expanded={isOpen}
                        >
                            <div className="dir-role-card-number">{i + 1}</div>
                            <div className="dir-role-body">
                                <div className="dir-role-card-name">{r.role}</div>
                                {family && <div className="dir-role-card-family">{family}</div>}
                                {b ? (
                                    b.description
                                        ? <div className="dir-role-card-desc">{b.description}</div>
                                        : <div className="dir-role-card-desc muted">Description coming soon.</div>
                                ) : briefsLoading ? (
                                    <span className="dir-role-skel" />
                                ) : null}
                                {(r.achievability || isCurrent) && (
                                    <div className="dp-meta-row" style={{ marginTop: 4 }}>
                                        {isCurrent && <span className="dchip brand">Your target role</span>}
                                        {r.achievability && <span className="dchip">{fitLabel(r.achievability)}</span>}
                                    </div>
                                )}
                            </div>
                            <ChevronDown size={18} className="dir-role-caret" />
                        </button>
                    );
                })}
            </div>

            {openRole && (
                <div className="dir-role-detail animate-fade-in">
                    <div className="dir-role-detail-head">
                        <div>
                            <div className="dir-role-detail-title">{openRole}</div>
                            {openItem?.jobFamily && <div className="rp-family">{cleanFamily(openItem.jobFamily)}</div>}
                        </div>
                        <button type="button" className="btn-icon" style={{ width: 32, height: 32, borderRadius: 8 }} onClick={() => setOpenRole(null)} title="Close">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Same sections a chosen (Primary/Secondary/Tertiary) path gets,
                        scoped to this role without leaving this direction. */}
                    <div className="subtabs">
                        {SUB_TABS.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                className={`subtab${subTab === t.id ? ' active' : ''}`}
                                onClick={() => setSubTab(t.id)}
                            >
                                {t.icon}{t.label}
                            </button>
                        ))}
                    </div>

                    {subTab === 'profile' && (
                        <>
                            <DegreeFit role={openItem} />
                            {profileLoading ? (
                                <Spinner text={`Loading the profile for ${openRole}…`} />
                            ) : profileError ? (
                                <EmptyState title="Profile not available yet" text="A detailed profile for this role is not in the database yet." />
                            ) : profile ? (
                                <>
                                    <SalaryStats profile={profile} />
                                    <ProfileSections profile={profile} />
                                </>
                            ) : null}
                        </>
                    )}

                    {subTab === 'market' && (
                        <MarketIntelligence
                            roleName={openRole}
                            allDirections={[{ directionName, label: directionName, roles: list }]}
                            activeTabIndex={0}
                        />
                    )}

                    {subTab === 'skills' && (
                        <SkillsPanel roleName={openRole} direction={directionShape} />
                    )}

                    {subTab === 'roadmap' && (
                        <CareerRoadmap roleName={openRole} direction={directionShape} />
                    )}

                    {subTab === 'certs' && (
                        <Certifications roleName={openRole} directionName={directionName} directionRoles={names} />
                    )}
                </div>
            )}
        </div>
    );
};

export default DirectionRolesGrid;
