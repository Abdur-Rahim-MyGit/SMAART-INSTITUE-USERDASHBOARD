/**
 * SMAARTHire — 5 ATS-safe resume templates.
 *
 * Every template is a *theme* (font, colours, header alignment, section-header
 * style) applied by one shared renderer. The renderer reads the resume's
 * `layout` (font size, spacing, section order, hidden sections, extra space
 * before a section) so all five styles behave identically in the Review
 * step's controls panel. Pure inline styles, single column, no tables.
 */
import { normalizeLayout } from './resumeLayout';

// ─── Shared utility ──────────────────────────────────────────────────────────

/** Drop any field that is blank / empty array. Returns clean string or null. */
export const clean = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    return val;
};

const contactRow = (fields, sep = ' | ') => fields.filter(Boolean).join(sep);
const csvList = (val) => String(val || '').split(',').map(x => x.trim()).filter(Boolean);
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const joinCsv = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

/** "React, Node" + levels → "React (Advanced), Node" — plain text, ATS-safe. */
const withLevels = (csv, levels) => {
    const map = new Map((levels || []).filter(l => l?.name && l?.level).map(l => [l.name.toLowerCase(), l.level]));
    return csvList(csv).map(x => (map.get(x.toLowerCase()) ? `${x} (${cap(map.get(x.toLowerCase()))})` : x)).join(', ');
};

export const hasSkills = (skills) =>
    !!(clean(skills?.technical) || clean(skills?.domain) || clean(skills?.ai) || clean(skills?.soft) || clean(skills?.languages));

// ─── Data adapter (ResumeBuilder resumeData → template schema) ───────────────
export const adaptData = (resumeData) => {
    const exp = (e) => ({
        type: e.type || '',
        company: e.company || '',
        jobRole: e.role || '',
        duration: e.duration || '',
        location: e.location || '',
        description: e.description || '',
    });
    return {
        profile: {
            fullName: resumeData?.personalInfo?.fullName || '',
            targetRole: resumeData?.personalInfo?.targetRole || '',
            email: resumeData?.personalInfo?.email || '',
            mobile: resumeData?.personalInfo?.mobile || '',
            location: resumeData?.personalInfo?.location || '',
            linkedinUrl: resumeData?.personalInfo?.linkedinUrl || '',
            portfolioOrGithubUrl: resumeData?.personalInfo?.githubUrl || resumeData?.personalInfo?.portfolioUrl || '',
            professionalSummary: resumeData?.summary || '',
            objective: resumeData?.objective || '',
            summaryMode: resumeData?.summaryMode === 'objective' ? 'objective' : 'summary',
        },
        education: (resumeData?.education || []).map(e => ({
            level: e.level || '',
            institutionName: e.institution || '',
            degree: e.degree || '',
            specialisation: e.specialisation || '',
            board: e.board || '',
            startYear: e.startYear || '',
            yearOfPassing: e.year || '',
            pursuing: !!e.pursuing,
            grade: e.grade || '',
            location: e.location || '',
        })),
        // Internships print as their own section; anything else (including
        // untyped rows from older resumes) stays under Experience.
        experience: (resumeData?.experience || []).filter(e => (e.type || '') !== 'internship').map(exp),
        internships: (resumeData?.experience || []).filter(e => e.type === 'internship').map(exp),
        projects: (resumeData?.projects || []).map(p => ({
            projectTitle: p.title || '',
            projectLink: p.link || '',
            techStack: p.techStack || '',
            role: p.role || '',
            duration: p.duration || '',
            outcome: p.outcome || '',
            description: p.description || '',
        })),
        certifications: (resumeData?.certifications || []).map(c => ({
            name: c.name || '',
            issuer: c.issuer || '',
            year: c.year || '',
            credentialId: c.credentialId || '',
            link: c.link || '',
        })),
        positions: (resumeData?.positions || []).map(x => ({
            type: x.type || 'position',
            title: x.title || '',
            organisation: x.organisation || '',
            duration: x.duration || '',
            description: x.description || '',
        })),
        publications: (resumeData?.publications || []).map(x => ({
            type: x.type || 'publication',
            title: x.title || '',
            venue: x.venue || '',
            year: x.year || '',
            link: x.link || '',
            description: x.description || '',
        })),
        skills: {
            technical: joinCsv(resumeData?.skills?.technical),
            domain: joinCsv(resumeData?.skills?.domain),
            ai: joinCsv(resumeData?.skills?.ai),
            soft: joinCsv(resumeData?.skills?.soft),
            languages: joinCsv(resumeData?.skills?.languages),
            levels: Array.isArray(resumeData?.skills?.levels) ? resumeData.skills.levels : [],
        },
        awards: (resumeData?.achievements || []).map(a => ({
            achievementTitle: a.title || '',
            description: a.description || '',
        })),
        extracurricular: '',
    };
};

