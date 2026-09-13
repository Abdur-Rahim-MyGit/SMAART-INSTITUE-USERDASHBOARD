/**
 * CareerLockBanner.jsx
 * Adaptive banner shown at the top of the Career Direction Dashboard.
 * Changes tone based on: active, warning (2 left), critical (1 left), locked.
 * Corporate vocabulary: 40px icon tile, hairline border, brand tokens, no emoji.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, AlertTriangle, AlertOctagon, Lock, Target } from '@/components/icons';

const TONES = {
    locked:   { fg: 'var(--green)', bg: 'rgba(5,150,105,0.06)',  border: 'rgba(5,150,105,0.25)' },
    critical: { fg: 'var(--red)',   bg: 'rgba(220,38,38,0.05)',  border: 'rgba(220,38,38,0.25)' },
    warning:  { fg: 'var(--amber)', bg: 'rgba(217,119,6,0.06)',  border: 'rgba(217,119,6,0.28)' },
    active:   { fg: 'var(--accent-text)', bg: 'var(--card)', border: 'var(--border)' },
};

const Stat = ({ icon, label, tone }) => (
    <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 8,
        background: 'var(--card)', border: `1px solid ${tone.border}`,
        fontSize: 12, fontWeight: 600, color: 'var(--text1)', whiteSpace: 'nowrap',
    }}>
        <span style={{ color: tone.fg, display: 'flex' }}>{icon}</span>
        {label}
    </div>
);

const CareerLockBanner = ({ lockStatus }) => {
    if (!lockStatus || !lockStatus.found) return null;

    const { isLocked, remainingDays, remainingAttempts, attemptsUsed, maxAttempts, lockReason } = lockStatus;

    let toneKey, icon, badge, title, subtitle;
    if (isLocked) {
        toneKey = 'locked';
        icon = <Lock size={20} />;
        badge = 'Career direction locked';
        title = 'Your career paths are finalised.';
        subtitle = lockReason === 'time_expired'
            ? 'The 14-day selection period has ended. Your three paths now drive every recommendation in this report.'
            : 'Your three paths are confirmed and now drive every recommendation in this report.';
    } else if (remainingAttempts <= 1) {
        toneKey = 'critical';
        icon = <AlertOctagon size={20} />;
        badge = 'Final attempt';
        title = 'This is your last available career analysis attempt.';
        subtitle = 'The next saved result becomes your permanently locked career direction.';
    } else if (remainingAttempts <= 2) {
        toneKey = 'warning';
        icon = <AlertTriangle size={20} />;
        badge = 'Attempts running low';
        title = `You have ${remainingAttempts} analysis attempts remaining.`;
        subtitle = 'Review your career choices carefully before generating a new analysis.';
    } else {
        toneKey = 'active';
        icon = <Target size={20} />;
        badge = 'Selection in progress';
        title = 'You can still refine your career direction.';
        subtitle = 'Run a new analysis to update your paths. Once the countdown ends or all attempts are used, your direction is locked permanently.';
    }
    const tone = TONES[toneKey];

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                margin: '0 0 20px', padding: '14px 18px', borderRadius: 12,
                background: tone.bg, border: `1px solid ${tone.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 260 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    background: toneKey === 'active' ? 'var(--accent-tint)' : 'var(--card)',
                    border: `1px solid ${tone.border}`, color: tone.fg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: tone.fg }}>{badge}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', lineHeight: 1.3 }}>{title}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--muted)', lineHeight: 1.5 }}>{subtitle}</div>
                </div>
            </div>

            {!isLocked && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Stat icon={<Clock size={15} />} label={`${remainingDays} days left`} tone={tone} />
                    <Stat icon={<RefreshCw size={15} />} label={`${attemptsUsed} / ${maxAttempts} attempts used`} tone={tone} />
                </div>
            )}
        </motion.div>
    );
};

export default CareerLockBanner;
