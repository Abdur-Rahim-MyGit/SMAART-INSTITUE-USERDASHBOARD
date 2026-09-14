import React, { useEffect, useState } from 'react';
import { Briefcase, Bot, UserCheck, TrendingUp, Languages, ShieldCheck, GraduationCap, Info, CreditCard, BarChart3, Lightbulb } from '@/components/icons';

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
   active direction — a lightweight underline tab strip (the same
   language as the header's Primary/Secondary/Tertiary tabs), so it reads
   as one system rather than a grid of boxy, disconnected cards. */
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
                        <span className="rs-n">{String(i + 1).padStart(2, '0')}</span>
                        <span className="rs-name">{r}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

/* Metric tile: icon + value + label. One consistent brand-coloured look
   across every stat row in the report (Skill DNA, Certifications,
   Roadmap, salary stats) — no per-tile colour so nothing looks singled
   out or accidental. */
export const MetricTile = ({ icon, value, label, sub }) => (
    <div className="stat">
        <div className="stat-ic">{icon}</div>
        <div className="stat-body">
            <div className="stat-k">{label}</div>
            <div className="stat-v">{value}</div>
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

// Pulls the highest figure out of a salary string ("₹11–18 L" → 18) so the
// ladder's dots can grow with pay instead of all rendering the same size.
const salaryUpperBound = (v) => {
    const nums = String(v || '').match(/[\d.]+/g);
    return nums && nums.length ? parseFloat(nums[nums.length - 1]) : 0;
};

/* Salary progression — a connected ladder (track + growing dots) instead
   of four disconnected numbers, so it visibly reads as pay growing with
   experience rather than a stat list. */
export const SalaryStats = ({ profile }) => {
    const stats = [
        { k: 'Year 0–1', v: profile?.salaryYear0_1 },
        { k: 'Year 2–3', v: profile?.salaryYear2_3 },
        { k: 'Year 4–5', v: profile?.salaryYear4_5 },
        { k: 'Year 6+', v: profile?.salaryYear6plus },
    ].filter(s => s.v);
    if (stats.length === 0) return null;

    const maxV = Math.max(...stats.map(s => salaryUpperBound(s.v)), 1);
    const nodeSize = (v) => 8 + (salaryUpperBound(v) / maxV) * 12; // 8–20px

    return (
        <div className="dp-card">
            <CardHead icon={<CreditCard size={20} />} title="Salary progression" sub="Typical annual pay in India, by experience — figures per annum" />

            <div className="salary-ladder">
                <div className="salary-track">
                    <div className="salary-track-line" />
                    {stats.map(s => {
                        const size = nodeSize(s.v);
                        return <div key={s.k} className="salary-node" style={{ width: size, height: size }} title={`${s.k}: ${s.v}`} />;
                    })}
                </div>
                <div className="salary-labels">
                    {stats.map(s => (
                        <div key={s.k} className="salary-label">
                            <div className="salary-label-k">{s.k}</div>
                            <div className="salary-label-v">{s.v}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Narrow screens: the ladder gets cramped, so fall back to a simple list */}
            <div className="salary-ladder-mobile">
                {stats.map(s => (
                    <div key={s.k} className="salary-row-m">
                        <span className="salary-label-k">{s.k}</span>
                        <span className="salary-label-v">{s.v}</span>
                    </div>
                ))}
            </div>
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
const FIT_TONE = {
    'direct fit': 'ok',
    'skill-bridgeable': 'amber',
    'skill bridgeable': 'amber',
};

export const DegreeFit = ({ role }) => {
    if (!role || (!role.rationale && !role.achievability && !role.placementNote)) return null;
    const tagKey = role.achievability ? String(role.achievability).toLowerCase() : '';
    const tagLabel = tagKey ? tagKey.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase()) : '';
    const tone = FIT_TONE[tagKey] || 'brand';

    return (
        <Section icon={<GraduationCap size={20} />} title="How this role fits your degree" className="tint">
            {tagLabel && (
                <span className={`dchip ${tone}`} style={{ marginBottom: 12 }}>
                    <ShieldCheck size={13} /> {tagLabel}
                </span>
            )}
            {role.rationale && <p className="dp-text" style={{ marginTop: tagLabel ? 10 : 0 }}>{role.rationale}</p>}
            {role.achievabilityDetail && (
                <div className="fit-note" style={{ marginTop: 12 }}>
                    <span className="ic"><Lightbulb size={17} /></span>
                    <span><strong style={{ fontWeight: 600, color: 'var(--text1)' }}>Skill to bridge — </strong>{role.achievabilityDetail}</span>
                </div>
            )}
            {role.placementNote && (
                <div style={{ marginTop: 14 }}>
                    <div className="dp-eyebrow" style={{ marginBottom: 6 }}>Placement note<span className="dp-eyebrow-rule" /></div>
                    <p className="dp-text">{role.placementNote}</p>
                </div>
            )}
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

/* Role signals — AI exposure and English requirement side by side in one
   compact card, instead of two half-empty cards each carrying its own
   border and padding for a single number and a chip. */
export const ExposureTiles = ({ profile }) => {
    const pct = Number(profile?.aiExposurePct) || 0;
    const hasEnglish = !!profile?.englishRequirement;
    if (!pct && !hasEnglish) return null;
    return (
        <div className="dp-card">
            <CardHead icon={<BarChart3 size={20} />} title="Role signals" sub="AI exposure and English requirement for this role in India" />
            <div className="signal-split">
                {pct > 0 && (
                    <div className="signal-col">
                        <div className="signal-label"><Bot size={15} /> AI exposure</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                            <div className="stat-v" style={{ fontSize: 24 }}>{pct}%</div>
                            {profile.aiExposureLevel && <span className="dchip">{profile.aiExposureLevel}</span>}
                        </div>
                        <div className="meter"><i className={aiTone(pct)} style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    </div>
                )}
                {hasEnglish && (
                    <div className="signal-col">
                        <div className="signal-label"><Languages size={15} /> English &amp; communication</div>
                        <span className="dchip brand" style={{ width: 'fit-content' }}>{profile.englishRequirement}</span>
                        {profile.englishContext && <p className="dp-text" style={{ fontSize: 13 }}>{profile.englishContext}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
