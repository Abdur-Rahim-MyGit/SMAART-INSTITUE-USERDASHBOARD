/**
 * T1 Baseline Assessment - Stratified Sampling Configuration
 * 
 * This configuration defines the exact distribution of questions required
 * for the T1 Baseline Assessment (UG).
 * 
 * Matrix Dimensions: Quotient x Difficulty
 * Total Questions: 36
 */

const T1_DISTRIBUTION = {
    totalQuestions: 36,
    quotients: {
        'CRQ': { easy: 2, medium: 4, hard: 1 }, // Total: 7
        'SRQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
        'LQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
        'SIQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
        'PEQ': { easy: 2, medium: 4, hard: 1 }, // Total: 7
        'DAQ': { easy: 1, medium: 1, hard: 2 }  // Total: 4
    }
};

module.exports = T1_DISTRIBUTION;
