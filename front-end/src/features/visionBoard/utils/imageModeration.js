/**
 * Comprehensive Image Moderation Utility for Vision Board
 * 
 * Includes:
 * - NSFW detection (NSFW.js) - nudity, sexual content
 * - Object detection (COCO-SSD) - weapons like knives, scissors, bats
 * - OCR text extraction (OCR.space API via backend) - reads text from images for moderation
 */

import * as nsfwjs from 'nsfwjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { moderateText } from './contentModeration';

// Backend API URL.
// NOTE: VITE_API_URL ALREADY ENDS IN /api — that is the convention every other
// call site in this app follows (see visionBoardApi.js, DashboardSidebar.jsx,
// ...). This file used to default to a bare origin and then append '/api/...',
// which produced '/api/api/ocr/extract' — a 404 — as soon as VITE_API_URL was
// set to a real value at build time. Keep the default in step with the others.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ═══════════════════════════════════════════════════════════════════════════
// MODEL SINGLETONS - Lazy loaded
// ═══════════════════════════════════════════════════════════════════════════

let nsfwModel = null;
let nsfwModelPromise = null;
let cocoModel = null;
let cocoModelPromise = null;

// ═══════════════════════════════════════════════════════════════════════════
// NSFW DETECTION (Nudity, Sexual Content)
// ═══════════════════════════════════════════════════════════════════════════

export const loadNSFWModel = async () => {
  if (nsfwModel) return nsfwModel;
  if (nsfwModelPromise) return nsfwModelPromise;

  nsfwModelPromise = (async () => {
    try {
      nsfwModel = await nsfwjs.load();
      return nsfwModel;
    } catch (error) {
      console.error('Failed to load NSFW.js model:', error);
      nsfwModelPromise = null;
      throw error;
    }
  })();

  return nsfwModelPromise;
};

// NSFW thresholds
const NSFW_THRESHOLDS = {
  Porn: 0.3,
  Hentai: 0.3,
  Sexy: 0.6,
};

