import React, { useEffect, useState } from 'react';
import { Brain, Target, Code2, Mic } from 'lucide-react';

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

/* ── Data ── */
const APTITUDE_RESOURCES = [
    { name: 'IndiaBix',     desc: 'Aptitude, logical reasoning & verbal — most used for campus prep', url: 'https://www.indiabix.com/' },
    { name: 'PrepInsta',    desc: 'Company-wise test patterns for TCS, Infosys, Wipro, Accenture',   url: 'https://prepinsta.com/' },
    { name: 'Testbook',     desc: 'Mock tests, previous papers & live quizzes for aptitude',          url: 'https://testbook.com/' },
    { name: 'AMCAT Portal', desc: 'Official AMCAT practice for campus placements',                    url: 'https://www.myamcat.com/' },
];

const DOMAIN_RESOURCES = {
    technology:  [
        { name: 'LeetCode',      desc: 'DSA problems — must-have for product company interviews', url: 'https://leetcode.com/' },
        { name: 'InterviewBit',  desc: 'Structured tech interview prep with company tracks',       url: 'https://www.interviewbit.com/' },
        { name: 'GeeksforGeeks', desc: 'CS concepts, coding questions & system design guides',     url: 'https://www.geeksforgeeks.org/' },
        { name: 'HackerRank',    desc: 'Coding challenges & certificates accepted by recruiters',  url: 'https://www.hackerrank.com/' },
    ],
    finance: [
        { name: 'Investopedia', desc: 'Finance concepts, ratios, valuation & banking terms',      url: 'https://www.investopedia.com/' },
        { name: 'CFI (FMVA)',   desc: 'Financial modelling, Excel & investment banking prep',      url: 'https://corporatefinanceinstitute.com/' },
        { name: 'AmbitionBox',  desc: 'Real interview questions from finance companies in India',  url: 'https://www.ambitionbox.com/' },
        { name: 'Glassdoor',    desc: 'Interview experiences from Indian Finance & BFSI firms',    url: 'https://www.glassdoor.co.in/Interview/' },
    ],
    hr: [
        { name: 'HR Interview Guide', desc: 'Top HR questions, answers & BEI method examples',      url: 'https://www.interviewbit.com/hr-interview-questions/' },
        { name: 'SHRM',               desc: 'HR knowledge base, competency frameworks & certs',     url: 'https://www.shrm.org/' },
        { name: 'Glassdoor',          desc: 'HR & People Management interview experiences in India', url: 'https://www.glassdoor.co.in/Interview/' },
        { name: 'AmbitionBox',        desc: 'Company-specific HR role interview questions',         url: 'https://www.ambitionbox.com/' },
    ],
    engineering: [
        { name: 'GATE Overflow', desc: 'Engineering concepts, GATE questions & technical prep',   url: 'https://gateoverflow.in/' },
        { name: 'GeeksforGeeks', desc: 'Technical questions for core engineering roles',           url: 'https://www.geeksforgeeks.org/' },
        { name: 'Glassdoor',     desc: 'Core engineering experiences at L&T, Tata, etc.',         url: 'https://www.glassdoor.co.in/Interview/' },
        { name: 'AmbitionBox',   desc: 'Manufacturing & construction company interview reviews',   url: 'https://www.ambitionbox.com/' },
    ],
    healthcare: [
        { name: 'PrepLadder',  desc: 'Medical concepts, USMLE-style MCQs & clinical scenarios', url: 'https://www.prepladder.com/' },
        { name: 'Marrow',      desc: 'Clinical knowledge, pharmacology & pathology prep',        url: 'https://www.marrow.com/' },
        { name: 'Glassdoor',   desc: 'Healthcare & pharma interview experiences India',           url: 'https://www.glassdoor.co.in/Interview/' },
        { name: 'AmbitionBox', desc: 'Life sciences & hospital industry interview questions',     url: 'https://www.ambitionbox.com/' },
    ],
    sales: [
        { name: 'HubSpot Academy',   desc: 'Sales, CRM & inbound marketing certifications — free',  url: 'https://academy.hubspot.com/' },
        { name: 'Glassdoor',          desc: 'Sales & marketing questions at Indian companies',        url: 'https://www.glassdoor.co.in/Interview/' },
        { name: 'AmbitionBox',        desc: 'BD, marketing & sales role interview reviews in India',  url: 'https://www.ambitionbox.com/' },
        { name: 'LinkedIn Learning',  desc: 'Sales strategy, negotiation & client handling courses',  url: 'https://www.linkedin.com/learning/' },
    ],
    default: [
        { name: 'Glassdoor',         desc: 'Real interview questions across sectors in India',     url: 'https://www.glassdoor.co.in/Interview/' },
        { name: 'AmbitionBox',       desc: 'Company & role-specific interview experiences India',  url: 'https://www.ambitionbox.com/' },
        { name: 'LinkedIn Learning', desc: 'Professional skill courses & interview preparation',   url: 'https://www.linkedin.com/learning/' },
        { name: 'Coursera',          desc: 'Industry-validated courses & certificates',            url: 'https://www.coursera.org/' },
    ],
};

