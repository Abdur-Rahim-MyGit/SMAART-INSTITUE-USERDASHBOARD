const SystemConfig = require('../models/SystemConfig');

// In-memory cache
const flagCache = {};
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Checks if a feature flag is enabled in MongoDB.
 * Uses a 5-minute in-memory cache to prevent excessive DB queries.
 * 
 * @param {string} key - The feature flag key to check.
 * @returns {Promise<boolean>} - Resolves to true if the feature is enabled, false otherwise.
 */
async function isFeatureEnabled(key) {
    if (!key) return false;

    const now = Date.now();
    const cached = flagCache[key];

    // Return cached value if it exists and has not expired
    if (cached && (now - cached.timestamp < CACHE_EXPIRY_MS)) {
        return cached.enabled;
    }

    try {
        const config = await SystemConfig.findOne({ key });
        const enabled = config ? !!config.enabled : false;

        // Update the cache
        flagCache[key] = {
            enabled,
            timestamp: now
        };

        return enabled;
    } catch (error) {
        console.error(`Error checking feature flag ${key}:`, error);
        // Fallback to cache if available even if expired, otherwise false
        return cached ? cached.enabled : false;
    }
}

/**
 * Clears the feature flag cache. Useful for tests or force refreshes.
 */
function clearFeatureFlagCache() {
    for (const key in flagCache) {
        delete flagCache[key];
    }
}

module.exports = {
    isFeatureEnabled,
    clearFeatureFlagCache
};
