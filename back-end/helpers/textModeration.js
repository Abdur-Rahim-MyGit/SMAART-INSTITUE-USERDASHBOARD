/**
 * Text Content Moderation Helper for Backend
 * Mirrors the frontend moderation system for server-side validation
 */

// Banned words list - explicit, offensive, and inappropriate terms
const BANNED_WORDS = [
    "porn", "pornography", "xxx", "nude", "naked", "sex", "sexy", "erotic", "nsfw", "adult",
    "explicit", "hentai", "fetish", "orgasm", "masturbat", "genital", "penis", "vagina",
    "boob", "breast", "nipple", "ass", "butt", "dick", "cock", "pussy", "whore", "slut",
    "hooker", "prostitut", "kill", "murder", "suicide", "death", "dead", "die", "blood",
    "gore", "torture", "assault", "abuse", "violent", "weapon", "gun", "shoot", "stab",
    "knife", "bomb", "terrorist", "terror", "nigger", "nigga", "faggot", "fag", "retard",
    "spic", "chink", "kike", "nazi", "hitler", "kkk", "racist", "racism", "cocaine",
    "heroin", "meth", "crack", "weed", "marijuana", "drug", "overdose", "junkie", "fuck",
    "shit", "bitch", "damn", "cunt", "bastard", "asshole", "motherfuck", "bullshit",
    "piss", "selfharm", "self-harm", "cutting", "anorex", "bulimi"
];

// Leet speak replacements
const LEET_REPLACEMENTS = {
    '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b',
    '@': 'a', '$': 's', '!': 'i'
};

/**
 * Normalize text by removing leet speak and special characters
 * @param {string} text - Text to normalize
 * @returns {string} - Normalized text
 */
const normalizeText = (text) => {
    if (!text) return '';
    let normalized = text.toLowerCase();

    // Replace leet speak
    for (const [leet, normal] of Object.entries(LEET_REPLACEMENTS)) {
        normalized = normalized.split(leet).join(normal);
    }

    // Remove special characters and spaces
    normalized = normalized.replace(/[\s\-_\.]/g, '');

    // Reduce repeated characters (e.g., "asssss" -> "ass")
    normalized = normalized.replace(/(.)\\1{2,}/g, '$1$1');

    return normalized;
};

/**
 * Check if text contains banned words
 * @param {string} text - Text to check
 * @param {boolean} strictMode - If true, uses exact word matching only
 * @returns {Object} - { isClean: boolean, flaggedWords: string[] }
 */
const moderateText = (text, strictMode = false) => {
    if (!text || typeof text !== 'string') {
        return { isClean: true, flaggedWords: [] };
    }

    const normalizedText = normalizeText(text);
    const originalLower = text.toLowerCase();
    const flaggedWords = [];

    for (const bannedWord of BANNED_WORDS) {
        let found = false;

        // Check 1: Exact word match with word boundaries
        const regex = new RegExp(`\\b${bannedWord}\\b`, 'i');
        if (regex.test(text) || regex.test(originalLower)) {
            flaggedWords.push(bannedWord);
            continue;
        }

        // Check 2: Substring match in normalized text (catches obfuscation)
        // This catches things like "shitn", "fck", "a$$hole", etc.
        if (!strictMode && normalizedText.includes(bannedWord)) {
            flaggedWords.push(bannedWord);
            continue;
        }

        // Check 3: Substring match in original text (catches simple cases)
        if (!strictMode && originalLower.includes(bannedWord)) {
            flaggedWords.push(bannedWord);
        }
    }

    const uniqueFlagged = [...new Set(flaggedWords)];
    return {
        isClean: uniqueFlagged.length === 0,
        flaggedWords: uniqueFlagged
    };
};

/**
 * Censor text by replacing banned words with asterisks
 * @param {string} text - Text to censor
 * @returns {string} - Censored text
 */
const censorText = (text) => {
    if (!text || typeof text !== 'string') return text;

    let censoredText = text;
    const lowerText = text.toLowerCase();

    for (const bannedWord of BANNED_WORDS) {
        const index = lowerText.indexOf(bannedWord);
        if (index !== -1) {
            const asterisks = '*'.repeat(bannedWord.length);
            const regex = new RegExp(bannedWord, 'gi');
            censoredText = censoredText.replace(regex, asterisks);
        }
    }

    return censoredText;
};

module.exports = {
    moderateText,
    censorText,
    BANNED_WORDS
};
