/**
 * SQ (Sustainability Quotient) Calculation Utilities
 * 
 * Question Structure:
 * - All 20 questions measure sustainability awareness, values, and behaviors
 * - Each response is scored 1-5
 * 
 * Calculation:
 * 1. Sum all 20 responses (raw score: 20-100)
 * 2. Normalize to 0-100 percentage
 * 3. Assign RAGG category based on quartiles
 */

/**
 * Calculate raw score (sum of all 20 responses)
 * @param {Array} responses - Array of 20 response objects
 * @returns {number} - Raw score (20-100)
 */
function calculateRawScore(responses) {
    if (!responses || responses.length !== 20) {
        throw new Error('SQ requires exactly 20 responses');
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
 * Normalize raw score to 0-100 percentage scale
 * @param {number} rawScore - Raw score (20-100)
 * @returns {number} - Normalized SQ percentage (0-100)
 */
function normalizeScore(rawScore) {
    const minScore = 20; // Minimum possible (all 1s)
    const maxScore = 100; // Maximum possible (all 5s)

    if (rawScore < minScore || rawScore > maxScore) {
        throw new Error(`Raw score must be between ${minScore} and ${maxScore}`);
    }

    // Formula: ((rawScore - minScore) / (maxScore - minScore)) * 100
    const normalized = ((rawScore - minScore) / (maxScore - minScore)) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine percentile range based on SQ percentage
 * @param {number} sqPercentage - SQ percentage (0-100)
 * @returns {string} - Percentile range
 */
function getPercentileRange(sqPercentage) {
    if (sqPercentage >= 0 && sqPercentage <= 25) {
        return '0-25';
    } else if (sqPercentage >= 26 && sqPercentage <= 50) {
        return '26-50';
    } else if (sqPercentage >= 51 && sqPercentage <= 75) {
        return '51-75';
    } else if (sqPercentage >= 76 && sqPercentage <= 100) {
        return '76-100';
    }
    throw new Error('SQ percentage must be between 0 and 100');
}

/**
 * Get RAGG category based on percentile range
 * @param {string} percentileRange - Percentile range
 * @returns {string} - RAGG category
 */
function getRAGGCategory(percentileRange) {
    const raggMap = {
        '0-25': 'red',
        '26-50': 'amber',
        '51-75': 'green',
        '76-100': 'super-green'
    };

    return raggMap[percentileRange] || 'amber';
}

/**
 * Get color code based on RAGG category
 * @param {string} raggCategory - RAGG category
 * @returns {string} - Color code
 */
function getColorCode(raggCategory) {
    const colorMap = {
        'red': '#EF4444',
        'amber': '#daa520',
        'green': '#30919D',
        'super-green': '#10B981'
    };

    return colorMap[raggCategory] || '#daa520';
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
        '0-25': 'Your sustainability awareness is in the developing stage. You are beginning to understand the importance of environmental, social, and ethical considerations. Focus on learning about sustainable practices, exploring eco-friendly alternatives in your daily life, and understanding the impact of your choices on the planet and society. This is an excellent starting point for your sustainability journey.',
        '26-50': 'Your sustainability awareness is in the moderate range. You have a basic understanding of sustainability principles and make some conscious choices. To advance further, deepen your knowledge of environmental issues, increase your sustainable behaviors, and explore ways to reduce your ecological footprint. Consider adopting more sustainable habits and encouraging others to do the same.',
        '51-75': 'You have strong sustainability awareness. You understand environmental, social, and ethical issues well and actively make sustainable choices in your daily life. You recognize the importance of conservation and responsible consumption. Continue to stay informed about sustainability developments, share your knowledge with others, and explore advanced sustainable practices. Your strong foundation positions you well to be a sustainability advocate.',
        '76-100': 'Your sustainability awareness is exceptional. You possess comprehensive understanding of environmental, social, and ethical sustainability, demonstrate advanced sustainable behaviors, and show strong commitment to responsible living. You actively contribute to a more sustainable future through your choices and actions. Continue to lead by example, mentor others in sustainability practices, and contribute to creating positive environmental and social impact in your community.'
    };

    return descriptions[percentileRange] || descriptions['26-50'];
}

module.exports = {
    calculateRawScore,
    normalizeScore,
    getPercentileRange,
    getRAGGCategory,
    getColorCode,
    getQuartile,
    getPercentileDescription
};
