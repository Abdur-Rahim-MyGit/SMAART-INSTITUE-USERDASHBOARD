import React from 'react';
import { BrainCircuit, Sparkles, Clock, Network } from 'lucide-react';

const AIImplementation = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.02) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '24px', padding: '3.5rem 2.5rem', textAlign: 'center', maxWidth: '550px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
            }}>
                {/* Background glow effects */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', filter: 'blur(30px)' }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', padding: '1.2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '24px', marginBottom: '1.5rem', boxShadow: 'inset 0 0 20px rgba(16, 185, 129, 0.1)' }}>
                        <BrainCircuit size={44} color="var(--green)" strokeWidth={1.5} />
                    </div>
                    
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', letterSpacing: '-0.02em' }}>
                        AI Implementation
                    </h2>
                    
                    <div style={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                        <Sparkles size={14} color="var(--amber)" /> COMING SOON
                    </div>
                    
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text2)', margin: 0 }}>
                        We are actively synthesizing specialized AI toolsets, automation exposure indexes, and human-value matrixes to prepare your career intelligence report for the upcoming AI workplace revolution.
                    </p>
                    
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem', padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: '100px', border: '1px solid var(--border)' }}>
                        <Network size={16} color="var(--muted)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Neural Networks Compiling...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIImplementation;