const DOMAIN_QUESTIONS = {
    technology:  ['Walk me through a project you built end-to-end.', 'How would you design the backend for a food delivery app?', 'Explain the difference between SQL and NoSQL databases.', 'How do you ensure code quality in a sprint?', 'What version control workflows do you follow?'],
    finance:     ['Explain the difference between equity and debt financing.', 'How would you value a startup with no revenue yet?', 'Walk me through a DCF model.', 'What is Working Capital and why does it matter?', 'How does a change in interest rate affect bond prices?'],
    hr:          ['How would you handle a conflict between two employees?', 'Describe your process for conducting performance reviews.', 'What HR tech/HRMS tools have you used?', 'How do you build a talent pipeline proactively?', 'What metrics do you track for employee engagement?'],
    engineering: ['Walk me through a project where you improved efficiency.', 'How do you ensure quality control in manufacturing?', 'Describe your experience with CAD or simulation tools.', 'How do you handle safety compliance on-site?', 'What industry standards are you familiar with (ISO, BIS)?'],
    healthcare:  ['Describe a clinical scenario where you had to make a quick decision.', 'How do you stay current with medical guidelines and research?', 'Walk me through your approach to patient communication.', 'How do you manage documentation under time pressure?', 'What is your experience with digital health tools or EMR systems?'],
    sales:       ['Describe your sales process from lead to close.', 'Tell me about your most successful deal and what made it work.', 'How do you handle rejection or a lost deal?', 'What CRM tools have you used and how?', 'How do you build long-term client relationships?'],
    default:     ['Walk me through a project you are most proud of.', 'How do you prioritise when multiple tasks compete for your time?', 'Describe a time you had to learn something quickly.', 'How do you collaborate with cross-functional teams?', 'What tools or platforms do you use to stay productive?'],
};

const COMMON_QUESTIONS = [
    'Tell me about yourself and your career journey so far.',
    'Why are you interested in this specific role and company?',
    'Describe a challenge you faced and how you resolved it.',
    'What are your strengths and how do they apply to this role?',
    'Where do you see yourself in 3–5 years?',
    'How do you handle pressure or tight deadlines?',
    'Do you have any questions for us?',
];

const resolveFamily = (jf = '') => {
    const f = jf.toLowerCase();
    if (f.includes('tech') || f.includes('software') || f.includes('data'))              return 'technology';
    if (f.includes('finance') || f.includes('account') || f.includes('bank'))            return 'finance';
    if (f.includes('hr') || f.includes('people') || f.includes('human'))                 return 'hr';
    if (f.includes('engineer') || f.includes('manufactur') || f.includes('construction'))return 'engineering';
    if (f.includes('health') || f.includes('pharma') || f.includes('life'))              return 'healthcare';
    if (f.includes('sales') || f.includes('market') || f.includes('smma'))               return 'sales';
    return 'default';
};

