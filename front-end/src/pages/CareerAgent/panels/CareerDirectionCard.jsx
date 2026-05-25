import React, { useState, useEffect } from 'react';
import { Target, Compass, ChevronRight, AlertCircle, TrendingUp, UserRound, Zap, ListChecks } from 'lucide-react';

const CareerDirectionCard = ({ roleName, mongoRoleData }) => {
    const [data, setData] = useState({
        direction: null,
        narrative: null,
        profile: null,
        userSkills: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoleIntelligence = async () => {
            setLoading(true);
            try {
                // 1. GET USER METADATA FROM STORAGE
                const degree = localStorage.getItem('smaart_user_degree') || 'Bachelor of Technology';
                const spec = localStorage.getItem('smaart_user_specialisation') || 'Computer Science';
                const storedSkills = localStorage.getItem('smaart_user_skills');
                const userSkills = storedSkills ? JSON.parse(storedSkills) : [];

                // 2. FETCH ROLE DATA (if not in props)
                let roleDoc = mongoRoleData;
                if (!roleDoc) {
                    const rRes = await fetch(`/api/career-role/${encodeURIComponent(roleName)}`);
                    if (rRes.ok) roleDoc = await rRes.json();
                }

                // 3. FETCH DIRECTION MAPPING FROM MONGODB
                const dRes = await fetch('/api/career-direction', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ degree, specialisation: spec, roleName })
                });
                
                let directionData = null;
                if (dRes.ok) {
                    const dData = await dRes.json();
                    directionData = {
                        ...dData.direction,
                        degree: dData.degree_name
                    };
                }

                setData({
                    direction: directionData,
                    narrative: roleDoc, // mongo role doc has narratives
                    profile: roleDoc,   // mongo role doc has profiles
                    userSkills
                });

            } catch (err) {
                console.warn("Role intelligence data missing", err);
            } finally {
                setLoading(false);
            }
        };

        if (roleName) fetchRoleIntelligence();
    }, [roleName, mongoRoleData]);

    if (loading) return <div className="animate-pulse" style={{ height: '300px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px' }} />;
    if (!data.direction && !data.narrative) return null;

    // --- SKILL GAP LOGIC ---
    const missingHighSkills = data.profile?.technical_skills?.filter(ts => {
        const isHigh = ts.importance === 'High';
        if (!isHigh) return false;
        
        // Match against userSkills (which are objects { name, status, etc })
        const hasSkill = data.userSkills?.some(us => {
            const uName = (typeof us === 'string' ? us : (us.name || us.skill_name || '')).toLowerCase();
            const tsName = ts.skill_name.toLowerCase();
            return uName.includes(tsName) || tsName.includes(uName);
        });
        
        return !hasSkill;
    }) || [];

    const S = {
        container: {
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
        },
        card: {
            background: 'var(--navy2)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            overflow: 'hidden',
        },
        header: {
            padding: '1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        badge: (type) => ({
            fontSize: '0.62rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            background: type === 'Primary' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
            color: type === 'Primary' ? '#10b981' : '#f59e0b',
            border: `1px solid ${type === 'Primary' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }),
        content: {
            padding: '1.25rem',
        },
        title: {
            fontSize: '1rem',
            fontWeight: 800,
            color: 'var(--text1)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
        },
        grid: {
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginTop: '1rem'
        },
        tag: {
            fontSize: '0.72rem', fontWeight: 600, padding: '0.3rem 0.7rem', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', color: 'var(--text2)', border: '1px solid var(--border)'
        }
    };

    return (
        <div style={S.container}>
            {/* 1. CAREER DIRECTION & FIT */}
            {data.direction && (
                <div style={S.card}>
                    <div style={S.header}>
                        <div style={S.title}><Compass size={18} className="icon-accent" /> Audited Career Direction</div>
                        <span style={S.badge(data.direction.direction_type)}>{data.direction.direction_type} Fit</span>
                    </div>
                    <div style={S.content}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, marginBottom: '0.4rem' }}>PATHWAY VIA: <span style={{ color: 'var(--accent)' }}>{data.direction.degree}</span></div>
                        <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1.15rem', color: 'var(--text1)' }}>{data.direction.direction_name}</h4>
                        <p style={{ fontSize: '0.88rem', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{data.direction.direction_description}</p>
                        
                        <div style={S.grid}>
                            <div style={{ background: 'var(--accent-tint)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent-border)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}><TrendingUp size={12} /> STRATEGIC FIT</div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>{data.direction.why_primary || data.direction.realistic_note}</p>
                            </div>
                            <div style={{ background: 'rgba(245,158,11,0.04)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.1)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}><Target size={12} /> TRANSITION EFFORT</div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>{data.direction.estimated_additional_effort || "Minimal (Direct pathway)"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerDirectionCard;
