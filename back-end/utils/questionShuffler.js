/**
 * Question Shuffler Utilities
 * Includes deterministic shuffling and stratified sampling logic.
 */

const T1_DISTRIBUTION = require('../config/t1_distribution');

/**
 * Deterministic Fisher-Yates Shuffle
 * Same user ID will always get the same shuffled order
 * @param {Array} array - Array to shuffle
 * @param {String} seedKey - User ID or specific seed string
 * @returns {Array} - Shuffled array
 */
function shuffleArrayDeterministic(array, seedKey) {
    if (!array || array.length === 0) return [];

    // Create a seed from the key
    const seed = seedKey.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Seeded random number generator
    let currentSeed = seed;
    const seededRandom = () => {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
    };

    // Fisher-Yates shuffle with seeded random
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
}

/**
 * Normalizes difficulty level string to key used in config
 * @param {String} level - e.g., "L1", "Easy", "l1"
 * @returns {String} - "easy", "medium", "hard"
 */
function normalizeDifficulty(level) {
    if (!level) return 'medium'; // Validation fallback
    const l = level.toString().toLowerCase();
    if (l === 'l1' || l === 'easy') return 'easy';
    if (l === 'l2' || l === 'medium') return 'medium';
    if (l === 'l3' || l === 'hard') return 'hard';
    return 'medium';
}

/**
 * Select stratified questions for T1 Assessment
 * @param {Array} allQuestions - Full pool of questions
 * @param {String} userId - User ID for deterministic seed
 * @returns {Array} - 36 Selected questions
 */
function selectStratifiedQuestions(allQuestions, userId) {
    console.log(`🧩 Starting Stratified Selection for User ${userId}`);

    // Group questions by Quotient and Difficulty
    const pools = {};
    const quotientPools = {}; // Quotient -> All available questions for that quotient

    allQuestions.forEach(q => {
        if (!q.quotient) return;

        const qt = q.quotient.toUpperCase();
        const diff = normalizeDifficulty(q.difficultyLevel);
        const key = `${qt}_${diff}`;

        if (!pools[key]) pools[key] = [];
        pools[key].push(q);

        if (!quotientPools[qt]) quotientPools[qt] = [];
        quotientPools[qt].push(q);
    });

    let selectedQuestions = [];
    const matrix = T1_DISTRIBUTION.quotients;
    const deficits = []; // Track where we couldn't meet the target

    // Pass 1: Ideal selection according to matrix
    for (const [quotient, difficulties] of Object.entries(matrix)) {
        for (const [diffLevel, requiredCount] of Object.entries(difficulties)) {
            const key = `${quotient}_${diffLevel}`;
            const pool = pools[key] || [];

            if (pool.length < requiredCount) {
                console.warn(`⚠️ Warning: Insufficient questions for ${key}. Required: ${requiredCount}, Available: ${pool.length}`);
                // Take whatever is available
                selectedQuestions.push(...pool);
                // Record deficit to be filled later
                deficits.push({
                    quotient,
                    missing: requiredCount - pool.length,
                    alreadySelectedIds: new Set(pool.map(q => q._id.toString()))
                });
            } else {
                const groupSeed = `${userId}_${key}`;
                const shuffledPool = shuffleArrayDeterministic(pool, groupSeed);
                const selected = shuffledPool.slice(0, requiredCount);
                selectedQuestions.push(...selected);
            }
        }
    }

    // Pass 2: Fill deficits from the same quotient (using other difficulties)
    if (deficits.length > 0) {
        console.log(`🔧 Attempting to fill ${deficits.length} distribution gaps...`);
        const currentlySelectedIds = new Set(selectedQuestions.map(q => q._id.toString()));

        deficits.forEach(deficit => {
            const pool = quotientPools[deficit.quotient] || [];
            // Find questions in this quotient that aren't already selected
            const availableExtras = pool.filter(q => !currentlySelectedIds.has(q._id.toString()));

            if (availableExtras.length > 0) {
                // Shuffle extras deterministically
                const shuffledExtras = shuffleArrayDeterministic(availableExtras, `${userId}_${deficit.quotient}_extra`);
                const toTake = Math.min(deficit.missing, shuffledExtras.length);
                const extras = shuffledExtras.slice(0, toTake);

                selectedQuestions.push(...extras);
                extras.forEach(e => currentlySelectedIds.add(e._id.toString()));

                console.log(`✅ Filled gap for ${deficit.quotient}: borrowed ${toTake} questions from other difficulties.`);
            } else {
                console.error(`🚨 Critical: No more questions available for quotient ${deficit.quotient}!`);
            }
        });
    }

    console.log(`✅ Final Selected Count: ${selectedQuestions.length} questions`);

    // Final shuffle to mix quotients
    return shuffleArrayDeterministic(selectedQuestions, userId);
}

/**
 * Simple selection (Legacy/Default)
 */
function selectQuestionsForUser(questions, userId, limit = 36) {
    const shuffled = shuffleArrayDeterministic(questions, userId);
    return shuffled.slice(0, limit);
}

module.exports = {
    shuffleArrayDeterministic,
    selectQuestionsForUser,
    selectStratifiedQuestions
};
