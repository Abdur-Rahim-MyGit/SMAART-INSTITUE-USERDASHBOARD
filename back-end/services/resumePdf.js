/**
 * Server-side resume PDF rendering.
 *
 * The web builder exports client-side (html2canvas); mobile has no DOM, so
 * this renders the stored Resume document directly with pdfkit into a clean
 * single-column ATS-friendly layout. Deliberately template-agnostic: the
 * fancy visual templates stay a web-only concern, this is the portable,
 * machine-readable export.
 */
const PDFDocument = require('pdfkit');

const INK = '#111827';
const MUTED = '#6B7280';
const ACCENT = '#1a3884';
const RULE = '#E5E7EB';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

function sectionHeading(doc, title) {
  doc.moveDown(0.9);
  doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(10.5).text(title.toUpperCase(), { characterSpacing: 1 });
  const y = doc.y + 2;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.width - doc.page.margins.right, y).lineWidth(0.7).strokeColor(RULE).stroke();
  doc.moveDown(0.4);
}

function entry(doc, primary, secondary, meta, description) {
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(10.5).text(primary, { continued: !!meta });
  if (meta) {
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED).text(meta, { align: 'right' });
  }
  if (secondary) {
    doc.fillColor(MUTED).font('Helvetica-Oblique').fontSize(9.5).text(secondary);
  }
  if (description) {
    doc.moveDown(0.15);
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(description, { lineGap: 1.5 });
  }
  doc.moveDown(0.5);
}

/**
 * Render a Resume mongoose document (or plain object) to a PDF Buffer.
 * `verification` is optional: { resumePublicId, verificationUrl } — printed in
 * the footer so recruiters can check authenticity against /api/resumes/verify.
 */
function renderResumePdf(resume, verification = null) {
  return new Promise((resolve, reject) => {
    const r = resume.toObject ? resume.toObject() : resume;
    const doc = new PDFDocument({ size: 'A4', margins: { top: 46, bottom: 46, left: 50, right: 50 } });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const p = r.personalInfo || {};

    // ── Header ──
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(20).text(clean(p.fullName) || 'Resume');
    if (clean(p.targetRole)) {
      doc.fillColor(ACCENT).font('Helvetica').fontSize(11).text(clean(p.targetRole));
    }
    const contact = [clean(p.email), clean(p.mobile), clean(p.location)].filter(Boolean).join('  ·  ');
    if (contact) {
      doc.moveDown(0.2);
      doc.fillColor(MUTED).font('Helvetica').fontSize(9).text(contact);
    }
    const links = [clean(p.linkedinUrl), clean(p.githubUrl), clean(p.portfolioUrl)].filter(Boolean).join('  ·  ');
    if (links) doc.fillColor(MUTED).fontSize(9).text(links);

    // ── Summary ──
    if (clean(r.summary)) {
      sectionHeading(doc, 'Summary');
      doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(clean(r.summary), { lineGap: 1.5 });
    }

    // ── Experience ──
    const experience = (r.experience || []).filter((e) => clean(e.role) || clean(e.company));
    if (experience.length) {
      sectionHeading(doc, 'Experience');
      experience.forEach((e) =>
        entry(
          doc,
          clean(e.role) || clean(e.company),
          [clean(e.company), clean(e.location)].filter(Boolean).join(' — '),
          clean(e.duration),
          clean(e.description)
        )
      );
    }

    // ── Education ──
    const education = (r.education || []).filter((e) => clean(e.degree) || clean(e.institution));
    if (education.length) {
      sectionHeading(doc, 'Education');
      education.forEach((e) =>
        entry(
          doc,
          clean(e.degree) || clean(e.institution),
          [clean(e.institution), clean(e.location), clean(e.grade) && `Grade: ${clean(e.grade)}`]
            .filter(Boolean)
            .join(' — '),
          clean(e.year),
          ''
        )
      );
    }

    // ── Skills ──
    const s = r.skills || {};
    const skillRows = [
      ['Technical', s.technical],
      ['Domain', s.domain],
      ['AI Tools', s.ai],
      ['Soft Skills', s.soft],
      ['Languages', s.languages],
    ].filter(([, v]) => clean(v));
    if (skillRows.length) {
      sectionHeading(doc, 'Skills');
      skillRows.forEach(([label, v]) => {
        doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(`${label}: `, { continued: true });
        doc.font('Helvetica').text(clean(v), { lineGap: 1.5 });
        doc.moveDown(0.15);
      });
    }

    // ── Projects ──
    const projects = (r.projects || []).filter((x) => clean(x.title));
    if (projects.length) {
      sectionHeading(doc, 'Projects');
      projects.forEach((x) => entry(doc, clean(x.title), clean(x.link), '', clean(x.description)));
    }

    // ── Achievements ──
    const achievements = (r.achievements || []).filter((x) => clean(x.title));
    if (achievements.length) {
      sectionHeading(doc, 'Achievements');
      achievements.forEach((x) => entry(doc, clean(x.title), clean(x.link), '', clean(x.description)));
    }

    // ── Verification footer ──
    if (verification?.resumePublicId) {
      doc.moveDown(1);
      doc.fillColor(MUTED).font('Helvetica').fontSize(7.5).text(
        `Verified SMAART resume · ID ${verification.resumePublicId}` +
          (verification.verificationUrl ? ` · ${verification.verificationUrl}` : ''),
        { lineGap: 1 }
      );
    }

    doc.end();
  });
}

module.exports = { renderResumePdf };
