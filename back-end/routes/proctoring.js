const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize, protectOrBypass } = require('../middleware/auth');
const proctoringController = require('../controllers/proctoringController');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads/proctoring');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for proctoring webcam screenshots
// Allowed image extensions, mapped from the mimetype rather than taken from
// the uploaded filename (which is attacker-controlled).
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Bind the file to its session in the NAME. This is what lets the server
    // later prove a snapshot belongs to the session claiming it, so a client
    // can't attach another candidate's image as its own evidence.
    const sessionId = String(req.params.sessionId || '');
    if (!/^[0-9a-fA-F]{24}$/.test(sessionId)) {
      return cb(new Error('Invalid session id.'));
    }
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `proctor-${sessionId.toLowerCase()}-${unique}${EXT_BY_MIME[file.mimetype] || '.jpg'}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap
  fileFilter: (req, file, cb) => {
    if (EXT_BY_MIME[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG or WebP images are allowed.'));
    }
  }
});

// Unlock webhook, called server-to-server by the admin dashboard.
// SECURITY: this used to sit ABOVE router.use(protect), so anyone on the
// internet could POST an arbitrary userId and push "Assessment unlocked"
// notifications. It now requires either the internal admin secret or a
// signed-in admin.
router.post('/webhook/unlock', protectOrBypass, authorize('admin'), proctoringController.webhookUnlock);

// Protect all routes
router.use(protect);

router.post('/session/start', proctoringController.startSession);
router.post('/session/:sessionId/event', proctoringController.logEvent);
router.post('/session/:sessionId/heartbeat', proctoringController.heartbeat);
router.post('/session/:sessionId/complete', proctoringController.completeSession);
router.post('/session/:sessionId/lock', proctoringController.triggerLock);
router.post('/session/:sessionId/upload-snapshot', upload.single('snapshot'), proctoringController.uploadSnapshot);

// Webcam stills, served only to the candidate they belong to or an admin.
// Replaces the public /uploads/proctoring static path.
router.get('/snapshot/:filename', proctoringController.serveSnapshot);

// Admin-only routes
router.get('/admin/sessions', authorize('admin'), proctoringController.getSessions);
router.get('/admin/session/:sessionId', authorize('admin'), proctoringController.getSessionDetails);

module.exports = router;