// ─── Sizing ──────────────────────────────────────────────────────────────────
// Every size derives from the chosen point size so 9pt and 12pt stay proportional.
const SPACING_PRESETS = {
    compact: { section: 8, entry: 5, line: 1.32, headerGap: 4 },
    normal: { section: 12, entry: 8, line: 1.45, headerGap: 6 },
    relaxed: { section: 16, entry: 10, line: 1.58, headerGap: 8 },
};

const makeSizing = (layout) => {
    const scale = layout.fontSize / 10;
    const px = (n) => `${(n * scale).toFixed(2)}px`;
    const sp = SPACING_PRESETS[layout.spacing] || SPACING_PRESETS.normal;
    return {
        scale,
        px,
        base: px(11),
        body: px(10.5),
        small: px(10),
        head: px(12),
        name: px(22),
        role: px(13),
        lineHeight: sp.line,
        sectionGap: `${sp.section}px`,
        entryGap: `${sp.entry}px`,
        headerGap: `${sp.headerGap}px`,
        blankLine: 9 * scale,
    };
};

// ─── Building blocks ─────────────────────────────────────────────────────────

const BulletLines = ({ text, style }) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    return (
        <ul style={{ margin: '3px 0 0 0', paddingLeft: '16px', ...style }}>
            {lines.map((line, i) => (
                <li key={i} style={{ marginBottom: '2px' }}>{line}</li>
            ))}
        </ul>
    );
};

const Row = ({ left, right, sz, bodyStyle, gap }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: gap }}>
        <strong style={{ fontSize: sz.base, minWidth: 0 }}>{left}</strong>
        {right && <span style={{ fontSize: sz.small, whiteSpace: 'nowrap', ...bodyStyle }}>{right}</span>}
    </div>
);

const EXPERIENCE_TYPE_LABEL = { 'full-time': 'Full-time', 'part-time': 'Part-time', freelance: 'Freelance', volunteer: 'Volunteer' };

