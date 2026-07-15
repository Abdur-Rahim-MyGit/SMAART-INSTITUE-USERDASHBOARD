/**
 * CareerLockedModal.jsx
 * Auto-lock notification modal shown when career direction becomes permanently locked.
 * Displays the three saved career paths and confirms permanence.
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Target, Sparkles } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const CareerLockedModal = ({ isOpen, onClose, lockStatus }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();

    // Resolve the applied theme from the <html> class (handles 'system' too).
    const [isDark, setIsDark] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : true
    );

    useEffect(() => {
        const sync = () => setIsDark(document.documentElement.classList.contains('dark'));
        sync();
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [theme, isOpen]);

    if (!isOpen || !lockStatus) return null;

    const {
        primaryCareerPath,
        secondaryCareerPath,
        tertiaryCareerPath,
        lockReason,
        maxAttempts,
    } = lockStatus;

    // Theme-aware color tokens
    const c = {
        overlay: isDark ? 'rgba(5, 8, 22, 0.88)' : 'rgba(15, 23, 42, 0.45)',
        modalBg: isDark
            ? 'linear-gradient(145deg, #002147 0%, #00152E 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
        modalBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
        modalShadow: isDark
            ? '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(26,56,132,0.3)'
            : '0 30px 60px rgba(15,23,42,0.18), 0 0 40px rgba(26,56,132,0.10)',
        title: isDark ? '#ffffff' : '#0d1f4e',
        reason: isDark ? 'rgba(255,255,255,0.55)' : '#64748b',
        pathName: isDark ? '#ffffff' : '#0f172a',
        badgeColor: isDark ? '#60a5fa' : '#2563eb',
        badgeBg: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
        badgeBorder: 'rgba(59,130,246,0.3)',
        impactBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(15,23,42,0.03)',
        impactBorder: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.07)',
        impactText: isDark ? 'rgba(255,255,255,0.5)' : '#64748b',
    };

    const lockReasonText =
        lockReason === 'time_expired'
            ? t('career_locked.reason_time_expired', 'Your 14-day career direction period has ended.')
            : lockReason === 'attempts_exhausted'
                ? t('career_locked.reason_attempts', 'All {{count}} career analysis attempts have been used.', { count: maxAttempts })
                : t('career_locked.reason_confirmed', 'You have confirmed your career direction.');

    const paths = [
        { key: 'primary',   label: t('career_locked.path_primary', 'Primary Career Path'),     path: primaryCareerPath,   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
        { key: 'secondary', label: t('career_locked.path_secondary', 'Secondary Career Path'), path: secondaryCareerPath, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
        { key: 'tertiary',  label: t('career_locked.path_tertiary', 'Tertiary Career Path'),   path: tertiaryCareerPath,  color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' },
    ].filter(p => p.path);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: c.overlay,
                        backdropFilter: 'blur(16px)',
                        padding: '1rem',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.85, opacity: 0, y: 40 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 16 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%', maxWidth: '440px',
                            background: c.modalBg,
                            borderRadius: '24px',
                            border: `1px solid ${c.modalBorder}`,
                            boxShadow: c.modalShadow,
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Blue glow top */}
                        <div style={{
                            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                            width: '260px', height: '160px',
                            background: 'radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        <div style={{ padding: '1.75rem 2rem', position: 'relative', zIndex: 1 }}>
                            {/* Lock icon with pulse ring */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                                <div style={{ position: 'relative' }}>
                                    <motion.div
                                        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        style={{
                                            position: 'absolute', inset: '-8px',
                                            borderRadius: '50%',
                                            border: '2px solid rgba(59,130,246,0.4)',
                                        }}
                                    />
                                    <motion.div
                                        initial={{ scale: 0, rotate: -30 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                                        style={{
                                            width: '56px', height: '56px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.15) 100%)',
                                            border: '2px solid rgba(59,130,246,0.4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Lock size={24} color="#3b82f6" />
                                    </motion.div>
                                </div>
                            </div>

                            {/* Badge */}
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}
                            >
                                <span style={{
                                    fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em',
                                    textTransform: 'uppercase', color: c.badgeColor,
                                    border: `1px solid ${c.badgeBorder}`,
                                    padding: '0.25rem 0.75rem', borderRadius: '999px',
                                    background: c.badgeBg
                                }}>
                                    ✅ {t('career_locked.badge', 'Path Finalized')}
                                </span>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    textAlign: 'center', fontSize: '1.25rem', fontWeight: 900,
                                    color: c.title, letterSpacing: '-0.02em', lineHeight: 1.25,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                {t('career_locked.title_line1', 'Career Direction')}<br />{t('career_locked.title_line2', 'Locked Successfully')}
                            </motion.h2>

                            {/* Reason */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                style={{
                                    textAlign: 'center', fontSize: '0.8rem',
                                    color: c.reason, lineHeight: 1.5,
                                    marginBottom: '1.25rem',
                                }}
                            >
                                {lockReasonText} {t('career_locked.finalized_suffix', 'Your career journey has been finalized.')}
                            </motion.p>

                            {/* Career paths */}
                            {paths.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}
                                >
                                    {paths.map(({ key, label, path, color, bg, border }, i) => (
                                        <motion.div
                                            key={key}
                                            initial={{ opacity: 0, x: -12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.45 + i * 0.08 }}
                                            style={{
                                                padding: '0.6rem 0.85rem', borderRadius: '10px',
                                                background: bg, border: `1px solid ${border}`,
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            }}
                                        >
                                            <CheckCircle size={14} color={color} style={{ flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '0.55rem', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                                    {label}
                                                </div>
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: c.pathName, marginTop: '0.1rem' }}>
                                                    {path}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Impact note */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                style={{
                                    padding: '0.75rem 0.85rem', borderRadius: '10px',
                                    background: c.impactBg,
                                    border: `1px solid ${c.impactBorder}`,
                                    marginBottom: '1.25rem',
                                }}
                            >
                                <p style={{ fontSize: '0.7rem', color: c.impactText, lineHeight: 1.5, margin: 0, textAlign: 'center' }}>
                                    <Sparkles size={10} style={{ display: 'inline', marginRight: '4px', color: '#60a5fa' }} />
                                    {t('career_locked.impact_note', 'Future learning plans, mentor guidance, and job opportunities will now be aligned with these career directions.')}
                                </p>
                            </motion.div>

                            {/* CTA */}
                            <motion.button
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.65 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                style={{
                                    width: '100%', padding: '0.75rem',
                                    borderRadius: '10px', border: 'none',
                                    background: 'linear-gradient(135deg, #112b6b 0%, #1a3884 100%)',
                                    color: 'white', fontSize: '0.85rem', fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(26,56,132,0.4)',
                                }}
                            >
                                {t('career_locked.cta', 'Begin My Career Journey')} →
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CareerLockedModal;
