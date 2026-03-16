/**
 * NSFW Moderation Routes
 * Server-side image content moderation endpoint
 * 
 * Currently a placeholder - add API keys to enable real moderation
 */

const express = require('express');
const router = express.Router();
const { scanImage } = require('../helpers/nsfwModeration');

/**
 * POST /api/nsfw/check
 * Check an image for NSFW content
 * 
 * Body:
 * - imageData: Base64 encoded image (required)
 * 
 * Response:
 * - isSafe: boolean
 * - reason: string | null
 * - scores: object (when API is configured)
 */
router.post('/check', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageData in request body',
      });
    }
    
    const result = await scanImage(imageData);
    
    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('[NSFW Route] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check image',
      message: error.message,
    });
  }
});

/**
 * GET /api/nsfw/status
 * Check if NSFW moderation API is configured
 */
router.get('/status', (req, res) => {
  const isConfigured = !!(process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET);
  
  return res.json({
    success: true,
    configured: isConfigured,
    provider: isConfigured ? 'sightengine' : null,
    message: isConfigured 
      ? 'Server-side NSFW moderation is active'
      : 'Server-side NSFW moderation not configured. Using client-side detection only.',
  });
});

module.exports = router;
