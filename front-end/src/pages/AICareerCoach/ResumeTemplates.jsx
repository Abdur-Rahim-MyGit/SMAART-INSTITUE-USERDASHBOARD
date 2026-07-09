/**
 * SMAARTHire — 5 ATS-Safe Resume Templates
 * All templates accept the same `data` prop (mapped from ResumeBuilder resumeData).
 * Pure inline styles only — no Tailwind, guaranteed ATS-safe fonts, single-column.
 */

// ─── Shared utility ──────────────────────────────────────────────────────────

/** Drop any field that is blank / empty array. Returns clean string or null. */
export const clean = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'string') return val.trim() || null;
    if (Array.isArray(val)) return val.length > 0 ? val : null;
    return val;
};

/** Join contact fields with separator, skipping empty ones. */
const contactRow = (fields, sep = ' | ') =>
    fields.filter(Boolean).join(sep);

/** Render bullet lines from a description string (newline or period-split). */
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

/** Skills section — three labeled lines, no badges, no tables. */
const SkillsLines = ({ skills, labelStyle, textStyle }) => {
    const rows = [
        { label: 'Technical Skills', val: clean(skills?.technical) },
        { label: 'Soft Skills', val: clean(skills?.soft) },
        { label: 'Languages', val: clean(skills?.languages) },
    ].filter(r => r.val);
    if (rows.length === 0) return null;
    return (
        <>
            {rows.map(r => (
                <p key={r.label} style={{ margin: '3px 0', ...textStyle }}>
                    <strong style={labelStyle}>{r.label}: </strong>{r.val}
                </p>
            ))}
        </>
    );
};

// ─── Data adapter (maps ResumeBuilder resumeData → template schema) ───────────
export const adaptData = (resumeData) => ({
    profile: {
        fullName: resumeData?.personalInfo?.fullName || '',
        targetRole: resumeData?.personalInfo?.targetRole || '',
        email: resumeData?.personalInfo?.email || '',
        mobile: resumeData?.personalInfo?.mobile || '',
        location: resumeData?.personalInfo?.location || '',
        linkedinUrl: resumeData?.personalInfo?.linkedinUrl || '',
        portfolioOrGithubUrl: resumeData?.personalInfo?.githubUrl || resumeData?.personalInfo?.portfolioUrl || '',
        professionalSummary: resumeData?.summary || '',
    },
    education: (resumeData?.education || []).map(e => ({
        institutionName: e.institution || '',
        degree: e.degree || '',
        yearOfPassing: e.year || '',
        grade: e.grade || '',
        location: e.location || '',
    })),
    experience: (resumeData?.experience || []).map(e => ({
        company: e.company || '',
        jobRole: e.role || '',
        duration: e.duration || '',
        location: e.location || '',
        description: e.description || '',
    })),
    projects: (resumeData?.projects || []).map(p => ({
        projectTitle: p.title || '',
        projectLink: p.link || '',
        description: p.description || '',
    })),
    skills: {
        technical: Array.isArray(resumeData?.skills?.technical)
            ? resumeData.skills.technical.join(', ')
            : resumeData?.skills?.technical || '',
        soft: Array.isArray(resumeData?.skills?.soft)
            ? resumeData.skills.soft.join(', ')
            : resumeData?.skills?.soft || '',
        languages: Array.isArray(resumeData?.skills?.languages)
            ? resumeData.skills.languages.join(', ')
            : resumeData?.skills?.languages || '',
    },
    awards: (resumeData?.achievements || []).map(a => ({
        achievementTitle: a.title || '',
        link: a.link || '',
        description: a.description || '',
    })),
    extracurricular: '',
});

// Page wrapper used by all templates
const PageWrapper = ({ children, fontFamily, watermark, footer }) => (
    <div
        id="resume-preview"
        style={{
            width: '210mm',
            minHeight: '297mm',
            backgroundColor: '#ffffff',
            fontFamily,
            fontSize: '11px',
            lineHeight: '1.45',
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

// ─── Shared section body ──────────────────────────────────────────────────────

const ExperienceSection = ({ experience, sectionHeader, bodyStyle }) => {
    if (!experience || experience.length === 0) return null;
    return (
        <section style={{ marginBottom: '12px' }}>
            {sectionHeader('EXPERIENCE / INTERNSHIP')}
            {experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '11px' }}>{exp.jobRole}{exp.company ? ` — ${exp.company}` : ''}</strong>
                        <span style={{ fontSize: '10px', ...bodyStyle }}>{exp.duration}</span>
                    </div>
                    {clean(exp.location) && <div style={{ fontSize: '10px', ...bodyStyle }}>Location: {exp.location}</div>}
                    <BulletLines text={exp.description} style={{ fontSize: '10.5px', ...bodyStyle }} />
                </div>
            ))}
        </section>
    );
};

