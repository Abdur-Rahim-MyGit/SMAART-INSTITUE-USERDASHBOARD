import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, CheckCircle } from 'lucide-react';

const CertificateModal = ({ skillName, onConfirm, onClose, theme }) => {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [verified, setVerified] = useState(false);
    const [skipCert, setSkipCert] = useState(false);
    const fileInputRef = useRef(null);

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const handleFile = (f) => {
        if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
            setFile(f);
            setVerified(false);
            setSkipCert(false);
        }
    };

    const handleVerify = () => { if (file) setVerified(true); };
    const canConfirm = verified || skipCert;
    const handleConfirm = () => { onConfirm(skillName, file); };

    const step = !file && !skipCert ? 1 : (file && !verified) ? 2 : 3;

    const C = {
        bg:       isDark ? '#0f1729' : '#ffffff',
        surface:  isDark ? '#141f35' : '#f8fafc',
        border:   isDark ? 'rgba(255,255,255,0.09)' : '#e2e8f0',
        text1:    isDark ? '#f1f5f9' : '#0f172a',
        text2:    isDark ? '#94a3b8' : '#475569',
        muted:    isDark ? '#64748b' : '#94a3b8',
        accent:   isDark ? '#3b82f6' : '#1a3884', 
        accentBg: isDark ? 'rgba(79,142,247,0.12)' : 'rgba(26,56,132,0.08)',
        accentBorder: isDark ? 'rgba(79,142,247,0.3)' : 'rgba(26,56,132,0.25)',
        dropBg:   isDark ? '#111827' : '#f8fafc',
        btnBg:    isDark ? '#1e2d48' : '#f1f5f9',
    };

    const STEPS = ['Upload', 'Verify', 'Confirm'];

    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                zIndex: 99999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.18s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: C.bg,
                    border: `1px solid ${C.border}`,
                    borderRadius: '24px',
                    width: '100%', maxWidth: '460px',
                    overflow: 'hidden',
                    boxShadow: isDark
                        ? '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)'
                        : '0 24px 60px -12px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)',
                    position: 'relative',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    height: '4px',
                    background: isDark ? 'linear-gradient(90deg, #3b82f6, #818cf8, #06b6d4)' : '#1a3884',
                }} />

                <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '1.4rem 1.5rem 1.1rem',
                    borderBottom: `1px solid ${C.border}`,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                            fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: C.accent,
                            background: C.accentBg,
                            border: `1px solid ${C.accentBorder}`,
                            padding: '0.22rem 0.6rem', borderRadius: '100px', width: 'fit-content',
                        }}>
                            <CheckCircle size={9} />
                            Mark as Completed
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text1, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                            {skillName}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: C.surface, border: `1px solid ${C.border}`,
                            cursor: 'pointer', color: C.text2,
                            padding: '0.4rem', borderRadius: '9px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s', flexShrink: 0, marginTop: '0.1rem',
                        }}
                    >
                        <X size={15} />
                    </button>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem 1.5rem',
                    background: C.surface,
                    borderBottom: `1px solid ${C.border}`,
                    gap: '0',
                }}>
                    {STEPS.map((s, i) => {
                        const isActive = step === i + 1;
                        const isDone   = step > i + 1;
                        return (
                            <React.Fragment key={s}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.25s',
                                        background: isDone ? '#22c55e' : isActive ? C.accent : C.btnBg,
                                        border: isDone ? '2px solid #22c55e' : isActive ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
                                        boxShadow: isActive ? '0 0 0 4px rgba(79,142,247,0.18)' : 'none',
                                    }}>
                                        {isDone
                                            ? <CheckCircle size={13} color="#fff" />
                                            : <span style={{ fontSize: '0.65rem', fontWeight: 800, color: isActive ? '#fff' : C.muted }}>{i + 1}</span>
                                        }
                                    </div>
                                    <span style={{
                                        fontSize: '0.65rem', fontWeight: 700,
                                        color: isDone ? '#22c55e' : isActive ? C.text1 : C.muted,
                                        transition: 'color 0.2s',
                                    }}>
                                        {s}
                                    </span>
                                </div>
                                {i < 2 && (
                                    <div style={{
                                        width: '48px', height: '2px',
                                        margin: '0 0.4rem',
                                        marginBottom: '1.1rem',
                                        background: step > i + 1 ? '#22c55e' : C.border,
                                        transition: 'background 0.3s',
                                        borderRadius: '2px',
                                    }} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div style={{ padding: '1.4rem 1.5rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div
                        style={{
                            border: `2px dashed ${dragOver ? C.accent : verified ? '#22c55e' : file ? 'rgba(34,197,94,0.5)' : C.border}`,
                            borderRadius: '16px',
                            padding: '2.2rem 1.5rem',
                            textAlign: 'center', cursor: verified ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem',
                            userSelect: 'none',
                            background: verified
                                ? 'rgba(34,197,94,0.06)'
                                : dragOver
                                    ? C.accentBg
                                    : C.dropBg,
                        }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                        onClick={() => !verified && fileInputRef.current?.click()}
                    >
                        <input ref={fileInputRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />

                        {verified ? (
                            <>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '50%',
                                    background: 'rgba(34,197,94,0.12)',
                                    border: '2px solid rgba(34,197,94,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CheckCircle size={26} color="#22c55e" />
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#22c55e' }}>Certificate Verified ✓</div>
                                <div style={{ fontSize: '0.72rem', color: C.muted, maxWidth: '260px', wordBreak: 'break-all' }}>{file.name}</div>
                            </>
                        ) : file ? (
                            <>
                                <div style={{
                                    width: '52px', height: '52px', borderRadius: '14px',
                                    background: 'rgba(34,197,94,0.1)',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem',
                                }}>📄</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#22c55e' }}>{file.name}</div>
                                <div style={{ fontSize: '0.72rem', color: C.muted }}>{(file.size / 1024).toFixed(1)} KB &middot; Click to change</div>
                            </>
                        ) : (
                            <>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '16px',
                                    background: C.btnBg,
                                    border: `1px solid ${C.border}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}>
                                    <Upload size={22} color={C.muted} />
                                </div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: C.text1, lineHeight: 1.4 }}>
                                    Drop your certificate here or{' '}
                                    <span style={{ color: C.accent, fontWeight: 700 }}>browse files</span>
                                </div>
                                <div style={{ fontSize: '0.72rem', color: C.muted }}>PDF, JPG or PNG accepted</div>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                        {file && !verified && (
                            <button
                                onClick={handleVerify}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.55rem 1.1rem',
                                    background: C.accentBg, color: C.accent,
                                    border: `1px solid ${C.accentBorder}`, borderRadius: '9px',
                                    fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <CheckCircle size={13} /> Verify Certificate
                            </button>
                        )}
                        {!skipCert && !verified && (
                            <button
                                onClick={() => setSkipCert(true)}
                                style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '0.55rem 1rem',
                                    background: 'transparent', color: C.text2,
                                    border: `1px solid ${C.border}`, borderRadius: '9px',
                                    fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer',
                                    transition: 'all 0.15s',
                                }}
                            >
                                Skip - Mark Without Certificate
                            </button>
                        )}
                        {skipCert && (
                            <div style={{
                                fontSize: '0.74rem', color: '#f59e0b',
                                padding: '0.45rem 0.8rem',
                                background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.22)',
                                borderRadius: '9px',
                                display: 'flex', alignItems: 'center', gap: '0.35rem',
                            }}>
                                ⚠️ Marking as complete without a certificate
                            </div>
                        )}
                    </div>
                </div>

                <div style={{
                    display: 'flex', gap: '0.65rem',
                    padding: '1rem 1.5rem',
                    borderTop: `1px solid ${C.border}`,
                    justifyContent: 'flex-end',
                    background: C.surface,
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.6rem 1.3rem',
                            background: C.btnBg, color: C.text2,
                            border: `1px solid ${C.border}`, borderRadius: '10px',
                            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                            padding: '0.6rem 1.4rem',
                            background: canConfirm ? C.accent : C.btnBg,
                            color: canConfirm ? '#ffffff' : C.muted,
                            border: canConfirm ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
                            borderRadius: '10px', fontSize: '0.82rem', fontWeight: 700,
                            transition: 'all 0.2s',
                            cursor: canConfirm ? 'pointer' : 'not-allowed',
                            boxShadow: canConfirm ? '0 4px 14px rgba(79,142,247,0.35)' : 'none',
                        }}
                    >
                        <CheckCircle size={14} />
                        {verified ? 'Complete with Certificate' : 'Mark as Completed'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CertificateModal;
