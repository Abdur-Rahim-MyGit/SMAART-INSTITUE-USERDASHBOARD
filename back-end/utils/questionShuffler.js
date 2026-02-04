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

    allQuestions.forEach(q => {
        // Ensure properties exist
        if (!q.quotient || !q.difficultyLevel) return;

        const qt = q.quotient.toUpperCase();
        const diff = normalizeDifficulty(q.difficultyLevel);
        const key = `${qt}_${diff}`;

        if (!pools[key]) pools[key] = [];
        pools[key].push(q);
    });

    let selectedQuestions = [];
    const matrix = T1_DISTRIBUTION.quotients;

    // Iterate through configuration matrix
    for (const [quotient, difficulties] of Object.entries(matrix)) {
        for (const [diffLevel, requiredCount] of Object.entries(difficulties)) {
            const key = `${quotient}_${diffLevel}`;
            const pool = pools[key] || [];

            if (pool.length < requiredCount) {
                console.warn(`⚠️ Warning: Insufficient questions for ${key}. Required: ${requiredCount}, Available: ${pool.length}`);
                // In production, you might error out. Here, we take what we have.
                selectedQuestions.push(...pool);
            } else {
                // Shuffle this specific pool deterministically
                // Use userId + key to ensure different shuffle per group
                const groupSeed = `${userId}_${key}`;
                const shuffledPool = shuffleArrayDeterministic(pool, groupSeed);

                // Select top N
                const selected = shuffledPool.slice(0, requiredCount);
                selectedQuestions.push(...selected);
            }
        }
    }

    console.log(`✅ Selected ${selectedQuestions.length} questions (Stratified)`);

    // Final shuffle to mix quotients (so they don't appear in chunks)
    // Use simple userId seed for final mix
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