const ProjectsSection = ({ projects, sectionHeader, bodyStyle }) => {
    if (!projects || projects.length === 0) return null;
    return (
        <section style={{ marginBottom: '12px' }}>
            {sectionHeader('PROJECTS')}
            {projects.map((p, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '11px' }}>{p.projectTitle}</strong>
                        {clean(p.projectLink) && <span style={{ fontSize: '10px', ...bodyStyle }}>{p.projectLink}</span>}
                    </div>
                    <BulletLines text={p.description} style={{ fontSize: '10.5px', ...bodyStyle }} />
                </div>
            ))}
        </section>
    );
};

const EducationSection = ({ education, sectionHeader, bodyStyle }) => {
    if (!education || education.length === 0) return null;
    return (
        <section style={{ marginBottom: '12px' }}>
            {sectionHeader('EDUCATION')}
            {education.map((edu, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                        <strong style={{ fontSize: '11px' }}>{edu.degree}{edu.institutionName ? ` — ${edu.institutionName}` : ''}</strong>
                        <div style={{ fontSize: '10.5px', ...bodyStyle }}>
                            {[clean(edu.grade) && `Grade/CGPA: ${edu.grade}`, clean(edu.location) && `Location: ${edu.location}`].filter(Boolean).join(' | ')}
                        </div>
                    </div>
                    <div style={{ fontSize: '10.5px', textAlign: 'right', ...bodyStyle }}>{edu.yearOfPassing}</div>
                </div>
            ))}
        </section>
    );
};

const AwardsSection = ({ awards, extracurricular, sectionHeader, bodyStyle }) => {
    if ((!awards || awards.length === 0) && !clean(extracurricular)) return null;
    return (
        <section style={{ marginBottom: '12px' }}>
            {sectionHeader('AWARDS & ACHIEVEMENTS')}
            {awards.map((a, i) => (
                <div key={i} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: '11px' }}>{a.achievementTitle}</strong>
                        {clean(a.link) && <span style={{ fontSize: '10px', ...bodyStyle }}>{a.link}</span>}
                    </div>
                    {clean(a.description) && <div style={{ fontSize: '10.5px', ...bodyStyle }}>{a.description}</div>}
                </div>
            ))}
            {clean(extracurricular) && (
                <div style={{ marginTop: '4px' }}>
                    <strong style={{ fontSize: '11px' }}>Extracurricular Activity</strong>
                    <div style={{ fontSize: '10.5px', ...bodyStyle }}>{extracurricular}</div>
                </div>
            )}
        </section>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 1 — Classic B&W
// Calibri, pure black, left-aligned header, thin grey rules under section headers
// ══════════════════════════════════════════════════════════════════════════════
export const ClassicBW = ({ data, watermark, footer }) => {
    const { profile, education, experience, projects, skills, awards, extracurricular } = data;
    const accent = '#111111';
    const body = { color: '#222222' };

    const sectionHeader = (label) => (
        <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: accent,
            borderBottom: '1px solid #cccccc',
            paddingBottom: '2px',
            marginBottom: '6px',
            marginTop: '4px',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
        }}>{label}</div>
    );

    const contact = contactRow([
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ]);

    return (
        <PageWrapper fontFamily="Calibri, Arial, sans-serif" watermark={watermark} footer={footer}>
            {/* Header */}
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#000000' }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: '13px', color: '#333333' }}>{profile.targetRole}</div>}
                {contact && <div style={{ fontSize: '10.5px', color: '#444444', marginTop: '3px' }}>{contact}</div>}
            </div>

            {/* Summary */}
            {clean(profile.professionalSummary) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('PROFESSIONAL SUMMARY')}
                    <p style={{ margin: 0, fontSize: '10.5px', ...body }}>{profile.professionalSummary}</p>
                </section>
            )}

            <EducationSection education={education} sectionHeader={sectionHeader} bodyStyle={body} />
            <ExperienceSection experience={experience} sectionHeader={sectionHeader} bodyStyle={body} />
            <ProjectsSection projects={projects} sectionHeader={sectionHeader} bodyStyle={body} />

            {/* Skills */}
            {(clean(skills?.technical) || clean(skills?.soft) || clean(skills?.languages)) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('SKILLS')}
                    <SkillsLines skills={skills} labelStyle={{ fontWeight: 'bold' }} textStyle={{ fontSize: '10.5px', ...body }} />
                </section>
            )}

            <AwardsSection awards={awards} extracurricular={extracurricular} sectionHeader={sectionHeader} bodyStyle={body} />
        </PageWrapper>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 2 — Navy Serif
