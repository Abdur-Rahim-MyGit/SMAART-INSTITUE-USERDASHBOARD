/**
 * OCR Routes - Text extraction from images using OCR.space API
 */

const express = require('express');
const router = express.Router();
const { generalLimiter, aiLimiter } = require('../middleware/rateLimiter');
const { protect } = require('../middleware/auth');
router.use(generalLimiter);
// SECURITY: require a valid session. This endpoint proxies images to a paid
// third-party OCR API; leaving it open let anyone drain the quota / run up cost
// (and accept arbitrary image payloads). Its only caller is the logged-in vision
// board editor, which now sends the JWT.
router.use(protect);

const axios = require('axios');
const FormData = require('form-data');
const { execFile } = require('child_process');
const fs = require('fs/promises');
const fsSync = require('fs');
const os = require('os');
const path = require('path');

// OCR.space API configuration
// SECURITY: no hardcoded fallback key — the previous literal was committed to
// source and must be rotated. Read strictly from the environment.
const OCR_API_KEY = process.env.OCR_SPACE_API_KEY;
const OCR_API_URL = 'https://api.ocr.space/parse/image';
const PADDLE_OCR_SCRIPT = path.join(__dirname, '..', 'services', 'paddleOcr.py');
const resolvePaddlePython = () => {
  const localVenvPython = path.join(__dirname, '..', '.venv-ocr', 'Scripts', 'python.exe');
  if (process.env.PADDLE_OCR_PYTHON) return process.env.PADDLE_OCR_PYTHON;
  if (fsSync.existsSync(localVenvPython)) return localVenvPython;
  return process.env.PYTHON || 'python';
};

const stripDataUriPrefix = (imageData) => imageData.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

const runPaddleOcr = (imagePath) => new Promise((resolve, reject) => {
  const startedAt = Date.now();
  const pythonPath = resolvePaddlePython();
  console.log(`[PaddleOCR] Starting with Python: ${pythonPath}`);

  execFile(
    pythonPath,
    [PADDLE_OCR_SCRIPT, imagePath],
    {
      timeout: 180000,
      maxBuffer: 20 * 1024 * 1024,
      windowsHide: true,
    },
    (error, stdout, stderr) => {
      const durationMs = Date.now() - startedAt;
      console.log(`[PaddleOCR] Finished in ${durationMs}ms`);

      if (error?.killed || error?.signal === 'SIGTERM') {
        const wrappedError = new Error('PaddleOCR timed out before finishing. Try a smaller/clearer screenshot or wait for model warm-up.');
        wrappedError.statusCode = 504;
        wrappedError.details = stderr ? { stderr: stderr.slice(-4000) } : undefined;
        reject(wrappedError);
        return;
      }

      let payload = null;
      try {
        payload = JSON.parse(stdout);
      } catch (parseError) {
        const wrappedError = new Error(stderr || stdout || parseError.message);
        wrappedError.statusCode = error ? 503 : 500;
        reject(wrappedError);
        return;
      }

      if (error || !payload.success) {
        const wrappedError = new Error(payload.error || stderr || error?.message || 'PaddleOCR failed');
        wrappedError.statusCode = payload.errorCode === 'PADDLEOCR_NOT_INSTALLED' ? 503 : 500;
        wrappedError.details = payload;
        reject(wrappedError);
        return;
      }

      resolve(payload);
    }
  );
});

/**
 * POST /api/ocr/paddle
 * Extract text and word boxes from an image using local PaddleOCR.
 */
router.post('/paddle', aiLimiter, async (req, res) => {
  let tempDir = null;

  try {
    const { imageData } = req.body;

    if (!imageData || typeof imageData !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing imageData in request body',
      });
    }

    const cleanBase64 = stripDataUriPrefix(imageData);
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    if (!imageBuffer.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid imageData',
      });
    }

    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'smaart-paddle-'));
    const imagePath = path.join(tempDir, 'result-image.png');
    await fs.writeFile(imagePath, imageBuffer);

    const result = await runPaddleOcr(imagePath);

    return res.json({
      success: true,
      provider: 'paddleocr',
      text: result.text || '',
      words: result.words || [],
      confidence: result.confidence || 0,
      rawLineCount: result.rawLineCount || 0,
    });
  } catch (error) {
    console.error('[PaddleOCR Route] Error:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      provider: 'paddleocr',
      error: error.message || 'Failed to extract text with PaddleOCR',
      details: error.details,
    });
  } finally {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

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
router.post('/extract', aiLimiter, async (req, res) => {
  try {
    const { imageData } = req.body;
    
    console.log('[OCR] Received request, imageData length:', imageData?.length || 0);
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageData in request body',
      });
    }

    if (!OCR_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'OCR service is not configured',
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
