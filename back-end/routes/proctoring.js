const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const proctoringController = require('../controllers/proctoringController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/proctoring');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for proctoring webcam screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'proctor-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  }
});

// Webhook for admin backend to trigger unlock (public — guarded by a shared secret).
// If PROCTORING_WEBHOOK_SECRET is configured, the caller must send it in the
// `x-webhook-secret` header; otherwise we warn and allow (backward compatible).
const verifyWebhookSecret = (req, res, next) => {
  const secret = process.env.PROCTORING_WEBHOOK_SECRET;
  if (secret) {
    if (req.headers['x-webhook-secret'] !== secret) {
      return res.status(403).json({ success: false, error: 'Invalid webhook secret' });
    }
  } else {
    console.warn('⚠️ PROCTORING_WEBHOOK_SECRET not set — /proctoring/webhook/unlock is unauthenticated.');
  }
  next();
};
router.post('/webhook/unlock', verifyWebhookSecret, proctoringController.webhookUnlock);

// Protect all routes
router.use(protect);

router.post('/session/start', proctoringController.startSession);
router.post('/session/:sessionId/event', proctoringController.logEvent);
router.post('/session/:sessionId/complete', proctoringController.completeSession);
router.post('/session/:sessionId/lock', proctoringController.triggerLock);
router.post('/session/:sessionId/upload-snapshot', upload.single('snapshot'), proctoringController.uploadSnapshot);
router.post('/session/:sessionId/heartbeat', proctoringController.heartbeat);
// v2: Face embedding persistence routes
router.post('/session/:sessionId/registration', proctoringController.saveRegistration);
router.get('/session/:sessionId/embedding', proctoringController.getEmbedding);
// v3: Batch verification logging
router.post('/session/:sessionId/verification', proctoringController.logVerification);

// Admin-only routes
router.get('/admin/sessions', authorize('admin'), proctoringController.getSessions);
router.get('/admin/session/:sessionId', authorize('admin'), proctoringController.getSessionDetails);

// Serve a proctoring snapshot (admin only). Static access to uploads/proctoring
// is blocked in server.js, so this is the only way to view a captured frame.
router.get('/snapshot/:filename', authorize('admin'), (req, res) => {
  const filename = path.basename(req.params.filename); // strip any path traversal
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Snapshot not found' });
  }
  res.sendFile(filePath);
});

module.exports = router;
