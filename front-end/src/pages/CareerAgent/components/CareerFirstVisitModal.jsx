/**
 * CareerFirstVisitModal.jsx
 * One-time modal shown when user first visits the Career Direction Dashboard
 * after completing their first analysis.
 * Informs them about the 14-day / 5-attempt lock system.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Clock, RefreshCw, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { markModalShown } from '@/services/CareerLockService';

const CareerFirstVisitModal = ({ isOpen, onStartAnalysis, onRemindLater, lockStatus }) => {
    // Mark as shown in backend on any dismiss
    const handleDismiss = async (action) => {
        await markModalShown();
        if (action === 'start') {
            onStartAnalysis?.();
        } else {
            onRemindLater?.();
        }
    };

    if (!isOpen) return null;

    const maxAttempts = lockStatus?.maxAttempts ?? 5;
    const remainingAttempts = lockStatus?.remainingAttempts ?? 5;
    const remainingDays = lockStatus?.remainingDays ?? 14;

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
                        background: 'rgba(0, 10, 25, 0.85)',
                        backdropFilter: 'blur(8px)',
                        padding: '1rem',
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{
                            width: '100%', maxWidth: '420px',
                            background: '#0a0f1c', // Sleeker, darker navy
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '1.75rem' }}>
                            {/* Header row */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '10px', 
                                    background: 'rgba(56, 189, 248, 0.1)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                    border: '1px solid rgba(56, 189, 248, 0.2)' 
                                }}>
                                    <Target size={18} color="#38bdf8" />
                                </div>
                                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'white', margin: 0, letterSpacing: '-0.01em' }}>
                                    Lock Your Direction
                                </h2>
                            </div>

                            <p style={{
                                fontSize: '0.85rem', color: '#94a3b8',
                                lineHeight: 1.5, margin: '0 0 1.5rem 0',
                            }}>
                                You can now finalize your career direction using SMAART's AI. 
                                Please note the following parameters:
                            </p>

                            {/* Stats row */}
                            <div style={{
                                display: 'flex', gap: '0.75rem', marginBottom: '1.25rem',
                            }}>
                                <div style={{
                                    flex: 1, padding: '0.85rem', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}>
                                    <Clock size={16} color="#94a3b8" />
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Time Left</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{remainingDays} Days</div>
                                    </div>
                                </div>
                                <div style={{
                                    flex: 1, padding: '0.85rem', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                                }}>
                                    <RefreshCw size={16} color="#94a3b8" />
                                    <div>
                                        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tries Left</div>
                                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'white' }}>{remainingAttempts} of {maxAttempts}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Info text */}
                            <div style={{
                                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                                padding: '0.85rem', borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.05)',
                                border: '1px solid rgba(16, 185, 129, 0.15)',
                                marginBottom: '1.5rem'
                            }}>
                                <Lock size={14} color="#10b981" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                                    After {maxAttempts} attempts or 14 days, your paths will be <strong>permanently locked</strong> and used to tailor your SMAART journey.
                                </p>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => handleDismiss('later')}
                                    style={{
                                        padding: '0.65rem 1.25rem',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent',
                                        color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => handleDismiss('start')}
                                    style={{
                                        padding: '0.65rem 1.25rem',
                                        borderRadius: '8px', border: 'none',
                                        background: '#1A3884',
                                        color: 'white', fontSize: '0.8rem', fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#224bb0'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1A3884'}
                                >
                                    New Analysis <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CareerFirstVisitModal;

