/**
 * emailService.js  (services/)
 * ─────────────────────────────
 * Rich HTML email notifications for SMAART Institute.
 *
 * Design principles:
 *  • Single lazy transporter – created once, reused for all sends.
 *  • Every public function is fire-and-forget safe (errors are logged,
 *    never thrown) so email failures never crash API routes.
 *  • Templates share a common branded wrapper produced by `wrapTemplate()`.
 *  • Emails are disabled in test environments (NODE_ENV === 'test').
 *
 * Supported events
 * ─────────────────
 *   sendWelcomeEmail            – new student account created
 *   sendBadgeEarnedEmail        – badge awarded
 *   sendCourseEnrollmentEmail   – enrolled in a course
 *   sendCourseCompletedEmail    – course 100 % completed
 *   sendCertificateEmail        – certificate issued / ready to download
 *   sendAssessmentResultsEmail  – assessment score available
 *   sendTicketUpdateEmail       – support ticket reply received
 *   sendPasswordChangedEmail    – password was changed (security alert)
 *   sendSystemAnnouncementEmail – admin broadcast to one user
 */

'use strict';

const nodemailer = require('nodemailer');

// ── Constants ─────────────────────────────────────────────────────────────────

const BRAND = {
  name:      'SMAART Institute',
  tagline:   'Empowering Minds, Shaping Futures',
  primary:   '#002147',   // navy
  accent:    '#30919D',   // teal
  light:     '#f0f9ff',
  textDark:  '#1e293b',
  textMid:   '#475569',
  textLight: '#94a3b8',
  border:    '#e2e8f0',
  year:      new Date().getFullYear(),
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5000';

// ── Transporter (lazy singleton) ──────────────────────────────────────────────

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[EmailService] ⚠️  SMTP credentials not set. Emails will be skipped.');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    pool: true,           // keep connections open for bulk sends
    maxConnections: 5,
    rateDelta: 1000,      // 1 send per second max (Gmail free tier safe)
    rateLimit: 1,
  });

  return _transporter;
}

// ── Core send helper ──────────────────────────────────────────────────────────

/**
 * Internal send. Never throws. Returns { success, messageId? }.
 */
