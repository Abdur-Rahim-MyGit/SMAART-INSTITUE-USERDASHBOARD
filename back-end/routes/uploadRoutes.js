const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const { uploadCloudinary, uploadRegistration } = require('../middleware/upload');

// Single file upload endpoint
// Uses 'file' as the field name
router.post('/', (req, res) => {
    uploadRegistration.single('file')(req, res, function (err) {
        if (err) {
            // Handle multer-specific errors (like file size limit)
            if (err.name === 'MulterError') {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ error: 'File size exceeds the allowed limit (10MB for documents, 5MB for images)' });
                }
                return res.status(400).json({ error: `Upload error: ${err.message}` });
            }
            // Handle custom file filter errors
            if (err.message && err.message.includes('Invalid file type')) {
                return res.status(400).json({ error: err.message });
            }
            // Handle unknown errors
            console.error('Upload error:', err);
            return res.status(500).json({ error: 'File upload failed due to an unknown error' });
        }

        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // Return the Cloudinary URL and public ID
            res.json({
                url: req.file.path,
                publicId: req.file.filename,
                originalName: req.file.originalname,
                format: req.file.mimetype
            });
        } catch (error) {
            console.error('Processing error after upload:', error);
            res.status(500).json({ error: 'Failed to process uploaded file' });
        }
    });
});

module.exports = router;
