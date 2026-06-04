/**
 * CareerLockedModal.jsx
 * Auto-lock notification modal shown when career direction becomes permanently locked.
 * Displays the three saved career paths and confirms permanence.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Target, Sparkles } from 'lucide-react';

const CareerLockedModal = ({ isOpen, onClose, lockStatus }) => {
    if (!isOpen || !lockStatus) return null;

    const {
        primaryCareerPath,
        secondaryCareerPath,
        tertiaryCareerPath,
        lockReason,
        maxAttempts,
    } = lockStatus;

    const lockReasonText =
        lockReason === 'time_expired'    ? 'Your 14-day career direction period has ended.'
        : lockReason === 'attempts_exhausted' ? `All ${maxAttempts} career analysis attempts have been used.`
        : 'You have confirmed your career direction.';

    const paths = [
        { label: 'Primary Career Path',   path: primaryCareerPath,   color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)' },
        { label: 'Secondary Career Path', path: secondaryCareerPath, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)' },
        { label: 'Tertiary Career Path',  path: tertiaryCareerPath,  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)' },
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
                        background: 'rgba(5, 8, 22, 0.88)',
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
                            background: 'linear-gradient(145deg, #0a1628 0%, #071020 100%)',
                            borderRadius: '24px',
                            border: '1px solid rgba(16,185,129,0.3)',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 60px rgba(16,185,129,0.08)',
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        {/* Green glow top */}
                        <div style={{
                            position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                            width: '260px', height: '160px',
                            background: 'radial-gradient(ellipse, rgba(16,185,129,0.15) 0%, transparent 70%)',
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
                                            border: '2px solid rgba(16,185,129,0.4)',
                                        }}
                                    />
                                    <motion.div
                                        initial={{ scale: 0, rotate: -30 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                                        style={{
                                            width: '56px', height: '56px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.15) 100%)',
                                            border: '2px solid rgba(16,185,129,0.4)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        <Lock size={24} color="#10b981" />
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
                                    textTransform: 'uppercase', color: '#10b981',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    padding: '0.25rem 0.75rem', borderRadius: '999px',
                                    background: 'rgba(16,185,129,0.05)'
                                }}>
                                    ✅ Path Finalized
                                </span>
                            </motion.div>

                            {/* Title */}
                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                style={{
                                    textAlign: 'center', fontSize: '1.25rem', fontWeight: 900,
                                    color: 'white', letterSpacing: '-0.02em', lineHeight: 1.25,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                Career Direction<br />Locked Successfully
                            </motion.h2>

                            {/* Reason */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                style={{
                                    textAlign: 'center', fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
                                    marginBottom: '1.25rem',
                                }}
                            >
                                {lockReasonText} Your career journey has been finalized.
                            </motion.p>

                            {/* Career paths */}
                            {paths.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}
                                >
                                    {paths.map(({ label, path, color, bg, border }, i) => (
                                        <motion.div
                                            key={label}
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
                                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'white', marginTop: '0.1rem' }}>
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
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    marginBottom: '1.25rem',
                                }}
                            >
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: 0, textAlign: 'center' }}>
                                    <Sparkles size={10} style={{ display: 'inline', marginRight: '4px', color: '#a78bfa' }} />
                                    Future learning plans, mentor guidance, and job opportunities will now be aligned with these career directions.
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
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.8) 0%, rgba(5,150,105,0.9) 100%)',
                                    color: 'white', fontSize: '0.85rem', fontWeight: 800,
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
                                }}
                            >
                                Begin My Career Journey →
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CareerLockedModal;
