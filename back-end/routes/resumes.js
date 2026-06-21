const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const ResumeVerification = require('../models/ResumeVerification');
const { protect } = require('../middleware/auth');
const { resumeExportLimiter } = require('../middleware/rateLimiter');
const {
  ORG_NAME,
  normalizeText,
  buildResumeFingerprint,
  createResumePublicId,
  buildVerificationPath,
} = require('../utils/resumeSecurity');

const getClientIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.ip ||
  req.connection?.remoteAddress ||
  '';

const buildVerificationPayload = (record, fingerprint, req) => {
  const origin =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    `${req.protocol}://${req.get('host')}`;

  return {
    resumePublicId: record.resumePublicId,
    fingerprint: record.fingerprint,
    verified: !fingerprint || record.fingerprint === fingerprint,
    holderName: record.holderName,
    targetRole: record.targetRole,
    email: record.email,
    organization: record.organization || ORG_NAME,
    status: record.status,
    issuedAt: record.issuedAt,
    exportCount: record.exportHistory?.length || 0,
    verificationPath: buildVerificationPath(record.resumePublicId, record.fingerprint),
    verificationUrl: `${origin.replace(/\/$/, '')}${buildVerificationPath(
      record.resumePublicId,
      record.fingerprint
    )}`,
  };
};

// @desc    Public resume verification (QR / resume ID)
// @route   GET /api/resumes/verify/:resumePublicId
// @access  Public
router.get('/verify/:resumePublicId', async (req, res) => {
  try {
    const resumePublicId = decodeURIComponent(req.params.resumePublicId || '').trim();
    const fingerprint = (req.query.h || '').trim().toUpperCase();

    if (!resumePublicId) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Resume ID is required',
      });
    }

    const record = await ResumeVerification.findOne({
      resumePublicId,
      status: { $ne: 'revoked' },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: 'Resume verification record not found',
      });
    }

    const payload = buildVerificationPayload(record, fingerprint, req);

    if (fingerprint && record.fingerprint !== fingerprint) {
      return res.status(409).json({
        success: false,
        verified: false,
        message: 'Resume ID found but content fingerprint does not match',
        data: {
          resumePublicId: record.resumePublicId,
          organization: record.organization,
        },
      });
    }

    res.json({
      success: true,
      verified: true,
      message: 'Verified SMAART Institute resume',
      data: payload,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Issue / register secure export (rate limited, anti-duplicate per user)
// @route   POST /api/resumes/:id/export
// @access  Private
router.post('/:id/export', protect, resumeExportLimiter, async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const fingerprint = buildResumeFingerprint(resume.toObject());
    const holderName =
      normalizeText(resume.personalInfo?.fullName) || 'Unnamed Resume';
    const targetRole = normalizeText(resume.personalInfo?.targetRole);
    const email = normalizeText(resume.personalInfo?.email);

    let record = await ResumeVerification.findOne({
      userId: req.user._id,
      fingerprint,
    });

    if (!record) {
      let resumePublicId = createResumePublicId(fingerprint);
      let attempts = 0;
      while (attempts < 5) {
        const exists = await ResumeVerification.findOne({ resumePublicId });
        if (!exists) break;
        resumePublicId = createResumePublicId(fingerprint);
        attempts += 1;
      }

      record = await ResumeVerification.create({
        resumePublicId,
        fingerprint,
        userId: req.user._id,
        resumeId: resume._id,
        holderName,
        targetRole,
        email,
        organization: ORG_NAME,
        status: 'issued',
        issuedAt: new Date(),
        exportHistory: [{ exportedAt: new Date(), ip: getClientIp(req) }],
      });
    } else {
      record.holderName = holderName;
      record.targetRole = targetRole;
      record.email = email;
      record.resumeId = resume._id;
      record.status = 'issued';
      record.exportHistory.push({ exportedAt: new Date(), ip: getClientIp(req) });
      await record.save();
    }

    resume.verification = {
      resumePublicId: record.resumePublicId,
      fingerprint: record.fingerprint,
      lastExportedAt: new Date(),
    };
    await resume.save();

    res.json({
      success: true,
      message: 'Resume export authorized',
      data: buildVerificationPayload(record, fingerprint, req),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate resume verification record',
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all user resumes
// @route   GET /api/resumes
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: resumes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    if (req.params.id === 'verify') {
      return res.status(400).json({ success: false, message: 'Invalid resume id' });
    }

    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create resume
// @route   POST /api/resumes
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const newResume = await Resume.create({
      ...req.body,
      userId: req.user._id,
    });
    res.status(201).json({ success: true, data: newResume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update resume
// @route   PUT /api/resumes/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    // SECURITY: never let the body reassign ownership or the document id. Without
    // this, a user could PUT {"userId":"<victim>"} and hand their resume to (or
    // overwrite under) another account.
    const { userId, _id, ...updatable } = req.body || {};
    resume = await Resume.findByIdAndUpdate(req.params.id, updatable, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    await Resume.deleteOne({ _id: req.params.id });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Duplicate a resume (creates a copy for the same user)
// @route   POST /api/resumes/:id/duplicate
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const original = await Resume.findOne({ _id: req.params.id, userId: req.user._id });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    const copy = original.toObject();
    delete copy._id;
    delete copy.createdAt;
    delete copy.updatedAt;
    delete copy.verification; // fresh copy has no export history

    copy.versionName = `${original.versionName || 'My Resume'} (Copy)`;
    copy.atsScore    = original.atsScore || 0;
    copy.targetRole  = original.targetRole || '';
    copy.userId      = req.user._id;

    const newResume = await Resume.create(copy);
    res.status(201).json({ success: true, data: newResume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

