const express = require('express');
const router = express.Router();
const axios = require('axios');
const { generalLimiter } = require('../middleware/rateLimiter');
const EmployerLead = require('../models/EmployerLead');

router.use(generalLimiter);

// The separate admin project's own backend, where the real employer review
// queue (the Recruiter collection, status Pending/In review) lives. Its
// docker-compose.yml publishes the backend on host port 5001 with no
// container_name and no shared network with this project, so from inside
// THIS backend's own container the only reliable path to it is via Docker
// Desktop's host gateway. Override with ADMIN_API_URL if the two projects
// are ever put on a shared Docker network with a real service hostname.
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://host.docker.internal:5001';
const FORWARD_TIMEOUT_MS = 8000;

const EMAIL_RE = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// POST /api/employer-registration — public self-serve employer registration.
// Forwards to the admin project's real POST /api/auth/employer/register so a
// submission lands in the SAME Recruiter review queue an admin-app
// registration would, whether or not the admin app's frontend is running. If
// the admin BACKEND itself can't be reached, the submission is saved here
// instead so it is never lost, and can be replayed manually later.
router.post('/', async (req, res) => {
  try {
    const {
      companyName, fullName, designation, branch, email, mobile,
      country, gstin, cin, identifier, sourceType, termsAccepted,
    } = req.body;

    if (!companyName || !fullName || !designation || !branch || !email || !mobile) {
      return res.status(400).json({
        success: false,
        error: 'Company name, contact name, designation, branch, email, and mobile are required.',
      });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email format.' });
    }
    if (!/^\d{10}$/.test(mobile)) {
      return res.status(400).json({ success: false, error: 'Mobile number must be 10 digits.' });
    }
    if (!termsAccepted?.hiringTerms || !termsAccepted?.fairHiring || !termsAccepted?.dataProcessing) {
      return res.status(400).json({ success: false, error: 'All terms must be accepted to register.' });
    }

    const payload = {
      companyName, fullName, designation, branch, email, mobile,
      country: country || 'India', gstin, cin, identifier,
      sourceType: sourceType || 'SMAART_NETWORK', termsAccepted,
    };

    try {
      const adminResponse = await axios.post(`${ADMIN_API_URL}/api/auth/employer/register`, payload, {
        timeout: FORWARD_TIMEOUT_MS,
      });
      return res.status(adminResponse.status).json(adminResponse.data);
    } catch (forwardErr) {
      // The admin backend rejected the submission on its own terms (bad
      // GSTIN format, duplicate email, etc.) — that is a real validation
      // failure, not an outage, so relay it as-is rather than silently
      // falling back to a local save the admin would never see anyway.
      if (forwardErr.response) {
        return res.status(forwardErr.response.status).json(forwardErr.response.data);
      }

      // The admin backend itself is unreachable (down, wrong host, etc.).
      // Never lose the submission: save it here for manual follow-up.
      console.warn('[EmployerRegistration] Admin backend unreachable, saving fallback record:', forwardErr.message);
      await EmployerLead.create({
        ...payload,
        forwardedToAdmin: false,
        forwardError: forwardErr.message,
      });

      return res.status(201).json({
        success: true,
        message: 'Registration submitted successfully. Your account is under review.',
      });
    }
  } catch (err) {
    console.error('[EmployerRegistration] Failed:', err);
    return res.status(500).json({ success: false, error: 'Something went wrong. Please try again later.' });
  }
});

module.exports = router;
