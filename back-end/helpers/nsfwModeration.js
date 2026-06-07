/**
 * NSFW & Violence Image Moderation Helper for Backend
 *
 * Uses OpenRouter Gemini 2.0 Flash Vision API to scan images for:
 * - Blood, gore, extreme violence, death, physical mutilation
 * - Nudity, explicit pornography, sexual content
 * - Weapons brandished or used in threatening ways
 * - Self-harm, suicide
 * - Hate symbols, slurs
 */

const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_BASE_URL
  ? `${process.env.OPENROUTER_BASE_URL}/chat/completions`
  : 'https://openrouter.ai/api/v1/chat/completions';

const scanImage = async (imageData) => {
  try {
    if (!imageData) {
      return { isSafe: true, reason: null };
    }

    if (!OPENROUTER_API_KEY) {
      console.warn('[NSFW Moderation] OpenRouter API key not configured. Skipping server-side AI scan.');
      return { isSafe: true, reason: null };
    }

    // Ensure imageData is a proper data URL
    let formattedImageData = imageData;
    if (!imageData.startsWith('data:image/')) {
      formattedImageData = `data:image/jpeg;base64,${imageData}`;
    }

    console.log('[NSFW Moderation] Sending image to OpenRouter for safety check...');

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'google/gemini-2.0-flash:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image. Does it contain extreme violence, blood, gore, physical mutilation, death, nudity, pornography, sexual content, self-harm, weapons used in a threatening way, or hate symbols? Answer with a JSON object: { "isSafe": true or false, "reason": "If not safe, a brief reason why. If safe, null" }'
              },
              {
                type: 'image_url',
                image_url: {
                  url: formattedImageData
                }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:8080',
          'X-Title': 'SMAART Minds Image Safety scan'
        },
        timeout: 8000 // 8 second timeout to avoid hanging the request
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    console.log('[NSFW Moderation] OpenRouter response content:', content);

    if (!content) {
      console.warn('[NSFW Moderation] Empty response from OpenRouter');
      return { isSafe: true, reason: null }; // Fail open
    }

    // Parse safety response
    try {
      const result = JSON.parse(content);
      const isSafe = result.isSafe !== false; // Default to safe unless explicitly false
      const reason = result.reason || (isSafe ? null : 'Flagged content detected');

      return {
        isSafe,
        safe: isSafe,
        reason,
        score: isSafe ? 0 : 1,
        categories: isSafe ? [] : [{ label: reason, score: 1 }]
      };
    } catch (parseError) {
      console.error('[NSFW Moderation] JSON parse error of AI content:', parseError.message);
      // Fallback: search for keywords in the raw text
      const lowerContent = content.toLowerCase();
      const isSafe = !lowerContent.includes('"issafe": false') && !lowerContent.includes('"issafe":false');
      return {
        isSafe,
        safe: isSafe,
        reason: isSafe ? null : 'Flagged content detected',
        score: isSafe ? 0 : 1
      };
    }

  } catch (error) {
    console.error('[NSFW Moderation] AI scan failed:', error.message);
    // Fail open for user experience, but log detailed error
    return {
      isSafe: true,
      safe: true,
      reason: null,
      score: 0,
      categories: [],
      error: error.message
    };
  }
};

module.exports = {
  scanImage,
};