// Georgia, navy #1F4E79 headings & name, left-aligned, wider letter-spacing
// ══════════════════════════════════════════════════════════════════════════════
export const NavySerif = ({ data, watermark, footer }) => {
    const { profile, education, experience, projects, skills, awards, extracurricular } = data;
    const navy = '#1F4E79';
    const body = { color: '#1a1a1a' };

    const sectionHeader = (label) => (
        <div style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: navy,
            borderBottom: `1.5px solid ${navy}`,
            paddingBottom: '2px',
            marginBottom: '7px',
            marginTop: '4px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
        }}>{label}</div>
    );

    const contact = contactRow([
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ]);

    return (
        <PageWrapper fontFamily="Georgia, 'Times New Roman', serif" watermark={watermark} footer={footer}>
            <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: navy }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: '12px', color: '#444444' }}>{profile.targetRole}</div>}
                {contact && <div style={{ fontSize: '10px', color: '#555555', marginTop: '3px' }}>{contact}</div>}
            </div>

            {clean(profile.professionalSummary) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('PROFESSIONAL SUMMARY')}
                    <p style={{ margin: 0, fontSize: '10.5px', ...body }}>{profile.professionalSummary}</p>
                </section>
            )}

            <EducationSection education={education} sectionHeader={sectionHeader} bodyStyle={body} />
            <ExperienceSection experience={experience} sectionHeader={sectionHeader} bodyStyle={body} />
            <ProjectsSection projects={projects} sectionHeader={sectionHeader} bodyStyle={body} />

            {(clean(skills?.technical) || clean(skills?.soft) || clean(skills?.languages)) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('SKILLS')}
                    <SkillsLines skills={skills} labelStyle={{ fontWeight: 'bold', color: navy }} textStyle={{ fontSize: '10.5px', ...body }} />
                </section>
            )}

            <AwardsSection awards={awards} extracurricular={extracurricular} sectionHeader={sectionHeader} bodyStyle={body} />
        </PageWrapper>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 3 — Charcoal Centered
// Arial, centered header, charcoal #3A3A3A accent, wide-tracked uppercase headings
// ══════════════════════════════════════════════════════════════════════════════
export const CharcoalCentered = ({ data, watermark, footer }) => {
    const { profile, education, experience, projects, skills, awards, extracurricular } = data;
    const charcoal = '#3A3A3A';
    const body = { color: '#222222' };

    const sectionHeader = (label) => (
        <div style={{
            fontSize: '11.5px',
            fontWeight: 'bold',
            color: charcoal,
            borderBottom: `1px solid ${charcoal}`,
            paddingBottom: '2px',
            marginBottom: '6px',
            marginTop: '4px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
        }}>{label}</div>
    );

    const contactParts = [
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ].filter(Boolean);

    return (
        <PageWrapper fontFamily="Arial, Helvetica, sans-serif" watermark={watermark} footer={footer}>
            {/* Centered header block */}
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111111', letterSpacing: '0.04em' }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: '12px', color: charcoal, marginTop: '2px' }}>{profile.targetRole}</div>}
                {contactParts.length > 0 && (
                    <div style={{ fontSize: '10px', color: '#555555', marginTop: '3px' }}>
                        {contactParts.join(' | ')}
                    </div>
                )}
            </div>

            {clean(profile.professionalSummary) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('PROFESSIONAL SUMMARY')}
                    <p style={{ margin: 0, fontSize: '10.5px', ...body }}>{profile.professionalSummary}</p>
                </section>
            )}

            <EducationSection education={education} sectionHeader={sectionHeader} bodyStyle={body} />
            <ExperienceSection experience={experience} sectionHeader={sectionHeader} bodyStyle={body} />
            <ProjectsSection projects={projects} sectionHeader={sectionHeader} bodyStyle={body} />

            {(clean(skills?.technical) || clean(skills?.soft) || clean(skills?.languages)) && (
                <section style={{ marginBottom: '12px' }}>
                    {sectionHeader('SKILLS')}
                    <SkillsLines skills={skills} labelStyle={{ fontWeight: 'bold' }} textStyle={{ fontSize: '10.5px', ...body }} />
                </section>
            )}

            <AwardsSection awards={awards} extracurricular={extracurricular} sectionHeader={sectionHeader} bodyStyle={body} />
        </PageWrapper>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 4 — Forest Formal
