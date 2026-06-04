/**
 * CareerLockStatusCard.jsx
 * Sidebar card showing attempts, countdown, and locked paths.
 * Shown in the Career Direction Dashboard sidebar.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Clock, RefreshCw, Target, CheckCircle } from 'lucide-react';

const CareerLockStatusCard = ({ lockStatus }) => {
    if (!lockStatus || !lockStatus.found) return null;

    const {
        isLocked,
        attemptsUsed,
        maxAttempts,
        remainingAttempts,
        remainingDays,
        lockReason,
        primaryCareerPath,
        secondaryCareerPath,
        tertiaryCareerPath,
        lockExpiryDate,
    } = lockStatus;

    const attemptPct = Math.min(100, (attemptsUsed / maxAttempts) * 100);
    const daysPct = lockExpiryDate
        ? Math.max(0, Math.min(100, (remainingDays / 14) * 100))
        : 100;

    const attemptBarColor = remainingAttempts <= 1 ? '#ef4444'
        : remainingAttempts <= 2 ? '#f59e0b'
            : '#6366f1';

    const dayBarColor = remainingDays <= 2 ? '#ef4444'
        : remainingDays <= 5 ? '#f59e0b'
            : '#10b981';

    return (
        <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
                padding: '0.5rem 1rem 1.25rem 1rem',
                borderBottom: '1px solid var(--border)',
                marginBottom: '0.5rem',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {isLocked ? <Lock size={14} color="#10b981" /> : <Target size={14} color="var(--accent)" />}
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {isLocked ? 'Direction Locked' : 'Selection Active'}
                </div>
            </div>

            {isLocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {[
                        { label: 'Primary', path: primaryCareerPath, color: '#6366f1' },
                        { label: 'Secondary', path: secondaryCareerPath, color: '#8b5cf6' },
                        { label: 'Tertiary', path: tertiaryCareerPath, color: '#a78bfa' },
                    ].filter(p => p.path).map(({ label, path, color }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {path}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted)' }}>Attempts</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: attemptBarColor }}>{attemptsUsed}/{maxAttempts}</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${attemptPct}%`, height: '100%', background: attemptBarColor, transition: 'width 0.5s' }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--muted)' }}>Days Left</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: dayBarColor }}>{remainingDays}d</span>
                        </div>
                        <div style={{ height: '4px', borderRadius: '4px', background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ width: `${daysPct}%`, height: '100%', background: dayBarColor, transition: 'width 0.5s' }} />
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default CareerLockStatusCard;
