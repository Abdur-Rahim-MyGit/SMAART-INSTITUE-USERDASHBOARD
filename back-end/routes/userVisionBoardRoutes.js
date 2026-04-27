const express = require("express");
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const controller = require("../controllers/userVisionBoardController");
const { protect } = require("../middleware/auth");

// Apply protection to all routes
router.use(protect);

/**
 * User Vision Board Routes
 * Simple image gallery with max 3 images per user
 */

// Get user's gallery
router.get("/", controller.getGallery);

// Upload new image
router.post("/upload", controller.uploadImage);

// Update image metadata
router.put("/image/:imageId", controller.updateImage);

// Delete image
router.delete("/image/:imageId", controller.deleteImage);

// Reorder images
router.put("/reorder", controller.reorderImages);

// Update gallery settings
router.put("/settings", controller.updateSettings);

module.exports = router;