// Cambria, deep green #2E5339 accent, left-aligned, traditional/academic, tighter spacing
// ══════════════════════════════════════════════════════════════════════════════
export const ForestFormal = ({ data, watermark, footer }) => {
    const { profile, education, experience, projects, skills, awards, extracurricular } = data;
    const green = '#2E5339';
    const body = { color: '#1a1a1a', lineHeight: '1.4' };

    const sectionHeader = (label) => (
        <div style={{
            fontSize: '11.5px',
            fontWeight: 'bold',
            color: green,
            borderBottom: `1.5px solid ${green}`,
            paddingBottom: '1px',
            marginBottom: '5px',
            marginTop: '3px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
        }}>{label}</div>
    );

    const contact = contactRow([
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ]);

    return (
        <PageWrapper fontFamily="Cambria, Georgia, serif" watermark={watermark} footer={footer}>
            <div style={{ marginBottom: '9px' }}>
                <div style={{ fontSize: '21px', fontWeight: 'bold', color: '#000000' }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: '12px', color: green, marginTop: '1px' }}>{profile.targetRole}</div>}
                {contact && <div style={{ fontSize: '10px', color: '#444444', marginTop: '2px' }}>{contact}</div>}
            </div>

            {clean(profile.professionalSummary) && (
                <section style={{ marginBottom: '10px' }}>
                    {sectionHeader('PROFESSIONAL SUMMARY')}
                    <p style={{ margin: 0, fontSize: '10.5px', ...body }}>{profile.professionalSummary}</p>
                </section>
            )}

            <EducationSection education={education} sectionHeader={sectionHeader} bodyStyle={body} />
            <ExperienceSection experience={experience} sectionHeader={sectionHeader} bodyStyle={body} />
            <ProjectsSection projects={projects} sectionHeader={sectionHeader} bodyStyle={body} />

            {(clean(skills?.technical) || clean(skills?.soft) || clean(skills?.languages)) && (
                <section style={{ marginBottom: '10px' }}>
                    {sectionHeader('SKILLS')}
                    <SkillsLines skills={skills} labelStyle={{ fontWeight: 'bold', color: green }} textStyle={{ fontSize: '10.5px', ...body }} />
                </section>
            )}

            <AwardsSection awards={awards} extracurricular={extracurricular} sectionHeader={sectionHeader} bodyStyle={body} />
        </PageWrapper>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATE 5 — Minimal Modern
// Calibri, thin accent-colored rule per section (no color on heading text), most whitespace
// ══════════════════════════════════════════════════════════════════════════════
export const MinimalModern = ({ data, watermark, footer }) => {
    const { profile, education, experience, projects, skills, awards, extracurricular } = data;
    const ruleColor = '#4A90D9';
    const body = { color: '#1a1a1a', lineHeight: '1.5' };

    const sectionHeader = (label) => (
        <div style={{ marginBottom: '8px', marginTop: '6px' }}>
            <div style={{
                fontSize: '11.5px',
                fontWeight: 'bold',
                color: '#111111',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '3px',
            }}>{label}</div>
            <div style={{ height: '1.5px', backgroundColor: ruleColor, width: '100%' }} />
        </div>
    );

    const contact = contactRow([
        clean(profile.location),
        clean(profile.mobile),
        clean(profile.email),
        clean(profile.linkedinUrl),
        clean(profile.portfolioOrGithubUrl),
    ]);

    return (
        <PageWrapper fontFamily="Calibri, 'Helvetica Neue', Arial, sans-serif" watermark={watermark} footer={footer}>
            <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#111111', letterSpacing: '-0.01em' }}>{profile.fullName}</div>
                {clean(profile.targetRole) && <div style={{ fontSize: '13px', color: '#555555', marginTop: '2px', fontWeight: '400' }}>{profile.targetRole}</div>}
                {contact && <div style={{ fontSize: '10px', color: '#666666', marginTop: '4px' }}>{contact}</div>}
            </div>

            {clean(profile.professionalSummary) && (
                <section style={{ marginBottom: '14px' }}>
                    {sectionHeader('PROFESSIONAL SUMMARY')}
                    <p style={{ margin: 0, fontSize: '10.5px', ...body }}>{profile.professionalSummary}</p>
                </section>
            )}

            <EducationSection education={education} sectionHeader={sectionHeader} bodyStyle={body} />
            <ExperienceSection experience={experience} sectionHeader={sectionHeader} bodyStyle={body} />
            <ProjectsSection projects={projects} sectionHeader={sectionHeader} bodyStyle={body} />

            {(clean(skills?.technical) || clean(skills?.soft) || clean(skills?.languages)) && (
                <section style={{ marginBottom: '14px' }}>
                    {sectionHeader('SKILLS')}
                    <SkillsLines skills={skills} labelStyle={{ fontWeight: 'bold' }} textStyle={{ fontSize: '10.5px', ...body }} />
                </section>
            )}

            <AwardsSection awards={awards} extracurricular={extracurricular} sectionHeader={sectionHeader} bodyStyle={body} />
        </PageWrapper>
    );
};

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
