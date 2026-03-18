/**
 * NSFW Image Moderation Helper for Backend
 *
 * TODO: replace with AWS Rekognition when AWS service is configured.
 * Current placeholder performs lightweight checks that do not require
 * native builds or heavy dependencies.
 */

const fs = require('fs');
const path = require('path');

const bannedKeywords = ['nsfw', 'nude', 'porn', 'xxx', 'sex'];

const scanImage = async (imageUrl) => {
  try {
    const target = (imageUrl || '').toString();
    const lowerTarget = target.toLowerCase();
    const hasBadKeyword = bannedKeywords.some((kw) => lowerTarget.includes(kw));

    // Optional: file-size sanity check (logs only; does not block)
    try {
      const stats = await fs.promises.stat(target);
      if (stats.size === 0) {
        console.warn('[NSFW Moderation] Zero-byte image encountered:', target);
      }
    } catch (err) {
      // Ignore missing file or inaccessible path; placeholder is tolerant
    }

    return {
      safe: !hasBadKeyword,
      score: hasBadKeyword ? 1 : 0,
      categories: hasBadKeyword
        ? [{ label: 'keyword_flag', score: 1 }]
        : [],
      isSafe: !hasBadKeyword,
      reason: hasBadKeyword ? 'Filename contains blocked keyword' : null,
    };
  } catch (error) {
    console.error('[NSFW Moderation] Placeholder scan failed:', error.message);
    // Fail open for now
    return { safe: true, score: 0, categories: [], isSafe: true, reason: null };
  }
};

module.exports = {
  scanImage,
};
