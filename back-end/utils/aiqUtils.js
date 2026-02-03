/**
 * AIQ (Artificial Intelligence Quotient) Calculation Utilities
 * 
 * Question Structure:
 * - Questions 0-3 (4 questions): A1 - AI Knowledge
 * - Questions 4-7 (4 questions): A2 - AI Use & Skills
 * - Questions 8-11 (4 questions): A3 - AI Critical Thinking
 * - Questions 12-15 (4 questions): A4 - AI Ethics
 * - Questions 16-19 (4 questions): A5 - AI Self-Efficacy
 * 
 * Total: 20 questions, each scored 1-5
 */

/**
 * Calculate raw score for a subscore (sum of responses)
 * @param {Array} responses - Array of response objects for this subscore
 * @returns {number} - Raw score (sum of responses)
 */
function calculateSubscoreRawScore(responses) {
    if (!responses || responses.length === 0) {
        throw new Error('Responses array is required and cannot be empty');
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
 * Normalize subscore to 0-100 percentage scale
 * @param {number} rawScore - Raw subscore (sum of responses)
 * @param {number} numQuestions - Number of questions in this subscore
 * @returns {number} - Normalized score (0-100)
 */
function normalizeSubscoreToPercentage(rawScore, numQuestions) {
    const minScore = numQuestions; // Minimum possible (all 1s)
    const maxScore = numQuestions * 5; // Maximum possible (all 5s)

    if (rawScore < minScore || rawScore > maxScore) {
        throw new Error(`Raw score must be between ${minScore} and ${maxScore}`);
    }

    // Formula: ((rawScore - minScore) / (maxScore - minScore)) * 100
    const normalized = ((rawScore - minScore) / (maxScore - minScore)) * 100;
    return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate mean score across all 5 competency areas
 * @param {Object} subscores - Object containing all 5 subscore percentages
 * @returns {number} - Mean score (0-100)
 */
function calculateMeanScore(subscores) {
    const { a1, a2, a3, a4, a5 } = subscores;

    // Validate all subscores are present and valid
    const scores = [a1, a2, a3, a4, a5];
    scores.forEach((score, index) => {
        if (score === undefined || score === null) {
            throw new Error(`Subscore A${index + 1} is missing`);
        }
        if (score < 0 || score > 100) {
            throw new Error(`Subscore A${index + 1} must be between 0 and 100`);
        }
    });

    const mean = (a1 + a2 + a3 + a4 + a5) / 5;
    return Math.round(mean * 100) / 100; // Round to 2 decimal places
}

/**
 * Normalize mean score to AIQ percentage (already 0-100, but kept for consistency)
 * @param {number} meanScore - Mean score (0-100)
 * @returns {number} - AIQ percentage (0-100)
 */
function normalizeToAIQPercentage(meanScore) {
    if (meanScore < 0 || meanScore > 100) {
        throw new Error('Mean score must be between 0 and 100');
    }
    return Math.round(meanScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine percentile range based on AIQ percentage
 * @param {number} aiqPercentage - AIQ percentage (0-100)
 * @returns {string} - Percentile range
 */
function getPercentileRange(aiqPercentage) {
    if (aiqPercentage >= 0 && aiqPercentage <= 25) {
        return '0-25';
    } else if (aiqPercentage >= 26 && aiqPercentage <= 50) {
        return '26-50';
    } else if (aiqPercentage >= 51 && aiqPercentage <= 75) {
        return '51-75';
    } else if (aiqPercentage >= 76 && aiqPercentage <= 100) {
        return '76-100';
    }
    throw new Error('AIQ percentage must be between 0 and 100');
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
        '0-25': 'Your AI literacy is in the developing stage. You are beginning to understand AI concepts and their applications. Focus on building foundational knowledge about AI technologies, their capabilities, and limitations. Engage with introductory AI courses, explore AI tools in your daily work, and stay curious about emerging AI developments. This is an excellent starting point for your AI learning journey.',
        '26-50': 'Your AI literacy is in the moderate range. You have a basic understanding of AI concepts and can use some AI tools effectively. To advance further, deepen your knowledge of AI ethics, explore more advanced AI applications in your field, and practice critical thinking about AI\'s societal impacts. Consider taking intermediate AI courses and experimenting with different AI platforms to broaden your practical experience.',
        '51-75': 'You have strong AI literacy. You understand AI concepts well, use AI tools confidently, and think critically about AI\'s implications. You recognize ethical considerations and can evaluate AI applications effectively. Continue to stay updated with AI advancements, share your knowledge with others, and explore specialized AI applications in your domain. Your strong foundation positions you well to leverage AI for innovation.',
        '76-100': 'Your AI literacy is exceptional. You possess comprehensive understanding of AI technologies, demonstrate advanced skills in using AI tools, think critically about AI\'s societal impacts, and have strong ethical awareness. You show high confidence in working with AI systems. Continue to lead by example, mentor others in AI literacy, and contribute to responsible AI adoption in your organization and community.'
    };

    return descriptions[percentileRange] || descriptions['26-50'];
}

/**
 * Get competency area name
 * @param {string} competencyCode - Competency code (a1-a5)
 * @returns {string} - Competency name
 */
function getCompetencyName(competencyCode) {
    const nameMap = {
        'a1': 'AI Knowledge',
        'a2': 'AI Use & Skills',
        'a3': 'AI Critical Thinking',
        'a4': 'AI Ethics',
        'a5': 'AI Self-Efficacy'
    };

    return nameMap[competencyCode] || competencyCode;
}

module.exports = {
    calculateSubscoreRawScore,
    normalizeSubscoreToPercentage,
    calculateMeanScore,
    normalizeToAIQPercentage,
    getPercentileRange,
    getRAGGCategory,
    getColorCode,
    getQuartile,
    getPercentileDescription,
    getCompetencyName
};
