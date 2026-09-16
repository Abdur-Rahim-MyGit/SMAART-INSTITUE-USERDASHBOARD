import React from 'react';
import { Compass, Map as MapIcon, Briefcase } from '@/components/icons';
import DirectionRolesGrid from './DirectionRolesGrid';
import { EmptyState, cleanFamily } from './shared';

/* ─────────────────────────────────────────────
   DirectionOverview
   Props:
     directionData: {
       directionId, directionName, directionDescription, directionOverview,
       type, roles: [{ role, id, jobFamily?, achievability?, rationale? }],
       specialisation?, primaryJobFamilies?
     }
     roleName: the student's target role in this direction
   ──────────────────────────────────────────── */

const TYPE_LABEL = { Primary: 'Primary path', Secondary: 'Secondary path', Alternative: 'Tertiary path', Alternate: 'Tertiary path', Tertiary: 'Tertiary path' };

const DirectionOverview = ({ directionData, roleName = '' }) => {

    if (!directionData || !directionData.directionName) {
        return (
            <EmptyState
                icon={<Compass size={24} />}
                title="No career direction data"
                text="Direction data comes from your onboarding selection. Run the onboarding again and choose a career direction to see the full breakdown here."
            />
        );
    }

    const description = directionData.directionOverview || directionData.directionDescription || directionData.overview || '';
    const { directionName, type, roles = [] } = directionData;
    const roleCount = roles.filter(r => (typeof r === 'string' ? r.trim() : r?.role?.trim())).length;
    const families = Array.isArray(directionData.primaryJobFamilies)
        ? directionData.primaryJobFamilies.map(cleanFamily).filter(Boolean)
        : [...new Set(roles.map(r => cleanFamily(r?.jobFamily)).filter(Boolean))];
    const specialisation = directionData.specialisation || '';

    return (
        <div className="dp animate-fade-in">
            {/* Direction title + chips */}
            <div className="dp-title-wrap">
                <div className="dp-eyebrow">Career direction<span className="dp-eyebrow-rule" /></div>
                <h3 className="dp-dir-name">{directionName}</h3>
                <div className="dp-chips">
                    {TYPE_LABEL[type] && <span className="dchip brand">{TYPE_LABEL[type]}</span>}
                    {roleName && <span className="dchip">Target role · {roleName}</span>}
                    {specialisation && <span className="dchip">{specialisation}</span>}
                </div>
            </div>

            {/* Overview */}
            <div className="dp-card">
                <div className="dp-card-head">
                    <div className="dp-tile"><MapIcon size={20} /></div>
                    <div>
                        <div className="dp-card-title">Direction overview</div>
                        <div className="dp-card-sub">What this career direction is about</div>
                    </div>
                </div>
                <div className="dp-rule" />
                <p className="dp-text">{description || 'Overview not available for this direction yet.'}</p>
            </div>

            {/* Roles */}
            <div className="dp-card">
                <div className="dp-card-head">
                    <div className="dp-tile"><Compass size={20} /></div>
                    <div>
                        <div className="dp-card-title">Job roles in this direction</div>
                        <div className="dp-card-sub">Select any role to read its full profile and how it fits your degree</div>
                    </div>
                </div>
                <div className="dp-rule" />
                <DirectionRolesGrid roles={roles} currentRole={roleName} directionName={directionName} />
            </div>
        </div>
    );
};

export default DirectionOverview;
