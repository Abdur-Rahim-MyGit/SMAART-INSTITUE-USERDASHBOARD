import React from 'react';
import { Compass, Map } from '@/components/icons';
import DirectionRolesGrid from './DirectionRolesGrid';

/* ─────────────────────────────────────────────
   DirectionOverview
   Props:
     directionData: {
       directionId, directionName, directionDescription,
       directionOverview, type, roles: [{ role, id }]
     }
     roleName: the student's target role in this direction
   ──────────────────────────────────────────── */

const TYPE_LABEL = { Primary: 'Primary path', Secondary: 'Secondary path', Alternative: 'Tertiary path', Alternate: 'Tertiary path', Tertiary: 'Tertiary path' };

const DirectionOverview = ({ directionData, roleName = '' }) => {

    if (!directionData || !directionData.directionName) {
        return (
            <div className="rec-empty" style={{ padding: '48px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--muted)' }}><Compass size={40} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)', marginBottom: 6 }}>No career direction data</div>
                <div style={{ maxWidth: 420, margin: '0 auto', fontSize: 13, lineHeight: 1.6 }}>
                    Direction data comes from your onboarding selection. Run the onboarding again and
                    choose a career direction to see the full breakdown here.
                </div>
            </div>
        );
    }

    const description = directionData.directionOverview || directionData.directionDescription || directionData.overview || '';
    const { directionName, type, roles = [] } = directionData;
    const roleCount = roles.filter(r => (typeof r === 'string' ? r.trim() : r?.role?.trim())).length;

    return (
        <div className="dp animate-fade-in">
            {/* Direction title + chips */}
            <div className="dp-title-wrap">
                <div className="dp-eyebrow">Career direction<span className="dp-eyebrow-rule" /></div>
                <h3 className="dp-dir-name">{directionName}</h3>
                <div className="dp-chips">
                    {TYPE_LABEL[type] && <span className="dchip brand">{TYPE_LABEL[type]}</span>}
                    {roleName && <span className="dchip">Target role · {roleName}</span>}
                    <span className="dchip">{roleCount} {roleCount === 1 ? 'job role' : 'job roles'}</span>
                </div>
            </div>

            {/* Overview */}
            <div className="dp-card">
                <div className="dp-card-head">
                    <div className="dp-tile"><Map size={20} /></div>
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
                        <div className="dp-card-sub">Select any role to read its full profile</div>
                    </div>
                </div>
                <div className="dp-rule" />
                <DirectionRolesGrid roles={roles} currentRole={roleName} />
            </div>
        </div>
    );
};

export default DirectionOverview;
