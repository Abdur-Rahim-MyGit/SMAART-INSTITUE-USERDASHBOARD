/**
 * Question Shuffler Utilities
 * Includes deterministic shuffling and stratified sampling logic for all stages (T1-T4).
 */

const { STAGE_DISTRIBUTIONS } = require('../config/stage_distributions');

// Legacy support - keep T1 available via old import pattern
const T1_DISTRIBUTION = STAGE_DISTRIBUTIONS.T1;

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
 * Select stratified questions for T1 Assessment (Legacy - backward compat)
 * @param {Array} allQuestions - Full pool of questions
 * @param {String} userId - User ID for deterministic seed
 * @returns {Array} - 36 Selected questions
 */
function selectStratifiedQuestions(allQuestions, userId) {
    return selectStratifiedQuestionsForStage(allQuestions, userId, 'T1');
}

/**
 * Select stratified questions for ANY stage assessment (T1-T4)
 * @param {Array} allQuestions - Full pool of questions
 * @param {String} userId - User ID for deterministic seed
 * @param {String} stageKey - Stage key: 'T1', 'T2', 'T3', 'T4'
 * @param {Array} previousQuestionIds - Optional: IDs of questions previously attempted by user
 * @returns {Array} - Selected questions based on stage distribution
 */
function selectStratifiedQuestionsForStage(allQuestions, userId, stageKey, previousQuestionIds = []) {
    const stage = STAGE_DISTRIBUTIONS[stageKey.toUpperCase()];
    if (!stage) {
        console.error(`❌ Unknown stage: ${stageKey}. Falling back to T1.`);
        return selectStratifiedQuestionsForStage(allQuestions, userId, 'T1', previousQuestionIds);
    }

    console.log(`🧩 Starting Stratified Selection for Stage ${stageKey}, User ${userId}`);
    console.log(`📊 Target: ${stage.totalQuestions} questions`);

    // Create a set of previous question IDs for fast lookup
    const previousSet = new Set(previousQuestionIds.map(id => id.toString()));

    // Group questions by Quotient and Difficulty
    const pools = {};
    const fallbackPools = {}; // For questions that were previously attempted

    allQuestions.forEach(q => {
        if (!q.quotient) return;

        const qt = q.quotient.toUpperCase();
        const diff = normalizeDifficulty(q.difficultyLevel);
        const key = `${qt}_${diff}`;

        if (!pools[key]) pools[key] = [];
        if (!fallbackPools[key]) fallbackPools[key] = [];

        const qId = q._id.toString();
        if (!previousSet.has(qId)) {
            pools[key].push(q); // Fresh question (not previously attempted)
        }
        fallbackPools[key].push(q); // All available questions (including previously attempted)
    });

    let selectedQuestions = [];
    const selectedIds = new Set(); // Track selected IDs to prevent duplicates
    const matrix = stage.quotients;

    // Pass 1: Ideal selection according to matrix
    for (const [quotient, difficulties] of Object.entries(matrix)) {
        for (const [diffLevel, requiredCount] of Object.entries(difficulties)) {
            const key = `${quotient}_${diffLevel}`;
            let pool = pools[key] || [];

            // If not enough fresh questions, fall back to all questions
            if (pool.length < requiredCount) {
                console.warn(`⚠️ Insufficient fresh questions for ${key}. Fresh: ${pool.length}, Required: ${requiredCount}. Using fallback pool.`);
                pool = fallbackPools[key] || [];
            }

            if (pool.length < requiredCount) {
                console.warn(`⚠️ Warning: Insufficient questions for ${key}. Required: ${requiredCount}, Available: ${pool.length}`);
                // Take what we have, avoiding duplicates
                pool.forEach(q => {
                    const qId = q._id.toString();
                    if (!selectedIds.has(qId)) {
                        selectedQuestions.push(q);
                        selectedIds.add(qId);
                    }
                });
            } else {
                // Shuffle this specific pool deterministically
                const groupSeed = `${userId}_${stageKey}_${key}`;
                const shuffledPool = shuffleArrayDeterministic(pool, groupSeed);

                // Select top N, avoiding duplicates
                let count = 0;
                for (const q of shuffledPool) {
                    if (count >= requiredCount) break;
                    const qId = q._id.toString();
                    if (!selectedIds.has(qId)) {
                        selectedQuestions.push(q);
                        selectedIds.add(qId);
                        count++;
                    }
                }
            }
        }
    }

    console.log(`✅ Selected ${selectedQuestions.length} questions (Stratified for ${stageKey})`);

    if (selectedQuestions.length !== stage.totalQuestions) {
        console.warn(`⚠️ Expected ${stage.totalQuestions} questions, got ${selectedQuestions.length}. Check Question Bank tagging for stage ${stageKey}.`);
    }

    // Final shuffle to mix quotients (so they don't appear in chunks)
    return shuffleArrayDeterministic(selectedQuestions, `${userId}_${stageKey}_final`);
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
    selectStratifiedQuestions,
    selectStratifiedQuestionsForStage
};
