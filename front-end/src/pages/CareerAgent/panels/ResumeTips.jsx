import React, { useState, useEffect } from 'react';

const PROFILE_FILES = [
    '/Tech_Role_Profiles_AUDITED_FINAL.json',
    '/Finance_Role_Profiles_AUDITED_FINAL.json',
    '/Biz_Mgmt_Role_Profiles_AUDITED_FINAL.json',
    '/Engineering_Manufacturing_Construction_Role_Profiles_AUDITED_FINAL.json',
    '/HR_PeopleManagement_Role_Profiles_AUDITED_FINAL.json',
    '/Healthcare_LifeSciences_Role_Profiles_AUDITED_FINAL.json',
    '/Sales_Mktg_Role_Profiles_AUDITED_FINAL.json',
];

const fuzzyMatch = (hay = '', needle = '') => {
    const h = hay.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    const n = needle.toLowerCase().replace(/[^a-z0-9 ]/g, '');
    return n && (h.includes(n) || n.includes(h));
};

/* ── Resume sections in order ── */
const RESUME_STRUCTURE = [
    { step: 'Header', detail: 'Name · Phone · Professional Email · LinkedIn · GitHub/Portfolio · City' },
    { step: 'Professional Summary', detail: '2–3 lines. Who you are, what you do, your strongest skill, and what you seek.' },
    { step: 'Skills', detail: 'Group by: Technical Skills | Domain Skills | Tools | Soft Skills. Match to JD keywords.' },
    { step: 'Experience / Projects', detail: 'Start with strongest action verb. Include impact metric. Use STAR format for internships.' },
    { step: 'Education', detail: 'Degree · Institution · CGPA (if ≥7.5) · Year of Pass. For freshers, put this higher.' },
    { step: 'Certifications & Courses', detail: 'Online certs from Coursera, NPTEL, Google, AWS. Signals continuous learning.' },
    { step: 'Achievements (optional)', detail: 'Hackathons, competitions, scholarships, publications. Strong differentiators.' },
];

const resolveFamily = (jf = '') => {
    const f = jf.toLowerCase();
    if (f.includes('tech') || f.includes('software') || f.includes('data'))   return 'technology';
    if (f.includes('finance') || f.includes('account') || f.includes('bank')) return 'finance';
    if (f.includes('hr') || f.includes('people'))                              return 'hr';
    if (f.includes('engineer') || f.includes('manufactur'))                   return 'engineering';
    if (f.includes('health') || f.includes('pharma'))                         return 'healthcare';
    if (f.includes('sales') || f.includes('market'))                          return 'sales';
    return 'default';
};

/* ────────────────── Main Component ────────────────── */
const ResumeTips = ({ roleName, candidateName }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading]  = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated]   = useState(false);

    useEffect(() => {
        let cancelled = false;
        Promise.all(PROFILE_FILES.map(f => fetch(f).then(r => r.ok ? r.json() : []).catch(() => [])))
            .then(res => { if (!cancelled) { setProfiles(res.flat()); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    const profile  = profiles.find(r => fuzzyMatch(r.role_name, roleName));

    /* Placeholder generate handler — ready for API key in future */
    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Loading resume data…</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }} className="animate-fade-in">

            {/* ── GENERATE RESUME CTA ── */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(79,142,247,0.12), rgba(167,139,250,0.08))',
                border: '1px solid rgba(79,142,247,0.3)',
                borderRadius: '16px', padding: '1.5rem 1.6rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
            }}>
                <div>
                    <div style={{ fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '0.3rem' }}>
                        AI Resume Builder
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--text1)', marginBottom: '0.3rem' }}>
                        Generate Your Resume
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--muted)', maxWidth: '380px' }}>
                        Auto-build a role-optimised resume for <strong style={{ color: 'var(--text2)' }}>{roleName}</strong> using your SMAART analysis data. AI API integration coming soon.
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        style={{
                            padding: '0.7rem 1.6rem',
                            background: generating ? 'var(--navy3)' : 'var(--accent)',
                            color: generating ? 'var(--muted)' : 'var(--navy)',
                            border: 'none', borderRadius: '10px',
                            fontWeight: 900, fontSize: '0.85rem', cursor: generating ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            transition: 'all 0.2s',
                        }}
                    >
                        {generating ? (
                            <><span style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--muted)', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Generating…</>
                        ) : generated ? (
                            <><span>✅</span> Resume Generated!</>
                        ) : (
                            <><span>✨</span> Generate Resume</>
                        )}
                    </button>
                    <span style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 600 }}>
                        🔗 AI API integration · Coming Soon
                    </span>
                </div>
            </div>

            {/* ── Resume Structure ── */}
            <div>
                <div style={S.sectionHead}><span>📄</span> Resume Structure</div>
                <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                    {RESUME_STRUCTURE.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', gap: '1rem', padding: '0.75rem 1rem',
                            borderBottom: i < RESUME_STRUCTURE.length - 1 ? '1px solid var(--border)' : 'none',
                            background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        }}>
                            <div style={{
                                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0, marginTop: '0.1rem',
                                background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.25)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.55rem', fontWeight: 900, color: 'var(--accent)',
                            }}>{i + 1}</div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text1)', marginBottom: '0.15rem' }}>{item.step}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.5 }}>{item.detail}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

const S = {
    sectionHead: {
        fontSize: '0.75rem', fontWeight: 800, color: 'var(--text2)',
        marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
        letterSpacing: '-0.01em',
    },
};

export default ResumeTips;
