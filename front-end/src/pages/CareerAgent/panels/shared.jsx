import React, { useEffect, useState } from 'react';
import { Briefcase, Bot, UserCheck, TrendingUp, Languages, ShieldCheck, GraduationCap, Info, CreditCard } from '@/components/icons';

/* ─────────────────────────────────────────────────────────────
   Shared building blocks for the Career Agent report panels.
   Every panel uses the same tiles, chips, states and role switcher so
   the whole report reads as one system.
   ───────────────────────────────────────────────────────────── */

export const cleanFamily = (jf = '') => String(jf || '').replace(/^JF\d+\s*[–-]\s*/, '').trim();

export const Spinner = ({ text = 'Loading…' }) => (
    <div className="state">
        <div className="spin" />
        <p className="state-s">{text}</p>
    </div>
);

export const EmptyState = ({ icon, title, text }) => (
    <div className="state">
        <div className="state-ic">{icon || <Info size={24} />}</div>
        {title && <div className="state-t">{title}</div>}
        {text && <p className="state-s">{text}</p>}
    </div>
);

export const CardHead = ({ icon, title, sub, right }) => (
    <>
        <div className="dp-card-head" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div className="dp-tile">{icon}</div>
                <div style={{ minWidth: 0 }}>
                    <div className="dp-card-title">{title}</div>
                    {sub && <div className="dp-card-sub">{sub}</div>}
                </div>
            </div>
            {right}
        </div>
        <div className="dp-rule" />
    </>
);

/* Role switcher: an even grid of role cards for the roles within the
   active direction — every card the same size regardless of name length,
   so the row never looks ragged. */
