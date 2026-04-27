/**
 * OCR Routes - Text extraction from images using OCR.space API
 */

const express = require('express');
const router = express.Router();
const { generalLimiter } = require('../middleware/rateLimiter');
router.use(generalLimiter);

const axios = require('axios');
const FormData = require('form-data');

// OCR.space API configuration
const OCR_API_KEY = process.env.OCR_SPACE_API_KEY || 'K81119449488957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

/**
 * POST /api/ocr/extract
 * Extract text from a base64 image using OCR.space API
 * 
 * Body:
 * - imageData: Base64 encoded image (with or without data URI prefix)
 * 
 * Response:
 * - success: boolean
 * - text: string (extracted text)
 * - confidence: number (OCR confidence)
 */
router.post('/extract', async (req, res) => {
  try {
    const { imageData } = req.body;
    
    console.log('[OCR] Received request, imageData length:', imageData?.length || 0);
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageData in request body',
      });
    }

    // Prepare the request to OCR.space
    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', imageData);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2'); // Engine 2 is better for text detection

    console.log('[OCR] Calling OCR.space API...');
    
    const response = await axios.post(OCR_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 second timeout
    });

    const result = response.data;
    
    console.log('[OCR] API Response:', JSON.stringify(result).substring(0, 500));

    if (result.IsErroredOnProcessing) {
      console.log('[OCR] API Error:', result.ErrorMessage);
      return res.status(500).json({
        success: false,
        error: result.ErrorMessage?.[0] || 'OCR processing failed',
      });
    }

    // Extract text from parsed results
    const parsedResults = result.ParsedResults || [];
    const extractedText = parsedResults
      .map(r => r.ParsedText || '')
      .join('\n')
      .trim();

    console.log('[OCR] Extracted text:', extractedText);

    return res.json({
      success: true,
      text: extractedText,
      confidence: parsedResults[0]?.TextOverlay?.Lines?.[0]?.MaxHeight || 0,
      rawResult: result,
    });

  } catch (error) {
    console.error('[OCR Route] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to extract text from image',
      message: error.message,
    });
  }
});

/**
 * GET /api/ocr/status
 * Check if OCR API is configured
 */
router.get('/status', (req, res) => {
  const isConfigured = !!OCR_API_KEY;
  
  return res.json({
    success: true,
    configured: isConfigured,
    provider: 'ocr.space',
  });
});

module.exports = router;