// Each section renders null when it has nothing to say, so hidden and empty
// sections cost no space. `ctx` = { sz, bodyStyle, sectionHeader, labelStyle }.
const SECTION_RENDERERS = {
    summary: (data, ctx) => {
        const isObjective = data.profile.summaryMode === 'objective';
        const text = clean(isObjective ? data.profile.objective : data.profile.professionalSummary);
        if (!text) return null;
        return (
            <>
                {ctx.sectionHeader(isObjective ? 'CAREER OBJECTIVE' : 'PROFESSIONAL SUMMARY')}
                <p style={{ margin: 0, fontSize: ctx.sz.body, ...ctx.bodyStyle }}>{text}</p>
            </>
        );
    },

    education: (data, ctx) => {
        const rows = (data.education || []).filter(e => clean(e.degree) || clean(e.institutionName));
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('EDUCATION')}
                {rows.map((edu, i) => {
                    const title = [clean(edu.degree), clean(edu.specialisation)].filter(Boolean).join(' in ');
                    const years = [clean(edu.startYear), clean(edu.yearOfPassing)].filter(Boolean).join(' – ');
                    const when = edu.pursuing ? (years ? `${years} (Pursuing)` : 'Pursuing') : years;
                    const meta = [
                        clean(edu.board),
                        clean(edu.grade) && `Grade/CGPA: ${edu.grade}`,
                        clean(edu.location) && `Location: ${edu.location}`,
                    ].filter(Boolean).join(' | ');
                    return (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: ctx.sz.entryGap }}>
                            <div style={{ minWidth: 0 }}>
                                <strong style={{ fontSize: ctx.sz.base }}>{title}{edu.institutionName ? ` — ${edu.institutionName}` : ''}</strong>
                                {meta && <div style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }}>{meta}</div>}
                            </div>
                            {when && <div style={{ fontSize: ctx.sz.body, textAlign: 'right', whiteSpace: 'nowrap', ...ctx.bodyStyle }}>{when}</div>}
                        </div>
                    );
                })}
            </>
        );
    },

    internships: (data, ctx) => renderExperience(data.internships, 'INTERNSHIPS', ctx),
    experience: (data, ctx) => renderExperience(data.experience, 'EXPERIENCE', ctx),

    projects: (data, ctx) => {
        const rows = (data.projects || []).filter(p => clean(p.projectTitle));
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('PROJECTS')}
                {rows.map((p, i) => {
                    const meta = [clean(p.role), clean(p.duration), clean(p.projectLink)].filter(Boolean).join(' | ');
                    return (
                        <div key={i} style={{ marginBottom: ctx.sz.entryGap }}>
                            <Row left={p.projectTitle} right={meta} sz={ctx.sz} bodyStyle={ctx.bodyStyle} gap="0" />
                            {clean(p.techStack) && <div style={{ fontSize: ctx.sz.small, ...ctx.bodyStyle }}><strong>Tech Stack:</strong> {p.techStack}</div>}
                            <BulletLines text={p.description} style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }} />
                            {clean(p.outcome) && <div style={{ fontSize: ctx.sz.body, marginTop: '2px', ...ctx.bodyStyle }}><strong>Outcome:</strong> {p.outcome}</div>}
                        </div>
                    );
                })}
            </>
        );
    },

    skills: (data, ctx) => {
        const s = data.skills || {};
        const rows = [
            { label: 'Technical Skills', val: clean(withLevels(s.technical, s.levels)) },
            { label: 'Domain Skills', val: clean(withLevels(s.domain, s.levels)) },
            { label: 'AI Skills', val: clean(withLevels(s.ai, s.levels)) },
            { label: 'Soft Skills', val: clean(s.soft) },
            { label: 'Languages', val: clean(s.languages) },
        ].filter(r => r.val);
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('SKILLS')}
                {rows.map(r => (
                    <p key={r.label} style={{ margin: '3px 0', fontSize: ctx.sz.body, ...ctx.bodyStyle }}>
                        <strong style={ctx.labelStyle}>{r.label}: </strong>{r.val}
                    </p>
                ))}
            </>
        );
    },

    certifications: (data, ctx) => {
        const rows = (data.certifications || []).filter(c => clean(c.name));
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('CERTIFICATIONS')}
                {rows.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', marginBottom: ctx.sz.entryGap }}>
                        <div style={{ minWidth: 0 }}>
                            <strong style={{ fontSize: ctx.sz.base }}>{c.name}</strong>
                            {(clean(c.issuer) || clean(c.credentialId) || clean(c.link)) && (
                                <div style={{ fontSize: ctx.sz.small, ...ctx.bodyStyle }}>
                                    {[clean(c.issuer), clean(c.credentialId) && `ID: ${c.credentialId}`, clean(c.link)].filter(Boolean).join(' | ')}
                                </div>
                            )}
                        </div>
                        {clean(c.year) && <span style={{ fontSize: ctx.sz.small, whiteSpace: 'nowrap', ...ctx.bodyStyle }}>{c.year}</span>}
                    </div>
                ))}
            </>
        );
    },

    positions: (data, ctx) => {
        const rows = (data.positions || []).filter(x => clean(x.title));
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('POSITIONS OF RESPONSIBILITY & ACTIVITIES')}
                {rows.map((x, i) => (
                    <div key={i} style={{ marginBottom: ctx.sz.entryGap }}>
                        <Row left={`${x.title}${clean(x.organisation) ? ` — ${x.organisation}` : ''}`} right={clean(x.duration)} sz={ctx.sz} bodyStyle={ctx.bodyStyle} gap="0" />
                        {x.type === 'activity' && <div style={{ fontSize: ctx.sz.small, ...ctx.bodyStyle }}>Extracurricular</div>}
                        <BulletLines text={x.description} style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }} />
                    </div>
                ))}
            </>
        );
    },

    publications: (data, ctx) => {
        const rows = (data.publications || []).filter(x => clean(x.title));
        if (!rows.length) return null;
        return (
            <>
                {ctx.sectionHeader('PUBLICATIONS & PATENTS')}
                {rows.map((x, i) => {
                    const meta = [x.type === 'patent' ? 'Patent' : null, clean(x.venue), clean(x.link)].filter(Boolean).join(' | ');
                    return (
                        <div key={i} style={{ marginBottom: ctx.sz.entryGap }}>
                            <Row left={x.title} right={clean(x.year)} sz={ctx.sz} bodyStyle={ctx.bodyStyle} gap="0" />
                            {meta && <div style={{ fontSize: ctx.sz.small, ...ctx.bodyStyle }}>{meta}</div>}
                            {clean(x.description) && <div style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }}>{x.description}</div>}
                        </div>
                    );
                })}
            </>
        );
    },

    awards: (data, ctx) => {
        const rows = (data.awards || []).filter(a => clean(a.achievementTitle));
        if (!rows.length && !clean(data.extracurricular)) return null;
        return (
            <>
                {ctx.sectionHeader('AWARDS & ACHIEVEMENTS')}
                {rows.map((a, i) => (
                    <div key={i} style={{ marginBottom: ctx.sz.entryGap }}>
                        <strong style={{ fontSize: ctx.sz.base }}>{a.achievementTitle}</strong>
                        {clean(a.description) && <div style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }}>{a.description}</div>}
                    </div>
                ))}
                {clean(data.extracurricular) && (
                    <div style={{ marginTop: '4px' }}>
                        <strong style={{ fontSize: ctx.sz.base }}>Extracurricular Activity</strong>
                        <div style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }}>{data.extracurricular}</div>
                    </div>
                )}
            </>
        );
    },
};

