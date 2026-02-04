const express = require('express');
const router = express.Router();
const { uploadCloudinary, uploadRegistration } = require('../middleware/upload');

// Single file upload endpoint
// Uses 'file' as the field name
router.post('/', uploadRegistration.single('file'), (req, res) => {
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
        console.error('Upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

module.exports = router;
