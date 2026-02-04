/**
 * ARQ (Adaptability and Resilience Quotient) Calculation Utilities
 * 
 * Question Structure:
 * - Questions 0-8 (9 questions): Adaptability scale
 * - Questions 9-14 (6 questions): Resilience scale
 */

/**
 * Apply reverse scoring to a response value
 * @param {number} value - Original response value (1-5)
 * @returns {number} - Reversed value
 */
function reverseScore(value) {
    return 6 - value; // 1→5, 2→4, 3→3, 4→2, 5→1
}

/**
 * Calculate adaptability raw score from responses
 * @param {Array} responses - Array of response objects (questions 0-8)
 * @returns {number} - Raw adaptability score (sum of 9 responses, 9-45)
 */
function calculateAdaptabilityRawScore(responses) {
    if (!responses || responses.length !== 9) {
        throw new Error('Adaptability requires exactly 9 responses (questions 0-8)');
    }

    const sum = responses.reduce((total, response) => {
        const value = Number(response.selectedValue);
        if (value < 1 || value > 5) {
            throw new Error('Response values must be between 1 and 5');
        }
        return total + value;
    }, 0);

    return sum;
}

/**
 * Normalize adaptability score to 0-100 scale
 * @param {number} rawScore - Raw adaptability score (9-45)
 * @returns {number} - Normalized score (0-100)
 */
function normalizeAdaptabilityScore(rawScore) {
    if (rawScore < 9 || rawScore > 45) {
        throw new Error('Raw adaptability score must be between 9 and 45');
    }

    // Formula: ((rawScore - 9) / (45 - 9)) * 100
    const normalized = ((rawScore - 9) / 36) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate resilience raw score from responses
 * @param {Array} responses - Array of response objects (questions 9-14)
 * @param {Array} allResponses - All 15 responses to determine question indices
 * @returns {number} - Raw resilience score (sum of 6 responses, 6-30)
 */
function calculateResilienceRawScore(responses, allResponses) {
    if (!responses || responses.length !== 6) {
        throw new Error('Resilience requires exactly 6 responses (questions 9-14)');
    }

    const sum = responses.reduce((total, response) => {
        const value = Number(response.selectedValue);
        if (value < 1 || value > 5) {
            throw new Error('Response values must be between 1 and 5');
        }

        return total + value;
    }, 0);

    return sum;
}

/**
 * Normalize resilience score to 0-100 scale
 * @param {number} rawScore - Raw resilience score (6-30)
 * @returns {number} - Normalized score (0-100)
 */
function normalizeResilienceScore(rawScore) {
    if (rawScore < 6 || rawScore > 30) {
        throw new Error('Raw resilience score must be between 6 and 30');
    }

    // Formula: ((rawScore - 6) / (30 - 6)) * 100
    const normalized = ((rawScore - 6) / 24) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate composite ARQ score (average of adaptability and resilience)
 * @param {number} adaptabilityScore - Adaptability score (0-100)
 * @param {number} resilienceScore - Resilience score (0-100)
 * @returns {number} - Composite ARQ score (0-100)
 */
function calculateCompositeScore(adaptabilityScore, resilienceScore) {
    if (adaptabilityScore < 0 || adaptabilityScore > 100) {
        throw new Error('Adaptability score must be between 0 and 100');
    }
    if (resilienceScore < 0 || resilienceScore > 100) {
        throw new Error('Resilience score must be between 0 and 100');
    }

    const composite = (adaptabilityScore + resilienceScore) / 2;
    return Math.round(composite * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine percentile range based on composite score
 * @param {number} compositeScore - Composite ARQ score (0-100)
 * @returns {string} - Percentile range
 */
function getPercentileRange(compositeScore) {
    if (compositeScore >= 0 && compositeScore <= 25) {
        return '0-25';
    } else if (compositeScore >= 26 && compositeScore <= 50) {
        return '26-50';
    } else if (compositeScore >= 51 && compositeScore <= 75) {
        return '51-75';
    } else if (compositeScore >= 76 && compositeScore <= 100) {
        return '76-100';
    }
    throw new Error('Composite score must be between 0 and 100');
}

/**
 * Get color code based on percentile range
 * @param {string} percentileRange - Percentile range
 * @returns {string} - Color code
 */
function getColorCode(percentileRange) {
    const colorMap = {
        '0-25': 'red',
        '26-50': 'amber',
        '51-75': 'green',
        '76-100': 'super-green'
    };

    return colorMap[percentileRange] || 'amber';
}

/**
 * Get quartile based on percentile range
 * @param {string} percentileRange - Percentile range
 * @returns {number} - Quartile (1-4)
 */
function getQuartile(percentileRange) {
    const quartileMap = {
        '0-25': 1,
        '26-50': 2,
        '51-75': 3,
        '76-100': 4
    };

    return quartileMap[percentileRange] || 2;
}

/**
 * Get description based on percentile range
 * @param {string} percentileRange - Percentile range
 * @returns {string} - Description
 */
function getPercentileDescription(percentileRange) {
    const descriptions = {
        '0-25': 'Your Adaptability and Resilience Quotient is in the developing stage. You may find it challenging to adjust to change and recover from setbacks. Building resilience and flexibility can help you navigate uncertainty more effectively. Consider practicing mindfulness, seeking support when facing challenges, and gradually exposing yourself to new situations to build confidence in handling change.',
        '26-50': 'Your Adaptability and Resilience Quotient is in the moderate range. You demonstrate a balanced ability to adjust to change and bounce back from difficulties. While you can handle most challenges, there may be times when unexpected changes feel overwhelming. To enhance your adaptability and resilience, focus on developing a growth mindset, building strong support networks, and learning from past experiences.',
        '51-75': 'You have a high Adaptability and Resilience Quotient. You are naturally flexible and able to adjust to changing circumstances with relative ease. You recover well from setbacks and view challenges as opportunities for growth. Your resilience helps you maintain composure under pressure and adapt your approach when needed. Continue to nurture these strengths by embracing new challenges and supporting others through change.',
        '76-100': 'Your Adaptability and Resilience Quotient is exceptional. You possess outstanding ability to thrive in changing environments and bounce back from adversity. You view change as an opportunity rather than a threat and demonstrate remarkable emotional strength when facing challenges. Your adaptability and resilience make you a valuable asset in dynamic situations. Continue to leverage these strengths while helping others develop their own resilience and adaptability.'
    };

    return descriptions[percentileRange] || descriptions['26-50'];
}

module.exports = {
    reverseScore,
    calculateAdaptabilityRawScore,
    normalizeAdaptabilityScore,
    calculateResilienceRawScore,
    normalizeResilienceScore,
    calculateCompositeScore,
    getPercentileRange,
    getColorCode,
    getQuartile,
    getPercentileDescription
};
