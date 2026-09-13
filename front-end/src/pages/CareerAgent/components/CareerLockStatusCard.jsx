/**
 * CareerLockStatusCard.jsx
 * Sidebar card showing attempts, countdown, and locked paths.
 * Shown in the Career Direction Dashboard sidebar.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Target } from '@/components/icons';

const Bar = ({ label, value, pct, color }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--muted)' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text1)' }}>{value}</span>
        </div>
        <div style={{ height: 4, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s' }} />
        </div>
    </div>
);

const CareerLockStatusCard = ({ lockStatus }) => {
    if (!lockStatus || !lockStatus.found) return null;

    const {
        isLocked, attemptsUsed, maxAttempts, remainingAttempts, remainingDays,
        primaryCareerPath, secondaryCareerPath, tertiaryCareerPath, lockExpiryDate,
    } = lockStatus;

    const attemptPct = Math.min(100, (attemptsUsed / maxAttempts) * 100);
    const daysPct = lockExpiryDate ? Math.max(0, Math.min(100, (remainingDays / 14) * 100)) : 100;

    const attemptColor = remainingAttempts <= 1 ? 'var(--red)' : remainingAttempts <= 2 ? 'var(--amber)' : 'var(--accent)';
    const dayColor = remainingDays <= 2 ? 'var(--red)' : remainingDays <= 5 ? 'var(--amber)' : 'var(--accent)';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ padding: '16px 16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'flex', color: isLocked ? 'var(--green)' : 'var(--accent-text)' }}>
                    {isLocked ? <Lock size={16} /> : <Target size={16} />}
                </span>
                <div className="sb-label">{isLocked ? 'Direction locked' : 'Selection window'}</div>
            </div>

            {isLocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                        { label: 'Primary', path: primaryCareerPath },
                        { label: 'Secondary', path: secondaryCareerPath },
                        { label: 'Tertiary', path: tertiaryCareerPath },
                    ].filter(p => p.path).map(({ label, path }) => (
                        <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={path}>{path}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <Bar label="Attempts used" value={`${attemptsUsed} / ${maxAttempts}`} pct={attemptPct} color={attemptColor} />
                    <Bar label="Days left" value={`${remainingDays}`} pct={daysPct} color={dayColor} />
                </div>
            )}
        </motion.div>
    );
};

export default CareerLockStatusCard;
