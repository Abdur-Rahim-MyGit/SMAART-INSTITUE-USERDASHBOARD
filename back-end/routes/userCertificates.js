const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const UserCertificate = require('../models/UserCertificate');
const { protect } = require('../middleware/auth');
const { uploadRegistration } = require('../middleware/upload');

// @desc    Get all certificates for logged in user
// @route   GET /api/user-certificates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const certificates = await UserCertificate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Upload and create a new user certificate
// @route   POST /api/user-certificates
// @access  Private
router.post('/', protect, uploadRegistration.single('file'), async (req, res) => {
  try {
    const { title, issuer, issueDate, expiryDate, verificationUrl, qrCodeIdentifier, category } = req.body;

    if (!req.file && !req.body.certificateUrl) {
      return res.status(400).json({ success: false, message: 'Please upload a certificate file or provide a URL' });
    }

    const certificateUrl = req.file ? req.file.path : req.body.certificateUrl;

    const certificateData = {
      userId: req.user._id,
      title,
      issuer,
      issueDate,
      expiryDate,
      certificateUrl,
      verificationUrl,
      qrCodeIdentifier,
      category
    };

    const certificate = await UserCertificate.create(certificateData);

    res.status(201).json({
      success: true,
      data: certificate
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @desc    Delete a user certificate
// @route   DELETE /api/user-certificates/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const certificate = await UserCertificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Make sure user owns certificate
    if (certificate.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await certificate.deleteOne();

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