export const RoleSwitcher = ({ roles = [], value, onChange, label = 'Roles in this direction' }) => {
    if (!roles || roles.length === 0) return null;
    return (
        <div className="rs">
            <div className="rs-label">{label}<span className="rs-count">{roles.length}</span></div>
            <div className="rs-tabs">
                {roles.map((r, i) => (
                    <button
                        key={r}
                        type="button"
                        className={`rs-tab${value === r ? ' active' : ''}`}
                        onClick={() => onChange(r)}
                        title={r}
                    >
                        <span className="rs-n">{i + 1}</span>
                        <span className="rs-name">{r}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

/* Metric tile: icon + value + label, one consistent visual weight across
   every stat row in the report (Skill DNA, Certifications, Roadmap). */
export const MetricTile = ({ icon, value, label, sub, tone = '' }) => (
    <div className="stat">
        <div className={`stat-ic${tone ? ` ${tone}` : ''}`}>{icon}</div>
        <div className="stat-body">
            <div className="stat-k">{label}</div>
            <div className={`stat-v${tone ? ` ${tone}` : ''}`}>{value}</div>
            {sub && <div className="stat-s">{sub}</div>}
        </div>
    </div>
);

/* Fetch a unified role profile (/role-profile/:roleTitle) with caching */
const PROFILE_CACHE = new Map();
export const useRoleProfile = (roleTitle) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(!!roleTitle);
    const [error, setError] = useState(false);
    useEffect(() => {
        if (!roleTitle) { setProfile(null); setLoading(false); return; }
        if (PROFILE_CACHE.has(roleTitle)) { setProfile(PROFILE_CACHE.get(roleTitle)); setLoading(false); setError(false); return; }
        let cancelled = false;
        setLoading(true); setError(false); setProfile(null);
        fetch(`/api/career-agent/role-profile/${encodeURIComponent(roleTitle)}`, { credentials: 'include' })
            .then(r => (r.ok ? r.json() : null))
            .then(p => {
                if (cancelled) return;
                if (p && p.roleTitle) { PROFILE_CACHE.set(roleTitle, p); setProfile(p); }
                else setError(true);
            })
            .catch(() => { if (!cancelled) setError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [roleTitle]);
    return { profile, loading, error };
};

export const aiTone = (pct) => (pct >= 65 ? 'red' : pct >= 45 ? 'amber' : '');

/* Salary progression stat tiles */
export const SalaryStats = ({ profile }) => {
    const stats = [
        { k: 'Year 0–1', v: profile?.salaryYear0_1 },
        { k: 'Year 2–3', v: profile?.salaryYear2_3 },
        { k: 'Year 4–5', v: profile?.salaryYear4_5 },
        { k: 'Year 6+', v: profile?.salaryYear6plus },
    ].filter(s => s.v);
    if (stats.length === 0) return null;
    return (
        <div className="dp-grid-4">
            {stats.map(s => (
                <MetricTile key={s.k} icon={<CreditCard size={18} />} value={s.v} label={s.k} sub="per annum" tone="brand" />
            ))}
        </div>
    );
};

/* Narrative section card */
export const Section = ({ icon, title, text, missing = 'Not available for this role yet.', children, className = '' }) => (
    <div className={`dp-card ${className}`}>
        <div className="dp-card-head">
            <div className="dp-tile">{icon}</div>
            <div className="dp-card-title">{title}</div>
        </div>
        <div className="dp-rule" />
        {children ? children : text
            ? <p className="dp-text">{text}</p>
            : <p className="dp-text" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>{missing}</p>}
    </div>
);

/* Degree-fit block — the per-role mapping data a data set may carry
   (B.Com 2026 set: achievability, rationale, placement note). */
export const DegreeFit = ({ role }) => {
    if (!role || (!role.rationale && !role.achievability && !role.placementNote)) return null;
    const tag = role.achievability ? String(role.achievability).replace(/-/g, ' ').toLowerCase() : '';
    const tagLabel = tag ? tag.charAt(0).toUpperCase() + tag.slice(1) : '';
    return (
        <Section icon={<GraduationCap size={20} />} title="How this role fits your degree" className="tint">
            {tagLabel && (
                <div style={{ marginBottom: 10 }}>
                    <span className="dchip brand"><ShieldCheck size={13} /> {tagLabel}</span>
                    {role.achievabilityDetail && <span className="dchip" style={{ marginLeft: 8 }}>{role.achievabilityDetail}</span>}
                </div>
            )}
            {role.rationale && <p className="dp-text">{role.rationale}</p>}
            {role.placementNote && <p className="dp-text" style={{ marginTop: 10 }}><strong style={{ color: 'var(--text1)', fontWeight: 600 }}>Placement note: </strong>{role.placementNote}</p>}
        </Section>
    );
};

/* The four narrative sections every role profile carries */
export const ProfileSections = ({ profile, which = ['what', 'who', 'ai', 'growth'] }) => {
    const map = {
        what:   { icon: <Briefcase size={20} />, title: 'What this role does',       text: profile?.whatRoleDoes },
        who:    { icon: <UserCheck size={20} />, title: 'Who should consider it',    text: profile?.whoShouldConsider },
        ai:     { icon: <Bot size={20} />,       title: 'How AI is changing it',     text: profile?.howAiChanging },
        growth: { icon: <TrendingUp size={20} />, title: 'Career growth path',       text: profile?.careerGrowthPath },
        human:  { icon: <UserCheck size={20} />, title: 'Human value AI cannot replace', text: profile?.humanValueTasks },
    };
    return (
        <div className="dp-grid-2">
            {which.map(k => map[k] && <Section key={k} icon={map[k].icon} title={map[k].title} text={map[k].text} />)}
        </div>
    );
};

/* AI exposure + English requirement tiles */
export const ExposureTiles = ({ profile }) => {
    const pct = Number(profile?.aiExposurePct) || 0;
    const hasEnglish = !!profile?.englishRequirement;
    if (!pct && !hasEnglish) return null;
    return (
        <div className="dp-grid-2">
            {pct > 0 && (
                <div className="dp-card">
                    <div className="dp-card-head">
                        <div className="dp-tile"><Bot size={20} /></div>
                        <div>
                            <div className="dp-card-title">AI exposure</div>
                            <div className="dp-card-sub">How much of this role's work AI can already assist with</div>
                        </div>
                    </div>
                    <div className="dp-rule" />
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                        <div className="stat-v brand" style={{ fontSize: 28 }}>{pct}%</div>
                        {profile.aiExposureLevel && <span className="dchip">{profile.aiExposureLevel} exposure</span>}
                    </div>
                    <div className="meter"><i className={aiTone(pct)} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                </div>
            )}
            {hasEnglish && (
                <div className="dp-card">
                    <div className="dp-card-head">
                        <div className="dp-tile"><Languages size={20} /></div>
                        <div>
                            <div className="dp-card-title">English &amp; communication</div>
                            <div className="dp-card-sub">Language expectation for this role in India</div>
                        </div>
                    </div>
                    <div className="dp-rule" />
                    <div style={{ marginBottom: profile.englishContext ? 10 : 0 }}><span className="dchip brand">{profile.englishRequirement}</span></div>
                    {profile.englishContext && <p className="dp-text">{profile.englishContext}</p>}
                </div>
            )}
        </div>
    );
};
