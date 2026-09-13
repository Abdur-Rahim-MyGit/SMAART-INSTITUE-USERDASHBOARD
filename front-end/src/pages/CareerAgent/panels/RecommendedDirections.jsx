import React, { useMemo, useState } from 'react';
import { ChevronDown, Info } from '@/components/icons';
import DirectionRolesGrid from './DirectionRolesGrid';

/* ─────────────────────────────────────────────────────────────
   RecommendedDirections
   The directions recommended for the student's own degree(s) that they
   did NOT already choose as Primary / Secondary / Tertiary. Always open to
   explore — before and after the 3 chosen paths are locked — with the same
   depth as the chosen-path panels (overview + roles + role profiles).
   Props:
     directions    [{ directionId, directionName, directionDescription, roles, degreeAbbr, degreeName, specialisation }]
     chosenTierFor (dir) => 'primary' | 'secondary' | 'tertiary' | null
     loading       boolean
   ───────────────────────────────────────────────────────────── */

const RecommendedDirections = ({ directions = [], chosenTierFor = () => null, loading = false }) => {
    const [open, setOpen] = useState(null);

    const remaining = useMemo(
        () => directions.filter(d => d && d.directionName && !chosenTierFor(d)),
        [directions, chosenTierFor]
    );
    const chosenCount = directions.length - remaining.length;

    if (loading) return <div className="rec-empty">Loading your recommended directions…</div>;

    if (directions.length === 0) {
        return <div className="rec-empty">No recommended directions are available for your degree yet.</div>;
    }

    if (remaining.length === 0) {
        return (
            <div className="rec-empty">
                All {directions.length} recommended directions for your degree are already among your chosen paths.
            </div>
        );
    }

    return (
        <div className="dp">
            <div className="rec-strip">
                <span className="ic"><Info size={18} /></span>
                <span>
                    {chosenCount > 0
                        ? `${chosenCount} of the ${directions.length} directions recommended for your degree ${chosenCount === 1 ? 'is' : 'are'} already in your chosen paths. The ${remaining.length} below ${remaining.length === 1 ? 'is' : 'are'} still open to explore.`
                        : `${remaining.length} directions are recommended for your degree. Open any of them to see the overview, job roles and full role profiles.`}
                </span>
            </div>

            <div className="rec-dir-list">
                {remaining.map((dir, i) => {
                    const isOpen = open === dir.directionId;
                    const roles = Array.isArray(dir.roles) ? dir.roles : [];
                    const meta = [dir.degreeAbbr || dir.degreeName, dir.specialisation].filter(Boolean).join(' · ');
                    return (
                        <div key={dir.directionId || dir.directionName} className={`rec-dir-card${isOpen ? ' open' : ''}`}>
                            <button
                                type="button"
                                className="rec-dir-head"
                                onClick={() => setOpen(isOpen ? null : dir.directionId)}
                                aria-expanded={isOpen}
                            >
                                <div className="rec-dir-num">{String(i + 1).padStart(2, '0')}</div>
                                <div className="rec-dir-titlewrap">
                                    <div className="rec-dir-title">{dir.directionName}</div>
                                    <div className="rec-dir-meta">
                                        {meta ? `${meta} · ` : ''}{roles.length} {roles.length === 1 ? 'job role' : 'job roles'}
                                    </div>
                                </div>
                                <span className="dchip">Recommended</span>
                                <ChevronDown size={20} className="rec-dir-caret" />
                            </button>

                            {isOpen && (
                                <div className="rec-dir-body animate-fade-in">
                                    <div>
                                        <div className="dp-eyebrow" style={{ marginBottom: 8 }}>Direction overview<span className="dp-eyebrow-rule" /></div>
                                        <p className="rec-dir-desc">{dir.directionDescription || 'Overview not available for this direction yet.'}</p>
                                    </div>
                                    <div>
                                        <div className="dp-eyebrow" style={{ marginBottom: 10 }}>Job roles in this direction<span className="dp-eyebrow-rule" /></div>
                                        <DirectionRolesGrid roles={roles} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecommendedDirections;
