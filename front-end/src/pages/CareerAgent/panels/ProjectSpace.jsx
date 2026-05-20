import React from 'react';
import { Rocket, Hammer, Code2, Layers, CheckCircle2, Lock } from 'lucide-react';

const ProjectSpace = ({ projects, locked, onUnlockClick, roleName }) => {
    
    /* ── Shared card style ── */
    const box = {
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
    };

    const boxAccent = {
        background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, var(--navy2) 60%)',
        borderColor: 'rgba(79,142,247,0.2)',
    };

    const divider = { height: '1px', background: 'var(--border)', margin: '0.75rem 0 1rem' };

    /* ── Box Header ── */
    const BoxHeader = ({ icon: Icon, label, title, accent }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
                width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Icon size={18} strokeWidth={1.75} color={accent ? 'var(--accent)' : 'var(--text2)'} />
            </div>
            <div>
                {label && <div style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{label}</div>}
                <div style={{ fontSize: '1rem', fontWeight: 800, color: accent ? 'var(--accent)' : 'var(--text1)' }}>{title}</div>
            </div>
        </div>
    );

    if (locked) {
        return (
            <div style={{ ...box, padding: '3rem 2rem', alignItems: 'center', textAlign: 'center', borderStyle: 'dashed', borderColor: 'var(--border2)' }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '1.5rem', color: 'var(--muted)'
                }}>
                    <Lock size={28} strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text1)', marginBottom: '0.5rem' }}>Project Space Locked</h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.88rem', maxWidth: '320px', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                    Confirm your career path in the <strong style={{ color: 'var(--text2)' }}>Role Detailed View</strong> to unlock high-impact project blueprints.
                </p>
                <button
                    onClick={onUnlockClick}
                    style={{
                        padding: '0.75rem 2rem',
                        background: 'var(--accent)', color: 'var(--navy)',
                        border: 'none', borderRadius: '12px',
                        fontSize: '0.85rem', fontWeight: 900, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    Unlock Project Space <Rocket size={16} />
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="animate-fade-in">
            {projects.map((p, i) => (
                <div key={i} style={{ ...box, ...boxAccent }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <BoxHeader 
                            icon={Layers} 
                            label={`Blueprint 0${i + 1}`} 
                            title={p.project_name} 
                            accent 
                        />
                        <div style={{
                            fontSize: '0.6rem', fontWeight: 800, color: 'var(--green)',
                            background: 'rgba(16,185,129,0.08)', padding: '0.25rem 0.6rem',
                            borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)'
                        }}>LEVEL: CAPSTONE</div>
                    </div>
                    
                    <div style={divider} />
                    
                    <p style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                        {p.description}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: 'auto' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                                Core Competencies Gained
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {p.skills_demonstrated.split(',').map((skill, si) => (
                                    <span key={si} style={{
                                        fontSize: '0.7rem', fontWeight: 600, color: 'var(--text1)',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                        padding: '0.2rem 0.6rem', borderRadius: '6px'
                                    }}>
                                        {skill.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <div style={{
                                padding: '0.5rem 1rem', background: 'var(--navy3)',
                                border: '1px solid var(--border)', borderRadius: '10px',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: 'pointer', transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
                            >
                                <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>View Spec</span>
                                <Code2 size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectSpace;
