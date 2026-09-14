import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList } from '@/components/icons';
import { RoleSwitcher, Spinner, EmptyState, SalaryStats, ExposureTiles, ProfileSections, DegreeFit, useRoleProfile, cleanFamily } from './shared';

/**
 * RoleDetailedView
 * Role switcher for the active direction + the unified role profile
 * (/api/career-agent/role-profile/:roleTitle) laid out on the shared
 * report vocabulary: hero, salary tiles, degree-fit, narrative sections.
 */
const RoleDetailedView = ({ roleName, direction }) => {
    const roleItems = useMemo(() => (direction?.roles || [])
        .map(r => (typeof r === 'string' ? { role: r } : r))
        .filter(r => r && typeof r.role === 'string' && r.role.trim()), [direction]);
    const roleNames = useMemo(() => [...new Set(roleItems.map(r => r.role))], [roleItems]);

    const [selectedRole, setSelectedRole] = useState(roleName);
    useEffect(() => {
        const match = roleNames.find(r => r.toLowerCase() === String(roleName || '').toLowerCase());
        setSelectedRole(match || roleName || roleNames[0] || null);
    }, [roleName, roleNames.join('|')]);

    const { profile, loading, error } = useRoleProfile(selectedRole);
    const item = roleItems.find(r => r.role === selectedRole) || null;
    const isTarget = selectedRole && roleName && selectedRole.toLowerCase() === roleName.toLowerCase();

    return (
        <div className="dp animate-fade-in">
            <RoleSwitcher roles={roleNames} value={selectedRole} onChange={setSelectedRole} />

            {!selectedRole ? (
                <EmptyState icon={<ClipboardList size={24} />} title="No role selected" text="Choose a role above to read its full profile." />
            ) : loading ? (
                <Spinner text={`Loading the profile for ${selectedRole}…`} />
            ) : error || !profile ? (
                <EmptyState
                    icon={<ClipboardList size={24} />}
                    title={`No detailed profile for “${selectedRole}” yet`}
                    text="The database does not have a narrative profile for this role yet. Select another role above."
                />
            ) : (
                <>
                    {/* Hero — identity only, no bordered box (matches Direction Overview);
                        salary and AI/English signals live in the cards below. */}
                    <div className="dp-title-wrap">
                        <div className="dp-eyebrow">Role profile<span className="dp-eyebrow-rule" /></div>
                        <h3 className="rp-title">{profile.roleTitle}</h3>
                        {(profile.jobFamily || item?.jobFamily) && <div className="rp-family">{cleanFamily(profile.jobFamily || item?.jobFamily)}</div>}
                        <div className="dp-chips">
                            {isTarget && <span className="dchip brand">Your target role</span>}
                            {profile.roleId && <span className="dchip">{profile.roleId}</span>}
                        </div>
                    </div>

                    <DegreeFit role={item} />
                    <SalaryStats profile={profile} />
                    <ExposureTiles profile={profile} />
                    <ProfileSections profile={profile} which={['what', 'who', 'growth', 'human']} />
                </>
            )}
        </div>
    );
};

export default RoleDetailedView;