function renderExperience(rows, title, ctx) {
    const list = (rows || []).filter(e => clean(e.jobRole) || clean(e.company));
    if (!list.length) return null;
    return (
        <>
            {ctx.sectionHeader(title)}
            {list.map((exp, i) => {
                const meta = [clean(exp.location) && `Location: ${exp.location}`, EXPERIENCE_TYPE_LABEL[exp.type]].filter(Boolean).join(' | ');
                return (
                    <div key={i} style={{ marginBottom: ctx.sz.entryGap }}>
                        <Row left={`${exp.jobRole}${exp.company ? ` — ${exp.company}` : ''}`} right={clean(exp.duration)} sz={ctx.sz} bodyStyle={ctx.bodyStyle} gap="0" />
                        {meta && <div style={{ fontSize: ctx.sz.small, ...ctx.bodyStyle }}>{meta}</div>}
                        <BulletLines text={exp.description} style={{ fontSize: ctx.sz.body, ...ctx.bodyStyle }} />
                    </div>
                );
            })}
        </>
    );
}

// ─── Shared page renderer ────────────────────────────────────────────────────

const PageWrapper = ({ children, fontFamily, sz, watermark, footer }) => (
    <div
        id="resume-preview"
        style={{
            width: '210mm',
            minHeight: '297mm',
            backgroundColor: '#ffffff',
            fontFamily,
            fontSize: sz.base,
            lineHeight: sz.lineHeight,
            color: '#111111',
            padding: '16mm 15mm 22mm 15mm',
            boxSizing: 'border-box',
            position: 'relative',
        }}
    >
        {watermark}
        <div style={{ position: 'relative', zIndex: 10 }}>
            {children}
        </div>
        {footer}
    </div>
);

/**
 * Renders header + ordered sections for a theme. `layout` is optional and
 * normalised here so callers can pass whatever the resume document holds.
 */
const ResumePage = ({ theme, data, layout, watermark, footer }) => {
    const l = normalizeLayout(layout);
    const sz = makeSizing(l);
    const ctx = {
        sz,
        bodyStyle: theme.body,
        labelStyle: theme.skillLabel,
        sectionHeader: (label) => theme.sectionHeader(label, sz),
    };
    const hidden = new Set(l.hiddenSections);
    const { profile } = data;
    const contact = contactRow([
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ]);

    return (
        <PageWrapper fontFamily={theme.fontFamily} sz={sz} watermark={watermark} footer={footer}>
            <div style={{ marginBottom: sz.px(theme.headerGap || 10), textAlign: theme.headerAlign || 'left' }}>
                <div style={{ fontSize: sz.px(theme.nameSize || 22), fontWeight: 'bold', color: theme.nameColor, letterSpacing: theme.nameTracking || 'normal' }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: sz.px(theme.roleSize || 13), color: theme.roleColor, marginTop: '1px' }}>{profile.targetRole}</div>}
                {contact && <div style={{ fontSize: sz.small, color: theme.contactColor, marginTop: '3px' }}>{contact}</div>}
            </div>

            {l.sectionOrder.map((key) => {
                if (hidden.has(key)) return null;
                const content = SECTION_RENDERERS[key]?.(data, ctx);
                if (!content) return null;
                const extra = l.sectionSpacing[key] || 0;
                return (
                    <section key={key} style={{ marginBottom: sz.sectionGap, marginTop: extra ? `${(extra * sz.blankLine).toFixed(1)}px` : 0 }}>
                        {content}
                    </section>
                );
            })}
        </PageWrapper>
    );
};

// ─── Themes ──────────────────────────────────────────────────────────────────

const ruleHeader = ({ color, border, tracking, size = 12, gap }) => (label, sz) => (
    <div style={{
        fontSize: sz.px(size),
        fontWeight: 'bold',
        color,
        borderBottom: border,
        paddingBottom: '2px',
        marginBottom: sz.headerGap,
        marginTop: gap ?? '4px',
        letterSpacing: tracking,
        textTransform: 'uppercase',
    }}>{label}</div>
);

