/**
 * Calculate creativity score from responses
 * @param {Array} responses - Array of response objects with selectedValue (1-5)
 * @returns {Object} - { rawScore, count }
 */
function calculateCreativityRawScore(responses) {
    if (!responses || responses.length === 0) {
        throw new Error('CQ assessment requires responses');
    }

    const sum = responses.reduce((total, response) => {
        const value = Number(response.selectedValue);
        if (isNaN(value)) return total; // Skip invalid values

        // Clamp value between 1 and 5 to be safe
        const clampedValue = Math.max(1, Math.min(5, value));
        return total + clampedValue;
    }, 0);

    return { rawScore: sum, count: responses.length };
}

/**
 * Normalize creativity score to 0-100 scale
 * @param {number} rawScore - Raw creativity score
 * @param {number} questionCount - Number of questions answered
 * @returns {number} - Normalized score (0-100)
 */
function normalizeCreativityScore(rawScore, questionCount) {
    if (questionCount === 0) return 0;

    const minScore = questionCount * 1;
    const maxScore = questionCount * 5;

    if (rawScore < minScore || rawScore > maxScore) {
        console.warn(`Raw score ${rawScore} is out of bounds [${minScore}-${maxScore}]. Clamping.`);
        rawScore = Math.max(minScore, Math.min(maxScore, rawScore));
    }

    // Avoid division by zero if min == max (only possible if max questions is 0, handled above)
    // Formula: ((rawScore - min) / (max - min)) * 100
    const range = maxScore - minScore;
    if (range === 0) return 0; // Should not happen with valid questions

    const normalized = ((rawScore - minScore) / range) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate composite CQ score (average of openness and creativity)
 * @param {number} opennessScore - Openness score from Big Five (0-100)
 * @param {number} creativityScore - Creativity score (0-100)
 * @returns {number} - Composite CQ score (0-100)
 */
function calculateCompositeScore(opennessScore, creativityScore) {
    if (opennessScore < 0 || opennessScore > 100) {
        throw new Error('Openness score must be between 0 and 100');
    }
    if (creativityScore < 0 || creativityScore > 100) {
        throw new Error('Creativity score must be between 0 and 100');
    }

    const composite = (opennessScore + creativityScore) / 2;
    return Math.round(composite * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine percentile range based on composite score
 * @param {number} compositeScore - Composite CQ score (0-100)
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
        '0-25': 'Your Creativity Quotient is in the developing stage. You may prefer structured approaches and familiar methods over innovative thinking. While you value stability and proven solutions, exploring new ideas and embracing creative challenges can help you unlock hidden potential. Consider engaging in activities that push you out of your comfort zone, such as brainstorming sessions, creative hobbies, or learning new skills.',
        '26-50': 'Your Creativity Quotient is in the moderate range. You demonstrate a balanced approach between conventional thinking and creative exploration. You can generate new ideas when needed but may sometimes default to familiar solutions. To enhance your creative abilities, practice divergent thinking exercises, expose yourself to diverse perspectives, and challenge yourself to find multiple solutions to problems.',
        '51-75': 'You have a high Creativity Quotient. You are naturally imaginative and open to new experiences. You excel at generating innovative ideas and thinking outside the box. Your creative thinking helps you solve problems in unique ways and adapt to changing situations. To further develop your creativity, consider leading creative projects, mentoring others in innovative thinking, and exploring interdisciplinary approaches to challenges.',
        '76-100': 'Your Creativity Quotient is exceptional. You possess outstanding creative thinking abilities and a remarkable openness to new ideas. You consistently generate innovative solutions and thrive in ambiguous or complex situations. Your imagination and originality set you apart as a creative leader. Continue to nurture your creativity by tackling challenging problems, collaborating with diverse thinkers, and inspiring others to embrace creative thinking.'
    };

    return descriptions[percentileRange] || descriptions['26-50'];
}

module.exports = {
    calculateCreativityRawScore,
    normalizeCreativityScore,
    calculateCompositeScore,
    getPercentileRange,
    getColorCode,
    getQuartile,
    getPercentileDescription
};
