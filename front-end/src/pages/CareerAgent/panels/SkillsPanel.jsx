import React, { useEffect, useMemo, useState } from 'react';
import { Dna, Code, Building, Bot, Users, Layers, Award, Flame } from '@/components/icons';
import { RoleSwitcher, Spinner, EmptyState, CardHead, MetricTile } from './shared';

/**
 * SkillsPanel — "Skill DNA"
 * Role switcher for the active direction + the mapped skills for the
 * selected role (/api/career-agent/role-skills/:roleTitle), grouped by
 * category on the shared report vocabulary.
 */
const CATEGORY_META = {
    'Technical':  { label: 'Technical skills',  sub: 'Tools, software and hands-on methods', icon: <Code size={20} /> },
    'Domain':     { label: 'Domain knowledge',  sub: 'Subject expertise the role is built on', icon: <Building size={20} /> },
    'AI-Tool':    { label: 'AI tools',          sub: 'AI assistants and platforms used day to day', icon: <Bot size={20} /> },
    'Soft Skill': { label: 'Soft skills',       sub: 'Communication, teamwork and judgement', icon: <Users size={20} /> },
    'General':    { label: 'General',           sub: 'Broad competencies for the role', icon: <Layers size={20} /> },
};
const CATEGORY_ORDER = ['Domain', 'Technical', 'AI-Tool', 'Soft Skill', 'General'];

const SKILL_CACHE = new Map();

const SkillsPanel = ({ roleName, direction }) => {
    const roleNames = useMemo(() => [...new Set((direction?.roles || [])
        .map(r => (typeof r === 'string' ? r : r?.role))
        .filter(Boolean))], [direction]);

    const [selectedRole, setSelectedRole] = useState(roleName);
    useEffect(() => {
        const match = roleNames.find(r => r.toLowerCase() === String(roleName || '').toLowerCase());
        setSelectedRole(match || roleName || roleNames[0] || null);
    }, [roleName, roleNames.join('|')]);

    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedRole) { setSkills([]); setLoading(false); return; }
        if (SKILL_CACHE.has(selectedRole)) { setSkills(SKILL_CACHE.get(selectedRole)); setLoading(false); return; }
        let cancelled = false;
        setLoading(true);
        fetch(`/api/career-agent/role-skills/${encodeURIComponent(selectedRole)}`, { credentials: 'include' })
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                const list = Array.isArray(data?.skills) ? data.skills : [];
                SKILL_CACHE.set(selectedRole, list);
                if (!cancelled) setSkills(list);
            })
            .catch(() => { if (!cancelled) setSkills([]); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [selectedRole]);

    const groups = useMemo(() => {
        const byCat = {};
        skills.forEach(s => {
            const cat = s.skillCategory || 'General';
            (byCat[cat] = byCat[cat] || []).push(s);
        });
        const order = [...CATEGORY_ORDER, ...Object.keys(byCat).filter(c => !CATEGORY_ORDER.includes(c))];
        return order.filter(c => byCat[c]?.length).map(c => ({ key: c, items: byCat[c], meta: CATEGORY_META[c] || { label: c, sub: '', icon: <Layers size={20} /> } }));
    }, [skills]);

    const highCount = skills.filter(s => s.importance === 'High').length;
    const certCount = skills.filter(s => s.certificationName).length;

    return (
        <div className="dp animate-fade-in">
            <RoleSwitcher roles={roleNames} value={selectedRole} onChange={setSelectedRole} />

            {loading ? (
                <Spinner text={`Resolving the skill DNA for ${selectedRole}…`} />
            ) : !selectedRole || skills.length === 0 ? (
                <EmptyState
                    icon={<Dna size={24} />}
                    title={selectedRole ? `No skill map for “${selectedRole}” yet` : 'No role selected'}
                    text="The database does not have a mapped skill profile for this role yet. Try another role above."
                />
            ) : (
                <>
                    <div className="dp-grid-4">
                        <MetricTile icon={<Dna size={18} />} value={skills.length} label="Skills mapped" sub={`for ${selectedRole}`} tone="brand" />
                        <MetricTile icon={<Layers size={18} />} value={groups.length} label="Categories" sub="skill groups" />
                        <MetricTile icon={<Flame size={18} />} value={highCount} label="High priority" sub="must-have skills" tone="amber" />
                        <MetricTile icon={<Award size={18} />} value={certCount} label="With certification" sub="skills with a recognised cert" tone="green" />
                    </div>

                    <div className="dp-grid-2">
                        {groups.map(g => (
                            <div key={g.key} className="dp-card">
                                <CardHead icon={g.meta.icon} title={g.meta.label} sub={g.meta.sub} right={<span className="dchip">{g.items.length}</span>} />
                                <div className="pills">
                                    {g.items.map((s, i) => (
                                        <span key={`${s.skillName}-${i}`} className={`pill${s.importance === 'High' ? ' high' : ''}`} title={s.certificationName ? `Certification: ${s.certificationName}${s.platform ? ` · ${s.platform}` : ''}` : undefined}>
                                            {s.skillName}
                                            {s.certificationName && <Award size={14} style={{ color: 'var(--accent-text)' }} />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SkillsPanel;