const THEMES = {
    classicBW: {
        fontFamily: 'Calibri, Arial, sans-serif',
        nameColor: '#000000', roleColor: '#333333', contactColor: '#444444',
        body: { color: '#222222' },
        skillLabel: { fontWeight: 'bold' },
        sectionHeader: ruleHeader({ color: '#111111', border: '1px solid #cccccc', tracking: '0.04em' }),
    },
    navySerif: {
        fontFamily: "Georgia, 'Times New Roman', serif",
        nameColor: '#1F4E79', roleColor: '#444444', contactColor: '#555555', roleSize: 12,
        body: { color: '#1a1a1a' },
        skillLabel: { fontWeight: 'bold', color: '#1F4E79' },
        sectionHeader: ruleHeader({ color: '#1F4E79', border: '1.5px solid #1F4E79', tracking: '0.12em' }),
    },
    charcoalCentered: {
        fontFamily: 'Arial, Helvetica, sans-serif',
        headerAlign: 'center', nameSize: 24, nameTracking: '0.04em', roleSize: 12,
        nameColor: '#111111', roleColor: '#3A3A3A', contactColor: '#555555',
        body: { color: '#222222' },
        skillLabel: { fontWeight: 'bold' },
        sectionHeader: ruleHeader({ color: '#3A3A3A', border: '1px solid #3A3A3A', tracking: '0.18em', size: 11.5 }),
    },
    forestFormal: {
        fontFamily: 'Cambria, Georgia, serif',
        nameSize: 21, roleSize: 12, headerGap: 9,
        nameColor: '#000000', roleColor: '#2E5339', contactColor: '#444444',
        body: { color: '#1a1a1a' },
        skillLabel: { fontWeight: 'bold', color: '#2E5339' },
        sectionHeader: ruleHeader({ color: '#2E5339', border: '1.5px solid #2E5339', tracking: '0.06em', size: 11.5, gap: '3px' }),
    },
    minimalModern: {
        fontFamily: "Calibri, 'Helvetica Neue', Arial, sans-serif",
        nameSize: 26, nameTracking: '-0.01em', headerGap: 14,
        nameColor: '#111111', roleColor: '#555555', contactColor: '#666666',
        body: { color: '#1a1a1a' },
        skillLabel: { fontWeight: 'bold' },
        sectionHeader: (label, sz) => (
            <div style={{ marginBottom: sz.headerGap, marginTop: '6px' }}>
                <div style={{ fontSize: sz.px(11.5), fontWeight: 'bold', color: '#111111', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{label}</div>
                <div style={{ height: '1.5px', backgroundColor: '#4A90D9', width: '100%' }} />
            </div>
        ),
    },
};

const makeTemplate = (id) => {
    const Component = (props) => <ResumePage theme={THEMES[id]} {...props} />;
    Component.displayName = `ResumeTemplate_${id}`;
    return Component;
};

export const ClassicBW = makeTemplate('classicBW');
export const NavySerif = makeTemplate('navySerif');
export const CharcoalCentered = makeTemplate('charcoalCentered');
export const ForestFormal = makeTemplate('forestFormal');
export const MinimalModern = makeTemplate('minimalModern');

// ─── Template registry ────────────────────────────────────────────────────────
export const ATS_TEMPLATES = {
    classicBW: {
        id: 'classicBW',
        name: 'Standard Corporate',
        desc: 'Calibri, pure black, thin grey rules. Safest ATS default for all industries.',
        tag: 'All Industries',
        Component: ClassicBW,
    },
    navySerif: {
        id: 'navySerif',
        name: 'Executive Premium',
        desc: 'Georgia, navy blue headings, wider letter-spacing. Great for finance and law.',
        tag: 'Finance & Law',
        Component: NavySerif,
    },
    charcoalCentered: {
        id: 'charcoalCentered',
        name: 'Modern Professional',
        desc: 'Arial, centered header, charcoal accent. Clean and balanced for any role.',
        tag: 'General Purpose',
        Component: CharcoalCentered,
    },
    forestFormal: {
        id: 'forestFormal',
        name: 'Academic Traditional',
        desc: 'Cambria, deep green accent, tight academic spacing. Ideal for research and academia.',
        tag: 'Academic & Research',
        Component: ForestFormal,
    },
    minimalModern: {
        id: 'minimalModern',
        name: 'Tech Minimalist',
        desc: 'Calibri, blue rule lines only, maximum whitespace. Best for tech and design roles.',
        tag: 'Tech & Design',
        Component: MinimalModern,
    },
};
