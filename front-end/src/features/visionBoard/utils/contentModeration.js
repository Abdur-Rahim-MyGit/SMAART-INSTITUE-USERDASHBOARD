import * as tf from '@tensorflow/tfjs';
import * as toxicity from '@tensorflow-models/toxicity';

/**
 * Content Moderation Utility for Frontend
 * Real-time text moderation for Vision Board editor
 */

// Banned words list - explicit, offensive, and inappropriate terms
const BANNED_WORDS = [
  // Sexual / pornographic content
  "porn", "pornography", "xxx", "nude", "naked", "sex", "sexy", "erotic", "nsfw", "adult",
  "explicit", "hentai", "fetish", "orgasm", "masturbat", "genital", "penis", "vagina",
  "boob", "nipple", "dick", "cock", "pussy", "whore", "slut",
  "hooker", "prostitut",
  // Extreme violence
  "murder", "suicide", "torture", "assault",
  "terrorist", "terror",
  // Slurs and hate speech
  "nigger", "nigga", "faggot", "fag", "retard",
  "spic", "chink", "kike", "nazi", "hitler", "kkk",
  // Hard drugs
  "cocaine", "heroin", "meth", "overdose",
  // Strong profanity
  "fuck", "shit", "bitch", "cunt", "bastard", "asshole", "motherfuck", "bullshit",
  // Self-harm
  "selfharm", "self-harm", "anorex", "bulimi"
];

// Leet speak replacements
const LEET_REPLACEMENTS = {
  0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i",
};

/**
 * Normalize text by replacing leet speak, but keep spaces for word boundary checks
 */
const normalizeTextWithSpaces = (text) => {
  if (!text) return "";
  let normalized = text.toLowerCase();
  for (const [leet, normal] of Object.entries(LEET_REPLACEMENTS)) {
    normalized = normalized.split(leet).join(normal);
  }
  // Remove special characters but KEEP spaces
  normalized = normalized.replace(/[^\w\s]/g, "");
  return normalized;
};

/**
 * Aggressive normalization for substring checks (squashes everything)
 */
const normalizeTextAggressive = (text) => {
  if (!text) return "";
  let normalized = text.toLowerCase();
  for (const [leet, normal] of Object.entries(LEET_REPLACEMENTS)) {
    normalized = normalized.split(leet).join(normal);
  }
  normalized = normalized.replace(/[\s\-_\.]/g, "");
  normalized = normalized.replace(/(.)\1{2,}/g, "$1$1");
  return normalized;
};

/**
 * Check if text contains banned words
 * @param {string} text - Text to check
 * @param {boolean} exactMatch - If true, only matches whole words
 * @returns {Object} - { isClean: boolean, flaggedWords: string[] }
 */
export const moderateText = (text, exactMatch = true) => {
  if (!text || typeof text !== "string") {
    return { isClean: true, flaggedWords: [] };
  }

  const normalizedWithSpaces = normalizeTextWithSpaces(text);
  const normalizedAggressive = normalizeTextAggressive(text);
  const originalLower = text.toLowerCase();
  const flaggedWords = [];

  for (const bannedWord of BANNED_WORDS) {
    if (exactMatch) {
      // Use regex with word boundaries to avoid false positives (like "ass" in "assessment")
      const regex = new RegExp(`\\b${bannedWord}\\b`, "i");
      
      if (regex.test(text) || regex.test(originalLower) || regex.test(normalizedWithSpaces)) {
        flaggedWords.push(bannedWord);
      }
    } else {
      // Check aggressive normalized text (catches leet speak and substrings, useful for OCR)
      if (normalizedAggressive.includes(bannedWord)) {
        flaggedWords.push(bannedWord);
        continue;
      }

      // Check original text
      if (originalLower.includes(bannedWord)) {
        flaggedWords.push(bannedWord);
      }
    }
  }

  const uniqueFlagged = [...new Set(flaggedWords)];
  return {
    isClean: uniqueFlagged.length === 0,
    flaggedWords: uniqueFlagged,
  };
};

/**
 * TensorFlow.js Toxicity Model integration
 */
