// VAK Learning Style Descriptions
const learningStyleDescriptions = {
    'Visual': 'You are a Visual Learner! You learn best through seeing and visualizing information. You prefer diagrams, charts, images, and written instructions. Taking notes, using color coding, and watching demonstrations help you understand and remember information effectively.',

    'Auditory': 'You are an Auditory Learner! You learn best through listening and speaking. You prefer lectures, discussions, and verbal explanations. Reading aloud, participating in group discussions, and using audio recordings help you process and retain information most effectively.',

    'Kinesthetic': 'You are a Kinesthetic Learner! You learn best through hands-on experiences and physical activities. You prefer doing, touching, and moving while learning. Practical exercises, experiments, role-playing, and taking breaks to move around help you understand and remember information best.',

    'Bimodal (VA)': 'You are a Visual-Auditory Learner! You learn effectively through both seeing and hearing. You benefit from combining visual aids like diagrams and charts with verbal explanations and discussions. Using multimedia resources and explaining concepts aloud while reviewing visual materials works well for you.',

    'Bimodal (AK)': 'You are an Auditory-Kinesthetic Learner! You learn best through listening and doing. You benefit from verbal instructions combined with hands-on practice. Discussing concepts while performing activities and using audio guides during practical exercises helps you learn most effectively.',

    'Bimodal (VK)': 'You are a Visual-Kinesthetic Learner! You learn best through seeing and doing. You benefit from visual demonstrations combined with hands-on practice. Watching videos or demonstrations and then practicing the skills yourself helps you understand and remember information effectively.',

    'Trimodal (VAK)': 'You are a Trimodal Learner! You learn equally well through visual, auditory, and kinesthetic methods. You have a flexible learning style and can adapt to various teaching methods. Using a combination of reading, listening, and hands-on practice provides you with the most comprehensive learning experience.',

    'Mixed': 'You have a Mixed Learning Style! Your learning preferences don\'t follow a single strong pattern. You may benefit from experimenting with different learning methods to find what works best for specific subjects or situations. Combining various approaches - visual, auditory, and kinesthetic - can help you discover your most effective learning strategies.'
};

/**
 * Calculate VAK learning style based on answer counts
 * @param {number} visualCount - Count of 'A' answers (Visual)
 * @param {number} auditoryCount - Count of 'B' answers (Auditory)
 * @param {number} kinestheticCount - Count of 'C' answers (Kinesthetic)
 * @returns {Object} - { style: string, description: string }
 */
function calculateVAKStyle(visualCount, auditoryCount, kinestheticCount) {
    const V = visualCount;
    const A = auditoryCount;
    const K = kinestheticCount;

    let style;

    // Single Learning Style - one score is at least 3 points higher than both others
    if (V >= A + 3 && V >= K + 3) {
        style = 'Visual';
    } else if (A >= V + 3 && A >= K + 3) {
        style = 'Auditory';
    } else if (K >= V + 3 && K >= A + 3) {
        style = 'Kinesthetic';
    }
    // Bimodal Learning Styles - two scores are close (diff <= 2) and both are at least 3 higher than the third
    else if (Math.abs(V - A) <= 2 && V >= K + 3 && A >= K + 3) {
        style = 'Bimodal (VA)';
    } else if (Math.abs(A - K) <= 2 && A >= V + 3 && K >= V + 3) {
        style = 'Bimodal (AK)';
    } else if (Math.abs(V - K) <= 2 && V >= A + 3 && K >= A + 3) {
        style = 'Bimodal (VK)';
    }
    // Trimodal - all three scores are close (max - min <= 2)
    else if (Math.max(V, A, K) - Math.min(V, A, K) <= 2) {
        style = 'Trimodal (VAK)';
    }
    // Mixed - doesn't fit any clear pattern
    else {
        style = 'Mixed';
    }

    return {
        style,
        description: learningStyleDescriptions[style]
    };
}

/**
 * Count VAK answers from responses array
 * @param {Array} responses - Array of response objects with selectedValue
 * @returns {Object} - { visual: number, auditory: number, kinesthetic: number }
 */
function countVAKAnswers(responses) {
    const counts = {
        visual: 0,      // A answers
        auditory: 0,    // B answers
        kinesthetic: 0  // C answers
    };

    responses.forEach(response => {
        const value = response.selectedValue;
        if (value === 'A') counts.visual++;
        else if (value === 'B') counts.auditory++;
        else if (value === 'C') counts.kinesthetic++;
    });

    return counts;
}

module.exports = {
    calculateVAKStyle,
    countVAKAnswers,
    learningStyleDescriptions
};
