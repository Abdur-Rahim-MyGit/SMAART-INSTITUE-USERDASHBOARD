const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { generalLimiter } = require('../middleware/rateLimiter');
const EmployerLead = require('../models/EmployerLead');

router.use(generalLimiter);

// SECURITY: escape user input before it goes into an HTML email body, same
// reasoning as routes/contact.js — otherwise this is an HTML/link injection
// vector into the admin notification email.
const escapeHtml = (v) =>
  String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

let _transporter = null;
const getTransporter = () => {
  if (_transporter) return _transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transporter;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/employer-registration — public, self-serve employer inquiry.
// Standalone from the admin project's employer portal: this always works,
// even when that separate app isn't running, because the record lives here.
router.post('/', async (req, res) => {
  try {
    const {
      companyName, contactName, designation, email, phone,
      website, industry, companySize, city, message,
    } = req.body;

    if (!companyName || !contactName || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Company name, contact name, email, and phone are required.',
      });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }

    const lead = await EmployerLead.create({
      companyName, contactName, designation, email, phone,
      website, industry, companySize, city, message,
    });

    const transporter = getTransporter();
    if (transporter) {
      const notifyTo = process.env.EMPLOYER_NOTIFY_EMAIL || process.env.SMTP_USER;
      transporter.sendMail({
        from: `"SMAART Institute" <${process.env.SMTP_USER}>`,
        to: notifyTo,
        subject: `New employer registration: ${escapeHtml(companyName)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #002147;">New Employer Registration</h2>
            <p><strong>Company:</strong> ${escapeHtml(companyName)}</p>
            <p><strong>Contact:</strong> ${escapeHtml(contactName)} ${designation ? `(${escapeHtml(designation)})` : ''}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
            ${website ? `<p><strong>Website:</strong> ${escapeHtml(website)}</p>` : ''}
            ${industry ? `<p><strong>Industry:</strong> ${escapeHtml(industry)}</p>` : ''}
            ${companySize ? `<p><strong>Company size:</strong> ${escapeHtml(companySize)}</p>` : ''}
            ${city ? `<p><strong>City:</strong> ${escapeHtml(city)}</p>` : ''}
            ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message)}</p>` : ''}
          </div>
        `,
      }).then(() => {
        lead.notifiedAt = new Date();
        lead.save().catch(() => {});
      }).catch((err) => {
        console.error('[EmployerRegistration] Notification email failed:', err.message);
      });
    } else {
      console.warn('[EmployerRegistration] SMTP not configured — lead saved without a notification email:', lead._id);
    }

    return res.status(201).json({
      success: true,
      message: "Thanks for registering! Our team will reach out to you shortly.",
    });
  } catch (err) {
    console.error('[EmployerRegistration] Failed:', err);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;
