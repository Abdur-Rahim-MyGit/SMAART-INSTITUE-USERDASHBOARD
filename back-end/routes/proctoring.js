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

// Webhook for admin backend to trigger unlock via Socket.io (Internal)
router.post('/webhook/unlock', proctoringController.webhookUnlock);

// Protect all routes
router.use(protect);

router.post('/session/start', proctoringController.startSession);
router.post('/session/:sessionId/event', proctoringController.logEvent);
router.post('/session/:sessionId/complete', proctoringController.completeSession);
router.post('/session/:sessionId/lock', proctoringController.triggerLock);
router.post('/session/:sessionId/upload-snapshot', upload.single('snapshot'), proctoringController.uploadSnapshot);



// Admin-only routes
router.get('/admin/sessions', authorize('admin'), proctoringController.getSessions);
router.get('/admin/session/:sessionId', authorize('admin'), proctoringController.getSessionDetails);

module.exports = router;
