/**
 * Stage Assessment Distribution Configurations
 * 
 * Defines the exact question distribution for each assessment stage (T1-T4+).
 * Each stage has a specific number of questions distributed across quotients and difficulty levels.
 * 
 * Quotients: CRQ, SRQ, LQ, SIQ, PEQ, DAQ, SEQ
 * Difficulty: easy (L1), medium (L2), hard (L3)
 * 
 * Stages:
 *   T1 - Baseline: 36 questions (no retry)
 *   T2 - Capacity: 34 questions (3 attempts, 70% pass)
 *   T3 - Capability: 36 questions (3 attempts, 70% pass)
 *   T4 - Leadership: 34 questions (3 attempts, 70% pass)
 *   AIQ - AI Quotient: 36 questions (3 attempts, 70% pass)
 *   SQ  - Social Quotient: 36 questions (3 attempts, 70% pass)
 *   PIQ - Personal Intelligence: 36 questions (3 attempts, 70% pass)
 */

const STAGE_DISTRIBUTIONS = {
    T1: {
        code: 'ASM00001',
        name: 'Baseline',
        totalQuestions: 36,
        passingPercentage: 0, // T1 is a baseline, no pass/fail
        maxAttempts: 1, // Baseline is one-time
        quotients: {
            'CRQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'SRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'LQ':  { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'PEQ': { easy: 2, medium: 3, hard: 1 }, // Total: 6
            'DAQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SEQ': { easy: 1, medium: 3, hard: 1 }  // Total: 5
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
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'LQ':  { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'PEQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'DAQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SEQ': { easy: 1, medium: 3, hard: 1 }  // Total: 5
        },
        // T2 Capacity: Weighted with more emphasis on PEQ and CRQ
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.18, SRQ: 0.13, LQ: 0.13, SIQ: 0.13, PEQ: 0.18, DAQ: 0.12, SEQ: 0.13 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
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
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'SRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'LQ':  { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'PEQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'DAQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SEQ': { easy: 1, medium: 3, hard: 1 }  // Total: 5
        },
        // T3 Capability: Emphasis on cognitive and professional skills
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.18, SRQ: 0.13, LQ: 0.13, SIQ: 0.13, PEQ: 0.18, DAQ: 0.12, SEQ: 0.13 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
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
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SRQ': { easy: 1, medium: 2, hard: 2 }, // Total: 5
            'LQ':  { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SIQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'PEQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'DAQ': { easy: 1, medium: 1, hard: 1 }, // Total: 3
            'SEQ': { easy: 1, medium: 3, hard: 1 }  // Total: 5
        },
        // T4 Leadership: Higher weight on SIQ and CRQ for leadership roles
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.17, SRQ: 0.13, LQ: 0.10, SIQ: 0.22, PEQ: 0.13, DAQ: 0.12, SEQ: 0.13 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
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
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SRQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'LQ':  { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SIQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'PEQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'DAQ': { easy: 2, medium: 4, hard: 3 }, // Total: 9
            'SEQ': { easy: 1, medium: 3, hard: 1 }  // Total: 5
        },
        // AIQ Assessment: Higher weight on DAQ (Digital & AI Literacy)
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.12, SRQ: 0.10, LQ: 0.12, SIQ: 0.10, PEQ: 0.12, DAQ: 0.32, SEQ: 0.12 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    },
    SQ: {
        code: 'ASM00006',
        name: 'SQ',
        totalQuestions: 36,
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'LQ':  { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SIQ': { easy: 2, medium: 3, hard: 2 }, // Total: 7
            'PEQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'DAQ': { easy: 1, medium: 1, hard: 1 }, // Total: 3
            'SEQ': { easy: 2, medium: 4, hard: 2 }  // Total: 8
        },
        // SQ Assessment: Higher weight on SIQ, SEQ, SRQ
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.10, SRQ: 0.15, LQ: 0.10, SIQ: 0.25, PEQ: 0.10, DAQ: 0.08, SEQ: 0.22 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
                    weightedSum += pct * w;
                    totalWeight += w;
                }
            }
            return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
        }
    },
    PIQ: {
        code: 'ASM00007',
        name: 'PIQ',
        totalQuestions: 36,
        passingPercentage: 70,
        maxAttempts: 3,
        quotients: {
            'CRQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SRQ': { easy: 1, medium: 3, hard: 2 }, // Total: 6
            'LQ':  { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'SIQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'PEQ': { easy: 1, medium: 3, hard: 1 }, // Total: 5
            'DAQ': { easy: 1, medium: 2, hard: 1 }, // Total: 4
            'SEQ': { easy: 1, medium: 3, hard: 2 }  // Total: 6
        },
        // PIQ Assessment: Balanced with slight emphasis on SRQ and SEQ
        weightedFormula: (quotientScores) => {
            const weights = { CRQ: 0.13, SRQ: 0.17, LQ: 0.13, SIQ: 0.13, PEQ: 0.13, DAQ: 0.12, SEQ: 0.19 };
            let weightedSum = 0, totalWeight = 0;
            for (const [key, data] of Object.entries(quotientScores)) {
                if (data.possible > 0) {
                    const pct = Math.round((data.earned / data.possible) * 100);
                    const w = weights[key] || (1 / 7);
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
