/**
 * Calculate raw EQ score from responses
 * @param {Array} responses - Array of response objects with selectedValue (1-5)
 * @returns {number} - Raw score (sum of all responses, 16-80)
 */
function calculateRawScore(responses) {
    if (!responses || responses.length !== 16) {
        throw new Error('EQ assessment requires exactly 16 responses');
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
 * Normalize raw score to 0-100 scale
 * @param {number} rawScore - Raw score (16-80)
 * @returns {number} - Normalized score (0-100)
 */
function normalizeScore(rawScore) {
    if (rawScore < 16 || rawScore > 80) {
        throw new Error('Raw score must be between 16 and 80');
    }

    // Formula: ((rawScore - 16) / (80 - 16)) * 100
    const normalized = ((rawScore - 16) / 64) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine percentile range based on normalized score
 * @param {number} normalizedScore - Normalized score (0-100)
 * @returns {string} - Percentile range
 */
function getPercentileRange(normalizedScore) {
    if (normalizedScore >= 0 && normalizedScore <= 25) {
        return '0-25';
    } else if (normalizedScore >= 26 && normalizedScore <= 50) {
        return '26-50';
    } else if (normalizedScore >= 51 && normalizedScore <= 75) {
        return '51-75';
    } else if (normalizedScore >= 76 && normalizedScore <= 100) {
        return '76-100';
    }
    throw new Error('Normalized score must be between 0 and 100');
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
        '76-100': 'dark-green'
    };

    return colorMap[percentileRange] || 'amber';
}

/**
 * Get hex color value based on color code
 * @param {string} colorCode - Color code
 * @returns {string} - Hex color value
 */
function getHexColor(colorCode) {
    const hexMap = {
        'red': '#EF4444',
        'amber': '#F59E0B',
        'green': '#10B981',
        'dark-green': '#059669'
    };

    return hexMap[colorCode] || '#F59E0B';
}

/**
 * Get description based on percentile range
 * @param {string} percentileRange - Percentile range
 * @returns {string} - Description
 */
function getPercentileDescription(percentileRange) {
    const descriptions = {
        '0-25': 'Your score indicates that your emotional intelligence is currently in the developing stage. You may find it challenging to identify and manage your own emotions or understand the emotions of others. This can sometimes lead to misunderstandings or difficulty in stressful situations. However, emotional intelligence is a skill that can be improved with practice. Focusing on self-awareness and active listening can be great first steps.',
        '26-50': 'Your score places you in the moderate range of emotional intelligence. You generally have a good grasp of your own emotions and can empathize with others in many situations. However, you might struggle with emotional regulation during high-stress moments or find complex social dynamics confusing at times. Developing strategies for stress management and deepening your empathy can help you move to the next level.',
        '51-75': 'You have a high level of emotional intelligence. You are likely very self-aware and good at managing your emotions, even under pressure. You can easily tune into the feelings of others, making you a supportive friend and effective collaborator. To further enhance your EQ, consider how you can use your skills to influence and inspire others more effectively.',
        '76-100': 'Your score indicates an excellent level of emotional intelligence. You possess exceptional self-awareness and emotional regulation skills. You have a deep understanding of others\' emotions and can navigate complex social situations with grace. You likely excel in leadership roles and conflict resolution. Your challenge now is to maintain this high level and perhaps mentor others in developing their emotional intelligence.'
    };

    return descriptions[percentileRange] || descriptions['26-50'];
}

module.exports = {
    calculateRawScore,
    normalizeScore,
    getPercentileRange,
    getColorCode,
    getHexColor,
    getPercentileDescription
};