let toxicityModel = null;
const TOXICITY_THRESHOLD = 0.85;
// Valid labels: identity_attack, insult, obscene, severe_toxicity, sexual_explicit, threat, toxicity
const LABELS_TO_CHECK = ['toxicity', 'severe_toxicity', 'identity_attack', 'insult', 'obscene', 'threat', 'sexual_explicit'];

/**
 * Load the toxicity model
 */
export const loadToxicityModel = async () => {
  if (toxicityModel) return toxicityModel;
  try {
    toxicityModel = await toxicity.load(TOXICITY_THRESHOLD, LABELS_TO_CHECK);
    return toxicityModel;
  } catch (error) {
    console.error("Failed to load Toxicity model:", error);
    return null;
  }
};

/**
 * Check text for toxicity using ML model
 * @param {string} text - Text to check
 * @returns {Promise<Object>} - { isClean: boolean, flaggedCategories: string[] }
 */
export const checkToxicityML = async (text) => {
  if (!text || typeof text !== "string") {
    return { isClean: true, flaggedCategories: [] };
  }

  const model = await loadToxicityModel();
  if (!model) {
    // Fallback to basic moderation if model fails to load
    return { isClean: true, flaggedCategories: [] };
  }

  try {
    const predictions = await model.classify([text]);
    const flaggedCategories = predictions
      .filter(p => p.results[0].match)
      .map(p => p.label);

    return {
      isClean: flaggedCategories.length === 0,
      flaggedCategories,
    };
  } catch (error) {
    console.error("Toxicity classification error:", error);
    return { isClean: true, flaggedCategories: [] };
  }
};

/**
 * Combined moderation (Sync + Async)
 * @param {string} text - Text to check
 * @returns {Promise<Object>} - { isClean: boolean, flaggedWords: string[], flaggedCategories: string[] }
 */
export const moderateTextAsync = async (text) => {
  const syncResult = moderateText(text);
  const mlResult = await checkToxicityML(text);

  return {
    isClean: syncResult.isClean && mlResult.isClean,
    flaggedWords: syncResult.flaggedWords,
    flaggedCategories: mlResult.flaggedCategories,
  };
};

/**
 * Check all text overlays for inappropriate content (ASync)
 * @param {Object} textOverlays - Object containing text overlay data
 * @returns {Promise<Object>} - { isClean: boolean, flaggedItems: Array }
 */
export const moderateTextOverlaysAsync = async (textOverlays) => {
  if (!textOverlays || typeof textOverlays !== "object") {
    return { isClean: true, flaggedItems: [] };
  }

  const flaggedItems = [];
  const entries = Object.entries(textOverlays);

  for (const [id, overlay] of entries) {
    if (overlay && overlay.text) {
      const result = await moderateTextAsync(overlay.text);
      if (!result.isClean) {
        flaggedItems.push({
          id,
          text: overlay.text,
          flaggedWords: result.flaggedWords,
          flaggedCategories: result.flaggedCategories,
        });
      }
    }
  }

  return {
    isClean: flaggedItems.length === 0,
    flaggedItems,
  };
};

/**
 * Censor text by replacing banned words with asterisks
 */
export const censorText = (text) => {
  if (!text || typeof text !== "string") return text;
  let censoredText = text;
  
  for (const bannedWord of BANNED_WORDS) {
    // Only censor exact word matches to avoid the "Scunthorpe problem"
    const regex = new RegExp(`\\b${bannedWord}\\b`, "gi");
    if (regex.test(censoredText)) {
      const asterisks = "*".repeat(bannedWord.length);
      // Reset lastIndex because test() modifies it for global regexes
      regex.lastIndex = 0; 
      censoredText = censoredText.replace(regex, asterisks);
    }
  }
  return censoredText;
};

/**
 * Get moderation warning message
 */
export const getModerationWarning = (flaggedItems) => {
  if (!flaggedItems || flaggedItems.length === 0) return "";
  if (flaggedItems.length === 1) {
    return "Your vision board contains inappropriate content. Please revise before saving.";
  }
  return `Your vision board contains ${flaggedItems.length} text items with inappropriate content. Please revise before saving.`;
};

export default {
  moderateText,
  moderateTextAsync,
  checkToxicityML,
  loadToxicityModel,
  censorText,
  moderateTextOverlaysAsync,
  getModerationWarning,
};