const checkNSFW = async (imageElement) => {
  try {
    const model = await loadNSFWModel();
    const predictions = await model.classify(imageElement);
    
    const predictionMap = {};
    predictions.forEach(pred => {
      predictionMap[pred.className] = pred.probability;
    });

    for (const [category, threshold] of Object.entries(NSFW_THRESHOLDS)) {
      if (predictionMap[category] && predictionMap[category] > threshold) {
        return {
          flagged: true,
          reason: `Explicit content`,
          type: 'nsfw',
          category,
          probability: predictionMap[category],
        };
      }
    }

    return { flagged: false };
  } catch (error) {
    console.error('NSFW check error:', error);
    return { flagged: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OBJECT DETECTION (Weapons - Knives, Scissors, Bats)
// ═══════════════════════════════════════════════════════════════════════════

export const loadCocoModel = async () => {
  if (cocoModel) return cocoModel;
  if (cocoModelPromise) return cocoModelPromise;

  cocoModelPromise = (async () => {
    try {
      cocoModel = await cocoSsd.load();
      return cocoModel;
    } catch (error) {
      console.error('Failed to load COCO-SSD model:', error);
      cocoModelPromise = null;
      throw error;
    }
  })();

  return cocoModelPromise;
};

// Objects to flag as potential weapons
const BANNED_OBJECTS = [
  'knife',
  'scissors',
  'baseball bat',
  // Note: COCO-SSD doesn't have gun detection, only these items
];

const OBJECT_CONFIDENCE_THRESHOLD = 0.5; // 50% confidence

const checkDangerousObjects = async (imageElement) => {
  try {
    const model = await loadCocoModel();
    const predictions = await model.detect(imageElement);
    
    const dangerousItems = predictions.filter(pred => 
      BANNED_OBJECTS.includes(pred.class.toLowerCase()) && 
      pred.score >= OBJECT_CONFIDENCE_THRESHOLD
    );

    if (dangerousItems.length > 0) {
      const detectedItems = dangerousItems.map(item => item.class).join(', ');
      return {
        flagged: true,
        reason: `Contains potentially dangerous objects: ${detectedItems}`,
        type: 'weapon',
        detectedObjects: dangerousItems,
      };
    }

    return { flagged: false, detectedObjects: predictions };
  } catch (error) {
    console.error('Object detection error:', error);
    return { flagged: false, error: error.message };
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// OCR TEXT DETECTION (Hate Speech in Images) - Using OCR.space API via Backend
// ═══════════════════════════════════════════════════════════════════════════

const extractTextFromImage = async (base64Image) => {
  try {
    // Send the session JWT — the backend /api/ocr/extract route now requires auth.
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/ocr/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ imageData: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success ? result.text : '';
  } catch (error) {
    console.error('OCR API error:', error);
    return '';
  }
};

const checkImageText = async (imageSource) => {
  try {
    const extractedText = await extractTextFromImage(imageSource);
    
    if (!extractedText || extractedText.trim().length === 0) {
      return { flagged: false, extractedText: '' };
    }

    // Use existing text moderation with exactMatch=false for OCR (catches substrings)
    const moderationResult = moderateText(extractedText, false);
    
    if (!moderationResult.isClean) {
      return {
        flagged: true,
        reason: `Image contains inappropriate text: "${moderationResult.flaggedWords.join(', ')}"`,
        type: 'text',
        extractedText: extractedText.trim(),
        flaggedWords: moderationResult.flaggedWords,
      };
    }

    return { flagged: false, extractedText: extractedText.trim() };
  } catch (error) {
    console.error('Text moderation error:', error);
    return { flagged: false, error: error.message };
  }
};

const checkImageServerSide = async (base64Image) => {
  try {
    // Send the session JWT — the backend /api/nsfw/check route now requires auth.
    const token = sessionStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/nsfw/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ imageData: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`Server moderation error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && !result.isSafe) {
      return {
        flagged: true,
        reason: result.reason || 'Image contains inappropriate content (server check)',
        type: 'server_ai',
      };
    }
    return { flagged: false };
  } catch (error) {
    console.error('Server-side image check error:', error);
    return { flagged: false, error: error.message }; // Fail open
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE IMAGE CHECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Comprehensive image check combining all detection methods
 * @param {string} base64Image - Base64 encoded image
 * @returns {Promise<Object>} - { isSafe: boolean, reason: string | null, checks: Object }
 */
export const checkImageComprehensive = async (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = async () => {
      const checks = {
        nsfw: { flagged: false },
        objects: { flagged: false },
        text: { flagged: false },
        server: { flagged: false },
      };

      try {
        // Run checks in parallel for speed (including the backend server AI check)
        const [nsfwResult, objectResult, textResult, serverResult] = await Promise.all([
          checkNSFW(img),
          checkDangerousObjects(img),
          checkImageText(base64Image),
          checkImageServerSide(base64Image),
        ]);

        checks.nsfw = nsfwResult;
        checks.objects = objectResult;
        checks.text = textResult;
        checks.server = serverResult;

        // Determine overall safety
        const flaggedChecks = [];
        if (nsfwResult.flagged) flaggedChecks.push(nsfwResult);
        if (objectResult.flagged) flaggedChecks.push(objectResult);
        if (textResult.flagged) flaggedChecks.push(textResult);
        if (serverResult.flagged) flaggedChecks.push(serverResult);

        if (flaggedChecks.length > 0) {
          // Combine reasons from all flagged checks
          const reasons = flaggedChecks.map(c => c.reason).join('. ');
          resolve({
            isSafe: false,
            reason: reasons,
            checks,
            flaggedTypes: flaggedChecks.map(c => c.type),
          });
        } else {
          resolve({
            isSafe: true,
            reason: null,
            checks,
          });
        }
      } catch (error) {
        console.error('Comprehensive check error:', error);
        // Fail open - allow image if checks fail
        resolve({
          isSafe: true,
          reason: null,
          checks,
          error: error.message,
        });
      }
    };
    
    img.onerror = () => {
      console.error('Failed to load image for moderation');
      resolve({
        isSafe: true,
        reason: null,
        error: 'Failed to load image',
      });
    };
    
    img.src = base64Image.startsWith('data:') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY
// ═══════════════════════════════════════════════════════════════════════════

// Keep the old function for backward compatibility
export const checkBase64ImageNSFW = async (base64Image) => {
  const result = await checkImageComprehensive(base64Image);
  return result;
};

// ═══════════════════════════════════════════════════════════════════════════
// PRELOAD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Preload all models in the background
 */
export const preloadNSFWModel = () => {
  // Start loading all models in background
  Promise.all([
    loadNSFWModel(),
    loadCocoModel(),
  ]).catch(err => {
    console.warn('Background model preload failed:', err);
  });
};

export default {
  loadNSFWModel,
  loadCocoModel,
  checkImageComprehensive,
  checkBase64ImageNSFW,
  preloadNSFWModel,
};
