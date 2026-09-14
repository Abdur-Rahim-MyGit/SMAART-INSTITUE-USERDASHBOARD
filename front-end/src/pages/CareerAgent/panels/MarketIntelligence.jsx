import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Bot, UserCheck, TrendingUp } from '@/components/icons';
import { RoleSwitcher, Spinner, EmptyState, SalaryStats, Section, ExposureTiles, useRoleProfile, cleanFamily } from './shared';

/**
 * MarketIntelligence
 * Direction is controlled by the top Primary/Secondary/Tertiary tabs
 * (activeTabIndex = activeRole - 1). Role switcher = roles inside that
 * direction. Content = /api/career-agent/role-profile/:roleTitle, focused
 * on the market side: salary progression, AI exposure, English, growth.
 *
 * Props:
 *   roleName       – active role name for the current direction
 *   allDirections  – [{ label, directionName, roles:[{role,id}] }, ...]
 *   activeTabIndex – 0/1/2
 */
const MarketIntelligence = ({ roleName, allDirections = [], activeTabIndex = 0 }) => {
    const currentDir = allDirections[activeTabIndex] || allDirections[0] || {};
    const dirRoleNames = useMemo(() => (currentDir.roles || [])
        .map(r => (typeof r === 'string' ? r : r?.role))
        .filter(Boolean), [currentDir]);

    const [fetchedRoles, setFetchedRoles] = useState([]);
    const roleNames = dirRoleNames.length > 0 ? dirRoleNames : fetchedRoles;

    const [selectedRole, setSelectedRole] = useState(null);

    // When the top tab changes: pick the active role, or fall back to the DB list
    useEffect(() => {
        setFetchedRoles([]);
        if (dirRoleNames.length > 0) {
            const match = dirRoleNames.find(n => n.toLowerCase() === String(roleName || '').toLowerCase());
            setSelectedRole(match || dirRoleNames[0]);
            return;
        }
        const dirName = currentDir.directionName || currentDir.label;
        if (!dirName) { setSelectedRole(null); return; }
        let cancelled = false;
        fetch(`/api/career-agent/direction-roles/${encodeURIComponent(dirName)}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                const names = (data.roles || []).map(r => r.role).filter(Boolean);
                setFetchedRoles(names);
                const match = names.find(n => n.toLowerCase() === String(roleName || '').toLowerCase());
                setSelectedRole(match || names[0] || null);
            })
            .catch(() => { if (!cancelled) setSelectedRole(null); });
        return () => { cancelled = true; };
    }, [activeTabIndex, dirRoleNames.join('|'), roleName]); // eslint-disable-line

    const { profile, loading, error } = useRoleProfile(selectedRole);

    if (roleNames.length === 0 && !selectedRole) {
        return (
            <EmptyState
                icon={<BarChart3 size={24} />}
                title="Market data coming soon"
                text={`Market intelligence for ${currentDir.label || currentDir.directionName || 'this direction'} is not in the database yet.`}
            />
        );
    }

    return (
        <div className="dp animate-fade-in">
            <RoleSwitcher roles={roleNames} value={selectedRole} onChange={setSelectedRole} />

            {loading ? (
                <Spinner text={`Loading market intelligence for ${selectedRole}…`} />
            ) : error || !profile ? (
                <EmptyState icon={<BarChart3 size={24} />} title={`No market data for “${selectedRole}” yet`} text="Select another role above." />
            ) : (
                <>
                    {/* Hero — identity only, no bordered box (matches Direction Overview);
                        the entry salary and AI/English signals live in the cards below,
                        not repeated here. */}
                    <div className="dp-title-wrap">
                        <div className="dp-eyebrow">Market snapshot · India<span className="dp-eyebrow-rule" /></div>
                        <h3 className="rp-title">{profile.roleTitle}</h3>
                        {profile.jobFamily && <div className="rp-family">{cleanFamily(profile.jobFamily)}</div>}
                    </div>

                    <SalaryStats profile={profile} />
                    <ExposureTiles profile={profile} />

                    <div className="dp-grid-2">
                        <Section icon={<Bot size={20} />} title="How AI is changing this role" text={profile.howAiChanging} />
                        <Section icon={<UserCheck size={20} />} title="Human value AI cannot replace" text={profile.humanValueTasks} />
                        <Section icon={<TrendingUp size={20} />} title="Career growth path" text={profile.careerGrowthPath} className="span2" />
                    </div>
                </>
            )}
        </div>
    );
};

export default MarketIntelligence;