async function _send({ to, subject, html, text }) {
  if (process.env.NODE_ENV === 'test') {
    return { success: true, skipped: true };
  }

  const transporter = getTransporter();
  if (!transporter) return { success: false, error: 'No SMTP transporter' };

  try {
    const info = await transporter.sendMail({
      from: `"${BRAND.name}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject, // plain-text fallback
    });
    console.log(`[EmailService] ✅ Sent to ${to} — ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] ❌ Failed to send to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// ── HTML template system ──────────────────────────────────────────────────────

/**
 * Wraps any inner HTML body with the consistent SMAART branded shell.
 * @param {object} opts
 * @param {string} opts.preheader   – Short text shown in email preview pane
 * @param {string} opts.headerTitle – Bold text in the coloured header bar
 * @param {string} opts.headerSub   – Smaller subtitle in the header bar
 * @param {string} opts.body        – Inner content HTML (no wrapper needed)
 * @param {string} [opts.ctaUrl]    – CTA button URL (optional)
 * @param {string} [opts.ctaLabel]  – CTA button label text
 * @param {string} [opts.accentColor] – Override header gradient accent
 */
function wrapTemplate({ preheader, headerTitle, headerSub, body, ctaUrl, ctaLabel, accentColor }) {
  const accent = accentColor || BRAND.accent;
  const cta = ctaUrl && ctaLabel
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${ctaUrl}"
            style="display:inline-block;background:${BRAND.primary};color:#ffffff;
                   font-size:15px;font-weight:600;text-decoration:none;
                   padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
           ${ctaLabel}
         </a>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>${headerTitle} – ${BRAND.name}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">

  <!-- Preview text (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f1f5f9;">
    ${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0"
               style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.primary} 0%,${accent} 100%);
                        padding:36px 40px;text-align:center;">
              <h1 style="margin:0 0 4px 0;color:#ffffff;font-size:26px;font-weight:700;
                          letter-spacing:-0.5px;">${BRAND.name}</h1>
              <p  style="margin:0;color:rgba(255,255,255,0.75);font-size:13px;">${BRAND.tagline}</p>
              ${headerSub
                ? `<p style="margin:18px 0 0 0;color:#ffffff;font-size:20px;font-weight:600;">${headerSub}</p>`
                : ''}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">
              ${headerTitle
                ? `<h2 style="margin:0 0 20px 0;color:${BRAND.textDark};font-size:22px;
                              font-weight:700;line-height:1.3;">${headerTitle}</h2>`
                : ''}
              ${body}
              ${cta}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid ${BRAND.border};
                        text-align:center;">
              <p style="margin:0 0 8px 0;color:${BRAND.textLight};font-size:12px;">
                You received this email because you have an account at ${BRAND.name}.
              </p>
              <p style="margin:0;color:${BRAND.textLight};font-size:12px;">
                © ${BRAND.year} ${BRAND.name}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Shorthand for a standard paragraph */
const p = (text, style = '') =>
  `<p style="margin:0 0 16px 0;color:${BRAND.textMid};font-size:15px;line-height:1.7;${style}">${text}</p>`;

/** Highlighted info box */
const infoBox = (content, color = BRAND.accent) =>
  `<div style="background:${color}15;border-left:4px solid ${color};
               border-radius:4px;padding:16px 20px;margin:20px 0;">
     <p style="margin:0;color:${BRAND.textDark};font-size:15px;line-height:1.6;">${content}</p>
   </div>`;

/** Two-column stat row */
const stat = (label, value, color = BRAND.primary) =>
  `<tr>
     <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};
                color:${BRAND.textMid};font-size:14px;">${label}</td>
     <td style="padding:10px 16px;border-bottom:1px solid ${BRAND.border};
                color:${color};font-size:14px;font-weight:600;text-align:right;">${value}</td>
   </tr>`;

/** Section divider */
const divider = () =>
  `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:28px 0;"/>`;

// ── Public email functions ─────────────────────────────────────────────────────

/**
 * Welcome email sent when a new account is created.
 */
async function sendWelcomeEmail({ to, fullName }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const html = wrapTemplate({
    preheader: `Welcome to ${BRAND.name}, ${firstName}! Your journey starts now.`,
    headerTitle: '',
    headerSub: '🎉 Welcome Aboard!',
    accentColor: '#0ea5e9',
    body: `
      ${p(`Hi <strong>${firstName}</strong>,`)}
      ${p(`We're thrilled to welcome you to <strong>${BRAND.name}</strong> — your gateway to career-transforming learning and personal growth.`)}
      ${infoBox(`Your account is now active. Start by taking the <strong>Baseline Assessment</strong> to unlock your personalised learning path and discover your strengths.`, BRAND.accent)}
      ${p('Here\'s what you can explore right away:')}
      <ul style="margin:0 0 20px 0;padding-left:20px;">
        <li style="margin-bottom:8px;color:${BRAND.textMid};font-size:15px;">📊 <strong>Baseline Assessment</strong> – discover your skill profile</li>
        <li style="margin-bottom:8px;color:${BRAND.textMid};font-size:15px;">📚 <strong>Course Library</strong> – browse curated programmes</li>
        <li style="margin-bottom:8px;color:${BRAND.textMid};font-size:15px;">🏆 <strong>Badges & Achievements</strong> – earn recognition as you learn</li>
        <li style="margin-bottom:8px;color:${BRAND.textMid};font-size:15px;">👥 <strong>Community</strong> – connect with fellow learners</li>
      </ul>
      ${p('If you have any questions, simply reply to this email — we\'re here to help.', `color:${BRAND.textMid};`)}
    `,
    ctaUrl:   `${FRONTEND_URL}/dashboard`,
    ctaLabel: 'Go to My Dashboard →',
  });

  return _send({ to, subject: `Welcome to ${BRAND.name}, ${firstName}! 🎉`, html });
}

/**
 * Badge earned notification.
 */
async function sendBadgeEarnedEmail({ to, fullName, badgeTitle, badgeTier, xpEarned }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const tierColors = { gold: '#F59E0B', silver: '#94A3B8', bronze: '#B45309' };
  const tierColor = tierColors[(badgeTier || '').toLowerCase()] || BRAND.accent;

  const html = wrapTemplate({
    preheader: `You earned the "${badgeTitle}" badge! Keep up the great work.`,
    headerTitle: '',
    headerSub:  '🏆 New Badge Earned!',
    accentColor: tierColor,
    body: `
      ${p(`Congratulations, <strong>${firstName}</strong>!`)}
      ${p('You just unlocked a brand new achievement badge:')}
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:${tierColor}15;border:3px solid ${tierColor};
                    border-radius:50%;width:80px;height:80px;line-height:80px;font-size:36px;">
          🏆
        </div>
        <h3 style="margin:16px 0 4px 0;color:${BRAND.textDark};font-size:20px;">${badgeTitle}</h3>
        ${badgeTier ? `<span style="background:${tierColor};color:#fff;padding:4px 12px;
                              border-radius:20px;font-size:12px;font-weight:700;
                              text-transform:uppercase;letter-spacing:1px;">${badgeTier} Tier</span>` : ''}
        ${xpEarned ? `<p style="margin:12px 0 0 0;color:${BRAND.textMid};font-size:15px;">+${xpEarned} XP earned</p>` : ''}
      </div>
      ${p('Every badge brings you closer to your next level. Keep learning and earn more!')}
    `,
    ctaUrl:   `${FRONTEND_URL}/dashboard`,
    ctaLabel: 'View My Badges →',
  });

  return _send({ to, subject: `🏆 Badge Earned: "${badgeTitle}" – ${BRAND.name}`, html });
}

/**
 * Course completion celebration.
 */
async function sendCourseCompletedEmail({ to, fullName, courseTitle, completionDate }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const html = wrapTemplate({
    preheader: `🎓 Incredible! You completed "${courseTitle}". Your certificate is ready!`,
    headerTitle: '',
    headerSub:  '🎓 Course Completed!',
    accentColor: '#10B981',
    body: `
      ${p(`Fantastic achievement, <strong>${firstName}</strong>!`)}
      ${p(`You have successfully completed <strong>"${courseTitle}"</strong>. This is a significant milestone in your learning journey.`)}
      ${infoBox(`🏅 Your completion certificate has been generated and is ready to download from your dashboard.`, '#10B981')}
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;margin:20px 0;">
        ${stat('Course completed', courseTitle, '#10B981')}
        ${stat('Date', completionDate ? new Date(completionDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), BRAND.textMid)}
      </table>
      ${divider()}
      ${p('What\'s next? Browse our course library to continue growing your skills.', `color:${BRAND.textMid};font-size:14px;`)}
    `,
    ctaUrl:   `${FRONTEND_URL}/dashboard/certificates`,
    ctaLabel: 'Download My Certificate →',
  });

  return _send({ to, subject: `🎓 Course Completed: "${courseTitle}" – ${BRAND.name}`, html });
}

/**
 * Certificate issued / ready to download.
 */
async function sendCertificateEmail({ to, fullName, certificateType, courseName, certificateId }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const html = wrapTemplate({
    preheader: `Your ${certificateType} certificate for "${courseName}" is ready!`,
    headerTitle: '📜 Certificate Ready to Download',
    accentColor: '#8B5CF6',
    body: `
      ${p(`Dear <strong>${firstName}</strong>,`)}
      ${p(`Your <strong>${certificateType}</strong> Certificate for <strong>"${courseName}"</strong> has been officially issued and is now available for download.`)}
      <div style="background:#8B5CF615;border:2px solid #8B5CF6;border-radius:12px;
                  padding:24px;margin:24px 0;text-align:center;">
        <p style="margin:0 0 4px 0;font-size:13px;color:${BRAND.textMid};text-transform:uppercase;
                  letter-spacing:1px;">Certificate of</p>
        <h3 style="margin:0 0 4px 0;font-size:22px;color:#8B5CF6;font-weight:700;">${certificateType}</h3>
        <p style="margin:0 0 12px 0;font-size:16px;color:${BRAND.textDark};">${courseName}</p>
        ${certificateId
          ? `<p style="margin:0;font-size:12px;color:${BRAND.textLight};">Certificate ID: ${certificateId}</p>`
          : ''}
      </div>
      ${p('This certificate is a testament to your dedication and hard work. Share it on LinkedIn or with prospective employers!')}
    `,
    ctaUrl:   `${FRONTEND_URL}/dashboard/certificates`,
    ctaLabel: 'View & Download Certificate →',
  });

  return _send({ to, subject: `📜 Certificate Ready: "${courseName}" – ${BRAND.name}`, html });
}

/**
 * Assessment results available.
 */
async function sendAssessmentResultsEmail({ to, fullName, assessmentName, score, maxScore, resultId }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const percentage = maxScore ? Math.round((score / maxScore) * 100) : null;
  const performanceLabel = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Satisfactory' : 'Needs Improvement';
  const performanceColor = percentage >= 80 ? '#10B981' : percentage >= 60 ? '#3B82F6' : percentage >= 40 ? '#F59E0B' : '#EF4444';

  const html = wrapTemplate({
    preheader: `Your ${assessmentName} results are ready. ${percentage ? `You scored ${percentage}%.` : ''}`,
    headerTitle: '📊 Assessment Results',
    accentColor: BRAND.accent,
    body: `
      ${p(`Hi <strong>${firstName}</strong>,`)}
      ${p(`Your results for <strong>${assessmentName}</strong> are now available.`)}
      ${score !== undefined
        ? `<div style="text-align:center;margin:28px 0;">
             <div style="display:inline-block;width:100px;height:100px;border-radius:50%;
                         background:${performanceColor}15;border:4px solid ${performanceColor};
                         line-height:100px;">
               <span style="font-size:24px;font-weight:700;color:${performanceColor};">
                 ${percentage !== null ? `${percentage}%` : score}
               </span>
             </div>
             <p style="margin:12px 0 4px 0;font-size:18px;font-weight:600;color:${performanceColor};">${performanceLabel}</p>
             ${maxScore ? `<p style="margin:0;font-size:14px;color:${BRAND.textMid};">Score: ${score} / ${maxScore}</p>` : ''}
           </div>`
        : ''}
      ${infoBox('Visit your dashboard to view a detailed breakdown of your performance, question-by-question analysis, and personalised learning recommendations.', BRAND.accent)}
    `,
    ctaUrl:   resultId ? `${FRONTEND_URL}/dashboard/assessment-centre` : `${FRONTEND_URL}/dashboard`,
    ctaLabel: 'View Full Results →',
  });

  return _send({ to, subject: `📊 Results Ready: ${assessmentName} – ${BRAND.name}`, html });
}

/**
 * Support ticket has received a new reply.
 */
async function sendTicketUpdateEmail({ to, fullName, ticketSubject, ticketId, agentName }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const html = wrapTemplate({
    preheader: `${agentName || 'Support'} replied to your ticket: "${ticketSubject}"`,
    headerTitle: '📩 New Reply on Your Support Ticket',
    accentColor: '#6366F1',
    body: `
      ${p(`Hi <strong>${firstName}</strong>,`)}
      ${p(`${agentName ? `<strong>${agentName}</strong> from our support team` : 'Our support team'} has responded to your ticket.`)}
      ${infoBox(`<strong>Ticket:</strong> ${ticketSubject}`, '#6366F1')}
      ${p('Please log in to your dashboard to read the full response and reply back if needed.')}
      ${divider()}
      ${p('If this issue has been resolved, you can close the ticket from the dashboard.', `font-size:14px;color:${BRAND.textLight};`)}
    `,
    ctaUrl:   ticketId ? `${FRONTEND_URL}/dashboard/support` : `${FRONTEND_URL}/dashboard/support`,
    ctaLabel: 'View Ticket →',
  });

  return _send({ to, subject: `📩 Ticket Update: "${ticketSubject}" – ${BRAND.name}`, html });
}

/**
 * Password changed security notification.
 */
async function sendPasswordChangedEmail({ to, fullName, ipAddress, userAgent }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const changedAt = new Date().toLocaleString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  });

  const html = wrapTemplate({
    preheader: 'Your SMAART Institute password was recently changed.',
    headerTitle: '🔒 Password Changed',
    accentColor: '#EF4444',
    body: `
      ${p(`Hi <strong>${firstName}</strong>,`)}
      ${p('Your account password was successfully changed. If you made this change, no further action is required.')}
      <table width="100%" cellpadding="0" cellspacing="0"
             style="border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;margin:20px 0;">
        ${stat('Changed at',  changedAt,              BRAND.textDark)}
        ${ipAddress ? stat('IP Address', ipAddress,  BRAND.textMid) : ''}
        ${userAgent ? stat('Device',     userAgent.substring(0, 60) + (userAgent.length > 60 ? '…' : ''), BRAND.textMid) : ''}
      </table>
      ${infoBox('🚨 <strong>Didn\'t make this change?</strong> Please contact our support team immediately and reset your password.', '#EF4444')}
    `,
    ctaUrl:   `${FRONTEND_URL}/dashboard/support`,
    ctaLabel: 'Contact Support →',
  });

  return _send({ to, subject: `🔒 Password Changed – ${BRAND.name}`, html });
}

/**
 * Admin system announcement to a single user.
 */
async function sendSystemAnnouncementEmail({ to, fullName, title, message, ctaUrl, ctaLabel }) {
  const firstName = (fullName || 'Student').split(' ')[0];
  const html = wrapTemplate({
    preheader: title,
    headerTitle: `📣 ${title}`,
    accentColor: BRAND.primary,
    body: `
      ${p(`Dear <strong>${firstName}</strong>,`)}
      ${infoBox(message)}
      ${p('This is an official announcement from the SMAART Institute team.')}
    `,
    ctaUrl:   ctaUrl  || `${FRONTEND_URL}/dashboard`,
    ctaLabel: ctaLabel || 'Go to Dashboard →',
  });

  return _send({ to, subject: `📣 ${title} – ${BRAND.name}`, html });
}

// ── Lookup helper ──────────────────────────────────────────────────────────────

/**
 * Resolve a userId to an email address.
 * Searches Student → User collections.
 * Returns null if not found.
 */
async function resolveUserEmail(userId) {
  try {
    const Student = require('../models/Student');
    const User    = require('../models/User');
    const doc = await Student.findById(userId).select('email fullName').lean()
             || await User.findById(userId).select('email fullName').lean();
    return doc ? { email: doc.email, fullName: doc.fullName } : null;
  } catch {
    return null;
  }
}

// ── Exports ────────────────────────────────────────────────────────────────────

module.exports = {
  // Core
  resolveUserEmail,
  // Templates
  sendWelcomeEmail,
  sendBadgeEarnedEmail,

  sendCourseCompletedEmail,
  sendCertificateEmail,
  sendAssessmentResultsEmail,
  sendTicketUpdateEmail,
  sendPasswordChangedEmail,
  sendSystemAnnouncementEmail,
};
