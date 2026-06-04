/**
 * Stage Assessment Distribution Configurations
 * 
 * Defines the exact question distribution for each assessment stage (T1-T4).
 * Each stage has a specific number of questions distributed across quotients and difficulty levels.
 * 
 * Stages:
 *   T1 - Baseline: 36 questions
 *   T2 - Capacity: 34 questions
 *   T3 - Capability: 36 questions
 *   T4 - Leadership: 34 questions
 */

const STAGE_DISTRIBUTIONS = {
    T1: {
        code: 'ASM00001',
        name: 'Baseline',
        totalQuestions: 36,
        quotients: {
            'CRQ': { easy: 2, medium: 4, hard: 1 }, // Total: 7
            'SRQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'LQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'SIQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'PEQ': { easy: 2, medium: 4, hard: 1 }, // Total: 7
            'DAQ': { easy: 1, medium: 1, hard: 2 }  // Total: 4
        },
        // Weighted formula: simple average of quotient percentages
        weightedFormula: (quotientScores) => {
            let sum = 0, count = 0;
            for (const [, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    sum += Math.round((data.earned / data.possible) * 100);
                    count++;
                }
            }
            return count > 0 ? Math.round(sum / count) : 0;
        }
    },
    T2: {
        code: 'ASM00002',
        name: 'Capacity',
        totalQuestions: 34,
        quotients: {
            'CRQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'SRQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'LQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'SIQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'PEQ': { easy: 2, medium: 3, hard: 2 }, // Total: 7
            'DAQ': { easy: 1, medium: 2, hard: 1 }  // Total: 4
        },
        // T2 Capacity: Weighted with more emphasis on PEQ and CRQ
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.20, SRQ: 0.15, LQ: 0.15, SIQ: 0.15, PEQ: 0.20, DAQ: 0.15 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 6);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    },
    T3: {
        code: 'ASM00003',
        name: 'Capability',
        totalQuestions: 36,
        quotients: {
            'CRQ': { easy: 2, medium: 3, hard: 2 }, // Total: 7
            'SRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'LQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'SIQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'PEQ': { easy: 2, medium: 3, hard: 2 }, // Total: 7
            'DAQ': { easy: 1, medium: 2, hard: 1 }  // Total: 4
        },
        // T3 Capability: Emphasis on cognitive and professional skills
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.20, SRQ: 0.15, LQ: 0.15, SIQ: 0.15, PEQ: 0.20, DAQ: 0.15 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 6);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    },
    T4: {
        code: 'ASM00004',
        name: 'Leadership',
        totalQuestions: 34,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'SRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'LQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'PEQ': { easy: 1, medium: 3, hard: 3 }, // Total: 7
            'DAQ': { easy: 1, medium: 2, hard: 1 }  // Total: 4
        },
        // T4 Leadership: Higher weight on SIQ and CRQ for leadership roles
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.20, SRQ: 0.15, LQ: 0.10, SIQ: 0.25, PEQ: 0.15, DAQ: 0.15 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 6);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    },
    AIQ: {
        code: 'ASM00005',
        name: 'AIQ',
        totalQuestions: 36,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'SRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'LQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'PEQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'DAQ': { easy: 2, medium: 4, hard: 3 }  // Total: 9
        },
        // AIQ Assessment: Higher weight on DAQ (Digital & AI Literacy)
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.15, SRQ: 0.10, LQ: 0.15, SIQ: 0.10, PEQ: 0.15, DAQ: 0.35 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 6);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    }
};

// Helper to get stage config by assessment code
const getStageByCode = (code) => {
    for (const [stage, config] of Object.entries(STAGE_DISTRIBUTIONS)) {
        if (config.code === code) return { stage, ...config };
    }
    return null;
};

// Helper to get stage config by stage key
const getStageConfig = (stageKey) => {
    const key = stageKey.toUpperCase();
    return STAGE_DISTRIBUTIONS[key] || null;
};

module.exports = { STAGE_DISTRIBUTIONS, getStageByCode, getStageConfig };