/* ── Shared card style matching RoleDetailedView ── */
const box = {
    background: 'var(--navy2)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
};
const boxAccent = {
    background: 'linear-gradient(135deg, rgba(79,142,247,0.06) 0%, var(--navy2) 60%)',
    borderColor: 'rgba(79,142,247,0.2)',
};
const divider = { height: '1px', background: 'var(--border)', margin: '0.75rem 0 1rem' };

/* ── Box Header — Lucide icon ── */
const BoxHeader = ({ icon: Icon, label, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0' }}>
        <div style={{
            width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <Icon size={18} strokeWidth={1.75} color="var(--accent)" />
        </div>
        <div>
            {label && <div style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.1rem' }}>{label}</div>}
            <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent)' }}>{title}</div>
        </div>
    </div>
);

/* ── Resource link row ── */
const ResLink = ({ r }) => (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)', textDecoration: 'none', color: 'inherit', gap: '0.5rem' }}
        onMouseEnter={e => e.currentTarget.querySelector('span.rn').style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.querySelector('span.rn').style.color = 'var(--text1)'}
    >
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span className="rn" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text1)', transition: 'color 0.15s' }}>{r.name}</span>
                <span style={{ fontSize: '0.58rem', color: 'var(--muted)' }}>↗</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.1rem', lineHeight: 1.5 }}>{r.desc}</div>
        </div>
    </a>
);

/* ── Question row ── */
const QRow = ({ q, i, badge, badgeColor }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
        <span style={{
            fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.04em',
            color: badgeColor || 'var(--muted)',
            minWidth: '26px', paddingTop: '0.2rem', flexShrink: 0,
        }}>{badge || `${i + 1}.`}</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.65 }}>{q}</span>
    </div>
);

/* ── Main ── */
const InterviewPrep = ({ roleName }) => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        let cancelled = false;
        Promise.all(PROFILE_FILES.map(f => fetch(f).then(r => r.ok ? r.json() : []).catch(() => [])))
            .then(res => { if (!cancelled) { setProfiles(res.flat()); setLoading(false); } });
        return () => { cancelled = true; };
    }, []);

    const profile   = profiles.find(r => fuzzyMatch(r.role_name, roleName));
    const family    = resolveFamily(profile?.job_family || '');
    const domainRes = DOMAIN_RESOURCES[family] || DOMAIN_RESOURCES.default;
    const domainQs  = DOMAIN_QUESTIONS[family] || DOMAIN_QUESTIONS.default;

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--accent)', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Loading interview data…</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-in">

            {/* ── Row 1: Aptitude + Domain Resources ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                {/* Aptitude box */}
                <div style={box}>
                    <BoxHeader icon={Brain} label="Section 01" title="Aptitude & Reasoning" />
                    <div style={divider} />
                    {APTITUDE_RESOURCES.map((r, i) => <ResLink key={i} r={r} />)}
                    <div style={{ height: 0, borderBottom: 'none' }} />
                </div>

                {/* Domain Resources box */}
                <div style={{ ...box, ...boxAccent }}>
                    <BoxHeader icon={Target} label="Section 02" title={profile?.job_family || 'Domain'} />
                    <div style={divider} />
                    {domainRes.map((r, i) => <ResLink key={i} r={r} />)}
                </div>
            </div>

            {/* ── Row 2: Technical Qs + HR Qs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

                {/* Technical questions */}
                <div style={box}>
                    <BoxHeader icon={Code2} label="Section 03" title={`Technical — ${roleName}`} />
                    <div style={divider} />
                    {domainQs.map((q, i) => <QRow key={i} q={q} i={i} />)}
                </div>

                {/* HR & Behavioural */}
                <div style={box}>
                    <BoxHeader icon={Mic} label="Section 04" title="HR & Behavioural" />
                    <div style={divider} />
                    {COMMON_QUESTIONS.map((q, i) => <QRow key={i} q={q} i={i} badge="HR" badgeColor="var(--muted)" />)}
                </div>
            </div>

        </div>
    );
};

export default InterviewPrep;
