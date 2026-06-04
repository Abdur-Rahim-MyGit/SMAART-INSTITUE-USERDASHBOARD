/**
 * CareerLockBanner.jsx
 * Adaptive banner shown at the top of the Career Direction Dashboard.
 * Changes style/message based on: active, warning (2 left), critical (1 left), locked.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, AlertTriangle, AlertOctagon, Lock, CheckCircle, Target } from 'lucide-react';

const CareerLockBanner = ({ lockStatus }) => {
    if (!lockStatus || !lockStatus.found) return null;

    const {
        isLocked,
        remainingDays,
        remainingAttempts,
        attemptsUsed,
        maxAttempts,
        lockReason,
        primaryCareerPath,
        secondaryCareerPath,
        tertiaryCareerPath,
    } = lockStatus;

    // ── Locked state ────────────────────────────────────────────────────────────
    if (isLocked) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    margin: '0 0 1rem 0',
                    padding: '0.8rem 1.25rem',
                    borderRadius: '12px',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: '1rem', flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                        background: 'rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Lock size={14} color="#10b981" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#10b981' }}>
                            Career Direction Permanently Locked
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.7 }}>
                            {lockReason === 'time_expired' ? '(14-day selection period ended)' : '(Paths confirmed and driving recommendations)'}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Determine warning level ──────────────────────────────────────────────────
    let config;
    if (remainingAttempts <= 1) {
        config = {
            bg: 'linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(220,38,38,0.06) 100%)',
            border: 'rgba(239,68,68,0.30)',
            iconBg: 'rgba(239,68,68,0.15)',
            iconColor: '#ef4444',
            glow: 'rgba(239,68,68,0.08)',
            icon: <AlertOctagon size={18} color="#ef4444" />,
            badge: '🚨 Final Opportunity',
            badgeColor: '#ef4444',
            title: 'This is your last available career analysis attempt.',
            subtitle: 'The next saved result will become your permanently locked career direction.',
        };
    } else if (remainingAttempts <= 2) {
        config = {
            bg: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(217,119,6,0.06) 100%)',
            border: 'rgba(245,158,11,0.30)',
            iconBg: 'rgba(245,158,11,0.15)',
            iconColor: '#f59e0b',
            glow: 'rgba(245,158,11,0.08)',
            icon: <AlertTriangle size={18} color="#f59e0b" />,
            badge: '⚠️ Career Direction Warning',
            badgeColor: '#f59e0b',
            title: `You have only ${remainingAttempts} analysis attempt${remainingAttempts === 1 ? '' : 's'} remaining.`,
            subtitle: 'Review your career choices carefully before generating a new analysis.',
        };
    } else {
        config = {
            bg: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(79,70,229,0.04) 100%)',
            border: 'rgba(99,102,241,0.25)',
            iconBg: 'rgba(99,102,241,0.12)',
            iconColor: '#6366f1',
            glow: 'rgba(99,102,241,0.06)',
            icon: <Target size={18} color="#6366f1" />,
            badge: '🎯 Career Direction Finalization In Progress',
            badgeColor: '#818cf8',
            title: null,
            subtitle: 'You may update your career direction by running a new AI analysis.',
        };
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                margin: '0 0 1.25rem 0',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                background: config.bg,
                border: `1px solid ${config.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '1rem', flexWrap: 'wrap',
                boxShadow: `0 4px 20px ${config.glow}`,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{
                    width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                    background: config.iconBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {config.icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, color: config.badgeColor, marginBottom: '0.2rem' }}>
                        {config.badge}
                    </div>
                    {config.title && (
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.15rem' }}>
                            {config.title}
                        </div>
                    )}
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                        {config.subtitle}
                        {' '}After the countdown expires or all attempts are consumed, your final career direction will be permanently locked.
                    </div>
                </div>
            </div>

            {/* Stats pills */}
            <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0, flexWrap: 'wrap' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.9rem', borderRadius: '10px',
                    background: 'var(--card)',
                    border: `1px solid ${config.border}`,
                }}>
                    <Clock size={13} color={config.iconColor} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>
                        {remainingDays}d left
                    </span>
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.45rem 0.9rem', borderRadius: '10px',
                    background: 'var(--card)',
                    border: `1px solid ${config.border}`,
                }}>
                    <RefreshCw size={13} color={config.iconColor} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)' }}>
                        {attemptsUsed}/{maxAttempts} used
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default CareerLockBanner;
